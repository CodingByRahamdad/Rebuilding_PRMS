const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
  ? `${import.meta.env.VITE_API_BASE_URL}/api/v1`
  : '/api/v1';

export class ApiClient {
  private static token: string | null = localStorage.getItem('prms_auth_token');
  private static isRefreshing = false;
  private static refreshSubscribers: ((token: string | null) => void)[] = [];

  public static setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('prms_auth_token', token);
    } else {
      localStorage.removeItem('prms_auth_token');
    }
  }

  public static getToken(): string | null {
    return this.token;
  }

  private static onRefreshed(token: string | null) {
    this.refreshSubscribers.forEach((cb) => cb(token));
    this.refreshSubscribers = [];
  }

  private static async refreshTokenInternal(): Promise<{ success: boolean; accessToken?: string; message?: string }> {
    if (this.isRefreshing) {
      return new Promise((resolve) => {
        this.refreshSubscribers.push((newToken) => {
          if (newToken) {
            resolve({ success: true, accessToken: newToken });
          } else {
            resolve({ success: false, message: 'Token refresh failed' });
          }
        });
      });
    }

    this.isRefreshing = true;
    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({}),
      });

      const json = await response.json();
      if (response.ok && json.success && json.data?.accessToken) {
        const newAccessToken = json.data.accessToken;
        this.setToken(newAccessToken);
        this.onRefreshed(newAccessToken);
        return { success: true, accessToken: newAccessToken };
      } else {
        this.setToken(null);
        this.onRefreshed(null);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('prms_auth_expired'));
        }
        return { success: false, message: json.message || 'Session expired. Please log in again.' };
      }
    } catch (err: any) {
      this.setToken(null);
      this.onRefreshed(null);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('prms_auth_expired'));
      }
      return { success: false, message: err.message || 'Failed to refresh authentication session.' };
    } finally {
      this.isRefreshing = false;
    }
  }

  private static async request<T = any>(
    endpoint: string,
    options: RequestInit = {},
    isRetry = false
  ): Promise<{ success: boolean; message: string; data?: T; meta?: any }> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        credentials: 'include',
        ...options,
        headers,
      });

      if (response.status === 401) {
        // Automatic transparent token refresh on access token expiration
        const isAuthFlowEndpoint =
          endpoint.startsWith('/auth/login') ||
          endpoint.startsWith('/auth/refresh-token') ||
          endpoint.startsWith('/auth/logout');

        if (!isRetry && !isAuthFlowEndpoint && this.token) {
          const refreshRes = await this.refreshTokenInternal();
          if (refreshRes.success && refreshRes.accessToken) {
            return this.request<T>(endpoint, options, true);
          }
        }

        // Token expired or invalid and cannot be refreshed
        if (!isAuthFlowEndpoint) {
          this.setToken(null);
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('prms_auth_expired'));
          }
        }
      }

      const json = await response.json();
      if (!response.ok) {
        return {
          success: false,
          message: json.message || `HTTP error ${response.status}`,
        };
      }

      return json;
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Network error connecting to PRMS API server.',
      };
    }
  }

  // 1. Health & Server Status
  public static async checkHealth() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      
      // Probe /api/health directly (fastest, unthrottled)
      const res1 = await fetch('/api/health', { signal: controller.signal });
      clearTimeout(timeoutId);
      if (res1.ok) {
        const json = await res1.json();
        return { success: true, data: json.data || json };
      }
    } catch {
      // ignore and try v1 route
    }

    try {
      const res = await this.request<{ status: string; dbState?: string; uptime?: number }>('/health');
      if (res && res.success) {
        return res;
      }
      return { success: true, data: { status: 'UP', service: 'PRMS API' } };
    } catch {
      return { success: false, message: 'Server unreachable' };
    }
  }

  public static async getConfig() {
    return this.request<{ enableDemoMode: boolean }>('/config');
  }

  // 2. Auth API
  public static async login(email: string, password: string, role?: string) {
    const res = await this.request<{ user: any; accessToken: string; refreshToken?: string }>(
      '/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({ email, password, role }),
      }
    );
    if (res.success && res.data?.accessToken) {
      this.setToken(res.data.accessToken);
    }
    return res;
  }

  public static async refreshToken() {
    return this.refreshTokenInternal();
  }

  public static async logout() {
    try {
      await this.request('/auth/logout', {
        method: 'POST',
      });
    } catch {
      // Continue cleanup on network error
    } finally {
      this.setToken(null);
    }
  }

  public static async getProfile() {
    return this.request('/auth/me');
  }

  public static async forgotPassword(email: string) {
    return this.request<{ message: string; resetToken?: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  public static async resetPassword(payload: { email: string; token: string; newPassword: string }) {
    return this.request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  private static patientsCache: Map<string, { timestamp: number; data: any }> = new Map();
  private static doctorsCache: Map<string, { timestamp: number; data: any }> = new Map();
  private static CACHE_TTL_MS = 60000; // 60 seconds

  public static clearPatientsCache() {
    this.patientsCache.clear();
  }

  public static clearDoctorsCache() {
    this.doctorsCache.clear();
  }

  // 3. Patients API
  public static async getPatients(query?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    gender?: string;
    bloodGroup?: string;
  }, forceRefresh = false) {
    const params = new URLSearchParams();
    if (query) {
      if (query.page !== undefined && query.page !== null) params.append('page', String(query.page));
      if (query.limit !== undefined && query.limit !== null) params.append('limit', String(query.limit));
      if (query.search && query.search.trim()) params.append('search', query.search.trim());
      if (query.status && query.status !== 'All') params.append('status', query.status);
      if (query.gender) params.append('gender', query.gender);
      if (query.bloodGroup) params.append('bloodGroup', query.bloodGroup);
    }
    const queryStr = params.toString() ? `?${params.toString()}` : '';
    const cacheKey = `/patients${queryStr}`;

    if (!forceRefresh) {
      const cached = this.patientsCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS) {
        return cached.data;
      }
    }

    const res = await this.request<any[]>(`/patients${queryStr}`);
    if (res.success) {
      this.patientsCache.set(cacheKey, { timestamp: Date.now(), data: res });
    }
    return res;
  }

  public static async createPatient(data: any) {
    const res = await this.request('/patients', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (res.success) {
      this.clearPatientsCache();
    }
    return res;
  }

  public static async updatePatient(id: string, data: any) {
    const res = await this.request(`/patients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    if (res.success) {
      this.clearPatientsCache();
    }
    return res;
  }

  public static async deletePatient(id: string) {
    const res = await this.request(`/patients/${id}`, {
      method: 'DELETE',
    });
    if (res.success) {
      this.clearPatientsCache();
    }
    return res;
  }

  // 4. Doctors API
  public static async getDoctors(query?: Record<string, any>, forceRefresh = false) {
    const queryStr = query ? '?' + new URLSearchParams(query).toString() : '';
    const cacheKey = `/doctors${queryStr}`;

    if (!forceRefresh) {
      const cached = this.doctorsCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS) {
        return cached.data;
      }
    }

    const res = await this.request<any[]>(`/doctors${queryStr}`);
    if (res.success) {
      this.doctorsCache.set(cacheKey, { timestamp: Date.now(), data: res });
    }
    return res;
  }

  public static async createDoctor(data: any) {
    const res = await this.request('/doctors', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (res.success) {
      this.clearDoctorsCache();
    }
    return res;
  }

  public static async updateDoctor(id: string, data: any) {
    const res = await this.request(`/doctors/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    if (res.success) {
      this.clearDoctorsCache();
    }
    return res;
  }

  public static async deleteDoctor(id: string) {
    const res = await this.request(`/doctors/${id}`, {
      method: 'DELETE',
    });
    if (res.success) {
      this.clearDoctorsCache();
    }
    return res;
  }

  // 5. Nurses API
  public static async getNurses(query?: Record<string, any>) {
    const queryStr = query ? '?' + new URLSearchParams(query).toString() : '';
    return this.request<any[]>(`/nurses${queryStr}`);
  }

  public static async createNurse(data: any) {
    return this.request('/nurses', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  public static async updateNurse(id: string, data: any) {
    return this.request(`/nurses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  public static async deleteNurse(id: string) {
    return this.request(`/nurses/${id}`, {
      method: 'DELETE',
    });
  }

  // 6. Receptionists API
  public static async getReceptionists(query?: Record<string, any>) {
    const queryStr = query ? '?' + new URLSearchParams(query).toString() : '';
    return this.request<any[]>(`/receptionists${queryStr}`);
  }

  public static async createReceptionist(data: any) {
    return this.request('/receptionists', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  public static async updateReceptionist(id: string, data: any) {
    return this.request(`/receptionists/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  public static async deleteReceptionist(id: string) {
    return this.request(`/receptionists/${id}`, {
      method: 'DELETE',
    });
  }

  // 7. Appointments API
  public static async getAppointments(query?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    department?: string;
    date?: string;
    type?: string;
    patientId?: string;
    doctorId?: string;
  }) {
    const params = new URLSearchParams();
    if (query) {
      if (query.page !== undefined && query.page !== null) params.append('page', String(query.page));
      if (query.limit !== undefined && query.limit !== null) params.append('limit', String(query.limit));
      if (query.search && query.search.trim()) params.append('search', query.search.trim());
      if (query.status && query.status !== 'All') params.append('status', query.status);
      if (query.department && query.department !== 'All') params.append('department', query.department);
      if (query.date) params.append('date', query.date);
      if (query.type && query.type !== 'All') params.append('type', query.type);
      if (query.patientId) params.append('patientId', query.patientId);
      if (query.doctorId) params.append('doctorId', query.doctorId);
    }
    const queryStr = params.toString() ? `?${params.toString()}` : '';
    return this.request<any[]>(`/appointments${queryStr}`);
  }

  public static async createAppointment(data: any) {
    return this.request('/appointments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  public static async updateAppointment(id: string, data: any) {
    return this.request(`/appointments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  public static async deleteAppointment(id: string) {
    return this.request(`/appointments/${id}`, {
      method: 'DELETE',
    });
  }

  // 8. Medical Records API
  public static async getMedicalRecords(query?: {
    page?: number;
    limit?: number;
    search?: string;
    patientId?: string;
    doctorId?: string;
    category?: string;
    status?: string;
  }) {
    const params = new URLSearchParams();
    if (query) {
      if (query.page !== undefined && query.page !== null) params.append('page', String(query.page));
      if (query.limit !== undefined && query.limit !== null) params.append('limit', String(query.limit));
      if (query.search && query.search.trim()) params.append('search', query.search.trim());
      if (query.patientId) params.append('patientId', query.patientId);
      if (query.doctorId) params.append('doctorId', query.doctorId);
      if (query.category && query.category !== 'All') params.append('category', query.category);
      if (query.status && query.status !== 'All') params.append('status', query.status);
    }
    const queryStr = params.toString() ? `?${params.toString()}` : '';
    return this.request<any[]>(`/medical-records${queryStr}`);
  }

  public static async createMedicalRecord(data: any) {
    return this.request('/medical-records', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  public static async updateMedicalRecord(id: string, data: any) {
    return this.request(`/medical-records/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  public static async deleteMedicalRecord(id: string) {
    return this.request(`/medical-records/${id}`, {
      method: 'DELETE',
    });
  }

  // 9. Payments API
  public static async getPayments(query?: Record<string, any>) {
    const queryStr = query ? '?' + new URLSearchParams(query).toString() : '';
    return this.request<any[]>(`/payments${queryStr}`);
  }

  public static async createPayment(data: any) {
    return this.request('/payments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  public static async updatePayment(id: string, data: any) {
    return this.request(`/payments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  public static async deletePayment(id: string) {
    return this.request(`/payments/${id}`, {
      method: 'DELETE',
    });
  }

  // 10. Services API
  public static async getServices(query?: Record<string, any>) {
    const queryStr = query ? '?' + new URLSearchParams(query).toString() : '';
    return this.request<any[]>(`/services${queryStr}`);
  }

  public static async createService(data: any) {
    return this.request('/services', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  public static async updateService(id: string, data: any) {
    return this.request(`/services/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  public static async deleteService(id: string) {
    return this.request(`/services/${id}`, {
      method: 'DELETE',
    });
  }

  // 11. Auth & Profile API
  public static async register(userData: any) {
    return this.request<{ token: string; user: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  public static async updateProfile(data: any) {
    return this.request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // 12. Analytics API
  public static async getDashboardStats(timeRange?: string) {
    const queryStr = timeRange ? `?timeRange=${timeRange}` : '';
    return this.request<{ overview: any; recentLogs: any[] }>(`/analytics/dashboard${queryStr}`);
  }

  public static async getActivityLogs(query?: { page?: number; limit?: number; search?: string; user?: string }) {
    const params = new URLSearchParams();
    if (query) {
      if (query.page !== undefined && query.page !== null) params.append('page', String(query.page));
      if (query.limit !== undefined && query.limit !== null) params.append('limit', String(query.limit));
      if (query.search && query.search.trim()) params.append('search', query.search.trim());
      if (query.user) params.append('user', query.user);
    }
    const queryStr = params.toString() ? `?${params.toString()}` : '';
    return this.request<any[]>(`/analytics/activity-logs${queryStr}`);
  }
}
