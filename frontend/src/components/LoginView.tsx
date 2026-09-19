import React, { useState } from 'react';
import { ApiClient } from '../services/apiClient';
import { Activity, Lock, Mail, ShieldAlert, KeyRound, CheckCircle2, Hospital } from 'lucide-react';

interface LoginViewProps {
  onLoginSuccess: (userProfile: { id: string; name: string; email: string; role: string }) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('admin@prms.com');
  const [password, setPassword] = useState('AdminPass123!');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const res = await ApiClient.login(email, password);
      if (res.success && res.data) {
        ApiClient.setToken(res.data.accessToken);
        onLoginSuccess({
          id: res.data.user.id || res.data.user._id,
          name: res.data.user.name,
          email: res.data.user.email,
          role: res.data.user.role,
        });
      } else {
        setErrorMsg(res.message || 'Invalid email or password. Please try again.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to authenticate with server.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-teal-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200/80 p-8 z-10 space-y-6">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-teal-800 rounded-2xl text-white shadow-lg shadow-teal-900/20 mb-1">
            <Activity className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Meridian PRMS</h1>
          <p className="text-xs text-slate-500 font-medium">Patient Record Management System — Staff Portal</p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-semibold text-rose-800 flex items-center gap-2.5 animate-in fade-in zoom-in-95">
            <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Staff Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="doctor@prms.com"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-600 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Account Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-600 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-teal-800 hover:bg-teal-900 active:scale-[0.99] text-white font-bold text-xs rounded-xl shadow-lg shadow-teal-900/20 transition duration-150 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <KeyRound className="w-4 h-4" />
                <span>Sign In to Hospital Portal</span>
              </>
            )}
          </button>
        </form>

        {/* Demo Quick Logins */}
        <div className="pt-4 border-t border-slate-100">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 text-center">
            Demo Credentials Quick Select
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <button
              type="button"
              onClick={() => handleQuickFill('admin@prms.com', 'AdminPass123!')}
              className="p-2 rounded-xl bg-slate-50 hover:bg-teal-50 border border-slate-200 text-slate-700 font-semibold text-left transition"
            >
              <div className="font-bold text-teal-900">Hospital Admin</div>
              <div className="text-[10px] text-slate-500">admin@prms.com</div>
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('jenkins@prms.com', 'DoctorPass123!')}
              className="p-2 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200 text-slate-700 font-semibold text-left transition"
            >
              <div className="font-bold text-blue-900">Doctor (Cardiology)</div>
              <div className="text-[10px] text-slate-500">jenkins@prms.com</div>
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('nurse.carter@prms.com', 'NursePass123!')}
              className="p-2 rounded-xl bg-slate-50 hover:bg-purple-50 border border-slate-200 text-slate-700 font-semibold text-left transition"
            >
              <div className="font-bold text-purple-900">Nurse (ICU)</div>
              <div className="text-[10px] text-slate-500">nurse.carter@prms.com</div>
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('reception.main@prms.com', 'ReceptionistPass123!')}
              className="p-2 rounded-xl bg-slate-50 hover:bg-amber-50 border border-slate-200 text-slate-700 font-semibold text-left transition"
            >
              <div className="font-bold text-amber-900">Receptionist</div>
              <div className="text-[10px] text-slate-500">reception.main@prms.com</div>
            </button>
          </div>
        </div>

        <div className="text-center text-[10px] text-slate-400 font-medium">
          Protected by Meridian Health Security & HIPAA Compliance Safeguards.
        </div>
      </div>
    </div>
  );
};
