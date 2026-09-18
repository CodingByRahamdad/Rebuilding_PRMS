import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Building2,
  Users,
  HeartPulse,
  Search,
  Plus,
  Stethoscope,
  BedDouble,
  Phone,
  RotateCw,
  Loader2,
  Edit,
  Trash2,
  AlertTriangle,
  X,
  ChevronRight,
  ShieldCheck,
  User,
  Activity,
  CheckCircle2,
  Mail,
  Calendar,
  Star,
  Clock,
  ExternalLink,
  Check,
  UserCheck,
} from 'lucide-react';
import {
  DepartmentBedStatus,
  Doctor,
  Nurse,
  Receptionist,
  Patient,
  Appointment,
  MedicalRecord,
  PatientReport,
  Prescription,
  VisitHistoryItem,
  PatientBillingRecord,
} from '../types';
import { ApiClient } from '../services/apiClient';
import { getStoredDepartments, saveStoredDepartments, DepartmentItem } from '../services/departmentService';
import { DoctorDetailModal } from './DoctorDetailModal';
import { NurseDetailModal } from './NurseDetailModal';
import { PatientDetailModal } from './PatientDetailModal';

export type { DepartmentItem };

interface StaffDeptsViewProps {
  departments?: DepartmentItem[];
  onDepartmentsChange?: (depts: DepartmentItem[]) => void;
  bedOccupancy?: DepartmentBedStatus[];
  doctors?: Doctor[];
  nurses?: Nurse[];
  receptionists?: Receptionist[];
  patients?: Patient[];
  appointments?: Appointment[];
  medicalRecords?: MedicalRecord[];
  onOpenMessage?: (staffName: string, staffId: string, role: string) => void;
  onSaveMedicalRecord?: (record: MedicalRecord) => void;
  onSavePatientReport?: (patientId: string, report: PatientReport) => void;
  onSavePatientPrescription?: (patientId: string, prescription: Prescription) => void;
  onSavePatientVisitHistory?: (patientId: string, visit: VisitHistoryItem) => void;
  onSaveAppointment?: (appointment: Appointment) => void;
  onSavePatientBilling?: (patientId: string, invoice: PatientBillingRecord) => void;
  onDeletePatientBilling?: (patientId: string, invoiceId: string, invoiceNumber: string) => void;
}

const STORAGE_KEY = 'prms_hospital_departments_v4';

// Initial default department structures
const initialDepartments: DepartmentItem[] = [
  {
    id: 'dept-1',
    name: 'Cardiology',
    wing: 'North Tower - Floor 3',
    head: 'Dr. Liam Reynolds',
    totalBeds: 40,
    occupiedBeds: 34,
    extension: 'Ext. 3401',
    status: 'High Occupancy',
  },
  {
    id: 'dept-2',
    name: 'Pediatrics',
    wing: 'East Wing - Floor 2',
    head: 'Dr. Naomi Chen',
    totalBeds: 30,
    occupiedBeds: 18,
    extension: 'Ext. 2205',
    status: 'Operational',
  },
  {
    id: 'dept-3',
    name: 'Emergency & Trauma',
    wing: 'Ground Level - Block A',
    head: 'Dr. Marcus Reynolds',
    totalBeds: 50,
    occupiedBeds: 46,
    extension: 'Ext. 1000',
    status: 'Emergency Priority',
  },
  {
    id: 'dept-4',
    name: 'Surgical Suite',
    wing: 'Operating Block B',
    head: 'Dr. David Okonkwo',
    totalBeds: 25,
    occupiedBeds: 20,
    extension: 'Ext. 4500',
    status: 'Operational',
  },
  {
    id: 'dept-5',
    name: 'Neurology',
    wing: 'South Tower - Floor 4',
    head: 'Dr. Ahmed Al-Rashid',
    totalBeds: 35,
    occupiedBeds: 22,
    extension: 'Ext. 4012',
    status: 'Operational',
  },
  {
    id: 'dept-6',
    name: 'Psychiatry & Behavioral Health',
    wing: 'West Annex - Level 1',
    head: 'Dr. Sarah Chen',
    totalBeds: 20,
    occupiedBeds: 14,
    extension: 'Ext. 5100',
    status: 'Operational',
  },
  {
    id: 'dept-7',
    name: 'Orthopedics',
    wing: 'North Tower - Floor 2',
    head: 'Dr. Kenji Tanaka',
    totalBeds: 28,
    occupiedBeds: 19,
    extension: 'Ext. 2304',
    status: 'Operational',
  },
  {
    id: 'dept-8',
    name: 'ICU & Intensive Care Unit',
    wing: 'Critical Care Block - Floor 1',
    head: 'Dr. Elena Rostova',
    totalBeds: 20,
    occupiedBeds: 18,
    extension: 'Ext. 9110',
    status: 'High Occupancy',
  },
];

// Fuzzy matching for department names & aliases
const matchDepartment = (staffDept?: string, deptName?: string): boolean => {
  if (!staffDept || !deptName) return false;
  const s = staffDept.toLowerCase().trim();
  const d = deptName.toLowerCase().trim();

  if (s.includes(d) || d.includes(s)) return true;

  const aliases: Record<string, string[]> = {
    cardiology: ['cardio', 'heart', 'cardiac', 'telemetry'],
    pediatrics: ['pediatric', 'child', 'peds'],
    emergency: ['emergency', 'trauma', 'er', 'er/icu', 'urgent'],
    surgery: ['surgery', 'surgeon', 'surgical', 'operation', 'suite'],
    neurology: ['neuro', 'brain', 'spine'],
    orthopedics: ['ortho', 'bone', 'joint'],
    psychiatry: ['psych', 'behavioral', 'mental', 'mind'],
    icu: ['icu', 'intensive', 'critical', 'ccu'],
    radiology: ['radio', 'imaging', 'x-ray', 'mri', 'ct'],
    dermatology: ['derma', 'skin'],
    oncology: ['onco', 'cancer', 'hematology'],
    maternity: ['maternity', 'gyne', 'obgyn', 'obstetric'],
    general: ['general', 'medicine', 'internal'],
  };

  for (const [key, aliasList] of Object.entries(aliases)) {
    const deptHasKey = d.includes(key) || aliasList.some((a) => d.includes(a));
    const staffHasKey = s.includes(key) || aliasList.some((a) => s.includes(a));
    if (deptHasKey && staffHasKey) return true;
  }

  return false;
};

