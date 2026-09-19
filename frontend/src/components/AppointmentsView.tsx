import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar,
  Search,
  Plus,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  RotateCw,
  Loader2,
  Trash2,
  AlertTriangle,
  User,
  Stethoscope,
  ChevronLeft,
  ChevronRight,
  Pencil,
  FileText,
} from 'lucide-react';
import { Appointment, Patient, Doctor } from '../types';
import { ApiClient } from '../services/apiClient';
import { NewAppointmentModal } from './NewAppointmentModal';
import { isDemoMode } from '../utils/demoMode';

interface AppointmentsViewProps {
  appointments: Appointment[];
  patients?: Patient[];
  doctors?: Doctor[];
  departments?: any[];
  onOpenNewAppointment: () => void;
  onEditAppointment?: (apt: Appointment) => void;
  onSaveAppointment?: (apt: Appointment) => void;
  onToggleStatus: (id: string, newStatus?: Appointment['status']) => void;
  onDeleteAppointment?: (id: string) => void;
}

export const AppointmentsView: React.FC<AppointmentsViewProps> = ({
  appointments: initialAppointments,
  patients = [],
  doctors = [],
  departments,
  onOpenNewAppointment,
  onEditAppointment,
  onSaveAppointment,
  onToggleStatus,
  onDeleteAppointment,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Pagination states (strictly 20 appointments per fetch/page)
  const PAGE_SIZE = 20;
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalAppointments, setTotalAppointments] = useState<number>(() =>
    isDemoMode() && initialAppointments ? initialAppointments.length : 0
  );
  const [totalPages, setTotalPages] = useState<number>(() =>
    Math.ceil((isDemoMode() && initialAppointments ? initialAppointments.length : 0) / PAGE_SIZE) || 1
  );

  const [liveAppointments, setLiveAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [aptToDelete, setAptToDelete] = useState<Appointment | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [localEditingApt, setLocalEditingApt] = useState<Appointment | null>(null);

  // Helper to sort appointments prioritizing Pending, then by most recent date/time descending
  const sortAppointments = useCallback((list: Appointment[]): Appointment[] => {
    const getStatusScore = (s: string) => {
      if (s === 'Pending') return 1;
      if (s === 'Confirmed') return 2;
      if (s === 'Completed') return 3;
      if (s === 'Cancelled') return 4;
      return 5;
    };

    return [...list].sort((a, b) => {
      const scoreA = getStatusScore(a.status);
      const scoreB = getStatusScore(b.status);
      if (scoreA !== scoreB) return scoreA - scoreB;

      const dateA = new Date(a.date).getTime() || 0;
      const dateB = new Date(b.date).getTime() || 0;
      if (dateA !== dateB) return dateB - dateA;

      return (b.time || '').localeCompare(a.time || '');
    });
  }, []);

  // Format API item to Appointment
  const formatApiAppointment = (item: any, idx: number): Appointment => {
    const pName = item.patientName || item.patientId?.name || 'Scheduled Patient';
    const initials =
      pName
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2) || 'SP';

    let dateStr = '2026-08-18';
    if (item.date) {
      dateStr = item.date.includes('T') ? item.date.split('T')[0] : item.date;
    }

    return {
      id: item.id || item._id?.toString() || item._id || `apt-${idx}`,
      patientName: pName,
      patientInitials: initials,
      patientId: item.patientCode || item.patientId?._id || item.patientId || `PAT-${1000 + idx}`,
      doctorName: item.doctorName || item.doctorId?.name || 'Dr. Specialist',
      doctorId: item.doctorId?._id || item.doctorId || `doc-${idx}`,
      department: item.department || 'General Medicine',
      date: dateStr,
      time: item.time || '10:00 AM',
      type: item.type || 'Consultation',
      status: item.status || 'Pending',
      notes: item.notes || '',
    };
  };

  // Local fallback pagination handler
  const fallbackLocalPagination = useCallback(
    (pageToFetch: number, term: string, status: string) => {
      let filtered = initialAppointments || [];
      if (term.trim()) {
        const q = term.toLowerCase();
        filtered = filtered.filter(
          (apt) =>
            apt.patientName.toLowerCase().includes(q) ||
            apt.doctorName.toLowerCase().includes(q) ||
            apt.department.toLowerCase().includes(q)
        );
      }
      if (status !== 'All') {
        filtered = filtered.filter((apt) => apt.status === status);
      }

      const sorted = sortAppointments(filtered);
      const total = sorted.length;
      const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
      const skip = (pageToFetch - 1) * PAGE_SIZE;
      const paginated = sorted.slice(skip, skip + PAGE_SIZE);

      setLiveAppointments(paginated);
      setTotalAppointments(total);
      setTotalPages(pages);
    },
    [initialAppointments, sortAppointments]
  );

  // Fetch 20 appointments from REST API for the current page
  const fetchAppointments = useCallback(
    async (pageToFetch = currentPage, term = searchTerm, status = statusFilter) => {
      setLoading(true);
      setError(null);
      try {
        const res = await ApiClient.getAppointments({
          page: pageToFetch,
          limit: PAGE_SIZE,
          search: term.trim() || undefined,
          status: status !== 'All' ? status : undefined,
        });

        if (res.success && Array.isArray(res.data)) {
          const formatted = res.data.map(formatApiAppointment);
          // Ensure sort consistency with pending and recent dates at the top
          const sorted = sortAppointments(formatted);
          setLiveAppointments(sorted);

          if (res.meta) {
            setTotalAppointments(res.meta.total ?? sorted.length);
            setTotalPages(
              res.meta.totalPages ?? Math.max(1, Math.ceil((res.meta.total || sorted.length) / PAGE_SIZE))
            );
          } else {
            const total = sorted.length;
            setTotalAppointments(total);
            setTotalPages(Math.max(1, Math.ceil(total / PAGE_SIZE)));
          }
        } else {
          if (isDemoMode()) {
            fallbackLocalPagination(pageToFetch, term, status);
          } else {
            setLiveAppointments([]);
            setTotalAppointments(0);
            setTotalPages(1);
          }
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch appointment schedule');
        if (isDemoMode()) {
          fallbackLocalPagination(pageToFetch, term, status);
        } else {
          setLiveAppointments([]);
          setTotalAppointments(0);
          setTotalPages(1);
        }
      } finally {
        setLoading(false);
      }
    },
    [currentPage, searchTerm, statusFilter, sortAppointments, fallbackLocalPagination]
  );

  // Fetch on mount or when page/filter changes
  useEffect(() => {
    fetchAppointments(currentPage, searchTerm, statusFilter);
  }, [currentPage, searchTerm, statusFilter]);

  // Sync when initialAppointments changes from parent
  useEffect(() => {
    if (initialAppointments && initialAppointments.length > 0) {
      fetchAppointments(currentPage, searchTerm, statusFilter);
    }
  }, [initialAppointments]);

  // Handle Search Input Change (Reset to page 1)
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  // Handle Status Filter Change (Reset to page 1)
  const handleStatusFilterChange = (st: string) => {
    setStatusFilter(st);
    setCurrentPage(1);
  };

  // Immediate single-selection status update without race condition or delay
  const handleStatusChange = async (id: string, newStatus: Appointment['status']) => {
    // 1. Immediately update UI state in liveAppointments
    setLiveAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: newStatus } : a))
    );

    // 2. Notify parent state without resetting UI
    if (onToggleStatus) {
      onToggleStatus(id, newStatus);
    }

    // 3. Persist update to API backend
    try {
      await ApiClient.updateAppointment(id, { status: newStatus });
    } catch (err) {
      console.error('Failed to update status on API backend:', err);
    }
  };

  const handleEditClick = (apt: Appointment) => {
    if (onEditAppointment) {
      onEditAppointment(apt);
    } else {
      setLocalEditingApt(apt);
    }
  };

  const handleSaveEditedApt = async (savedApt: Appointment) => {
    // Update local table view immediately
    setLiveAppointments((prev) =>
      prev.map((a) => (a.id === savedApt.id ? savedApt : a))
    );

    if (onSaveAppointment) {
      onSaveAppointment(savedApt);
    }

    try {
      await ApiClient.updateAppointment(savedApt.id, {
        patientName: savedApt.patientName,
        patientId: savedApt.patientId,
        doctorName: savedApt.doctorName,
        doctorId: savedApt.doctorId,
        department: savedApt.department,
        date: savedApt.date,
        time: savedApt.time,
        type: savedApt.type,
        status: savedApt.status,
        notes: savedApt.notes,
      });
      fetchAppointments(currentPage, searchTerm, statusFilter);
    } catch (err) {
      console.error('Failed to persist edited appointment on backend:', err);
    } finally {
      setLocalEditingApt(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!aptToDelete) return;
    setIsDeleting(true);
    try {
      await ApiClient.deleteAppointment(aptToDelete.id);
      if (onDeleteAppointment) {
        onDeleteAppointment(aptToDelete.id);
      }
      setLiveAppointments((prev) => prev.filter((a) => a.id !== aptToDelete.id));
      setTotalAppointments((prev) => Math.max(0, prev - 1));
      fetchAppointments(currentPage, searchTerm, statusFilter);
    } catch (err) {
      console.error('Failed to delete appointment on backend:', err);
    } finally {
      setIsDeleting(false);
      setAptToDelete(null);
    }
  };

  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const endIndex = Math.min(startIndex + liveAppointments.length, totalAppointments);

  return (
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Appointments Schedule</span>
            {loading && <Loader2 className="w-5 h-5 text-teal-700 animate-spin" />}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Outpatient consultations, procedures, check-ups, and follow-up tracking with 20 records per page.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => fetchAppointments(currentPage, searchTerm, statusFilter)}
            disabled={loading}
            className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
            title="Refresh appointments"
          >
            <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={onOpenNewAppointment}
            className="flex items-center space-x-2 px-4 py-2 bg-teal-800 hover:bg-teal-900 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Book Appointment</span>
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs text-amber-900">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Notice: API fetch failed ({error}). Displaying local schedule.</span>
          </div>
          <button
            onClick={() => fetchAppointments(currentPage, searchTerm, statusFilter)}
            className="underline font-semibold hover:text-amber-950 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Search patient, doctor, or department..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-800/20"
          />
        </div>

        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 md:pb-0">
          {['All', 'Pending', 'Confirmed', 'Completed', 'Cancelled'].map((st) => (
            <button
              key={st}
              onClick={() => handleStatusFilterChange(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors shrink-0 cursor-pointer ${
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

      {/* Appointments Table / Empty / Loading */}
      {loading && liveAppointments.length === 0 ? (
        <div className="py-20 text-center text-slate-400 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
          <Loader2 className="w-8 h-8 mx-auto mb-3 text-teal-700 animate-spin" />
          <p className="text-xs font-medium text-slate-600">Loading appointment schedule from API...</p>
        </div>
      ) : liveAppointments.length === 0 ? (
        <div className="py-20 text-center text-slate-400 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6">
          <Calendar className="w-10 h-10 mx-auto mb-3 text-slate-300" />
          <p className="text-sm font-semibold text-slate-700">No appointments found</p>
          <p className="text-xs text-slate-500 mt-1">Try adjusting search filters or scheduling a new consultation.</p>
          {(searchTerm || statusFilter !== 'All') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('All');
                setCurrentPage(1);
              }}
              className="mt-4 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3.5 px-4">Time & Date</th>
                    <th className="py-3.5 px-4">Patient</th>
                    <th className="py-3.5 px-4">Physician & Dept</th>
                    <th className="py-3.5 px-4">Procedure Type</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Update Status & Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {liveAppointments.map((apt) => (
                    <tr
                      key={apt.id}
                      onClick={() => handleEditClick(apt)}
                      className="hover:bg-teal-50/40 cursor-pointer transition-colors group"
                      title="Click appointment row to edit details"
                    >
                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        <div className="flex items-center space-x-1.5">
                          <Clock className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                          <span className="group-hover:text-teal-900 transition-colors">{apt.time}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">{apt.date}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5 group-hover:text-teal-900 transition-colors">
                          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{apt.patientName}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">{apt.patientId}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                          <Stethoscope className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                          <span>{apt.doctorName}</span>
                        </div>
                        <div className="text-[10px] text-slate-400">{apt.department}</div>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-700">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-medium text-[11px]">
                          {apt.type}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                            apt.status === 'Pending'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : apt.status === 'Completed'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : apt.status === 'Confirmed'
                              ? 'bg-teal-50 text-teal-800 border-teal-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                        >
                          {apt.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end space-x-2">
                          <select
                            value={apt.status}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => {
                              e.stopPropagation();
                              handleStatusChange(apt.id, e.target.value as Appointment['status']);
                            }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-teal-500/20 ${
                              apt.status === 'Pending'
                                ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                                : apt.status === 'Confirmed'
                                ? 'bg-teal-50 text-teal-900 border-teal-300 hover:bg-teal-100'
                                : apt.status === 'Completed'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                                : 'bg-rose-50 text-rose-800 border-rose-300 hover:bg-rose-100'
                            }`}
                          >
                            <option value="Pending" className="bg-white text-slate-900">Pending</option>
                            <option value="Confirmed" className="bg-white text-slate-900">Confirmed</option>
                            <option value="Completed" className="bg-white text-slate-900">Completed</option>
                            <option value="Cancelled" className="bg-white text-slate-900">Cancelled</option>
                          </select>

                          {/* Edit Appointment Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditClick(apt);
                            }}
                            className="p-1.5 text-teal-700 hover:text-teal-900 hover:bg-teal-50 rounded-lg border border-slate-200 hover:border-teal-200 transition cursor-pointer"
                            title="Edit Appointment"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Appointment Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setAptToDelete(apt);
                            }}
                            className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg border border-slate-200 hover:border-rose-200 transition cursor-pointer"
                            title="Cancel/Delete Appointment"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination Controls (20 appointments per page - always visible) */}
          {totalAppointments > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-xs text-slate-500">
                Showing <strong className="text-slate-800">{startIndex + 1}</strong> to{' '}
                <strong className="text-slate-800">
                  {Math.min(startIndex + PAGE_SIZE, totalAppointments)}
                </strong>{' '}
                of <strong className="text-slate-800">{totalAppointments}</strong> appointments
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1 || loading}
                  className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-600 transition cursor-pointer"
                  title="Previous Page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                  <button
                    key={pg}
                    type="button"
                    onClick={() => setCurrentPage(pg)}
                    disabled={loading}
                    className={`w-8 h-8 rounded-xl text-xs font-semibold transition cursor-pointer ${
                      currentPage === pg
                        ? 'bg-teal-800 text-white shadow-2xs'
                        : 'text-slate-700 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    {pg}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages || loading}
                  className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-600 transition cursor-pointer"
                  title="Next Page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Local Edit Appointment Modal if not delegated to parent */}
      {localEditingApt && (
        <NewAppointmentModal
          appointment={localEditingApt}
          patients={patients}
          doctors={doctors}
          departments={departments}
          onClose={() => setLocalEditingApt(null)}
          onAddAppointment={handleSaveEditedApt}
        />
      )}

      {/* Delete Confirmation Modal */}
      {aptToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center space-x-3 text-rose-600">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-lg font-bold text-slate-900">Cancel Appointment</h3>
            </div>
            <p className="text-xs text-slate-600">
              Are you sure you want to cancel and remove the appointment for{' '}
              <strong className="text-slate-900">{aptToDelete.patientName}</strong> with{' '}
              <strong className="text-slate-900">{aptToDelete.doctorName}</strong> on {aptToDelete.date}?
            </p>
            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setAptToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition disabled:opacity-50 cursor-pointer"
              >
                Keep Appointment
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl text-xs transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>{isDeleting ? 'Removing...' : 'Confirm Remove'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

