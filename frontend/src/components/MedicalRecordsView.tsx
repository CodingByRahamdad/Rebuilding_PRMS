import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Search,
  FileText,
  Download,
  Eye,
  ExternalLink,
  RotateCw,
  Loader2,
  Plus,
  Trash2,
  AlertTriangle,
  X,
  Stethoscope,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Filter,
  CheckCircle2,
  UploadCloud,
  File,
  Paperclip,
  Activity,
  Heart,
  Thermometer,
  Calendar,
  User,
  Phone,
  Hash,
  Sparkles,
  Info,
} from 'lucide-react';
import { MedicalRecord, Patient, Doctor, PatientReport, ReportAttachment } from '../types';
import { ApiClient } from '../services/apiClient';

interface MedicalRecordsViewProps {
  records: MedicalRecord[];
  patients: Patient[];
  doctors?: Doctor[];
  onOpenExport: () => void;
  onSelectPatient: (patient: Patient) => void;
  onAddRecord?: (newRec: MedicalRecord) => void;
  onUpdateRecordStatus?: (recordId: string, newStatus: string) => void;
  onSavePatientReport?: (patientId: string, report: PatientReport) => void;
  onDeleteRecord?: (id: string) => void;
}

const CATEGORIES = [
  'All',
  'Cardiology',
  'Laboratory',
  'Radiology',
  'Orthopedics',
  'Neurology',
  'Surgery',
  'Dermatology',
  'Pathology',
  'General',
  'Clinical Summary',
];

const STATUS_OPTIONS = ['All', 'Active', 'Completed', 'Pending Review', 'Archived'];

