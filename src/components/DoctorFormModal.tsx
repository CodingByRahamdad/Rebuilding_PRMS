import React, { useState } from 'react';
import {
  X,
  Stethoscope,
  Upload,
  Camera,
  Plus,
  Trash2,
  Clock,
  Check,
  ShieldAlert,
} from 'lucide-react';
import { Doctor, DoctorScheduleDay } from '../types';
import { getDepartmentNames } from '../services/departmentService';

interface DoctorFormModalProps {
  doctor?: Doctor | null;
  departments?: any[];
  onClose: () => void;
  onSave: (doctor: Doctor) => void;
  onDelete?: (doctorId: string) => void;
}

export const DoctorFormModal: React.FC<DoctorFormModalProps> = ({
  doctor,
  departments: customDepartments,
  onClose,
  onSave,
  onDelete,
}) => {
  const isEditing = Boolean(doctor);
  const availableDeptNames = getDepartmentNames(customDepartments);

  const [name, setName] = useState(doctor?.name || '');
  const [specialty, setSpecialty] = useState(doctor?.specialty || 'Cardiology');
  const [department, setDepartment] = useState(
    doctor?.department || availableDeptNames[0] || 'Cardiology'
  );
  const [status, setStatus] = useState<Doctor['status']>(doctor?.status || 'On Duty');
  const [phone, setPhone] = useState(doctor?.phone || '+1 (555) 019-2831');
  const [email, setEmail] = useState(doctor?.email || '');
  const [password, setPassword] = useState(doctor?.password || '');
  const [avatar, setAvatar] = useState(doctor?.avatar || '');
  const [age, setAge] = useState<number | ''>(doctor?.age ?? 45);
  const [address, setAddress] = useState(doctor?.address || '');
  const [experienceYears, setExperienceYears] = useState(doctor?.experienceYears || 10);
  const [rating, setRating] = useState(doctor?.rating || 4.8);
  const [degrees, setDegrees] = useState(doctor?.degrees || 'MD, Senior Specialist');
  const [officeRoom, setOfficeRoom] = useState(doctor?.officeRoom || 'Suite 301, Wing A');
  const [bio, setBio] = useState(doctor?.bio || 'Dedicated medical professional with extensive expertise in patient care.');

  // Expertise tags
  const [expertise, setExpertise] = useState<string[]>(
    doctor?.expertise || [specialty, 'Patient Care', 'Clinical Research']
  );
  const [newExpertiseInput, setNewExpertiseInput] = useState('');

  // Languages
  const [languages, setLanguages] = useState<string[]>(
    doctor?.languages || ['English', 'Spanish']
  );
  const [newLanguageInput, setNewLanguageInput] = useState('');

  // Duty Schedule state
  const [dutySchedule, setDutySchedule] = useState<DoctorScheduleDay[]>(
    doctor?.dutySchedule && doctor.dutySchedule.length > 0
      ? doctor.dutySchedule
      : [
          { day: 'Monday - Friday', shift: '08:00 AM - 04:00 PM', location: department },
        ]
  );

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddScheduleDay = () => {
    setDutySchedule((prev) => [
      ...prev,
      { day: 'Saturday', shift: '09:00 AM - 01:00 PM', location: `${department} OPD` },
    ]);
  };

  const handleUpdateScheduleDay = (
    index: number,
    field: keyof DoctorScheduleDay,
    value: string
  ) => {
    setDutySchedule((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, [field]: value } : item))
    );
  };

  const handleRemoveScheduleDay = (index: number) => {
    setDutySchedule((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleAddExpertise = () => {
    if (newExpertiseInput.trim() && !expertise.includes(newExpertiseInput.trim())) {
      setExpertise((prev) => [...prev, newExpertiseInput.trim()]);
      setNewExpertiseInput('');
    }
  };

  const handleRemoveExpertise = (tag: string) => {
    setExpertise((prev) => prev.filter((t) => t !== tag));
  };

  const handleAddLanguage = () => {
    if (newLanguageInput.trim() && !languages.includes(newLanguageInput.trim())) {
      setLanguages((prev) => [...prev, newLanguageInput.trim()]);
      setNewLanguageInput('');
    }
  };

  const handleRemoveLanguage = (lang: string) => {
    setLanguages((prev) => prev.filter((l) => l !== lang));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const savedDoctor: Doctor = {
      id: doctor?.id || `doc-${Date.now()}`,
      name: name.trim(),
      specialty: specialty.trim(),
      department: department.trim(),
      status,
      patientsCount: doctor?.patientsCount || 12,
      rating: Number(rating),
      phone: phone.trim(),
      email: email.trim() || `${name.toLowerCase().replace(/\s+/g, '.')}@meridianhealth.org`,
      password: password.trim() || undefined,
      avatar: avatar.trim() || undefined,
      age: age !== '' ? Number(age) : undefined,
      address: address.trim() || undefined,
      degrees: degrees.trim(),
      experienceYears: Number(experienceYears),
      bio: bio.trim(),
      officeRoom: officeRoom.trim(),
      expertise,
      languages,
      dutySchedule,
      reviews: doctor?.reviews || [],
    };

    onSave(savedDoctor);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
    >
      <div
        className="bg-white rounded-2xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-200 cursor-default max-h-[90vh] overflow-y-auto"
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5 border-b border-slate-100 pb-4">
          <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold shrink-0">
            <Stethoscope className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {isEditing ? 'Edit Doctor Profile & Duty Schedule' : 'Add New Physician / Specialist'}
            </h2>
            <p className="text-xs text-slate-500">
              {isEditing
                ? 'Update doctor profile details, qualifications, clinical focus, and duty working hours.'
                : 'Register a new doctor to the hospital roster.'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 text-xs">
          {/* Profile Picture Upload Section */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row items-center gap-4">
            <div className="relative shrink-0">
              <img
                src={
                  avatar ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    name || 'Doctor'
                  )}&background=0D9488&color=fff&size=100`
                }
                alt="Profile Preview"
                className="w-16 h-16 rounded-2xl object-cover border-2 border-teal-600/30 shadow-xs"
              />
              <label
                htmlFor="doctor-photo-upload"
                className="absolute -bottom-1 -right-1 p-1 bg-teal-800 hover:bg-teal-900 text-white rounded-lg cursor-pointer shadow-xs transition"
                title="Upload Photo"
              >
                <Camera className="w-3.5 h-3.5" />
                <input
                  id="doctor-photo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            </div>
            <div className="flex-1 w-full space-y-1.5">
              <label className="block text-slate-700 font-semibold">Profile Picture</label>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <input
                  type="url"
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                  placeholder="Paste Image URL or upload photo file..."
                  className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <label className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200/80 rounded-xl font-semibold text-xs cursor-pointer flex items-center justify-center gap-1.5 shrink-0 transition">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Choose File</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Basic Doctor Credentials */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Doctor Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Dr. Jessica Vance"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Specialty *</label>
              <input
                type="text"
                required
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                placeholder="e.g. Pediatric Cardiology"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Department</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
              >
                {availableDeptNames.map((deptName) => (
                  <option key={deptName} value={deptName}>
                    {deptName}
                  </option>
                ))}
                {!availableDeptNames.includes(department) && department && (
                  <option value={department}>{department}</option>
                )}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Current Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as Doctor['status'])}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
              >
                <option value="On Duty">On Duty</option>
                <option value="Available">Available</option>
                <option value="In Surgery">In Surgery</option>
                <option value="On Leave">On Leave</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Age (Years)</label>
              <input
                type="number"
                min="20"
                max="100"
                value={age}
                onChange={(e) => setAge(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="e.g. 45"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Experience (Years)</label>
              <input
                type="number"
                min="0"
                value={experienceYears}
                onChange={(e) => setExperienceYears(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* Contact & Residential Address */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="doctor@meridianhealth.org"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Account Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Set / change password"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* Residential Address Input */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Residential Address</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. 742 Evergreen Terrace, Springfield, OR 97477"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Degrees & Titles</label>
              <input
                type="text"
                value={degrees}
                onChange={(e) => setDegrees(e.target.value)}
                placeholder="e.g. MD, FACC, Harvard Medical"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Office / Room Location</label>
              <input
                type="text"
                value={officeRoom}
                onChange={(e) => setOfficeRoom(e.target.value)}
                placeholder="e.g. Suite 304, Wing B"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Professional Overview / Bio</label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Provide a short description of expertise and background..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* EDITABLE DUTY SCHEDULE SECTION */}
          <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-teal-700" />
                <h3 className="font-bold text-slate-900 text-xs">Duty Schedule & Shift Hours</h3>
              </div>
              <button
                type="button"
                onClick={handleAddScheduleDay}
                className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold rounded-lg transition flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Duty Shift
              </button>
            </div>

            <p className="text-[11px] text-slate-500">
              Configure working days, shift hours, and clinical duty room/unit for this physician.
            </p>

            <div className="space-y-2">
              {dutySchedule.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-white p-3 rounded-xl border border-slate-200/80 grid grid-cols-1 sm:grid-cols-12 gap-2 items-center"
                >
                  <div className="sm:col-span-4">
                    <label className="text-[10px] text-slate-400 font-medium block">Working Day(s)</label>
                    <input
                      type="text"
                      value={item.day}
                      onChange={(e) => handleUpdateScheduleDay(idx, 'day', e.target.value)}
                      placeholder="e.g. Monday - Friday"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                  </div>

                  <div className="sm:col-span-4">
                    <label className="text-[10px] text-slate-400 font-medium block">Shift Hours</label>
                    <input
                      type="text"
                      value={item.shift}
                      onChange={(e) => handleUpdateScheduleDay(idx, 'shift', e.target.value)}
                      placeholder="e.g. 08:00 AM - 04:00 PM"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-800 font-mono focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="text-[10px] text-slate-400 font-medium block">Location / Unit</label>
                    <input
                      type="text"
                      value={item.location}
                      onChange={(e) => handleUpdateScheduleDay(idx, 'location', e.target.value)}
                      placeholder="e.g. OPD Room 12"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                  </div>

                  <div className="sm:col-span-1 flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleRemoveScheduleDay(idx)}
                      title="Remove shift day"
                      className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* EDITABLE EXPERTISE TAGS */}
          <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 space-y-2.5">
            <h3 className="font-bold text-slate-900 text-xs">Clinical Expertise & Focus Areas</h3>
            <div className="flex flex-wrap gap-1.5">
              {expertise.map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-1 bg-teal-100/80 text-teal-800 rounded-lg text-xs font-semibold flex items-center gap-1.5"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveExpertise(tag)}
                    className="hover:text-teal-950 text-teal-600 font-bold"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={newExpertiseInput}
                onChange={(e) => setNewExpertiseInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddExpertise();
                  }
                }}
                placeholder="Add specialty skill (e.g. Heart Surgery)..."
                className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <button
                type="button"
                onClick={handleAddExpertise}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition"
              >
                Add Tag
              </button>
            </div>
          </div>

          {/* EDITABLE LANGUAGES */}
          <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 space-y-2.5">
            <h3 className="font-bold text-slate-900 text-xs">Languages Spoken</h3>
            <div className="flex flex-wrap gap-1.5">
              {languages.map((lang) => (
                <span
                  key={lang}
                  className="px-2.5 py-1 bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold flex items-center gap-1.5"
                >
                  {lang}
                  <button
                    type="button"
                    onClick={() => handleRemoveLanguage(lang)}
                    className="hover:text-rose-600 font-bold"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={newLanguageInput}
                onChange={(e) => setNewLanguageInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddLanguage();
                  }
                }}
                placeholder="Add language (e.g. French, Arabic)..."
                className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <button
                type="button"
                onClick={handleAddLanguage}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition"
              >
                Add Language
              </button>
            </div>
          </div>

          {/* DELETE CONFIRMATION BOX */}
          {isEditing && doctor && onDelete && (
            <div className="border border-rose-200 bg-rose-50/70 rounded-2xl p-4 space-y-2">
              {!showDeleteConfirm ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-rose-800 font-semibold text-xs">
                    <ShieldAlert className="w-4 h-4 text-rose-600" />
                    <span>Danger Zone: Remove Doctor Profile</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete Doctor
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-rose-900 font-bold">
                    Are you sure you want to permanently delete {doctor.name}?
                  </p>
                  <p className="text-[11px] text-rose-700">
                    This action will remove the doctor record from the active roster and staff directories.
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        onDelete(doctor.id);
                        onClose();
                      }}
                      className="px-4 py-1.5 bg-rose-700 hover:bg-rose-800 text-white font-bold rounded-xl text-xs transition"
                    >
                      Yes, Permanently Delete
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-xl text-xs transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-teal-800 hover:bg-teal-900 text-white text-xs font-semibold rounded-xl shadow-xs transition"
            >
              {isEditing ? 'Save Profile & Schedule Changes' : 'Register Doctor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
