import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Moon,
  Sun,
  Bell,
  ChevronDown,
  Building2,
  Check,
  UserPlus,
  CalendarPlus,
  X,
  Menu,
  MessageSquare,
  Shield,
  Key,
  SlidersHorizontal,
  Server,
  LogOut,
  User,
  Activity,
  RotateCw,
  RefreshCw,
  Zap,
} from 'lucide-react';
import { UserRole } from '../types';
import { ApiClient } from '../services/apiClient';

interface HeaderProps {
  onOpenSearch: () => void;
  onOpenNewPatient: () => void;
  onOpenNewAppointment: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onToggleMobileSidebar: () => void;
  onOpenMessageDrawer?: () => void;
  currentRole: UserRole;
  currentUser?: { id?: string; name: string; role: string; email: string } | null;
  onLogout?: () => void;
  activities?: any[];
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSearch,
  onOpenNewPatient,
  onOpenNewAppointment,
  darkMode,
  onToggleDarkMode,
  onToggleMobileSidebar,
  onOpenMessageDrawer,
  currentRole,
  currentUser,
  onLogout,
  activities = [],
}) => {
  const [hospitalOpen, setHospitalOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [selectedHospital, setSelectedHospital] = useState('St. Meridian General');
  const [quickMenuOpen, setQuickMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [mobileToolsOpen, setMobileToolsOpen] = useState(false);
  const [apiOnline, setApiOnline] = useState<boolean>(true);
  const [serverStatusOpen, setServerStatusOpen] = useState<boolean>(false);
  const [isPinging, setIsPinging] = useState<boolean>(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const checkApiStatus = async () => {
    setIsPinging(true);
    try {
      const res = await ApiClient.checkHealth();
      setApiOnline(res.success);
    } catch {
      setApiOnline(false);
    } finally {
      setIsPinging(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    const runCheck = async () => {
      const res = await ApiClient.checkHealth();
      if (mounted) {
        setApiOnline(res.success);
      }
    };
    runCheck();
    const interval = setInterval(runCheck, 20000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (activities.length > 0) {
      setUnreadCount((prev) => prev + 1);
    }
  }, [activities.length]);

  const hospitals = [
    'St. Meridian General',
    'Meridian West Wing Specialty',
    "Meridian Children's Hospital",
    'Meridian Outpatient Care Center',
  ];

  const handleOpenNotifications = () => {
    setNotificationsOpen(!notificationsOpen);
    if (!notificationsOpen) {
      setUnreadCount(0);
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-3 sm:px-6 flex items-center justify-between sticky top-0 z-30 min-w-0">
      {/* Click-outside backdrop for all Header dropdowns */}
      {(hospitalOpen || profileMenuOpen || quickMenuOpen || notificationsOpen || mobileToolsOpen || serverStatusOpen) && (
        <div
          className="fixed inset-0 z-40 bg-transparent"
          onClick={() => {
            setHospitalOpen(false);
            setProfileMenuOpen(false);
            setQuickMenuOpen(false);
            setNotificationsOpen(false);
            setMobileToolsOpen(false);
            setServerStatusOpen(false);
          }}
        />
      )}

      {/* Left Section: Mobile Menu Toggle & Hospital Selector */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        <button
          onClick={onToggleMobileSidebar}
          className="p-1.5 sm:p-2 text-slate-600 hover:text-slate-900 lg:hidden rounded-lg hover:bg-slate-100 transition shrink-0"
          aria-label="Open sidebar navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="relative">
          <button
            onClick={() => setHospitalOpen(!hospitalOpen)}
            className="flex items-center space-x-1 sm:space-x-1.5 text-xs sm:text-sm font-semibold text-slate-800 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 px-2 sm:px-3 py-1.5 rounded-xl border border-slate-200/80 transition-colors shrink-0"
          >
            <Building2 className="w-4 h-4 text-teal-800 shrink-0" />
            <span className="truncate max-w-[100px] xs:max-w-[140px] sm:max-w-[180px] md:max-w-none">{selectedHospital}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          </button>

          {hospitalOpen && (
            <div className="absolute left-0 mt-1.5 w-60 sm:w-64 max-w-[calc(100vw-1.5rem)] bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50">
              <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Switch Hospital Facility
              </div>
              {hospitals.map((hosp) => (
                <button
                  key={hosp}
                  onClick={() => {
                    setSelectedHospital(hosp);
                    setHospitalOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs text-left text-slate-700 hover:bg-slate-50 transition"
                >
                  <span className={hosp === selectedHospital ? 'font-bold text-teal-800' : ''}>
                    {hosp}
                  </span>
                  {hosp === selectedHospital && (
                    <Check className="w-4 h-4 text-teal-800 shrink-0" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Center: Global Search Bar */}
      <div className="hidden sm:flex flex-1 min-w-0 max-w-xs sm:max-w-md lg:max-w-xl mx-2 sm:mx-6">
        <button
          onClick={onOpenSearch}
          className="w-full flex items-center justify-between bg-slate-50 border border-slate-200 text-slate-400 text-xs sm:text-sm px-3 py-1.5 sm:py-2 rounded-xl hover:bg-slate-100/80 hover:border-slate-300 transition-colors group cursor-text"
        >
          <div className="flex items-center space-x-2 min-w-0">
            <Search className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors shrink-0" />
            <span className="text-slate-500 font-normal truncate">Search patients, doctors, staff...</span>
          </div>
          <div className="hidden md:flex items-center space-x-1 shrink-0">
            <kbd className="px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 bg-white border border-slate-200 rounded shadow-xs">
              ⌘K
            </kbd>
          </div>
        </button>
      </div>

      {/* Right Section */}
      <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
        
        {/* Desktop Actions */}
        <div className="hidden sm:flex items-center space-x-1.5 sm:space-x-2 shrink-0">
          {/* API Server Indicator with Interactive Reconnect Popover */}
          <div className="relative">
            <button
              id="header-server-status-btn"
              onClick={() => setServerStatusOpen(!serverStatusOpen)}
              className={`hidden lg:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-all shadow-xs cursor-pointer ${
                apiOnline
                  ? 'bg-emerald-50 hover:bg-emerald-100/80 border-emerald-200 text-emerald-800'
                  : 'bg-amber-50 hover:bg-amber-100/80 border-amber-200 text-amber-800'
              }`}
              title={apiOnline ? 'Live Data Feed (Click to manage connection)' : 'Server Standby (Click to reconnect)'}
            >
              <span className={`w-2 h-2 rounded-full ${apiOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              <Server className="w-3.5 h-3.5" />
              <span>{apiOnline ? 'Live Data' : 'Standby'}</span>
              {isPinging && <RotateCw className="w-3 h-3 animate-spin ml-0.5 text-slate-500" />}
            </button>

            {serverStatusOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 p-3.5 z-50 animate-in fade-in zoom-in-95 duration-150 text-slate-800">
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${apiOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                    <span className="font-bold text-xs text-slate-900">
                      {apiOnline ? 'Live API Connection Active' : 'API Standby Mode'}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold">
                    v1.0
                  </span>
                </div>

                <div className="py-2.5 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="text-[11px]">Backend API</span>
                    <span className="font-semibold text-slate-900">/api/v1 (REST)</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="text-[11px]">Database Layer</span>
                    <span className="font-semibold text-emerald-700">Live Sync</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="text-[11px]">Real-time Sync</span>
                    <span className="font-semibold text-slate-900">Active (20s polling)</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <button
                    id="header-reconnect-server-btn"
                    onClick={async () => {
                      await checkApiStatus();
                    }}
                    disabled={isPinging}
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-[#0B4F4C] hover:bg-[#083b39] text-white text-xs font-bold transition shadow-sm disabled:opacity-50"
                  >
                    <RotateCw className={`w-3.5 h-3.5 ${isPinging ? 'animate-spin' : ''}`} />
                    <span>{isPinging ? 'Pinging Server...' : 'Reconnect / Ping Live Feed'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Authenticated User Profile & Logout */}
          <div className="relative">
            <button
              onClick={() => setProfileMenuOpen(!profileMenuOpen)}
              className="flex items-center space-x-2 px-2.5 py-1.5 rounded-xl border border-teal-200 bg-teal-50/80 hover:bg-teal-100/80 text-teal-900 transition text-xs font-bold shadow-xs shrink-0 cursor-pointer"
            >
              <div className="w-6 h-6 rounded-full bg-teal-800 text-white flex items-center justify-center text-[10px] font-bold">
                {currentUser?.name ? currentUser.name.slice(0, 2).toUpperCase() : 'US'}
              </div>
              <div className="text-left hidden md:block">
                <div className="text-xs font-bold leading-tight truncate max-w-[120px]">{currentUser?.name || 'Staff User'}</div>
                <div className="text-[10px] font-semibold text-teal-700 capitalize leading-none">{currentUser?.role || currentRole}</div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-teal-700 shrink-0" />
            </button>

            {profileMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-200 p-3 z-50 animate-in fade-in zoom-in-95 duration-150 text-slate-800">
                <div className="px-2 py-2 border-b border-slate-100 mb-2">
                  <div className="font-bold text-slate-900 text-sm">{currentUser?.name || 'Authenticated User'}</div>
                  <div className="text-xs text-slate-500">{currentUser?.email || 'user@prms.com'}</div>
                  <span className="inline-block mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-teal-100 text-teal-800 uppercase tracking-wider">
                    Role: {currentUser?.role || currentRole}
                  </span>
                </div>

                {onLogout && (
                  <button
                    onClick={() => {
                      setProfileMenuOpen(false);
                      onLogout();
                    }}
                    className="w-full flex items-center space-x-2 p-2.5 rounded-xl text-rose-700 bg-rose-50 hover:bg-rose-100 font-bold text-xs transition cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out / Log Out</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Dark Mode Toggle */}
          <button
            onClick={onToggleDarkMode}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition shrink-0"
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>

          {/* Internal Messaging quick button */}
          {onOpenMessageDrawer && (
            <button
              onClick={onOpenMessageDrawer}
              className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-teal-50 hover:text-teal-800 flex items-center justify-center text-slate-700 transition relative shrink-0"
              title="Internal Staff Messages"
            >
              <MessageSquare className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-teal-600 ring-2 ring-white" />
            </button>
          )}

          {/* Quick Add Menu */}
          <div className="relative">
            <button
              onClick={() => setQuickMenuOpen(!quickMenuOpen)}
              className="w-8 h-8 rounded-xl bg-teal-800 hover:bg-teal-900 flex items-center justify-center text-white transition shadow-xs shrink-0"
              title="Quick Registration"
            >
              <Plus className="w-4 h-4" />
            </button>

            {quickMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 max-w-[calc(100vw-1.5rem)] bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50">
                <button
                  onClick={() => {
                    setQuickMenuOpen(false);
                    onOpenNewPatient();
                  }}
                  className="w-full flex items-center px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 text-left transition"
                >
                  <UserPlus className="w-4 h-4 mr-2.5 text-teal-800 shrink-0" />
                  <span className="truncate">Register New Patient</span>
                </button>
                <button
                  onClick={() => {
                    setQuickMenuOpen(false);
                    onOpenNewAppointment();
                  }}
                  className="w-full flex items-center px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 text-left transition"
                >
                  <CalendarPlus className="w-4 h-4 mr-2.5 text-blue-600 shrink-0" />
                  <span className="truncate">Book Appointment</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Real-time Notifications */}
        <div className="relative">
          <button
            onClick={handleOpenNotifications}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 transition relative shrink-0 cursor-pointer"
            title="Real-Time Hospital Activity Log"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-600 text-white text-[10px] font-extrabold flex items-center justify-center ring-2 ring-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 max-w-[calc(100vw-1.5rem)] bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 z-50">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-3">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-teal-800" />
                  <span className="font-bold text-slate-900 text-sm">Real-Time Activity Feed</span>
                </div>
                <button
                  onClick={() => setNotificationsOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2 max-h-80 overflow-y-auto">
                {activities.length === 0 ? (
                  <div className="text-center py-6 text-xs text-slate-400">No activity recorded yet</div>
                ) : (
                  activities.slice(0, 10).map((act, i) => (
                    <div key={act.id || i} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                      <div className="flex items-center justify-between font-bold text-slate-900">
                        <span>{act.author || act.user || 'Staff Member'}</span>
                        <span className="text-[10px] text-slate-400 font-normal">{act.timeAgo || act.timestamp || 'Just now'}</span>
                      </div>
                      <div className="text-slate-600 text-[11px] mt-0.5">
                        <span className="font-semibold text-teal-800 capitalize">{act.action || 'updated'}</span>{' '}
                        <span>{act.target || act.details || ''}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Mobile Actions Button */}
        <div className="relative sm:hidden shrink-0">
          <button
            onClick={() => setMobileToolsOpen(!mobileToolsOpen)}
            className="w-8 h-8 rounded-xl bg-slate-800 text-white hover:bg-slate-900 flex items-center justify-center transition shadow-xs"
            title="Quick Menu & Tools"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>

          {mobileToolsOpen && (
            <div className="absolute right-0 mt-2 w-72 max-w-[calc(100vw-1.5rem)] bg-white rounded-2xl shadow-2xl border border-slate-200 p-3 z-50 text-slate-800">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-teal-700" /> Quick Actions
                </span>
                <button
                  onClick={() => setMobileToolsOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2.5">
                <button
                  onClick={() => {
                    setMobileToolsOpen(false);
                    onOpenSearch();
                  }}
                  className="w-full flex items-center justify-between bg-slate-50 hover:bg-teal-50/80 border border-slate-200 text-slate-700 text-xs font-semibold p-2.5 rounded-xl transition"
                >
                  <div className="flex items-center gap-2">
                    <Search className="w-4 h-4 text-teal-700" />
                    <span>Search Records...</span>
                  </div>
                </button>

                {onLogout && (
                  <button
                    onClick={() => {
                      setMobileToolsOpen(false);
                      onLogout();
                    }}
                    className="w-full flex items-center gap-2 p-2.5 rounded-xl text-rose-700 bg-rose-50 font-bold text-xs transition"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

      </div>
    </header>
  );
};



