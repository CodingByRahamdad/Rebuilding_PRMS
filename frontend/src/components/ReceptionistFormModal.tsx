import React, { useState } from 'react';
import { X, UserCheck, Phone, Mail, Building, Globe, Upload, Camera, MapPin } from 'lucide-react';
import { Receptionist } from '../types';

interface ReceptionistFormModalProps {
  receptionist?: Receptionist | null;
  onClose: () => void;
  onSave: (receptionist: Receptionist) => void;
}

export const ReceptionistFormModal: React.FC<ReceptionistFormModalProps> = ({
  receptionist,
  onClose,
  onSave,
}) => {
  const isEditing = Boolean(receptionist);

  const [name, setName] = useState(receptionist?.name || '');
  const [staffCode, setStaffCode] = useState(receptionist?.staffCode || `REC-${Math.floor(100 + Math.random() * 900)}`);
  const [deskLocation, setDeskLocation] = useState(receptionist?.deskLocation || 'Main Lobby - Front Desk 1');
  const [shift, setShift] = useState<Receptionist['shift']>(receptionist?.shift || 'Morning Shift');
  const [status, setStatus] = useState<Receptionist['status']>(receptionist?.status || 'Active');
  const [extension, setExtension] = useState(receptionist?.extension || 'Ext 101');
  const [checkInsToday, setCheckInsToday] = useState(receptionist?.checkInsToday || 24);
  const [phone, setPhone] = useState(receptionist?.phone || '+1 (555) 012-3344');
  const [email, setEmail] = useState(receptionist?.email || '');
  const [address, setAddress] = useState(receptionist?.address || '');
  const [password, setPassword] = useState(receptionist?.password || '');
  const [avatar, setAvatar] = useState(receptionist?.avatar || '');
  const [languagesInput, setLanguagesInput] = useState(
    receptionist?.languages ? receptionist.languages.join(', ') : 'English, Spanish'
  );

  const defaultSchedule = [
    { day: 'Monday', shift: '08:00 AM - 04:00 PM', location: receptionist?.deskLocation || deskLocation },
    { day: 'Tuesday', shift: '08:00 AM - 04:00 PM', location: receptionist?.deskLocation || deskLocation },
    { day: 'Wednesday', shift: '08:00 AM - 04:00 PM', location: receptionist?.deskLocation || deskLocation },
    { day: 'Thursday', shift: '08:00 AM - 04:00 PM', location: receptionist?.deskLocation || deskLocation },
    { day: 'Friday', shift: '08:00 AM - 02:00 PM', location: receptionist?.deskLocation || deskLocation },
  ];

  const [dutyScheduleList, setDutyScheduleList] = useState(
    receptionist?.dutySchedule && receptionist.dutySchedule.length > 0
      ? receptionist.dutySchedule
      : defaultSchedule
  );

  const handleUpdateScheduleRow = (index: number, field: string, value: string) => {
    setDutyScheduleList((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const handleAddScheduleRow = () => {
    setDutyScheduleList((prev) => [
      ...prev,
      { day: 'Saturday', shift: '08:00 AM - 02:00 PM', location: deskLocation },
    ]);
  };

  const handleRemoveScheduleRow = (index: number) => {
    setDutyScheduleList((prev) => prev.filter((_, i) => i !== index));
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const langsArray = languagesInput
      .split(',')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const savedReceptionist: Receptionist = {
      id: receptionist?.id || `rec-${Date.now()}`,
      staffCode: staffCode.trim(),
      name: name.trim(),
      deskLocation: deskLocation.trim(),
      shift,
      status,
      extension: extension.trim(),
      checkInsToday: Number(checkInsToday),
      phone: phone.trim(),
      email: email.trim() || `${name.toLowerCase().replace(/\s+/g, '.')}@meridianhealth.org`,
      address: address.trim() || undefined,
      password: password.trim() || undefined,
      avatar: avatar.trim() || undefined,
      languages: langsArray.length > 0 ? langsArray : ['English'],
      rating: receptionist?.rating || 5.0,
      reviews: receptionist?.reviews || [],
      dutySchedule: dutyScheduleList,
      experienceYears: receptionist?.experienceYears || 3,
      bio: receptionist?.bio || 'Patient intake and front desk operations officer.',
      certifications: receptionist?.certifications || ['Certified Healthcare Access Associate (CHAA)', 'HIPAA Compliance Officer'],
      todaysTasks: receptionist?.todaysTasks || [
        'Manage patient intake & queue flow',
        'Verify patient identification & check-in details',
        'Assist visitors with direction & badges'
      ],
    };

    onSave(savedReceptionist);
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
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {isEditing ? 'Edit Receptionist Profile' : 'Add Front Desk / Reception Staff'}
            </h2>
            <p className="text-xs text-slate-500">
              {isEditing ? 'Update desk assignments, extension numbers, and shift hours.' : 'Register a new front desk intake officer.'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Profile Picture Upload Section */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row items-center gap-4">
            <div className="relative shrink-0">
              <img
                src={avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'Receptionist')}&background=0D9488&color=fff&size=100`}
                alt="Profile Preview"
                className="w-16 h-16 rounded-2xl object-cover border-2 border-teal-600/30 shadow-xs"
              />
              <label
                htmlFor="receptionist-photo-upload"
                className="absolute -bottom-1 -right-1 p-1 bg-teal-800 hover:bg-teal-900 text-white rounded-lg cursor-pointer shadow-xs transition"
                title="Upload Photo"
              >
                <Camera className="w-3.5 h-3.5" />
                <input
                  id="receptionist-photo-upload"
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
              <label className="block text-slate-700 font-semibold mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. David Miller"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Staff Code</label>
              <input
                type="text"
                value={staffCode}
                onChange={(e) => setStaffCode(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Desk Location *</label>
              <input
                type="text"
                required
                value={deskLocation}
                onChange={(e) => setDeskLocation(e.target.value)}
                placeholder="e.g. Main Lobby Desk 1, Emergency Reception"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Extension Code</label>
              <input
                type="text"
                value={extension}
                onChange={(e) => setExtension(e.target.value)}
                placeholder="e.g. Ext 104"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Shift Schedule</label>
              <select
                value={shift}
                onChange={(e) => setShift(e.target.value as Receptionist['shift'])}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="Morning Shift">Morning Shift</option>
                <option value="Evening Shift">Evening Shift</option>
                <option value="Night Shift">Night Shift</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Current Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as Receptionist['status'])}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="Active">Active</option>
                <option value="On Break">On Break</option>
                <option value="Off Duty">Off Duty</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Check-ins Today</label>
              <input
                type="number"
                min="0"
                value={checkInsToday}
                onChange={(e) => setCheckInsToday(Number(e.target.value))}
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
                placeholder="receptionist@meridianhealth.org"
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
            <label className="block text-slate-700 font-semibold mb-1">Languages Spoken (comma separated)</label>
            <input
              type="text"
              value={languagesInput}
              onChange={(e) => setLanguagesInput(e.target.value)}
              placeholder="e.g. English, Spanish, French"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Duty Schedule Section */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-slate-800 font-bold">Duty Schedule Roster</label>
                <p className="text-[11px] text-slate-500">Configure shift hours and assigned desk for each workday.</p>
              </div>
              <button
                type="button"
                onClick={handleAddScheduleRow}
                className="px-2.5 py-1 bg-teal-50 text-teal-800 hover:bg-teal-100 border border-teal-200/80 rounded-xl font-bold text-xs transition flex items-center gap-1 cursor-pointer"
              >
                + Add Day
              </button>
            </div>

            <div className="space-y-2">
              {dutyScheduleList.map((sched, idx) => (
                <div key={idx} className="grid grid-cols-1 sm:grid-cols-12 gap-2 bg-white p-2 rounded-xl border border-slate-200 items-center">
                  <div className="sm:col-span-3">
                    <input
                      type="text"
                      value={sched.day}
                      onChange={(e) => handleUpdateScheduleRow(idx, 'day', e.target.value)}
                      placeholder="Day (e.g. Monday)"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500 font-medium"
                    />
                  </div>
                  <div className="sm:col-span-4">
                    <input
                      type="text"
                      value={sched.shift}
                      onChange={(e) => handleUpdateScheduleRow(idx, 'shift', e.target.value)}
                      placeholder="Shift (e.g. 08:00 AM - 04:00 PM)"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500 font-mono"
                    />
                  </div>
                  <div className="sm:col-span-4">
                    <input
                      type="text"
                      value={sched.location}
                      onChange={(e) => handleUpdateScheduleRow(idx, 'location', e.target.value)}
                      placeholder="Desk (e.g. Main Lobby Desk 1)"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                  <div className="sm:col-span-1 flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleRemoveScheduleRow(idx)}
                      className="text-rose-600 hover:bg-rose-50 p-1 rounded-md transition text-xs font-bold"
                      title="Remove Row"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
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
              {isEditing ? 'Save Changes' : 'Register Staff'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
