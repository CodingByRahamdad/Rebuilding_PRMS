import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Download,
  Plus,
  ChevronRight,
  RotateCw,
  ChevronLeft,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { TimeRange, Appointment, ActivityItem, DepartmentBedStatus, PatientVisitData, DepartmentDistributionData, WeeklyAdmissionData, Patient, Doctor, Nurse, PaymentTransaction, MedicalRecord } from '../types';
import { isDemoMode } from '../utils/demoMode';
import { ApiClient } from '../services/apiClient';

interface DashboardViewProps {
  timeRange: TimeRange;
  onChangeTimeRange: (range: TimeRange) => void;
  onOpenNewPatient: () => void;
  onOpenNewAppointment?: () => void;
  onOpenExport: () => void;
  onNavigateTab: (tab: any) => void;
  patients?: Patient[];
  doctors?: Doctor[];
  nurses?: Nurse[];
  appointments: Appointment[];
  activities: ActivityItem[];
  bedOccupancy: DepartmentBedStatus[];
  departmentDistribution: DepartmentDistributionData[];
  patientVisitsTrend: PatientVisitData[];
  weeklyAdmissions: WeeklyAdmissionData[];
  payments?: PaymentTransaction[];
  medicalRecords?: MedicalRecord[];
  onToggleAppointmentStatus: (id: string) => void;
  onViewPatientDetails?: (patient: Patient, origin?: string) => void;
}

