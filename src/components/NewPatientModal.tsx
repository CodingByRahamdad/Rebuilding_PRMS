import React, { useState, useEffect, useMemo } from 'react';
import { X, UserPlus, Upload, Camera, Lock, Key, MapPin, Search, AlertCircle } from 'lucide-react';
import { Patient, Doctor } from '../types';
import { getDepartmentNames } from '../services/departmentService';

interface NewPatientModalProps {
  patient?: Patient | null;
  doctors?: Doctor[];
  departments?: any[];
  onClose: () => void;
  onAddPatient: (patient: Patient) => Promise<{ success: boolean; message?: string } | void> | void;
}

const DEFAULT_DOCTORS_BY_DEPT: Record<string, string[]> = {
  Cardiology: ['Dr. Liam Reynolds', 'Dr. Sarah Jenkins', 'Dr. Robert Martinez'],
  Neurology: ['Dr. Ahmed Al-Rashid', 'Dr. Kenji Tanaka'],
  Orthopedics: ['Dr. Kenji Tanaka', 'Dr. Emily Watson'],
  Pediatrics: ['Dr. Naomi Chen', 'Dr. Chloe Bennet'],
  Emergency: ['Dr. Marcus Reynolds', 'Dr. Alex Morgan'],
  'Emergency & Trauma': ['Dr. Marcus Reynolds', 'Dr. Alex Morgan'],
  'Surgical Suite': ['Dr. David Okonkwo', 'Dr. Arthur Vance'],
  Surgery: ['Dr. David Okonkwo', 'Dr. Arthur Vance'],
  'Psychiatry & Behavioral Health': ['Dr. Sarah Chen', 'Dr. Naomi Chen'],
  Psychiatry: ['Dr. Sarah Chen', 'Dr. Naomi Chen'],
  'ICU & Intensive Care Unit': ['Dr. Elena Rostova', 'Dr. Marcus Reynolds'],
  Dermatology: ['Dr. Aisha Patel', 'Dr. Olivia Taylor'],
  'General Medicine': ['Dr. Alex Morgan', 'Dr. Samuel Vance', 'Dr. Liam Reynolds'],
};