export const StaffDeptsView: React.FC<StaffDeptsViewProps> = ({
  departments: propsDepartments,
  onDepartmentsChange,
  bedOccupancy = [],
  doctors = [],
  nurses = [],
  receptionists = [],
  patients = [],
  appointments = [],
  medicalRecords = [],
  onOpenMessage,
  onSaveMedicalRecord,
  onSavePatientReport,
  onSavePatientPrescription,
  onSavePatientVisitHistory,
  onSaveAppointment,
  onSavePatientBilling,
  onDeletePatientBilling,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [loading, setLoading] = useState<boolean>(false);
  const [refreshSuccess, setRefreshSuccess] = useState<boolean>(false);

  // Live database staff states (when fetching fresh from API)
  const [dbDoctors, setDbDoctors] = useState<Doctor[]>([]);
  const [dbNurses, setDbNurses] = useState<Nurse[]>([]);
  const [dbPatients, setDbPatients] = useState<Patient[]>([]);

  // Departments state with persistent local storage
  const [departments, setDepartments] = useState<DepartmentItem[]>(() => {
    if (propsDepartments && propsDepartments.length > 0) return propsDepartments;
    return getStoredDepartments();
  });

  // Keep synced if prop changes
  useEffect(() => {
    if (propsDepartments && propsDepartments.length > 0) {
      setDepartments(propsDepartments);
    }
  }, [propsDepartments]);

  // Listen to cross-component department updates
  useEffect(() => {
    const handleStorageUpdate = () => {
      setDepartments(getStoredDepartments());
    };
    window.addEventListener('prms_departments_updated', handleStorageUpdate);
    return () => {
      window.removeEventListener('prms_departments_updated', handleStorageUpdate);
    };
  }, []);

  // Save departments to storage on changes & notify parent
  const updateDepartments = useCallback((newDepts: DepartmentItem[] | ((prev: DepartmentItem[]) => DepartmentItem[])) => {
    setDepartments((prev) => {
      const next = typeof newDepts === 'function' ? newDepts(prev) : newDepts;
      saveStoredDepartments(next);
      if (onDepartmentsChange) {
        onDepartmentsChange(next);
      }
      return next;
    });
  }, [onDepartmentsChange]);

  // Modal inspection & profile modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingDept, setEditingDept] = useState<DepartmentItem | null>(null);
  const [selectedDeptForRoster, setSelectedDeptForRoster] = useState<DepartmentItem | null>(null);
  const [rosterTab, setRosterTab] = useState<'doctors' | 'nurses' | 'patients'>('doctors');
  const [rosterSearch, setRosterSearch] = useState('');
  const [deptToDelete, setDeptToDelete] = useState<DepartmentItem | null>(null);

  // Profile Popups for individual users
  const [selectedDoctorForModal, setSelectedDoctorForModal] = useState<Doctor | null>(null);
  const [selectedNurseForModal, setSelectedNurseForModal] = useState<Nurse | null>(null);
  const [selectedPatientForModal, setSelectedPatientForModal] = useState<Patient | null>(null);

  // Form states for Add/Edit
  const [formName, setFormName] = useState('');
  const [formWing, setFormWing] = useState('');
  const [formHead, setFormHead] = useState('');
  const [formHeadDoctorId, setFormHeadDoctorId] = useState<string | undefined>(undefined);
  const [formHeadAvatar, setFormHeadAvatar] = useState<string | undefined>(undefined);
  const [formBeds, setFormBeds] = useState(30);
  const [formOccupied, setFormOccupied] = useState(15);
  const [formExtension, setFormExtension] = useState('Ext. 1000');
  const [formStatus, setFormStatus] = useState<DepartmentItem['status']>('Operational');

  // Debounced Doctor Search in Modal
  const [doctorSearchQuery, setDoctorSearchQuery] = useState('');
  const [debouncedDoctorSearch, setDebouncedDoctorSearch] = useState('');
  const [doctorOptions, setDoctorOptions] = useState<Doctor[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [showDoctorDropdown, setShowDoctorDropdown] = useState(false);
  const [isCustomHead, setIsCustomHead] = useState(false);

  // Debounce effect (300ms) for Doctor Search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedDoctorSearch(doctorSearchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [doctorSearchQuery]);

  // Fetch real data from backend API
  const fetchLiveCounts = useCallback(async () => {
    setLoading(true);
    try {
      const [docRes, nurseRes, patRes] = await Promise.all([
        ApiClient.getDoctors({ limit: 100 }),
        ApiClient.getNurses(),
        ApiClient.getPatients({ limit: 100 }),
      ]);

      if (docRes.success && Array.isArray(docRes.data) && docRes.data.length > 0) {
        setDbDoctors(docRes.data);
      }
      if (nurseRes.success && Array.isArray(nurseRes.data) && nurseRes.data.length > 0) {
        setDbNurses(nurseRes.data);
      }
      if (patRes.success && Array.isArray(patRes.data) && patRes.data.length > 0) {
        setDbPatients(patRes.data);
      }

      setRefreshSuccess(true);
      setTimeout(() => setRefreshSuccess(false), 3000);
    } catch (err: any) {
      console.warn('Live EHR synchronization note:', err?.message || err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch on mount
  useEffect(() => {
    fetchLiveCounts();
  }, [fetchLiveCounts]);

  // Consolidated active list of entities
  const activeDoctors = useMemo(() => {
    if (doctors.length > 0) return doctors;
    if (dbDoctors.length > 0) return dbDoctors;
    return [];
  }, [doctors, dbDoctors]);

  const activeNurses = useMemo(() => {
    if (nurses.length > 0) return nurses;
    if (dbNurses.length > 0) return dbNurses;
    return [];
  }, [nurses, dbNurses]);

  const activePatients = useMemo(() => {
    if (patients.length > 0) return patients;
    if (dbPatients.length > 0) return dbPatients;
    return [];
  }, [patients, dbPatients]);

  // Doctor Selector Options: default 10 doctors, or filtered strictly by Name, ID, or Phone Number
  useEffect(() => {
    if (!showAddModal) return;

    let isMounted = true;
    const fetchDoctorsForSelect = async () => {
      setLoadingDoctors(true);
      try {
        const queryTerm = debouncedDoctorSearch.trim().toLowerCase();

        if (queryTerm) {
          // Filter strictly by doctor name, doctor id, or phone number
          const cleanPhoneQuery = queryTerm.replace(/\D/g, '');
          const filtered = activeDoctors.filter((doc) => {
            const matchesName = doc.name.toLowerCase().includes(queryTerm);
            const matchesId =
              doc.id.toLowerCase().includes(queryTerm) ||
              (doc as any)._id?.toLowerCase().includes(queryTerm) ||
              (doc as any).licenseNumber?.toLowerCase().includes(queryTerm);
            const matchesPhone =
              (doc.phone && doc.phone.toLowerCase().includes(queryTerm)) ||
              (cleanPhoneQuery && doc.phone && doc.phone.replace(/\D/g, '').includes(cleanPhoneQuery));

            return Boolean(matchesName || matchesId || matchesPhone);
          });

          if (filtered.length > 0) {
            if (isMounted) setDoctorOptions(filtered);
            return;
          }

          // Also query backend if not found in local active list
          const res = await ApiClient.getDoctors({ search: queryTerm, limit: 10 });
          if (isMounted && res.success && Array.isArray(res.data)) {
            // Apply strict filter on backend results as well
            const serverFiltered = res.data.filter((doc: any) => {
              const matchesName = doc.name?.toLowerCase().includes(queryTerm);
              const matchesId =
                doc.id?.toLowerCase().includes(queryTerm) ||
                doc._id?.toLowerCase().includes(queryTerm) ||
                doc.licenseNumber?.toLowerCase().includes(queryTerm);
              const matchesPhone =
                (doc.phone && doc.phone.toLowerCase().includes(queryTerm)) ||
                (cleanPhoneQuery && doc.phone && doc.phone.replace(/\D/g, '').includes(cleanPhoneQuery));

              return Boolean(matchesName || matchesId || matchesPhone);
            });
            setDoctorOptions(serverFiltered);
            return;
          }
        }

        // Default: First 10 doctors from active list or API
        if (activeDoctors.length > 0) {
          if (isMounted) setDoctorOptions(activeDoctors.slice(0, 10));
        } else {
          const res = await ApiClient.getDoctors({ limit: 10 });
          if (isMounted && res.success && Array.isArray(res.data)) {
            setDoctorOptions(res.data.slice(0, 10));
          }
        }
      } catch (err) {
        if (isMounted) setDoctorOptions(activeDoctors.slice(0, 10));
      } finally {
        if (isMounted) setLoadingDoctors(false);
      }
    };

    fetchDoctorsForSelect();
    return () => {
      isMounted = false;
    };
  }, [debouncedDoctorSearch, showAddModal, activeDoctors]);

  // Overall calculations across all departments (100% Real Dynamic Data)
  const totalHospitalBeds = useMemo(() => {
    return departments.reduce((acc, d) => acc + (Number(d.totalBeds) || 0), 0);
  }, [departments]);

  const totalOccupiedBeds = useMemo(() => {
    return departments.reduce((acc, d) => acc + (Number(d.occupiedBeds) || 0), 0);
  }, [departments]);

  const overallOccupancyRate = useMemo(() => {
    return totalHospitalBeds > 0 ? Math.round((totalOccupiedBeds / totalHospitalBeds) * 100) : 0;
  }, [totalHospitalBeds, totalOccupiedBeds]);

  const operationalDeptsCount = useMemo(() => {
    return departments.filter((d) => d.status === 'Operational').length;
  }, [departments]);

  const activeDoctorsOnDutyCount = useMemo(() => {
    return activeDoctors.filter((d) => d.status === 'On Duty' || d.status === 'Active').length || activeDoctors.length;
  }, [activeDoctors]);

  const activeNursesOnDutyCount = useMemo(() => {
    return activeNurses.filter((n) => n.status === 'On Duty' || n.status === 'Active').length || activeNurses.length;
  }, [activeNurses]);

  // Filtered department list for display
  const filteredDepartments = useMemo(() => {
    return departments.filter((dept) => {
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        dept.name.toLowerCase().includes(q) ||
        dept.wing.toLowerCase().includes(q) ||
        dept.head.toLowerCase().includes(q) ||
        dept.extension.toLowerCase().includes(q);

      const matchesStatus = statusFilter === 'All' || dept.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [departments, searchTerm, statusFilter]);

  // Modal actions
  const openAddModal = () => {
    setEditingDept(null);
    setFormName('');
    setFormWing('');
    const defaultHead = activeDoctors[0]?.name || 'Dr. Eleanor Vance';
    setFormHead(defaultHead);
    setFormHeadDoctorId(activeDoctors[0]?.id);
    setFormHeadAvatar(activeDoctors[0]?.avatar);
    setFormBeds(30);
    setFormOccupied(14);
    setFormExtension('Ext. ' + (1000 + Math.floor(Math.random() * 8000)));
    setFormStatus('Operational');
    setDoctorSearchQuery('');
    setShowDoctorDropdown(false);
    setIsCustomHead(false);
    setShowAddModal(true);
  };

  const openEditModal = (dept: DepartmentItem) => {
    setEditingDept(dept);
    setFormName(dept.name);
    setFormWing(dept.wing);
    setFormHead(dept.head);
    setFormHeadDoctorId(dept.headDoctorId);
    setFormHeadAvatar(dept.headAvatar);
    setFormBeds(dept.totalBeds);
    setFormOccupied(dept.occupiedBeds);
    setFormExtension(dept.extension);
    setFormStatus(dept.status);
    setDoctorSearchQuery('');
    setShowDoctorDropdown(false);
    setIsCustomHead(false);
    setShowAddModal(true);
  };

  const handleSelectDoctorForHead = (doc: Doctor) => {
    setFormHead(doc.name);
    setFormHeadDoctorId(doc.id);
    setFormHeadAvatar(doc.avatar);
    setShowDoctorDropdown(false);
    setDoctorSearchQuery('');
  };

  const handleSaveDepartment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formWing.trim() || !formHead.trim()) return;

    const parsedTotalBeds = Math.max(1, Number(formBeds) || 20);
    const parsedOccupiedBeds = Math.min(Math.max(0, Number(formOccupied) || 0), parsedTotalBeds);

    if (editingDept) {
      // Update existing department in state & storage
      updateDepartments((prev) =>
        prev.map((d) =>
          d.id === editingDept.id
            ? {
                ...d,
                name: formName.trim(),
                wing: formWing.trim(),
                head: formHead.trim(),
                headDoctorId: formHeadDoctorId,
                headAvatar: formHeadAvatar,
                totalBeds: parsedTotalBeds,
                occupiedBeds: parsedOccupiedBeds,
                extension: formExtension.trim() || 'Ext. 1000',
                status: formStatus,
              }
            : d
        )
      );
    } else {
      // Add new department with user-entered beds
      const newDept: DepartmentItem = {
        id: `dept-${Date.now()}`,
        name: formName.trim(),
        wing: formWing.trim(),
        head: formHead.trim(),
        headDoctorId: formHeadDoctorId,
        headAvatar: formHeadAvatar,
        totalBeds: parsedTotalBeds,
        occupiedBeds: parsedOccupiedBeds,
        extension: formExtension.trim() || 'Ext. 2000',
        status: formStatus,
      };
      updateDepartments((prev) => [newDept, ...prev]);
    }

    setShowAddModal(false);
  };

  const handleDeleteDepartment = () => {
    if (!deptToDelete) return;
    updateDepartments((prev) => prev.filter((d) => d.id !== deptToDelete.id));
    setDeptToDelete(null);
  };

  // Selected department details for roster modal
  const selectedDeptDoctors = useMemo(() => {
    if (!selectedDeptForRoster) return [];
    let list = activeDoctors.filter(
      (d) =>
        matchDepartment(d.department, selectedDeptForRoster.name) ||
        d.name.toLowerCase() === selectedDeptForRoster.head.toLowerCase()
    );

    if (rosterSearch.trim()) {
      const q = rosterSearch.toLowerCase();
      list = list.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.specialty.toLowerCase().includes(q) ||
          d.phone.includes(q) ||
          d.id.toLowerCase().includes(q)
      );
    }
    return list;
  }, [selectedDeptForRoster, activeDoctors, rosterSearch]);

  const selectedDeptNurses = useMemo(() => {
    if (!selectedDeptForRoster) return [];
    let list = activeNurses.filter((n) =>
      matchDepartment(n.department, selectedDeptForRoster.name)
    );

    if (rosterSearch.trim()) {
      const q = rosterSearch.toLowerCase();
      list = list.filter(
        (n) =>
          n.name.toLowerCase().includes(q) ||
          n.role.toLowerCase().includes(q) ||
          n.assignedWard.toLowerCase().includes(q) ||
          n.id.toLowerCase().includes(q)
      );
    }
    return list;
  }, [selectedDeptForRoster, activeNurses, rosterSearch]);

  const selectedDeptPatients = useMemo(() => {
    if (!selectedDeptForRoster) return [];
    let list = activePatients.filter((p) =>
      matchDepartment(p.department, selectedDeptForRoster.name)
    );

    if (rosterSearch.trim()) {
      const q = rosterSearch.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.patientCode.toLowerCase().includes(q) ||
          p.room.toLowerCase().includes(q) ||
          p.doctor.toLowerCase().includes(q)
      );
    }
    return list;
  }, [selectedDeptForRoster, activePatients, rosterSearch]);

  return (
    <div className="p-3.5 sm:p-6 lg:p-8 max-w-[1700px] mx-auto space-y-5 sm:space-y-6">
      {/* Header Banner & Global Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center space-x-3">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-teal-50 border border-teal-200/80 flex items-center justify-center text-teal-800 shrink-0 shadow-2xs">
            <Building2 className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <h1 className="text-lg sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Staff & Department Operations</span>
              {loading && <Loader2 className="w-4 h-4 text-teal-700 animate-spin" />}
              {refreshSuccess && (
                <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                  <Check className="w-3 h-3" /> Synced with Database
                </span>
              )}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Live hospital wing allocation, bed capacity monitoring, and real-time medical staff rosters.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <button
            onClick={fetchLiveCounts}
            disabled={loading}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 sm:py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl shadow-xs transition disabled:opacity-50 cursor-pointer text-xs font-semibold h-10 sm:h-auto"
            title="Refresh staff counts from backend database"
          >
            <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync Database</span>
          </button>
          <button
            onClick={openAddModal}
            className="flex-1 sm:flex-none flex items-center justify-center space-x-1.5 px-4 py-2 sm:py-2.5 bg-teal-800 hover:bg-teal-900 text-white text-xs font-semibold rounded-xl shadow-xs transition cursor-pointer h-10 sm:h-auto whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Add Department Wing</span>
          </button>
        </div>
      </div>

      {/* Overview Stat Cards Grid (100% Dynamic Real Data) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Card 1: Active Departments */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center space-x-3.5 sm:space-x-4">
          <div className="p-3 sm:p-3.5 bg-teal-50 text-teal-800 rounded-xl sm:rounded-2xl shrink-0">
            <Building2 className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] sm:text-xs font-medium text-slate-400 uppercase tracking-wider truncate">
              Active Departments
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-0.5">
              {departments.length} Units
            </div>
            <div className="text-[11px] text-teal-700 font-semibold mt-0.5 flex items-center gap-1 truncate">
              <CheckCircle2 className="w-3 h-3 shrink-0" /> {operationalDeptsCount} Operational Units
            </div>
          </div>
        </div>

        {/* Card 2: Hospital Bed Occupancy */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center space-x-3.5 sm:space-x-4">
          <div className="p-3 sm:p-3.5 bg-blue-50 text-blue-700 rounded-xl sm:rounded-2xl shrink-0">
            <BedDouble className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] sm:text-xs font-medium text-slate-400 uppercase tracking-wider truncate">
              Ward Bed Occupancy
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-0.5 truncate">
              {overallOccupancyRate}%{' '}
              <span className="text-xs text-slate-400 font-normal">
                ({totalOccupiedBeds}/{totalHospitalBeds})
              </span>
            </div>
            <div className="text-[11px] text-blue-600 font-semibold mt-0.5 truncate">
              {Math.max(0, totalHospitalBeds - totalOccupiedBeds)} Beds Available
            </div>
          </div>
        </div>

        {/* Card 3: Attending Physicians */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center space-x-3.5 sm:space-x-4">
          <div className="p-3 sm:p-3.5 bg-emerald-50 text-emerald-700 rounded-xl sm:rounded-2xl shrink-0">
            <Stethoscope className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] sm:text-xs font-medium text-slate-400 uppercase tracking-wider truncate">
              Attending Physicians
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-0.5">
              {activeDoctors.length} Doctors
            </div>
            <div className="text-[11px] text-emerald-600 font-semibold mt-0.5 truncate">
              {activeDoctorsOnDutyCount} Active on Duty
            </div>
          </div>
        </div>

        {/* Card 4: Nursing Staff */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center space-x-3.5 sm:space-x-4">
          <div className="p-3 sm:p-3.5 bg-purple-50 text-purple-700 rounded-xl sm:rounded-2xl shrink-0">
            <HeartPulse className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] sm:text-xs font-medium text-slate-400 uppercase tracking-wider truncate">
              Nursing Staff Coverage
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-0.5">
              {activeNurses.length} Nurses
            </div>
            <div className="text-[11px] text-purple-600 font-semibold mt-0.5 truncate">
              {activeNursesOnDutyCount} On Duty Across Wards
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search department, wing, extension, or head doctor..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-800/20"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 no-scrollbar">
          {['All', 'Operational', 'High Occupancy', 'Emergency Priority', 'Maintenance'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors shrink-0 cursor-pointer whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-teal-800 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Department Cards Responsive Grid (Real Fetched Doctors, Nurses, and User-Entered Beds) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredDepartments.map((dept) => {
          const occupancyRate =
            dept.totalBeds > 0 ? Math.round((dept.occupiedBeds / dept.totalBeds) * 100) : 0;
          const isHighOccupancy = occupancyRate >= 80;

          // Real matched doctors & nurses strictly from database
          const realDocs = activeDoctors.filter((d) => matchDepartment(d.department, dept.name));
          const realNurses = activeNurses.filter((n) => matchDepartment(n.department, dept.name));

          // Real matched head doctor avatar
          const matchedDoctor =
            activeDoctors.find((d) => d.id === dept.headDoctorId) ||
            activeDoctors.find((d) => d.name.toLowerCase() === dept.head.toLowerCase());
          const displayHeadAvatar = dept.headAvatar || matchedDoctor?.avatar;

          return (
            <div
              key={dept.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs flex flex-col justify-between hover:border-teal-400 hover:shadow-md transition space-y-4 relative group"
            >
              <div className="space-y-3.5">
                {/* Card Top: Department Name, Wing, & Actions */}
                <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-800 border border-teal-200/60 flex items-center justify-center shrink-0 font-bold shadow-2xs">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-slate-900 text-sm leading-snug truncate" title={dept.name}>
                        {dept.name}
                      </h3>
                      <div className="text-[11px] text-slate-500 font-medium truncate" title={dept.wing}>
                        {dept.wing}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1 shrink-0">
                    <button
                      onClick={() => openEditModal(dept)}
                      className="p-1.5 text-slate-400 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition cursor-pointer"
                      title="Edit Department Details"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeptToDelete(dept)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                      title="Delete Department"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Status Badge & Extension Bar */}
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                      dept.status === 'Emergency Priority'
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : dept.status === 'High Occupancy'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : dept.status === 'Maintenance'
                        ? 'bg-slate-100 text-slate-600 border-slate-300'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}
                  >
                    {dept.status}
                  </span>

                  <span className="font-mono text-[11px] text-slate-500 font-medium flex items-center gap-1">
                    <Phone className="w-3 h-3 text-slate-400" /> {dept.extension}
                  </span>
                </div>

                {/* Head Physician with Live Avatar & Name */}
                <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-100 text-xs flex items-center justify-between gap-2">
                  <div className="flex items-center space-x-2.5 min-w-0">
                    {displayHeadAvatar ? (
                      <img
                        src={displayHeadAvatar}
                        alt={dept.head}
                        className="w-7 h-7 rounded-full object-cover border border-teal-200 shrink-0"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-[10px] shrink-0">
                        {dept.head.replace(/^Dr\.\s*/i, '').charAt(0) || 'D'}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">Head Physician</div>
                      <div className="font-bold text-slate-900 truncate text-xs" title={dept.head}>
                        {dept.head}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200/60 shrink-0">
                    Lead
                  </span>
                </div>

                {/* Live Real Staff Counts Fetched from Database */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1 truncate">
                      <Stethoscope className="w-3.5 h-3.5 text-teal-700 shrink-0" /> Doctors
                    </span>
                    <span className="font-bold text-slate-900 text-xs font-mono ml-1">
                      {realDocs.length}
                    </span>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1 truncate">
                      <HeartPulse className="w-3.5 h-3.5 text-purple-600 shrink-0" /> Nurses
                    </span>
                    <span className="font-bold text-slate-900 text-xs font-mono ml-1">
                      {realNurses.length}
                    </span>
                  </div>
                </div>

                {/* Bed Occupancy Bar (Directly Reflects User-Entered Beds) */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 font-medium">Ward Bed Occupancy</span>
                    <span className={`font-bold font-mono ${isHighOccupancy ? 'text-amber-700' : 'text-slate-800'}`}>
                      {dept.occupiedBeds} / {dept.totalBeds} ({occupancyRate}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        occupancyRate >= 90
                          ? 'bg-rose-500'
                          : occupancyRate >= 75
                          ? 'bg-amber-500'
                          : 'bg-teal-700'
                      }`}
                      style={{ width: `${Math.min(occupancyRate, 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Action Footer: Open Department Roster Modal */}
              <button
                onClick={() => {
                  setSelectedDeptForRoster(dept);
                  setRosterTab('doctors');
                  setRosterSearch('');
                }}
                className="w-full py-2 px-3 bg-slate-50 hover:bg-teal-50 text-slate-700 hover:text-teal-900 font-semibold text-xs rounded-xl border border-slate-200/80 transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs group-hover:border-teal-300"
              >
                <span>View Department Roster</span>
                <ChevronRight className="w-3.5 h-3.5 text-teal-700 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Department Wing Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-4 sm:p-6 shadow-2xl border border-slate-200 space-y-4 my-auto max-h-[95vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-teal-700" />
                <span>{editingDept ? 'Edit Department Wing' : 'Add New Department Wing'}</span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDepartment} className="space-y-3.5 text-xs overflow-y-auto pr-1">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Department Name</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                  placeholder="e.g. Oncology & Hematology"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-700/20"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Wing / Floor Location</label>
                <input
                  type="text"
                  value={formWing}
                  onChange={(e) => setFormWing(e.target.value)}
                  required
                  placeholder="e.g. South Tower - Floor 5"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-700/20"
                />
              </div>

              {/* Head Physician Selector: Default 10 Doctors + Debounced Search by Name, Doctor ID, and Phone Number */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-slate-700 font-semibold">Department Head Physician</label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomHead(!isCustomHead);
                      setShowDoctorDropdown(false);
                    }}
                    className="text-[11px] text-teal-700 hover:underline font-semibold cursor-pointer"
                  >
                    {isCustomHead ? 'Select from Database' : 'Enter Custom Name'}
                  </button>
                </div>

                {!isCustomHead ? (
                  <div className="relative">
                    {/* Selected Doctor Card / Dropdown Trigger */}
                    <div
                      onClick={() => setShowDoctorDropdown(!showDoctorDropdown)}
                      className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl p-2.5 flex items-center justify-between cursor-pointer transition"
                    >
                      <div className="flex items-center space-x-2.5 min-w-0">
                        {formHeadAvatar ? (
                          <img
                            src={formHeadAvatar}
                            alt={formHead}
                            className="w-7 h-7 rounded-full object-cover border border-teal-200 shrink-0"
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xs shrink-0">
                            <Stethoscope className="w-3.5 h-3.5" />
                          </div>
                        )}
                        <div className="min-w-0 text-left">
                          <div className="font-bold text-slate-900 text-xs truncate">
                            {formHead || 'Select Head Physician...'}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate">
                            {formHeadDoctorId ? `Doctor ID: ${formHeadDoctorId}` : 'Assigned Clinical Lead'}
                          </div>
                        </div>
                      </div>
                      <span className="text-[11px] text-teal-700 font-semibold shrink-0">
                        {showDoctorDropdown ? 'Close List' : 'Change Doctor'}
                      </span>
                    </div>

                    {/* Search & Selection Dropdown */}
                    {showDoctorDropdown && (
                      <div className="mt-2 bg-white rounded-2xl border border-slate-200 shadow-xl p-3 space-y-2 max-h-64 overflow-hidden flex flex-col">
                        {/* Debounced Search Bar - Filter by Name, Doctor ID, and Phone */}
                        <div className="relative shrink-0">
                          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            value={doctorSearchQuery}
                            onChange={(e) => setDoctorSearchQuery(e.target.value)}
                            placeholder="Search by doctor name, ID, or phone number..."
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-7 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-700/20"
                            autoFocus
                          />
                          {loadingDoctors && (
                            <Loader2 className="w-3.5 h-3.5 text-teal-700 animate-spin absolute right-2.5 top-1/2 -translate-y-1/2" />
                          )}
                        </div>

                        {/* List of 10 Doctors or Searched Results */}
                        <div className="overflow-y-auto space-y-1.5 pr-1 flex-1">
                          {doctorOptions.length > 0 ? (
                            doctorOptions.map((doc) => {
                              const isSelected = formHead === doc.name || formHeadDoctorId === doc.id;
                              return (
                                <div
                                  key={doc.id}
                                  onClick={() => handleSelectDoctorForHead(doc)}
                                  className={`p-2 rounded-xl border transition flex items-center justify-between cursor-pointer ${
                                    isSelected
                                      ? 'bg-teal-50 border-teal-300 text-teal-950'
                                      : 'bg-white hover:bg-slate-50 border-slate-200/80 text-slate-700'
                                  }`}
                                >
                                  <div className="flex items-center space-x-2.5 min-w-0">
                                    <img
                                      src={doc.avatar || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=100'}
                                      alt={doc.name}
                                      className="w-7 h-7 rounded-full object-cover border border-slate-200 shrink-0"
                                    />
                                    <div className="min-w-0">
                                      <div className="font-bold text-xs truncate">{doc.name}</div>
                                      <div className="text-[10px] text-slate-500 truncate">
                                        ID: {doc.id} · {doc.phone || 'No Phone'}
                                      </div>
                                    </div>
                                  </div>

                                  {isSelected && (
                                    <Check className="w-4 h-4 text-teal-700 shrink-0 ml-2" />
                                  )}
                                </div>
                              );
                            })
                          ) : (
                            <div className="p-4 text-center text-slate-400 text-xs">
                              {loadingDoctors ? 'Searching database...' : 'No doctor found matching name, ID, or phone.'}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <input
                    type="text"
                    value={formHead}
                    onChange={(e) => {
                      setFormHead(e.target.value);
                      setFormHeadDoctorId(undefined);
                      setFormHeadAvatar(undefined);
                    }}
                    required
                    placeholder="e.g. Dr. Eleanor Vance"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-700/20"
                  />
                )}
              </div>

              {/* Total Beds & Occupied Beds Fields */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Total Bed Capacity</label>
                  <input
                    type="number"
                    min="1"
                    value={formBeds}
                    onChange={(e) => setFormBeds(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-700/20"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Currently Occupied</label>
                  <input
                    type="number"
                    min="0"
                    value={formOccupied}
                    onChange={(e) => setFormOccupied(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-700/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Phone Extension</label>
                  <input
                    type="text"
                    value={formExtension}
                    onChange={(e) => setFormExtension(e.target.value)}
                    placeholder="Ext. 3000"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-700/20"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Operating Status</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-700/20 cursor-pointer"
                  >
                    <option value="Operational">Operational</option>
                    <option value="High Occupancy">High Occupancy</option>
                    <option value="Emergency Priority">Emergency Priority</option>
                    <option value="Maintenance">Maintenance</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-800 hover:bg-teal-900 text-white font-semibold rounded-xl transition cursor-pointer"
                >
                  Save Department Wing
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Comprehensive Department Roster Inspection Modal with Direct User Profile Openers */}
      {selectedDeptForRoster && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-4 sm:p-6 shadow-2xl border border-slate-200 space-y-4 my-auto max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5 shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-800 border border-teal-200/80 flex items-center justify-center font-bold">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                    <span>{selectedDeptForRoster.name}</span>
                    <span className="text-[11px] font-normal text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200/60">
                      {selectedDeptForRoster.wing}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                    <span>Head: <strong>{selectedDeptForRoster.head}</strong></span>
                    <span>·</span>
                    <span>{selectedDeptForRoster.extension}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedDeptForRoster(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Department Quick Stats Strip */}
            <div className="grid grid-cols-3 gap-2.5 text-xs shrink-0">
              <div className="bg-teal-50/70 p-2.5 rounded-xl border border-teal-100 text-center">
                <div className="text-[10px] text-teal-800 font-bold uppercase">Doctors Linked</div>
                <div className="text-lg font-extrabold text-teal-900 mt-0.5">
                  {selectedDeptDoctors.length}
                </div>
              </div>
              <div className="bg-purple-50/70 p-2.5 rounded-xl border border-purple-100 text-center">
                <div className="text-[10px] text-purple-800 font-bold uppercase">Nurses Linked</div>
                <div className="text-lg font-extrabold text-purple-900 mt-0.5">
                  {selectedDeptNurses.length}
                </div>
              </div>
              <div className="bg-blue-50/70 p-2.5 rounded-xl border border-blue-100 text-center">
                <div className="text-[10px] text-blue-800 font-bold uppercase">Bed Occupancy</div>
                <div className="text-lg font-extrabold text-blue-900 mt-0.5">
                  {selectedDeptForRoster.occupiedBeds}/{selectedDeptForRoster.totalBeds}
                </div>
              </div>
            </div>

            {/* In-Modal Search & Tab Navigation */}
            <div className="space-y-2 shrink-0">
              <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
                <button
                  onClick={() => setRosterTab('doctors')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                    rosterTab === 'doctors'
                      ? 'bg-teal-800 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Stethoscope className="w-3.5 h-3.5" />
                  <span>Attending Doctors ({selectedDeptDoctors.length})</span>
                </button>

                <button
                  onClick={() => setRosterTab('nurses')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                    rosterTab === 'nurses'
                      ? 'bg-teal-800 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <HeartPulse className="w-3.5 h-3.5" />
                  <span>Nursing Staff ({selectedDeptNurses.length})</span>
                </button>

                <button
                  onClick={() => setRosterTab('patients')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                    rosterTab === 'patients'
                      ? 'bg-teal-800 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Active Patients ({selectedDeptPatients.length})</span>
                </button>
              </div>

              {/* Roster Quick Filter Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={rosterSearch}
                  onChange={(e) => setRosterSearch(e.target.value)}
                  placeholder={`Search within ${selectedDeptForRoster.name} roster...`}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-700/20"
                />
              </div>
            </div>

            {/* Modal Body with Direct User Profile Openers */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
              {rosterTab === 'doctors' && (
                <div className="space-y-2.5">
                  {selectedDeptDoctors.length > 0 ? (
                    selectedDeptDoctors.map((doc) => (
                      <div
                        key={doc.id}
                        className="p-3 bg-white rounded-xl border border-slate-200/90 hover:border-teal-400 transition flex items-center justify-between gap-3 shadow-2xs"
                      >
                        <div className="flex items-center space-x-3 min-w-0">
                          <img
                            src={doc.avatar || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=100'}
                            alt={doc.name}
                            className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 text-sm truncate flex items-center gap-1.5">
                              <span>{doc.name}</span>
                              <span
                                className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                                  doc.status === 'On Duty'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                }`}
                              >
                                {doc.status || 'Active'}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 truncate">{doc.specialty || doc.degrees}</div>
                            <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                              <span className="flex items-center gap-0.5 text-amber-500 font-bold">
                                <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> {doc.rating || '4.9'}
                              </span>
                              <span>·</span>
                              <span>{doc.phone}</span>
                            </div>
                          </div>
                        </div>

                        {/* Direct Button to open Doctor Profile Modal */}
                        <button
                          onClick={() => setSelectedDoctorForModal(doc)}
                          className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-200/80 rounded-xl font-semibold text-xs transition shrink-0 cursor-pointer flex items-center gap-1 shadow-2xs"
                        >
                          <span>View Profile</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 bg-slate-50 rounded-2xl border border-slate-200/80 text-center text-slate-500">
                      <Stethoscope className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                      <p className="font-semibold text-slate-700">No doctors matched in this department view.</p>
                      <p className="text-[11px] text-slate-400 mt-1">General medical officers are on-call across the {selectedDeptForRoster.wing}.</p>
                    </div>
                  )}
                </div>
              )}

              {rosterTab === 'nurses' && (
                <div className="space-y-2.5">
                  {selectedDeptNurses.length > 0 ? (
                    selectedDeptNurses.map((nurse) => (
                      <div
                        key={nurse.id}
                        className="p-3 bg-white rounded-xl border border-slate-200/90 hover:border-teal-400 transition flex items-center justify-between gap-3 shadow-2xs"
                      >
                        <div className="flex items-center space-x-3 min-w-0">
                          <img
                            src={nurse.avatar || 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=100'}
                            alt={nurse.name}
                            className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 text-sm truncate flex items-center gap-1.5">
                              <span>{nurse.name}</span>
                              <span className="text-[10px] px-1.5 py-0.2 bg-purple-50 text-purple-700 border border-purple-200 rounded-full font-semibold">
                                {nurse.status || 'On Duty'}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 truncate">{nurse.role} · Ward: {nurse.assignedWard}</div>
                            <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" /> {nurse.shift}
                              </span>
                              <span>·</span>
                              <span>Load: {nurse.patientLoad} patients</span>
                            </div>
                          </div>
                        </div>

                        {/* Direct Button to open Nurse Profile Modal */}
                        <button
                          onClick={() => setSelectedNurseForModal(nurse)}
                          className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200/80 rounded-xl font-semibold text-xs transition shrink-0 cursor-pointer flex items-center gap-1 shadow-2xs"
                        >
                          <span>View Profile</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 bg-slate-50 rounded-2xl border border-slate-200/80 text-center text-slate-500">
                      <HeartPulse className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                      <p className="font-semibold text-slate-700">No nurses assigned specifically to this department filter.</p>
                      <p className="text-[11px] text-slate-400 mt-1">Ward floor nurses operate round-the-clock rotations.</p>
                    </div>
                  )}
                </div>
              )}

              {rosterTab === 'patients' && (
                <div className="space-y-2.5">
                  {selectedDeptPatients.length > 0 ? (
                    selectedDeptPatients.map((pat) => (
                      <div
                        key={pat.id}
                        className="p-3 bg-white rounded-xl border border-slate-200/90 hover:border-teal-400 transition flex items-center justify-between gap-3 shadow-2xs"
                      >
                        <div className="flex items-center space-x-3 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center font-bold text-xs shrink-0">
                            {pat.name.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 text-sm truncate flex items-center gap-1.5">
                              <span>{pat.name}</span>
                              <span className="text-[10px] text-teal-800 font-mono font-bold bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200/60">
                                {pat.patientCode}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 truncate">
                              Room: <strong>{pat.room}</strong> · Attending: {pat.doctor}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              Status: <span className="font-semibold text-slate-700">{pat.status}</span> · Condition: {pat.condition}
                            </div>
                          </div>
                        </div>

                        {/* Direct Button to open Patient EHR Profile Modal */}
                        <button
                          onClick={() => setSelectedPatientForModal(pat)}
                          className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-200/80 rounded-xl font-semibold text-xs transition shrink-0 cursor-pointer flex items-center gap-1 shadow-2xs"
                        >
                          <span>View Profile</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 bg-slate-50 rounded-2xl border border-slate-200/80 text-center text-slate-500">
                      <Users className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                      <p className="font-semibold text-slate-700">No patients currently admitted under this department.</p>
                      <p className="text-[11px] text-slate-400 mt-1">Check hospital bed allocation and outpatient scheduling.</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 shrink-0 text-xs">
              <span className="text-slate-400 text-[11px]">
                Showing real records from Hospital Clinical Directory
              </span>
              <button
                onClick={() => setSelectedDeptForRoster(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition cursor-pointer"
              >
                Close Summary
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Doctor Profile Modal popup */}
      {selectedDoctorForModal && (
        <DoctorDetailModal
          doctor={selectedDoctorForModal}
          patients={activePatients}
          onClose={() => setSelectedDoctorForModal(null)}
          onOpenMessage={(name, id, role) => {
            if (onOpenMessage) onOpenMessage(name, id, role);
            setSelectedDoctorForModal(null);
          }}
          onViewPatientDetails={(pat) => {
            setSelectedDoctorForModal(null);
            setSelectedPatientForModal(pat);
          }}
        />
      )}

      {/* Nurse Profile Modal popup */}
      {selectedNurseForModal && (
        <NurseDetailModal
          nurse={selectedNurseForModal}
          patients={activePatients}
          onClose={() => setSelectedNurseForModal(null)}
          onOpenMessage={(name, id, role) => {
            if (onOpenMessage) onOpenMessage(name, id, role);
            setSelectedNurseForModal(null);
          }}
          onViewPatientDetails={(pat) => {
            setSelectedNurseForModal(null);
            setSelectedPatientForModal(pat);
          }}
        />
      )}

      {/* Patient EHR Profile Modal popup */}
      {selectedPatientForModal && (
        <PatientDetailModal
          patient={selectedPatientForModal}
          onClose={() => setSelectedPatientForModal(null)}
          appointments={appointments}
          medicalRecords={medicalRecords}
          onOpenMessage={onOpenMessage}
          onSaveMedicalRecord={onSaveMedicalRecord}
          onSavePatientReport={onSavePatientReport}
          onSavePatientPrescription={onSavePatientPrescription}
          onSavePatientVisitHistory={onSavePatientVisitHistory}
          onSaveAppointment={onSaveAppointment}
          onSavePatientBilling={onSavePatientBilling}
          onDeletePatientBilling={onDeletePatientBilling}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deptToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center space-x-3 text-rose-600">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-lg font-bold text-slate-900">Remove Department Wing</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to remove <strong className="text-slate-900">{deptToDelete.name}</strong> ({deptToDelete.wing})? All associated clinical staff records will remain in the database.
            </p>
            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setDeptToDelete(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteDepartment}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl text-xs transition cursor-pointer"
              >
                Remove Wing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
