import React from 'react';
import {
  LayoutDashboard,
  BarChart3,
  Users,
  UserCheck,
  HeartPulse,
  Calendar,
  FileText,
  Building2,
  Settings,
  ChevronDown,
  Activity,
  UserPlus,
  X,
  ShieldAlert,
  Lock,
  CreditCard,
  Stethoscope,
  User,
} from 'lucide-react';
import { NavigationTab, UserRole } from '../types';
import { roleProfiles } from '../data/mockData';

interface SidebarProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  counts: {
    patients: number;
    doctors: number;
    nurses: number;
    receptionists: number;
    appointments: number;
  };
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
  currentRole: UserRole;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  counts,
  mobileOpen = false,
  onCloseMobile,
  currentRole,
}) => {
  const activeProfile = roleProfiles[currentRole] || roleProfiles.admin;

  const handleTabClick = (tab: NavigationTab) => {
    onSelectTab(tab);
    if (onCloseMobile) onCloseMobile();
  };

  // Helper to check if tab is restricted for patient/receptionist
  const isTabRestricted = (tab: NavigationTab) => {
    if (currentRole === 'patient') {
      return ['analytics', 'doctors', 'nurses', 'receptionists', 'staff-depts', 'settings'].includes(tab);
    }
    if (currentRole === 'receptionist') {
      return ['analytics', 'settings'].includes(tab);
    }
    if (currentRole === 'nurse') {
      return ['analytics', 'settings'].includes(tab);
    }
    return false;
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 lg:z-20 w-64 bg-white border-r border-slate-200 flex flex-col justify-between h-screen text-slate-700 select-none shrink-0 transition-transform duration-300 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div>
          {/* Brand Logo Header */}
          <div className="p-4 flex items-center justify-between border-b border-slate-100">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-teal-800 flex items-center justify-center text-white shadow-sm">
                <Activity className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div className="flex items-baseline space-x-1">
                <span className="font-bold text-slate-900 text-lg tracking-tight">Meridian</span>
                <span className="text-teal-700 font-bold text-sm">Health</span>
              </div>
            </div>

            {/* Close button on mobile */}
            {onCloseMobile && (
              <button
                onClick={onCloseMobile}
                className="p-1.5 text-slate-400 hover:text-slate-700 lg:hidden rounded-lg hover:bg-slate-100"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Active Role Banner */}
          <div className="px-3 pt-3 pb-1">
            <div className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between ${activeProfile.badgeColor}`}>
              <div className="flex items-center space-x-2 truncate">
                <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{activeProfile.title}</span>
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-white/60">
                {currentRole}
              </span>
            </div>
          </div>

          {/* Navigation Sections */}
          <div className="py-2 space-y-4 px-3 overflow-y-auto max-h-[calc(100vh-210px)]">
            {/* Section: OVERVIEW */}
            <div>
              <div className="px-3 text-[11px] font-bold text-slate-400 tracking-wider uppercase mb-1.5">
                Overview
              </div>
              <nav className="space-y-0.5">
                <button
                  onClick={() => handleTabClick('dashboard')}
                  className={`w-full flex items-center px-3 py-2 text-xs sm:text-sm font-medium rounded-xl transition-colors ${
                    currentTab === 'dashboard'
                      ? 'bg-teal-50 text-teal-800 font-bold'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <LayoutDashboard
                    className={`w-4 h-4 mr-3 ${
                      currentTab === 'dashboard' ? 'text-teal-800' : 'text-slate-400'
                    }`}
                  />
                  Dashboard
                </button>

                <button
                  onClick={() => handleTabClick('analytics')}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs sm:text-sm font-medium rounded-xl transition-colors ${
                    currentTab === 'analytics'
                      ? 'bg-teal-50 text-teal-800 font-bold'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center">
                    <BarChart3
                      className={`w-4 h-4 mr-3 ${
                        currentTab === 'analytics' ? 'text-teal-800' : 'text-slate-400'
                      }`}
                    />
                    Analytics
                  </div>
                  {isTabRestricted('analytics') && (
                    <Lock className="w-3 h-3 text-slate-400" title="Restricted for this RBAC role" />
                  )}
                </button>
              </nav>
            </div>

            {/* Section: CLINICAL */}
            <div>
              <div className="px-3 text-[11px] font-bold text-slate-400 tracking-wider uppercase mb-1.5">
                Clinical Staff & Patients
              </div>
              <nav className="space-y-0.5">
                <button
                  onClick={() => handleTabClick('patients')}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs sm:text-sm font-medium rounded-xl transition-colors ${
                    currentTab === 'patients'
                      ? 'bg-teal-50 text-teal-800 font-bold'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center">
                    <Users
                      className={`w-4 h-4 mr-3 ${
                        currentTab === 'patients' ? 'text-teal-800' : 'text-slate-400'
                      }`}
                    />
                    Patients
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold border border-slate-200">
                    {counts.patients}
                  </span>
                </button>

                <button
                  onClick={() => handleTabClick('doctors')}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs sm:text-sm font-medium rounded-xl transition-colors ${
                    currentTab === 'doctors'
                      ? 'bg-teal-50 text-teal-800 font-bold'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center">
                    <UserCheck
                      className={`w-4 h-4 mr-3 ${
                        currentTab === 'doctors' ? 'text-teal-800' : 'text-slate-400'
                      }`}
                    />
                    Doctors
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold border border-slate-200">
                    {counts.doctors}
                  </span>
                </button>

                <button
                  onClick={() => handleTabClick('nurses')}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs sm:text-sm font-medium rounded-xl transition-colors ${
                    currentTab === 'nurses'
                      ? 'bg-teal-50 text-teal-800 font-bold'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center">
                    <HeartPulse
                      className={`w-4 h-4 mr-3 ${
                        currentTab === 'nurses' ? 'text-teal-800' : 'text-slate-400'
                      }`}
                    />
                    Nurses
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold border border-slate-200">
                    {counts.nurses}
                  </span>
                </button>

                <button
                  onClick={() => handleTabClick('receptionists')}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs sm:text-sm font-medium rounded-xl transition-colors ${
                    currentTab === 'receptionists'
                      ? 'bg-teal-50 text-teal-800 font-bold'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center">
                    <UserPlus
                      className={`w-4 h-4 mr-3 ${
                        currentTab === 'receptionists' ? 'text-teal-800' : 'text-slate-400'
                      }`}
                    />
                    Receptionists
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold border border-slate-200">
                    {counts.receptionists}
                  </span>
                </button>

                <button
                  onClick={() => handleTabClick('appointments')}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs sm:text-sm font-medium rounded-xl transition-colors ${
                    currentTab === 'appointments'
                      ? 'bg-teal-50 text-teal-800 font-bold'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center">
                    <Calendar
                      className={`w-4 h-4 mr-3 ${
                        currentTab === 'appointments' ? 'text-teal-800' : 'text-slate-400'
                      }`}
                    />
                    Appointments
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold border border-slate-200">
                    {counts.appointments}
                  </span>
                </button>

                <button
                  onClick={() => handleTabClick('medical-records')}
                  className={`w-full flex items-center px-3 py-2 text-xs sm:text-sm font-medium rounded-xl transition-colors ${
                    currentTab === 'medical-records'
                      ? 'bg-teal-50 text-teal-800 font-bold'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <FileText
                    className={`w-4 h-4 mr-3 ${
                      currentTab === 'medical-records' ? 'text-teal-800' : 'text-slate-400'
                    }`}
                  />
                  Medical Records
                </button>
              </nav>
            </div>

            {/* Section: OPERATIONS */}
            <div>
              <div className="px-3 text-[11px] font-bold text-slate-400 tracking-wider uppercase mb-1.5">
                Operations & Finance
              </div>
              <nav className="space-y-0.5">
                <button
                  onClick={() => handleTabClick('staff-depts')}
                  className={`w-full flex items-center px-3 py-2 text-xs sm:text-sm font-medium rounded-xl transition-colors ${
                    currentTab === 'staff-depts'
                      ? 'bg-teal-50 text-teal-800 font-bold'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Building2
                    className={`w-4 h-4 mr-3 ${
                      currentTab === 'staff-depts' ? 'text-teal-800' : 'text-slate-400'
                    }`}
                  />
                  Staff & Depts
                </button>
                <button
                  onClick={() => handleTabClick('payments')}
                  className={`w-full flex items-center px-3 py-2 text-xs sm:text-sm font-medium rounded-xl transition-colors ${
                    currentTab === 'payments'
                      ? 'bg-teal-50 text-teal-800 font-bold'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <CreditCard
                    className={`w-4 h-4 mr-3 ${
                      currentTab === 'payments' ? 'text-teal-800' : 'text-slate-400'
                    }`}
                  />
                  Payments & Invoices
                </button>
                <button
                  onClick={() => handleTabClick('services')}
                  className={`w-full flex items-center px-3 py-2 text-xs sm:text-sm font-medium rounded-xl transition-colors ${
                    currentTab === 'services'
                      ? 'bg-teal-50 text-teal-800 font-bold'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Stethoscope
                    className={`w-4 h-4 mr-3 ${
                      currentTab === 'services' ? 'text-teal-800' : 'text-slate-400'
                    }`}
                  />
                  Services & Pricing
                </button>
                <button
                  onClick={() => handleTabClick('settings')}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs sm:text-sm font-medium rounded-xl transition-colors ${
                    currentTab === 'settings'
                      ? 'bg-teal-50 text-teal-800 font-bold'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center">
                    <Settings
                      className={`w-4 h-4 mr-3 ${
                        currentTab === 'settings' ? 'text-teal-800' : 'text-slate-400'
                      }`}
                    />
                    Settings
                  </div>
                  {isTabRestricted('settings') && (
                    <Lock className="w-3 h-3 text-slate-400" title="Restricted for this RBAC role" />
                  )}
                </button>
              </nav>
            </div>
          </div>
        </div>

        {/* User Profile Card */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/50">
          <button
            onClick={() => handleTabClick('profile')}
            className={`w-full flex items-center justify-between p-2 rounded-xl transition-colors text-left ${
              currentTab === 'profile' ? 'bg-teal-50 border border-teal-200' : 'hover:bg-slate-200/60'
            }`}
          >
            <div className="flex items-center space-x-2.5">
              <img
                src={activeProfile.avatar}
                alt={activeProfile.name}
                className="w-9 h-9 rounded-full object-cover border border-teal-600/30 shadow-xs"
              />
              <div className="overflow-hidden">
                <div className="text-xs font-bold text-slate-800 truncate">{activeProfile.name}</div>
                <div className="text-[11px] text-slate-500 truncate">{activeProfile.title}</div>
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
          </button>
        </div>
      </aside>
    </>
  );
};

