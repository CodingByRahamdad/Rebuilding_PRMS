import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { PatientsView } from './components/PatientsView';
import { DoctorsView } from './components/DoctorsView';
import { NursesView } from './components/NursesView';
import { ReceptionistsView } from './components/ReceptionistsView';
import { AppointmentsView } from './components/AppointmentsView';
import { AnalyticsView } from './components/AnalyticsView';
import { MedicalRecordsView } from './components/MedicalRecordsView';
import { StaffDeptsView } from './components/StaffDeptsView';
import { SettingsView } from './components/SettingsView';
import { PaymentsView } from './components/PaymentsView';
import { ServicesView } from './components/ServicesView';
import { AuthProfileView } from './components/AuthProfileView';
import { NewPatientModal } from './components/NewPatientModal';
import { NewAppointmentModal } from './components/NewAppointmentModal';
import { SearchModal } from './components/SearchModal';
import { ExportModal } from './components/ExportModal';
import { MessageModal } from './components/MessageModal';
import { PatientDetailModal } from './components/PatientDetailModal';
import { LoginView } from './components/LoginView';
import { ApiClient } from './services/apiClient';
import { subscribeToActivityLogs } from './services/socketClient';
import { getStoredDepartments, saveStoredDepartments, DepartmentItem } from './services/departmentService';

import {
  NavigationTab,
  TimeRange,
  Patient,
  Doctor,
  Nurse,
  Receptionist,
  Appointment,
  ActivityItem,
  DepartmentBedStatus,
  ChatMessage,
  UserRole,
  Prescription,
  PatientBillingRecord,
  VisitHistoryItem,
  MedicalRecord,
  PatientReport,
  PaymentTransaction,
} from './types';