export const NewPatientModal: React.FC<NewPatientModalProps> = ({
  patient,
  doctors = [],
  departments: customDepartments,
  onClose,
  onAddPatient,
}) => {
  const isEditing = Boolean(patient);
  const availableDeptNames = useMemo(() => getDepartmentNames(customDepartments), [customDepartments]);

  const [name, setName] = useState(patient?.name || '');
  const [age, setAge] = useState<number | string>(patient?.age ?? 35);
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>(patient?.gender || 'Female');
  const [department, setDepartment] = useState(
    patient?.department || availableDeptNames[0] || 'Cardiology'
  );
  const [doctor, setDoctor] = useState(patient?.doctor || 'Dr. Liam Reynolds');
  const [address, setAddress] = useState(patient?.address || '742 Evergreen Health Terrace, Springfield');
  const [status, setStatus] = useState<Patient['status']>(patient?.status || 'Admitted');
  const [bloodType, setBloodType] = useState(patient?.bloodType || 'O+');
  const [condition, setCondition] = useState(patient?.condition || 'Routine Observation');
  const [room, setRoom] = useState(patient?.room || 'Bed 105');
  const [phone, setPhone] = useState(patient?.phone || '+1 (555) 019-2831');
  const [email, setEmail] = useState(patient?.email || '');
  const [password, setPassword] = useState(patient?.password || '');
  const [avatar, setAvatar] = useState(patient?.avatar || '');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Emergency contact & allergies
  const [emergencyName, setEmergencyName] = useState(patient?.emergencyContact?.name || '');
  const [emergencyRelation, setEmergencyRelation] = useState(patient?.emergencyContact?.relation || '');
  const [emergencyPhone, setEmergencyPhone] = useState(patient?.emergencyContact?.phone || '');
  const [allergiesInput, setAllergiesInput] = useState(
    patient?.allergies ? patient.allergies.join(', ') : 'Penicillin, Dust'
  );

  // Doctors filtering based on Department
  const departmentDoctors = useMemo(() => {
    const liveDeptDoctors = doctors
      .filter((d) => d.department?.toLowerCase() === department.toLowerCase())
      .map((d) => d.name);

    if (liveDeptDoctors.length > 0) {
      return liveDeptDoctors;
    }

    const fallbackList = DEFAULT_DOCTORS_BY_DEPT[department] || [
      'Dr. Liam Reynolds',
      'Dr. Sarah Jenkins',
    ];
    return fallbackList;
  }, [department, doctors]);

  // Handle department change & dependent doctor selection
  const handleDepartmentChange = (newDept: string) => {
    setDepartment(newDept);
    const matchingDocs = doctors
      .filter((d) => d.department?.toLowerCase() === newDept.toLowerCase())
      .map((d) => d.name);

    const available = matchingDocs.length > 0
      ? matchingDocs
      : DEFAULT_DOCTORS_BY_DEPT[newDept] || ['Dr. Liam Reynolds'];

    if (!available.includes(doctor)) {
      setDoctor(available[0]);
    }
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate 12 mandatory required fields
    if (!name.trim()) return setError('Full Patient Name is required.');
    if (!phone.trim()) return setError('Phone Number is required.');
    if (!email.trim()) return setError('Email Address is required.');
    if (!isEditing && !password.trim()) return setError('Account Password is required for new patient registration.');
    if (age === undefined || age === '' || isNaN(Number(age)) || Number(age) < 0) return setError('Valid Patient Age is required.');
    if (!gender) return setError('Gender selection is required.');
    if (!bloodType.trim()) return setError('Blood Type selection is required.');
    if (!department.trim()) return setError('Department selection is required.');
    if (!doctor.trim()) return setError('Attending Doctor selection is required.');
    if (!address.trim()) return setError('Residential Address is required.');
    if (!status) return setError('Triage Status is required.');
    if (!condition.trim()) return setError('Primary Condition / Diagnosis is required.');

    const allergiesArray = allergiesInput
      .split(',')
      .map((a) => a.trim())
      .filter((a) => a.length > 0);

    const savedPatient: Patient = {
      id: patient?.id || `p-${Date.now()}`,
      patientCode: patient?.patientCode || `PT-0${Math.floor(1000 + Math.random() * 9000)}`,
      name: name.trim(),
      age: Number(age),
      gender,
      department,
      doctor: doctor.trim(),
      address: address.trim(),
      room: room.trim() || 'Bed 105',
      status,
      admissionDate: patient?.admissionDate || new Date().toISOString().split('T')[0],
      bloodType,
      condition: condition.trim(),
      phone: phone.trim(),
      email: email.trim(),
      password: password.trim() || undefined,
      avatar: avatar.trim() || undefined,
      emergencyContact: {
        name: emergencyName.trim() || 'Not specified',
        relation: emergencyRelation.trim() || 'Next of Kin',
        phone: emergencyPhone.trim() || phone.trim(),
      },
      allergies: allergiesArray,
      medicalHistory: patient?.medicalHistory,
      prescriptions: patient?.prescriptions,
      billingInvoices: patient?.billingInvoices,
      reports: patient?.reports,
    };

    try {
      setIsSubmitting(true);
      const res = await onAddPatient(savedPatient);
      if (res && res.success === false) {
        setError(res.message || 'Failed to save patient records.');
        setIsSubmitting(false);
        return;
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'An error occurred while saving patient records.');
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50"
    >
      <div 
        className="bg-white rounded-2xl max-w-xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-200 cursor-default max-h-[90vh] overflow-y-auto"
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-5 border-b border-slate-100 pb-4">
          <div className="p-2.5 bg-teal-100 text-[#0B4F4C] rounded-xl font-bold">
            <UserPlus className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">{isEditing ? 'Edit Patient Information' : 'Register New Patient'}</h2>
            <p className="text-xs text-slate-500">{isEditing ? 'Update medical records, triage status, and personal details (Email ID locked).' : 'Enter patient details for intake and triage registration.'}</p>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl flex items-center gap-2 mb-4 animate-in fade-in duration-150">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Profile Picture Upload Section */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row items-center gap-4">
            <div className="relative shrink-0">
              <img
                src={avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'Patient')}&background=0D9488&color=fff&size=100`}
                alt="Profile Preview"
                className="w-16 h-16 rounded-2xl object-cover border-2 border-teal-600/30 shadow-xs"
              />
              <label
                htmlFor="patient-photo-upload"
                className="absolute -bottom-1 -right-1 p-1 bg-[#0B4F4C] hover:bg-[#083E3B] text-white rounded-lg cursor-pointer shadow-xs transition"
                title="Upload Photo"
              >
                <Camera className="w-3.5 h-3.5" />
                <input
                  id="patient-photo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            </div>
            <div className="flex-1 w-full space-y-1.5">
              <label className="block text-slate-700 font-semibold">Profile Picture (Optional)</label>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <input
                  type="url"
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                  placeholder="Paste Image URL or upload photo file..."
                  className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0B4F4C]/20"
                />
                <label className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-[#0B4F4C] border border-teal-200/80 rounded-xl font-semibold text-xs cursor-pointer flex items-center justify-center gap-1.5 shrink-0 transition">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Full Patient Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Maria Gonzalez"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0B4F4C]/20"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Phone Number *</label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0B4F4C]/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Email Address * {isEditing && <span className="text-amber-700 font-normal ml-1">(Non-editable ID)</span>}
              </label>
              <input
                type="email"
                required
                disabled={isEditing}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="patient@example.com"
                className={`w-full border rounded-xl px-3 py-2 text-slate-800 ${
                  isEditing 
                    ? 'bg-slate-100/80 border-slate-200 text-slate-500 cursor-not-allowed font-medium' 
                    : 'bg-slate-50 border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0B4F4C]/20'
                }`}
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Account Password * {!isEditing && <span className="text-red-500">*</span>}
              </label>
              <input
                type="password"
                required={!isEditing}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isEditing ? 'Enter new password to update' : 'Create account password (min 6 chars)'}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0B4F4C]/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Age *</label>
              <input
                type="number"
                required
                min={0}
                max={130}
                value={age}
                onChange={(e) => setAge(e.target.value ? Number(e.target.value) : '')}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0B4F4C]/20"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Gender *</label>
              <select
                required
                value={gender}
                onChange={(e) => setGender(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0B4F4C]/20"
              >
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Blood Type *</label>
              <select
                required
                value={bloodType}
                onChange={(e) => setBloodType(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0B4F4C]/20"
              >
                <option value="O+">O+</option>
                <option value="A+">A+</option>
                <option value="B+">B+</option>
                <option value="AB+">AB+</option>
                <option value="O-">O-</option>
                <option value="A-">A-</option>
                <option value="B-">B-</option>
                <option value="AB-">AB-</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Department *</label>
              <select
                required
                value={department}
                onChange={(e) => handleDepartmentChange(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0B4F4C]/20 cursor-pointer"
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
              <label className="block font-semibold text-slate-700 mb-1">Attending Doctor *</label>
              <select
                required
                value={doctor}
                onChange={(e) => setDoctor(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0B4F4C]/20"
              >
                {departmentDoctors.map((docName) => (
                  <option key={docName} value={docName}>
                    {docName}
                  </option>
                ))}
                {!departmentDoctors.includes(doctor) && doctor && (
                  <option value={doctor}>{doctor} (Assigned)</option>
                )}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Room / Bed (Optional)</label>
              <input
                type="text"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                placeholder="e.g. Bed 105, Wing B"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0B4F4C]/20"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Patient Residential Address *</label>
            <div className="relative">
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. 742 Evergreen Health Terrace, Springfield, IL 62704"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 pl-8 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0B4F4C]/20"
              />
              <MapPin className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Triage Status *</label>
              <select
                required
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0B4F4C]/20"
              >
                <option value="Admitted">Admitted</option>
                <option value="Outpatient">Outpatient</option>
                <option value="Emergency">Emergency</option>
                <option value="Discharged">Discharged</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Primary Condition / Diagnosis *</label>
              <input
                type="text"
                required
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                placeholder="e.g. Acute Bronchitis"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0B4F4C]/20"
              />
            </div>
          </div>

          {/* Emergency Contact & Allergies (Optional) */}
          <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/80 space-y-3">
            <div className="font-bold text-slate-800 text-xs flex items-center justify-between">
              <span>Emergency Contact & Medical Flags (Optional)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Contact Name</label>
                <input
                  type="text"
                  value={emergencyName}
                  onChange={(e) => setEmergencyName(e.target.value)}
                  placeholder="e.g. Carlos Gonzalez"
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Relation</label>
                <input
                  type="text"
                  value={emergencyRelation}
                  onChange={(e) => setEmergencyRelation(e.target.value)}
                  placeholder="e.g. Spouse, Parent"
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Contact Phone</label>
                <input
                  type="text"
                  value={emergencyPhone}
                  onChange={(e) => setEmergencyPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Known Allergies (comma separated)</label>
              <input
                type="text"
                value={allergiesInput}
                onChange={(e) => setAllergiesInput(e.target.value)}
                placeholder="e.g. Penicillin, Latex, Peanuts"
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
              />
            </div>
          </div>

          <div className="pt-3 flex items-center justify-end space-x-2 border-t border-slate-100">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-[#0B4F4C] hover:bg-[#083E3B] text-white font-semibold rounded-xl shadow-xs transition disabled:opacity-50 flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <span>{isEditing ? 'Saving Changes...' : 'Registering Patient...'}</span>
              ) : (
                <span>{isEditing ? 'Save Patient Changes' : 'Register Patient'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
