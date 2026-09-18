import React, { useState } from 'react';
import { Save, Bell, Shield, Hospital, Check, Key, ShieldCheck, UserCheck, HeartPulse, UserPlus, Lock } from 'lucide-react';
import { roleProfiles } from '../data/mockData';
import { UserRole } from '../types';

interface SettingsViewProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
  currentRole?: UserRole;
  onSelectRole?: (role: UserRole) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  darkMode,
  onToggleDarkMode,
  currentRole = 'admin',
  onSelectRole,
}) => {
  const [saved, setSaved] = useState(false);
  const [hospitalName, setHospitalName] = useState('St. Meridian General');
  const [adminName, setAdminName] = useState('Dr. Alex Morgan');
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [criticalSms, setCriticalSms] = useState(true);
  const [selectedRoleForEdit, setSelectedRoleForEdit] = useState<UserRole>('admin');

  // Permission matrix local state
  const [permissionsState, setPermissionsState] = useState<Record<string, string[]>>({
    admin: roleProfiles.admin.permissions,
    doctor: roleProfiles.doctor.permissions,
    nurse: roleProfiles.nurse.permissions,
    receptionist: roleProfiles.receptionist.permissions,
    patient: roleProfiles.patient.permissions,
  });

  const handleTogglePerm = (role: UserRole, perm: string) => {
    setPermissionsState((prev) => {
      const current = prev[role] || [];
      const updated = current.includes(perm)
        ? current.filter((p) => p !== perm)
        : [...current, perm];
      return { ...prev, [role]: updated };
    });
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const allAvailablePermissions = [
    { key: 'ALL_ACCESS', label: 'Full System Administrative Control' },
    { key: 'MANAGE_PATIENTS', label: 'Register & Edit Patient Records' },
    { key: 'MANAGE_DOCTORS', label: 'Manage Doctor Rosters & Specialties' },
    { key: 'MANAGE_NURSES', label: 'Manage Nursing Staff & Duty Rosters' },
    { key: 'MANAGE_RECEPTION', label: 'Manage Reception & Desk Operations' },
    { key: 'VIEW_ANALYTICS', label: 'View Hospital Financial Analytics & Revenue' },
    { key: 'EDIT_EHR_RECORDS', label: 'Create & Edit Clinical Health Records' },
    { key: 'WRITE_PRESCRIPTION', label: 'Write & Sign Pharmacy Prescriptions' },
    { key: 'UPDATE_BED_OCCUPANCY', label: 'Assign & Discharge Ward Beds' },
    { key: 'LOG_DAILY_VITALS', label: 'Log Patient Daily Vitals' },
    { key: 'BOOK_APPOINTMENT', label: 'Book & Reschedule Appointments' },
    { key: 'MANAGE_SETTINGS', label: 'Access System Settings & RBAC Config' },
  ];

  return (
    <div className="p-4 sm:p-6 max-w-[1000px] mx-auto space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Hospital System Settings & RBAC Management</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          System preferences, Role-Based Access Control (RBAC), security rules, and alert thresholds.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-6">
        {/* Facility Info */}
        <div className="space-y-4 border-b border-slate-100 pb-6">
          <h3 className="font-bold text-slate-900 text-sm flex items-center">
            <Hospital className="w-4 h-4 mr-2 text-teal-800" />
            Facility & Organization
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-600 font-medium mb-1">Hospital Facility Name</label>
              <input
                type="text"
                value={hospitalName}
                onChange={(e) => setHospitalName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              />
            </div>
            <div>
              <label className="block text-slate-600 font-medium mb-1">Administrator Profile</label>
              <input
                type="text"
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              />
            </div>
          </div>
        </div>

        {/* RBAC Roles & Permissions Matrix */}
        <div className="space-y-4 border-b border-slate-100 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h3 className="font-bold text-slate-900 text-sm flex items-center">
              <Key className="w-4 h-4 mr-2 text-teal-800" />
              Role-Based Access Control (RBAC) Permissions Matrix
            </h3>
            <span className="text-xs text-teal-800 font-medium bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200">
              Active Dashboard Login Role: <strong className="capitalize">{currentRole}</strong>
            </span>
          </div>

          <p className="text-xs text-slate-500">
            Define specific operational permission scopes for each dashboard login persona in the hospital network.
          </p>

          {/* Role selector buttons */}
          <div className="flex flex-wrap gap-2 pt-1">
            {(Object.keys(roleProfiles) as UserRole[]).map((r) => {
              const prof = roleProfiles[r];
              const isActive = selectedRoleForEdit === r;
              return (
                <button
                  key={r}
                  onClick={() => setSelectedRoleForEdit(r)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-teal-800 text-white border-teal-800 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span className="capitalize">{r}</span> ({prof.name})
                </button>
              );
            })}
          </div>

          {/* Permission checkboxes for selected role */}
          <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div>
                <span className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                  Configuring Permissions Matrix: <span className="text-teal-800 font-extrabold capitalize">{selectedRoleForEdit}</span>
                </span>
                <p className="text-[11px] text-slate-500">{roleProfiles[selectedRoleForEdit].description}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
              {allAvailablePermissions.map((perm) => {
                const isChecked = (permissionsState[selectedRoleForEdit] || []).includes(perm.key);
                return (
                  <label
                    key={perm.key}
                    className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition ${
                      isChecked
                        ? 'bg-teal-50/80 border-teal-200 text-teal-900 font-semibold'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100/60'
                    }`}
                  >
                    <span className="truncate max-w-[220px] sm:max-w-none">{perm.label}</span>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleTogglePerm(selectedRoleForEdit, perm.key)}
                      className="w-4 h-4 accent-teal-800 shrink-0"
                    />
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        {/* Alerts & Notifications */}
        <div className="space-y-4 border-b border-slate-100 pb-6">
          <h3 className="font-bold text-slate-900 text-sm flex items-center">
            <Bell className="w-4 h-4 mr-2 text-teal-800" />
            Notification & Capacity Rules
          </h3>
          <div className="space-y-3 text-xs">
            <label className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 cursor-pointer">
              <span className="font-medium text-slate-800">Email Alerts for Bed Capacity Limits (&gt; 90%)</span>
              <input
                type="checkbox"
                checked={emailAlerts}
                onChange={(e) => setEmailAlerts(e.target.checked)}
                className="w-4 h-4 accent-teal-800"
              />
            </label>
            <label className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 cursor-pointer">
              <span className="font-medium text-slate-800">SMS Alerts for Critical ICU Triage Flags</span>
              <input
                type="checkbox"
                checked={criticalSms}
                onChange={(e) => setCriticalSms(e.target.checked)}
                className="w-4 h-4 accent-teal-800"
              />
            </label>
          </div>
        </div>

        {/* Theme Settings */}
        <div className="space-y-4 border-b border-slate-100 pb-6">
          <h3 className="font-bold text-slate-900 text-sm flex items-center">
            <Shield className="w-4 h-4 mr-2 text-teal-800" />
            Appearance Preferences
          </h3>
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
            <span className="font-medium text-slate-800">Interface Dark Mode</span>
            <button
              onClick={onToggleDarkMode}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                darkMode ? 'bg-teal-800 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {darkMode ? 'Enabled (Dark)' : 'Disabled (Light)'}
            </button>
          </div>
        </div>

        <button
          onClick={handleSave}
          className="flex items-center space-x-2 px-5 py-2.5 bg-teal-800 hover:bg-teal-900 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
        >
          {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          <span>{saved ? 'Settings & RBAC Saved!' : 'Save System Settings'}</span>
        </button>
      </div>
    </div>
  );
};