import {
  initialPatients,
  initialDoctors,
  initialNurses,
  initialReceptionists,
  initialAppointments,
  initialActivities,
  bedOccupancyData,
  departmentDistribution,
  patientVisitsTrend,
  weeklyAdmissions,
  initialMedicalRecords,
  initialPayments,
  roleProfiles,
} from './data/mockData';
import { isDemoMode, setRuntimeDemoMode } from './utils/demoMode';

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavigationTab>('dashboard');
  const [timeRange, setTimeRange] = useState<TimeRange>('today');
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);
  const [currentRole, setCurrentRole] = useState<UserRole>('admin');

  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<{ id?: string; name: string; email: string; role: string } | null>(null);
  const [loadingAuth, setLoadingAuth] = useState<boolean>(true);

  // Departments single source of truth state
  const [departments, setDepartments] = useState<DepartmentItem[]>(() => getStoredDepartments());

  // Listen to cross-component department updates
  useEffect(() => {
    const handleDeptUpdate = () => {
      setDepartments(getStoredDepartments());
    };
    window.addEventListener('prms_departments_updated', handleDeptUpdate);
    return () => {
      window.removeEventListener('prms_departments_updated', handleDeptUpdate);
    };
  }, []);

  // Check existing token and handle session initialization on mount
  useEffect(() => {
    const handleAuthExpired = () => {
      setCurrentUser(null);
      setIsAuthenticated(false);
    };
    window.addEventListener('prms_auth_expired', handleAuthExpired);

    const initAuth = async () => {
      try {
        const configRes = await ApiClient.getConfig();
        if (configRes.success && configRes.data) {
          setRuntimeDemoMode(configRes.data.enableDemoMode);
        }
      } catch {
        // Fallback to environment default
      }

      const token = ApiClient.getToken();
      if (token) {
        try {
          const res = await ApiClient.getProfile();
          if (res.success && res.data) {
            setCurrentUser({
              id: res.data.id || res.data._id,
              name: res.data.name,
              email: res.data.email,
              role: res.data.role,
            });
            setCurrentRole((res.data.role?.toLowerCase() || 'admin') as UserRole);
            setIsAuthenticated(true);
            setLoadingAuth(false);
            return;
          }
        } catch {
          // Attempt refresh fallback
        }
      }

      // If no token or getProfile failed, attempt cookie-based refresh
      try {
        const refreshRes = await ApiClient.refreshToken();
        if (refreshRes.success) {
          const profileRes = await ApiClient.getProfile();
          if (profileRes.success && profileRes.data) {
            setCurrentUser({
              id: profileRes.data.id || profileRes.data._id,
              name: profileRes.data.name,
              email: profileRes.data.email,
              role: profileRes.data.role,
            });
            setCurrentRole((profileRes.data.role?.toLowerCase() || 'admin') as UserRole);
            setIsAuthenticated(true);
            setLoadingAuth(false);
            return;
          }
        }
      } catch {
        // Refresh failed, unauthenticated
      }

      ApiClient.setToken(null);
      setIsAuthenticated(false);
      setLoadingAuth(false);
    };

    initAuth();

    return () => {
      window.removeEventListener('prms_auth_expired', handleAuthExpired);
    };
  }, []);

  // Dark mode HTML root element synchronization effect
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Dynamic state
  const [patients, setPatients] = useState<Patient[]>(() => (isDemoMode() ? initialPatients : []));
  const [doctors, setDoctors] = useState<Doctor[]>(() => (isDemoMode() ? initialDoctors : []));
  const [nurses, setNurses] = useState<Nurse[]>(() => (isDemoMode() ? initialNurses : []));
  const [receptionists, setReceptionists] = useState<Receptionist[]>(() => (isDemoMode() ? initialReceptionists : []));
  const [appointments, setAppointments] = useState<Appointment[]>(() => (isDemoMode() ? initialAppointments : []));
  const [activities, setActivities] = useState<ActivityItem[]>(() => (isDemoMode() ? initialActivities : []));
  const [bedOccupancy, setBedOccupancy] = useState<DepartmentBedStatus[]>(() => (isDemoMode() ? bedOccupancyData : []));
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>(() => (isDemoMode() ? initialMedicalRecords : []));
  const [payments, setPayments] = useState<PaymentTransaction[]>(() => (isDemoMode() ? initialPayments : []));

  // Dynamic department distribution computed strictly from registered patients
  const liveDepartmentDistribution = useMemo(() => {
    const defaultColors: Record<string, string> = {
      Cardiology: '#0B4F4C',
      Pediatrics: '#10B981',
      Emergency: '#EF4444',
      Surgery: '#3B82F6',
      Neurology: '#F59E0B',
      Orthopedics: '#8B5CF6',
      Oncology: '#EC4899',
      'General Medicine': '#06B6D4',
      Other: '#94A3B8',
    };

    const deptCounts: Record<string, number> = {};

    // Seed available registered departments
    departments.forEach((dept) => {
      deptCounts[dept.name] = 0;
    });

    // Count strictly patients in each department
    patients.forEach((p) => {
      const deptName = p.department || 'Other';
      deptCounts[deptName] = (deptCounts[deptName] || 0) + 1;
    });

    const entries = Object.entries(deptCounts);
    if (entries.length === 0) {
      return isDemoMode() ? departmentDistribution : [];
    }

    const totalPatients = patients.length;

    return entries
      .filter(([, count]) => count > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => {
        const pct = totalPatients > 0 ? Math.round((count / totalPatients) * 100) : 0;
        return {
          name,
          value: count,
          percentage: `${pct}%`,
          color: defaultColors[name] || '#64748B',
        };
      });
  }, [departments, patients]);

  // Dynamic patient visits trend computed from appointments & admissions
  const livePatientVisitsTrend = useMemo(() => {
    const months = ['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'];
    return months.map((monthName, idx) => {
      const monthApts = appointments.filter((a) => {
        if (!a.date) return false;
        const d = new Date(a.date);
        return !isNaN(d.getTime()) && d.toLocaleString('en-US', { month: 'short' }) === monthName;
      });
      const emCount = monthApts.filter((a) => a.department === 'Emergency' || a.type === 'Procedure').length;
      const outCount = monthApts.filter((a) => a.department !== 'Emergency').length;
      return {
        month: monthName,
        outpatient: isDemoMode() ? 1800 + idx * 350 + outCount * 20 : outCount,
        emergency: isDemoMode() ? 900 + idx * 95 + emCount * 12 : emCount,
      };
    });
  }, [appointments]);

  // Load real API data when authenticated
  const loadLiveData = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const [patRes, docRes, nurRes, recRes, appRes, medRes, actRes, payRes] = await Promise.all([
        ApiClient.getPatients(),
        ApiClient.getDoctors(),
        ApiClient.getNurses(),
        ApiClient.getReceptionists(),
        ApiClient.getAppointments(),
        ApiClient.getMedicalRecords(),
        ApiClient.getActivityLogs(),
        ApiClient.getPayments(),
      ]);

      if (patRes.success && Array.isArray(patRes.data)) {
        const mappedPatients: Patient[] = patRes.data.map((item: any, idx: number) => ({
          id: item.id || item._id || `p-${idx}`,
          patientCode: item.patientCode || `PT-0${1001 + idx}`,
          name: item.name || 'Anonymous Patient',
          age: (item.age !== undefined && item.age !== null && Number(item.age) > 0)
            ? Number(item.age)
            : (item.dateOfBirth && item.dateOfBirth.length >= 4 && new Date().getFullYear() - new Date(item.dateOfBirth).getFullYear() > 0)
              ? new Date().getFullYear() - new Date(item.dateOfBirth).getFullYear()
              : 35,
          gender: item.gender || 'Female',
          department: item.department || 'Cardiology',
          doctor: item.doctor || 'Dr. Sarah Jenkins',
          room: item.room || 'Bed 102',
          status: item.status || 'Admitted',
          admissionDate: item.admissionDate || (item.createdAt
            ? new Date(item.createdAt).toISOString().split('T')[0]
            : '2026-07-28'),
          bloodType: item.bloodGroup || item.bloodType || 'O+',
          condition: item.condition || (Array.isArray(item.medicalHistory) && item.medicalHistory.length > 0
            ? (typeof item.medicalHistory[0] === 'string' ? item.medicalHistory[0] : item.medicalHistory[0]?.diagnosis)
            : 'Observation'),
          phone: item.phone || '+1 (555) 234-5678',
          email: item.email || 'patient@example.com',
          avatar: item.avatar || '',
          address: item.address || 'Hospital Ward',
          emergencyContact: item.emergencyContact
            ? {
                name: item.emergencyContact.name,
                relation: item.emergencyContact.relationship || item.emergencyContact.relation || 'Spouse',
                phone: item.emergencyContact.phone,
              }
            : undefined,
          allergies: item.allergies || [],
          medicalHistory: Array.isArray(item.medicalHistory)
            ? item.medicalHistory.map((m: any, mIdx: number) =>
                typeof m === 'string'
                  ? {
                      id: `vis-${mIdx}`,
                      date: '2026-07-28',
                      visitType: 'Outpatient',
                      doctorName: item.doctor || 'Dr. Alex Morgan',
                      department: item.department || 'General Medicine',
                      diagnosis: m,
                      notes: 'Clinical evaluation recorded.',
                    }
                  : m
              )
            : [],
          prescriptions: item.prescriptions || [],
          reports: item.reports || [],
          billingInvoices: item.billingInvoices || [],
          vitals: item.vitals,
        }));
        setPatients(mappedPatients);
      } else if (!isDemoMode()) {
        setPatients([]);
      }

      if (docRes.success && Array.isArray(docRes.data)) {
        setDoctors(docRes.data);
      } else if (!isDemoMode()) {
        setDoctors([]);
      }

      if (nurRes.success && Array.isArray(nurRes.data)) {
        setNurses(nurRes.data);
      } else if (!isDemoMode()) {
        setNurses([]);
      }

      if (recRes.success && Array.isArray(recRes.data)) {
        setReceptionists(recRes.data);
      } else if (!isDemoMode()) {
        setReceptionists([]);
      }

      if (appRes.success && Array.isArray(appRes.data)) {
        setAppointments(appRes.data);
      } else if (!isDemoMode()) {
        setAppointments([]);
      }

      if (medRes.success && medRes.data) {
        const medList = Array.isArray(medRes.data)
          ? medRes.data
          : Array.isArray((medRes.data as any).records)
          ? (medRes.data as any).records
          : [];
        const formattedMed: MedicalRecord[] = medList.map((item: any, idx: number) => ({
          id: item.id || item._id || `med-${idx}`,
          recordCode: item.recordCode || `MR-2026-0${100 + idx}`,
          patientId: item.patientId?._id || item.patientId?.id || item.patientId || `PAT-${1000 + idx}`,
          patientName: item.patientName || item.patientId?.name || 'Assigned Patient',
          doctorName: item.doctorName || item.doctorId?.name || 'Dr. Sarah Jenkins',
          diagnosis: item.diagnosis || 'Clinical assessment completed',
          treatment: item.treatment || 'Observation & clinical therapy regimen',
          prescription:
            typeof item.prescription === 'string'
              ? item.prescription
              : Array.isArray(item.prescription) && item.prescription.length > 0
              ? item.prescription.map((p: any) => `${p.medication} ${p.dosage} (${p.frequency})`).join(', ')
              : 'N/A',
          date: item.date ? item.date.split('T')[0] : '2026-07-30',
          status: item.status || 'Active',
          reportType: item.reportType || item.title || 'Diagnostic Report',
          category: item.category || 'General',
          labResultSummary: item.labResultSummary || '',
          attachments: item.attachments || [],
          vitals: item.vitals || item.vitalSigns ? {
            bloodPressure: item.vitals?.bloodPressure || item.vitalSigns?.bloodPressure || '',
            heartRate: item.vitals?.heartRate || (item.vitalSigns?.heartRate ? `${item.vitalSigns.heartRate} bpm` : ''),
            temp: item.vitals?.temp || (item.vitalSigns?.temperature ? `${item.vitalSigns.temperature} °F` : ''),
          } : undefined,
        }));
        setMedicalRecords(formattedMed);
      } else if (!isDemoMode()) {
        setMedicalRecords([]);
      }

      if (actRes.success && Array.isArray(actRes.data)) {
        setActivities(
          actRes.data.map((item: any) => ({
            id: item.id || item._id,
            timeAgo: new Date(item.createdAt || item.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            }),
            author: item.actor?.name || 'Staff Member',
            role: item.actor?.role || 'Staff',
            action: item.action,
            target: item.target || item.details?.entityId || '',
            timestamp: new Date(item.createdAt || item.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            }),
          }))
        );
      } else if (!isDemoMode()) {
        setActivities([]);
      }

      if (payRes.success && Array.isArray(payRes.data)) {
        const formattedPayments: PaymentTransaction[] = payRes.data.map((item: any, idx: number) => ({
          id: item.id || item._id || `pay-${idx}`,
          invoiceNo: item.invoiceNo || item.invoiceNumber || `INV-${2026000 + idx}`,
          patientName: item.patientName || item.patientId?.name || 'Patient',
          patientId: item.patientId?.patientCode || item.patientId?._id || item.patientId || `PT-0${1001 + idx}`,
          amount: Number(item.amount || item.totalAmount || 0),
          paidAmount: item.paidAmount !== undefined ? Number(item.paidAmount) : undefined,
          serviceType: item.serviceType || item.description || 'Medical Consultation',
          date: item.date ? item.date.split('T')[0] : new Date().toISOString().split('T')[0],
          paymentMethod: item.paymentMethod || 'Credit Card',
          status: item.status || 'Pending',
          insuranceProvider: item.insuranceProvider,
          claimId: item.claimId,
          partialReason: item.partialReason,
          nextPaymentDate: item.nextPaymentDate,
        }));
        setPayments(formattedPayments);
      } else if (!isDemoMode()) {
        setPayments([]);
      }
    } catch (err) {
      console.warn('Live API sync notice:', err);
      if (!isDemoMode()) {
        setPatients([]);
        setDoctors([]);
        setNurses([]);
        setReceptionists([]);
        setAppointments([]);
        setMedicalRecords([]);
        setActivities([]);
        setPayments([]);
      }
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;

    loadLiveData();

    // Subscribe to Socket.IO real-time activity stream
    const unsubscribeSocket = subscribeToActivityLogs((newLog: any) => {
      if (newLog) {
        const mappedLog: ActivityItem = {
          id: newLog.id || newLog._id || `act-${Date.now()}`,
          timeAgo: 'Just now',
          author: newLog.actor?.name || 'Staff Member',
          role: newLog.actor?.role || 'Staff',
          action: newLog.action,
          target: newLog.target || newLog.details?.entityId || '',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setActivities((prev) => [mappedLog, ...prev]);
      }
    });

    return () => {
      unsubscribeSocket();
    };
  }, [isAuthenticated, loadLiveData]);

  const handleLoginSuccess = (userProfile: { id: string; name: string; email: string; role: string }) => {
    setCurrentUser(userProfile);
    setCurrentRole((userProfile.role?.toLowerCase() || 'admin') as UserRole);
    setIsAuthenticated(true);
  };

  const handleLogout = async () => {
    try {
      await ApiClient.logout();
    } catch {
      ApiClient.setToken(null);
    } finally {
      setCurrentUser(null);
      setIsAuthenticated(false);
    }
  };

  // Modals & Navigation Selections
  const [showNewPatientModal, setShowNewPatientModal] = useState(false);
  const [showNewAppointmentModal, setShowNewAppointmentModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  // Patient detail modal & edit modal trigger state
  const [activePatientDetail, setActivePatientDetail] = useState<Patient | null>(null);
  const [patientOrigin, setPatientOrigin] = useState<{
    type: 'doctor' | 'nurse';
    name: string;
  } | null>(null);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);

  const handleViewPatientDetails = (
    pat: Patient,
    origin?: { type: 'doctor' | 'nurse'; name: string }
  ) => {
    setPatientOrigin(origin || null);
    setActivePatientDetail(pat);
  };

  // Messaging state
  const [activeChatStaff, setActiveChatStaff] = useState<{
    name: string;
    id: string;
    role: string;
  } | null>(null);

  const [chatMessages, setChatMessages] = useState<Record<string, ChatMessage[]>>({
    default: [
      {
        id: '1',
        senderId: 'doc-1',
        senderName: 'Dr. Sarah Jenkins',
        senderRole: 'Senior Cardiologist',
        recipientId: 'admin-1',
        recipientName: 'Dr. Alex Morgan',
        text: 'Morning Dr. Alex, please review the ECG results for patient Robert Chen.',
        timestamp: '08:30 AM',
        isSender: false,
      },
      {
        id: '2',
        senderId: 'admin-1',
        senderName: 'Dr. Alex Morgan',
        senderRole: 'Chief Medical Admin',
        recipientId: 'doc-1',
        recipientName: 'Dr. Sarah Jenkins',
        text: 'Reviewing now. Let us adjust the dosage if ST-segment elevation persists.',
        timestamp: '08:32 AM',
        isSender: true,
      },
    ],
  });

  // Keyboard shortcut Ctrl+K / Cmd+K to open search modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setShowSearchModal((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handler to open messaging with a specific staff member
  const handleOpenMessage = (staffName: string, staffId: string, role: string) => {
    setActiveChatStaff({ name: staffName, id: staffId, role });
  };

  const handleSendChatMessage = (text: string) => {
    if (!activeChatStaff) return;
    const chatId = activeChatStaff.id;
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      senderId: 'admin-1',
      senderName: 'Dr. Alex Morgan',
      senderRole: 'Chief Medical Admin',
      recipientId: activeChatStaff.id,
      recipientName: activeChatStaff.name,
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isSender: true,
    };

    setChatMessages((prev) => ({
      ...prev,
      [chatId]: [...(prev[chatId] || prev['default'] || []), newMsg],
    }));
  };

  // Handler to add or edit a patient
  const handleSavePatient = async (savedPatient: Patient): Promise<{ success: boolean; message?: string }> => {
    const isUpdate = patients.some((p) => p.id === savedPatient.id);

    const apiPayload = {
      patientCode: savedPatient.patientCode,
      name: savedPatient.name,
      email: savedPatient.email,
      password: savedPatient.password,
      phone: savedPatient.phone,
      avatar: savedPatient.avatar || '',
      age: savedPatient.age || 35,
      gender: savedPatient.gender || 'Female',
      department: savedPatient.department || 'General Medicine',
      doctor: savedPatient.doctor || 'Dr. Alex Morgan',
      room: savedPatient.room || 'Room 101',
      condition: savedPatient.condition || 'Observation',
      address: savedPatient.address || 'Hospital Ward',
      bloodGroup: savedPatient.bloodType || 'O+',
      bloodType: savedPatient.bloodType || 'O+',
      dateOfBirth: savedPatient.admissionDate ? `${2026 - (savedPatient.age || 35)}-01-01` : '1990-01-01',
      admissionDate: savedPatient.admissionDate || new Date().toISOString().split('T')[0],
      emergencyContact: {
        name: savedPatient.emergencyContact?.name || 'Emergency Contact',
        relationship: (savedPatient.emergencyContact as any)?.relation || (savedPatient.emergencyContact as any)?.relationship || 'Family',
        phone: savedPatient.emergencyContact?.phone || savedPatient.phone,
      },
      allergies: savedPatient.allergies || [],
      medicalHistory: savedPatient.medicalHistory || [],
      prescriptions: savedPatient.prescriptions || [],
      reports: savedPatient.reports || [],
      billingInvoices: savedPatient.billingInvoices || [],
      vitals: savedPatient.vitals || {
        bloodPressure: '120/80',
        heartRate: 72,
        temperature: 98.6,
        oxygenSaturation: 98,
      },
      status: savedPatient.status || 'Admitted',
    };

    try {
      let res;
      if (isUpdate) {
        res = await ApiClient.updatePatient(savedPatient.id, apiPayload);
      } else {
        res = await ApiClient.createPatient(apiPayload);
      }

      if (res && res.success === false) {
        return { success: false, message: res.message || 'Failed to save patient records.' };
      }

      const returnedData = res?.data || {};
      const newId = returnedData.id || returnedData._id || savedPatient.id;
      const finalPatient: Patient = {
        ...savedPatient,
        id: newId,
        patientCode: returnedData.patientCode || savedPatient.patientCode,
      };

      setPatients((prev) => {
        const exists = prev.some((p) => p.id === savedPatient.id || p.id === newId);
        if (exists) {
          return prev.map((p) => (p.id === savedPatient.id || p.id === newId ? finalPatient : p));
        }
        return [finalPatient, ...prev];
      });

      const newActivity: ActivityItem = {
        id: `act-${Date.now()}`,
        timeAgo: 'Just now',
        author: currentUser?.name || 'Dr. Alex Morgan',
        role: currentUser?.role || 'Hospital Admin',
        action: isUpdate ? 'updated patient records for' : 'registered & admitted new patient',
        target: finalPatient.name,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setActivities((prev) => [newActivity, ...prev]);

      return { success: true };
    } catch (err: any) {
      console.error('Failed to persist patient to API backend:', err);
      return { success: false, message: err.message || 'Network error occurred while saving patient.' };
    }
  };

  // Handler to add or edit a doctor
  const handleSaveDoctor = async (savedDoctor: Doctor) => {
    const isUpdate = doctors.some((d) => d.id === savedDoctor.id);

    setDoctors((prev) => {
      const exists = prev.some((d) => d.id === savedDoctor.id);
      if (exists) {
        return prev.map((d) => (d.id === savedDoctor.id ? savedDoctor : d));
      }
      return [savedDoctor, ...prev];
    });

    const newActivity: ActivityItem = {
      id: `act-${Date.now()}`,
      timeAgo: 'Just now',
      author: 'Hospital Administration',
      role: 'Admin',
      action: isUpdate ? 'updated doctor profile for' : 'added new physician profile',
      target: savedDoctor.name,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setActivities((prev) => [newActivity, ...prev]);

    // Persist doctor to MongoDB API backend
    try {
      const apiPayload = {
        name: savedDoctor.name,
        email: savedDoctor.email,
        phone: savedDoctor.phone,
        specialization: savedDoctor.specialty,
        department: savedDoctor.department,
        licenseNumber: savedDoctor.degrees || 'LIC-9021',
        experience: typeof savedDoctor.experienceYears === 'number' ? savedDoctor.experienceYears : 10,
        consultationFee: 150,
        availability: savedDoctor.dutySchedule?.[0]?.shift || '08:00 AM - 04:00 PM',
        status: savedDoctor.status === 'On Duty' ? 'Active' : savedDoctor.status === 'On Leave' ? 'On Leave' : 'Active',
      };

      if (isUpdate) {
        await ApiClient.updateDoctor(savedDoctor.id, apiPayload);
      } else {
        await ApiClient.createDoctor(apiPayload);
      }
    } catch (err) {
      console.error('Failed to persist doctor to API backend:', err);
    }
  };

  // Handler to delete a doctor
  const handleDeleteDoctor = async (doctorId: string) => {
    const docToDelete = doctors.find((d) => d.id === doctorId);
    setDoctors((prev) => prev.filter((d) => d.id !== doctorId));
    if (docToDelete) {
      const newActivity: ActivityItem = {
        id: `act-${Date.now()}`,
        timeAgo: 'Just now',
        author: 'Hospital Administration',
        role: 'Admin',
        action: 'deleted physician profile for',
        target: docToDelete.name,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setActivities((prev) => [newActivity, ...prev]);
    }

    try {
      await ApiClient.deleteDoctor(doctorId);
    } catch (err) {
      console.error('Failed to delete doctor on API backend:', err);
    }
  };

  // Handler to add or edit a nurse
  const handleSaveNurse = async (savedNurse: Nurse) => {
    const isUpdate = nurses.some((n) => n.id === savedNurse.id);

    setNurses((prev) => {
      const exists = prev.some((n) => n.id === savedNurse.id);
      if (exists) {
        return prev.map((n) => (n.id === savedNurse.id ? savedNurse : n));
      }
      return [savedNurse, ...prev];
    });

    const newActivity: ActivityItem = {
      id: `act-${Date.now()}`,
      timeAgo: 'Just now',
      author: 'Nursing Directorate',
      role: 'Admin',
      action: isUpdate ? 'updated nurse credentials for' : 'registered new nursing staff',
      target: savedNurse.name,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setActivities((prev) => [newActivity, ...prev]);

    // Persist nurse to API backend
    try {
      const shiftType = savedNurse.shift.toLowerCase().includes('evening')
        ? 'Evening'
        : savedNurse.shift.toLowerCase().includes('night')
        ? 'Night'
        : 'Morning';

      const apiPayload = {
        name: savedNurse.name,
        email: savedNurse.email,
        phone: savedNurse.phone,
        department: savedNurse.department,
        shift: shiftType,
        licenseNumber: savedNurse.nurseCode || 'RN-7721',
        assignedWard: savedNurse.assignedWard,
        status: savedNurse.status === 'Off Duty' ? 'Inactive' : 'Active',
      };

      if (isUpdate) {
        await ApiClient.updateNurse(savedNurse.id, apiPayload);
      } else {
        await ApiClient.createNurse(apiPayload);
      }
    } catch (err) {
      console.error('Failed to persist nurse to API backend:', err);
    }
  };

  // Handler to delete a nurse
  const handleDeleteNurse = async (nurseId: string) => {
    const nurseToDelete = nurses.find((n) => n.id === nurseId);
    setNurses((prev) => prev.filter((n) => n.id !== nurseId));
    if (nurseToDelete) {
      const newActivity: ActivityItem = {
        id: `act-${Date.now()}`,
        timeAgo: 'Just now',
        author: 'Nursing Directorate',
        role: 'Admin',
        action: 'deleted nurse profile for',
        target: nurseToDelete.name,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setActivities((prev) => [newActivity, ...prev]);
    }

    try {
      await ApiClient.deleteNurse(nurseId);
    } catch (err) {
      console.error('Failed to delete nurse on API backend:', err);
    }
  };

  // Handler to add or edit a receptionist
  const handleSaveReceptionist = async (savedReceptionist: Receptionist) => {
    const isUpdate = receptionists.some((r) => r.id === savedReceptionist.id);

    setReceptionists((prev) => {
      const exists = prev.some((r) => r.id === savedReceptionist.id);
      if (exists) {
        return prev.map((r) => (r.id === savedReceptionist.id ? savedReceptionist : r));
      }
      return [savedReceptionist, ...prev];
    });

    const newActivity: ActivityItem = {
      id: `act-${Date.now()}`,
      timeAgo: 'Just now',
      author: 'Front Desk Admin',
      role: 'Admin',
      action: isUpdate ? 'updated receptionist assignment for' : 'registered new front desk officer',
      target: savedReceptionist.name,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setActivities((prev) => [newActivity, ...prev]);

    // Persist receptionist to API backend
    try {
      const shiftType = savedReceptionist.shift.toLowerCase().includes('evening')
        ? 'Evening'
        : savedReceptionist.shift.toLowerCase().includes('night')
        ? 'Night'
        : 'Morning';

      const apiPayload = {
        name: savedReceptionist.name,
        email: savedReceptionist.email,
        phone: savedReceptionist.phone,
        address: savedReceptionist.address || '',
        department: 'Front Desk',
        shift: shiftType,
        deskNumber: savedReceptionist.deskLocation || 'Main Lobby - Desk 1',
        status: savedReceptionist.status === 'Off Duty' ? 'Inactive' : 'Active',
      };

      if (isUpdate) {
        await ApiClient.updateReceptionist(savedReceptionist.id, apiPayload);
      } else {
        await ApiClient.createReceptionist(apiPayload);
      }
    } catch (err) {
      console.error('Failed to persist receptionist to API backend:', err);
    }
  };

  // Handler to delete a receptionist
  const handleDeleteReceptionist = async (receptionistId: string) => {
    const recToDelete = receptionists.find((r) => r.id === receptionistId);
    setReceptionists((prev) => prev.filter((r) => r.id !== receptionistId));
    if (recToDelete) {
      const newActivity: ActivityItem = {
        id: `act-${Date.now()}`,
        timeAgo: 'Just now',
        author: 'Front Desk Admin',
        role: 'Admin',
        action: 'deleted front desk staff profile for',
        target: recToDelete.name,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setActivities((prev) => [newActivity, ...prev]);
    }

    try {
      await ApiClient.deleteReceptionist(receptionistId);
    } catch (err) {
      console.error('Failed to delete receptionist on API backend:', err);
    }
  };

  // Handler to add or edit an appointment
  const handleSaveAppointment = async (savedApt: Appointment) => {
    const isUpdate = appointments.some((a) => a.id === savedApt.id);

    setAppointments((prev) => {
      const exists = prev.some((a) => a.id === savedApt.id);
      if (exists) {
        return prev.map((a) => (a.id === savedApt.id ? savedApt : a));
      }
      return [savedApt, ...prev];
    });

    const newActivity: ActivityItem = {
      id: `act-${Date.now()}`,
      timeAgo: 'Just now',
      author: 'Front Desk Reception',
      role: 'Staff',
      action: isUpdate ? 'updated appointment details for' : 'scheduled appointment for',
      target: savedApt.patientName,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setActivities((prev) => [newActivity, ...prev]);

    try {
      if (isUpdate) {
        await ApiClient.updateAppointment(savedApt.id, {
          patientName: savedApt.patientName,
          patientId: savedApt.patientId,
          doctorName: savedApt.doctorName,
          doctorId: savedApt.doctorId,
          department: savedApt.department,
          date: savedApt.date,
          time: savedApt.time,
          type: savedApt.type,
          status: savedApt.status || 'Pending',
          notes: savedApt.notes,
        });
      } else {
        const res = await ApiClient.createAppointment({
          patientName: savedApt.patientName,
          patientId: savedApt.patientId,
          doctorName: savedApt.doctorName,
          doctorId: savedApt.doctorId,
          department: savedApt.department,
          date: savedApt.date,
          time: savedApt.time,
          type: savedApt.type,
          status: savedApt.status || 'Pending',
          notes: savedApt.notes,
        });

        if (res?.data?.id && res.data.id !== savedApt.id) {
          const backendId = res.data.id;
          setAppointments((prev) =>
            prev.map((a) => (a.id === savedApt.id ? { ...a, id: backendId } : a))
          );
        }
      }
    } catch (err) {
      console.error('Failed to save appointment on API backend:', err);
    }
  };

  const handleAddAppointment = handleSaveAppointment;

  // Toggle or update appointment status
  const handleToggleAppointmentStatus = async (id: string, explicitStatus?: Appointment['status']) => {
    let nextStatus: Appointment['status'] = 'Pending';
    setAppointments((prev) =>
      prev.map((apt) => {
        if (apt.id === id) {
          nextStatus =
            explicitStatus ||
            (apt.status === 'Pending'
              ? 'Confirmed'
              : apt.status === 'Confirmed'
              ? 'Completed'
              : 'Pending');
          return { ...apt, status: nextStatus };
        }
        return apt;
      })
    );

    try {
      await ApiClient.updateAppointment(id, { status: nextStatus });
    } catch (err) {
      console.error('Failed to update appointment status on API backend:', err);
    }
  };

  // Delete appointment handler
  const handleDeleteAppointment = async (id: string) => {
    const aptToDelete = appointments.find((a) => a.id === id);
    setAppointments((prev) => prev.filter((a) => a.id !== id));
    if (aptToDelete) {
      const newActivity: ActivityItem = {
        id: `act-${Date.now()}`,
        timeAgo: 'Just now',
        author: 'Reception Admin',
        role: 'Staff',
        action: 'cancelled appointment for',
        target: aptToDelete.patientName,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setActivities((prev) => [newActivity, ...prev]);
    }

    try {
      await ApiClient.deleteAppointment(id);
    } catch (err) {
      console.error('Failed to delete appointment on API backend:', err);
    }
  };

  // Medical Records handlers
  const handleAddMedicalRecord = (newRec: MedicalRecord) => {
    setMedicalRecords((prev) => [newRec, ...prev]);
    const newActivity: ActivityItem = {
      id: `act-${Date.now()}`,
      timeAgo: 'Just now',
      author: 'Attending Physician',
      role: 'Staff',
      action: 'added new clinical record for',
      target: newRec.patientName,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setActivities((prev) => [newActivity, ...prev]);
  };

  const handleDeleteMedicalRecord = (id: string) => {
    const recToDelete = medicalRecords.find((r) => r.id === id);
    setMedicalRecords((prev) => prev.filter((r) => r.id !== id));
    if (recToDelete) {
      const newActivity: ActivityItem = {
        id: `act-${Date.now()}`,
        timeAgo: 'Just now',
        author: 'EHR Administrator',
        role: 'Staff',
        action: 'archived clinical record for',
        target: recToDelete.patientName,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setActivities((prev) => [newActivity, ...prev]);
    }
  };

  // Update patient triage status
  const handleUpdatePatientStatus = (patientId: string, status: Patient['status']) => {
    setPatients((prev) =>
      prev.map((p) => (p.id === patientId ? { ...p, status } : p))
    );
  };

  // Delete patient handler
  const handleDeletePatient = async (patientId: string) => {
    const targetPat = patients.find((p) => p.id === patientId || p.patientCode === patientId);
    setPatients((prev) => prev.filter((p) => p.id !== patientId && p.patientCode !== patientId));
    if (targetPat) {
      const newActivity: ActivityItem = {
        id: `act-${Date.now()}`,
        timeAgo: 'Just now',
        author: 'Dr. Alex Morgan',
        role: 'Admin',
        action: 'deleted patient record',
        target: `${targetPat.name} (${targetPat.patientCode})`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setActivities((prev) => [newActivity, ...prev]);
    }

    try {
      await ApiClient.deletePatient(patientId);
    } catch (err) {
      console.error('Failed to delete patient on API backend:', err);
    }
  };

  // Update medical record status and synchronize with patient reports
  const handleUpdateMedicalRecordStatus = (recordId: string, newStatus: string) => {
    let targetRec: MedicalRecord | undefined;
    setMedicalRecords((prev) =>
      prev.map((r) => {
        if (r.id === recordId) {
          targetRec = { ...r, status: newStatus };
          return targetRec;
        }
        return r;
      })
    );

    // Synchronize to matching Patient's reports
    if (targetRec) {
      const rec = targetRec;
      const cleanRecId = rec.id.replace(/^med-/, '');
      
      setPatients((prev) =>
        prev.map((p) => {
          const matchPatient =
            p.id === rec.patientId ||
            p.patientCode === rec.patientId ||
            p.name.toLowerCase() === rec.patientName.toLowerCase();

          if (matchPatient) {
            const currentReports = p.reports || [];
            let found = false;
            const updatedReports = currentReports.map((rep) => {
              const cleanRepId = rep.id.replace(/^med-/, '');
              if (
                rep.id === rec.id ||
                cleanRepId === cleanRecId ||
                rep.title === rec.reportType ||
                rep.title === rec.diagnosis
              ) {
                found = true;
                return { ...rep, status: newStatus };
              }
              return rep;
            });

            if (!found && currentReports.length > 0) {
              // If not matched by exact ID, check if first report matches
              updatedReports[0] = { ...updatedReports[0], status: newStatus };
            }

            ApiClient.updatePatient(p.id, { reports: updatedReports }).catch((err) =>
              console.warn('Failed to update patient reports status:', err)
            );
            return { ...p, reports: updatedReports };
          }
          return p;
        })
      );

      // Also sync activePatientDetail if open
      if (activePatientDetail) {
        const matchActive =
          activePatientDetail.id === rec.patientId ||
          activePatientDetail.patientCode === rec.patientId ||
          activePatientDetail.name.toLowerCase() === rec.patientName.toLowerCase();

        if (matchActive) {
          setActivePatientDetail((prev) => {
            if (!prev) return prev;
            const currentReports = prev.reports || [];
            const updatedReports = currentReports.map((rep) => {
              const cleanRepId = rep.id.replace(/^med-/, '');
              if (
                rep.id === rec.id ||
                cleanRepId === cleanRecId ||
                rep.title === rec.reportType ||
                rep.title === rec.diagnosis
              ) {
                return { ...rep, status: newStatus };
              }
              return rep;
            });
            return { ...prev, reports: updatedReports };
          });
        }
      }
    }
  };

  // Save diagnostic report / medical record
  const handleSaveMedicalRecord = (savedRecord: MedicalRecord) => {
    setMedicalRecords((prev) => {
      const exists = prev.some((r) => r.id === savedRecord.id);
      if (exists) {
        return prev.map((r) => (r.id === savedRecord.id ? savedRecord : r));
      }
      return [savedRecord, ...prev];
    });
  };

  // Save diagnostic report for specific patient
  const handleSavePatientReport = (patientId: string, report: PatientReport) => {
    const cleanReportId = report.id.replace(/^med-/, '');

    // 1. Synchronize to patients array
    setPatients((prev) =>
      prev.map((p) => {
        if (p.id === patientId || p.patientCode === patientId) {
          const currentList = p.reports || [];
          const exists = currentList.some(
            (item) => item.id === report.id || item.id.replace(/^med-/, '') === cleanReportId
          );
          const updated = exists
            ? currentList.map((item) =>
                item.id === report.id || item.id.replace(/^med-/, '') === cleanReportId
                  ? { ...item, ...report, status: report.status }
                  : item
              )
            : [report, ...currentList];

          ApiClient.updatePatient(p.id, { reports: updated }).catch((err) =>
            console.warn('Could not persist report to API:', err)
          );

          return { ...p, reports: updated };
        }
        return p;
      })
    );

    // 2. Synchronize to activePatientDetail if open
    setActivePatientDetail((prev) => {
      if (!prev || (prev.id !== patientId && prev.patientCode !== patientId)) return prev;
      const currentList = prev.reports || [];
      const exists = currentList.some(
        (item) => item.id === report.id || item.id.replace(/^med-/, '') === cleanReportId
      );
      const updated = exists
        ? currentList.map((item) =>
            item.id === report.id || item.id.replace(/^med-/, '') === cleanReportId
              ? { ...item, ...report, status: report.status }
              : item
          )
        : [report, ...currentList];
      return { ...prev, reports: updated };
    });

    // 3. Find patient metadata for medical records mapping
    const targetPatient =
      patients.find((p) => p.id === patientId || p.patientCode === patientId) || activePatientDetail;
    const patId = targetPatient?.id || patientId;
    const patName = targetPatient?.name || 'Patient';
    const patCode = targetPatient?.patientCode || patientId;

    // 4. Synchronize to global medical records state
    setMedicalRecords((prev) => {
      const existingRec = prev.find(
        (r) =>
          r.id === report.id ||
          r.id === `med-${report.id}` ||
          r.id.replace(/^med-/, '') === cleanReportId ||
          ((r.patientId === patId || r.patientId === patCode) &&
            (r.reportType === report.title || r.diagnosis === report.title))
      );

      const recordCode = existingRec?.recordCode || `MR-${Date.now().toString().slice(-4)}`;

      const synchedRec: MedicalRecord = {
        id: existingRec ? existingRec.id : `med-${report.id}`,
        recordCode,
        patientId: patId,
        patientName: patName,
        doctorName: report.doctor || targetPatient?.doctor || 'Dr. Sarah Jenkins',
        diagnosis:
          report.structuredData?.diagnosis ||
          report.title ||
          targetPatient?.condition ||
          'Clinical Report',
        treatment:
          report.structuredData?.summary ||
          report.notes ||
          'Diagnostic examination completed.',
        prescription: existingRec?.prescription || 'N/A',
        date: report.date || new Date().toISOString().split('T')[0],
        status: report.status || 'Active',
        reportType: report.title,
        category: report.category || existingRec?.category || 'Laboratory',
        labResultSummary: report.notes || report.structuredData?.summary || '',
        attachments:
          report.attachments ||
          (report.fileUrl
            ? [
                {
                  id: 'att-1',
                  url: report.fileUrl,
                  name: report.fileName || 'Report.pdf',
                  size: typeof report.fileSize === 'string' ? report.fileSize : '1.4 MB',
                  type: report.fileType || 'pdf',
                },
              ]
            : []),
        vitals:
          targetPatient?.vitals &&
          (targetPatient.vitals.bloodPressure || targetPatient.vitals.heartRate)
            ? {
                bloodPressure: targetPatient.vitals.bloodPressure || '',
                heartRate: targetPatient.vitals.heartRate ? `${targetPatient.vitals.heartRate} bpm` : '',
                temp: targetPatient.vitals.temperature ? `${targetPatient.vitals.temperature} °F` : '',
              }
            : undefined,
      };

      const filtered = prev.filter(
        (r) =>
          r.id !== synchedRec.id &&
          r.id !== report.id &&
          r.id !== `med-${report.id}` &&
          r.id.replace(/^med-/, '') !== cleanReportId
      );

      // Put new or updated record immediately at top
      return [synchedRec, ...filtered];
    });

    ApiClient.createMedicalRecord({
      patientId: patId,
      patientName: patName,
      patientCode: patCode,
      doctorName: report.doctor || targetPatient?.doctor || 'Dr. Sarah Jenkins',
      diagnosis:
        report.structuredData?.diagnosis || report.title || targetPatient?.condition || 'Clinical Report',
      treatment: report.structuredData?.summary || report.notes || 'Diagnostic examination completed.',
      prescription: 'Clinical guidance and follow-up protocol',
      reportType: report.title,
      category: report.category || 'General',
      date: report.date || new Date().toISOString().split('T')[0],
      status: report.status || 'Active',
    }).catch((err) => console.warn('Could not persist synced medical record to API:', err));
  };

  // Save prescription for specific patient
  const handleSavePatientPrescription = (patientId: string, rx: Prescription) => {
    let updatedPatient: Patient | undefined;
    setPatients((prev) =>
      prev.map((p) => {
        if (p.id === patientId || p.patientCode === patientId) {
          const currentList = p.prescriptions || [];
          const exists = currentList.some((item) => item.id === rx.id);
          const updated = exists
            ? currentList.map((item) => (item.id === rx.id ? rx : item))
            : [rx, ...currentList];
          updatedPatient = { ...p, prescriptions: updated };
          return updatedPatient;
        }
        return p;
      })
    );
    if (activePatientDetail && (activePatientDetail.id === patientId || activePatientDetail.patientCode === patientId)) {
      setActivePatientDetail((prev) => prev ? { ...prev, prescriptions: [rx, ...(prev.prescriptions || []).filter(item => item.id !== rx.id)] } : null);
    }
    if (updatedPatient) {
      ApiClient.updatePatient(patientId, { prescriptions: updatedPatient.prescriptions }).catch(err => console.warn('Could not persist prescription to API:', err));
    }
  };

  // Save visit history item for specific patient
  const handleSavePatientVisitHistory = (patientId: string, visit: VisitHistoryItem) => {
    let updatedPatient: Patient | undefined;
    setPatients((prev) =>
      prev.map((p) => {
        if (p.id === patientId || p.patientCode === patientId) {
          const currentList = p.medicalHistory || [];
          const exists = currentList.some((item) => item.id === visit.id);
          const updated = exists
            ? currentList.map((item) => (item.id === visit.id ? visit : item))
            : [visit, ...currentList];
          updatedPatient = { ...p, medicalHistory: updated };
          return updatedPatient;
        }
        return p;
      })
    );
    if (activePatientDetail && (activePatientDetail.id === patientId || activePatientDetail.patientCode === patientId)) {
      setActivePatientDetail((prev) => prev ? { ...prev, medicalHistory: [visit, ...(prev.medicalHistory || []).filter(item => item.id !== visit.id)] } : null);
    }
    if (updatedPatient) {
      ApiClient.updatePatient(patientId, { medicalHistory: updatedPatient.medicalHistory }).catch(err => console.warn('Could not persist visit history to API:', err));
    }
  };

  // Save billing invoice for specific patient (from PatientDetailModal or StaffDeptsView)
  const handleSavePatientBilling = (patientId: string, invoice: PatientBillingRecord) => {
    let updatedPatient: Patient | undefined;
    setPatients((prev) =>
      prev.map((p) => {
        if (p.id === patientId || p.patientCode === patientId) {
          const currentList = p.billingInvoices || [];
          const exists = currentList.some((item) => item.id === invoice.id || item.invoiceNumber === invoice.invoiceNumber);
          const updated = exists
            ? currentList.map((item) => (item.id === invoice.id || item.invoiceNumber === invoice.invoiceNumber ? invoice : item))
            : [invoice, ...currentList];
          updatedPatient = { ...p, billingInvoices: updated };
          return updatedPatient;
        }
        return p;
      })
    );
    if (activePatientDetail && (activePatientDetail.id === patientId || activePatientDetail.patientCode === patientId)) {
      setActivePatientDetail((prev) =>
        prev
          ? {
              ...prev,
              billingInvoices: [
                invoice,
                ...(prev.billingInvoices || []).filter(
                  (item) => item.id !== invoice.id && item.invoiceNumber !== invoice.invoiceNumber
                ),
              ],
            }
          : null
      );
    }
    if (updatedPatient) {
      ApiClient.updatePatient(patientId, { billingInvoices: updatedPatient.billingInvoices }).catch((err) =>
        console.warn('Could not persist billing invoice to API:', err)
      );
    }

    // Bidirectionally synchronize with Payments & Invoices view
    const targetPatient =
      patients.find((p) => p.id === patientId || p.patientCode === patientId) || activePatientDetail;
    const patName = targetPatient?.name || 'Patient';
    const patCode = targetPatient?.patientCode || patientId;

    const paymentStatus: PaymentTransaction['status'] =
      invoice.status === 'Paid'
        ? 'Completed'
        : invoice.status === 'Partial'
        ? 'Partial'
        : invoice.status === 'Insurance Claim'
        ? 'Insurance Claim'
        : 'Pending';

    const paymentTx: PaymentTransaction = {
      id: invoice.id,
      invoiceNo: invoice.invoiceNumber,
      patientName: patName,
      patientId: patCode,
      amount: invoice.totalAmount,
      paidAmount: invoice.paidAmount,
      serviceType: invoice.description,
      date: invoice.date,
      paymentMethod: (invoice.paymentMethod as any) || 'Credit Card',
      status: paymentStatus,
      insuranceProvider: invoice.insuranceProvider,
      partialReason: invoice.partialReason,
      nextPaymentDate: invoice.nextPaymentDate,
    };

    setPayments((prev) => {
      const exists = prev.some((p) => p.id === invoice.id || p.invoiceNo === invoice.invoiceNumber);
      if (exists) {
        return prev.map((p) => (p.id === invoice.id || p.invoiceNo === invoice.invoiceNumber ? paymentTx : p));
      }
      return [paymentTx, ...prev];
    });

    ApiClient.createPayment(paymentTx).catch((err) =>
      console.warn('Could not persist synced payment transaction to API:', err)
    );
  };

  // Delete Patient Billing (from PatientDetailModal)
  const handleDeletePatientBilling = (patientId: string, invoiceId: string, invoiceNumber: string) => {
    setPatients((prev) =>
      prev.map((p) => {
        if (p.id === patientId || p.patientCode === patientId) {
          const currentList = p.billingInvoices || [];
          const updated = currentList.filter((item) => item.id !== invoiceId && item.invoiceNumber !== invoiceNumber);
          ApiClient.updatePatient(p.id, { billingInvoices: updated }).catch((err) =>
            console.warn('Could not persist updated invoices to API:', err)
          );
          return { ...p, billingInvoices: updated };
        }
        return p;
      })
    );

    if (activePatientDetail && (activePatientDetail.id === patientId || activePatientDetail.patientCode === patientId)) {
      setActivePatientDetail((prev) => {
        if (!prev) return prev;
        const currentList = prev.billingInvoices || [];
        return {
          ...prev,
          billingInvoices: currentList.filter((item) => item.id !== invoiceId && item.invoiceNumber !== invoiceNumber),
        };
      });
    }

    setPayments((prev) => prev.filter((p) => p.id !== invoiceId && p.invoiceNo !== invoiceNumber));
    ApiClient.deletePayment(invoiceId).catch((err) => console.warn('Could not delete payment from API:', err));
  };

  // Save or Edit Payment (from PaymentsView Record Payment / Edit Invoice modal)
  const handleSavePayment = async (savedPayment: PaymentTransaction) => {
    const isUpdate = payments.some((p) => p.id === savedPayment.id || p.invoiceNo === savedPayment.invoiceNo);

    // 1. Update payments state
    setPayments((prev) => {
      const exists = prev.some((p) => p.id === savedPayment.id || p.invoiceNo === savedPayment.invoiceNo);
      if (exists) {
        return prev.map((p) => (p.id === savedPayment.id || p.invoiceNo === savedPayment.invoiceNo ? savedPayment : p));
      }
      return [savedPayment, ...prev];
    });

    // 2. Map to PatientBillingRecord
    const targetStatus: 'Paid' | 'Pending' | 'Partial' | 'Insurance Claim' =
      savedPayment.status === 'Completed' || savedPayment.status === 'Paid'
        ? 'Paid'
        : savedPayment.status === 'Partial'
        ? 'Partial'
        : savedPayment.status === 'Insurance Claim'
        ? 'Insurance Claim'
        : 'Pending';

    const numTotal = Number(savedPayment.amount) || 0;
    const numPaid = savedPayment.paidAmount !== undefined
      ? Number(savedPayment.paidAmount)
      : (targetStatus === 'Paid' ? numTotal : targetStatus === 'Partial' ? Math.round(numTotal * 0.5) : 0);

    const billingItem: PatientBillingRecord = {
      id: savedPayment.id,
      invoiceNumber: savedPayment.invoiceNo,
      date: savedPayment.date,
      description: savedPayment.serviceType,
      totalAmount: numTotal,
      paidAmount: numPaid,
      status: targetStatus,
      insuranceProvider: savedPayment.insuranceProvider,
      paymentMethod: savedPayment.paymentMethod,
      partialReason: savedPayment.partialReason,
      nextPaymentDate: savedPayment.nextPaymentDate,
    };

    // 3. Update Patient's billingInvoices in patients list
    setPatients((prev) =>
      prev.map((p) => {
        const isMatch =
          p.id === savedPayment.patientId ||
          p.patientCode === savedPayment.patientId ||
          p.name.toLowerCase().trim() === savedPayment.patientName.toLowerCase().trim();

        if (isMatch) {
          const currentList = p.billingInvoices || [];
          const exists = currentList.some((item) => item.id === billingItem.id || item.invoiceNumber === billingItem.invoiceNumber);
          const updated = exists
            ? currentList.map((item) => (item.id === billingItem.id || item.invoiceNumber === billingItem.invoiceNumber ? billingItem : item))
            : [billingItem, ...currentList];

          ApiClient.updatePatient(p.id, { billingInvoices: updated }).catch((err) =>
            console.warn('Failed to update patient billing invoices:', err)
          );
          return { ...p, billingInvoices: updated };
        }
        return p;
      })
    );

    // 4. Update activePatientDetail if open
    if (activePatientDetail) {
      const isMatchActive =
        activePatientDetail.id === savedPayment.patientId ||
        activePatientDetail.patientCode === savedPayment.patientId ||
        activePatientDetail.name.toLowerCase().trim() === savedPayment.patientName.toLowerCase().trim();

      if (isMatchActive) {
        setActivePatientDetail((prev) => {
          if (!prev) return prev;
          const currentList = prev.billingInvoices || [];
          const exists = currentList.some((item) => item.id === billingItem.id || item.invoiceNumber === billingItem.invoiceNumber);
          const updated = exists
            ? currentList.map((item) => (item.id === billingItem.id || item.invoiceNumber === billingItem.invoiceNumber ? billingItem : item))
            : [billingItem, ...currentList];
          return { ...prev, billingInvoices: updated };
        });
      }
    }

    // 5. Activity log
    const newActivity: ActivityItem = {
      id: `act-${Date.now()}`,
      timeAgo: 'Just now',
      author: 'Finance & Billing',
      role: 'Staff',
      action: isUpdate ? 'updated payment invoice' : 'processed payment record for',
      target: `${savedPayment.patientName} (${savedPayment.invoiceNo})`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setActivities((prev) => [newActivity, ...prev]);

    // 6. Persist to API
    try {
      if (isUpdate) {
        await ApiClient.updatePayment(savedPayment.id, savedPayment);
      } else {
        await ApiClient.createPayment(savedPayment);
      }
    } catch (err) {
      console.warn('Failed to persist payment to API backend:', err);
    }
  };

  // Quick Status Update (from PaymentsView status selector dropdown)
  const handleUpdatePaymentStatus = async (paymentId: string, newStatus: PaymentTransaction['status']) => {
    let updatedTx: PaymentTransaction | undefined;

    setPayments((prev) =>
      prev.map((p) => {
        if (p.id === paymentId || p.invoiceNo === paymentId) {
          const numTotal = p.amount;
          let newPaid = p.paidAmount;
          if (newStatus === 'Completed' || newStatus === 'Paid') {
            newPaid = numTotal;
          } else if (newStatus === 'Pending') {
            newPaid = 0;
          }
          updatedTx = { ...p, status: newStatus, paidAmount: newPaid };
          return updatedTx;
        }
        return p;
      })
    );

    if (updatedTx) {
      const tx = updatedTx;
      const targetBillingStatus: 'Paid' | 'Pending' | 'Partial' | 'Insurance Claim' =
        tx.status === 'Completed' || tx.status === 'Paid'
          ? 'Paid'
          : tx.status === 'Partial'
          ? 'Partial'
          : tx.status === 'Insurance Claim'
          ? 'Insurance Claim'
          : 'Pending';

      // Sync with patients
      setPatients((prev) =>
        prev.map((p) => {
          const isMatch =
            p.id === tx.patientId ||
            p.patientCode === tx.patientId ||
            p.name.toLowerCase().trim() === tx.patientName.toLowerCase().trim();

          if (isMatch) {
            const currentList = p.billingInvoices || [];
            const updated = currentList.map((item) => {
              if (item.id === tx.id || item.invoiceNumber === tx.invoiceNo) {
                return {
                  ...item,
                  status: targetBillingStatus,
                  paidAmount: tx.paidAmount !== undefined ? tx.paidAmount : item.paidAmount,
                };
              }
              return item;
            });
            ApiClient.updatePatient(p.id, { billingInvoices: updated }).catch((err) =>
              console.warn('Failed to sync patient invoice status:', err)
            );
            return { ...p, billingInvoices: updated };
          }
          return p;
        })
      );

      // Sync activePatientDetail
      if (activePatientDetail) {
        const isMatchActive =
          activePatientDetail.id === tx.patientId ||
          activePatientDetail.patientCode === tx.patientId ||
          activePatientDetail.name.toLowerCase().trim() === tx.patientName.toLowerCase().trim();

        if (isMatchActive) {
          setActivePatientDetail((prev) => {
            if (!prev) return prev;
            const currentList = prev.billingInvoices || [];
            const updated = currentList.map((item) => {
              if (item.id === tx.id || item.invoiceNumber === tx.invoiceNo) {
                return {
                  ...item,
                  status: targetBillingStatus,
                  paidAmount: tx.paidAmount !== undefined ? tx.paidAmount : item.paidAmount,
                };
              }
              return item;
            });
            return { ...prev, billingInvoices: updated };
          });
        }
      }

      try {
        await ApiClient.updatePayment(tx.id, { status: tx.status, paidAmount: tx.paidAmount });
      } catch (err) {
        console.warn('Failed to update payment status on API:', err);
      }
    }
  };

  // Delete Payment (from PaymentsView)
  const handleDeletePayment = async (paymentId: string, invoiceNo: string) => {
    const txToDelete = payments.find((p) => p.id === paymentId || p.invoiceNo === invoiceNo);
    setPayments((prev) => prev.filter((p) => p.id !== paymentId && p.invoiceNo !== invoiceNo));

    if (txToDelete) {
      const tx = txToDelete;
      // Remove from patients
      setPatients((prev) =>
        prev.map((p) => {
          const currentList = p.billingInvoices || [];
          const exists = currentList.some((item) => item.id === tx.id || item.invoiceNumber === tx.invoiceNo);
          if (exists) {
            const updated = currentList.filter((item) => item.id !== tx.id && item.invoiceNumber !== tx.invoiceNo);
            ApiClient.updatePatient(p.id, { billingInvoices: updated }).catch((err) =>
              console.warn('Failed to remove invoice from patient on API:', err)
            );
            return { ...p, billingInvoices: updated };
          }
          return p;
        })
      );

      // Remove from activePatientDetail
      if (activePatientDetail) {
        setActivePatientDetail((prev) => {
          if (!prev) return prev;
          const currentList = prev.billingInvoices || [];
          return {
            ...prev,
            billingInvoices: currentList.filter((item) => item.id !== tx.id && item.invoiceNumber !== tx.invoiceNo),
          };
        });
      }

      const newActivity: ActivityItem = {
        id: `act-${Date.now()}`,
        timeAgo: 'Just now',
        author: 'Finance & Billing',
        role: 'Staff',
        action: 'voided invoice & transaction',
        target: `${tx.invoiceNo} (${tx.patientName})`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setActivities((prev) => [newActivity, ...prev]);

      try {
        await ApiClient.deletePayment(paymentId);
      } catch (err) {
        console.warn('Failed to delete payment on API:', err);
      }
    }
  };

  // Refresh Payments Handler
  const handleRefreshPayments = async () => {
    try {
      const res = await ApiClient.getPayments();
      if (res.success && Array.isArray(res.data)) {
        const formatted: PaymentTransaction[] = res.data.map((item: any, idx: number) => ({
          id: item.id || item._id || `pay-${idx}`,
          invoiceNo: item.invoiceNo || item.invoiceNumber || `INV-${2026000 + idx}`,
          patientName: item.patientName || item.patientId?.name || 'Patient',
          patientId: item.patientId?.patientCode || item.patientId?._id || item.patientId || `PT-0${1001 + idx}`,
          amount: Number(item.amount || item.totalAmount || 0),
          paidAmount: item.paidAmount !== undefined ? Number(item.paidAmount) : undefined,
          serviceType: item.serviceType || item.description || 'Medical Consultation',
          date: item.date ? item.date.split('T')[0] : new Date().toISOString().split('T')[0],
          paymentMethod: item.paymentMethod || 'Credit Card',
          status: item.status || 'Pending',
          insuranceProvider: item.insuranceProvider,
          claimId: item.claimId,
          partialReason: item.partialReason,
          nextPaymentDate: item.nextPaymentDate,
        }));
        setPayments(formatted);
      }
    } catch (err) {
      console.warn('Could not refresh payments from API:', err);
    }
  };

  // Badge counts for sidebar
  const counts = {
    patients: patients.length,
    doctors: doctors.length,
    nurses: nurses.length,
    receptionists: receptionists.length,
    appointments: appointments.length,
  };

  if (loadingAuth) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white space-y-4">
        <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
        <div className="text-sm font-bold tracking-wide">Validating Staff Credentials...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className={`min-h-screen bg-slate-50/90 flex text-slate-800 font-sans ${darkMode ? 'dark' : ''}`}>
      {/* Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
        counts={counts}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
        currentRole={currentRole}
      />

      {/* Main Right Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          onOpenSearch={() => setShowSearchModal(true)}
          onOpenNewPatient={() => setShowNewPatientModal(true)}
          onOpenNewAppointment={() => setShowNewAppointmentModal(true)}
          darkMode={darkMode}
          onToggleDarkMode={() => setDarkMode(!darkMode)}
          onToggleMobileSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          onOpenMessageDrawer={() =>
            handleOpenMessage('Dr. Sarah Jenkins', 'doc-1', 'Senior Cardiologist')
          }
          currentRole={currentRole}
          currentUser={currentUser}
          onLogout={handleLogout}
          activities={activities}
        />

        <main className="flex-1 overflow-y-auto pb-12">
          {currentTab === 'dashboard' && (
            <DashboardView
              timeRange={timeRange}
              onChangeTimeRange={setTimeRange}
              onOpenNewPatient={() => setShowNewPatientModal(true)}
              onOpenNewAppointment={() => setShowNewAppointmentModal(true)}
              onOpenExport={() => setShowExportModal(true)}
              onNavigateTab={(tab) => setCurrentTab(tab)}
              patients={patients}
              doctors={doctors}
              nurses={nurses}
              appointments={appointments}
              activities={activities}
              bedOccupancy={bedOccupancy}
              departmentDistribution={liveDepartmentDistribution}
              patientVisitsTrend={livePatientVisitsTrend}
              weeklyAdmissions={isDemoMode() ? weeklyAdmissions : []}
              payments={payments}
              medicalRecords={medicalRecords}
              onToggleAppointmentStatus={handleToggleAppointmentStatus}
              onViewPatientDetails={(pat, origin) => handleViewPatientDetails(pat, origin)}
            />
          )}

          {currentTab === 'patients' && (
            <PatientsView
              patients={patients}
              onOpenNewPatient={() => setShowNewPatientModal(true)}
              onUpdatePatientStatus={handleUpdatePatientStatus}
              appointments={appointments}
              medicalRecords={medicalRecords}
              onOpenMessage={handleOpenMessage}
              onEditPatient={(pat) => setEditingPatient(pat)}
              onDeletePatient={handleDeletePatient}
              onSaveMedicalRecord={handleSaveMedicalRecord}
              onSavePatientReport={handleSavePatientReport}
              onSavePatientPrescription={handleSavePatientPrescription}
              onSavePatientVisitHistory={handleSavePatientVisitHistory}
              onSaveAppointment={handleSaveAppointment}
              onSavePatientBilling={handleSavePatientBilling}
            />
          )}

          {currentTab === 'doctors' && (
            <DoctorsView
              doctors={doctors}
              patients={patients}
              departments={departments}
              onOpenMessage={handleOpenMessage}
              onBookAppointment={(docName) => setShowNewAppointmentModal(true)}
              onSaveDoctor={handleSaveDoctor}
              onDeleteDoctor={handleDeleteDoctor}
              onViewPatientDetails={(pat, origin) => {
                handleViewPatientDetails(pat, origin);
              }}
            />
          )}

          {currentTab === 'nurses' && (
            <NursesView
              nurses={nurses}
              patients={patients}
              departments={departments}
              onOpenMessage={handleOpenMessage}
              onSaveNurse={handleSaveNurse}
              onDeleteNurse={handleDeleteNurse}
              onViewPatientDetails={(pat, origin) => {
                handleViewPatientDetails(pat, origin);
              }}
            />
          )}

          {currentTab === 'receptionists' && (
            <ReceptionistsView
              receptionists={receptionists}
              onOpenMessage={handleOpenMessage}
              onSaveReceptionist={handleSaveReceptionist}
              onDeleteReceptionist={handleDeleteReceptionist}
            />
          )}

          {currentTab === 'appointments' && (
            <AppointmentsView
              appointments={appointments}
              patients={patients}
              doctors={doctors}
              departments={departments}
              onOpenNewAppointment={() => setShowNewAppointmentModal(true)}
              onEditAppointment={(apt) => setEditingAppointment(apt)}
              onSaveAppointment={handleSaveAppointment}
              onToggleStatus={handleToggleAppointmentStatus}
              onDeleteAppointment={handleDeleteAppointment}
            />
          )}

          {currentTab === 'analytics' && (
            <AnalyticsView
              patients={patients}
              payments={payments}
              bedOccupancy={bedOccupancy}
              appointments={appointments}
              departments={departments}
              doctors={doctors}
              nurses={nurses}
              medicalRecords={medicalRecords}
              patientVisitsTrend={livePatientVisitsTrend}
              departmentDistribution={liveDepartmentDistribution}
              onRefresh={loadLiveData}
            />
          )}

          {currentTab === 'medical-records' && (
            <MedicalRecordsView
              records={medicalRecords}
              patients={patients}
              doctors={doctors}
              onOpenExport={() => setShowExportModal(true)}
              onSelectPatient={(p) => handleViewPatientDetails(p)}
              onAddRecord={handleAddMedicalRecord}
              onUpdateRecordStatus={handleUpdateMedicalRecordStatus}
              onSavePatientReport={handleSavePatientReport}
              onDeleteRecord={handleDeleteMedicalRecord}
            />
          )}

          {currentTab === 'staff-depts' && (
            <StaffDeptsView
              departments={departments}
              onDepartmentsChange={(newDepts) => {
                setDepartments(newDepts);
                saveStoredDepartments(newDepts);
              }}
              bedOccupancy={bedOccupancy}
              doctors={doctors}
              nurses={nurses}
              receptionists={receptionists}
              patients={patients}
              appointments={appointments}
              medicalRecords={medicalRecords}
              onOpenMessage={handleOpenMessage}
              onSaveMedicalRecord={handleSaveMedicalRecord}
              onSavePatientReport={handleSavePatientReport}
              onSavePatientPrescription={handleSavePatientPrescription}
              onSavePatientVisitHistory={handleSavePatientVisitHistory}
              onSaveAppointment={handleSaveAppointment}
              onSavePatientBilling={handleSavePatientBilling}
              onDeletePatientBilling={handleDeletePatientBilling}
            />
          )}

          {currentTab === 'payments' && (
            <PaymentsView
              payments={payments}
              patients={patients}
              onSavePayment={handleSavePayment}
              onUpdatePaymentStatus={handleUpdatePaymentStatus}
              onDeletePayment={handleDeletePayment}
              onSelectPatient={(p) => handleViewPatientDetails(p)}
              onRefresh={handleRefreshPayments}
            />
          )}

          {currentTab === 'services' && <ServicesView />}

          {currentTab === 'profile' && (
            <AuthProfileView
              currentRole={currentRole === 'admin' ? 'Super Admin' : currentRole === 'doctor' ? 'Doctor' : currentRole === 'nurse' ? 'Nurse' : 'Receptionist'}
              onRoleChange={(role) => {
                if (role === 'Super Admin') setCurrentRole('admin');
                else if (role === 'Doctor') setCurrentRole('doctor');
                else if (role === 'Nurse') setCurrentRole('nurse');
                else if (role === 'Receptionist') setCurrentRole('receptionist');
              }}
            />
          )}

          {currentTab === 'settings' && (
            <SettingsView
              darkMode={darkMode}
              onToggleDarkMode={() => setDarkMode(!darkMode)}
              currentRole={currentRole}
              onSelectRole={(role) => setCurrentRole(role)}
            />
          )}
        </main>
      </div>

      {/* Global Patient Detail Modal */}
      {activePatientDetail && (
        <PatientDetailModal
          patient={activePatientDetail}
          backOrigin={patientOrigin}
          onBack={() => {
            setActivePatientDetail(null);
            setPatientOrigin(null);
          }}
          onClose={() => {
            setActivePatientDetail(null);
            setPatientOrigin(null);
          }}
          appointments={appointments}
          medicalRecords={medicalRecords}
          onOpenMessage={handleOpenMessage}
          onEditPatient={(pat) => {
            setActivePatientDetail(null);
            setPatientOrigin(null);
            setEditingPatient(pat);
          }}
          onDeletePatient={handleDeletePatient}
          onSaveMedicalRecord={handleSaveMedicalRecord}
          onSavePatientReport={handleSavePatientReport}
          onSavePatientPrescription={handleSavePatientPrescription}
          onSavePatientVisitHistory={handleSavePatientVisitHistory}
          onSaveAppointment={handleSaveAppointment}
          onSavePatientBilling={handleSavePatientBilling}
          onDeletePatientBilling={handleDeletePatientBilling}
        />
      )}

      {/* Messaging Modal */}
      {activeChatStaff && (
        <MessageModal
          recipientName={activeChatStaff.name}
          recipientRole={activeChatStaff.role}
          messages={
            chatMessages[activeChatStaff.id] ||
            chatMessages['default'] ||
            []
          }
          onSendMessage={handleSendChatMessage}
          onClose={() => setActiveChatStaff(null)}
        />
      )}

      {/* Modals */}
      {showNewPatientModal && (
        <NewPatientModal
          doctors={doctors}
          departments={departments}
          onClose={() => setShowNewPatientModal(false)}
          onAddPatient={handleSavePatient}
        />
      )}

      {editingPatient && (
        <NewPatientModal
          patient={editingPatient}
          doctors={doctors}
          departments={departments}
          onClose={() => setEditingPatient(null)}
          onAddPatient={handleSavePatient}
        />
      )}

      {showNewAppointmentModal && (
        <NewAppointmentModal
          patients={patients}
          doctors={doctors}
          departments={departments}
          onClose={() => setShowNewAppointmentModal(false)}
          onAddAppointment={handleSaveAppointment}
        />
      )}

      {editingAppointment && (
        <NewAppointmentModal
          appointment={editingAppointment}
          patients={patients}
          doctors={doctors}
          departments={departments}
          onClose={() => setEditingAppointment(null)}
          onAddAppointment={handleSaveAppointment}
        />
      )}

      {showSearchModal && (
        <SearchModal
          onClose={() => setShowSearchModal(false)}
          patients={patients}
          appointments={appointments}
          doctors={doctors}
          onSelectPatient={(p) => {
            setShowSearchModal(false);
            setActivePatientDetail(p);
          }}
        />
      )}

      {showExportModal && (
        <ExportModal onClose={() => setShowExportModal(false)} />
      )}
    </div>
  );
}