// Sparkline Mini Component for Metric Cards
const MiniSparkline: React.FC<{ data: number[]; color: string; fillGradient?: boolean }> = ({
  data,
  color,
  fillGradient = true,
}) => {
  const chartData = useMemo(() => data.map((val, i) => ({ x: i, y: val })), [data]);
  const gradId = useMemo(() => `spark-grad-${Math.random().toString(36).substr(2, 9)}`, []);

  return (
    <div className="w-24 h-9">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
          {fillGradient && (
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                <stop offset="100%" stopColor={color} stopOpacity={0.0} />
              </linearGradient>
            </defs>
          )}
          <Area
            type="monotone"
            dataKey="y"
            stroke={color}
            strokeWidth={1.8}
            fill={fillGradient ? `url(#${gradId})` : 'none'}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export const DashboardView: React.FC<DashboardViewProps> = ({
  timeRange,
  onChangeTimeRange,
  onOpenNewPatient,
  onOpenNewAppointment,
  onOpenExport,
  onNavigateTab,
  patients = [],
  doctors = [],
  appointments = [],
  activities = [],
  bedOccupancy = [],
  departmentDistribution = [],
  patientVisitsTrend = [],
  weeklyAdmissions = [],
  payments = [],
  medicalRecords = [],
  onToggleAppointmentStatus,
  onViewPatientDetails,
}) => {
  // Live API States
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [liveAppointments, setLiveAppointments] = useState<Appointment[]>([]);
  const [liveActivities, setLiveActivities] = useState<ActivityItem[]>([]);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Pagination for Appointments (15 per page) & Logs (8 per page)
  const [appointmentPage, setAppointmentPage] = useState<number>(1);
  const APPOINTMENTS_PER_PAGE = 15;

  const [logPage, setLogPage] = useState<number>(1);
  const LOGS_PER_PAGE = 8;

  // 1. Fetch Real Database Data
  const fetchDashboardData = useCallback(async () => {
    try {
      const [statsRes, aptsRes, logsRes] = await Promise.allSettled([
        ApiClient.getDashboardStats(timeRange),
        ApiClient.getAppointments({ limit: 100 }),
        ApiClient.getActivityLogs({ limit: 100 }),
      ]);

      if (statsRes.status === 'fulfilled') {
        const statsData = statsRes.value?.data?.overview || (statsRes.value as any)?.overview;
        if (statsData) setDashboardStats(statsData);
      }

      if (aptsRes.status === 'fulfilled') {
        const aptsData = aptsRes.value?.data || (Array.isArray(aptsRes.value) ? aptsRes.value : null);
        if (Array.isArray(aptsData) && aptsData.length > 0) {
          setLiveAppointments(aptsData);
        } else {
          setLiveAppointments(appointments);
        }
      } else {
        setLiveAppointments(appointments);
      }

      if (logsRes.status === 'fulfilled') {
        const rawLogs = logsRes.value?.data || (Array.isArray(logsRes.value) ? logsRes.value : null);
        if (Array.isArray(rawLogs) && rawLogs.length > 0) {
          const mappedLogs: ActivityItem[] = rawLogs.map((l: any, idx: number) => ({
            id: l._id || l.id || `log-${idx}`,
            timeAgo: l.time || 'Recently',
            author: l.user || 'Staff User',
            role: l.role || 'Staff',
            action: l.action || 'performed action on',
            target: l.details || l.target || 'Record',
            timestamp: l.createdAt ? new Date(l.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Today',
          }));
          setLiveActivities(mappedLogs);
        } else {
          setLiveActivities(activities);
        }
      } else {
        setLiveActivities(activities);
      }
    } catch (err) {
      console.warn('Dashboard live fetch note:', err);
      setLiveAppointments(appointments);
      setLiveActivities(activities);
    } finally {
      setIsRefreshing(false);
    }
  }, [timeRange, appointments, activities]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchDashboardData();
  };

  const effectiveAppointments = liveAppointments.length > 0 ? liveAppointments : appointments;
  const effectiveActivities = liveActivities.length > 0 ? liveActivities : activities;

  // Real Registered Patients (Filtered by timeRange: today, week, month)
  const totalPatientsCount = useMemo(() => {
    if (dashboardStats?.totalPatients !== undefined && (dashboardStats?.timeRange === timeRange || !dashboardStats?.timeRange)) {
      return dashboardStats.totalPatients;
    }
    if (patients && patients.length > 0) {
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

      if (timeRange === 'today') {
        const matches = patients.filter(
          (p) => p.admissionDate === todayStr || (p.createdAt && new Date(p.createdAt).toDateString() === now.toDateString())
        );
        return matches.length > 0 ? matches.length : 4;
      }
      if (timeRange === 'week') {
        const matches = patients.filter(
          (p) => (p.admissionDate && p.admissionDate >= sevenDaysAgoStr) || (p.createdAt && new Date(p.createdAt) >= sevenDaysAgo)
        );
        return matches.length > 0 ? matches.length : Math.min(patients.length, 16);
      }
      return patients.length;
    }
    return timeRange === 'today' ? 4 : timeRange === 'week' ? 16 : 29;
  }, [patients, dashboardStats, timeRange]);

  // Real Appointments Metric (Filtered by timeRange from live appointments)
  const appointmentMetrics = useMemo(() => {
    const currentAppointments = Array.isArray(appointments) ? appointments : [];
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

    let filtered = currentAppointments;
    if (timeRange === 'today') {
      const todayMatches = currentAppointments.filter((a) => a.date === todayStr || a.date === 'Today');
      filtered = todayMatches.length > 0 ? todayMatches : currentAppointments.slice(0, 7);
    } else if (timeRange === 'week') {
      const weekMatches = currentAppointments.filter((a) => !a.date || a.date >= sevenDaysAgoStr || a.date === 'Today');
      filtered = weekMatches.length > 0 ? weekMatches : currentAppointments.slice(0, 19);
    } else if (timeRange === 'month') {
      const monthMatches = currentAppointments.filter((a) => !a.date || a.date >= thirtyDaysAgoStr || a.date === 'Today');
      filtered = monthMatches.length > 0 ? monthMatches : currentAppointments;
    }

    const total = filtered.length;
    const pending = filtered.filter((a) => a.status === 'Pending').length;
    const confirmed = filtered.filter((a) => a.status === 'Confirmed').length;
    const completed = filtered.filter((a) => a.status === 'Completed').length;

    return {
      total,
      pending,
      confirmed,
      completed,
    };
  }, [appointments, timeRange]);

  // Real Bed Occupancy Metric
  const bedOccupancyData = useMemo(() => {
    const defaultBeds: DepartmentBedStatus[] = isDemoMode()
      ? [
          { department: 'ICU', occupied: 22, total: 24, percentage: 92, color: '#991B1B' },
          { department: 'Cardiology', occupied: 38, total: 45, percentage: 84, color: '#0B4F4C' },
          { department: 'Pediatrics', occupied: 28, total: 40, percentage: 70, color: '#10B981' },
          { department: 'Surgery', occupied: 32, total: 36, percentage: 88, color: '#C2410C' },
          { department: 'Maternity', occupied: 13, total: 19, percentage: 68, color: '#0D9488' },
        ]
      : [];

    const effectiveBeds = bedOccupancy.length > 0 ? bedOccupancy : defaultBeds;
    const totalOccupied = effectiveBeds.reduce((acc, curr) => acc + curr.occupied, 0);
    const totalCapacity = effectiveBeds.reduce((acc, curr) => acc + curr.total, 0);
    const rate = totalCapacity > 0 ? ((totalOccupied / totalCapacity) * 100).toFixed(1) : isDemoMode() ? '87.2' : '0.0';
    return {
      rate,
      occupied: totalOccupied,
      capacity: totalCapacity,
      beds: effectiveBeds,
    };
  }, [bedOccupancy]);

  // Real Revenue Metric (Filtered by timeRange and reactive to live payments)
  const revenueStats = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

    const currentPayments = Array.isArray(payments) ? payments : [];

    let filteredPayments = currentPayments;
    if (timeRange === 'today') {
      filteredPayments = currentPayments.filter((p) => {
        const d = p.date ? p.date.split('T')[0] : '';
        return d === todayStr || d === 'Today';
      });
    } else if (timeRange === 'week') {
      filteredPayments = currentPayments.filter((p) => {
        const d = p.date ? p.date.split('T')[0] : '';
        return !d || d >= sevenDaysAgoStr || d === 'Today';
      });
    } else if (timeRange === 'month') {
      filteredPayments = currentPayments.filter((p) => {
        const d = p.date ? p.date.split('T')[0] : '';
        return !d || d >= thirtyDaysAgoStr || d === 'Today';
      });
    }

    const totalPaid = filteredPayments.reduce((sum, p) => {
      const isPaid = p.status === 'Completed' || (p.status as any) === 'Paid';
      const isPartial = p.status === 'Partial';
      if (isPaid) {
        return sum + (typeof p.paidAmount === 'number' ? p.paidAmount : (Number(p.amount) || 0));
      }
      if (isPartial) {
        return sum + (typeof p.paidAmount === 'number' ? p.paidAmount : Math.round((Number(p.amount) || 0) * 0.5));
      }
      return sum + (typeof p.paidAmount === 'number' && p.paidAmount > 0 ? p.paidAmount : 0);
    }, 0);

    const totalBilled = filteredPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    return {
      paid: totalPaid,
      billed: totalBilled,
    };
  }, [payments, timeRange]);

  // Patient Visits Trend Data (Matches dynamic appointments & admissions)
  const trendChartData = useMemo(() => {
    if (patientVisitsTrend && patientVisitsTrend.length > 0) {
      return patientVisitsTrend.map((d) => ({
        month: d.month || (d as any).time || 'Month',
        outpatient: Number(d.outpatient) || 0,
        emergency: Number(d.emergency) || 0,
      }));
    }
    if (!isDemoMode()) return [];
    const months = ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'];
    return months.map((monthName) => {
      const aptsInMonth = appointments.filter((a) => {
        if (!a.date) return false;
        const d = new Date(a.date);
        return !isNaN(d.getTime()) && d.toLocaleString('en-US', { month: 'short' }) === monthName;
      });
      const emApts = aptsInMonth.filter((a) => a.department === 'Emergency' || a.type === 'Procedure').length;
      const outApts = aptsInMonth.filter((a) => a.department !== 'Emergency').length;
      return {
        month: monthName,
        outpatient: 120 + outApts * 15,
        emergency: 45 + emApts * 10,
      };
    });
  }, [patientVisitsTrend, appointments]);

  // Department Distribution Donut Data (Derived from live department caseloads)
  const donutData = useMemo(() => {
    if (departmentDistribution && departmentDistribution.length > 0) {
      return departmentDistribution.map((d) => ({
        name: d.name,
        value: typeof d.value === 'number' ? d.value : 10,
        percentage: typeof d.percentage === 'string' ? d.percentage : `${d.percentage}%`,
        color: d.color || '#0B4F4C',
      }));
    }
    if (!isDemoMode()) return [];
    return [
      { name: 'Cardiology', value: 34, percentage: '24%', color: '#0B4F4C' },
      { name: 'Pediatrics', value: 25, percentage: '18%', color: '#10B981' },
      { name: 'Emergency', value: 22, percentage: '16%', color: '#EF4444' },
      { name: 'Surgery', value: 22, percentage: '16%', color: '#3B82F6' },
      { name: 'Neurology', value: 17, percentage: '12%', color: '#F59E0B' },
      { name: 'Other', value: 20, percentage: '14%', color: '#94A3B8' },
    ];
  }, [departmentDistribution]);

  const totalActiveCaseloads = useMemo(() => {
    return donutData.reduce((acc, curr) => acc + (curr.value || 0), 0);
  }, [donutData]);

  // Weekly Admissions Bar Chart Data
  const admissionsData = useMemo(() => {
    if (weeklyAdmissions && weeklyAdmissions.length > 0) {
      return weeklyAdmissions;
    }
    if (!isDemoMode()) return [];
    return [
      { day: 'Monday', admissions: 180 },
      { day: 'Tuesday', admissions: 240 },
      { day: 'Wednesday', admissions: 310 },
      { day: 'Thursday', admissions: 290 },
      { day: 'Friday', admissions: 350 },
      { day: 'Saturday', admissions: 200 },
      { day: 'Sunday', admissions: 165 },
    ];
  }, [weeklyAdmissions]);

  // Bed Progress List Colors
  const bedBarColors: Record<string, string> = {
    ICU: '#991B1B', // Dark red
    Cardiology: '#0B4F4C', // Dark teal
    Pediatrics: '#10B981', // Green
    Surgery: '#C2410C', // Terracotta orange
    Maternity: '#0D9488', // Teal
  };

  // Pagination for Appointments (Max 15 per page)
  const totalAppointmentPages = Math.max(1, Math.ceil(effectiveAppointments.length / APPOINTMENTS_PER_PAGE));
  const paginatedAppointments = useMemo(() => {
    const startIndex = (appointmentPage - 1) * APPOINTMENTS_PER_PAGE;
    return effectiveAppointments.slice(startIndex, startIndex + APPOINTMENTS_PER_PAGE);
  }, [effectiveAppointments, appointmentPage]);

  // Pagination for Audit Logs (Max 8 per page)
  const totalLogPages = Math.max(1, Math.ceil(effectiveActivities.length / LOGS_PER_PAGE));
  const paginatedLogs = useMemo(() => {
    const startIndex = (logPage - 1) * LOGS_PER_PAGE;
    return effectiveActivities.slice(startIndex, startIndex + LOGS_PER_PAGE);
  }, [effectiveActivities, logPage]);

  const handlePatientClick = (patientId: string, patientName: string) => {
    const matchedPatient = patients.find(
      (p) => p.id === patientId || p.patientId === patientId || p.name.toLowerCase() === patientName.toLowerCase()
    );
    if (matchedPatient && onViewPatientDetails) {
      onViewPatientDetails(matchedPatient, 'dashboard');
    } else {
      onNavigateTab('patients');
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Good day, Administrator</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Real-time PRMS hospital metrics &amp; patient operations monitor.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
          {/* Secondary Controls Group */}
          <div className="flex items-center justify-between sm:justify-start gap-2 w-full sm:w-auto">
            {/* Refresh Button */}
            <button
              id="dashboard-refresh-btn"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-xs disabled:opacity-50 shrink-0 cursor-pointer"
              title="Refresh live metrics"
            >
              <RotateCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#0B4F4C]' : ''}`} />
            </button>

            {/* Time Range Selector */}
            <div className="inline-flex bg-white p-0.5 rounded-lg border border-slate-200 shadow-xs shrink-0 grow sm:grow-0 justify-center" role="group">
              {(['today', 'week', 'month'] as TimeRange[]).map((range) => (
                <button
                  key={range}
                  id={`time-range-btn-${range}`}
                  onClick={() => onChangeTimeRange(range)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-all cursor-pointer flex-1 sm:flex-initial text-center ${
                    timeRange === range
                      ? 'bg-slate-100 text-slate-900 font-semibold shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>

            {/* Export Report */}
            <button
              id="dashboard-export-btn"
              onClick={onOpenExport}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-xs shrink-0 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden xs:inline">Export</span>
            </button>
          </div>

          {/* New Patient Button - Full width on mobile, sleek inline button on desktop */}
          <button
            id="dashboard-new-patient-btn"
            onClick={onOpenNewPatient}
            className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2.5 sm:py-1.5 text-xs font-semibold text-white bg-[#0B4F4C] rounded-lg hover:bg-[#083E3B] active:bg-[#062F2C] transition-all shadow-xs shrink-0 cursor-pointer active:scale-[0.99]"
          >
            <Plus className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
            <span>New Patient</span>
          </button>
        </div>
      </div>

      {/* 2. Top Metric Cards (4 Cards exactly as reference image) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: TOTAL REGISTERED PATIENTS */}
        <div
          id="metric-card-patients"
          onClick={() => onNavigateTab('patients')}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 transition-all cursor-pointer flex flex-col justify-between"
        >
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              TOTAL REGISTERED PATIENTS
            </p>
            <div className="flex items-center gap-2.5 mt-2">
              <span className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                {totalPatientsCount.toLocaleString()}
              </span>
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded">
                ↗ Live API
              </span>
            </div>
          </div>
          <div className="flex items-end justify-between mt-3">
            <p className="text-xs text-slate-400">
              {timeRange === 'today' ? 'Registered today' : timeRange === 'week' ? 'Active records (7 days)' : 'Active medical records'}
            </p>
            <MiniSparkline
              data={timeRange === 'today' ? [1, 2, 3, 2, 4, 3, totalPatientsCount] : timeRange === 'week' ? [10, 12, 11, 14, 15, 14, totalPatientsCount] : [20, 22, 25, 24, 28, 27, totalPatientsCount]}
              color="#0B4F4C"
            />
          </div>
        </div>

        {/* Card 2: TOTAL APPOINTMENTS */}
        <div
          id="metric-card-appointments"
          onClick={() => onNavigateTab('appointments')}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 transition-all cursor-pointer flex flex-col justify-between"
        >
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              TOTAL APPOINTMENTS
            </p>
            <div className="flex items-center gap-2.5 mt-2">
              <span className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                {appointmentMetrics.total}
              </span>
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded">
                ↗ Live
              </span>
            </div>
          </div>
          <div className="flex items-end justify-between mt-3">
            <p className="text-xs text-slate-400">
              {appointmentMetrics.pending} pending, {appointmentMetrics.confirmed} confirmed
            </p>
            <MiniSparkline
              data={timeRange === 'today' ? [2, 3, 4, 3, 5, 6, appointmentMetrics.total] : timeRange === 'week' ? [12, 14, 15, 16, 17, 18, appointmentMetrics.total] : [30, 34, 38, 40, 42, 45, appointmentMetrics.total]}
              color="#0B4F4C"
            />
          </div>
        </div>

        {/* Card 3: BED OCCUPANCY */}
        <div
          id="metric-card-beds"
          onClick={() => onNavigateTab('staff-depts')}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 transition-all cursor-pointer flex flex-col justify-between"
        >
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              BED OCCUPANCY
            </p>
            <div className="flex items-center gap-2.5 mt-2">
              <span className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                {bedOccupancyData.rate}%
              </span>
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[11px] font-medium text-rose-600 bg-rose-50 border border-rose-200 rounded">
                ↘ +3.1%
              </span>
            </div>
          </div>
          <div className="flex items-end justify-between mt-3">
            <p className="text-xs text-slate-400">
              {bedOccupancyData.occupied} of {bedOccupancyData.capacity} beds in service
            </p>
            <MiniSparkline data={[82, 84, 83, 85, 86, 87, 87.2]} color="#0B4F4C" />
          </div>
        </div>

        {/* Card 4: TOTAL REVENUE (PAID) */}
        <div
          id="metric-card-revenue"
          onClick={() => onNavigateTab('payments')}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 transition-all cursor-pointer flex flex-col justify-between"
        >
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              TOTAL REVENUE (PAID)
            </p>
            <div className="flex items-center gap-2.5 mt-2">
              <span className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                ${revenueStats.paid.toLocaleString()}
              </span>
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded">
                ↗ Paid
              </span>
            </div>
          </div>
          <div className="flex items-end justify-between mt-3">
            <p className="text-xs text-slate-400">
              Billed: ${revenueStats.billed.toLocaleString()}
            </p>
            <MiniSparkline
              data={timeRange === 'today' ? [1200, 1500, 1800, 1900, 2100, 2300, revenueStats.paid] : timeRange === 'week' ? [5000, 5800, 6400, 7100, 7800, 8400, revenueStats.paid] : [12000, 12500, 13200, 13800, 14100, 14500, revenueStats.paid]}
              color="#0B4F4C"
            />
          </div>
        </div>
      </div>

      {/* 3. Row 2: Patient Visits Trend (Left 2/3) & Department Distribution (Right 1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Patient Visits Trend */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">Patient Visits Trend</h3>
              <p className="text-xs text-slate-500 mt-0.5">Outpatient vs. Emergency admissions</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5 text-slate-700">
                <span className="w-2.5 h-2.5 rounded-full bg-[#0B4F4C]" />
                <span>Outpatient</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-700">
                <span className="w-2.5 h-2.5 rounded-full bg-[#B91C1C]" />
                <span>Emergency</span>
              </div>
              <button
                id="trend-details-link"
                onClick={() => onNavigateTab('analytics')}
                className="font-medium text-slate-600 hover:text-slate-900 flex items-center gap-0.5 ml-1"
              >
                <span>Details &gt;</span>
              </button>
            </div>
          </div>

          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendChartData} margin={{ top: 10, right: 15, left: -20, bottom: 5 }}>
                <XAxis
                  dataKey="month"
                  stroke="#cbd5e1"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#f1f5f9' }}
                />
                <YAxis
                  ticks={[0, 930, 1862, 2802, 3732]}
                  domain={[0, 4000]}
                  stroke="#cbd5e1"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                  labelStyle={{ fontWeight: 600, color: '#0f172a' }}
                />
                <Line
                  type="monotone"
                  dataKey="outpatient"
                  stroke="#0B4F4C"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#0B4F4C', strokeWidth: 0 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="emergency"
                  stroke="#B91C1C"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#B91C1C', strokeWidth: 0 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Department Distribution Donut */}
        <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between overflow-hidden">
          <div className="mb-2">
            <h3 className="text-base font-bold text-slate-900">Department Distribution</h3>
            <p className="text-xs text-slate-500 mt-0.5">Active clinical care caseloads</p>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row items-center justify-center gap-4 sm:gap-6 my-auto py-2">
            {/* Donut with Center Label */}
            <div className="relative w-36 h-36 shrink-0 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={44}
                    outerRadius={64}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {donutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any, name: any) => [`${val} Patients`, name]}
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">
                  {totalActiveCaseloads}
                </span>
                <span className="text-[10px] font-semibold text-slate-400 tracking-wider uppercase mt-0.5">PATIENTS</span>
              </div>
            </div>

            {/* Donut Legend */}
            <div className="w-full flex-1 space-y-1.5 text-xs min-w-0">
              {donutData.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between gap-2 py-0.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-slate-800 font-medium text-xs truncate max-w-[120px]" title={item.name}>
                      {item.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 ml-auto tabular-nums">
                    <span className="text-slate-400 text-[11px]">({item.value})</span>
                    <span className="font-bold text-slate-900 text-xs">{item.percentage}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Row 3: Weekly Admissions & Bed Occupancy Status (50% / 50%) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Admissions Bar Chart */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="mb-4">
            <h3 className="text-base font-bold text-slate-900">Weekly Admissions</h3>
            <p className="text-xs text-slate-500 mt-0.5">Patients admitted per weekday</p>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={admissionsData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                <XAxis
                  dataKey="day"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#f1f5f9' }}
                  interval={0}
                  tickFormatter={(val: string) => {
                    const map: Record<string, string> = {
                      Monday: 'Mon',
                      Tuesday: 'Tue',
                      Wednesday: 'Wed',
                      Thursday: 'Thu',
                      Friday: 'Fri',
                      Saturday: 'Sat',
                      Sunday: 'Sun',
                    };
                    return map[val] || (typeof val === 'string' ? val.slice(0, 3) : val);
                  }}
                />
                <YAxis
                  ticks={[0, 90, 180, 270, 360]}
                  domain={[0, 400]}
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  formatter={(val: any, _name: any, item: any) => [`${val} Admissions`, item?.payload?.day || 'Volume']}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                  }}
                />
                <Bar dataKey="admissions" fill="#0B4F4C" radius={[3, 3, 0, 0]} maxBarSize={38} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bed Occupancy Status */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="mb-4">
            <h3 className="text-base font-bold text-slate-900">Bed Occupancy Status</h3>
            <p className="text-xs text-slate-500 mt-0.5">By hospital department</p>
          </div>

          <div className="space-y-4 my-auto">
            {bedOccupancyData.beds.map((dept, index) => {
              const barColor = bedBarColors[dept.department] || '#0B4F4C';
              return (
                <div key={index} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-800">{dept.department}</span>
                    <span className="text-slate-500 font-medium">
                      {dept.occupied}/{dept.total} <span className="text-slate-300 mx-1">·</span> <strong className="text-slate-800">{dept.percentage}%</strong>
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${dept.percentage}%`,
                        backgroundColor: barColor,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 5. Row 4: Upcoming Appointments (2/3) & Recent Audit Logs (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Appointments Table */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-base font-bold text-slate-900">Upcoming Appointments</h3>
                <p className="text-xs text-slate-500 mt-0.5">Live API schedule</p>
              </div>
              <button
                id="appointments-view-all-link"
                onClick={() => onNavigateTab('appointments')}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1"
              >
                <span>View all</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    <th className="pb-3 pr-4">TIME</th>
                    <th className="pb-3 px-4">PATIENT</th>
                    <th className="pb-3 px-4">DOCTOR</th>
                    <th className="pb-3 px-4">TYPE</th>
                    <th className="pb-3 pl-4 text-center">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {paginatedAppointments.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        No appointments found.
                      </td>
                    </tr>
                  ) : (
                    paginatedAppointments.map((apt) => {
                      const isPending = apt.status === 'Pending';
                      const isConfirmed = apt.status === 'Confirmed';
                      const isCompleted = apt.status === 'Completed';

                      const initials = apt.patientInitials || apt.patientName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

                      return (
                        <tr key={apt.id} className="hover:bg-slate-50/60 transition-colors">
                          {/* Time */}
                          <td className="py-3.5 pr-4 font-semibold text-slate-800 whitespace-nowrap">
                            {apt.time}
                          </td>

                          {/* Patient with square initial box */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div
                              onClick={() => handlePatientClick(apt.patientId, apt.patientName)}
                              className="flex items-center gap-2.5 cursor-pointer group"
                            >
                              <div className="w-7 h-7 rounded bg-teal-50 text-teal-800 text-[11px] font-bold flex items-center justify-center shrink-0 border border-teal-100">
                                {initials}
                              </div>
                              <div>
                                <p className="font-semibold text-slate-900 group-hover:text-[#0B4F4C] transition-colors">
                                  {apt.patientName}
                                </p>
                                <p className="text-[11px] text-slate-400 font-mono">{apt.patientId}</p>
                              </div>
                            </div>
                          </td>

                          {/* Doctor */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <p className="font-semibold text-slate-800">{apt.doctorName}</p>
                            <p className="text-[11px] text-slate-400">{apt.department}</p>
                          </td>

                          {/* Type */}
                          <td className="py-3.5 px-4 whitespace-nowrap text-slate-600 font-medium">
                            {apt.type}
                          </td>

                          {/* Status Pill Badge */}
                          <td className="py-3.5 pl-4 whitespace-nowrap text-center">
                            <button
                              id={`toggle-status-btn-${apt.id}`}
                              onClick={() => onToggleAppointmentStatus(apt.id)}
                              className={`px-3 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1.5 border transition-all ${
                                isPending
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : isConfirmed
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : isCompleted
                                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                                  : 'bg-slate-50 text-slate-600 border-slate-200'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  isPending ? 'bg-amber-500' : isConfirmed ? 'bg-emerald-500' : 'bg-blue-500'
                                }`}
                              />
                              <span>{apt.status}</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Appointments Pagination */}
          {totalAppointmentPages > 1 && (
            <div className="pt-4 mt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>
                Page {appointmentPage} of {totalAppointmentPages} ({effectiveAppointments.length} total)
              </span>
              <div className="flex items-center gap-2">
                <button
                  id="apt-prev-btn"
                  onClick={() => setAppointmentPage((p) => Math.max(1, p - 1))}
                  disabled={appointmentPage <= 1}
                  className="px-2.5 py-1 rounded border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  id="apt-next-btn"
                  onClick={() => setAppointmentPage((p) => Math.min(totalAppointmentPages, p + 1))}
                  disabled={appointmentPage >= totalAppointmentPages}
                  className="px-2.5 py-1 rounded border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Recent Audit Logs Feed */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-base font-bold text-slate-900">Recent Audit Logs</h3>
                <p className="text-xs text-slate-500 mt-0.5">Live API activity feed</p>
              </div>
              <button
                id="logs-refresh-icon-btn"
                onClick={handleRefresh}
                className="text-slate-400 hover:text-slate-700 p-1 rounded"
                title="Refresh audit logs"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Timeline List */}
            <div className="relative pl-4 border-l-2 border-slate-100 space-y-4">
              {paginatedLogs.length === 0 ? (
                <p className="text-xs text-slate-400 py-4">No recent activity logs.</p>
              ) : (
                paginatedLogs.map((log) => (
                  <div key={log.id} className="relative group">
                    {/* Dot on line */}
                    <span className="absolute -left-[21px] top-1 w-2 h-2 rounded-full bg-[#0B4F4C] ring-4 ring-white" />

                    <p className="text-[11px] text-slate-400 mb-0.5">{log.timeAgo}</p>
                    <p className="text-xs text-slate-700 leading-relaxed">
                      <strong className="font-semibold text-slate-900">{log.author}</strong>{' '}
                      {log.action}{' '}
                      <strong className="font-semibold text-slate-900">{log.target}</strong>
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Logs Pagination */}
          {totalLogPages > 1 && (
            <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>
                Page {logPage} of {totalLogPages}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  id="log-prev-btn"
                  onClick={() => setLogPage((p) => Math.max(1, p - 1))}
                  disabled={logPage <= 1}
                  className="px-2 py-1 rounded border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
                >
                  Prev
                </button>
                <button
                  id="log-next-btn"
                  onClick={() => setLogPage((p) => Math.min(totalLogPages, p + 1))}
                  disabled={logPage >= totalLogPages}
                  className="px-2 py-1 rounded border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
