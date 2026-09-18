import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Filter,
  UserCheck,
  Phone,
  Mail,
  Send,
  Building,
  Globe,
  CalendarCheck,
  Plus,
  Edit2,
  Star,
  Clock,
  Calendar,
  MessageSquare,
  Trash2,
  RotateCw,
  Loader2,
  AlertTriangle,
  UserPlus,
  ChevronLeft,
  ChevronRight,
  MapPin,
} from 'lucide-react';
import { Receptionist } from '../types';
import { ReceptionistDetailModal } from './ReceptionistDetailModal';
import { ReceptionistFormModal } from './ReceptionistFormModal';
import { ApiClient } from '../services/apiClient';
import { isDemoMode } from '../utils/demoMode';

interface ReceptionistsViewProps {
  receptionists: Receptionist[];
  onOpenMessage: (receptionistName: string, receptionistId: string, role: string) => void;
  onSaveReceptionist: (receptionist: Receptionist) => void;
  onDeleteReceptionist?: (receptionistId: string) => void;
}

export const ReceptionistsView: React.FC<ReceptionistsViewProps> = ({
  receptionists: initialReceptionists,
  onOpenMessage,
  onSaveReceptionist,
  onDeleteReceptionist,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [shiftFilter, setShiftFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 15;

  const [selectedReceptionist, setSelectedReceptionist] = useState<Receptionist | null>(null);
  const [initialTab, setInitialTab] = useState<'overview' | 'schedule' | 'reviews'>('overview');
  const [editingReceptionist, setEditingReceptionist] = useState<Receptionist | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [receptionistToDelete, setReceptionistToDelete] = useState<Receptionist | null>(null);

  const [liveReceptionists, setLiveReceptionists] = useState<Receptionist[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Fetch receptionists from REST API
  const fetchReceptionists = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await ApiClient.getReceptionists({ page: 1, limit: 50 });
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        const formatted: Receptionist[] = res.data.map((item: any, idx: number) => ({
          id: item.id || item._id || `rec-${idx}`,
          staffCode: item.staffCode || `REC-0${101 + idx}`,
          name: item.name || 'Reception Officer',
          avatar: item.avatar,
          shift: item.shift ? `${item.shift} Shift` : 'Morning Shift (07:00 AM - 03:00 PM)',
          status: item.status === 'Active' ? 'Active' : item.status || 'Active',
          deskLocation: item.deskNumber || 'Main Lobby - Desk A1',
          extension: item.extension || `x${4000 + idx}`,
          phone: item.phone || '+1 (555) 890-1234',
          email: item.email || 'reception@hospital.org',
          address: item.address || undefined,
          checkInsToday: typeof item.checkInsToday === 'number' ? item.checkInsToday : 38 + idx * 5,
          rating: item.rating || 4.9,
          reviews: [
            { id: `rev-r-${idx}`, patientName: 'Visitor Patient', rating: 5, comment: 'Friendly check-in experience and fast routing.', date: '2026-07-28' }
          ],
          schedule: [
            { day: 'Mon - Fri', hours: item.shift ? `${item.shift} Shift` : '07:00 AM - 03:00 PM', desk: item.deskNumber || 'Desk A1' }
          ],
          languages: ['English', 'Spanish'],
          bio: 'Front desk intake coordinator with extensive training in emergency patient triage and administrative admissions.'
        }));
        setLiveReceptionists(formatted);
      } else if (res.success && Array.isArray(res.data) && res.data.length === 0) {
        setLiveReceptionists([]);
      } else {
        setLiveReceptionists(isDemoMode() ? initialReceptionists : []);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load front desk staff roster');
      setLiveReceptionists(isDemoMode() ? initialReceptionists : []);
    } finally {
      setLoading(false);
    }
  }, [initialReceptionists]);

  useEffect(() => {
    fetchReceptionists();
  }, [fetchReceptionists]);

  const displayReceptionists = isDemoMode() ? (liveReceptionists.length > 0 ? liveReceptionists : initialReceptionists) : liveReceptionists;

  const filteredReceptionists = displayReceptionists.filter((r) => {
    const matchesSearch =
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.deskLocation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.staffCode.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesShift = shiftFilter === 'All' || r.shift.toLowerCase().includes(shiftFilter.toLowerCase());
    const matchesStatus = statusFilter === 'All' || r.status.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesShift && matchesStatus;
  });

  const totalItems = filteredReceptionists.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedReceptionists = filteredReceptionists.slice(startIndex, startIndex + pageSize);

  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    setCurrentPage(1);
  };

  const handleShiftFilterChange = (val: string) => {
    setShiftFilter(val);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (val: string) => {
    setStatusFilter(val);
    setCurrentPage(1);
  };

  const openModalWithTab = (rec: Receptionist, tab: 'overview' | 'schedule' | 'reviews' = 'overview') => {
    setInitialTab(tab);
    setSelectedReceptionist(rec);
  };

  const handleDeleteConfirm = async () => {
    if (!receptionistToDelete) return;
    setIsDeleting(true);
    try {
      await ApiClient.deleteReceptionist(receptionistToDelete.id);
      if (onDeleteReceptionist) {
        onDeleteReceptionist(receptionistToDelete.id);
      }
      setLiveReceptionists((prev) => prev.filter((r) => r.id !== receptionistToDelete.id));
    } catch (err) {
      console.error('Delete receptionist error:', err);
    } finally {
      setIsDeleting(false);
      setReceptionistToDelete(null);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Title & Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Front Desk & Reception Roster</span>
            {loading && <Loader2 className="w-5 h-5 text-teal-700 animate-spin" />}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Patient intake officers, admissions desk, and emergency triage registration staff.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <button
            type="button"
            onClick={fetchReceptionists}
            disabled={loading}
            className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl shadow-xs transition cursor-pointer disabled:opacity-50"
            title="Refresh receptionists list"
          >
            <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-1.5 px-4 py-2 bg-teal-800 hover:bg-teal-900 text-white text-xs font-semibold rounded-xl shadow-xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Receptionist</span>
          </button>
          <span className="px-3 py-2 bg-teal-50 border border-teal-200 text-teal-800 text-xs font-bold rounded-xl hidden sm:inline-block">
            Total: {displayReceptionists.length}
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
          <button onClick={fetchReceptionists} className="underline font-semibold hover:text-amber-950">Retry</button>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-stretch md:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search receptionist by name, desk location or staff code..."
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={shiftFilter}
              onChange={(e) => handleShiftFilterChange(e.target.value)}
              className="bg-transparent font-medium text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="All">All Shifts</option>
              <option value="Morning">Morning Shift</option>
              <option value="Evening">Evening Shift</option>
              <option value="Night">Night Shift</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs">
            <select
              value={statusFilter}
              onChange={(e) => handleStatusFilterChange(e.target.value)}
              className="bg-transparent font-medium text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="On Break">On Break</option>
              <option value="Off Duty">Off Duty</option>
            </select>
          </div>
        </div>
      </div>

      {/* Responsive Cards Grid or Empty / Loading States */}
      {loading && filteredReceptionists.length === 0 ? (
        <div className="py-20 text-center text-slate-400 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
          <Loader2 className="w-8 h-8 mx-auto mb-3 text-teal-700 animate-spin" />
          <p className="text-xs font-medium text-slate-600">Loading front desk roster from API...</p>
        </div>
      ) : filteredReceptionists.length === 0 ? (
        <div className="py-20 text-center text-slate-400 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6">
          <UserPlus className="w-10 h-10 mx-auto mb-3 text-slate-300" />
          <p className="text-sm font-semibold text-slate-700">No receptionist records found</p>
          <p className="text-xs text-slate-500 mt-1">Try adjusting search criteria or registering a new receptionist.</p>
          {(searchTerm || shiftFilter !== 'All' || statusFilter !== 'All') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setShiftFilter('All');
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
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedReceptionists.map((rec) => {
              const revCount = rec.reviews?.length || 0;
              const avgScore = rec.rating || 5.0;

              return (
                <div
                  key={rec.id}
                  onClick={() => openModalWithTab(rec, 'overview')}
                  className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-teal-300 hover:shadow-md transition cursor-pointer flex flex-col justify-between group relative"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={
                            rec.avatar ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(
                              rec.name
                            )}&background=0D9488&color=fff&size=100`
                          }
                          alt={rec.name}
                          className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0"
                        />
                        <div>
                          <h3 className="font-bold text-sm text-slate-900 group-hover:text-teal-700 transition flex items-center gap-1.5">
                            <span>{rec.name}</span>
                          </h3>
                          <p className="text-xs text-slate-500 font-medium">{rec.shift}</p>
                        </div>
                      </div>

                      <span
                        className={`px-2 py-0.5 text-[11px] font-semibold rounded-full shrink-0 ${
                          rec.status === 'Active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : rec.status === 'On Break'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {rec.status}
                      </span>
                    </div>

                    {/* Rating & Duty Schedule Quick Pill Bar */}
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openModalWithTab(rec, 'reviews');
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 hover:bg-amber-100/80 text-amber-800 text-[11px] font-bold rounded-lg border border-amber-200/80 transition cursor-pointer"
                      >
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span>{avgScore}</span>
                        <span className="text-amber-700/80 font-normal">({revCount} reviews)</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openModalWithTab(rec, 'schedule');
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 text-[11px] font-semibold rounded-lg border border-teal-200/80 transition cursor-pointer"
                      >
                        <Calendar className="w-3.5 h-3.5 text-teal-700" />
                        <span>Schedule</span>
                      </button>
                    </div>

                    {/* Desk & Extension Info */}
                    <div className="mt-3.5 pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Desk Location:</span>
                        <span className="font-semibold text-slate-800 text-right max-w-[180px] truncate">
                          {rec.deskLocation}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Extension:</span>
                        <span className="font-mono font-bold text-teal-700">{rec.extension}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Check-ins Today:</span>
                        <span className="font-bold text-slate-900">{rec.checkInsToday} Patients</span>
                      </div>
                      {rec.address && (
                        <div className="flex items-center gap-1.5 text-slate-500 pt-0.5">
                          <MapPin className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                          <span className="truncate text-[11px]">{rec.address}</span>
                        </div>
                      )}
                    </div>

                    {/* Languages */}
                    <div className="mt-3 flex flex-wrap gap-1">
                      {rec.languages?.map((lang, idx) => (
                        <span key={idx} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] rounded font-medium">
                          🌐 {lang}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Bottom Actions */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <span className="text-xs text-slate-400 font-mono font-medium">{rec.staffCode}</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingReceptionist(rec);
                        }}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition cursor-pointer"
                      >
                        Edit
                      </button>
                      {onDeleteReceptionist && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setReceptionistToDelete(rec);
                          }}
                          className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg transition cursor-pointer"
                          title="Delete Receptionist"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenMessage(rec.name, rec.id, 'Front Desk Staff');
                        }}
                        className="px-3 py-1.5 bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold rounded-lg transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" /> Message
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Controls (15 receptionists per page - always visible) */}
          {totalItems > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-xs text-slate-500">
                Showing <strong className="text-slate-800">{startIndex + 1}</strong> to{' '}
                <strong className="text-slate-800">
                  {Math.min(startIndex + pageSize, totalItems)}
                </strong>{' '}
                of <strong className="text-slate-800">{totalItems}</strong> receptionists
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
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
                  disabled={currentPage === totalPages}
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

      {/* Delete Confirmation Modal */}
      {receptionistToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center space-x-3 text-rose-600">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-lg font-bold text-slate-900">Delete Receptionist Record</h3>
            </div>
            <p className="text-xs text-slate-600">
              Are you sure you want to remove receptionist record for{' '}
              <strong className="text-slate-900">{receptionistToDelete.name}</strong> ({receptionistToDelete.staffCode})? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setReceptionistToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl text-xs transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>{isDeleting ? 'Deleting...' : 'Confirm Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receptionist Detail Modal */}
      {selectedReceptionist && (
        <ReceptionistDetailModal
          receptionist={selectedReceptionist}
          initialTab={initialTab}
          onClose={() => setSelectedReceptionist(null)}
          onOpenMessage={onOpenMessage}
          onEditReceptionist={(recToEdit) => {
            setSelectedReceptionist(null);
            setEditingReceptionist(recToEdit);
          }}
          onDeleteReceptionist={(id) => {
            const r = liveReceptionists.find((item) => item.id === id);
            if (r) setReceptionistToDelete(r);
            setSelectedReceptionist(null);
          }}
          onSaveReceptionist={(updatedRec) => {
            onSaveReceptionist(updatedRec);
            setSelectedReceptionist(updatedRec);
            setLiveReceptionists((prev) => prev.map((item) => (item.id === updatedRec.id ? updatedRec : item)));
          }}
        />
      )}

      {/* Add Receptionist Modal */}
      {showAddModal && (
        <ReceptionistFormModal
          onClose={() => setShowAddModal(false)}
          onSave={(rec) => {
            onSaveReceptionist(rec);
            setLiveReceptionists((prev) => [rec, ...prev]);
          }}
        />
      )}

      {/* Edit Receptionist Modal */}
      {editingReceptionist && (
        <ReceptionistFormModal
          receptionist={editingReceptionist}
          onClose={() => setEditingReceptionist(null)}
          onSave={(rec) => {
            onSaveReceptionist(rec);
            setLiveReceptionists((prev) => prev.map((item) => (item.id === rec.id ? rec : item)));
          }}
        />
      )}
    </div>
  );
};

