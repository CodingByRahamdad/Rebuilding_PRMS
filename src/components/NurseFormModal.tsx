import React, { useState } from 'react';
import { X, HeartPulse, User, Mail, Phone, Award, ShieldCheck, Upload, Camera, MapPin } from 'lucide-react';
import { Nurse } from '../types';
import { getDepartmentNames } from '../services/departmentService';

interface NurseFormModalProps {
  nurse?: Nurse | null;
  departments?: any[];
  onClose: () => void;
  onSave: (nurse: Nurse) => void;
}

export const NurseFormModal: React.FC<NurseFormModalProps> = ({
  nurse,
  departments: customDepartments,
  onClose,
  onSave,
}) => {
  const isEditing = Boolean(nurse);
  const availableDeptNames = getDepartmentNames(customDepartments);

  const [name, setName] = useState(nurse?.name || '');
  const [nurseCode, setNurseCode] = useState(nurse?.nurseCode || `NRS-${Math.floor(1000 + Math.random() * 9000)}`);
  const [role, setRole] = useState(nurse?.role || 'Senior Ward Nurse');
  const [department, setDepartment] = useState(
    nurse?.department || availableDeptNames[0] || 'Cardiology'
  );
  const [assignedWard, setAssignedWard] = useState(nurse?.assignedWard || 'Cardiac Care Unit (CCU)');
  const [shift, setShift] = useState<Nurse['shift']>(nurse?.shift || 'Morning (07:00 - 15:00)');
  const [status, setStatus] = useState<Nurse['status']>(nurse?.status || 'On Duty');
  const [patientLoad, setPatientLoad] = useState(nurse?.patientLoad || 6);
  const [experienceYears, setExperienceYears] = useState(nurse?.experienceYears || 6);
  const [phone, setPhone] = useState(nurse?.phone || '+1 (555) 018-4920');
  const [email, setEmail] = useState(nurse?.email || '');
  const [address, setAddress] = useState(nurse?.address || '742 Evergreen Terrace, Springfield, OR 97477');
  const [password, setPassword] = useState(nurse?.password || '');
  const [avatar, setAvatar] = useState(nurse?.avatar || '');
  const [certificationsInput, setCertificationsInput] = useState(
    nurse?.certifications ? nurse.certifications.join(', ') : 'BLS, ACLS, Cardiac Nursing'
  );

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const certsArray = certificationsInput
      .split(',')
      .map((c) => c.trim())
      .filter((c) => c.length > 0);

    const savedNurse: Nurse = {
      id: nurse?.id || `nurse-${Date.now()}`,
      nurseCode: nurseCode.trim(),
      name: name.trim(),
      role: role.trim(),
      department: department.trim(),
      assignedWard: assignedWard.trim(),
      shift,
      status,
      patientLoad: Number(patientLoad),
      experienceYears: Number(experienceYears),
      phone: phone.trim(),
      email: email.trim() || `${name.toLowerCase().replace(/\s+/g, '.')}@meridianhealth.org`,
      address: address.trim(),
      password: password.trim() || undefined,
      avatar: avatar.trim() || undefined,
      certifications: certsArray.length > 0 ? certsArray : ['BLS', 'ACLS'],
      assignedPatientIds: nurse?.assignedPatientIds || [],
      dutySchedule: nurse?.dutySchedule,
      reviews: nurse?.reviews,
      degrees: nurse?.degrees,
      bio: nurse?.bio,
      languages: nurse?.languages,
    };

    onSave(savedNurse);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
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

        <div className="flex items-center gap-3 mb-5 border-b border-slate-100 pb-4">
          <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold">
            <HeartPulse className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {isEditing ? 'Edit Nurse Profile' : 'Add New Registered Nurse'}
            </h2>
            <p className="text-xs text-slate-500">
              {isEditing ? 'Update ward assignments, shift timings, and nursing certifications.' : 'Register a new nursing staff member to the ward roster.'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Profile Picture Upload Section */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row items-center gap-4">
            <div className="relative shrink-0">
              <img
                src={avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'Nurse')}&background=0D9488&color=fff&size=100`}
                alt="Profile Preview"
                className="w-16 h-16 rounded-2xl object-cover border-2 border-teal-600/30 shadow-xs"
              />
              <label
                htmlFor="nurse-photo-upload"
                className="absolute -bottom-1 -right-1 p-1 bg-teal-800 hover:bg-teal-900 text-white rounded-lg cursor-pointer shadow-xs transition"
                title="Upload Photo"
              >
                <Camera className="w-3.5 h-3.5" />
                <input
                  id="nurse-photo-upload"
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Nurse Full Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Clara Oswald"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Staff Code</label>
              <input
                type="text"
                value={nurseCode}
                onChange={(e) => setNurseCode(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Role / Designation</label>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g. Charge Nurse, ICU Specialist"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

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
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Assigned Ward / Unit</label>
              <input
                type="text"
                value={assignedWard}
                onChange={(e) => setAssignedWard(e.target.value)}
                placeholder="e.g. Cardiac Care Unit (CCU)"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Shift Schedule</label>
              <select
                value={shift}
                onChange={(e) => setShift(e.target.value as Nurse['shift'])}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="Morning (07:00 - 15:00)">Morning (07:00 - 15:00)</option>
                <option value="Evening (15:00 - 23:00)">Evening (15:00 - 23:00)</option>
                <option value="Night (23:00 - 07:00)">Night (23:00 - 07:00)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Current Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as Nurse['status'])}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="On Duty">On Duty</option>
                <option value="In Ward">In Ward</option>
                <option value="On Break">On Break</option>
                <option value="Off Duty">Off Duty</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Patient Load</label>
              <input
                type="number"
                min="0"
                value={patientLoad}
                onChange={(e) => setPatientLoad(Number(e.target.value))}
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
                placeholder="nurse@meridianhealth.org"
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

          <div>
            <label className="block text-slate-700 font-semibold mb-1 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-teal-700" />
              <span>Residential Address</span>
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. 742 Evergreen Terrace, Springfield, OR 97477"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Certifications (comma separated)</label>
            <input
              type="text"
              value={certificationsInput}
              onChange={(e) => setCertificationsInput(e.target.value)}
              placeholder="e.g. BLS, ACLS, Pediatric Care, IV Certified"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

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
              {isEditing ? 'Save Changes' : 'Register Nurse'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
