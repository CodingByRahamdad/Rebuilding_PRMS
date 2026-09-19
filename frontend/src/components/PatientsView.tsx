import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Search,
  Plus,
  Filter,
  Phone,
  Mail,
  User,
  HeartPulse,
  Calendar,
  X,
  FileText,
  Eye,
  Edit2,
  Trash2,
  AlertTriangle,
  RotateCw,
  Loader2,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import {
  Patient,
  Appointment,
  MedicalRecord,
  Prescription,
  VisitHistoryItem,
  PatientBillingRecord,
  PatientReport,
} from '../types';
import { PatientDetailModal } from './PatientDetailModal';
import { ApiClient } from '../services/apiClient';
import { isDemoMode } from '../utils/demoMode';

interface PatientsViewProps {
  patients: Patient[];
  onOpenNewPatient: () => void;
  onUpdatePatientStatus: (patientId: string, status: Patient['status']) => void;
  appointments: Appointment[];
  medicalRecords: MedicalRecord[];
  onOpenMessage?: (staffName: string, staffId: string, role: string) => void;
  onEditPatient?: (patient: Patient) => void;
  onDeletePatient?: (patientId: string) => void;
  onSaveMedicalRecord?: (record: MedicalRecord) => void;
  onSavePatientReport?: (patientId: string, report: PatientReport) => void;
  onSavePatientPrescription?: (patientId: string, prescription: Prescription) => void;
  onSavePatientVisitHistory?: (patientId: string, visit: VisitHistoryItem) => void;
  onSaveAppointment?: (appointment: Appointment) => void;
  onSavePatientBilling?: (patientId: string, invoice: PatientBillingRecord) => void;
}

