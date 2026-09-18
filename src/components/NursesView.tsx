import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Filter,
  Award,
  Send,
  Plus,
  Star,
  Users,
  Trash2,
  Clock,
  RotateCw,
  Loader2,
  AlertTriangle,
  HeartPulse,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Nurse, Patient } from '../types';
import { NurseDetailModal } from './NurseDetailModal';
import { NurseFormModal } from './NurseFormModal';
import { ApiClient } from '../services/apiClient';
import { isDemoMode } from '../utils/demoMode';

interface NursesViewProps {
  nurses: Nurse[];
  patients?: Patient[];
  departments?: any[];
  onOpenMessage: (nurseName: string, nurseId: string, role: string) => void;
  onSaveNurse: (nurse: Nurse) => void;
  onDeleteNurse?: (nurseId: string) => void;
  onViewPatientDetails?: (patient: Patient, origin?: { type: 'doctor' | 'nurse'; name: string }) => void;
}

export const NursesView: React.FC<NursesViewProps> = ({
  nurses: initialNurses,
  patients = [],
  departments: customDepartments,
  onOpenMessage,
  onSaveNurse,
  onDeleteNurse,
  onViewPatientDetails,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedShift, setSelectedShift] = useState<string>('All');
  const [selectedNurse, setSelectedNurse] = useState<Nurse | null>(null);
  const [selectedNurseTab, setSelectedNurseTab] = useState<'overview' | 'patients' | 'reviews' | 'schedule'>('overview');
  const [editingNurse, setEditingNurse] = useState<Nurse | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [nurseToDelete, setNurseToDelete] = useState<Nurse | null>(null);

  const [liveNurses, setLiveNurses] = useState<Nurse[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Pagination state (15 nurses per page)
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 15;

  // Fetch nurses from REST API
  const fetchNurses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await ApiClient.getNurses({ page: 1, limit: 50 });
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        const formatted: Nurse[] = res.data.map((item: any, idx: number) => ({
          id: item.id || item._id || `nurse-${idx}`,
          nurseCode: item.nurseCode || `NRS-0${101 + idx}`,
          name: item.name || 'Nurse Specialist',
          avatar: item.avatar,
          role: item.role || 'Staff Nurse (RN)',
          department: item.department || 'General Care',
          shift: item.shift ? `${item.shift} Shift` : 'Morning (07:00 - 15:00)',
          status: item.status === 'Active' ? 'On Duty' : item.status || 'On Duty',
          assignedWard: item.assignedWard || 'Ward 3B - Acute Care',
          patientLoad: item.patientLoad || (Array.isArray(item.assignedPatientIds) ? item.assignedPatientIds.length : 6),
          assignedPatientIds: item.assignedPatientIds || [],
          age: item.age || 32,
          address: item.address || '742 Evergreen Terrace, Springfield, OR 97477',
          phone: item.phone || '+1 (555) 345-6789',
          email: item.email || 'nurse@hospital.org',
          experienceYears: typeof item.experience === 'number' ? item.experience : 6,
          certifications: ['BLS Certified', 'ACL Certified', 'Pediatric Care'],
          rating: item.rating || 4.9,
          reviews: [
            { id: `rev-n-${idx}`, patientName: 'Ward Patient', rating: 5, comment: 'Attentive and compassionate care.', date: '2026-07-25' }
          ],
          dutySchedule: [
            { day: 'Mon - Fri', shift: item.shift || '07:00 - 15:00', location: item.assignedWard || 'Ward 3B' }
          ],
          degrees: 'BSN, RN',
          bio: item.bio || 'Dedicated nursing professional focused on patient-centered clinical care and emergency support.',
          languages: ['English', 'Spanish']
        }));
        setLiveNurses(formatted);
      } else if (res.success && Array.isArray(res.data) && res.data.length === 0) {
        setLiveNurses([]);
      } else {
        setLiveNurses(isDemoMode() ? initialNurses : []);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load nursing staff roster');
      setLiveNurses(isDemoMode() ? initialNurses : []);
    } finally {
      setLoading(false);
    }
  }, [initialNurses]);

  useEffect(() => {
    fetchNurses();
  }, [fetchNurses]);

  const displayNurses = isDemoMode() ? (liveNurses.length > 0 ? liveNurses : initialNurses) : liveNurses;

  const filteredNurses = displayNurses.filter((n) => {
    const matchesSearch =
      n.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.nurseCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.assignedWard.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesShift =
      selectedShift === 'All' || n.shift.toLowerCase().includes(selectedShift.toLowerCase());

    return matchesSearch && matchesShift;
  });

  // Calculate pagination
  const totalItems = filteredNurses.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedNurses = filteredNurses.slice(startIndex, startIndex + pageSize);

  const handleShiftFilterChange = (shift: string) => {
    setSelectedShift(shift);
    setCurrentPage(1);
  };

  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    setCurrentPage(1);
  };

  const handleOpenNurseModal = (
    nurse: Nurse,
    tab: 'overview' | 'patients' | 'reviews' | 'schedule' = 'overview'
  ) => {
    setSelectedNurse(nurse);
    setSelectedNurseTab(tab);
  };

  const handleDeleteConfirm = async () => {
    if (!nurseToDelete) return;
    setIsDeleting(true);
    try {
      await ApiClient.deleteNurse(nurseToDelete.id);
      if (onDeleteNurse) {
        onDeleteNurse(nurseToDelete.id);
      }
      setLiveNurses((prev) => prev.filter((n) => n.id !== nurseToDelete.id));
    } catch (err) {
      console.error('Delete nurse error:', err);
    } finally {
      setIsDeleting(false);
      setNurseToDelete(null);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Title & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Nursing Staff Directory</span>
            {loading && <Loader2 className="w-5 h-5 text-teal-700 animate-spin" />}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Registered nurses, ward shift roster, ratings, and patient assignments across hospital wards.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={fetchNurses}
            disabled={loading}
            className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl shadow-xs transition-colors disabled:opacity-50"
            title="Refresh nursing roster from API"
          >
            <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-teal-800 hover:bg-teal-900 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Nurse</span>
          </button>
          <span className="px-3 py-2 bg-teal-50 border border-teal-200 text-teal-800 text-xs font-bold rounded-xl hidden sm:inline-block">
            Total: {displayNurses.length}
          </span>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs text-amber-900">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Notice: API fetch failed ({error}). Displaying local roster.</span>
          </div>
          <button onClick={fetchNurses} className="underline font-semibold hover:text-amber-950">Retry</button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search nurse by name, department, ward or code..."
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedShift}
            onChange={(e) => handleShiftFilterChange(e.target.value)}
            className="px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="All">All Shifts</option>
            <option value="Morning">Morning Shift</option>
            <option value="Evening">Evening Shift</option>
            <option value="Night">Night Shift</option>
          </select>
        </div>
      </div>

      {/* Responsive Cards Grid or States */}
      {loading && filteredNurses.length === 0 ? (
        <div className="py-20 text-center text-slate-400 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
          <Loader2 className="w-8 h-8 mx-auto mb-3 text-teal-700 animate-spin" />
          <p className="text-xs font-medium text-slate-600">Loading nursing staff roster from API...</p>
        </div>
      ) : filteredNurses.length === 0 ? (
        <div className="py-20 text-center text-slate-400 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6">
          <HeartPulse className="w-10 h-10 mx-auto mb-3 text-slate-300" />
          <p className="text-sm font-semibold text-slate-700">No nurse profiles found</p>
          <p className="text-xs text-slate-500 mt-1">Try adjusting search filters or registering a new nurse.</p>
          {(searchTerm || selectedShift !== 'All') && (
            <button
              onClick={() => {
                handleSearchChange('');
                handleShiftFilterChange('All');
              }}
              className="mt-4 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedNurses.map((nurse) => {
              const revCount = nurse.reviews?.length || 2;
              const ratingVal = nurse.rating || 4.9;

              return (
                <div
                  key={nurse.id}
                  className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-teal-300 hover:shadow-md transition cursor-pointer flex flex-col justify-between group"
                  onClick={() => handleOpenNurseModal(nurse, 'overview')}
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={
                            nurse.avatar ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(
                              nurse.name
                            )}&background=0D9488&color=fff&size=100`
                          }
                          alt={nurse.name}
                          className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0"
                        />
                        <div>
                          <h3 className="font-bold text-sm text-slate-900 group-hover:text-teal-700 transition">
                            {nurse.name}
                          </h3>
                          <p className="text-xs font-semibold text-teal-700">{nurse.role}</p>
                          <p className="text-[11px] text-slate-400">{nurse.department}</p>
                        </div>
                      </div>

                      <span
                        className={`px-2 py-0.5 text-[11px] font-semibold rounded-full shrink-0 ${
                          nurse.status === 'On Duty' || nurse.status === 'In Ward'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : nurse.status === 'On Break'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {nurse.status}
                      </span>
                    </div>

                    {/* Rating & Patients quick pills */}
                    <div className="mt-3.5 flex items-center gap-2 text-xs">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenNurseModal(nurse, 'reviews');
                        }}
                        className="flex items-center gap-1 text-amber-700 font-bold bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200/80 hover:bg-amber-100 transition"
                      >
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                        <span>{ratingVal.toFixed(1)}</span>
                        <span className="text-amber-800 font-normal">({revCount})</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenNurseModal(nurse, 'patients');
                        }}
                        className="flex items-center gap-1.5 text-teal-800 font-semibold bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200/80 hover:bg-teal-100 transition"
                      >
                        <Users className="w-3.5 h-3.5 text-teal-700" />
                        <span>Assigned ({nurse.patientLoad})</span>
                      </button>
                    </div>

                    {/* Details List */}
                    <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Assigned Ward:</span>
                        <span className="font-semibold text-slate-800">{nurse.assignedWard}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Shift Timing:</span>
                        <span className="font-mono text-slate-700">{nurse.shift}</span>
                      </div>
                    </div>

                    {/* Certifications preview */}
                    <div className="mt-2.5 flex flex-wrap gap-1">
                      {nurse.certifications?.slice(0, 3).map((cert, i) => (
                        <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] rounded font-medium">
                          {cert}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Bottom Actions */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <span className="text-xs text-slate-400 font-mono">{nurse.nurseCode}</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingNurse(nurse);
                        }}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition"
                      >
                        Edit
                      </button>
                      {onDeleteNurse && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setNurseToDelete(nurse);
                          }}
                          className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg transition"
                          title="Delete Nurse"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenMessage(nurse.name, nurse.id, 'Nursing Staff');
                        }}
                        className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold rounded-lg transition flex items-center gap-1.5"
                      >
                        <Send className="w-3.5 h-3.5" /> Message
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs mt-2">
              <span className="text-xs text-slate-500">
                Showing <strong className="text-slate-800">{startIndex + 1}</strong> to{' '}
                <strong className="text-slate-800">
                  {Math.min(startIndex + pageSize, totalItems)}
                </strong>{' '}
                of <strong className="text-slate-800">{totalItems}</strong> nurses
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-600 transition"
                  title="Previous Page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                  <button
                    key={pg}
                    type="button"
                    onClick={() => setCurrentPage(pg)}
                    className={`w-8 h-8 rounded-xl text-xs font-semibold transition ${
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
                  disabled={currentPage === totalPages}
                  className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-600 transition"
                  title="Next Page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Delete Nurse Confirmation Modal */}
      {nurseToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center space-x-3 text-rose-600">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-lg font-bold text-slate-900">Delete Nurse Record</h3>
            </div>
            <p className="text-xs text-slate-600">
              Are you sure you want to delete nurse record for{' '}
              <strong className="text-slate-900">{nurseToDelete.name}</strong> ({nurseToDelete.nurseCode})? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setNurseToDelete(null)}
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

      {/* Nurse Detail Modal */}
      {selectedNurse && (
        <NurseDetailModal
          nurse={selectedNurse}
          patients={patients}
          initialTab={selectedNurseTab}
          onClose={() => setSelectedNurse(null)}
          onOpenMessage={onOpenMessage}
          onEditNurse={(nurseToEdit) => {
            setSelectedNurse(null);
            setEditingNurse(nurseToEdit);
          }}
          onDeleteNurse={(id) => {
            const n = liveNurses.find((item) => item.id === id);
            if (n) setNurseToDelete(n);
            setSelectedNurse(null);
          }}
          onSaveNurse={(updated) => {
            onSaveNurse(updated);
            setSelectedNurse(updated);
            setLiveNurses((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
          }}
          onViewPatientDetails={onViewPatientDetails}
        />
      )}

      {/* Add Nurse Modal */}
      {showAddModal && (
        <NurseFormModal
          departments={customDepartments}
          onClose={() => setShowAddModal(false)}
          onSave={(n) => {
            onSaveNurse(n);
            setLiveNurses((prev) => [n, ...prev]);
          }}
        />
      )}

      {/* Edit Nurse Modal */}
      {editingNurse && (
        <NurseFormModal
          nurse={editingNurse}
          departments={customDepartments}
          onClose={() => setEditingNurse(null)}
          onSave={(n) => {
            onSaveNurse(n);
            setLiveNurses((prev) => prev.map((item) => (item.id === n.id ? n : item)));
          }}
        />
      )}
    </div>
  );
};