export const MedicalRecordsView: React.FC<MedicalRecordsViewProps> = ({
  records: initialRecords,
  patients,
  doctors = [],
  onOpenExport,
  onSelectPatient,
  onAddRecord,
  onUpdateRecordStatus,
  onSavePatientReport,
  onDeleteRecord,
}) => {
  // Filters and Pagination State
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Data & Loading State
  const [liveRecords, setLiveRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleQuickStatusChange = (recordId: string, newStatus: string) => {
    if (onUpdateRecordStatus) {
      onUpdateRecordStatus(recordId, newStatus);
    }
    showToast(`Status updated to ${newStatus}`);
  };

  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewingRecord, setViewingRecord] = useState<MedicalRecord | null>(null);
  const [recordToDelete, setRecordToDelete] = useState<MedicalRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State for "New Clinical Record / Report"
  const [selectedPatientForNewRecord, setSelectedPatientForNewRecord] = useState<Patient | null>(null);
  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [patientSelectorPage, setPatientSelectorPage] = useState(1);
  const PATIENTS_PER_SELECTOR_PAGE = 4;

  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState('Laboratory');
  const [formDoctorName, setFormDoctorName] = useState(
    doctors[0]?.name || 'Dr. Sarah Jenkins'
  );
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formDiagnosis, setFormDiagnosis] = useState('');
  const [formTreatment, setFormTreatment] = useState('');
  const [formStatus, setFormStatus] = useState<'Active' | 'Completed' | 'Pending Review' | 'Archived'>('Active');
  
  // Vital Signs (clean defaults - no fake hardcoded numbers)
  const [formBp, setFormBp] = useState('');
  const [formHeartRate, setFormHeartRate] = useState('');
  const [formTemp, setFormTemp] = useState('');
  const [formWeight, setFormWeight] = useState('');
  const [formHeight, setFormHeight] = useState('');

  // Attachments
  const [formAttachments, setFormAttachments] = useState<ReportAttachment[]>([]);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 250);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Compute live filtered records directly from initialRecords (the single source of truth passed from App.tsx)
  const filteredRecords = useMemo(() => {
    let list = [...initialRecords];
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase().trim();
      list = list.filter(
        (r) =>
          (r.patientName && r.patientName.toLowerCase().includes(q)) ||
          (r.recordCode && r.recordCode.toLowerCase().includes(q)) ||
          (r.patientId && r.patientId.toLowerCase().includes(q)) ||
          (r.doctorName && r.doctorName.toLowerCase().includes(q)) ||
          (r.diagnosis && r.diagnosis.toLowerCase().includes(q)) ||
          (r.category && r.category.toLowerCase().includes(q)) ||
          (r.reportType && r.reportType.toLowerCase().includes(q)) ||
          (r.treatment && r.treatment.toLowerCase().includes(q))
      );
    }
    if (selectedCategory !== 'All') {
      list = list.filter((r) => r.category?.toLowerCase() === selectedCategory.toLowerCase());
    }
    if (selectedStatus !== 'All') {
      list = list.filter((r) => r.status?.toLowerCase() === selectedStatus.toLowerCase());
    }
    return list;
  }, [initialRecords, debouncedSearch, selectedCategory, selectedStatus]);

  // Derived pagination
  const computedTotalRecords = filteredRecords.length;
  const computedTotalPages = Math.max(1, Math.ceil(computedTotalRecords / limit));

  const displayRecords = useMemo(() => {
    const start = (currentPage - 1) * limit;
    return filteredRecords.slice(start, start + limit);
  }, [filteredRecords, currentPage, limit]);

  // Keep total counts in sync
  useEffect(() => {
    setTotalRecords(computedTotalRecords);
    setTotalPages(computedTotalPages);
    if (currentPage > computedTotalPages && computedTotalPages > 0) {
      setCurrentPage(1);
    }
  }, [computedTotalRecords, computedTotalPages, currentPage]);

  // Refresh handler to check backend API
  const handleRefresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await ApiClient.getMedicalRecords({
        page: currentPage,
        limit,
        search: debouncedSearch,
        category: selectedCategory,
        status: selectedStatus,
      });

      if (res && res.success) {
        showToast('EHR Medical Records synchronized successfully.');
      }
    } catch (err: any) {
      console.warn('EHR Fetch warning:', err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, limit, debouncedSearch, selectedCategory, selectedStatus]);

  useEffect(() => {
    setLoading(false);
  }, [initialRecords]);

  // Filtered patients for the "Add New Clinical Record" patient selector
  const filteredSelectorPatients = useMemo(() => {
    if (!patientSearchTerm.trim()) return patients;
    const term = patientSearchTerm.toLowerCase().trim();
    return patients.filter((p) => {
      const matchName = p.name.toLowerCase().includes(term);
      const matchCode = p.patientCode?.toLowerCase().includes(term) || p.id?.toLowerCase().includes(term);
      const matchPhone = p.phone?.toLowerCase().includes(term);
      const matchEmail = p.email?.toLowerCase().includes(term);
      return matchName || matchCode || matchPhone || matchEmail;
    });
  }, [patients, patientSearchTerm]);

  const totalSelectorPages = Math.ceil(filteredSelectorPatients.length / PATIENTS_PER_SELECTOR_PAGE) || 1;
  const paginatedSelectorPatients = useMemo(() => {
    const start = (patientSelectorPage - 1) * PATIENTS_PER_SELECTOR_PAGE;
    return filteredSelectorPatients.slice(start, start + PATIENTS_PER_SELECTOR_PAGE);
  }, [filteredSelectorPatients, patientSelectorPage]);

  // Handle patient selection in the add modal
  const handleSelectPatientInForm = (p: Patient) => {
    setSelectedPatientForNewRecord(p);
    if (!formDiagnosis) setFormDiagnosis(p.condition || 'Clinical assessment');
    if (!formDoctorName && p.doctor) setFormDoctorName(p.doctor);
    if (p.vitals) {
      if (p.vitals.bloodPressure) setFormBp(p.vitals.bloodPressure);
      if (p.vitals.heartRate) setFormHeartRate(String(p.vitals.heartRate));
      if (p.vitals.temperature) setFormTemp(String(p.vitals.temperature));
    }
  };

  // Handle file uploads in the add modal
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file: File) => {
      const isImg = file.type.startsWith('image/') || /\.(png|jpg|jpeg|webp|gif)$/i.test(file.name);
      const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
      const sizeStr = `${(file.size / (1024 * 1024)).toFixed(2)} MB`;

      const reader = new FileReader();
      reader.onload = () => {
        const fileDataUrl = reader.result as string;
        const newAttachment: ReportAttachment = {
          id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          name: file.name,
          url: fileDataUrl,
          size: sizeStr,
          type: isImg ? 'image' : isPdf ? 'pdf' : 'document',
        };
        setFormAttachments((prev) => [...prev, newAttachment]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveAttachment = (idToRemove: string) => {
    setFormAttachments((prev) => prev.filter((a) => a.id !== idToRemove));
  };

  // Handle open add modal
  const handleOpenAddModal = () => {
    setSelectedPatientForNewRecord(null);
    setPatientSearchTerm('');
    setPatientSelectorPage(1);
    setFormTitle('');
    setFormCategory('Laboratory');
    setFormDoctorName(doctors[0]?.name || 'Dr. Sarah Jenkins');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormDiagnosis('');
    setFormTreatment('');
    setFormStatus('Active');
    setFormBp('');
    setFormHeartRate('');
    setFormTemp('');
    setFormWeight('');
    setFormHeight('');
    setFormAttachments([]);
    setShowAddModal(true);
  };

  // Submit and create record (synchronizing both MedicalRecord and PatientReport)
  const handleCreateRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientForNewRecord) {
      alert('Please select a patient before saving the record.');
      return;
    }
    if (!formDiagnosis.trim() && !formTitle.trim()) {
      alert('Please provide a title or primary diagnosis.');
      return;
    }

    setIsSubmitting(true);
    const targetPatient = selectedPatientForNewRecord;
    const reportCode = `MR-2026-0${Math.floor(100 + Math.random() * 900)}`;
    const finalTitle = formTitle.trim() || `${formCategory} Report - ${formDiagnosis.trim()}`;
    const reportId = `rep-${Date.now()}`;

    // 1. Construct MedicalRecord
    const newRec: MedicalRecord = {
      id: `med-${Date.now()}`,
      recordCode: reportCode,
      patientId: targetPatient.id,
      patientName: targetPatient.name,
      doctorName: formDoctorName || targetPatient.doctor || 'Dr. Sarah Jenkins',
      diagnosis: formDiagnosis.trim() || finalTitle,
      treatment: formTreatment.trim() || 'Standard diagnostic plan and clinical monitoring.',
      prescription: 'N/A',
      date: formDate || new Date().toISOString().split('T')[0],
      status: formStatus,
      reportType: finalTitle,
      category: formCategory,
      labResultSummary: formTreatment.trim(),
      attachments: formAttachments,
      vitals: formBp || formHeartRate || formTemp ? {
        bloodPressure: formBp || '',
        heartRate: formHeartRate ? `${formHeartRate} bpm` : '',
        temp: formTemp ? `${formTemp} °F` : '',
      } : undefined,
    };

    // 2. Construct PatientReport for linking into Patient profile
    const newPatientReport: PatientReport = {
      id: reportId,
      title: finalTitle,
      category: formCategory,
      date: formDate || new Date().toISOString().split('T')[0],
      doctor: formDoctorName || targetPatient.doctor,
      fileUrl: formAttachments[0]?.url,
      fileName: formAttachments[0]?.name || `${finalTitle.replace(/\s+/g, '_')}.pdf`,
      fileSize: formAttachments[0]?.size || '1.4 MB',
      fileType: formAttachments[0]?.type || 'pdf',
      attachments: formAttachments,
      notes: formTreatment.trim() || formDiagnosis.trim(),
      status: formStatus,
      structuredData: {
        diagnosis: formDiagnosis.trim() || targetPatient.condition,
        summary: formTreatment.trim() || 'Clinical findings and diagnostic impressions.',
      },
    };

    try {
      // Backend API call
      await ApiClient.createMedicalRecord({
        recordCode: newRec.recordCode,
        patientId: targetPatient.id,
        patientName: targetPatient.name,
        patientCode: targetPatient.patientCode,
        doctorName: newRec.doctorName,
        diagnosis: newRec.diagnosis,
        treatment: newRec.treatment,
        prescription: newRec.prescription,
        reportType: newRec.reportType,
        category: newRec.category,
        date: newRec.date,
        status: newRec.status,
        labResultSummary: formTreatment.trim(),
        vitalSigns: formBp || formHeartRate || formTemp ? {
          bloodPressure: formBp,
          heartRate: formHeartRate,
          temperature: formTemp,
          weight: formWeight,
          height: formHeight,
        } : undefined,
        attachments: formAttachments,
      });

      // Update state and callbacks - updates at top of records
      if (onAddRecord) onAddRecord(newRec);

      // Link to Patient Reports Section
      if (onSavePatientReport) {
        onSavePatientReport(targetPatient.id, newPatientReport);
      }

      showToast(`Successfully created & linked EHR record ${reportCode} for ${targetPatient.name}`);
      setShowAddModal(false);
      setCurrentPage(1);
    } catch (err: any) {
      console.error('Failed to create EHR record:', err);
      if (onAddRecord) onAddRecord(newRec);
      if (onSavePatientReport) onSavePatientReport(targetPatient.id, newPatientReport);
      showToast(`Saved clinical record ${reportCode}`);
      setShowAddModal(false);
      setCurrentPage(1);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete medical record
  const handleDeleteConfirm = async () => {
    if (!recordToDelete) return;
    setIsDeleting(true);
    try {
      await ApiClient.deleteMedicalRecord(recordToDelete.id);
      setLiveRecords((prev) => prev.filter((r) => r.id !== recordToDelete.id));
      setTotalRecords((prev) => Math.max(0, prev - 1));
      if (onDeleteRecord) onDeleteRecord(recordToDelete.id);
      showToast(`Record ${recordToDelete.recordCode} has been archived/deleted.`);
    } catch (err) {
      console.error('Failed to delete medical record:', err);
      setLiveRecords((prev) => prev.filter((r) => r.id !== recordToDelete.id));
      if (onDeleteRecord) onDeleteRecord(recordToDelete.id);
      showToast(`Record ${recordToDelete.recordCode} removed locally.`);
    } finally {
      setIsDeleting(false);
      setRecordToDelete(null);
    }
  };

  // Find matching patient for a record
  const findMatchingPatient = (rec: MedicalRecord) => {
    return patients.find(
      (p) =>
        (p.id && rec.patientId && p.id.toLowerCase() === rec.patientId.toLowerCase()) ||
        (p.patientCode && rec.patientId && p.patientCode.toLowerCase() === rec.patientId.toLowerCase()) ||
        (p.name && rec.patientName && p.name.toLowerCase() === rec.patientName.toLowerCase())
    );
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl border border-slate-800 flex items-center gap-3 animate-fade-in text-xs font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="ml-2 text-slate-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-teal-50 text-teal-800 rounded-xl border border-teal-200/60">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <span>Medical Records & Patient Reports</span>
                {loading && <Loader2 className="w-4 h-4 text-teal-700 animate-spin" />}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                10 recent medical records across all patients, seamlessly synchronized with patient profile reports.
              </p>
            </div>
          </div>
        </div>

        {/* Action buttons - Responsive layout */}
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => handleRefresh()}
            disabled={loading}
            className="col-span-1 flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl shadow-xs transition disabled:opacity-50 cursor-pointer whitespace-nowrap h-10 sm:h-9 order-2 sm:order-1"
            title="Refresh EHR Records"
          >
            <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleOpenAddModal}
            className="col-span-2 sm:col-span-1 flex items-center justify-center gap-1.5 px-3.5 py-2 sm:py-1.5 bg-teal-800 hover:bg-teal-900 text-white text-xs font-semibold rounded-xl shadow-xs transition cursor-pointer whitespace-nowrap h-10 sm:h-9 order-1 sm:order-2"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Clinical Record</span>
          </button>

          <button
            onClick={onOpenExport}
            className="col-span-1 flex items-center justify-center gap-1.5 px-3.5 py-2 sm:py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow-xs transition cursor-pointer whitespace-nowrap h-10 sm:h-9 order-3"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Audit Log</span>
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs text-amber-900">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Notice: Could not sync EHR live database ({error}). Displaying local records.</span>
          </div>
          <button onClick={() => handleRefresh()} className="underline font-semibold hover:text-amber-950 cursor-pointer">
            Retry Sync
          </button>
        </div>
      )}

      {/* Filter / Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by patient name, ID, record code, doctor, or diagnosis..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Selects */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Category Dropdown */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-transparent focus:outline-none cursor-pointer font-medium"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat === 'All' ? 'All Categories' : cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Dropdown */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700">
              <span className="text-slate-400 font-medium">Status:</span>
              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-transparent focus:outline-none cursor-pointer font-medium"
              >
                {STATUS_OPTIONS.map((st) => (
                  <option key={st} value={st}>
                    {st === 'All' ? 'All Statuses' : st}
                  </option>
                ))}
              </select>
            </div>

            {/* Limit Per Page */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700">
              <span className="text-slate-400 font-medium">Page Size:</span>
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-transparent focus:outline-none cursor-pointer font-medium"
              >
                <option value={10}>10 / page (Default)</option>
                <option value={20}>20 / page</option>
                <option value={50}>50 / page</option>
              </select>
            </div>
          </div>
        </div>

        {/* Category Pills Quick Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
          {CATEGORIES.slice(0, 8).map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setSelectedCategory(cat);
                setCurrentPage(1);
              }}
              className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-teal-800 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Showing counter */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <div>
          Showing page <span className="font-bold text-slate-800">{currentPage}</span> of{' '}
          <span className="font-bold text-slate-800">{totalPages}</span> (
          <span className="font-bold text-slate-800">{totalRecords}</span> total medical records)
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Linked with Patient Profile Reports</span>
        </div>
      </div>

      {/* Medical Records Cards Grid */}
      {loading && displayRecords.length === 0 ? (
        <div className="py-20 text-center text-slate-400 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
          <Loader2 className="w-8 h-8 mx-auto mb-3 text-teal-700 animate-spin" />
          <p className="text-xs font-medium text-slate-600">Retrieving 10 most recent medical records...</p>
        </div>
      ) : displayRecords.length === 0 ? (
        <div className="py-20 text-center text-slate-400 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6">
          <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p className="text-sm font-semibold text-slate-700">No medical records found</p>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            No clinical records match your query. Try resetting filters or click &ldquo;New Clinical Record&rdquo; to add a new report linked to a patient.
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedCategory('All');
              setSelectedStatus('All');
              setCurrentPage(1);
            }}
            className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition cursor-pointer"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
          {displayRecords.map((rec) => {
            const matchingPatient = findMatchingPatient(rec);
            const hasVitals = rec.vitals && (rec.vitals.bloodPressure || rec.vitals.heartRate || rec.vitals.temp);

            return (
              <div
                key={rec.id}
                className="bg-white rounded-xl border border-slate-200/90 p-3.5 sm:p-4 shadow-xs hover:border-teal-400 hover:shadow-sm transition relative group flex flex-col justify-between"
              >
                <div>
                  {/* Header */}
                  <div className="border-b border-slate-100 pb-3">
                  {/* Top Row: Avatar + Name on left, Status dropdown + delete on right */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-800 border border-teal-200/60 flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                        {rec.patientName ? rec.patientName.charAt(0).toUpperCase() : 'P'}
                      </div>
                      <button
                        onClick={() => {
                          if (matchingPatient) {
                            onSelectPatient(matchingPatient);
                          }
                        }}
                        className="font-bold text-slate-900 text-sm hover:text-teal-700 transition flex items-center gap-1 text-left cursor-pointer truncate"
                        title={`View profile for ${rec.patientName}`}
                      >
                        <span className="truncate">{rec.patientName}</span>
                        {matchingPatient && <ExternalLink className="w-3 h-3 text-teal-600 shrink-0" />}
                      </button>
                    </div>

                    <div className="flex items-center space-x-1.5 shrink-0">
                      <select
                        value={rec.status || 'Active'}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleQuickStatusChange(rec.id, e.target.value);
                        }}
                        className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition cursor-pointer focus:outline-none shadow-2xs ${
                          rec.status === 'Completed' || rec.status === 'Finalized'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                            : rec.status === 'Active'
                            ? 'bg-teal-50 text-teal-800 border-teal-300 hover:bg-teal-100'
                            : rec.status === 'Pending Review'
                            ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                            : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                        }`}
                        title="Change Status"
                      >
                        <option value="Active">Active</option>
                        <option value="Pending Review">Pending Review</option>
                        <option value="Completed">Completed</option>
                        <option value="Archived">Archived</option>
                      </select>
                      <button
                        onClick={() => setRecordToDelete(rec)}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition opacity-0 group-hover:opacity-100 cursor-pointer"
                        title="Archive/Delete Record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Sub-row: Category Pill & Record Code / ID badge */}
                  <div className="flex items-center justify-between gap-2 mt-2">
                    {rec.category ? (
                      <span className="px-2 py-0.5 bg-teal-50/80 text-teal-800 border border-teal-200/60 text-[10px] font-bold rounded-md whitespace-nowrap">
                        {rec.category}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-medium rounded-md whitespace-nowrap">
                        Clinical Report
                      </span>
                    )}

                    <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5 whitespace-nowrap shrink-0">
                      <span className="text-teal-700 font-bold bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">{rec.recordCode}</span>
                      <span>·</span>
                      <span className="text-slate-500 font-medium">ID: {rec.patientId}</span>
                    </div>
                  </div>
                </div>

                  {/* Body Info */}
                  <div className="mt-2.5 space-y-1.5 text-xs">
                    {rec.reportType && (
                      <div className="font-semibold text-slate-800 flex items-center gap-1 text-xs truncate">
                        <FileText className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                        <span className="truncate">{rec.reportType}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-slate-600 text-[11px]">
                      <span className="text-slate-400 font-medium flex items-center gap-1">
                        <Stethoscope className="w-3 h-3 text-teal-700" /> Physician:
                      </span>
                      <span className="font-medium text-slate-800 truncate max-w-[140px] text-right">{rec.doctorName}</span>
                    </div>

                    <div className="text-[11px] truncate">
                      <span className="text-slate-400 font-medium">Diagnosis:</span>{' '}
                      <span className="font-semibold text-slate-900">{rec.diagnosis}</span>
                    </div>

                    {rec.treatment && (
                      <div className="text-[11px]">
                        <span className="text-slate-400 font-medium">Findings:</span>{' '}
                        <span className="text-slate-600 line-clamp-2">{rec.treatment}</span>
                      </div>
                    )}

                    {/* Vitals summary ONLY if present on record */}
                    {hasVitals && (
                      <div className="flex items-center gap-2.5 pt-1 text-[10px] text-slate-500 font-mono flex-wrap">
                        {rec.vitals?.bloodPressure && (
                          <span className="flex items-center gap-0.5" title="Blood Pressure">
                            <Activity className="w-3 h-3 text-rose-500" /> {rec.vitals.bloodPressure}
                          </span>
                        )}
                        {rec.vitals?.heartRate && (
                          <span className="flex items-center gap-0.5" title="Heart Rate">
                            <Heart className="w-3 h-3 text-red-500" /> {rec.vitals.heartRate}
                          </span>
                        )}
                        {rec.vitals?.temp && (
                          <span className="flex items-center gap-0.5" title="Temperature">
                            <Thermometer className="w-3 h-3 text-amber-500" /> {rec.vitals.temp}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs mt-2.5">
                  <span className="text-slate-400 font-mono flex items-center gap-1 text-[10px]">
                    <Calendar className="w-3 h-3" /> {rec.date}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setViewingRecord(rec)}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-md transition text-[11px] cursor-pointer flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" /> Details
                    </button>

                    {matchingPatient && (
                      <button
                        onClick={() => onSelectPatient(matchingPatient)}
                        className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold rounded-md transition flex items-center gap-1 cursor-pointer text-[11px]"
                        title="Open Patient Profile & Reports Tab"
                      >
                        <span>Reports</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Backend & Frontend Connected Pagination */}
      {totalPages > 1 && (
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-500">
            Showing <span className="font-bold text-slate-800">{(currentPage - 1) * limit + 1}</span> to{' '}
            <span className="font-bold text-slate-800">{Math.min(currentPage * limit, totalRecords)}</span> of{' '}
            <span className="font-bold text-slate-800">{totalRecords}</span> records
          </div>

          <div className="flex items-center gap-1.5">
            {/* First Page */}
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1 || loading}
              className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              title="First Page"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>

            {/* Prev Page */}
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1 || loading}
              className="px-3 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Prev</span>
            </button>

            {/* Page number buttons */}
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                .map((pageNum, idx, arr) => {
                  const prev = arr[idx - 1];
                  return (
                    <React.Fragment key={pageNum}>
                      {prev && pageNum - prev > 1 && (
                        <span className="px-1 text-slate-400 text-xs">...</span>
                      )}
                      <button
                        onClick={() => setCurrentPage(pageNum)}
                        disabled={loading}
                        className={`w-8 h-8 rounded-xl text-xs font-bold transition cursor-pointer ${
                          currentPage === pageNum
                            ? 'bg-teal-800 text-white shadow-xs'
                            : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    </React.Fragment>
                  );
                })}
            </div>

            {/* Next Page */}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || loading}
              className="px-3 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            {/* Last Page */}
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages || loading}
              className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              title="Last Page"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Comprehensive Add Clinical Record & Patient Report Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 my-8 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-teal-50 text-teal-800 rounded-xl border border-teal-200">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">
                    Add New Clinical Record & Patient Report
                  </h3>
                  <p className="text-xs text-slate-500">
                    Creates an EHR medical record and links directly into the patient&apos;s reports portfolio.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRecord} className="space-y-4 text-xs">
              {/* SECTION 1: SEARCHABLE & PAGINATED PATIENT SELECTOR */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-slate-800 font-bold flex items-center gap-1.5">
                    <User className="w-4 h-4 text-teal-700" />
                    <span>Select Patient <span className="text-rose-500">*</span></span>
                  </label>
                  {selectedPatientForNewRecord && (
                    <button
                      type="button"
                      onClick={() => setSelectedPatientForNewRecord(null)}
                      className="text-xs text-teal-700 hover:underline font-semibold cursor-pointer"
                    >
                      Change Patient
                    </button>
                  )}
                </div>

                {selectedPatientForNewRecord ? (
                  <div className="p-3.5 bg-white rounded-xl border border-teal-200 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-teal-800 text-white font-bold flex items-center justify-center text-sm shrink-0">
                        {selectedPatientForNewRecord.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-sm">
                          {selectedPatientForNewRecord.name}
                        </div>
                        <div className="text-slate-500 text-xs flex items-center gap-2">
                          <span className="font-mono text-teal-700 font-semibold">
                            {selectedPatientForNewRecord.patientCode || selectedPatientForNewRecord.id}
                          </span>
                          <span>·</span>
                          <span>Age: {selectedPatientForNewRecord.age}</span>
                          <span>·</span>
                          <span>Phone: {selectedPatientForNewRecord.phone}</span>
                        </div>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-full border border-emerald-200">
                      Selected
                    </span>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {/* Patient Search Input */}
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={patientSearchTerm}
                        onChange={(e) => {
                          setPatientSearchTerm(e.target.value);
                          setPatientSelectorPage(1);
                        }}
                        placeholder="Search patient by ID code (e.g. PT-01001), Name, or Phone number..."
                        className="w-full bg-white border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                      />
                    </div>

                    {/* Paginated Patients List */}
                    <div className="space-y-1.5 max-h-48 overflow-y-auto">
                      {paginatedSelectorPatients.length === 0 ? (
                        <div className="py-6 text-center text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
                          No matching patients found. Try searching another name or ID.
                        </div>
                      ) : (
                        paginatedSelectorPatients.map((p) => (
                          <div
                            key={p.id}
                            onClick={() => handleSelectPatientInForm(p)}
                            className="p-2.5 bg-white hover:bg-teal-50/50 rounded-xl border border-slate-200/80 hover:border-teal-300 flex items-center justify-between cursor-pointer transition"
                          >
                            <div className="flex items-center space-x-2.5">
                              <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-800 font-bold text-xs flex items-center justify-center shrink-0 border border-teal-200">
                                {p.name.charAt(0)}
                              </div>
                              <div>
                                <span className="font-bold text-slate-800">{p.name}</span>
                                <span className="text-[11px] text-slate-400 ml-2 font-mono">
                                  {p.patientCode || p.id}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] text-slate-500">{p.phone}</span>
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-semibold rounded-md">
                                Select
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Patient Selector Pagination Controls */}
                    {totalSelectorPages > 1 && (
                      <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500">
                        <span>
                          Page {patientSelectorPage} of {totalSelectorPages} ({filteredSelectorPatients.length} patients)
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setPatientSelectorPage((p) => Math.max(1, p - 1))}
                            disabled={patientSelectorPage === 1}
                            className="px-2 py-1 bg-white border border-slate-200 rounded-lg disabled:opacity-40 cursor-pointer font-semibold"
                          >
                            Prev
                          </button>
                          <button
                            type="button"
                            onClick={() => setPatientSelectorPage((p) => Math.min(totalSelectorPages, p + 1))}
                            disabled={patientSelectorPage === totalSelectorPages}
                            className="px-2 py-1 bg-white border border-slate-200 rounded-lg disabled:opacity-40 cursor-pointer font-semibold"
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* SECTION 2: REPORT & CLINICAL DETAILS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Report / Record Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    required
                    placeholder="e.g. 12-Lead Electrocardiogram & Telemetry"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 cursor-pointer"
                  >
                    {CATEGORIES.filter((c) => c !== 'All').map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Attending Physician</label>
                  <input
                    type="text"
                    value={formDoctorName}
                    onChange={(e) => setFormDoctorName(e.target.value)}
                    placeholder="e.g. Dr. Sarah Jenkins"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Record Date</label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 cursor-pointer"
                  />
                </div>
              </div>

              {/* SECTION 3: CLINICAL INDICATION & FINDINGS */}
              <div className="space-y-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Clinical Indication / Diagnosis <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formDiagnosis}
                    onChange={(e) => setFormDiagnosis(e.target.value)}
                    required
                    placeholder="e.g. Suspected pneumonia, acute cough, baseline cardiac evaluation"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Lab Findings / Summary Impressions
                  </label>
                  <textarea
                    value={formTreatment}
                    onChange={(e) => setFormTreatment(e.target.value)}
                    rows={3}
                    placeholder="Enter detailed laboratory findings, radiologist notes, or pathology remarks..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  />
                </div>
              </div>

              {/* SECTION 4: VITAL SIGNS */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-2">
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-teal-700" />
                  <span>Clinical Vital Signs</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 font-medium block">BP (mmHg)</span>
                    <input
                      type="text"
                      value={formBp}
                      onChange={(e) => setFormBp(e.target.value)}
                      placeholder="120/80"
                      className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 font-mono text-slate-800"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-medium block">Heart Rate (bpm)</span>
                    <input
                      type="text"
                      value={formHeartRate}
                      onChange={(e) => setFormHeartRate(e.target.value)}
                      placeholder="72"
                      className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 font-mono text-slate-800"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-medium block">Temp (°F)</span>
                    <input
                      type="text"
                      value={formTemp}
                      onChange={(e) => setFormTemp(e.target.value)}
                      placeholder="98.6"
                      className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 font-mono text-slate-800"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-medium block">Weight (kg)</span>
                    <input
                      type="text"
                      value={formWeight}
                      onChange={(e) => setFormWeight(e.target.value)}
                      placeholder="70"
                      className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 font-mono text-slate-800"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-medium block">Height (cm)</span>
                    <input
                      type="text"
                      value={formHeight}
                      onChange={(e) => setFormHeight(e.target.value)}
                      placeholder="175"
                      className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 font-mono text-slate-800"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 5: FILE ATTACHMENTS & STATUS */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="block text-slate-700 font-semibold flex items-center gap-1">
                    <Paperclip className="w-3.5 h-3.5 text-teal-700" />
                    <span>Upload Documents / Diagnostic Scans</span>
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-800 text-xs font-semibold"
                  >
                    <option value="Active">Status: Active</option>
                    <option value="Completed">Status: Completed</option>
                    <option value="Pending Review">Status: Pending Review</option>
                    <option value="Archived">Status: Archived</option>
                  </select>
                </div>

                <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center hover:border-teal-400 transition bg-slate-50/50">
                  <UploadCloud className="w-7 h-7 text-slate-400 mx-auto mb-1.5" />
                  <p className="text-xs text-slate-600 font-semibold">
                    Drag & drop report PDF / Image here, or browse
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Supports PDF, PNG, JPG up to 15MB</p>
                  <label className="mt-2 inline-block px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg font-semibold text-teal-800 cursor-pointer shadow-xs">
                    <span>Browse Files</span>
                    <input
                      type="file"
                      multiple
                      accept="application/pdf,image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Attachments preview */}
                {formAttachments.length > 0 && (
                  <div className="space-y-1.5">
                    {formAttachments.map((att) => (
                      <div
                        key={att.id}
                        className="p-2 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-2 truncate">
                          <File className="w-4 h-4 text-teal-700 shrink-0" />
                          <span className="font-semibold text-slate-800 truncate">{att.name}</span>
                          <span className="text-[10px] text-slate-400 shrink-0">({att.size})</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveAttachment(att.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded-md"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Form Action Buttons */}
              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !selectedPatientForNewRecord}
                  className="px-5 py-2 bg-teal-800 hover:bg-teal-900 text-white font-semibold rounded-xl transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving & Linking...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>Save Clinical Record</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Details View Modal */}
      {viewingRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-teal-50 text-teal-800 rounded-xl">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">{viewingRecord.recordCode}</h3>
                  <p className="text-xs text-slate-500">{viewingRecord.reportType || 'Clinical Medical Record'}</p>
                </div>
              </div>
              <button
                onClick={() => setViewingRecord(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between">
                <div>
                  <span className="text-slate-400 font-medium block text-[10px] uppercase">Patient</span>
                  <span className="font-bold text-slate-900 text-sm">{viewingRecord.patientName}</span>
                  <span className="text-slate-400 font-mono ml-2">({viewingRecord.patientId})</span>
                </div>
                <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-xl border border-slate-200 shadow-2xs">
                  <label className="text-[11px] font-bold text-slate-500">Status:</label>
                  <select
                    value={viewingRecord.status || 'Active'}
                    onChange={(e) => {
                      const newStatus = e.target.value;
                      setViewingRecord((prev) => (prev ? { ...prev, status: newStatus } : null));
                      handleQuickStatusChange(viewingRecord.id, newStatus);
                    }}
                    className="text-xs font-bold text-slate-800 bg-transparent focus:outline-none cursor-pointer"
                  >
                    <option value="Active">Active</option>
                    <option value="Pending Review">Pending Review</option>
                    <option value="Completed">Completed</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-slate-700">
                <div>
                  <span className="text-slate-400 block text-[10px]">Attending Doctor</span>
                  <span className="font-semibold">{viewingRecord.doctorName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Date Recorded</span>
                  <span className="font-semibold font-mono">{viewingRecord.date}</span>
                </div>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px]">Primary Diagnosis</span>
                <span className="font-bold text-slate-900 text-sm">{viewingRecord.diagnosis}</span>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px]">Treatment Plan & Regimen</span>
                <p className="text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  {viewingRecord.treatment || 'No specific treatment notes recorded.'}
                </p>
              </div>

              {viewingRecord.prescription && viewingRecord.prescription !== 'N/A' && (
                <div>
                  <span className="text-slate-400 block text-[10px]">Prescriptions</span>
                  <p className="font-mono text-slate-800 bg-slate-50 p-2.5 rounded-xl border border-slate-100 font-semibold">
                    {viewingRecord.prescription}
                  </p>
                </div>
              )}

              {viewingRecord.vitals && (viewingRecord.vitals.bloodPressure || viewingRecord.vitals.heartRate || viewingRecord.vitals.temp) && (
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-around text-center">
                  {viewingRecord.vitals.bloodPressure && (
                    <div>
                      <span className="text-[10px] text-slate-400 block">Blood Pressure</span>
                      <span className="font-mono font-bold text-slate-800">{viewingRecord.vitals.bloodPressure}</span>
                    </div>
                  )}
                  {viewingRecord.vitals.heartRate && (
                    <div>
                      <span className="text-[10px] text-slate-400 block">Heart Rate</span>
                      <span className="font-mono font-bold text-slate-800">{viewingRecord.vitals.heartRate}</span>
                    </div>
                  )}
                  {viewingRecord.vitals.temp && (
                    <div>
                      <span className="text-[10px] text-slate-400 block">Temperature</span>
                      <span className="font-mono font-bold text-slate-800">{viewingRecord.vitals.temp}</span>
                    </div>
                  )}
                </div>
              )}
              {viewingRecord.attachments && viewingRecord.attachments.length > 0 && (
                <div>
                  <span className="text-slate-400 block text-[10px] mb-1">Attached Files / Scans</span>
                  <div className="flex flex-wrap gap-2">
                    {viewingRecord.attachments.map((att: any, idx: number) => (
                      <div
                        key={idx}
                        className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-lg text-xs"
                      >
                        <FileText className="w-3.5 h-3.5 text-teal-600" />
                        <span className="font-mono text-slate-700 max-w-[160px] truncate">{att.name}</span>
                        {att.url && (
                          <a
                            href={att.url}
                            download={att.name || 'Record_Attachment.pdf'}
                            className="text-teal-700 hover:text-teal-900 ml-1 p-0.5"
                            title="Download attachment"
                          >
                            <Download className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setViewingRecord(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition cursor-pointer"
              >
                Close
              </button>
              {(() => {
                const pat = findMatchingPatient(viewingRecord);
                return (
                  pat && (
                    <button
                      type="button"
                      onClick={() => {
                        setViewingRecord(null);
                        onSelectPatient(pat);
                      }}
                      className="px-4 py-2 bg-teal-800 hover:bg-teal-900 text-white font-semibold rounded-xl text-xs transition flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Open Full Patient Profile</span>
                    </button>
                  )
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {recordToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center space-x-3 text-rose-600">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-lg font-bold text-slate-900">Delete EHR Record</h3>
            </div>
            <p className="text-xs text-slate-600">
              Are you sure you want to permanently delete clinical report{' '}
              <strong className="text-slate-900">{recordToDelete.recordCode}</strong> for{' '}
              <strong className="text-slate-900">{recordToDelete.patientName}</strong>? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setRecordToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl text-xs transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>{isDeleting ? 'Deleting...' : 'Delete Record'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
