import React, { useState } from 'react';
import {
  X,
  Stethoscope,
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
  MapPin,
  Home,
} from 'lucide-react';
import { Doctor, Patient, DoctorReview } from '../types';

interface DoctorDetailModalProps {
  doctor: Doctor;
  patients?: Patient[];
  onClose: () => void;
  onOpenMessage: (doctorName: string, doctorId: string, role: string) => void;
  onBookAppointment?: (doctorName: string) => void;
  onEditDoctor?: (doctor: Doctor) => void;
  onDeleteDoctor?: (doctorId: string) => void;
  onSaveDoctor?: (doctor: Doctor) => void;
  onViewPatientDetails?: (patient: Patient, origin?: { type: 'doctor' | 'nurse'; name: string }) => void;
  initialTab?: 'overview' | 'patients' | 'reviews' | 'schedule';
}

export const DoctorDetailModal: React.FC<DoctorDetailModalProps> = ({
  doctor,
  patients = [],
  onClose,
  onOpenMessage,
  onBookAppointment,
  onEditDoctor,
  onDeleteDoctor,
  onSaveDoctor,
  onViewPatientDetails,
  initialTab = 'overview',
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'patients' | 'reviews' | 'schedule'>(initialTab);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // New review state
  const [showAddReviewForm, setShowAddReviewForm] = useState(false);
  const [newReviewerName, setNewReviewerName] = useState('');
  const [newRating, setNewRating] = useState<number>(5);
  const [newComment, setNewComment] = useState('');

  // Schedule editing state
  const [isEditingSchedule, setIsEditingSchedule] = useState(false);
  const [scheduleItems, setScheduleItems] = useState(
    doctor.dutySchedule && doctor.dutySchedule.length > 0
      ? doctor.dutySchedule
      : [{ day: 'Monday - Friday', shift: '08:00 AM - 04:00 PM', location: doctor.department || 'Outpatient Clinic' }]
  );

  const handleUpdateScheduleItem = (index: number, field: string, value: string) => {
    setScheduleItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const handleAddScheduleItem = () => {
    setScheduleItems((prev) => [
      ...prev,
      { day: 'Saturday', shift: '09:00 AM - 01:00 PM', location: `${doctor.department || 'Clinical'} Ward` },
    ]);
  };

  const handleRemoveScheduleItem = (index: number) => {
    setScheduleItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveSchedule = () => {
    if (onSaveDoctor) {
      onSaveDoctor({
        ...doctor,
        dutySchedule: scheduleItems,
      });
    }
    setIsEditingSchedule(false);
  };

  // Find assigned patients
  const assignedPatients = patients.filter((p) => {
    if (!p.doctor) return false;
    const docName = doctor.name.toLowerCase().replace('dr. ', '').trim();
    const patDocName = p.doctor.toLowerCase().replace('dr. ', '').trim();
    return patDocName.includes(docName) || docName.includes(patDocName);
  });

  const reviewsList = doctor.reviews || [];

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

    const updatedDoc: Doctor = {
      ...doctor,
      reviews: updatedReviews,
      rating: calculatedAvgRating,
    };

    if (onSaveDoctor) {
      onSaveDoctor(updatedDoc);
    }

    setNewReviewerName('');
    setNewComment('');
    setNewRating(5);
    setShowAddReviewForm(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 md:p-6"
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200 cursor-default"
      >
        {/* Banner & Header Profile */}
        <div className="relative bg-gradient-to-r from-teal-900 via-slate-900 to-teal-800 p-3.5 sm:p-6 text-white">
          <button
            id="close-doctor-profile-btn"
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2 text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-full border border-slate-700/60 transition cursor-pointer z-30"
            aria-label="Close Doctor Profile"
            title="Close Profile"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          <div className="flex flex-row items-start gap-3 sm:gap-5 pr-8 sm:pr-0">
            <div className="relative shrink-0">
              <img
                src={
                  doctor.avatar ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    doctor.name
                  )}&background=0D9488&color=fff&size=120`
                }
                alt={doctor.name}
                className="w-14 h-14 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl object-cover border-2 sm:border-4 border-white/20 shadow-lg"
              />
              <span
                className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border-2 border-slate-900 ${
                  doctor.status === 'On Duty'
                    ? 'bg-emerald-500'
                    : doctor.status === 'In Surgery'
                    ? 'bg-amber-500'
                    : doctor.status === 'Available'
                    ? 'bg-teal-400'
                    : 'bg-slate-400'
                }`}
              />
            </div>

            <div className="space-y-0.5 sm:space-y-1 flex-1 min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <h2 className="text-base sm:text-xl font-bold tracking-tight text-white leading-tight truncate">
                  {doctor.name}
                </h2>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold ${
                    doctor.status === 'On Duty'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : doctor.status === 'In Surgery'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : doctor.status === 'Available'
                      ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                      : 'bg-slate-700 text-slate-300'
                  }`}
                >
                  {doctor.status}
                </span>
              </div>

              <p className="text-xs sm:text-sm font-medium text-teal-300 flex items-center gap-1 truncate">
                <Stethoscope className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{doctor.specialty} • {doctor.department}</span>
              </p>

              <p className="text-[11px] sm:text-xs text-slate-300 truncate hidden sm:block">
                {doctor.degrees || 'MD, Senior Specialist'}
              </p>

              <div className="pt-1 flex items-center gap-2 sm:gap-4 text-[11px] sm:text-xs text-slate-200 flex-wrap">
                <button
                  onClick={() => setActiveTab('reviews')}
                  className="flex items-center gap-1 font-bold text-amber-300 hover:underline"
                >
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> {doctor.rating} ({reviewsList.length})
                </button>
                <span className="text-slate-500">•</span>
                <span className="flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-teal-400" /> {doctor.experienceYears || 12}+ Yrs
                </span>
                <span className="text-slate-500">•</span>
                <button
                  onClick={() => setActiveTab('patients')}
                  className="flex items-center gap-1 font-bold text-teal-300 hover:underline"
                >
                  <Users className="w-3.5 h-3.5 text-teal-400" /> {assignedPatients.length || doctor.patientsCount} Patients
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Action Bar */}
        <div className="bg-slate-100 p-2.5 sm:p-3 px-3 sm:px-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-medium text-slate-700 truncate">
            <Building2 className="w-3.5 h-3.5 text-teal-700 shrink-0" />
            <span className="truncate">Office: <strong className="text-slate-900">{doctor.officeRoom || 'Main Pavilion Suite 300'}</strong></span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar pb-0.5 sm:pb-0 shrink-0">
            {onEditDoctor && (
              <button
                onClick={() => {
                  onEditDoctor(doctor);
                }}
                className="px-2.5 py-1 sm:px-3 sm:py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-[11px] sm:text-xs font-bold rounded-lg transition flex items-center gap-1 whitespace-nowrap shrink-0"
              >
                <Edit2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Edit
              </button>
            )}

            {onDeleteDoctor && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-2.5 py-1 sm:px-3 sm:py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-800 text-[11px] sm:text-xs font-bold rounded-lg transition flex items-center gap-1 whitespace-nowrap shrink-0"
              >
                <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Delete
              </button>
            )}

            <button
              onClick={() => {
                onClose();
                onOpenMessage(doctor.name, doctor.id, 'Attending Physician');
              }}
              className="px-2.5 py-1 sm:px-3.5 sm:py-1.5 bg-teal-700 hover:bg-teal-800 text-white text-[11px] sm:text-xs font-bold rounded-lg transition flex items-center gap-1 whitespace-nowrap shrink-0 shadow-xs"
            >
              <Send className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Message
            </button>

            {onBookAppointment && (
              <button
                onClick={() => {
                  onClose();
                  onBookAppointment(doctor.name);
                }}
                className="px-2.5 py-1 sm:px-3.5 sm:py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-[11px] sm:text-xs font-bold rounded-lg transition flex items-center gap-1 whitespace-nowrap shrink-0 shadow-xs"
              >
                <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Schedule
              </button>
            )}
          </div>
        </div>

        {/* DELETE CONFIRMATION MODAL OVERLAY */}
        {showDeleteConfirm && (
          <div className="bg-rose-50 p-3 sm:p-4 border-b border-rose-200 flex flex-col sm:flex-row items-center justify-between gap-2.5 animate-in fade-in">
            <div className="flex items-center gap-2 text-rose-900 text-xs font-semibold">
              <ShieldAlert className="w-4 h-4 sm:w-5 sm:h-5 text-rose-600 shrink-0" />
              <span>Are you sure you want to delete <strong>{doctor.name}</strong>?</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => {
                  if (onDeleteDoctor) {
                    onDeleteDoctor(doctor.id);
                  }
                  onClose();
                }}
                className="px-3 py-1 bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs rounded-lg transition"
              >
                Confirm Delete
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-lg transition"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

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
            <span className="hidden sm:inline">Assigned Patients ({assignedPatients.length || doctor.patientsCount})</span>
            <span className="sm:hidden">Patients ({assignedPatients.length || doctor.patientsCount})</span>
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
            <div className="space-y-6">
              {/* Biography & Languages */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-teal-600" /> Professional Overview & Biography
                  </h3>
                  {onEditDoctor && (
                    <button
                      onClick={() => onEditDoctor(doctor)}
                      className="text-xs text-teal-700 font-bold hover:underline flex items-center gap-1"
                    >
                      <Edit2 className="w-3 h-3" /> Edit Bio
                    </button>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                  {doctor.bio ||
                    `${doctor.name} is a senior clinical specialist in ${doctor.department} with extensive expertise in advanced patient care, clinical diagnosis, and specialized operations.`}
                </p>

                {doctor.languages && (
                  <div className="pt-2 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-600">
                    <span className="font-bold text-slate-800">Languages Spoken:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {doctor.languages.map((lang, idx) => (
                        <span key={idx} className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-xs font-medium">
                          {lang}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Clinical Expertise */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-teal-600" /> Clinical Expertise & Focus Areas
                </h3>
                <div className="flex flex-wrap gap-2">
                  {doctor.expertise && doctor.expertise.length > 0 ? (
                    doctor.expertise.map((item, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1.5 bg-teal-50/80 text-teal-800 border border-teal-200/80 text-xs font-semibold rounded-xl flex items-center gap-1.5"
                      >
                        <CheckCircle className="w-3.5 h-3.5 text-teal-600" />
                        {item}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-500">General Clinical & Surgical Practice</span>
                  )}
                </div>
              </div>

              {/* Quick Contact, Address & Location Info */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Contact & Residential Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
                  <div className="flex items-center gap-2.5 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <Phone className="w-4 h-4 text-teal-600 shrink-0" />
                    <div>
                      <span className="text-slate-400 text-xs block">Phone Number</span>
                      <span className="font-semibold text-slate-800">{doctor.phone}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <Mail className="w-4 h-4 text-teal-600 shrink-0" />
                    <div className="min-w-0">
                      <span className="text-slate-400 text-xs block">Official Email</span>
                      <span className="font-semibold text-slate-800 truncate block">{doctor.email}</span>
                    </div>
                  </div>

                  {/* Residential Address */}
                  <div className="flex items-start gap-2.5 p-3 bg-slate-50 rounded-xl border border-slate-100 sm:col-span-2">
                    <MapPin className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <span className="text-slate-400 text-xs block">Residential / Mailing Address</span>
                      <span className="font-semibold text-slate-800 block">
                        {doctor.address || '742 Evergreen Terrace, Springfield, OR 97477'}
                      </span>
                    </div>
                  </div>

                  {/* Age & Office Room */}
                  <div className="flex items-center gap-2.5 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <User className="w-4 h-4 text-teal-600 shrink-0" />
                    <div>
                      <span className="text-slate-400 text-xs block">Physician Age</span>
                      <span className="font-semibold text-slate-800">{doctor.age ? `${doctor.age} Years Old` : '45 Years Old'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <Building2 className="w-4 h-4 text-teal-600 shrink-0" />
                    <div>
                      <span className="text-slate-400 text-xs block">Assigned Consultation Room</span>
                      <span className="font-semibold text-slate-800">{doctor.officeRoom || 'Main Clinic Suite 300'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ASSIGNED PATIENTS LIST */}
          {activeTab === 'patients' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Patients Assigned to {doctor.name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Active hospital admissions, outpatient consultations, and follow-up patients.
                  </p>
                </div>
                <span className="px-3 py-1 bg-teal-100 text-teal-800 font-bold rounded-xl text-xs self-start sm:self-auto">
                  {assignedPatients.length} Patients
                </span>
              </div>

              {assignedPatients.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {assignedPatients.map((pat) => (
                    <div
                      key={pat.id}
                      className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3 hover:border-teal-300 transition"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={
                            pat.avatar ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(
                              pat.name
                            )}&background=14B8A6&color=fff&size=80`
                          }
                          alt={pat.name}
                          className="w-11 h-11 rounded-xl object-cover border border-slate-200 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <h4 className="font-bold text-slate-900 text-xs truncate">{pat.name}</h4>
                            <span className="text-[10px] font-mono text-slate-400">{pat.patientCode}</span>
                          </div>
                          <p className="text-[11px] text-slate-500">
                            {pat.age} Yrs • {pat.gender} • {pat.bloodType}
                          </p>
                        </div>
                      </div>

                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs space-y-1">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Condition:</span>
                          <span className="font-semibold text-slate-800">{pat.condition}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Room / Ward:</span>
                          <span className="font-semibold text-slate-800">{pat.room}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            pat.status === 'Admitted'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : pat.status === 'Outpatient'
                              ? 'bg-teal-50 text-teal-700 border border-teal-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {pat.status}
                        </span>

                        {onViewPatientDetails && (
                          <button
                            onClick={() => {
                              onViewPatientDetails(pat, { type: 'doctor', name: doctor.name });
                            }}
                            className="px-2.5 py-1 bg-teal-800 hover:bg-teal-900 text-white text-[11px] font-semibold rounded-lg transition flex items-center gap-1 cursor-pointer"
                          >
                            <span>View Profile</span>
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-2">
                  <Users className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="text-xs font-semibold text-slate-700">No Assigned Patients Listed</p>
                  <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                    There are currently no active patient records assigned directly to {doctor.name}.
                  </p>
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
                    <Clock className="w-4 h-4 text-teal-700" /> Duty Roster & Shift Schedules
                  </h3>
                  <p className="text-xs text-slate-500">
                    Weekly hospital ward rounds, outpatient clinic duty, and operating theatre shifts.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {onSaveDoctor && (
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
                        setScheduleItems(doctor.dutySchedule || []);
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
                      Manage Weekly Duty Roster ({scheduleItems.length} Days)
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
                          <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Shift Hours</label>
                          <input
                            type="text"
                            value={sched.shift}
                            onChange={(e) => handleUpdateScheduleItem(idx, 'shift', e.target.value)}
                            placeholder="e.g. 08:00 AM - 04:00 PM"
                            className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500 font-mono"
                          />
                        </div>
                        <div className="sm:col-span-4">
                          <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Location / Ward</label>
                          <input
                            type="text"
                            value={sched.location}
                            onChange={(e) => handleUpdateScheduleItem(idx, 'location', e.target.value)}
                            placeholder="e.g. Cardiology OPD Suite 3"
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
                      <span>Save Schedule Changes</span>
                    </button>
                  </div>
                </div>
              ) : (
                scheduleItems && scheduleItems.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {scheduleItems.map((sched, idx) => (
                      <div
                        key={idx}
                        className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-2 flex items-center justify-between"
                      >
                        <div className="space-y-0.5">
                          <span className="font-bold text-slate-900 text-xs block">{sched.day}</span>
                          <p className="text-xs text-slate-500">{sched.location}</p>
                        </div>
                        <span className="px-3 py-1.5 bg-teal-50 font-mono font-bold text-teal-800 border border-teal-200/80 rounded-xl text-xs">
                          {sched.shift}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 bg-white rounded-2xl border border-slate-200 text-center text-xs text-slate-600">
                    Standard OPD Duty: Mon - Fri (08:00 AM - 04:00 PM)
                  </div>
                )
              )}
            </div>
          )}

          {/* TAB 4: RATINGS & REVIEWS */}
          {activeTab === 'reviews' && (
            <div className="space-y-5">
              {/* Overall Rating Header Card */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4 text-center sm:text-left">
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl shrink-0">
                    <span className="text-3xl font-extrabold text-amber-600 block">{doctor.rating}</span>
                    <div className="flex items-center justify-center gap-0.5 text-amber-400 mt-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Patient Satisfaction Score</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Based on {reviewsList.length} verified patient feedback ratings and reviews.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowAddReviewForm(!showAddReviewForm)}
                  className="px-4 py-2 bg-teal-800 hover:bg-teal-900 text-white font-semibold text-xs rounded-xl transition flex items-center gap-1.5 shadow-xs shrink-0"
                >
                  <Plus className="w-4 h-4" /> Add Patient Review
                </button>
              </div>

              {/* Add Review Form */}
              {showAddReviewForm && (
                <form
                  onSubmit={handleAddReview}
                  className="bg-white p-5 rounded-2xl border border-teal-200 shadow-sm space-y-4 animate-in fade-in"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <h4 className="font-bold text-slate-900 text-xs">Submit New Patient Review</h4>
                    <button
                      type="button"
                      onClick={() => setShowAddReviewForm(false)}
                      className="text-slate-400 hover:text-slate-600 text-xs font-bold"
                    >
                      Cancel
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Patient Name *</label>
                      <input
                        type="text"
                        required
                        value={newReviewerName}
                        onChange={(e) => setNewReviewerName(e.target.value)}
                        placeholder="e.g. John Miller"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Rating (1 to 5 Stars) *</label>
                      <div className="flex items-center gap-2 pt-1">
                        {[1, 2, 3, 4, 5].map((starVal) => (
                          <button
                            key={starVal}
                            type="button"
                            onClick={() => setNewRating(starVal)}
                            className="p-1 transition focus:outline-none"
                          >
                            <Star
                              className={`w-6 h-6 ${
                                starVal <= newRating
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-slate-300'
                              }`}
                            />
                          </button>
                        ))}
                        <span className="text-xs font-bold text-slate-800 ml-2">{newRating} Stars</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1 text-xs">Review Comment *</label>
                    <textarea
                      rows={3}
                      required
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Share your experience regarding diagnosis, consultation quality, and care..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold rounded-xl transition"
                    >
                      Post Review
                    </button>
                  </div>
                </form>
              )}

              {/* Reviews List */}
              <div className="space-y-3">
                {reviewsList.length > 0 ? (
                  reviewsList.map((rev) => (
                    <div
                      key={rev.id}
                      className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-800 font-bold text-xs flex items-center justify-center">
                            {rev.patientName.charAt(0)}
                          </div>
                          <div>
                            <h5 className="font-bold text-slate-900 text-xs">{rev.patientName}</h5>
                            <span className="text-[10px] text-slate-400">{rev.date}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          <span className="text-xs font-bold text-amber-800">{rev.rating}.0</span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-700 leading-relaxed italic pl-10">
                        "{rev.comment}"
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-2">
                    <Star className="w-10 h-10 text-slate-300 mx-auto" />
                    <p className="text-xs font-semibold text-slate-700">No Ratings or Reviews Yet</p>
                    <p className="text-[11px] text-slate-400">
                      Be the first patient to submit a review for {doctor.name}.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-xl transition"
          >
            Close Profile
          </button>
        </div>
      </div>
    </div>
  );
};