export const PatientsView: React.FC<PatientsViewProps> = ({
  patients: initialPatients,
  onOpenNewPatient,
  onUpdatePatientStatus,
  appointments,
  medicalRecords,
  onOpenMessage,
  onEditPatient,
  onDeletePatient,
  onSaveMedicalRecord,
  onSavePatientReport,
  onSavePatientPrescription,
  onSavePatientVisitHistory,
  onSaveAppointment,
  onSavePatientBilling,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patientToDelete, setPatientToDelete] = useState<Patient | null>(null);

  // Pagination states (strictly 15 patients per fetch/page)
  const PAGE_SIZE = 15;
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPatients, setTotalPatients] = useState<number>(() =>
    isDemoMode() && initialPatients ? initialPatients.length : 0
  );
  const [totalPages, setTotalPages] = useState<number>(() =>
    Math.ceil((isDemoMode() && initialPatients ? initialPatients.length : 0) / PAGE_SIZE) || 1
  );

  const [livePatients, setLivePatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Helper to format API item to Patient object
  const formatApiPatient = (item: any, idx: number): Patient => ({
    id: item.id || item._id || `p-${idx}`,
    patientCode: item.patientCode || `PT-0${1001 + idx}`,
    name: item.name || 'Anonymous Patient',
    age:
      item.age !== undefined && item.age !== null && Number(item.age) > 0
        ? Number(item.age)
        : item.dateOfBirth &&
          item.dateOfBirth.length >= 4 &&
          new Date().getFullYear() - new Date(item.dateOfBirth).getFullYear() > 0
        ? new Date().getFullYear() - new Date(item.dateOfBirth).getFullYear()
        : 35,
    gender: item.gender || 'Female',
    department: item.department || 'Cardiology',
    doctor: item.doctor || 'Dr. Sarah Jenkins',
    room: item.room || 'Bed 102',
    status: item.status || 'Admitted',
    admissionDate:
      item.admissionDate ||
      (item.createdAt ? new Date(item.createdAt).toISOString().split('T')[0] : '2026-07-28'),
    bloodType: item.bloodGroup || item.bloodType || 'O+',
    condition:
      item.condition ||
      (Array.isArray(item.medicalHistory) && item.medicalHistory.length > 0
        ? typeof item.medicalHistory[0] === 'string'
          ? item.medicalHistory[0]
          : item.medicalHistory[0]?.diagnosis
        : 'Observation'),
    phone: item.phone || '+1 (555) 234-5678',
    email: item.email || 'patient@example.com',
    avatar: item.avatar || '',
    address: item.address || 'Hospital Ward',
    emergencyContact: item.emergencyContact
      ? {
          name: item.emergencyContact.name,
          relation:
            item.emergencyContact.relationship || item.emergencyContact.relation || 'Spouse',
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
  });

  // Fetch 15 patients from REST API for the specified page
  const fetchPatients = useCallback(
    async (pageToFetch = currentPage, term = searchTerm, status = statusFilter) => {
      setLoading(true);
      setError(null);
      try {
        const res = await ApiClient.getPatients({
          page: pageToFetch,
          limit: PAGE_SIZE,
          search: term.trim() || undefined,
          status: status !== 'All' ? status : undefined,
        });

        if (res.success && Array.isArray(res.data)) {
          const formatted = res.data.map(formatApiPatient);
          setLivePatients(formatted);

          if (res.meta) {
            setTotalPatients(res.meta.total ?? formatted.length);
            setTotalPages(res.meta.totalPages ?? Math.max(1, Math.ceil((res.meta.total || formatted.length) / PAGE_SIZE)));
          } else {
            // Fallback calculation if meta isn't populated
            const total = res.data.length;
            setTotalPatients(total);
            setTotalPages(Math.max(1, Math.ceil(total / PAGE_SIZE)));
          }
        } else {
          if (isDemoMode()) {
            fallbackLocalPagination(pageToFetch, term, status);
          } else {
            setLivePatients([]);
            setTotalPatients(0);
            setTotalPages(1);
          }
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load patient records');
        if (isDemoMode()) {
          fallbackLocalPagination(pageToFetch, term, status);
        } else {
          setLivePatients([]);
          setTotalPatients(0);
          setTotalPages(1);
        }
      } finally {
        setLoading(false);
      }
    },
    [currentPage, searchTerm, statusFilter, initialPatients]
  );

  // Local fallback pagination handler
  const fallbackLocalPagination = (pageToFetch: number, term: string, status: string) => {
    const list = initialPatients || [];
    const filtered = list.filter((patient) => {
      const matchesSearch =
        !term.trim() ||
        patient.name.toLowerCase().includes(term.toLowerCase()) ||
        patient.patientCode.toLowerCase().includes(term.toLowerCase()) ||
        patient.department.toLowerCase().includes(term.toLowerCase());

      const matchesStatus = status === 'All' || patient.status === status;
      return matchesSearch && matchesStatus;
    });

    const total = filtered.length;
    const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    setTotalPatients(total);
    setTotalPages(pages);

    const safePage = Math.min(Math.max(1, pageToFetch), pages);
    const startIdx = (safePage - 1) * PAGE_SIZE;
    const paginatedSlice = filtered.slice(startIdx, startIdx + PAGE_SIZE);
    setLivePatients(paginatedSlice);
  };

  // Fetch when page, search, or status filter changes
  useEffect(() => {
    fetchPatients(currentPage, searchTerm, statusFilter);
  }, [currentPage, statusFilter, fetchPatients]);

  // When search changes, debounce and reset to page 1
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
      fetchPatients(1, searchTerm, statusFilter);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleStatusFilterChange = (status: string) => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages || newPage === currentPage) return;
    setCurrentPage(newPage);
  };

  const handleDeleteConfirm = async () => {
    if (!patientToDelete) return;
    setIsDeleting(true);
    try {
      await ApiClient.deletePatient(patientToDelete.id);
      if (onDeletePatient) {
        onDeletePatient(patientToDelete.id);
      }
      // Re-fetch current page to update 15 items
      fetchPatients(currentPage, searchTerm, statusFilter);
    } catch (err) {
      console.error('Delete failed:', err);
    } finally {
      setIsDeleting(false);
      setPatientToDelete(null);
    }
  };

  // Compute display range for pagination footer
  const startIndex = totalPatients === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const endIndex = Math.min(currentPage * PAGE_SIZE, totalPatients);

  // Generate page numbers for pagination bar
  const pageNumbers = useMemo(() => {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }, [currentPage, totalPages]);

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Patients Directory</span>
            {loading && <Loader2 className="w-5 h-5 text-teal-700 animate-spin" />}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage patient admissions, outpatient schedules, medical records, medicines, and billing (15 patients per page).
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => fetchPatients(currentPage, searchTerm, statusFilter)}
            disabled={loading}
            className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl shadow-xs transition-colors disabled:opacity-50"
            title="Refresh patient list from API"
          >
            <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={onOpenNewPatient}
            className="flex items-center space-x-2 px-4 py-2.5 bg-teal-800 hover:bg-teal-900 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Register New Patient</span>
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs text-amber-900">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Notice: API fetch issue ({error}). Displaying available records.</span>
          </div>
          <button onClick={() => fetchPatients(currentPage, searchTerm, statusFilter)} className="underline font-semibold hover:text-amber-950">Retry</button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, ID, department..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center space-x-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 no-scrollbar">
          <Filter className="w-4 h-4 text-slate-400 shrink-0 mr-1" />
          {['All', 'Admitted', 'Outpatient', 'Emergency', 'Discharged'].map((status) => (
            <button
              key={status}
              onClick={() => handleStatusFilterChange(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                statusFilter === status
                  ? 'bg-teal-800 text-white font-semibold shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Table / Loading / Empty State */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading && livePatients.length === 0 ? (
          <div className="py-20 text-center text-slate-400">
            <Loader2 className="w-8 h-8 mx-auto mb-3 text-teal-700 animate-spin" />
            <p className="text-xs font-medium text-slate-600">Loading patient directory (15 per page)...</p>
          </div>
        ) : livePatients.length === 0 ? (
          <div className="py-20 text-center text-slate-400">
            <UserCheck className="w-10 h-10 mx-auto mb-3 text-slate-300" />
            <p className="text-sm font-semibold text-slate-700">No patient records found</p>
            <p className="text-xs text-slate-500 mt-1">Try adjusting your search terms or filter parameters.</p>
            {(searchTerm || statusFilter !== 'All') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('All');
                  setCurrentPage(1);
                }}
                className="mt-4 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition"
              >
                Reset Filters
              </button>
            )}
          </div>
        ) : (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[850px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3.5 px-4 whitespace-nowrap">Patient</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">Demographics</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">Department & Doctor</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">Condition & Room</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">Status</th>
                    <th className="py-3.5 px-4 text-right whitespace-nowrap min-w-[120px]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {livePatients.map((patient) => (
                    <tr
                      key={patient.id}
                      onClick={() => setSelectedPatient(patient)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              patient.avatar ||
                              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                patient.name
                              )}&background=0D9488&color=fff&size=80`
                            }
                            alt={patient.name}
                            className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 text-xs group-hover:text-teal-700 transition truncate">
                              {patient.name}
                            </div>
                            <div className="font-mono text-[11px] font-semibold text-slate-500">
                              {patient.patientCode}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="text-slate-700 font-medium">{patient.age} yrs · {patient.gender}</div>
                        <div className="text-[11px] text-red-600 font-semibold">Blood {patient.bloodType}</div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-800">{patient.department}</div>
                        <div className="text-[11px] text-teal-700 font-medium">{patient.doctor}</div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-medium text-slate-800">{patient.condition}</div>
                        <div className="text-[11px] text-slate-400">{patient.room}</div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                            patient.status === 'Admitted'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : patient.status === 'Emergency'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : patient.status === 'Outpatient'
                              ? 'bg-teal-50 text-teal-800 border-teal-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          {patient.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5 flex-nowrap shrink-0">
                          {onEditPatient && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onEditPatient(patient);
                              }}
                              className="w-8 h-8 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200 inline-flex items-center justify-center shrink-0"
                              title="Edit Patient"
                            >
                              <Edit2 className="w-3.5 h-3.5 shrink-0" />
                            </button>
                          )}
                          {onDeletePatient && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPatientToDelete(patient);
                              }}
                              className="w-8 h-8 text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors border border-rose-200 inline-flex items-center justify-center shrink-0"
                              title="Delete Patient"
                            >
                              <Trash2 className="w-3.5 h-3.5 shrink-0" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedPatient(patient);
                            }}
                            className="w-8 h-8 text-teal-800 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors border border-teal-200/80 inline-flex items-center justify-center shrink-0"
                            title="View Full Profile"
                          >
                            <Eye className="w-3.5 h-3.5 shrink-0" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls Bar */}
            <div className="px-4 py-3.5 bg-slate-50/75 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <span className="font-medium text-slate-700">
                  Showing <span className="font-semibold text-slate-900">{startIndex}</span> to{' '}
                  <span className="font-semibold text-slate-900">{endIndex}</span> of{' '}
                  <span className="font-semibold text-slate-900">{totalPatients}</span> patients
                </span>
                <span className="text-slate-300">|</span>
                <span className="text-slate-500 font-medium">
                  Page {currentPage} of {totalPages} (15 per page)
                </span>
              </div>

              <div className="flex items-center gap-1">
                {/* First Page */}
                <button
                  type="button"
                  onClick={() => handlePageChange(1)}
                  disabled={currentPage === 1 || loading}
                  className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  title="First Page"
                >
                  <ChevronsLeft className="w-4 h-4" />
                </button>

                {/* Prev Page */}
                <button
                  type="button"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1 || loading}
                  className="h-8 px-2.5 inline-flex items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium"
                  title="Previous Page"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Prev</span>
                </button>

                {/* Page Number Buttons */}
                <div className="flex items-center gap-1 mx-1">
                  {pageNumbers.map((pageNum) => (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => handlePageChange(pageNum)}
                      disabled={loading}
                      className={`h-8 min-w-[32px] px-2.5 text-xs font-semibold rounded-lg transition-colors inline-flex items-center justify-center ${
                        pageNum === currentPage
                          ? 'bg-teal-800 text-white shadow-xs'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {pageNum}
                    </button>
                  ))}
                </div>

                {/* Next Page */}
                <button
                  type="button"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages || loading}
                  className="h-8 px-2.5 inline-flex items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium"
                  title="Next Page"
                >
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>

                {/* Last Page */}
                <button
                  type="button"
                  onClick={() => handlePageChange(totalPages)}
                  disabled={currentPage >= totalPages || loading}
                  className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  title="Last Page"
                >
                  <ChevronsRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {patientToDelete && (
        <div 
          onClick={() => setPatientToDelete(null)}
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 space-y-4 cursor-default animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2.5 bg-rose-100 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Delete Patient Record?</h3>
                <p className="text-xs text-slate-500">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200">
              Are you sure you want to permanently delete patient <strong>{patientToDelete.name}</strong> ({patientToDelete.patientCode}) and remove all associated admission logs?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setPatientToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl text-xs transition flex items-center gap-1.5 disabled:opacity-50"
              >
                {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>{isDeleting ? 'Deleting...' : 'Confirm Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Complete Patient Detail Modal */}
      {selectedPatient && (
        <PatientDetailModal
          patient={selectedPatient}
          onClose={() => setSelectedPatient(null)}
          appointments={appointments}
          medicalRecords={medicalRecords}
          onOpenMessage={onOpenMessage}
          onEditPatient={(patToEdit) => {
            setSelectedPatient(null);
            if (onEditPatient) onEditPatient(patToEdit);
          }}
          onDeletePatient={(patId) => {
            setSelectedPatient(null);
            if (onDeletePatient) onDeletePatient(patId);
          }}
          onSaveMedicalRecord={onSaveMedicalRecord}
          onSavePatientReport={(patId, report) => {
            if (selectedPatient && (selectedPatient.id === patId || selectedPatient.patientCode === patId)) {
              setSelectedPatient((prev) => {
                if (!prev) return null;
                const current = prev.reports || [];
                const exists = current.some((item) => item.id === report.id);
                const updated = exists
                  ? current.map((item) => (item.id === report.id ? report : item))
                  : [report, ...current];
                return { ...prev, reports: updated };
              });
            }
            if (onSavePatientReport) onSavePatientReport(patId, report);
          }}
          onSavePatientPrescription={(patId, rx) => {
            if (selectedPatient && (selectedPatient.id === patId || selectedPatient.patientCode === patId)) {
              setSelectedPatient((prev) => {
                if (!prev) return null;
                const current = prev.prescriptions || [];
                const exists = current.some((item) => item.id === rx.id);
                const updated = exists
                  ? current.map((item) => (item.id === rx.id ? rx : item))
                  : [rx, ...current];
                return { ...prev, prescriptions: updated };
              });
            }
            if (onSavePatientPrescription) onSavePatientPrescription(patId, rx);
          }}
          onSavePatientVisitHistory={(patId, visit) => {
            if (selectedPatient && (selectedPatient.id === patId || selectedPatient.patientCode === patId)) {
              setSelectedPatient((prev) => {
                if (!prev) return null;
                const current = prev.medicalHistory || [];
                const exists = current.some((item) => item.id === visit.id);
                const updated = exists
                  ? current.map((item) => (item.id === visit.id ? visit : item))
                  : [visit, ...current];
                return { ...prev, medicalHistory: updated };
              });
            }
            if (onSavePatientVisitHistory) onSavePatientVisitHistory(patId, visit);
          }}
          onSaveAppointment={onSaveAppointment}
          onSavePatientBilling={(patId, inv) => {
            if (selectedPatient && (selectedPatient.id === patId || selectedPatient.patientCode === patId)) {
              setSelectedPatient((prev) => {
                if (!prev) return null;
                const current = prev.billingInvoices || [];
                const exists = current.some(
                  (item) => item.id === inv.id || item.invoiceNumber === inv.invoiceNumber
                );
                const updated = exists
                  ? current.map((item) =>
                      item.id === inv.id || item.invoiceNumber === inv.invoiceNumber ? inv : item
                    )
                  : [inv, ...current];
                return { ...prev, billingInvoices: updated };
              });
            }
            if (onSavePatientBilling) onSavePatientBilling(patId, inv);
          }}
        />
      )}
    </div>
  );
};


