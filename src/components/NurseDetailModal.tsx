import React, { useState } from 'react';
import {
  X,
  HeartPulse,
  Star,
  Phone,
  Mail,
  Clock,
  Award,
  BookOpen,
  Calendar,
  Users,
  Send,
  Building2,
  ShieldCheck,
  Trash2,
  Plus,
  Edit2,
  CheckCircle,
  User,
  ChevronRight,
  ShieldAlert,
  MessageSquare,
  Sparkles,
  MapPin,
  UserPlus,
  UserMinus,
  Search,
} from 'lucide-react';
import { Nurse, Patient, DoctorReview, DoctorScheduleDay } from '../types';

interface NurseDetailModalProps {
  nurse: Nurse;
  patients?: Patient[];
  onClose: () => void;
  onOpenMessage: (nurseName: string, nurseId: string, role: string) => void;
  onEditNurse?: (nurse: Nurse) => void;
  onDeleteNurse?: (nurseId: string) => void;
  onSaveNurse?: (nurse: Nurse) => void;
  onViewPatientDetails?: (patient: Patient, origin?: { type: 'doctor' | 'nurse'; name: string }) => void;
  initialTab?: 'overview' | 'patients' | 'reviews' | 'schedule';
}

export const NurseDetailModal: React.FC<NurseDetailModalProps> = ({
  nurse,
  patients = [],
  onClose,
  onOpenMessage,
  onEditNurse,
  onDeleteNurse,
  onSaveNurse,
  onViewPatientDetails,
  initialTab = 'overview',
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'patients' | 'reviews' | 'schedule'>(initialTab);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Patient assignment & removal state
  const initialAssignedIds = React.useMemo(() => {
    if (Array.isArray(nurse.assignedPatientIds) && nurse.assignedPatientIds.length > 0) {
      return nurse.assignedPatientIds;
    }
    const matched = patients.filter((p) => {
      if (!p) return false;
      const patDept = (p.department || '').toLowerCase();
      const nurseDept = (nurse.department || '').toLowerCase();
      const nurseWard = (nurse.assignedWard || '').toLowerCase();
      const patRoom = (p.room || '').toLowerCase();
      return (
        (patDept && nurseDept && (patDept.includes(nurseDept) || nurseDept.includes(patDept))) ||
        (patRoom && nurseWard && (patRoom.includes(nurseWard) || nurseWard.includes(patRoom)))
      );
    });
    if (matched.length > 0) {
      return matched.map((p) => p.id);
    }
    return patients.slice(0, Math.min(nurse.patientLoad || 2, patients.length)).map((p) => p.id);
  }, [nurse.assignedPatientIds, nurse.department, nurse.assignedWard, nurse.patientLoad, patients]);

  const [assignedPatientIds, setAssignedPatientIds] = useState<string[]>(initialAssignedIds);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [patientSearchTerm, setPatientSearchTerm] = useState('');

  const handleAssignPatient = (patientId: string) => {
    if (assignedPatientIds.includes(patientId)) return;
    const updated = [...assignedPatientIds, patientId];
    setAssignedPatientIds(updated);
    if (onSaveNurse) {
      onSaveNurse({
        ...nurse,
        assignedPatientIds: updated,
        patientLoad: updated.length,
      });
    }
  };

  const handleRemovePatient = (patientId: string) => {
    const updated = assignedPatientIds.filter((id) => id !== patientId);
    setAssignedPatientIds(updated);
    if (onSaveNurse) {
      onSaveNurse({
        ...nurse,
        assignedPatientIds: updated,
        patientLoad: updated.length,
      });
    }
  };

  const assignedPatients = patients.filter((p) => assignedPatientIds.includes(p.id));
  const unassignedPatients = patients.filter((p) => !assignedPatientIds.includes(p.id));
  const filteredUnassigned = unassignedPatients.filter((p) => {
    const q = patientSearchTerm.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.patientCode.toLowerCase().includes(q) ||
      (p.condition && p.condition.toLowerCase().includes(q)) ||
      (p.department && p.department.toLowerCase().includes(q)) ||
      (p.room && p.room.toLowerCase().includes(q))
    );
  });

  // New review state
  const [showAddReviewForm, setShowAddReviewForm] = useState(false);
  const [newReviewerName, setNewReviewerName] = useState('');
  const [newRating, setNewRating] = useState<number>(5);
  const [newComment, setNewComment] = useState('');

  // Edit Bio State
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioInput, setBioInput] = useState(
    nurse.bio ||
      `${nurse.name} is a dedicated ${nurse.role} in the ${nurse.department} department with over ${nurse.experienceYears} years of clinical nursing experience.`
  );

  // Schedule Editing State
  const defaultDutySchedule: DoctorScheduleDay[] = [
    { day: 'Monday', shift: nurse.shift, location: nurse.assignedWard },
    { day: 'Tuesday', shift: nurse.shift, location: nurse.assignedWard },
    { day: 'Wednesday', shift: nurse.shift, location: nurse.assignedWard },
    { day: 'Thursday', shift: nurse.shift, location: nurse.assignedWard },
    { day: 'Friday', shift: nurse.shift, location: nurse.assignedWard },
  ];

  const [isEditingSchedule, setIsEditingSchedule] = useState(false);
  const [scheduleItems, setScheduleItems] = useState<DoctorScheduleDay[]>(
    nurse.dutySchedule && nurse.dutySchedule.length > 0 ? nurse.dutySchedule : defaultDutySchedule
  );

  const handleUpdateScheduleItem = (index: number, field: keyof DoctorScheduleDay, value: string) => {
    setScheduleItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const handleAddScheduleItem = () => {
    setScheduleItems((prev) => [
      ...prev,
      { day: 'Saturday', shift: nurse.shift, location: nurse.assignedWard },
    ]);
  };

  const handleRemoveScheduleItem = (index: number) => {
    setScheduleItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveSchedule = () => {
    if (onSaveNurse) {
      onSaveNurse({
        ...nurse,
        dutySchedule: scheduleItems,
      });
    }
    setIsEditingSchedule(false);
  };

  const reviewsList = nurse.reviews || [];
  const currentRating = nurse.rating || (reviewsList.length > 0 ? 4.9 : 5.0);

  // Default duty schedule if none set
  const dutySchedule: DoctorScheduleDay[] = nurse.dutySchedule || [
    { day: 'Monday', shift: nurse.shift || '07:00 AM - 03:00 PM', location: nurse.assignedWard || 'Main Ward' },
    { day: 'Tuesday', shift: nurse.shift || '07:00 AM - 03:00 PM', location: nurse.assignedWard || 'Main Ward' },
    { day: 'Wednesday', shift: nurse.shift || '07:00 AM - 03:00 PM', location: nurse.assignedWard || 'Main Ward' },
    { day: 'Thursday', shift: nurse.shift || '07:00 AM - 03:00 PM', location: nurse.assignedWard || 'Main Ward' },
    { day: 'Friday', shift: nurse.shift || '07:00 AM - 03:00 PM', location: nurse.assignedWard || 'Main Ward' },
  ];

  // Submit new review
  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReviewerName.trim() || !newComment.trim()) return;

    const newRev: DoctorReview = {
      id: `rev-${Date.now()}`,
      patientName: newReviewerName.trim(),
      rating: newRating,
      comment: newComment.trim(),
      date: new Date().toISOString().split('T')[0],
    };

    const updatedReviews = [newRev, ...reviewsList];
    const totalRatingSum = updatedReviews.reduce((sum, r) => sum + r.rating, 0);
    const calculatedAvgRating = Number((totalRatingSum / updatedReviews.length).toFixed(2));

    const updatedNurse: Nurse = {
      ...nurse,
      reviews: updatedReviews,
      rating: calculatedAvgRating,
    };

    if (onSaveNurse) {
      onSaveNurse(updatedNurse);
    }

    setNewReviewerName('');
    setNewComment('');
    setNewRating(5);
    setShowAddReviewForm(false);
  };

  const handleSaveBio = () => {
    if (onSaveNurse) {
      onSaveNurse({
        ...nurse,
        bio: bioInput.trim(),
      });
    }
    setIsEditingBio(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 md:p-6"
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200 cursor-default"
      >
        {/* Header Profile Banner */}
        <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-slate-900 p-4 sm:p-6 text-white relative shrink-0">
          <button
            id="close-nurse-profile-btn"
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 p-2 text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-full border border-slate-700/60 transition cursor-pointer z-30"
            aria-label="Close Nurse Profile"
            title="Close Profile"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="relative">
              <img
                src={
                  nurse.avatar ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    nurse.name
                  )}&background=0D9488&color=fff&size=160`
                }
                alt={nurse.name}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-white/20 shadow-md"
              />
              <span
                className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-slate-900 ${
                  nurse.status === 'On Duty' || nurse.status === 'In Ward' ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
              />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white tracking-tight truncate">
                  {nurse.name}
                </h2>
                <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] sm:text-xs font-semibold rounded-full">
                  {nurse.status}
                </span>
                <span className="px-2.5 py-0.5 bg-teal-950/80 text-teal-300 border border-teal-500/30 text-[11px] sm:text-xs font-mono font-medium rounded-full">
                  {nurse.nurseCode}
                </span>
              </div>

              <p className="text-xs sm:text-sm text-teal-200 font-medium mt-1 flex items-center gap-1.5 flex-wrap">
                <HeartPulse className="w-4 h-4 text-teal-300 shrink-0" />
                <span>{nurse.role}</span>
                <span>•</span>
                <span>{nurse.department}</span>
              </p>

              <div className="mt-2.5 flex items-center gap-3 text-xs text-slate-300 flex-wrap">
                <div
                  onClick={() => setActiveTab('reviews')}
                  className="flex items-center gap-1 text-amber-300 font-bold bg-amber-400/10 px-2 py-0.5 rounded-md border border-amber-400/20 cursor-pointer hover:bg-amber-400/20 transition"
                >
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>{currentRating.toFixed(1)}</span>
                  <span className="text-slate-300 font-normal">({reviewsList.length})</span>
                </div>

                <div className="flex items-center gap-1 bg-white/10 px-2 py-0.5 rounded-md border border-white/10">
                  <Award className="w-3.5 h-3.5 text-teal-300" />
                  <span>{nurse.experienceYears}+ Yrs Exp</span>
                </div>

                <button
                  onClick={() => setActiveTab('patients')}
                  className="flex items-center gap-1 bg-teal-500/20 hover:bg-teal-500/30 text-teal-200 px-2.5 py-0.5 rounded-md border border-teal-400/30 font-semibold transition"
                >
                  <Users className="w-3.5 h-3.5 text-teal-300" />
                  <span>{assignedPatients.length} Patients</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Action Toolbar */}
        <div className="bg-slate-100/90 border-b border-slate-200/80 px-3 sm:px-6 py-2.5 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar shrink-0">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 whitespace-nowrap">
            <Building2 className="w-4 h-4 text-teal-700 shrink-0" />
            <span className="text-slate-500">Assigned Ward:</span>
            <span className="text-slate-900 font-bold">{nurse.assignedWard}</span>
          </div>

          <div className="flex items-center gap-2 whitespace-nowrap">
            {onEditNurse && (
              <button
                onClick={() => onEditNurse(nurse)}
                className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg shadow-2xs transition flex items-center gap-1"
              >
                <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                <span>Edit</span>
              </button>
            )}

            {onDeleteNurse && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-semibold rounded-lg transition flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>Delete</span>
              </button>
            )}

            <button
              onClick={() => {
                onClose();
                onOpenMessage(nurse.name, nurse.id, 'Nursing Staff');
              }}
              className="px-3.5 py-1.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-lg shadow-2xs transition flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Message</span>
            </button>

            <button
              onClick={() => setActiveTab('schedule')}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg transition flex items-center gap-1.5"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Schedule</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white border-b border-slate-200 px-2 sm:px-6 flex items-center justify-between sm:justify-start space-x-1 sm:space-x-3 overflow-x-auto no-scrollbar text-xs font-semibold shrink-0">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2 sm:py-3 px-1.5 sm:px-1 border-b-2 transition flex items-center gap-1 whitespace-nowrap shrink-0 ${
              activeTab === 'overview'
                ? 'border-teal-700 text-teal-800 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span className="hidden sm:inline">Overview & Details</span>
            <span className="sm:hidden">Overview</span>
          </button>

          <button
            onClick={() => setActiveTab('patients')}
            className={`py-2 sm:py-3 px-1.5 sm:px-1 border-b-2 transition flex items-center gap-1 whitespace-nowrap shrink-0 ${
              activeTab === 'patients'
                ? 'border-teal-700 text-teal-800 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span className="hidden sm:inline">Assigned Patients ({assignedPatients.length})</span>
            <span className="sm:hidden">Patients ({assignedPatients.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('schedule')}
            className={`py-2 sm:py-3 px-1.5 sm:px-1 border-b-2 transition flex items-center gap-1 whitespace-nowrap shrink-0 ${
              activeTab === 'schedule'
                ? 'border-teal-700 text-teal-800 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span className="hidden sm:inline">Duty Schedule</span>
            <span className="sm:hidden">Schedule</span>
          </button>

          <button
            onClick={() => setActiveTab('reviews')}
            className={`py-2 sm:py-3 px-1.5 sm:px-1 border-b-2 transition flex items-center gap-1 whitespace-nowrap shrink-0 ${
              activeTab === 'reviews'
                ? 'border-teal-700 text-teal-800 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500 fill-amber-400 shrink-0" />
            <span className="hidden sm:inline">Ratings & Reviews ({reviewsList.length})</span>
            <span className="sm:hidden">Reviews ({reviewsList.length})</span>
          </button>
        </div>

        {/* Modal Tab Contents */}
        <div className="p-3.5 sm:p-6 overflow-y-auto space-y-4 sm:space-y-6 flex-1 bg-slate-50/50">
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-5">
              {/* Bio & Professional Summary */}
              <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200/80 shadow-xs relative">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-teal-700" />
                    <span>Professional Overview & Summary</span>
                  </h3>

                  {!isEditingBio ? (
                    <button
                      onClick={() => setIsEditingBio(true)}
                      className="text-xs text-teal-700 hover:text-teal-900 font-semibold flex items-center gap-1"
                    >
                      <Edit2 className="w-3 h-3" /> Edit Bio
                    </button>
                  ) : (
                    <button
                      onClick={handleSaveBio}
                      className="text-xs bg-teal-700 text-white px-2.5 py-1 rounded-md font-bold hover:bg-teal-800"
                    >
                      Save
                    </button>
                  )}
                </div>

                {!isEditingBio ? (
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">{bioInput}</p>
                ) : (
                  <textarea
                    value={bioInput}
                    onChange={(e) => setBioInput(e.target.value)}
                    rows={4}
                    className="w-full p-2.5 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                )}
              </div>

              {/* Certifications & Specialties */}
              <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200/80 shadow-xs space-y-3">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-teal-700" />
                  <span>Clinical Certifications & Nursing Expertise</span>
                </h3>
                <div className="flex flex-wrap gap-2 pt-1">
                  {nurse.certifications.map((cert, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-teal-50 text-teal-800 border border-teal-200/80 text-xs font-semibold rounded-lg flex items-center gap-1.5"
                    >
                      <CheckCircle className="w-3.5 h-3.5 text-teal-600" />
                      {cert}
                    </span>
                  ))}
                </div>
              </div>

              {/* Grid: Qualifications & Languages */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200/80 shadow-xs space-y-3">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-teal-700" />
                    <span>Education & Experience</span>
                  </h3>
                  <div className="space-y-2 text-xs sm:text-sm text-slate-700">
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-400">Nursing Degree:</span>
                      <span className="font-semibold text-slate-800">{nurse.degrees || 'BSN, RN'}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-400">Clinical Practice:</span>
                      <span className="font-bold text-teal-800">{nurse.experienceYears} Years</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-400">Shift Schedule:</span>
                      <span className="font-mono text-slate-800">{nurse.shift}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-400">Assigned Ward:</span>
                      <span className="font-semibold text-slate-800">{nurse.assignedWard}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200/80 shadow-xs space-y-3">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-teal-700" />
                    <span>Languages & Reachability</span>
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <span className="text-xs text-slate-400 block mb-1.5">Spoken Languages:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {(nurse.languages || ['English', 'Spanish']).map((lang, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-0.5 bg-slate-100 text-slate-700 text-xs font-semibold rounded-md border border-slate-200"
                          >
                            {lang}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 space-y-2 text-xs">
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                        <span className="font-semibold text-slate-800">{nurse.phone}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                        <span className="font-semibold text-slate-800 truncate">{nurse.email}</span>
                      </div>
                      <div className="flex items-start gap-2 pt-1 border-t border-slate-100/60">
                        <MapPin className="w-3.5 h-3.5 text-teal-700 shrink-0 mt-0.5" />
                        <span className="text-slate-700 font-medium leading-tight">
                          {nurse.address || '742 Evergreen Terrace, Springfield, OR 97477'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ASSIGNED PATIENTS */}
          {activeTab === 'patients' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200/90">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900">
                      Assigned Patients in Ward ({assignedPatients.length})
                    </h3>
                    <span className="px-2.5 py-0.5 bg-teal-100 text-teal-800 text-[11px] font-bold rounded-full border border-teal-200/60">
                      {assignedPatients.length} Active Bed{assignedPatients.length === 1 ? '' : 's'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Patients currently under the nursing supervision and clinical care of {nurse.name}.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setPatientSearchTerm('');
                    setShowAssignModal(true);
                  }}
                  className="px-3.5 py-2 bg-teal-800 hover:bg-teal-900 text-white text-xs font-semibold rounded-xl transition flex items-center gap-1.5 shadow-xs shrink-0 cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Assign Patients</span>
                </button>
              </div>

              {assignedPatients.length === 0 ? (
                <div className="bg-white p-8 rounded-xl border border-slate-200/80 text-center space-y-3">
                  <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-700">No active patients directly assigned</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Nurse {nurse.name} currently has no active patient bed load. Use the button below to assign patients.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setPatientSearchTerm('');
                      setShowAssignModal(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold rounded-xl border border-teal-200 transition cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Assign First Patient</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {assignedPatients.map((patient) => (
                    <div
                      key={patient.id}
                      className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs hover:border-teal-300 transition flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={
                                patient.avatar ||
                                `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                  patient.name
                                )}&background=0D9488&color=fff&size=80`
                              }
                              alt={patient.name}
                              className="w-10 h-10 rounded-lg object-cover border border-slate-200"
                            />
                            <div>
                              <h4 className="font-bold text-xs sm:text-sm text-slate-900">{patient.name}</h4>
                              <p className="text-[11px] text-slate-500">
                                {patient.age} yrs • {patient.gender} • <span className="font-mono">{patient.patientCode}</span>
                              </p>
                            </div>
                          </div>

                          <span
                            className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                              patient.status === 'Admitted'
                                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            }`}
                          >
                            {patient.status}
                          </span>
                        </div>

                        <div className="mt-3 space-y-1 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Condition:</span>
                            <span className="font-semibold text-slate-800">{patient.condition || 'Under Observation'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Department:</span>
                            <span className="font-medium text-slate-700">{patient.department || nurse.department}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Room / Bed:</span>
                            <span className="font-bold text-teal-800">{patient.room || 'Bed 1'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2">
                        {onViewPatientDetails && (
                          <button
                            type="button"
                            onClick={() => {
                              onViewPatientDetails(patient, { type: 'nurse', name: nurse.name });
                            }}
                            className="flex-1 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold rounded-lg border border-teal-200 transition flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <span>View Profile</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemovePatient(patient.id)}
                          className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-lg border border-rose-200 transition flex items-center gap-1 cursor-pointer"
                          title="Unassign patient from this nurse"
                        >
                          <UserMinus className="w-3.5 h-3.5" />
                          <span>Remove</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: DUTY SCHEDULE */}
          {activeTab === 'schedule' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-teal-700" /> Shift Schedule & Duty Roster
                  </h3>
                  <p className="text-xs text-slate-500">
                    Weekly shift hours and hospital ward locations for Nurse {nurse.name}.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {onSaveNurse && (
                    <button
                      type="button"
                      onClick={() => {
                        if (isEditingSchedule) {
                          handleSaveSchedule();
                        } else {
                          setIsEditingSchedule(true);
                        }
                      }}
                      className="px-3.5 py-1.5 bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      {isEditingSchedule ? (
                        <>
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Save Schedule</span>
                        </>
                      ) : (
                        <>
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Edit Duty Schedule</span>
                        </>
                      )}
                    </button>
                  )}
                  {isEditingSchedule && (
                    <button
                      type="button"
                      onClick={() => {
                        setScheduleItems(nurse.dutySchedule || defaultDutySchedule);
                        setIsEditingSchedule(false);
                      }}
                      className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-xs rounded-xl transition cursor-pointer"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>

              {isEditingSchedule ? (
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                      Manage Weekly Nurse Shift Roster ({scheduleItems.length} Days)
                    </h4>
                    <button
                      type="button"
                      onClick={handleAddScheduleItem}
                      className="px-3 py-1.5 bg-teal-50 text-teal-800 hover:bg-teal-100 font-bold text-xs rounded-xl transition flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Schedule Day</span>
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {scheduleItems.map((sched, idx) => (
                      <div
                        key={idx}
                        className="grid grid-cols-1 sm:grid-cols-12 gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl items-center"
                      >
                        <div className="sm:col-span-3">
                          <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Day</label>
                          <input
                            type="text"
                            value={sched.day}
                            onChange={(e) => handleUpdateScheduleItem(idx, 'day', e.target.value)}
                            placeholder="e.g. Monday"
                            className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500 font-medium"
                          />
                        </div>
                        <div className="sm:col-span-4">
                          <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Shift Timing</label>
                          <input
                            type="text"
                            value={sched.shift}
                            onChange={(e) => handleUpdateScheduleItem(idx, 'shift', e.target.value)}
                            placeholder="e.g. Morning (07:00 - 15:00)"
                            className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500 font-mono"
                          />
                        </div>
                        <div className="sm:col-span-4">
                          <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Assigned Ward / Station</label>
                          <input
                            type="text"
                            value={sched.location}
                            onChange={(e) => handleUpdateScheduleItem(idx, 'location', e.target.value)}
                            placeholder="e.g. Cardiac Care Unit (CCU)"
                            className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
                          />
                        </div>
                        <div className="sm:col-span-1 flex justify-end pt-3 sm:pt-0">
                          <button
                            type="button"
                            onClick={() => handleRemoveScheduleItem(idx)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Remove Shift"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={handleSaveSchedule}
                      className="px-4 py-2 bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Save Roster Changes</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
                  <table className="w-full text-left border-collapse text-xs sm:text-sm">
                    <thead>
                      <tr className="bg-slate-100/80 text-slate-600 font-semibold border-b border-slate-200">
                        <th className="p-3 sm:p-3.5">Day</th>
                        <th className="p-3 sm:p-3.5">Shift Timing</th>
                        <th className="p-3 sm:p-3.5">Assigned Ward / Location</th>
                        <th className="p-3 sm:p-3.5 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {scheduleItems.map((slot, i) => (
                        <tr key={i} className="hover:bg-slate-50/80 transition">
                          <td className="p-3 sm:p-3.5 font-bold text-slate-800">{slot.day}</td>
                          <td className="p-3 sm:p-3.5 text-slate-700 font-mono">{slot.shift}</td>
                          <td className="p-3 sm:p-3.5 text-slate-700 font-medium">{slot.location}</td>
                          <td className="p-3 sm:p-3.5 text-right">
                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold rounded-full">
                              Scheduled
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: RATINGS & REVIEWS */}
          {activeTab === 'reviews' && (
            <div className="space-y-5">
              {/* Rating Overview Card */}
              <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="text-center sm:text-left">
                    <span className="text-3xl sm:text-4xl font-extrabold text-slate-900">
                      {currentRating.toFixed(1)}
                    </span>
                    <p className="text-xs text-slate-400 font-medium mt-0.5">out of 5.0 rating</p>
                  </div>

                  <div className="border-l border-slate-200 pl-4 space-y-1">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-4 h-4 ${
                            s <= Math.round(currentRating)
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-slate-200'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-slate-500 font-semibold">
                      Based on {reviewsList.length} reviews
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowAddReviewForm(!showAddReviewForm)}
                  className="px-4 py-2 bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold rounded-xl shadow-2xs transition flex items-center gap-1.5 self-stretch sm:self-auto justify-center"
                >
                  <Plus className="w-4 h-4" />
                  <span>Write a Review</span>
                </button>
              </div>

              {/* Add Review Form */}
              {showAddReviewForm && (
                <form
                  onSubmit={handleAddReview}
                  className="bg-white p-4 sm:p-5 rounded-xl border border-teal-200 shadow-sm space-y-3 animate-in fade-in zoom-in-95 duration-150"
                >
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1">
                    <MessageSquare className="w-4 h-4 text-teal-700" />
                    <span>Post Patient or Staff Feedback</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-slate-500 font-semibold block mb-1">Your Name</label>
                      <input
                        type="text"
                        required
                        value={newReviewerName}
                        onChange={(e) => setNewReviewerName(e.target.value)}
                        placeholder="e.g. Sarah Connor / Staff"
                        className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-slate-500 font-semibold block mb-1">Rating</label>
                      <select
                        value={newRating}
                        onChange={(e) => setNewRating(Number(e.target.value))}
                        className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
                      >
                        <option value={5}>5 Stars - Excellent Nursing Care</option>
                        <option value={4}>4 Stars - Very Good</option>
                        <option value={3}>3 Stars - Average</option>
                        <option value={2}>2 Stars - Needs Improvement</option>
                        <option value={1}>1 Star - Poor</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-slate-500 font-semibold block mb-1">Comments</label>
                    <textarea
                      required
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      rows={2}
                      placeholder="Share your experience regarding Nurse care, punctuality, and responsiveness..."
                      className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowAddReviewForm(false)}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-lg transition"
                    >
                      Submit Feedback
                    </button>
                  </div>
                </form>
              )}

              {/* Reviews List */}
              <div className="space-y-3">
                {reviewsList.length === 0 ? (
                  <div className="bg-white p-8 rounded-xl border border-slate-200/80 text-center space-y-2">
                    <Star className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="text-sm font-semibold text-slate-700">No reviews recorded yet</p>
                    <p className="text-xs text-slate-400">Be the first to submit feedback for Nurse {nurse.name}.</p>
                  </div>
                ) : (
                  reviewsList.map((rev) => (
                    <div
                      key={rev.id}
                      className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xs">
                            {rev.patientName.charAt(0)}
                          </div>
                          <div>
                            <h5 className="font-bold text-xs text-slate-900">{rev.patientName}</h5>
                            <span className="text-[10px] text-slate-400">{rev.date}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-3.5 h-3.5 ${
                                s <= rev.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      <p className="text-xs text-slate-700 leading-relaxed pl-9">{rev.comment}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 sm:p-4 bg-white border-t border-slate-200 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            {onEditNurse && (
              <button
                onClick={() => onEditNurse(nurse)}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl transition"
              >
                Edit Profile
              </button>
            )}
            <button
              onClick={() => {
                onClose();
                onOpenMessage(nurse.name, nurse.id, 'Nursing Staff');
              }}
              className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" /> Message Nurse
            </button>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-xl transition"
          >
            Close
          </button>
        </div>
      </div>

      {/* Delete Confirmation Overlay */}
      {showDeleteConfirm && (
        <div
          className="fixed inset-0 z-60 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150 cursor-default"
          >
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Delete Nurse Profile?</h3>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Are you sure you want to delete <strong className="text-slate-900">{nurse.name}</strong> from the roster? This action cannot be undone.
            </p>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeleteNurse) {
                    onDeleteNurse(nurse.id);
                  }
                  setShowDeleteConfirm(false);
                  onClose();
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
              >
                Yes, Delete Nurse
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Patient Modal (Closes ONLY on clicking cross icon) */}
      {showAssignModal && (
        <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-200 max-h-[85vh] flex flex-col">
            <button
              type="button"
              onClick={() => setShowAssignModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Assign Patients to Nurse {nurse.name}
                </h3>
                <p className="text-xs text-slate-500">
                  Select hospital patients to place under Nurse {nurse.name}'s care roster.
                </p>
              </div>
            </div>

            {/* Search Bar */}
            <div className="mb-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={patientSearchTerm}
                  onChange={(e) => setPatientSearchTerm(e.target.value)}
                  placeholder="Search by patient name, code, condition, department, room..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            {/* Patient Selection List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[220px]">
              {filteredUnassigned.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-500 space-y-1">
                  <p className="text-xs font-semibold">No available patients found matching your search</p>
                  <p className="text-[11px] text-slate-400">
                    {unassignedPatients.length === 0
                      ? 'All registered hospital patients are already assigned to this nurse.'
                      : 'Try adjusting your search criteria.'}
                  </p>
                </div>
              ) : (
                filteredUnassigned.map((p) => (
                  <div
                    key={p.id}
                    className="p-3 bg-white hover:bg-teal-50/40 border border-slate-200 rounded-xl transition flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={p.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}&background=0D9488&color=fff&size=64`}
                        alt={p.name}
                        className="w-9 h-9 rounded-lg object-cover border border-slate-200 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h5 className="text-xs font-bold text-slate-900 truncate">{p.name}</h5>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded">
                            {p.patientCode}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate">
                          {p.age} yrs • {p.gender} • {p.condition || 'General'} • <span className="font-semibold text-teal-700">{p.room || 'Bed unassigned'}</span>
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAssignPatient(p.id)}
                      className="px-3 py-1.5 bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold rounded-lg transition flex items-center gap-1 shrink-0 cursor-pointer shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Assign</span>
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span className="font-medium text-slate-700">
                {assignedPatientIds.length} patient{assignedPatientIds.length === 1 ? '' : 's'} assigned to {nurse.name}
              </span>
              <button
                type="button"
                onClick={() => setShowAssignModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
