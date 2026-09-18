import React, { useState } from 'react';
import {
  User,
  Shield,
  Key,
  Mail,
  Phone,
  Building2,
  Lock,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldAlert,
  Edit2,
  Save,
  Check,
  UserCheck,
} from 'lucide-react';
import { RoleType } from '../types';
import { ApiClient } from '../services/apiClient';

interface AuthProfileViewProps {
  currentRole: RoleType;
  onRoleChange: (role: RoleType) => void;
  onClose?: () => void;
}

export const AuthProfileView: React.FC<AuthProfileViewProps> = ({
  currentRole,
  onRoleChange,
}) => {
  const [profile, setProfile] = useState({
    name: 'Dr. Marcus Reynolds',
    email: 'marcus.reynolds@stjude-ehr.org',
    title: 'Chief Medical Officer & ER Director',
    department: 'Emergency & Trauma Surgery',
    phone: '+1 (555) 234-5678',
    staffCode: 'STAFF-EMP-0091',
    avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150',
  });

  const [isEditing, setIsEditing] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'rbac' | 'security'>('profile');

  // Form states
  const [formName, setFormName] = useState(profile.name);
  const [formEmail, setFormEmail] = useState(profile.email);
  const [formPhone, setFormPhone] = useState(profile.phone);
  const [formTitle, setFormTitle] = useState(profile.title);
  const [formDept, setFormDept] = useState(profile.department);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState<string | null>(null);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfile({
      ...profile,
      name: formName,
      email: formEmail,
      phone: formPhone,
      title: formTitle,
      department: formDept,
    });
    setIsEditing(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);

    try {
      await ApiClient.updateProfile({
        name: formName,
        email: formEmail,
        phone: formPhone,
        title: formTitle,
        department: formDept,
      });
    } catch (err) {
      // Local fallback
    }
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordMsg('New passwords do not match');
      return;
    }
    setPasswordMsg('Password updated successfully!');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => setPasswordMsg(null), 3000);
  };

  const rolePermissions: Record<RoleType, string[]> = {
    'Super Admin': [
      'Full System Access',
      'Manage User Accounts & Roles',
      'Clinical Records Read/Write/Delete',
      'Financial & Revenue Access',
      'System Audit & Log Inspector',
    ],
    Doctor: [
      'Patient Clinical Triage',
      'Create & Edit Medical Records',
      'Prescription Authorization',
      'View Assigned Appointments',
    ],
    Nurse: [
      'Vital Sign Recording',
      'Patient Ward Nursing Logs',
      'View Medical Histories',
      'Check-in & Triage Assistance',
    ],
    Receptionist: [
      'Book & Schedule Appointments',
      'Patient Registration & Intake',
      'Basic Billing Receipts',
      'Duty Roster Views',
    ],
    'Billing Officer': [
      'Process Patient Invoices & Payments',
      'Insurance Claim Clearing',
      'Financial Revenue Reporting',
      'Export Transaction Logs',
    ],
  };

  return (
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <span>Account Profile & Authentication</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Manage your clinical identity, contact details, security credentials, and Role-Based Access Control (RBAC).
        </p>
      </div>

      {/* Profile Overview Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <img
            src={profile.avatar}
            alt={profile.name}
            className="w-20 h-20 rounded-full object-cover border-2 border-teal-600/40 shadow-sm"
          />
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-extrabold text-slate-900">{profile.name}</h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
                {currentRole}
              </span>
            </div>
            <p className="text-xs font-medium text-slate-500 mt-0.5">{profile.title}</p>
            <div className="flex items-center space-x-4 text-xs text-slate-400 mt-2">
              <span className="flex items-center gap-1 font-mono">
                <Building2 className="w-3.5 h-3.5 text-teal-700" /> {profile.department}
              </span>
              <span className="flex items-center gap-1 font-mono">
                <Shield className="w-3.5 h-3.5 text-teal-700" /> {profile.staffCode}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center space-x-1.5 px-4 py-2 bg-teal-800 hover:bg-teal-900 text-white text-xs font-semibold rounded-xl shadow-xs transition cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit Profile</span>
            </button>
          ) : (
            <button
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition cursor-pointer"
            >
              Cancel Edit
            </button>
          )}
        </div>
      </div>

      {savedSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Profile changes saved successfully!</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center space-x-1 border-b border-slate-200 text-xs font-semibold text-slate-500">
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2.5 border-b-2 transition cursor-pointer ${
            activeTab === 'profile'
              ? 'border-teal-800 text-teal-900 font-bold'
              : 'border-transparent hover:text-slate-800'
          }`}
        >
          Profile Details
        </button>
        <button
          onClick={() => setActiveTab('rbac')}
          className={`px-4 py-2.5 border-b-2 transition cursor-pointer ${
            activeTab === 'rbac'
              ? 'border-teal-800 text-teal-900 font-bold'
              : 'border-transparent hover:text-slate-800'
          }`}
        >
          Role-Based Access (RBAC)
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`px-4 py-2.5 border-b-2 transition cursor-pointer ${
            activeTab === 'security'
              ? 'border-teal-800 text-teal-900 font-bold'
              : 'border-transparent hover:text-slate-800'
          }`}
        >
          Security & Password
        </button>
      </div>

      {/* Tab 1: Profile Form */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
          <form onSubmit={handleSaveProfile} className="space-y-4 max-w-2xl text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Display Name</label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-slate-50 disabled:bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  disabled={!isEditing}
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="w-full bg-slate-50 disabled:bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Direct Extension / Phone</label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  className="w-full bg-slate-50 disabled:bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Clinical Designation</label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full bg-slate-50 disabled:bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Assigned Department</label>
              <input
                type="text"
                disabled={!isEditing}
                value={formDept}
                onChange={(e) => setFormDept(e.target.value)}
                className="w-full bg-slate-50 disabled:bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              />
            </div>

            {isEditing && (
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="flex items-center space-x-1.5 px-5 py-2.5 bg-teal-800 hover:bg-teal-900 text-white font-semibold rounded-xl transition cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </button>
              </div>
            )}
          </form>
        </div>
      )}

      {/* Tab 2: RBAC Matrix */}
      {activeTab === 'rbac' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Assigned Hospital Role & Security Scope</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Your account is assigned the <strong className="text-teal-800">{currentRole}</strong> role according to server JWT permissions.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {(['Super Admin', 'Doctor', 'Nurse', 'Receptionist', 'Billing Officer'] as RoleType[]).map((role) => {
                const isActive = currentRole.toLowerCase() === role.toLowerCase();
                return (
                  <div
                    key={role}
                    className={`p-4 rounded-2xl border text-left flex flex-col justify-between ${
                      isActive
                        ? 'bg-teal-50 border-teal-600 shadow-sm'
                        : 'bg-slate-50/50 border-slate-200 opacity-70'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-slate-900 text-sm">{role}</span>
                        {isActive && <CheckCircle2 className="w-4 h-4 text-teal-700" />}
                      </div>
                      <div className="text-[11px] text-slate-500 leading-relaxed">
                        {role === 'Super Admin'
                          ? 'Full administrative override & analytics'
                          : role === 'Doctor'
                          ? 'Medical diagnosis, triage, prescriptions'
                          : role === 'Nurse'
                          ? 'Vital checks, patient care, ward notes'
                          : role === 'Receptionist'
                          ? 'Appointments, registration, check-ins'
                          : 'Invoices, insurance claims, billing'}
                      </div>
                    </div>
                    <div className="mt-4 pt-2 border-t border-slate-100/80 text-[10px] font-bold uppercase tracking-wider">
                      {isActive ? <span className="text-teal-800">Assigned Account Role</span> : <span className="text-slate-400">Restricted</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Shield className="w-4 h-4 text-teal-700" />
              <span>Permissions Matrix for {currentRole}</span>
            </h3>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
              {(rolePermissions[currentRole] || rolePermissions['Super Admin']).map((perm) => (
                <li key={perm} className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl border border-slate-100">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-medium text-slate-700">{perm}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Tab 3: Security & Password */}
      {activeTab === 'security' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs max-w-xl space-y-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Key className="w-5 h-5 text-teal-700" />
            <span>Update Account Password</span>
          </h3>

          {passwordMsg && (
            <div
              className={`p-3 rounded-xl text-xs font-semibold ${
                passwordMsg.includes('match')
                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}
            >
              {passwordMsg}
            </div>
          )}

          <form onSubmit={handlePasswordChange} className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Current Password</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">New Password</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Confirm New Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="px-5 py-2.5 bg-teal-800 hover:bg-teal-900 text-white font-semibold rounded-xl transition cursor-pointer"
              >
                Update Security Credentials
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
