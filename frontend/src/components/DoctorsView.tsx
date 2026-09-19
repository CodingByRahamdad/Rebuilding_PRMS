import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Search,
  Star,
  Send,
  Plus,
  Trash2,
  Users,
  Edit2,
  Clock,
  ShieldAlert,
  Stethoscope,
  RotateCw,
  Loader2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Doctor, Patient } from '../types';
import { DoctorDetailModal } from './DoctorDetailModal';
import { DoctorFormModal } from './DoctorFormModal';
import { ApiClient } from '../services/apiClient';
import { getDepartmentNames } from '../services/departmentService';
import { isDemoMode } from '../utils/demoMode';

interface DoctorsViewProps {
  doctors: Doctor[];
  patients?: Patient[];
  departments?: any[];
  onOpenMessage: (doctorName: string, doctorId: string, role: string) => void;
  onBookAppointment?: (doctorName: string) => void;
  onSaveDoctor: (doctor: Doctor) => void;
  onDeleteDoctor?: (doctorId: string) => void;
  onViewPatientDetails?: (patient: Patient, origin?: { type: 'doctor' | 'nurse'; name: string }) => void;
}

export const DoctorsView: React.FC<DoctorsViewProps> = ({
  doctors: initialDoctors,
  patients = [],
  departments: customDepartments,
  onOpenMessage,
  onBookAppointment,
  onSaveDoctor,
  onDeleteDoctor,
  onViewPatientDetails,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [detailModalInitialTab, setDetailModalInitialTab] = useState<'overview' | 'patients' | 'reviews' | 'schedule'>('overview');
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [doctorToDelete, setDoctorToDelete] = useState<Doctor | null>(null);

  const [liveDoctors, setLiveDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Pagination state (15 doctors per page)
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 15;

  // Fetch doctors from REST API
  const fetchDoctors = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await ApiClient.getDoctors({ page: 1, limit: 50 });
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        const formatted: Doctor[] = res.data.map((item: any, idx: number) => ({
          id: item.id || item._id || `doc-${idx + 1}`,
          name: item.name || 'Dr. Medical Specialist',
          specialty: item.specialization || item.specialty || 'General Practice',
          department: item.department || 'General Medicine',
          status: item.status === 'Active' ? 'On Duty' : item.status || 'On Duty',
          patientsCount: item.totalPatients || 15,
          rating: item.rating || 4.8,
          phone: item.phone || '+1 (555) 234-5678',
          email: item.email || 'doctor@hospital.org',
          avatar: item.avatar,
          age: item.age || 45,
          address: item.address || '742 Evergreen Terrace, Springfield, OR 97477',
          degrees: item.licenseNumber ? `MD (${item.licenseNumber})` : 'MD, Specialist',
          experienceYears: typeof item.experience === 'number' ? item.experience : 12,
          bio: item.availability ? `Available: ${item.availability}` : 'Senior Specialist Consultant',
          officeRoom: item.room || 'Room 302',
          expertise: [item.specialization || item.specialty || 'Specialist Care', 'Clinical Practice'],
          languages: ['English', 'Spanish'],
          dutySchedule: [
            { day: 'Mon - Fri', shift: item.availability || '08:00 AM - 04:00 PM', location: item.department || 'Main Clinic' }
          ],
        }));
        setLiveDoctors(formatted);
      } else if (res.success && Array.isArray(res.data) && res.data.length === 0) {
        setLiveDoctors([]);
      } else {
        setLiveDoctors(isDemoMode() ? initialDoctors : []);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load doctors roster');
      setLiveDoctors(isDemoMode() ? initialDoctors : []);
    } finally {
      setLoading(false);
    }
  }, [initialDoctors]);

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  const displayDoctors = isDemoMode() ? (liveDoctors.length > 0 ? liveDoctors : initialDoctors) : liveDoctors;

  const departments = useMemo(() => {
    const names = getDepartmentNames(customDepartments);
    const docDepts = displayDoctors.map((d) => d.department).filter(Boolean);
    return ['All', ...Array.from(new Set([...names, ...docDepts]))];
  }, [customDepartments, displayDoctors]);

  const filteredDoctors = displayDoctors.filter((doc) => {
    const matchesSearch =
      doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.specialty.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.department.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = deptFilter === 'All' || doc.department.toLowerCase() === deptFilter.toLowerCase();
    return matchesSearch && matchesDept;
  });

  // Calculate pagination
  const totalItems = filteredDoctors.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedDoctors = filteredDoctors.slice(startIndex, startIndex + pageSize);

  const handleDeptChange = (dept: string) => {
    setDeptFilter(dept);
    setCurrentPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleDeleteConfirm = async () => {
    if (!doctorToDelete) return;
    setIsDeleting(true);
    try {
      await ApiClient.deleteDoctor(doctorToDelete.id);
      if (onDeleteDoctor) {
        onDeleteDoctor(doctorToDelete.id);
      }
      setLiveDoctors((prev) => prev.filter((d) => d.id !== doctorToDelete.id));
    } catch (err) {
      console.error('Delete doctor error:', err);
    } finally {
      setIsDeleting(false);
      setDoctorToDelete(null);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Physicians & Specialists Roster</span>
            {loading && <Loader2 className="w-5 h-5 text-teal-700 animate-spin" />}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Active medical staff, duty schedules, ratings & reviews, assigned patients list, and doctor management.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={fetchDoctors}
            disabled={loading}
            className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl shadow-xs transition-colors disabled:opacity-50"
            title="Refresh doctor roster from API"
          >
            <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 px-4 py-2.5 bg-teal-800 hover:bg-teal-900 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Doctor</span>
          </button>
        </div>
      </div>

      {/* Error Notification */}
      {error && (
        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs text-amber-900">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Notice: Unable to reach live doctors API ({error}). Displaying local roster.</span>
          </div>
          <button onClick={fetchDoctors} className="underline font-semibold hover:text-amber-950">Retry</button>
        </div>
      )}

      {/* Controls */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search physician name, specialty..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          />
        </div>

        <div className="flex items-center space-x-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 no-scrollbar">
          {departments.map((dept) => (
            <button
              key={dept}
              onClick={() => handleDeptChange(dept)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                deptFilter.toLowerCase() === dept.toLowerCase()
                  ? 'bg-teal-800 text-white font-semibold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {dept}
            </button>
          ))}
        </div>
      </div>

      {/* Grid or Loading / Empty States */}
      {loading && filteredDoctors.length === 0 ? (
        <div className="py-20 text-center text-slate-400 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
          <Loader2 className="w-8 h-8 mx-auto mb-3 text-teal-700 animate-spin" />
          <p className="text-xs font-medium text-slate-600">Loading physician roster from API...</p>
        </div>
      ) : filteredDoctors.length === 0 ? (
        <div className="py-20 text-center text-slate-400 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6">
          <Stethoscope className="w-10 h-10 mx-auto mb-3 text-slate-300" />
          <p className="text-sm font-semibold text-slate-700">No physician profiles found</p>
          <p className="text-xs text-slate-500 mt-1">Try adjusting search filters or adding a new doctor.</p>
          {(searchTerm || deptFilter !== 'All') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setDeptFilter('All');
                setCurrentPage(1);
              }}
              className="mt-4 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedDoctors.map((doc) => {
            // Count assigned patients
            const assignedCount = patients.filter((p) => {
              if (!p.doctor) return false;
              const docName = doc.name.toLowerCase().replace('dr. ', '').trim();
              const patDocName = p.doctor.toLowerCase().replace('dr. ', '').trim();
              return patDocName.includes(docName) || docName.includes(patDocName);
            }).length;

            return (
              <div
                key={doc.id}
                onClick={() => {
                  setDetailModalInitialTab('overview');
                  setSelectedDoctor(doc);
                }}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md hover:border-teal-300 transition-all cursor-pointer flex flex-col justify-between group relative"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-start gap-3">
                      <img
                        src={
                          doc.avatar ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(
                            doc.name
                          )}&background=0D9488&color=fff&size=100`
                        }
                        alt={doc.name}
                        className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-slate-900 text-sm leading-snug group-hover:text-teal-700 transition truncate">
                          {doc.name}
                        </h3>
                        <div className="text-xs text-teal-700 font-semibold truncate">{doc.specialty}</div>
                        <div className="text-[11px] text-slate-400">{doc.department}</div>
                      </div>
                    </div>

                    {/* Delete Option Icon Button */}
                    {onDeleteDoctor && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDoctorToDelete(doc);
                        }}
                        title="Delete doctor profile"
                        className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="space-y-2 text-xs border-t border-slate-100 pt-3">
                    <div className="flex justify-between text-slate-600">
                      <span className="text-slate-400">Experience:</span>
                      <span className="font-semibold text-slate-800">{doc.experienceYears || 12} Yrs</span>
                    </div>

                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        setDetailModalInitialTab('patients');
                        setSelectedDoctor(doc);
                      }}
                      className="flex justify-between text-slate-600 hover:text-teal-700 transition cursor-pointer p-1 -mx-1 rounded-lg hover:bg-slate-50"
                    >
                      <span className="text-slate-400 flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-teal-600" /> Assigned Patients:
                      </span>
                      <span className="font-bold text-slate-900 group-hover:text-teal-800 underline decoration-teal-300">
                        {assignedCount || doc.patientsCount} Patients
                      </span>
                    </div>

                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        setDetailModalInitialTab('reviews');
                        setSelectedDoctor(doc);
                      }}
                      className="flex justify-between text-slate-600 items-center hover:text-amber-700 transition cursor-pointer p-1 -mx-1 rounded-lg hover:bg-amber-50/50"
                    >
                      <span className="text-slate-400">Rating & Reviews:</span>
                      <span className="flex items-center font-bold text-slate-900 underline decoration-amber-300">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 mr-1" />
                        {doc.rating} ({doc.reviews?.length || 0})
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                      doc.status === 'On Duty'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : doc.status === 'In Surgery'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                        doc.status === 'On Duty'
                          ? 'bg-emerald-500'
                          : doc.status === 'In Surgery'
                          ? 'bg-amber-500'
                          : 'bg-slate-400'
                      }`}
                    />
                    {doc.status}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingDoctor(doc);
                      }}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition flex items-center gap-1"
                    >
                      <Edit2 className="w-3 h-3" /> Edit
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenMessage(doc.name, doc.id, 'Attending Physician');
                      }}
                      className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold rounded-lg transition flex items-center gap-1"
                    >
                      <Send className="w-3 h-3" /> Message
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          </div>

          {/* Pagination Controls (15 doctors per page) */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-slate-500 font-medium">
              Showing <span className="font-bold text-slate-800">{totalItems === 0 ? 0 : startIndex + 1}</span> to{' '}
              <span className="font-bold text-slate-800">{Math.min(startIndex + pageSize, totalItems)}</span> of{' '}
              <span className="font-bold text-slate-800">{totalItems}</span> physicians (15 per page)
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Previous
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition ${
                      currentPage === pageNum
                        ? 'bg-teal-800 text-white shadow-xs'
                        : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages || totalPages <= 1}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Next <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {doctorToDelete && (
        <div
          onClick={() => setDoctorToDelete(null)}
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-rose-100 space-y-4 animate-in fade-in zoom-in-95 duration-200 cursor-default"
          >
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center font-bold">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Delete Doctor Profile?</h3>
                <p className="text-xs text-slate-500">Action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed">
              Are you sure you want to permanently delete <strong>{doctorToDelete.name}</strong> from the roster?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDoctorToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 disabled:opacity-50"
              >
                {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>{isDeleting ? 'Deleting...' : 'Delete Doctor'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Doctor Profile Detail Modal */}
      {selectedDoctor && (
        <DoctorDetailModal
          doctor={selectedDoctor}
          patients={patients}
          initialTab={detailModalInitialTab}
          onClose={() => setSelectedDoctor(null)}
          onOpenMessage={onOpenMessage}
          onBookAppointment={onBookAppointment}
          onEditDoctor={(doc) => {
            setSelectedDoctor(null);
            setEditingDoctor(doc);
          }}
          onDeleteDoctor={onDeleteDoctor}
          onSaveDoctor={onSaveDoctor}
          onViewPatientDetails={onViewPatientDetails}
        />
      )}

      {/* Add Doctor Modal */}
      {showAddModal && (
        <DoctorFormModal
          departments={customDepartments}
          onClose={() => setShowAddModal(false)}
          onSave={(doc) => {
            onSaveDoctor(doc);
            setLiveDoctors((prev) => [doc, ...prev]);
          }}
        />
      )}

      {/* Edit Doctor Modal */}
      {editingDoctor && (
        <DoctorFormModal
          doctor={editingDoctor}
          departments={customDepartments}
          onClose={() => setEditingDoctor(null)}
          onSave={(doc) => {
            onSaveDoctor(doc);
            setLiveDoctors((prev) => prev.map((d) => (d.id === doc.id ? doc : d)));
          }}
          onDelete={onDeleteDoctor}
        />
      )}
    </div>
  );
};

