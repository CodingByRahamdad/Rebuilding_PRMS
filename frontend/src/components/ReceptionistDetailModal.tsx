import React, { useState } from 'react';
import {
  X,
  UserCheck,
  Phone,
  Mail,
  Building,
  CheckCircle,
  Globe,
  Send,
  CalendarCheck,
  Star,
  Award,
  Clock,
  Briefcase,
  ListTodo,
  MessageSquare,
  Edit2,
  Trash2,
  Calendar,
  AlertTriangle,
  ChevronRight,
  ShieldCheck,
  Plus,
  HeartHandshake,
  MapPin,
  Save,
} from 'lucide-react';
import { Receptionist, DoctorReview } from '../types';

interface ReceptionistDetailModalProps {
  receptionist: Receptionist;
  onClose: () => void;
  onOpenMessage: (receptionistName: string, receptionistId: string, role: string) => void;
  onEditReceptionist?: (receptionist: Receptionist) => void;
  onDeleteReceptionist?: (receptionistId: string) => void;
  onSaveReceptionist?: (receptionist: Receptionist) => void;
  initialTab?: 'overview' | 'schedule' | 'reviews';
}

export const ReceptionistDetailModal: React.FC<ReceptionistDetailModalProps> = ({
  receptionist,
  onClose,
  onOpenMessage,
  onEditReceptionist,
  onDeleteReceptionist,
  onSaveReceptionist,
  initialTab = 'overview',
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'schedule' | 'reviews'>(initialTab);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Overview & Details Editor State
  const [isEditingOverview, setIsEditingOverview] = useState(false);
  const [editName, setEditName] = useState(receptionist.name || '');
  const [editStaffCode, setEditStaffCode] = useState(receptionist.staffCode || '');
  const [editDeskLocation, setEditDeskLocation] = useState(receptionist.deskLocation || '');
  const [editShift, setEditShift] = useState(receptionist.shift || 'Morning Shift');
  const [editStatus, setEditStatus] = useState(receptionist.status || 'Active');
  const [editCheckInsToday, setEditCheckInsToday] = useState(receptionist.checkInsToday || 0);
  const [editExtension, setEditExtension] = useState(receptionist.extension || '');
  const [editPhone, setEditPhone] = useState(receptionist.phone || '');
  const [editEmail, setEditEmail] = useState(receptionist.email || '');
  const [editAddress, setEditAddress] = useState(receptionist.address || '');
  const [editExperienceYears, setEditExperienceYears] = useState(receptionist.experienceYears || 3);
  const [editBio, setEditBio] = useState(receptionist.bio || '');
  const [editLanguages, setEditLanguages] = useState(
    receptionist.languages ? receptionist.languages.join(', ') : 'English, Spanish'
  );
  const [editCertifications, setEditCertifications] = useState<string[]>(
    receptionist.certifications && receptionist.certifications.length > 0
      ? receptionist.certifications
      : [
          'Certified Healthcare Access Associate (CHAA)',
          'HIPAA Privacy & Confidentiality Compliance',
          'CPR & First Aid Emergency Response',
        ]
  );
  const [editTasks, setEditTasks] = useState<string[]>(
    receptionist.todaysTasks && receptionist.todaysTasks.length > 0
      ? receptionist.todaysTasks
      : [
          'Manage morning patient intake & queue flow',
          'Verify patient identification & check-in details',
          'Assist visitors with directions & visitor passes',
        ]
  );

  const handleCancelOverview = () => {
    setEditName(receptionist.name || '');
    setEditStaffCode(receptionist.staffCode || '');
    setEditDeskLocation(receptionist.deskLocation || '');
    setEditShift(receptionist.shift || 'Morning Shift');
    setEditStatus(receptionist.status || 'Active');
    setEditCheckInsToday(receptionist.checkInsToday || 0);
    setEditExtension(receptionist.extension || '');
    setEditPhone(receptionist.phone || '');
    setEditEmail(receptionist.email || '');
    setEditAddress(receptionist.address || '');
    setEditExperienceYears(receptionist.experienceYears || 3);
    setEditBio(receptionist.bio || '');
    setEditLanguages(receptionist.languages ? receptionist.languages.join(', ') : 'English, Spanish');
    setEditCertifications(
      receptionist.certifications && receptionist.certifications.length > 0
        ? receptionist.certifications
        : [
            'Certified Healthcare Access Associate (CHAA)',
            'HIPAA Privacy & Confidentiality Compliance',
            'CPR & First Aid Emergency Response',
          ]
    );
    setEditTasks(
      receptionist.todaysTasks && receptionist.todaysTasks.length > 0
        ? receptionist.todaysTasks
        : [
            'Manage morning patient intake & queue flow',
            'Verify patient identification & check-in details',
            'Assist visitors with directions & visitor passes',
          ]
    );
    setIsEditingOverview(false);
  };

  const handleSaveOverview = () => {
    const parsedLangs = editLanguages
      .split(',')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const updated: Receptionist = {
      ...receptionist,
      name: editName.trim() || receptionist.name,
      staffCode: editStaffCode.trim() || receptionist.staffCode,
      deskLocation: editDeskLocation.trim() || receptionist.deskLocation,
      shift: editShift || receptionist.shift,
      status: editStatus || receptionist.status,
      checkInsToday: Number(editCheckInsToday) || 0,
      extension: editExtension.trim() || receptionist.extension,
      phone: editPhone.trim() || receptionist.phone,
      email: editEmail.trim() || receptionist.email,
      address: editAddress.trim() || undefined,
      experienceYears: Number(editExperienceYears) || 0,
      bio: editBio.trim() || receptionist.bio,
      languages: parsedLangs.length > 0 ? parsedLangs : receptionist.languages,
      certifications: editCertifications.filter((c) => c.trim().length > 0),
      todaysTasks: editTasks.filter((t) => t.trim().length > 0),
    };

    if (onSaveReceptionist) {
      onSaveReceptionist(updated);
    }
    setIsEditingOverview(false);
  };

  const handleAddCert = () => {
    setEditCertifications((prev) => [...prev, '']);
  };

  const handleUpdateCert = (index: number, val: string) => {
    setEditCertifications((prev) => prev.map((c, i) => (i === index ? val : c)));
  };

  const handleRemoveCert = (index: number) => {
    setEditCertifications((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddTask = () => {
    setEditTasks((prev) => [...prev, '']);
  };

  const handleUpdateTask = (index: number, val: string) => {
    setEditTasks((prev) => prev.map((t, i) => (i === index ? val : t)));
  };

  const handleRemoveTask = (index: number) => {
    setEditTasks((prev) => prev.filter((_, i) => i !== index));
  };

  // Review form state
  const [newReviewerName, setNewReviewerName] = useState('');
  const [newRating, setNewRating] = useState<number>(5);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Schedule editor state
  const [isEditingSchedule, setIsEditingSchedule] = useState(false);
  const [scheduleItems, setScheduleItems] = useState(
    receptionist.dutySchedule || [
      { day: 'Monday', shift: '08:00 AM - 04:00 PM', location: receptionist.deskLocation },
      { day: 'Tuesday', shift: '08:00 AM - 04:00 PM', location: receptionist.deskLocation },
      { day: 'Wednesday', shift: '08:00 AM - 04:00 PM', location: receptionist.deskLocation },
      { day: 'Thursday', shift: '08:00 AM - 04:00 PM', location: receptionist.deskLocation },
      { day: 'Friday', shift: '08:00 AM - 02:00 PM', location: receptionist.deskLocation },
    ]
  );

  const handleUpdateScheduleItem = (index: number, field: string, value: string) => {
    setScheduleItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const handleAddScheduleItem = () => {
    setScheduleItems((prev) => [
      ...prev,
      { day: 'Saturday', shift: '08:00 AM - 02:00 PM', location: receptionist.deskLocation },
    ]);
  };

  const handleRemoveScheduleItem = (index: number) => {
    setScheduleItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveSchedule = () => {
    if (onSaveReceptionist) {
      onSaveReceptionist({
        ...receptionist,
        dutySchedule: scheduleItems,
      });
    }
    setIsEditingSchedule(false);
  };

  const reviewsList = receptionist.reviews || [];
  const reviewsCount = reviewsList.length;
  const avgRating = receptionist.rating || (reviewsCount > 0
    ? Number((reviewsList.reduce((acc, r) => acc + r.rating, 0) / reviewsCount).toFixed(1))
    : 5.0);

  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReviewerName.trim() || !newComment.trim() || !onSaveReceptionist) return;

    setIsSubmittingReview(true);
    const createdReview: DoctorReview = {
      id: `rrev-${Date.now()}`,
      patientName: newReviewerName.trim(),
      rating: newRating,
      comment: newComment.trim(),
      date: new Date().toISOString().split('T')[0],
    };

    const updatedReviews = [createdReview, ...reviewsList];
    const computedAvg = Number(
      (updatedReviews.reduce((acc, r) => acc + r.rating, 0) / updatedReviews.length).toFixed(1)
    );

    const updatedReceptionist: Receptionist = {
      ...receptionist,
      reviews: updatedReviews,
      rating: computedAvg,
    };

    onSaveReceptionist(updatedReceptionist);
    setNewReviewerName('');
    setNewComment('');
    setNewRating(5);
    setIsSubmittingReview(false);
  };

  const scheduleDays = receptionist.dutySchedule || [
    { day: 'Monday', shift: '08:00 AM - 04:00 PM', location: receptionist.deskLocation },
    { day: 'Tuesday', shift: '08:00 AM - 04:00 PM', location: receptionist.deskLocation },
    { day: 'Wednesday', shift: '08:00 AM - 04:00 PM', location: receptionist.deskLocation },
    { day: 'Thursday', shift: '08:00 AM - 04:00 PM', location: receptionist.deskLocation },
    { day: 'Friday', shift: '08:00 AM - 02:00 PM', location: receptionist.deskLocation },
  ];

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 md:p-6"
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200 cursor-default relative"
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-950 via-teal-950 to-slate-900 p-5 sm:p-6 text-white relative shrink-0">
          <button
            id="close-receptionist-profile-btn"
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="absolute top-4 right-4 p-2 text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-full border border-slate-700/60 transition cursor-pointer z-30"
            aria-label="Close Receptionist Profile"
            title="Close Profile"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <img
              src={
                receptionist.avatar ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  receptionist.name
                )}&background=0D9488&color=fff&size=128`
              }
              alt={receptionist.name}
              className="w-20 h-20 sm:w-22 sm:h-22 rounded-2xl object-cover border-2 border-white/20 shadow-md shrink-0"
            />
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  {receptionist.name}
                </h2>
                <span className="px-2.5 py-0.5 bg-teal-900/80 text-teal-200 text-xs font-mono font-bold rounded-full border border-teal-500/30">
                  {receptionist.staffCode}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    receptionist.status === 'Active'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : receptionist.status === 'On Break'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-slate-500/20 text-slate-300 border border-slate-500/40'
                  }`}
                >
                  {receptionist.status}
                </span>
              </div>

              <p className="text-xs sm:text-sm text-teal-200/90 font-medium flex items-center gap-2 flex-wrap">
                <span className="flex items-center gap-1">
                  <Building className="w-3.5 h-3.5 text-teal-400" />
                  {receptionist.deskLocation}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-teal-400" />
                  {receptionist.shift}
                </span>
              </p>

              <div className="pt-1 flex items-center gap-3 flex-wrap text-xs">
                <div className="flex items-center gap-1.5 bg-amber-400/10 border border-amber-400/30 px-2.5 py-1 rounded-lg text-amber-300 font-semibold">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>{avgRating} Rating</span>
                  <span className="text-amber-200/70 font-normal">({reviewsCount} reviews)</span>
                </div>

                <div className="flex items-center gap-1.5 bg-teal-500/10 border border-teal-500/30 px-2.5 py-1 rounded-lg text-teal-200 font-medium">
                  <CalendarCheck className="w-3.5 h-3.5 text-teal-300" />
                  <span>{receptionist.checkInsToday} Check-ins Today</span>
                </div>

                {receptionist.experienceYears && (
                  <div className="flex items-center gap-1.5 bg-white/10 border border-white/20 px-2.5 py-1 rounded-lg text-slate-200">
                    <Briefcase className="w-3.5 h-3.5 text-teal-300" />
                    <span>{receptionist.experienceYears} Yrs Experience</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Navigation Tabs Bar */}
          <div className="flex items-center gap-1 sm:gap-2 mt-5 border-t border-slate-800/80 pt-3 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                activeTab === 'overview'
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>Overview & Details</span>
            </button>

            <button
              onClick={() => setActiveTab('schedule')}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                activeTab === 'schedule'
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Duty Schedule</span>
            </button>

            <button
              onClick={() => setActiveTab('reviews')}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                activeTab === 'reviews'
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              <Star className="w-4 h-4" />
              <span>Ratings & Reviews ({reviewsCount})</span>
            </button>
          </div>
        </div>

        {/* Modal Body Content */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 bg-slate-50/60 space-y-5">
          {/* TAB 1: OVERVIEW & DETAILS */}
          {activeTab === 'overview' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              {/* Header Action Bar for Overview Edit Toggle */}
              <div className="flex items-center justify-between bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
                <div className="flex items-center gap-2">
                  <HeartHandshake className="w-4 h-4 text-teal-700" />
                  <span className="text-xs font-bold text-slate-800">
                    {isEditingOverview ? 'Editing Profile Overview & Details' : 'Front Desk Profile & Details'}
                  </span>
                </div>
                {onSaveReceptionist && (
                  <div className="flex items-center gap-2">
                    {isEditingOverview ? (
                      <>
                        <button
                          type="button"
                          onClick={handleCancelOverview}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveOverview}
                          className="px-3.5 py-1.5 bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>Save Changes</span>
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setIsEditingOverview(true)}
                        className="px-3.5 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200/80 font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Edit Overview & Details</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {isEditingOverview ? (
                /* EDIT MODE FORM CONTROLS */
                <div className="space-y-4">
                  {/* Basic Profile Identity */}
                  <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Basic Information & Status
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Full Name</label>
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Staff Code</label>
                        <input
                          type="text"
                          value={editStaffCode}
                          onChange={(e) => setEditStaffCode(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Status</label>
                        <select
                          value={editStatus}
                          onChange={(e) => setEditStatus(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
                        >
                          <option value="Active">Active</option>
                          <option value="On Break">On Break</option>
                          <option value="Off Duty">Off Duty</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Primary Shift</label>
                        <select
                          value={editShift}
                          onChange={(e) => setEditShift(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
                        >
                          <option value="Morning Shift">Morning Shift</option>
                          <option value="Evening Shift">Evening Shift</option>
                          <option value="Night Shift">Night Shift</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Years of Experience</label>
                        <input
                          type="number"
                          min="0"
                          value={editExperienceYears}
                          onChange={(e) => setEditExperienceYears(Number(e.target.value))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Profile Bio & Summary</label>
                      <textarea
                        rows={3}
                        value={editBio}
                        onChange={(e) => setEditBio(e.target.value)}
                        placeholder="Detailed front desk role summary and specializations..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                  </div>

                  {/* Desk Station & Metrics */}
                  <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Desk Station & Intake Metrics
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Station & Location</label>
                        <input
                          type="text"
                          value={editDeskLocation}
                          onChange={(e) => setEditDeskLocation(e.target.value)}
                          placeholder="e.g. Main Lobby Desk 1"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Intercom / Extension</label>
                        <input
                          type="text"
                          value={editExtension}
                          onChange={(e) => setEditExtension(e.target.value)}
                          placeholder="e.g. Ext 1001"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Check-ins Handled</label>
                        <input
                          type="number"
                          min="0"
                          value={editCheckInsToday}
                          onChange={(e) => setEditCheckInsToday(Number(e.target.value))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Contact & Residential Details */}
                  <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Contact & Residential Information
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Direct Phone</label>
                        <input
                          type="text"
                          value={editPhone}
                          onChange={(e) => setEditPhone(e.target.value)}
                          placeholder="+1 (555) 000-0000"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">Hospital Email</label>
                        <input
                          type="email"
                          value={editEmail}
                          onChange={(e) => setEditEmail(e.target.value)}
                          placeholder="receptionist@meridianhealth.org"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-teal-700" />
                        <span>Residential Address</span>
                      </label>
                      <input
                        type="text"
                        value={editAddress}
                        onChange={(e) => setEditAddress(e.target.value)}
                        placeholder="e.g. 742 Evergreen Terrace, Springfield, OR 97477"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                  </div>

                  {/* Spoken Languages */}
                  <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
                    <label className="block text-[11px] font-semibold text-slate-600">
                      Spoken Languages (comma separated)
                    </label>
                    <input
                      type="text"
                      value={editLanguages}
                      onChange={(e) => setEditLanguages(e.target.value)}
                      placeholder="e.g. English, Spanish, French"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  {/* Active Desk Responsibilities / Tasks */}
                  <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Active Desk Responsibilities & Tasks
                      </h4>
                      <button
                        type="button"
                        onClick={handleAddTask}
                        className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200/80 rounded-xl text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" /> Add Responsibility
                      </button>
                    </div>

                    <div className="space-y-2">
                      {editTasks.map((task, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={task}
                            onChange={(e) => handleUpdateTask(idx, e.target.value)}
                            placeholder="Enter task or responsibility..."
                            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveTask(idx)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Remove task"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Training & Certifications */}
                  <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Training & Certifications
                      </h4>
                      <button
                        type="button"
                        onClick={handleAddCert}
                        className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200/80 rounded-xl text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" /> Add Certification
                      </button>
                    </div>

                    <div className="space-y-2">
                      {editCertifications.map((cert, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={cert}
                            onChange={(e) => handleUpdateCert(idx, e.target.value)}
                            placeholder="Enter certification or training..."
                            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveCert(idx)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Remove certification"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Bottom Save & Cancel Bar */}
                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={handleCancelOverview}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveOverview}
                      className="px-5 py-2 bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Save className="w-4 h-4" />
                      <span>Save Overview & Details</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* VIEW MODE DISPLAY */
                <>
                  {/* Bio & Intro */}
                  <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                      <HeartHandshake className="w-4 h-4 text-teal-700" /> Front Desk Profile & Summary
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
                      {receptionist.bio ||
                        `${receptionist.name} is a vital member of the front office administration team, serving patients and visitors with high efficiency, warm empathy, and seamless triage registration.`}
                    </p>
                  </div>

                  {/* Key Quick Metrics */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
                      <div className="p-2.5 bg-teal-50 text-teal-800 rounded-xl shrink-0">
                        <Building className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[11px] text-slate-400 font-medium block">Station & Location</span>
                        <p className="text-xs font-bold text-slate-800 truncate">{receptionist.deskLocation}</p>
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
                      <div className="p-2.5 bg-teal-50 text-teal-800 rounded-xl shrink-0">
                        <Phone className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[11px] text-slate-400 font-medium block">Intercom / Extension</span>
                        <p className="text-xs font-bold text-teal-700 font-mono truncate">{receptionist.extension}</p>
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
                      <div className="p-2.5 bg-emerald-50 text-emerald-800 rounded-xl shrink-0">
                        <CalendarCheck className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[11px] text-slate-400 font-medium block">Check-ins Handled</span>
                        <p className="text-xs font-bold text-slate-900 truncate">{receptionist.checkInsToday} Patients Logged</p>
                      </div>
                    </div>
                  </div>

                  {/* Today's Desk Responsibilities / Tasks */}
                  {receptionist.todaysTasks && receptionist.todaysTasks.length > 0 && (
                    <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
                      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                        <ListTodo className="w-4 h-4 text-teal-700" /> Active Desk Responsibilities & Today's Schedule
                      </h3>
                      <div className="space-y-2">
                        {receptionist.todaysTasks.map((task, i) => (
                          <div
                            key={i}
                            className="flex items-start gap-2.5 p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-800"
                          >
                            <CheckCircle className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                            <span>{task}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Certifications & Spoken Languages */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2.5">
                      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                        <Award className="w-4 h-4 text-teal-700" /> Training & Certifications
                      </h3>
                      <div className="space-y-1.5">
                        {(receptionist.certifications || [
                          'Certified Healthcare Access Associate (CHAA)',
                          'HIPAA Privacy & Confidentiality Compliance',
                          'CPR & First Aid Emergency Response',
                        ]).map((cert, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-xs text-slate-700">
                            <ShieldCheck className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                            <span>{cert}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2.5">
                      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                        <Globe className="w-4 h-4 text-teal-700" /> Spoken Languages
                      </h3>
                      <div className="flex flex-wrap gap-2 pt-1">
                        {receptionist.languages.map((lang, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1.5 bg-teal-50 border border-teal-200/70 text-teal-900 text-xs font-bold rounded-xl flex items-center gap-1.5"
                          >
                            🌐 {lang}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Direct Reachability / Contact Information & Residential Address */}
                  <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Direct Contact Details
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
                      <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <Phone className="w-4 h-4 text-teal-700 shrink-0" />
                        <div>
                          <span className="text-[10px] text-slate-400 block font-medium">Direct Phone</span>
                          <span className="font-semibold text-slate-800">{receptionist.phone}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <Mail className="w-4 h-4 text-teal-700 shrink-0" />
                        <div className="min-w-0">
                          <span className="text-[10px] text-slate-400 block font-medium">Hospital Email</span>
                          <span className="font-semibold text-slate-800 truncate block">{receptionist.email}</span>
                        </div>
                      </div>
                    </div>

                    {receptionist.address && (
                      <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs sm:text-sm">
                        <MapPin className="w-4 h-4 text-teal-700 shrink-0" />
                        <div className="min-w-0">
                          <span className="text-[10px] text-slate-400 block font-medium">Residential Address</span>
                          <span className="font-semibold text-slate-800 block">{receptionist.address}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB 2: DUTY SCHEDULE */}
          {activeTab === 'schedule' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-teal-50 border border-teal-200/80 p-3.5 rounded-2xl">
                <div className="flex items-center gap-2 text-xs text-teal-900">
                  <Clock className="w-4 h-4 text-teal-700 shrink-0" />
                  <span>
                    Primary Shift: <strong>{receptionist.shift}</strong> ({receptionist.deskLocation})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {onSaveReceptionist && (
                    <button
                      type="button"
                      onClick={() => {
                        if (isEditingSchedule) {
                          handleSaveSchedule();
                        } else {
                          setIsEditingSchedule(true);
                        }
                      }}
                      className="px-3 py-1.5 bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer"
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
                        setScheduleItems(receptionist.dutySchedule || scheduleDays);
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
                      Manage Weekly Duty Shifts ({scheduleItems.length})
                    </h4>
                    <button
                      type="button"
                      onClick={handleAddScheduleItem}
                      className="px-3 py-1.5 bg-teal-50 text-teal-800 hover:bg-teal-100 font-bold text-xs rounded-xl transition flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Shift Day</span>
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
                          <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Assigned Desk/Location</label>
                          <input
                            type="text"
                            value={sched.location}
                            onChange={(e) => handleUpdateScheduleItem(idx, 'location', e.target.value)}
                            placeholder="e.g. Main Lobby Desk 1"
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
                      <span>Save Updated Roster</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider">
                        <tr>
                          <th className="px-4 py-3 font-semibold">Day of Week</th>
                          <th className="px-4 py-3 font-semibold">Shift Hours</th>
                          <th className="px-4 py-3 font-semibold">Assigned Reception Desk</th>
                          <th className="px-4 py-3 font-semibold text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-800">
                        {scheduleItems.map((sched, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/80 transition">
                            <td className="px-4 py-3.5 font-bold text-slate-900">{sched.day}</td>
                            <td className="px-4 py-3.5 font-mono text-teal-800 font-semibold">{sched.shift}</td>
                            <td className="px-4 py-3.5 text-slate-700">{sched.location}</td>
                            <td className="px-4 py-3.5 text-right">
                              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-[11px] rounded-full">
                                Scheduled
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: RATINGS & REVIEWS */}
          {activeTab === 'reviews' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              {/* Rating Summary Card */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex flex-col items-center justify-center shrink-0">
                    <span className="text-2xl font-black">{avgRating}</span>
                    <div className="flex items-center text-amber-400">
                      <Star className="w-3 h-3 fill-amber-400" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900">Patient & Staff Service Score</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Based on {reviewsCount} verified patient reception & check-in reviews.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-amber-400">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-5 h-5 ${
                        star <= Math.round(avgRating) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Write a Review Section */}
              {onSaveReceptionist && (
                <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-teal-700" /> Post Feedback / Review for {receptionist.name}
                  </h4>
                  <form onSubmit={handleAddReview} className="space-y-3 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Your Name / Title *</label>
                        <input
                          type="text"
                          required
                          value={newReviewerName}
                          onChange={(e) => setNewReviewerName(e.target.value)}
                          placeholder="e.g. Maria Gonzalez (Patient) or Dr. Smith"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Rating (1 to 5 Stars)</label>
                        <select
                          value={newRating}
                          onChange={(e) => setNewRating(Number(e.target.value))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                        >
                          <option value={5}>⭐⭐⭐⭐⭐ (5 - Outstanding)</option>
                          <option value={4}>⭐⭐⭐⭐ (4 - Very Good)</option>
                          <option value={3}>⭐⭐⭐ (3 - Satisfactory)</option>
                          <option value={2}>⭐⭐ (2 - Needs Improvement)</option>
                          <option value={1}>⭐ (1 - Poor)</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Feedback Comment *</label>
                      <textarea
                        required
                        rows={2}
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Write details about your reception experience, desk check-in speed, or helpfulness..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                      />
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={isSubmittingReview}
                        className="px-4 py-2 bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Submit Review</span>
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Reviews List */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  All Patient Feedback ({reviewsList.length})
                </h4>

                {reviewsList.length === 0 ? (
                  <div className="bg-white p-6 rounded-2xl border border-slate-200/80 text-center text-slate-400 text-xs">
                    No reviews submitted yet for {receptionist.name}. Be the first to leave feedback above!
                  </div>
                ) : (
                  reviewsList.map((rev) => (
                    <div
                      key={rev.id}
                      className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900">{rev.patientName}</span>
                          <span className="text-[10px] text-slate-400 font-medium">• {rev.date}</span>
                        </div>
                        <div className="flex items-center text-amber-400">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-3.5 h-3.5 ${
                                s <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed">{rev.comment}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Bar */}
        <div className="p-4 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 justify-between sm:justify-start">
            {onDeleteReceptionist && (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-xl border border-rose-200 transition flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            )}

            {onEditReceptionist && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEditReceptionist(receptionist);
                }}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5 text-slate-600" />
                <span>Edit Profile</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 justify-end">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenMessage(receptionist.name, receptionist.id, 'Reception Staff');
              }}
              className="px-4 py-2 bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Message Receptionist</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-xl transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>

        {/* Delete Confirmation Modal Overlay */}
        {showDeleteConfirm && (
          <div className="absolute inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 text-center border border-slate-200 shadow-2xl animate-in fade-in zoom-in-95">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 mx-auto flex items-center justify-center">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">Delete Receptionist Staff?</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Are you sure you want to remove <strong>{receptionist.name}</strong> ({receptionist.staffCode}) from the system roster?
                </p>
              </div>

              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (onDeleteReceptionist) onDeleteReceptionist(receptionist.id);
                    setShowDeleteConfirm(false);
                    onClose();
                  }}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
                >
                  Yes, Delete Staff
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
