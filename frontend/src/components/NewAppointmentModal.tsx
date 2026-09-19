import React, { useState, useRef, useEffect } from 'react';
import { X, CalendarPlus, Search, CheckCircle2, UserCheck, Phone, Tag, Building, Sparkles, Edit3, FileText, CheckCircle } from 'lucide-react';
import { Appointment, AppointmentType, Patient, Doctor, AppointmentStatus } from '../types';
import { getDepartmentNames } from '../services/departmentService';

interface NewAppointmentModalProps {
  appointment?: Appointment | null;
  patients?: Patient[];
  doctors?: Doctor[];
  departments?: any[];
  onClose: () => void;
  onAddAppointment: (appointment: Appointment) => void;
}

export const NewAppointmentModal: React.FC<NewAppointmentModalProps> = ({
  appointment = null,
  patients = [],
  doctors = [],
  departments: customDepartments,
  onClose,
  onAddAppointment,
}) => {
  const isEditing = Boolean(appointment);

  // Initialize selected patient if editing
  const matchedInitialPatient = appointment
    ? patients.find(
        (p) =>
          p.patientCode === appointment.patientId ||
          p.id === appointment.patientId ||
          p.name.toLowerCase() === appointment.patientName.toLowerCase()
      ) || null
    : null;

  const [patientSearchInput, setPatientSearchInput] = useState(
    appointment ? appointment.patientName : ''
  );
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(matchedInitialPatient);
  const [showDropdown, setShowDropdown] = useState(false);

  const [date, setDate] = useState(
    appointment ? appointment.date : '2026-08-18'
  );
  const [time, setTime] = useState(
    appointment ? appointment.time : '10:00 AM'
  );
  const [doctorName, setDoctorName] = useState(
    appointment ? appointment.doctorName : 'Dr. Liam Reynolds'
  );
  const [department, setDepartment] = useState(
    appointment ? appointment.department : 'Cardiology'
  );
  const [type, setType] = useState<AppointmentType>(
    appointment ? appointment.type : 'Consultation'
  );
  const [status, setStatus] = useState<AppointmentStatus>(
    appointment ? appointment.status : 'Pending'
  );
  const [notes, setNotes] = useState(
    appointment?.notes || ''
  );

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter patients based on name, code, phone, or id
  const searchLower = patientSearchInput.trim().toLowerCase();
  const matchingPatients = patients.filter((p) => {
    if (!searchLower) return false;
    const nameMatch = p.name.toLowerCase().includes(searchLower);
    const codeMatch = p.patientCode.toLowerCase().includes(searchLower);
    const phoneMatch = p.phone ? p.phone.toLowerCase().includes(searchLower) : false;
    const idMatch = p.id.toLowerCase().includes(searchLower);
    return nameMatch || codeMatch || phoneMatch || idMatch;
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectPatient = (p: Patient) => {
    setSelectedPatient(p);
    setPatientSearchInput(p.name);
    setShowDropdown(false);

    if (p.department) {
      setDepartment(p.department);
    }
    if (p.doctor) {
      setDoctorName(p.doctor);
    }
  };

  const handleClearSelectedPatient = () => {
    setSelectedPatient(null);
    setPatientSearchInput('');
    setShowDropdown(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = selectedPatient ? selectedPatient.name : patientSearchInput.trim();
    if (!finalName) return;

    const initials = finalName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'PT';

    const finalPatientCode = selectedPatient
      ? selectedPatient.patientCode
      : appointment?.patientId || `PT-0${Math.floor(1000 + Math.random() * 9000)}`;

    const savedApt: Appointment = {
      id: appointment ? appointment.id : `apt-${Date.now()}`,
      time,
      date,
      patientName: finalName,
      patientInitials: initials,
      patientId: finalPatientCode,
      doctorName,
      department,
      type,
      status,
      notes: notes.trim() || undefined,
    };

    onAddAppointment(savedApt);
    onClose();
  };

  const DEFAULT_DOCTORS_BY_DEPT: Record<string, string[]> = {
    Cardiology: ['Dr. Liam Reynolds', 'Dr. Sarah Jenkins', 'Dr. Robert Martinez'],
    Neurology: ['Dr. Kenji Tanaka', 'Dr. Naomi Chen'],
    Orthopedics: ['Dr. David Okonkwo', 'Dr. Emily Watson'],
    Pediatrics: ['Dr. Chloe Bennet', 'Dr. Marcus Webb'],
    Emergency: ['Dr. Alex Morgan', 'Dr. James Wilson'],
    Surgery: ['Dr. Arthur Vance', 'Dr. Priya Patel'],
    Psychiatry: ['Dr. Naomi Chen', 'Dr. Samuel Green'],
    Dermatology: ['Dr. Olivia Taylor', 'Dr. Nathan Drake'],
    'General Medicine': ['Dr. Liam Reynolds', 'Dr. Sarah Jenkins'],
    'Outpatient Consultation': ['Dr. Liam Reynolds', 'Dr. Sarah Jenkins', 'Dr. Alex Morgan'],
  };

  // Derive department options and doctor options dynamically from Staff & Departments
  const availableDepartments = React.useMemo(() => {
    return getDepartmentNames([
      ...(customDepartments || []),
      ...doctors.map((d) => d.department).filter(Boolean),
    ]);
  }, [customDepartments, doctors]);

  const availableDoctors = React.useMemo(() => {
    const matchingDocs = doctors
      .filter((d) => d.department?.toLowerCase() === department.toLowerCase())
      .map((d) => d.name);

    if (matchingDocs.length > 0) return matchingDocs;
    return (
      DEFAULT_DOCTORS_BY_DEPT[department] || [
        'Dr. Liam Reynolds',
        'Dr. Sarah Jenkins',
        'Dr. Kenji Tanaka',
        'Dr. Naomi Chen',
        'Dr. David Okonkwo',
      ]
    );
  }, [department, doctors]);

  const handleDepartmentChange = (newDept: string) => {
    setDepartment(newDept);
    const matchingDocs = doctors
      .filter((d) => d.department?.toLowerCase() === newDept.toLowerCase())
      .map((d) => d.name);

    const available =
      matchingDocs.length > 0
        ? matchingDocs
        : DEFAULT_DOCTORS_BY_DEPT[newDept] || ['Dr. Liam Reynolds'];

    if (!available.includes(doctorName)) {
      setDoctorName(available[0]);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-200 cursor-default max-h-[90vh] overflow-y-auto"
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-2.5 mb-5 border-b border-slate-100 pb-3">
          <div className="p-2.5 bg-teal-50 text-teal-800 rounded-xl">
            {isEditing ? <Edit3 className="w-5 h-5" /> : <CalendarPlus className="w-5 h-5" />}
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {isEditing ? 'Edit Clinical Appointment' : 'Book New Appointment'}
            </h2>
            <p className="text-xs text-slate-500">
              {isEditing
                ? 'Update consultation details, scheduling, or assigned physician.'
                : 'Schedule a clinical session, consultation, or follow-up.'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Patient Lookup Input */}
          <div className="relative" ref={dropdownRef}>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-slate-700 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-teal-700" />
                <span>Patient Search / Database Record</span>
              </label>
              <span className="text-[10px] text-teal-700 font-medium">Search by Name, Code or Phone</span>
            </div>

            {selectedPatient ? (
              /* Selected Patient Verified Card */
              <div className="bg-teal-50/80 border border-teal-200 rounded-xl p-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={
                      selectedPatient.avatar ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        selectedPatient.name
                      )}&background=0D9488&color=fff&size=80`
                    }
                    alt={selectedPatient.name}
                    className="w-10 h-10 rounded-xl object-cover border border-teal-300 shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-900 text-xs truncate">{selectedPatient.name}</span>
                      <span className="px-1.5 py-0.2 bg-teal-800 text-white font-mono text-[10px] font-bold rounded shrink-0">
                        {selectedPatient.patientCode}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-600 mt-0.5">
                      <span className="flex items-center gap-0.5">
                        <Phone className="w-3 h-3 text-teal-700" />
                        {selectedPatient.phone || 'No phone'}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-0.5">
                        <Building className="w-3 h-3 text-teal-700" />
                        {selectedPatient.department || 'General'}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleClearSelectedPatient}
                  className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 text-[11px] font-semibold rounded-lg border border-slate-200 transition shrink-0 cursor-pointer"
                >
                  Change
                </button>
              </div>
            ) : (
              /* Search Input */
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={patientSearchInput}
                  onChange={(e) => {
                    setPatientSearchInput(e.target.value);
                    setShowDropdown(true);
                  }}
                  onFocus={() => setShowDropdown(true)}
                  placeholder="Type patient name, code (e.g. PT-0102) or phone number..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition"
                />

                {/* Dropdown Suggestions List */}
                {showDropdown && searchLower.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-52 overflow-y-auto divide-y divide-slate-100">
                    {matchingPatients.length > 0 ? (
                      matchingPatients.map((p) => (
                        <div
                          key={p.id}
                          onClick={() => handleSelectPatient(p)}
                          className="p-2.5 hover:bg-teal-50/80 transition cursor-pointer flex items-center justify-between gap-2"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <img
                              src={
                                p.avatar ||
                                `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                  p.name
                                )}&background=0D9488&color=fff&size=60`
                              }
                              alt={p.name}
                              className="w-8 h-8 rounded-lg object-cover shrink-0 border border-slate-200"
                            />
                            <div className="min-w-0">
                              <div className="font-bold text-slate-900 text-xs truncate flex items-center gap-1.5">
                                <span>{p.name}</span>
                                <span className="font-mono text-[10px] text-teal-800 font-semibold bg-teal-50 px-1.5 py-0.2 rounded border border-teal-200">
                                  {p.patientCode}
                                </span>
                              </div>
                              <div className="text-[10px] text-slate-500 truncate flex items-center gap-2 mt-0.5">
                                <span>📞 {p.phone || 'No phone'}</span>
                                <span>•</span>
                                <span>{p.department}</span>
                              </div>
                            </div>
                          </div>

                          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-semibold rounded-full shrink-0">
                            {p.status}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="p-3 text-center text-slate-500 text-[11px] space-y-1">
                        <p className="font-semibold text-slate-700">No database match found for "{patientSearchInput}"</p>
                        <p className="text-[10px] text-slate-400">
                          You can still complete booking using this custom patient name.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Date & Time Row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Appointment Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Time Slot</label>
              <input
                type="text"
                required
                value={time}
                onChange={(e) => setTime(e.target.value)}
                placeholder="e.g. 10:00 AM"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* Procedure Type & Department */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Appointment Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as AppointmentType)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
              >
                <option value="Consultation">Consultation</option>
                <option value="Check-up">Check-up</option>
                <option value="Procedure">Procedure</option>
                <option value="Follow-up">Follow-up</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Department</label>
              <select
                value={department}
                onChange={(e) => handleDepartmentChange(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
              >
                {availableDepartments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Attending Physician & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Attending Physician / Doctor</label>
              <select
                value={doctorName}
                onChange={(e) => setDoctorName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
              >
                {availableDoctors.map((doc) => (
                  <option key={doc} value={doc}>
                    {doc}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Appointment Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as AppointmentStatus)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer font-semibold"
              >
                <option value="Pending">Pending</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Clinical Notes / Symptoms */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-teal-700" />
              <span>Clinical Reason / Examination Notes (Optional)</span>
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Follow-up consultation for blood pressure monitoring and medication review..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 flex items-center justify-end space-x-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-teal-800 hover:bg-teal-900 text-white font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isEditing ? 'Save Changes' : 'Confirm Appointment'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
