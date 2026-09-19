import React, { useState, useEffect } from 'react';
import { Search, X, User, Calendar, FileText, ArrowRight } from 'lucide-react';
import { Patient, Appointment, Doctor } from '../types';

interface SearchModalProps {
  onClose: () => void;
  patients: Patient[];
  appointments: Appointment[];
  doctors: Doctor[];
  onSelectPatient: (patient: Patient) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  onClose,
  patients,
  appointments,
  doctors,
  onSelectPatient,
}) => {
  const [query, setQuery] = useState('');

  // Close modal on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const matchingPatients = patients.filter(
    (p) =>
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.patientCode.toLowerCase().includes(query.toLowerCase())
  );

  const matchingDoctors = doctors.filter(
    (d) =>
      d.name.toLowerCase().includes(query.toLowerCase()) ||
      d.specialty.toLowerCase().includes(query.toLowerCase())
  );

  const matchingAppointments = appointments.filter(
    (a) =>
      a.patientName.toLowerCase().includes(query.toLowerCase()) ||
      a.doctorName.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-start justify-center pt-20 p-4 z-50 cursor-pointer"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-200 cursor-default"
      >
        <div className="p-4 border-b border-slate-100 flex items-center space-x-3">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search patients, doctors, or appointments..."
            className="w-full text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none"
          />
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 max-h-[60vh] overflow-y-auto space-y-4 text-xs">
          {/* Patients */}
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Patients ({matchingPatients.length})
            </div>
            <div className="space-y-1">
              {matchingPatients.slice(0, 4).map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    onSelectPatient(p);
                    onClose();
                  }}
                  className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 text-left transition-colors group"
                >
                  <div className="flex items-center space-x-2.5">
                    <User className="w-4 h-4 text-[#0B4F4C]" />
                    <div>
                      <div className="font-bold text-slate-900">{p.name}</div>
                      <div className="text-[10px] text-slate-400">{p.patientCode} · {p.department}</div>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-[#0B4F4C] transition-colors" />
                </button>
              ))}
            </div>
          </div>

          {/* Doctors */}
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Physicians ({matchingDoctors.length})
            </div>
            <div className="space-y-1">
              {matchingDoctors.slice(0, 3).map((d) => (
                <div key={d.id} className="p-2 rounded-xl bg-slate-50 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-900">{d.name}</div>
                    <div className="text-[10px] text-slate-500">{d.specialty} · {d.department}</div>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {d.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 px-4">
          <span>Press <kbd className="px-1 py-0.5 bg-white border rounded font-mono">ESC</kbd> to exit</span>
          <span>St. Meridian Global Index</span>
        </div>
      </div>
    </div>
  );
};
