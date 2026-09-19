import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  FileText,
  Pill,
  Clock,
  Calendar,
  CreditCard,
  Phone,
  Mail,
  AlertTriangle,
  Heart,
  ShieldAlert,
  Download,
  CheckCircle2,
  AlertCircle,
  Printer,
  ChevronRight,
  ChevronLeft,
  Send,
  Building,
  Plus,
  Edit2,
  Trash2,
  Upload,
  Check,
  Ban,
  DollarSign,
  Camera,
  ArrowLeft,
  MapPin,
  Eye,
  FileCheck,
  File,
  Image as ImageIcon,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Paperclip,
  SlidersHorizontal,
} from 'lucide-react';
import {
  Patient,
  Appointment,
  MedicalRecord,
  Prescription,
  PatientBillingRecord,
  VisitHistoryItem,
  PatientReport,
  ReportAttachment,
} from '../types';
import { generateAndPrintReceipt } from '../utils/receiptGenerator';
import { PdfViewer } from './PdfViewer';

interface PatientDetailModalProps {
  patient: Patient;
  onClose: () => void;
  appointments: Appointment[];
  medicalRecords: MedicalRecord[];
  onOpenMessage?: (staffName: string, staffId: string, role: string) => void;
  onEditPatient?: (patient: Patient) => void;
  onDeletePatient?: (patientId: string) => void;
  onSaveMedicalRecord?: (record: MedicalRecord) => void;
  onSavePatientReport?: (patientId: string, report: PatientReport) => void;
  onSavePatientPrescription?: (patientId: string, prescription: Prescription) => void;
  onSavePatientVisitHistory?: (patientId: string, visit: VisitHistoryItem) => void;
  onSaveAppointment?: (appointment: Appointment) => void;
  onSavePatientBilling?: (patientId: string, invoice: PatientBillingRecord) => void;
  onDeletePatientBilling?: (patientId: string, invoiceId: string, invoiceNumber: string) => void;
  backOrigin?: { type: 'doctor' | 'nurse'; name: string } | null;
  onBack?: () => void;
}

export const PatientDetailModal: React.FC<PatientDetailModalProps> = ({
  patient,
  onClose,
  appointments,
  medicalRecords,
  onOpenMessage,
  onEditPatient,
  onDeletePatient,
  onSaveMedicalRecord,
  onSavePatientReport,
  onSavePatientPrescription,
  onSavePatientVisitHistory,
  onSaveAppointment,
  onSavePatientBilling,
  onDeletePatientBilling,
  backOrigin,
  onBack,
}) => {
  const [activeTab, setActiveTab] = useState<
    'profile' | 'reports' | 'medicines' | 'history' | 'appointments' | 'billing'
  >('profile');

  // Real-time local state synced with props
  const [localPrescriptions, setLocalPrescriptions] = useState<Prescription[]>(
    patient.prescriptions || []
  );
  const [localVisits, setLocalVisits] = useState<VisitHistoryItem[]>(
    patient.medicalHistory || []
  );
  const [localBilling, setLocalBilling] = useState<PatientBillingRecord[]>(
    patient.billingInvoices || []
  );
  const [localReports, setLocalReports] = useState<PatientReport[]>(() => {
    if (patient.reports && patient.reports.length > 0) {
      return patient.reports;
    }
    return medicalRecords
      .filter(
        (r) =>
          (r.patientId && patient.patientCode && r.patientId.toLowerCase() === patient.patientCode.toLowerCase()) ||
          (r.patientId && patient.id && r.patientId.toLowerCase() === patient.id.toLowerCase()) ||
          (r.patientName && patient.name && r.patientName.toLowerCase() === patient.name.toLowerCase())
      )
      .map((r) => ({
        id: r.id,
        title: r.reportType || r.diagnosis || 'Diagnostic Examination',
        category: (r.category || 'Laboratory') as any,
        date: r.date,
        doctor: r.doctorName || patient.doctor,
        fileName: `${(r.reportType || 'Clinical_Report').replace(/\s+/g, '_')}.pdf`,
        fileSize: '1.2 MB',
        fileType: 'pdf' as const,
        notes: r.labResultSummary || r.treatment || 'Evaluated and verified.',
        status: (r.status || 'Active') as any,
        attachments: r.attachments,
        structuredData: {
          diagnosis: r.diagnosis || patient.condition,
          summary: r.labResultSummary || r.treatment || 'Diagnostic findings evaluated by attending physician.',
        },
      }));
  });

  useEffect(() => {
    setLocalPrescriptions(patient.prescriptions || []);
    setLocalVisits(patient.medicalHistory || []);
    setLocalBilling(patient.billingInvoices || []);
    if (patient.reports && patient.reports.length > 0) {
      setLocalReports(patient.reports);
    } else {
      const mapped = medicalRecords
        .filter(
          (r) =>
            (r.patientId && patient.patientCode && r.patientId.toLowerCase() === patient.patientCode.toLowerCase()) ||
            (r.patientId && patient.id && r.patientId.toLowerCase() === patient.id.toLowerCase()) ||
            (r.patientName && patient.name && r.patientName.toLowerCase() === patient.name.toLowerCase())
        )
        .map((r) => ({
          id: r.id,
          title: r.reportType || r.diagnosis || 'Diagnostic Examination',
          category: (r.category || 'Laboratory') as any,
          date: r.date,
          doctor: r.doctorName || patient.doctor,
          fileName: `${(r.reportType || 'Clinical_Report').replace(/\s+/g, '_')}.pdf`,
          fileSize: '1.2 MB',
          fileType: 'pdf' as const,
          notes: r.labResultSummary || r.treatment || 'Evaluated and verified.',
          status: (r.status || 'Active') as any,
          attachments: r.attachments,
          structuredData: {
            diagnosis: r.diagnosis || patient.condition,
            summary: r.labResultSummary || r.treatment || 'Diagnostic findings evaluated by attending physician.',
          },
        }));
      if (mapped.length > 0) {
        setLocalReports(mapped);
      }
    }
  }, [patient, medicalRecords]);

  // Modals inside sub-sections
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Sub-section 1: Reports Modal state & preview state
  const [showAddReportModal, setShowAddReportModal] = useState(false);
  const [editingReport, setEditingReport] = useState<PatientReport | null>(null);
  const [reportTitle, setReportTitle] = useState('');
  const [reportCategory, setReportCategory] = useState<PatientReport['category']>('Laboratory');
  const [reportDoctor, setReportDoctor] = useState(patient.doctor);
  const [reportDiagnosis, setReportDiagnosis] = useState(patient.condition);
  const [reportSummary, setReportSummary] = useState('');
  const [reportStatus, setReportStatus] = useState<'Active' | 'Archived' | 'Pending Review' | 'Finalized' | 'Completed'>('Active');
  const [reportFileUrl, setReportFileUrl] = useState('');
  const [reportFileName, setReportFileName] = useState('');
  const [reportFileSize, setReportFileSize] = useState('');
  const [reportAttachments, setReportAttachments] = useState<ReportAttachment[]>([]);
  
  // Preview modal online viewer state
  const [previewingReport, setPreviewingReport] = useState<PatientReport | null>(null);
  const [previewActiveTab, setPreviewActiveTab] = useState<string>('document');
  const [previewZoom, setPreviewZoom] = useState<number>(100);
  const [previewFullScreen, setPreviewFullScreen] = useState<boolean>(false);
  const [statusUpdateSuccess, setStatusUpdateSuccess] = useState<boolean>(false);

  // Sub-section 2: Prescription Modal state
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [editingPrescription, setEditingPrescription] = useState<Prescription | null>(null);
  const [rxName, setRxName] = useState('');
  const [rxDosage, setRxDosage] = useState('');
  const [rxFrequency, setRxFrequency] = useState('Once Daily');
  const [rxDuration, setRxDuration] = useState('7 Days');
  const [rxDoctor, setRxDoctor] = useState(patient.doctor);
  const [rxStatus, setRxStatus] = useState<'Active' | 'Completed' | 'Discontinued'>('Active');
  const [rxInstructions, setRxInstructions] = useState('');
  const [rxOutcome, setRxOutcome] = useState('');

  // Sub-section 3: Visit History Modal state
  const [showVisitModal, setShowVisitModal] = useState(false);
  const [visitType, setVisitType] = useState<'Outpatient' | 'Admission' | 'Emergency' | 'Follow-up'>('Follow-up');
  const [visitDoctor, setVisitDoctor] = useState(patient.doctor);
  const [visitDept, setVisitDept] = useState(patient.department);
  const [visitDiagnosis, setVisitDiagnosis] = useState(patient.condition);
  const [visitNotes, setVisitNotes] = useState('');

  // Sub-section 4: Appointment Modal state
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [editingApt, setEditingApt] = useState<Appointment | null>(null);
  const [aptDate, setAptDate] = useState(new Date().toISOString().split('T')[0]);
  const [aptTime, setAptTime] = useState('10:00 AM');
  const [aptDoctor, setAptDoctor] = useState(patient.doctor || 'Dr. Alex Morgan');
  const [aptDept, setAptDept] = useState(patient.department || 'Cardiology');
  const [aptType, setAptType] = useState<Appointment['type']>('Check-up');
  const [aptStatus, setAptStatus] = useState<Appointment['status']>('Pending');
  const [aptNotes, setAptNotes] = useState('');

  // Sub-section 5: Billing Modal state
  const [showBillingModal, setShowBillingModal] = useState(false);
  const [editingBilling, setEditingBilling] = useState<PatientBillingRecord | null>(null);
  const [invDesc, setInvDesc] = useState('');
  const [invTotal, setInvTotal] = useState<number>(250);
  const [invPaid, setInvPaid] = useState<number>(250);
  const [invStatus, setInvStatus] = useState<'Paid' | 'Pending' | 'Partial' | 'Insurance Claim'>('Paid');
  const [invInsurance, setInvInsurance] = useState('Medicare / Self');
  const [invMethod, setInvMethod] = useState('Credit Card');
  const [invPartialReason, setInvPartialReason] = useState('');
  const [invNextPaymentDate, setInvNextPaymentDate] = useState('');

  // Filter linked records
  const linkedRecords = medicalRecords.filter(
    (r) =>
      (r.patientId && patient.patientCode && r.patientId.toLowerCase() === patient.patientCode.toLowerCase()) ||
      (r.patientName && patient.name && r.patientName.toLowerCase() === patient.name.toLowerCase())
  );

  // Filter & sync linked appointments for this patient
  const [localAppointments, setLocalAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    const linked = (appointments || []).filter((apt) => {
      if (!apt) return false;
      const aptPatId = apt.patientId ? String(apt.patientId).toLowerCase().trim() : '';
      const patCode = patient.patientCode ? String(patient.patientCode).toLowerCase().trim() : '';
      const patId = patient.id ? String(patient.id).toLowerCase().trim() : '';
      const aptPatName = apt.patientName ? String(apt.patientName).toLowerCase().trim() : '';
      const patName = patient.name ? String(patient.name).toLowerCase().trim() : '';

      return Boolean(
        (aptPatId && patCode && aptPatId === patCode) ||
        (aptPatId && patId && aptPatId === patId) ||
        (aptPatName && patName && aptPatName === patName)
      );
    });
    setLocalAppointments(linked);
  }, [appointments, patient]);

  const patientAppointments = localAppointments;

  // Billing totals
  const totalBilled = localBilling.reduce((acc, inv) => acc + (Number(inv.totalAmount) || 0), 0);
  const totalPaid = localBilling.reduce((acc, inv) => acc + (Number(inv.paidAmount) || 0), 0);
  const totalDue = Math.max(0, totalBilled - totalPaid);

  // Handlers for Reports
  const handleOpenAddReportModal = () => {
    setEditingReport(null);
    setReportTitle('');
    setReportCategory('Laboratory');
    setReportDoctor(patient.doctor);
    setReportDiagnosis(patient.condition);
    setReportSummary('');
    setReportStatus('Active');
    setReportFileUrl('');
    setReportFileName('');
    setReportFileSize('');
    setReportAttachments([]);
    setShowAddReportModal(true);
  };

  const handleOpenEditReportModal = (rep: PatientReport) => {
    setEditingReport(rep);
    setReportTitle(rep.title);
    setReportCategory(rep.category || 'Laboratory');
    setReportDoctor(rep.doctor || rep.doctorName || patient.doctor);
    setReportDiagnosis(rep.diagnosis || rep.structuredData?.diagnosis || patient.condition);
    setReportSummary(rep.notes || rep.summary || rep.structuredData?.summary || '');
    setReportStatus((rep.status as any) || 'Active');
    setReportFileUrl(rep.fileUrl || '');
    setReportFileName(rep.fileName || '');
    setReportFileSize(typeof rep.fileSize === 'string' ? rep.fileSize : '1.4 MB');
    
    // Normalize existing attachments
    const existingAtts: ReportAttachment[] = rep.attachments && rep.attachments.length > 0
      ? rep.attachments
      : rep.fileUrl
      ? [{
          id: 'att-1',
          name: rep.fileName || 'Attached_Report_File',
          url: rep.fileUrl,
          size: typeof rep.fileSize === 'string' ? rep.fileSize : '1.4 MB',
          type: rep.fileType || (rep.fileName?.toLowerCase().endsWith('.png') || rep.fileName?.toLowerCase().endsWith('.jpg') || rep.fileName?.toLowerCase().endsWith('.jpeg') ? 'image' : 'pdf'),
        }]
      : [];
    setReportAttachments(existingAtts);
    setShowAddReportModal(true);
  };

  const handleQuickUpdateReportStatus = (reportId: string, newStatus: string) => {
    const currentRep = localReports.find((r) => r.id === reportId);
    const updatedItem: PatientReport = currentRep
      ? { ...currentRep, status: newStatus }
      : {
          id: reportId,
          title: 'Diagnostic Report',
          date: new Date().toISOString().split('T')[0],
          status: newStatus,
        };

    setLocalReports((prev) =>
      prev.map((r) => (r.id === reportId ? { ...r, status: newStatus } : r))
    );

    if (previewingReport && previewingReport.id === reportId) {
      setPreviewingReport((prev) => (prev ? { ...prev, status: newStatus } : null));
      setStatusUpdateSuccess(true);
      setTimeout(() => setStatusUpdateSuccess(false), 2000);
    }

    if (onSavePatientReport) {
      onSavePatientReport(patient.id, updatedItem);
    }
  };

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
          id: `att-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          name: file.name,
          url: fileDataUrl,
          size: sizeStr,
          type: isImg ? 'image' : isPdf ? 'pdf' : 'document',
        };

        setReportAttachments((prev) => [...prev, newAttachment]);

        // Default primary fileUrl if not set
        setReportFileUrl((prev) => prev || fileDataUrl);
        setReportFileName((prev) => prev || file.name);
        setReportFileSize((prev) => prev || sizeStr);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveAttachment = (indexToRemove: number) => {
    setReportAttachments((prev) => {
      const updated = prev.filter((_, idx) => idx !== indexToRemove);
      if (updated.length > 0) {
        setReportFileUrl(updated[0].url);
        setReportFileName(updated[0].name);
        setReportFileSize(updated[0].size || '1.4 MB');
      } else {
        setReportFileUrl('');
        setReportFileName('');
        setReportFileSize('');
      }
      return updated;
    });
  };

  const handleSaveReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportTitle.trim()) return;

    const targetId = editingReport ? editingReport.id : `rep-${Date.now()}`;
    const finalAttachments: ReportAttachment[] = reportAttachments.length > 0
      ? reportAttachments
      : reportFileUrl
      ? [{
          id: `att-${Date.now()}`,
          name: reportFileName || `${reportTitle.replace(/\s+/g, '_')}_Document.pdf`,
          url: reportFileUrl,
          size: reportFileSize || '1.4 MB',
          type: reportFileName.toLowerCase().endsWith('.png') || reportFileName.toLowerCase().endsWith('.jpg') || reportFileName.toLowerCase().endsWith('.jpeg') ? 'image' : 'pdf',
        }]
      : [];

    const primaryUrl = finalAttachments[0]?.url || reportFileUrl || undefined;
    const primaryName = finalAttachments[0]?.name || reportFileName || `${reportTitle.replace(/\s+/g, '_')}_Report.pdf`;
    const primarySize = finalAttachments[0]?.size || reportFileSize || '1.4 MB';
    const primaryType = finalAttachments[0]?.type || (primaryName.toLowerCase().endsWith('.png') || primaryName.toLowerCase().endsWith('.jpg') ? 'image' : 'pdf');

    const reportItem: PatientReport = {
      id: targetId,
      title: reportTitle.trim(),
      category: reportCategory,
      date: editingReport?.date || new Date().toISOString().split('T')[0],
      doctor: reportDoctor || patient.doctor,
      fileUrl: primaryUrl,
      fileName: primaryName,
      fileSize: primarySize,
      fileType: primaryType,
      attachments: finalAttachments,
      notes: reportSummary || reportDiagnosis,
      status: reportStatus,
      structuredData: {
        diagnosis: reportDiagnosis || patient.condition,
        summary: reportSummary || 'Diagnostic evaluation completed and verified by attending physician.',
      },
    };

    setLocalReports((prev) => {
      const exists = prev.some((r) => r.id === targetId);
      if (exists) {
        return prev.map((r) => (r.id === targetId ? reportItem : r));
      }
      return [reportItem, ...prev];
    });

    if (previewingReport && previewingReport.id === targetId) {
      setPreviewingReport(reportItem);
    }

    if (onSavePatientReport) {
      onSavePatientReport(patient.id, reportItem);
    }

    setShowAddReportModal(false);
    setEditingReport(null);
    setReportTitle('');
    setReportSummary('');
    setReportFileUrl('');
    setReportFileName('');
    setReportFileSize('');
    setReportAttachments([]);
  };

  const handleDownloadAttachment = (att: ReportAttachment) => {
    if (!att.url) return;
    const a = document.createElement('a');
    a.href = att.url;
    a.download = att.name || 'Medical_Attachment';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleOpenReportPreview = (rep: PatientReport) => {
    setPreviewingReport(rep);
    setPreviewZoom(100);
    setPreviewFullScreen(false);
    const hasAttachments = (rep.attachments && rep.attachments.length > 0) || rep.fileUrl;
    if (hasAttachments) {
      setPreviewActiveTab('attachment-0');
    } else {
      setPreviewActiveTab('document');
    }
  };

  const handleDownloadReport = (rep: any) => {
    if (rep.fileUrl && (rep.fileUrl.startsWith('data:') || rep.fileUrl.startsWith('http') || rep.fileUrl.startsWith('blob:'))) {
      const a = document.createElement('a');
      a.href = rep.fileUrl;
      a.download = rep.fileName || `${rep.title || 'Diagnostic_Report'}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }

    const reportHtml = `
<!DOCTYPE html>
<html>
<head>
  <title>Diagnostic Report - ${rep.title || rep.reportType || 'Lab Result'}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #1e293b; }
    .header { border-bottom: 2px solid #0f766e; padding-bottom: 15px; margin-bottom: 20px; display: flex; justify-content: space-between; }
    .brand { font-size: 20px; font-weight: 800; color: #0f766e; }
    .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; background: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 20px; font-size: 13px; }
    .findings { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; margin-bottom: 20px; line-height: 1.6; }
    .footer { border-top: 1px solid #e2e8f0; padding-top: 15px; margin-top: 30px; font-size: 11px; color: #64748b; display: flex; justify-content: space-between; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">PULSE CARE HOSPITAL & MEDICAL CENTER</div>
      <div style="font-size: 12px; color: #64748b;">Department of Clinical Diagnostics & Pathology</div>
    </div>
    <div style="text-align: right; font-size: 12px;">
      <div><strong>Record:</strong> ${rep.recordCode || rep.id}</div>
      <div><strong>Date:</strong> ${rep.date}</div>
    </div>
  </div>
  <div class="meta">
    <div>
      <p><strong>Patient Name:</strong> ${patient.name}</p>
      <p><strong>Patient Code:</strong> ${patient.patientCode}</p>
      <p><strong>Age / Gender:</strong> ${patient.age} Yrs / ${patient.gender}</p>
    </div>
    <div>
      <p><strong>Evaluating Doctor:</strong> ${rep.doctor || rep.doctorName || patient.doctor}</p>
      <p><strong>Department:</strong> ${patient.department}</p>
      <p><strong>Status:</strong> ${rep.status}</p>
    </div>
  </div>
  <div class="findings">
    <h3 style="color: #0f766e; margin-bottom: 8px;">Test / Evaluation: ${rep.title || rep.reportType || rep.diagnosis}</h3>
    <p><strong>Clinical Indication / Diagnosis:</strong> ${rep.diagnosis || rep.structuredData?.diagnosis || patient.condition}</p>
    <p style="margin-top: 10px;"><strong>Laboratory Impressions & Findings:</strong></p>
    <div style="background: #f1f5f9; padding: 12px; border-radius: 6px; margin-top: 6px; font-family: monospace; font-size: 12px;">
      ${rep.notes || rep.labResultSummary || rep.treatment || rep.structuredData?.summary || 'Standard diagnostic panels within clinical range.'}
    </div>
  </div>
  <div class="footer">
    <div>Verified Electronic Health Record • Pulse Care System</div>
    <div>Electronically Signed by: ${rep.doctor || rep.doctorName || patient.doctor}</div>
  </div>
  <script>window.onload = function() { window.print(); };</script>
</body>
</html>`;

    const printWin = window.open('', '_blank');
    if (printWin) {
      printWin.document.open();
      printWin.document.write(reportHtml);
      printWin.document.close();
    } else {
      const blob = new Blob([reportHtml], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Report_${rep.title || 'Diagnostic'}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleOpenRxModal = (rx?: Prescription) => {
    if (rx) {
      setEditingPrescription(rx);
      setRxName(rx.medicineName);
      setRxDosage(rx.dosage);
      setRxFrequency(rx.frequency);
      setRxDuration(rx.duration);
      setRxDoctor(rx.prescribedBy || patient.doctor);
      setRxStatus(rx.status);
      setRxInstructions(rx.instructions || '');
      setRxOutcome(rx.outcomeResult || '');
    } else {
      setEditingPrescription(null);
      setRxName('');
      setRxDosage('500 mg');
      setRxFrequency('Twice Daily');
      setRxDuration('7 Days');
      setRxDoctor(patient.doctor);
      setRxStatus('Active');
      setRxInstructions('Take after meals with water');
      setRxOutcome('');
    }
    setShowPrescriptionModal(true);
  };

  const handleSaveRxSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rxName.trim()) return;

    const rxItem: Prescription = {
      id: editingPrescription ? editingPrescription.id : `rx-${Date.now()}`,
      medicineName: rxName.trim(),
      dosage: rxDosage.trim(),
      frequency: rxFrequency.trim(),
      duration: rxDuration.trim(),
      prescribedBy: rxDoctor.trim() || patient.doctor,
      startDate: editingPrescription?.startDate || new Date().toISOString().split('T')[0],
      endDate: editingPrescription?.endDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      status: rxStatus,
      instructions: rxInstructions.trim() || undefined,
      outcomeResult: rxOutcome.trim() || undefined,
    };

    setLocalPrescriptions((prev) =>
      editingPrescription ? prev.map((p) => (p.id === editingPrescription.id ? rxItem : p)) : [rxItem, ...prev]
    );

    if (onSavePatientPrescription) {
      onSavePatientPrescription(patient.id, rxItem);
    }
    setShowPrescriptionModal(false);
  };

  const handleSaveVisitSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const visitItem: VisitHistoryItem = {
      id: `vis-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      visitType,
      doctorName: visitDoctor || patient.doctor,
      department: visitDept || patient.department,
      diagnosis: visitDiagnosis || patient.condition,
      notes: visitNotes.trim() || 'Patient presented for clinical review and progress evaluation.',
    };

    setLocalVisits((prev) => [visitItem, ...prev]);

    if (onSavePatientVisitHistory) {
      onSavePatientVisitHistory(patient.id, visitItem);
    }
    setShowVisitModal(false);
    setVisitNotes('');
  };

  const handleOpenAptModal = (apt?: Appointment) => {
    if (apt) {
      setEditingApt(apt);
      setAptDate(apt.date);
      setAptTime(apt.time);
      setAptDoctor(apt.doctorName || patient.doctor || 'Dr. Alex Morgan');
      setAptDept(apt.department || patient.department || 'Cardiology');
      setAptType(apt.type || 'Check-up');
      setAptStatus(apt.status || 'Pending');
      setAptNotes(apt.notes || '');
    } else {
      setEditingApt(null);
      setAptDate(new Date().toISOString().split('T')[0]);
      setAptTime('10:30 AM');
      setAptDoctor(patient.doctor || 'Dr. Alex Morgan');
      setAptDept(patient.department || 'Cardiology');
      setAptType('Check-up');
      setAptStatus('Pending');
      setAptNotes('');
    }
    setShowAppointmentModal(true);
  };

  const handleSaveAptSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const patientInitials =
      patient.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2) || 'PT';

    const aptItem: Appointment = {
      id: editingApt ? editingApt.id : `apt-${Date.now()}`,
      time: aptTime,
      date: aptDate,
      patientName: patient.name,
      patientInitials,
      patientId: patient.patientCode || patient.id || `PT-${Math.floor(1000 + Math.random() * 9000)}`,
      doctorName: aptDoctor || patient.doctor || 'Dr. Alex Morgan',
      department: aptDept || patient.department || 'Cardiology',
      type: aptType,
      status: aptStatus,
      notes: aptNotes.trim(),
    };

    setLocalAppointments((prev) => {
      const exists = prev.some((a) => a.id === aptItem.id);
      if (exists) {
        return prev.map((a) => (a.id === aptItem.id ? aptItem : a));
      }
      return [aptItem, ...prev];
    });

    if (onSaveAppointment) {
      onSaveAppointment(aptItem);
    }
    setShowAppointmentModal(false);
  };

  const handleQuickUpdateAppointmentStatus = (aptId: string, newStatus: Appointment['status']) => {
    let updatedApt: Appointment | undefined;
    setLocalAppointments((prev) =>
      prev.map((a) => {
        if (a.id === aptId) {
          updatedApt = { ...a, status: newStatus };
          return updatedApt;
        }
        return a;
      })
    );
    if (updatedApt && onSaveAppointment) {
      onSaveAppointment(updatedApt);
    }
  };

  const handleDeleteAppointmentItem = (aptId: string) => {
    const targetApt = localAppointments.find((a) => a.id === aptId);
    setLocalAppointments((prev) => prev.filter((a) => a.id !== aptId));
    if (targetApt && onSaveAppointment) {
      onSaveAppointment({ ...targetApt, status: 'Cancelled' });
    }
  };

  const handleOpenBillingModal = (inv?: PatientBillingRecord) => {
    if (inv) {
      setEditingBilling(inv);
      setInvDesc(inv.description);
      setInvTotal(inv.totalAmount);
      setInvPaid(inv.paidAmount);
      setInvStatus(inv.status);
      setInvInsurance(inv.insuranceProvider || 'Medicare / Self');
      setInvMethod(inv.paymentMethod || 'Credit Card');
      setInvPartialReason(inv.partialReason || '');
      setInvNextPaymentDate(inv.nextPaymentDate || '');
    } else {
      setEditingBilling(null);
      setInvDesc('Outpatient Consultation & Diagnostic Testing');
      setInvTotal(350);
      setInvPaid(200);
      setInvStatus('Partial');
      setInvInsurance('Standard Insurance');
      setInvMethod('Credit Card');
      setInvPartialReason('Initial deductible co-pay; remaining balance pending');
      setInvNextPaymentDate(new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]);
    }
    setShowBillingModal(true);
  };

  const handleSaveBillingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!invDesc.trim()) return;

    const numTotal = Math.max(0, Number(invTotal) || 0);
    const numPaid = Math.max(0, Number(invPaid) || 0);

    // Auto-compute or resolve the accurate payment status
    let finalStatus: 'Paid' | 'Pending' | 'Partial' | 'Insurance Claim' = invStatus;
    if (numTotal > 0 && numPaid >= numTotal) {
      finalStatus = 'Paid';
    } else if (numPaid > 0 && numPaid < numTotal) {
      if (invStatus === 'Paid' || invStatus === 'Pending') {
        finalStatus = 'Partial';
      }
    } else if (numPaid === 0 && invStatus === 'Paid') {
      finalStatus = 'Pending';
    }

    const targetId = editingBilling ? editingBilling.id : `inv-${Date.now()}`;
    const targetInvoiceNumber = editingBilling?.invoiceNumber || `INV-${Math.floor(2026000 + Math.random() * 9000)}`;

    const billingItem: PatientBillingRecord = {
      id: targetId,
      invoiceNumber: targetInvoiceNumber,
      date: editingBilling?.date || new Date().toISOString().split('T')[0],
      description: invDesc.trim(),
      totalAmount: numTotal,
      paidAmount: numPaid,
      status: finalStatus,
      insuranceProvider: invInsurance,
      paymentMethod: invMethod,
      partialReason: finalStatus === 'Partial' ? (invPartialReason.trim() || 'Co-pay installment recorded, balance pending') : undefined,
      nextPaymentDate: finalStatus === 'Partial' ? invNextPaymentDate : undefined,
    };

    setLocalBilling((prev) => {
      const exists = prev.some((b) => b.id === targetId || b.invoiceNumber === targetInvoiceNumber || (editingBilling && b.id === editingBilling.id));
      if (exists) {
        return prev.map((b) =>
          b.id === targetId || b.invoiceNumber === targetInvoiceNumber || (editingBilling && b.id === editingBilling.id)
            ? billingItem
            : b
        );
      }
      return [billingItem, ...prev];
    });

    if (onSavePatientBilling) {
      onSavePatientBilling(patient.id, billingItem);
    }
    setShowBillingModal(false);
  };

  const handleDeleteBillingItem = (invoiceId: string, invoiceNumber: string) => {
    setLocalBilling((prev) => prev.filter((b) => b.id !== invoiceId && b.invoiceNumber !== invoiceNumber));
    if (onDeletePatientBilling) {
      onDeletePatientBilling(patient.id, invoiceId, invoiceNumber);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[70] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 md:p-6"
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[90vh] max-h-[850px] flex flex-col overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200 cursor-default"
      >
        {/* Back Navigation Bar when opened from Doctor / Nurse */}
        {backOrigin && (
          <div className="bg-slate-950 px-3.5 sm:px-5 py-2.5 border-b border-slate-800 flex items-center justify-between gap-2 text-xs shrink-0">
            <button
              type="button"
              onClick={() => {
                if (onBack) onBack();
                else onClose();
              }}
              className="inline-flex items-center gap-1.5 text-teal-200 hover:text-white font-bold bg-teal-800/60 hover:bg-teal-700/80 px-3 py-1.5 rounded-xl border border-teal-500/40 shadow-xs transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-teal-300 shrink-0" />
              <span>
                Back to {backOrigin.type === 'doctor' ? (backOrigin.name.toLowerCase().startsWith('dr.') ? backOrigin.name : `Dr. ${backOrigin.name}`) : backOrigin.name}
              </span>
            </button>
            <span className="text-[11px] text-teal-300/80 font-medium hidden sm:inline truncate">
              Assigned Patient Record under {backOrigin.name}
            </span>
          </div>
        )}
        
        {/* Header Bar */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="relative">
              <img
                src={
                  patient.avatar ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    patient.name
                  )}&background=0D9488&color=fff&size=128`
                }
                alt={patient.name}
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl object-cover border-2 border-teal-500/40 shadow-md shrink-0"
              />
              <span
                className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-slate-900 ${
                  patient.status === 'Admitted'
                    ? 'bg-amber-500'
                    : patient.status === 'Emergency'
                    ? 'bg-red-500'
                    : patient.status === 'Outpatient'
                    ? 'bg-teal-500'
                    : 'bg-slate-400'
                }`}
              />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white">
                  {patient.name}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-800 text-teal-300 border border-teal-500/30">
                  {patient.patientCode}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                    patient.status === 'Admitted'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : patient.status === 'Emergency'
                      ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                      : patient.status === 'Outpatient'
                      ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                      : 'bg-slate-700 text-slate-300'
                  }`}
                >
                  {patient.status}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 flex items-center gap-2.5 flex-wrap">
                <span>{patient.age} Yrs, {patient.gender}</span>
                <span>•</span>
                <span className="flex items-center gap-1 text-red-400 font-medium">
                  <Heart className="w-3.5 h-3.5 fill-current" /> Blood: {patient.bloodType}
                </span>
                <span>•</span>
                <span>{patient.department} ({patient.room})</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            {onEditPatient && (
              <button
                onClick={() => onEditPatient(patient)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-teal-300 border border-teal-500/30 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 shadow-xs"
              >
                <Edit2 className="w-3.5 h-3.5" />
                Edit Details
              </button>
            )}
            {onDeletePatient && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-3 py-1.5 bg-rose-900/60 hover:bg-rose-900 text-rose-200 border border-rose-500/40 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 shadow-xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </button>
            )}
            {onOpenMessage && (
              <button
                onClick={() =>
                  onOpenMessage(patient.doctor, 'doc-1', 'Attending Physician')
                }
                className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold rounded-lg transition flex items-center gap-1.5 shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                Message Doctor
              </button>
            )}
            <button
              id="close-patient-profile-btn"
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="p-2 text-slate-300 hover:text-white rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 transition cursor-pointer shrink-0"
              aria-label="Close Patient Profile"
              title="Close Profile"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Responsive Horizontal Tabs Bar */}
        <div className="border-b border-slate-200 bg-slate-100/80 px-3 sm:px-6 shrink-0 relative flex items-center">
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto overflow-y-hidden py-1.5 w-full scrollbar-thin scrollbar-thumb-teal-400 scrollbar-track-transparent">
            {[
              { id: 'profile', label: 'Overview', icon: User },
              { id: 'reports', label: `Reports (${localReports.length})`, icon: FileText },
              { id: 'medicines', label: `Prescriptions (${localPrescriptions.length})`, icon: Pill },
              { id: 'history', label: `Visiting History (${localVisits.length})`, icon: Clock },
              { id: 'appointments', label: `Appointments (${patientAppointments.length})`, icon: Calendar },
              { id: 'billing', label: `Payments & Bills (${localBilling.length})`, icon: CreditCard },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-2 px-3 sm:px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition whitespace-nowrap shrink-0 rounded-t-lg ${
                    isActive
                      ? 'border-teal-700 text-teal-900 bg-white shadow-xs'
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-teal-700' : 'text-slate-400'}`} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Modal Tab Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-50/50">
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              {/* Patient Core Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
                  <span className="text-xs text-slate-500 font-medium">Attending Doctor</span>
                  <p className="text-sm font-semibold text-slate-800 mt-1">{patient.doctor}</p>
                  <p className="text-xs text-teal-700 mt-0.5">{patient.department}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
                  <span className="text-xs text-slate-500 font-medium">Room / Bed Assignment</span>
                  <p className="text-sm font-semibold text-slate-800 mt-1">{patient.room}</p>
                  <p className="text-xs text-slate-500 mt-0.5">Admitted: {patient.admissionDate}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
                  <span className="text-xs text-slate-500 font-medium">Primary Condition</span>
                  <p className="text-sm font-semibold text-amber-700 mt-1">{patient.condition}</p>
                  <p className="text-xs text-slate-500 mt-0.5">Active Monitoring</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
                  <span className="text-xs text-slate-500 font-medium">Blood Group</span>
                  <p className="text-lg font-bold text-red-600 mt-0.5 flex items-center gap-1">
                    <Heart className="w-4 h-4 fill-current text-red-500" />
                    {patient.bloodType}
                  </p>
                </div>
              </div>

              {/* Contact & Emergency Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <User className="w-4 h-4 text-teal-600" /> Patient Contact Details
                  </h3>
                  <div className="space-y-3 text-xs sm:text-sm">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <span className="text-slate-500 flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400" /> Phone Number
                      </span>
                      <span className="font-semibold text-slate-800">{patient.phone}</span>
                    </div>
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <span className="text-slate-500 flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-slate-400" /> Email Address
                      </span>
                      <span className="font-semibold text-slate-800">{patient.email}</span>
                    </div>
                    <div className="flex items-start justify-between gap-3 pb-2 border-b border-slate-100">
                      <span className="text-slate-500 flex items-center gap-2 shrink-0 pt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" /> Residential Address
                      </span>
                      <span className="font-semibold text-slate-800 text-right break-words whitespace-normal max-w-[65%]" title={patient.address || '742 Evergreen Health Terrace, Springfield'}>
                        {patient.address || '742 Evergreen Health Terrace, Springfield'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 flex items-center gap-2">
                        <Building className="w-3.5 h-3.5 text-slate-400" /> Department
                      </span>
                      <span className="font-semibold text-slate-800">{patient.department}</span>
                    </div>
                  </div>
                </div>

                {/* Emergency Contact & Allergies */}
                <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600" /> Emergency Contact & Alerts
                  </h3>
                  <div className="bg-amber-50/60 p-3.5 rounded-lg border border-amber-200/80 space-y-1">
                    <p className="text-xs font-semibold text-amber-900">
                      Contact: {patient.emergencyContact?.name || 'Not Provided'} ({patient.emergencyContact?.relation || 'N/A'})
                    </p>
                    <p className="text-xs text-amber-800 flex items-center gap-1">
                      <Phone className="w-3 h-3" /> {patient.emergencyContact?.phone || 'N/A'}
                    </p>
                  </div>

                  <div>
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1 mb-2">
                      <ShieldAlert className="w-3.5 h-3.5 text-red-500" /> Known Allergies
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {patient.allergies && patient.allergies.length > 0 ? (
                        patient.allergies.map((allergy, i) => (
                          <span
                            key={i}
                            className="px-2.5 py-1 bg-red-50 text-red-700 border border-red-200 text-xs font-medium rounded-md"
                          >
                            ⚠️ {allergy}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-500">No known drug allergies reported.</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: REPORTS */}
          {activeTab === 'reports' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Diagnostic Reports & Medical Records ({localReports.length})
                  </h3>
                  <p className="text-xs text-slate-500">View lab results, attached radiology scans online, download official PDFs, or edit statuses.</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleOpenAddReportModal}
                    className="px-3.5 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-xs"
                  >
                    <Upload className="w-3.5 h-3.5" /> Upload / Add Report
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-xl transition flex items-center gap-1.5"
                  >
                    <Printer className="w-3.5 h-3.5" /> Print All
                  </button>
                </div>
              </div>

              {localReports.length === 0 ? (
                <div className="bg-white p-8 text-center rounded-xl border border-slate-200">
                  <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-slate-600 font-medium text-sm">No diagnostic reports uploaded yet.</p>
                  <p className="text-slate-400 text-xs mt-1">Click "Upload / Add Report" above to attach lab results or clinical scans.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Uploaded Patient Reports */}
                  {localReports.map((rep) => {
                    const attachmentsList = rep.attachments && rep.attachments.length > 0
                      ? rep.attachments
                      : rep.fileUrl
                      ? [{ name: rep.fileName || 'Report_Attachment', url: rep.fileUrl, size: rep.fileSize || '1.4 MB', type: rep.fileType || 'pdf' }]
                      : [];

                    return (
                      <div
                        key={rep.id}
                        className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs hover:border-teal-300 transition space-y-3"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="px-2 py-0.5 bg-teal-50 text-teal-800 text-xs font-bold rounded border border-teal-200">
                                {rep.category || 'Diagnostic'}
                              </span>
                              <h4 className="text-sm font-bold text-slate-800">{rep.title}</h4>
                              {attachmentsList.length > 0 && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-700 bg-teal-50/80 border border-teal-200/70 px-2 py-0.5 rounded-full">
                                  <Paperclip className="w-3 h-3" /> {attachmentsList.length} {attachmentsList.length === 1 ? 'attachment' : 'attachments'}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 mt-1">
                              Doctor: <span className="font-medium text-slate-700">{rep.doctor}</span> • Date: {rep.date}
                            </p>
                          </div>

                          {/* Editable Status Dropdown right on card */}
                          <div className="flex items-center gap-2 self-start sm:self-auto">
                            <label className="text-[11px] font-semibold text-slate-500">Status:</label>
                            <select
                              value={rep.status || 'Active'}
                              onChange={(e) => handleQuickUpdateReportStatus(rep.id, e.target.value)}
                              className={`text-xs font-semibold rounded-lg px-2.5 py-1 border transition cursor-pointer ${
                                rep.status === 'Active' || rep.status === 'Finalized' || rep.status === 'Completed'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                                  : rep.status === 'Pending Review'
                                  ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                                  : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                              }`}
                            >
                              <option value="Active">Active</option>
                              <option value="Pending Review">Pending Review</option>
                              <option value="Finalized">Finalized</option>
                              <option value="Completed">Completed</option>
                              <option value="Archived">Archived</option>
                            </select>
                          </div>
                        </div>

                        {/* Attachments Pills List */}
                        {attachmentsList.length > 0 && (
                          <div className="flex flex-wrap items-center gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-xs">
                            <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                              <File className="w-3 h-3 text-slate-400" /> Attached Files:
                            </span>
                            {attachmentsList.map((att, idx) => (
                              <button
                                key={idx}
                                onClick={() => {
                                  handleOpenReportPreview(rep);
                                  setPreviewActiveTab(`attachment-${idx}`);
                                }}
                                className="inline-flex items-center gap-1.5 bg-white border border-slate-200 hover:border-teal-400 px-2 py-1 rounded-md text-slate-700 hover:text-teal-700 transition font-mono text-[11px]"
                                title="Click to preview file online"
                              >
                                {att.type === 'image' || att.name.toLowerCase().match(/\.(jpg|jpeg|png|webp)$/) ? (
                                  <ImageIcon className="w-3 h-3 text-blue-500" />
                                ) : (
                                  <FileText className="w-3 h-3 text-red-500" />
                                )}
                                <span className="max-w-[150px] truncate">{att.name}</span>
                                <span className="text-slate-400">({att.size || '1.4 MB'})</span>
                              </button>
                            ))}
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-lg border border-slate-100">
                          <div>
                            <span className="font-bold text-slate-700">Clinical Indication / Diagnosis:</span>
                            <p className="text-slate-800 mt-0.5">{rep.structuredData?.diagnosis || patient.condition}</p>
                          </div>
                          <div>
                            <span className="font-bold text-slate-700">Lab Summary & Impressions:</span>
                            <p className="text-slate-800 mt-0.5">{rep.notes || rep.structuredData?.summary || 'Standard diagnostic test evaluated.'}</p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100">
                          <span className="text-xs text-slate-500">
                            Document Format: <strong className="text-slate-700">{rep.fileType?.toUpperCase() || 'PDF'} Medical Document</strong>
                          </span>
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              onClick={() => handleOpenReportPreview(rep)}
                              className="px-3 py-1.5 text-xs font-semibold bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-lg transition flex items-center gap-1.5"
                            >
                              <Eye className="w-3.5 h-3.5" /> View Report Online
                            </button>
                            <button
                              onClick={() => handleOpenEditReportModal(rep)}
                              className="px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg transition flex items-center gap-1.5"
                            >
                              <Edit2 className="w-3.5 h-3.5" /> Edit Report
                            </button>
                            <button
                              onClick={() => handleDownloadReport(rep)}
                              className="px-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition flex items-center gap-1.5"
                            >
                              <Download className="w-3.5 h-3.5" /> Download PDF
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: MEDICINES / PRESCRIPTIONS */}
          {activeTab === 'medicines' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Prescribed Medications & Rx Orders ({localPrescriptions.length})
                  </h3>
                  <p className="text-xs text-slate-500">Manage active, completed, or stopped prescriptions and record clinical outcomes.</p>
                </div>
                <button
                  onClick={() => handleOpenRxModal()}
                  className="px-3.5 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" /> Prescribe New Medicine
                </button>
              </div>

              {localPrescriptions.length === 0 ? (
                <div className="bg-white p-8 text-center rounded-xl border border-slate-200">
                  <Pill className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-slate-600 font-medium text-sm">No prescriptions added yet.</p>
                  <p className="text-slate-400 text-xs mt-1">Click "Prescribe New Medicine" above to add medication.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {localPrescriptions.map((rx) => (
                    <div
                      key={rx.id}
                      className={`bg-white p-4 rounded-xl border shadow-xs relative flex flex-col justify-between transition ${
                        rx.status === 'Active'
                          ? 'border-slate-200/80 hover:border-teal-300'
                          : rx.status === 'Discontinued'
                          ? 'border-rose-200 bg-rose-50/20'
                          : 'border-slate-200 bg-slate-50/50'
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div className={`p-2 rounded-lg ${
                              rx.status === 'Active'
                                ? 'bg-teal-50 text-teal-700'
                                : rx.status === 'Discontinued'
                                ? 'bg-rose-100 text-rose-700'
                                : 'bg-slate-100 text-slate-600'
                            }`}>
                              <Pill className="w-5 h-5" />
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-slate-900">{rx.medicineName}</h4>
                              <p className="text-xs text-slate-500">Dosage: <strong className="text-slate-800">{rx.dosage}</strong></p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span className={`px-2 py-0.5 border text-xs font-semibold rounded-md ${
                              rx.status === 'Active'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : rx.status === 'Discontinued'
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}>
                              {rx.status}
                            </span>
                            <button
                              onClick={() => handleOpenRxModal(rx)}
                              className="p-1 text-slate-400 hover:text-teal-700 rounded transition"
                              title="Edit Prescription"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="mt-3 space-y-1 text-xs text-slate-600 border-t border-slate-100 pt-2.5">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Frequency:</span>
                            <span className="font-medium text-slate-800">{rx.frequency}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Duration:</span>
                            <span className="font-medium text-slate-800">{rx.duration}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Prescribed By:</span>
                            <span className="font-medium text-slate-800">{rx.prescribedBy}</span>
                          </div>
                          {rx.instructions && (
                            <div className="mt-1 pt-1 bg-slate-50 p-2 rounded border border-slate-100 text-[11px]">
                              <strong>Instructions:</strong> {rx.instructions}
                            </div>
                          )}
                        </div>
                      </div>

                      {rx.outcomeResult && (
                        <div className="mt-3 bg-emerald-50/80 p-2 rounded-lg border border-emerald-200 text-xs text-emerald-800">
                          <strong>Outcome:</strong> {rx.outcomeResult}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: VISITING HISTORY */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Hospital Clinical & Visit Timeline ({localVisits.length})
                  </h3>
                  <p className="text-xs text-slate-500">Real-time log of outpatient consultations, emergency visits, and admissions.</p>
                </div>
                <button
                  onClick={() => setShowVisitModal(true)}
                  className="px-3.5 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" /> Log New Visit Record
                </button>
              </div>

              {localVisits.length === 0 ? (
                <div className="bg-white p-8 text-center rounded-xl border border-slate-200">
                  <Clock className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-slate-600 font-medium text-sm">No recorded past visits.</p>
                  <p className="text-slate-400 text-xs mt-1">Click "Log New Visit Record" to record clinical notes.</p>
                </div>
              ) : (
                <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {localVisits.map((visit) => (
                    <div key={visit.id} className="relative bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
                      <div className="absolute -left-[25px] top-4 w-3.5 h-3.5 rounded-full bg-teal-600 border-2 border-white ring-2 ring-teal-100" />
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-100 pb-2">
                        <span className="text-xs font-bold text-teal-700 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" /> {visit.date}
                        </span>
                        <span className="px-2 py-0.5 bg-teal-50 text-teal-800 text-xs font-semibold rounded-md border border-teal-200 self-start sm:self-auto">
                          {visit.visitType}
                        </span>
                      </div>

                      <div className="mt-2 space-y-1 text-xs sm:text-sm">
                        <p className="font-bold text-slate-800">{visit.diagnosis}</p>
                        <p className="text-xs text-slate-500">
                          Attending: <strong className="text-slate-700">{visit.doctorName}</strong> ({visit.department})
                        </p>
                        <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 mt-2">
                          {visit.notes}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: APPOINTMENTS */}
          {activeTab === 'appointments' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Patient Scheduled Appointments ({patientAppointments.length})
                  </h3>
                  <p className="text-xs text-slate-500">Book new consultations, reschedule, or update status with immediate sync across the clinic.</p>
                </div>
                <button
                  onClick={() => handleOpenAptModal()}
                  className="px-3.5 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" /> Book New Appointment
                </button>
              </div>

              {patientAppointments.length === 0 ? (
                <div className="bg-white p-8 text-center rounded-xl border border-slate-200">
                  <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-slate-600 font-medium text-sm">No appointments scheduled for this patient.</p>
                  <p className="text-slate-400 text-xs mt-1">Click "Book New Appointment" to schedule an upcoming consultation or procedure.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {patientAppointments.map((apt) => (
                    <div
                      key={apt.id}
                      className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs hover:border-teal-300 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-xl shrink-0 ${
                          apt.status === 'Completed'
                            ? 'bg-emerald-50 text-emerald-700'
                            : apt.status === 'Cancelled'
                            ? 'bg-rose-50 text-rose-700'
                            : apt.status === 'Confirmed'
                            ? 'bg-teal-50 text-teal-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}>
                          <Calendar className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900">{apt.type}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${
                              apt.status === 'Completed'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : apt.status === 'Confirmed'
                                ? 'bg-teal-50 text-teal-800 border-teal-200'
                                : apt.status === 'Cancelled'
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}>
                              {apt.status}
                            </span>
                          </div>
                          <p className="text-xs font-semibold text-slate-800 mt-0.5">Doctor: {apt.doctorName} ({apt.department})</p>
                          <p className="text-xs text-slate-500">Date: {apt.date} • Time: {apt.time}</p>
                          {apt.notes && (
                            <p className="text-[11px] text-slate-600 bg-slate-50 px-2 py-1 rounded border border-slate-100 mt-1.5 inline-block">
                              Note: {apt.notes}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center flex-wrap">
                        {/* Direct Status Selector */}
                        <select
                          value={apt.status}
                          onChange={(e) => handleQuickUpdateAppointmentStatus(apt.id, e.target.value as Appointment['status'])}
                          className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-slate-700 font-semibold focus:outline-teal-600 cursor-pointer"
                        >
                          <option value="Pending">Pending</option>
                          <option value="Confirmed">Confirmed</option>
                          <option value="Completed">Completed</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>

                        <button
                          onClick={() => handleOpenAptModal(apt)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition flex items-center gap-1"
                          title="Edit Appointment Details"
                        >
                          <Edit2 className="w-3.5 h-3.5" /> Edit
                        </button>

                        <button
                          onClick={() => handleDeleteAppointmentItem(apt.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Cancel / Remove Appointment"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 6: PAYMENTS & BILLING */}
          {activeTab === 'billing' && (
            <div className="space-y-6">
              {/* Billing Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
                  <span className="text-xs font-medium text-slate-500">Total Billed Amount</span>
                  <p className="text-xl font-bold text-slate-900 mt-1">${totalBilled.toFixed(2)}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
                  <span className="text-xs font-medium text-slate-500">Total Amount Paid</span>
                  <p className="text-xl font-bold text-emerald-600 mt-1">${totalPaid.toFixed(2)}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
                  <span className="text-xs font-medium text-slate-500">Outstanding Balance Due</span>
                  <p className={`text-xl font-bold mt-1 ${totalDue > 0 ? 'text-amber-600' : 'text-slate-700'}`}>
                    ${totalDue.toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Invoices List */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      Invoice & Payment Statements ({localBilling.length})
                    </h4>
                    <p className="text-xs text-slate-500">Record payments, manage billing invoices, and update claim statuses.</p>
                  </div>
                  <button
                    onClick={() => handleOpenBillingModal()}
                    className="px-3.5 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" /> Generate New Invoice
                  </button>
                </div>

                {localBilling.length === 0 ? (
                  <div className="bg-white p-8 text-center rounded-xl border border-slate-200">
                    <CreditCard className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-slate-600 font-medium text-sm">No billing records found.</p>
                    <p className="text-slate-400 text-xs mt-1">Click "Generate New Invoice" to add a bill.</p>
                  </div>
                ) : (
                  localBilling.map((inv) => (
                    <div
                      key={inv.id}
                      className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-slate-800">{inv.invoiceNumber}</span>
                          <span
                            className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                              inv.status === 'Paid'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : inv.status === 'Partial'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : inv.status === 'Insurance Claim'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : 'bg-red-50 text-red-700 border border-red-200'
                            }`}
                          >
                            {inv.status}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-slate-800">{inv.description}</p>
                        <p className="text-xs text-slate-500">
                          Date: {inv.date} • Insurance: <strong className="text-slate-700">{inv.insuranceProvider || 'N/A'}</strong> • Method: <strong className="text-slate-700">{inv.paymentMethod || 'Credit Card'}</strong>
                        </p>
                        {inv.status === 'Partial' && (
                          <div className="mt-1.5 p-2 bg-amber-50 rounded-lg border border-amber-200/70 text-[11px] text-amber-900 space-y-0.5">
                            {inv.partialReason && (
                              <p><strong>Partial Reason:</strong> {inv.partialReason}</p>
                            )}
                            {inv.nextPaymentDate && (
                              <p><strong>Next Payment Due:</strong> <span className="font-semibold text-amber-950">{inv.nextPaymentDate}</span></p>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="text-right sm:self-center flex sm:flex-col justify-between items-end gap-2">
                        <div>
                          <span className="text-sm font-bold text-slate-900">${inv.totalAmount.toFixed(2)}</span>
                          {inv.paidAmount < inv.totalAmount && (
                            <p className="text-xs text-amber-600 font-medium">Paid: ${inv.paidAmount.toFixed(2)} (Due: ${(inv.totalAmount - inv.paidAmount).toFixed(2)})</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleOpenBillingModal(inv)}
                            className="px-2.5 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-semibold rounded-lg transition border border-teal-200/80 flex items-center gap-1"
                          >
                            <Edit2 className="w-3 h-3" /> Edit / Pay
                          </button>
                          <button
                            onClick={() =>
                              generateAndPrintReceipt({
                                invoiceNumber: inv.invoiceNumber,
                                patientName: patient.name,
                                patientId: patient.patientCode,
                                patientAddress: patient.address || '742 Evergreen Health Terrace, Springfield',
                                patientPhone: patient.phone,
                                date: inv.date,
                                serviceType: inv.description,
                                totalAmount: inv.totalAmount,
                                paidAmount: inv.paidAmount,
                                dueAmount: inv.totalAmount - inv.paidAmount,
                                paymentMethod: inv.paymentMethod || 'Credit Card',
                                status: inv.status,
                                insuranceProvider: inv.insuranceProvider,
                                partialReason: inv.partialReason,
                                nextPaymentDate: inv.nextPaymentDate,
                                attendingDoctor: patient.doctor,
                                department: patient.department,
                              })
                            }
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition flex items-center gap-1"
                          >
                            <Download className="w-3 h-3" /> Receipt
                          </button>
                          <button
                            onClick={() => handleDeleteBillingItem(inv.id, inv.invoiceNumber)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Delete Invoice"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-xl transition"
          >
            Close Details
          </button>
        </div>
      </div>

      {/* MODAL 1: Add / Edit Report Modal */}
      {showAddReportModal && (
        <div 
          onClick={() => setShowAddReportModal(false)}
          className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 cursor-default animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-teal-700" />
                {editingReport ? 'Edit Diagnostic / Lab Report' : 'Upload Diagnostic / Lab Report'}
              </h3>
              <button onClick={() => setShowAddReportModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveReportSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Report Title / Test Name *</label>
                <input
                  type="text"
                  required
                  value={reportTitle}
                  onChange={(e) => setReportTitle(e.target.value)}
                  placeholder="e.g. Chest X-Ray / Full Blood Count (CBC) / MRI Brain"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Report Category</label>
                  <select
                    value={reportCategory}
                    onChange={(e) => setReportCategory(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800"
                  >
                    <option value="Laboratory">Laboratory</option>
                    <option value="Radiology">Radiology</option>
                    <option value="Pathology">Pathology</option>
                    <option value="Cardiology">Cardiology</option>
                    <option value="Prescription">Prescription</option>
                    <option value="Discharge Summary">Discharge Summary</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Report Status</label>
                  <select
                    value={reportStatus}
                    onChange={(e) => setReportStatus(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 font-semibold"
                  >
                    <option value="Active">Active / Valid</option>
                    <option value="Pending Review">Pending Review</option>
                    <option value="Finalized">Finalized</option>
                    <option value="Completed">Completed</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Evaluating / Attending Doctor</label>
                <input
                  type="text"
                  value={reportDoctor}
                  onChange={(e) => setReportDoctor(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-800"
                />
              </div>

              {/* Multi-Attachment Upload Zone */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700">Attach Scans & Documents (Multiple Files Supported)</label>
                  <span className="text-[11px] text-teal-700 font-medium">{reportAttachments.length} attached</span>
                </div>
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 bg-slate-50/80 text-center hover:bg-slate-100/70 transition cursor-pointer">
                  <input
                    type="file"
                    id="report-file-multi-input"
                    multiple
                    accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <label htmlFor="report-file-multi-input" className="cursor-pointer flex flex-col items-center justify-center">
                    <div className="p-2 bg-teal-50 text-teal-700 rounded-full mb-1.5">
                      <Upload className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-slate-800">
                      Click to Browse or Drag & Drop Multiple Scans / Reports
                    </span>
                    <span className="text-[11px] text-slate-400 mt-0.5">
                      Supports PDF, PNG, JPG, DICOM exports (up to 15MB each)
                    </span>
                  </label>
                </div>

                {/* List of Attached Files with delete and format preview */}
                {reportAttachments.length > 0 && (
                  <div className="mt-2.5 space-y-1.5 max-h-36 overflow-y-auto p-1">
                    {reportAttachments.map((att, idx) => (
                      <div
                        key={att.id || idx}
                        className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200 text-xs shadow-2xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {att.type === 'image' || att.name.toLowerCase().match(/\.(jpg|jpeg|png|webp)$/) ? (
                            <ImageIcon className="w-4 h-4 text-blue-500 shrink-0" />
                          ) : (
                            <FileText className="w-4 h-4 text-red-500 shrink-0" />
                          )}
                          <span className="font-medium text-slate-800 truncate max-w-[240px]">{att.name}</span>
                          <span className="text-[11px] text-slate-400 font-mono">({att.size || '1.4 MB'})</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveAttachment(idx)}
                          className="text-slate-400 hover:text-red-500 p-1 rounded transition"
                          title="Remove attachment"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Clinical Indication / Diagnosis</label>
                <input
                  type="text"
                  value={reportDiagnosis}
                  onChange={(e) => setReportDiagnosis(e.target.value)}
                  placeholder="e.g. Suspected pneumonia, acute cough, baseline cardiac evaluation"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Lab Findings / Summary Impressions</label>
                <textarea
                  rows={3}
                  value={reportSummary}
                  onChange={(e) => setReportSummary(e.target.value)}
                  placeholder="Enter detailed laboratory findings, radiologist notes, or pathology remarks..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-800"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddReportModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white font-semibold rounded-xl shadow-xs transition"
                >
                  {editingReport ? 'Save Changes' : 'Save Lab Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REPORT PREVIEW MODAL (Online Multi-File Document & Scan Viewer) */}
      {previewingReport && (
        <div 
          onClick={() => setPreviewingReport(null)}
          className="fixed inset-0 z-[80] bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className={`bg-white rounded-2xl w-full shadow-2xl border border-slate-200 flex flex-col cursor-default animate-in fade-in zoom-in-95 duration-150 ${
              previewFullScreen ? 'fixed inset-3 max-w-none max-h-none h-[calc(100vh-24px)]' : 'max-w-4xl max-h-[92vh] h-[85vh]'
            }`}
          >
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/80 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-teal-700 text-white rounded-xl shadow-xs">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">
                      {previewingReport.title || previewingReport.reportType || 'Diagnostic Report'}
                    </h3>
                    <span className="px-2 py-0.5 bg-teal-50 text-teal-800 text-xs font-bold rounded border border-teal-200">
                      {previewingReport.category || 'Diagnostic'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Patient: <strong className="text-slate-800">{patient.name}</strong> ({patient.patientCode}) • Date: {previewingReport.date}
                  </p>
                </div>
              </div>

              {/* Status Selector in Modal Header & Actions */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-xl border border-slate-200 shadow-2xs">
                  <label className="text-[11px] font-bold text-slate-500">Status:</label>
                  <select
                    value={previewingReport.status || 'Active'}
                    onChange={(e) => handleQuickUpdateReportStatus(previewingReport.id, e.target.value)}
                    className="text-xs font-bold text-slate-800 bg-transparent focus:outline-none cursor-pointer"
                  >
                    <option value="Active">Active</option>
                    <option value="Pending Review">Pending Review</option>
                    <option value="Finalized">Finalized</option>
                    <option value="Completed">Completed</option>
                    <option value="Archived">Archived</option>
                  </select>
                  {statusUpdateSuccess && (
                    <Check className="w-3.5 h-3.5 text-emerald-600 animate-in fade-in" />
                  )}
                </div>

                <button
                  onClick={() => setPreviewFullScreen((prev) => !prev)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition"
                  title={previewFullScreen ? 'Exit Full Screen' : 'Full Screen'}
                >
                  <Maximize2 className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setPreviewingReport(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Navigation Tabs (Document View vs Attachments) */}
            {(() => {
              const attList = previewingReport.attachments && previewingReport.attachments.length > 0
                ? previewingReport.attachments
                : previewingReport.fileUrl
                ? [{ id: 'att-0', name: previewingReport.fileName || 'Attached_Scan.pdf', url: previewingReport.fileUrl, size: previewingReport.fileSize || '1.4 MB', type: previewingReport.fileType || 'pdf' }]
                : [];

              const currentAttIndex = previewActiveTab.startsWith('attachment-')
                ? parseInt(previewActiveTab.replace('attachment-', ''), 10)
                : -1;
              const currentAttachment = currentAttIndex >= 0 && attList[currentAttIndex] ? attList[currentAttIndex] : null;

              return (
                <>
                  <div className="flex items-center gap-1.5 px-4 pt-2 border-b border-slate-200 bg-slate-100/60 overflow-x-auto shrink-0 text-xs">
                    <button
                      onClick={() => setPreviewActiveTab('document')}
                      className={`px-3 py-2 font-bold border-b-2 flex items-center gap-1.5 transition whitespace-nowrap ${
                        previewActiveTab === 'document'
                          ? 'border-teal-700 text-teal-900 bg-white rounded-t-lg shadow-2xs'
                          : 'border-transparent text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <FileCheck className="w-3.5 h-3.5 text-teal-600" /> Official Diagnostic Summary
                    </button>

                    {attList.map((att, idx) => {
                      const isActive = previewActiveTab === `attachment-${idx}`;
                      const isImg = att.type === 'image' || att.name.toLowerCase().match(/\.(jpg|jpeg|png|webp)$/);
                      return (
                        <button
                          key={att.id || idx}
                          onClick={() => setPreviewActiveTab(`attachment-${idx}`)}
                          className={`px-3 py-2 font-bold border-b-2 flex items-center gap-1.5 transition whitespace-nowrap ${
                            isActive
                              ? 'border-teal-700 text-teal-900 bg-white rounded-t-lg shadow-2xs'
                              : 'border-transparent text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {isImg ? (
                            <ImageIcon className="w-3.5 h-3.5 text-blue-500" />
                          ) : (
                            <FileText className="w-3.5 h-3.5 text-red-500" />
                          )}
                          <span className="max-w-[140px] truncate">{att.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">({att.size || '1.4MB'})</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Viewer Content Body */}
                  <div className={`flex-1 ${previewActiveTab === 'document' ? 'overflow-y-auto p-4 sm:p-6' : 'overflow-hidden p-2 sm:p-3'} bg-slate-100/50 flex flex-col`}>
                    {previewActiveTab === 'document' ? (
                      /* Tab 1: Official Medical Document View */
                      <div className="max-w-3xl mx-auto bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6 text-slate-800">
                        {/* Hospital Letterhead */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-teal-700 pb-4">
                          <div>
                            <div className="text-xl font-extrabold text-teal-800 tracking-tight">PULSE CARE HOSPITAL</div>
                            <div className="text-xs text-slate-500 font-medium">Department of Clinical Diagnostics & Pathology</div>
                            <div className="text-[11px] text-slate-400">742 Evergreen Health Terrace, Springfield • Phone: (555) 019-2834</div>
                          </div>
                          <div className="text-right text-xs">
                            <div className="font-mono font-bold text-slate-700">REPORT #{previewingReport.id}</div>
                            <div className="text-slate-500">Date: {previewingReport.date}</div>
                            <span className="inline-block mt-1 px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold rounded text-[11px]">
                              {previewingReport.status || 'Active'}
                            </span>
                          </div>
                        </div>

                        {/* Patient & Doctor Meta */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                          <div className="space-y-1.5">
                            <div className="flex justify-between">
                              <span className="text-slate-500">Patient Name:</span>
                              <span className="font-bold text-slate-800">{patient.name}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">Patient ID / Code:</span>
                              <span className="font-mono font-bold text-slate-800">{patient.patientCode}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">Age / Gender:</span>
                              <span className="font-semibold text-slate-800">{patient.age} Yrs / {patient.gender}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">Blood Group:</span>
                              <span className="font-semibold text-slate-800">{patient.bloodType}</span>
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <div className="flex justify-between">
                              <span className="text-slate-500">Evaluating Doctor:</span>
                              <span className="font-bold text-slate-800">{previewingReport.doctor || patient.doctor}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">Department:</span>
                              <span className="font-semibold text-slate-800">{patient.department}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">Category:</span>
                              <span className="font-semibold text-teal-700">{previewingReport.category || 'Diagnostic'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">Room / Bed:</span>
                              <span className="font-semibold text-slate-800">{patient.room}</span>
                            </div>
                          </div>
                        </div>

                        {/* Clinical Diagnosis & Indication */}
                        <div className="space-y-2 text-xs">
                          <h4 className="font-bold text-slate-900 text-sm uppercase tracking-wide flex items-center gap-2">
                            <FileCheck className="w-4 h-4 text-teal-700" /> Clinical Indication & Diagnosis
                          </h4>
                          <div className="p-3.5 bg-teal-50/50 rounded-xl border border-teal-200/80 font-medium text-slate-800">
                            {previewingReport.structuredData?.diagnosis || previewingReport.diagnosis || patient.condition}
                          </div>
                        </div>

                        {/* Lab Findings & Impressions */}
                        <div className="space-y-2 text-xs">
                          <h4 className="font-bold text-slate-900 text-sm uppercase tracking-wide">
                            Laboratory Impressions & Clinical Evaluation
                          </h4>
                          <div className="p-4 bg-white rounded-xl border border-slate-200 text-slate-700 leading-relaxed font-sans whitespace-pre-wrap">
                            {previewingReport.notes || previewingReport.labResultSummary || previewingReport.structuredData?.summary || 'All evaluated parameters have been recorded according to standard hospital clinical protocols. The attending physician has reviewed and verified the findings.'}
                          </div>
                        </div>

                        {/* Digital Verification & Stamp */}
                        <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
                          <div>
                            <div className="font-semibold text-slate-700">Verified Electronic Health Record</div>
                            <div className="text-[11px] text-slate-400">Authenticated via Pulse Care Cloud Hospital Information System</div>
                          </div>
                          <div className="text-right border-t sm:border-t-0 pt-2 sm:pt-0">
                            <div className="font-mono text-teal-800 font-bold">Electronically Signed by:</div>
                            <div className="font-bold text-slate-900">{previewingReport.doctor || patient.doctor}</div>
                            <div className="text-[11px] text-slate-400">Consultant Physician</div>
                          </div>
                        </div>
                      </div>
                    ) : currentAttachment ? (
                      /* Tab 2..N: Attached File Online Viewer */
                      <div className="h-full flex flex-col items-center justify-center space-y-3">
                        {currentAttachment.type === 'image' || currentAttachment.name.toLowerCase().match(/\.(jpg|jpeg|png|webp)$/) ? (
                          <div className="w-full flex flex-col items-center space-y-3">
                            {/* Image Controls Bar */}
                            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs text-xs">
                              <span className="text-slate-500 font-medium">Zoom:</span>
                              <button
                                onClick={() => setPreviewZoom((z) => Math.max(50, z - 20))}
                                className="p-1 text-slate-600 hover:bg-slate-100 rounded"
                                title="Zoom Out"
                              >
                                <ZoomOut className="w-3.5 h-3.5" />
                              </button>
                              <span className="font-mono font-bold text-slate-800 w-10 text-center">{previewZoom}%</span>
                              <button
                                onClick={() => setPreviewZoom((z) => Math.min(250, z + 20))}
                                className="p-1 text-slate-600 hover:bg-slate-100 rounded"
                                title="Zoom In"
                              >
                                <ZoomIn className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setPreviewZoom(100)}
                                className="px-2 py-0.5 text-[11px] font-semibold text-teal-700 hover:bg-teal-50 rounded"
                              >
                                Reset
                              </button>
                            </div>

                            {/* Image Canvas Container */}
                            <div className="w-full max-h-[58vh] overflow-auto bg-slate-900/90 rounded-2xl p-4 flex items-center justify-center border border-slate-800 shadow-inner">
                              <img
                                src={currentAttachment.url}
                                alt={currentAttachment.name}
                                style={{ transform: `scale(${previewZoom / 100})`, transformOrigin: 'center center' }}
                                className="max-h-[52vh] object-contain rounded transition duration-150"
                              />
                            </div>
                          </div>
                        ) : currentAttachment.type === 'pdf' || currentAttachment.name.toLowerCase().endsWith('.pdf') ? (
                          <div className="w-full h-full min-h-[55vh] flex flex-col">
                            <PdfViewer
                              url={currentAttachment.url}
                              fileName={currentAttachment.name}
                              onDownload={() => handleDownloadAttachment(currentAttachment)}
                            />
                          </div>
                        ) : (
                          /* Fallback file preview card */
                          <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center max-w-md space-y-4 shadow-sm">
                            <File className="w-16 h-16 text-teal-700 mx-auto" />
                            <div>
                              <h4 className="font-bold text-slate-800 text-base">{currentAttachment.name}</h4>
                              <p className="text-xs text-slate-500 mt-1">File Size: {currentAttachment.size || '1.4 MB'}</p>
                            </div>
                            <button
                              onClick={() => handleDownloadAttachment(currentAttachment)}
                              className="px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-xl shadow-xs transition inline-flex items-center gap-2"
                            >
                              <Download className="w-4 h-4" /> Download File to View
                            </button>
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>

                  {/* Modal Footer Actions */}
                  <div className="p-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-white rounded-b-2xl shrink-0 text-xs">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenEditReportModal(previewingReport)}
                        className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition flex items-center gap-1.5"
                      >
                        <Edit2 className="w-3.5 h-3.5" /> Edit Report Details
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPreviewingReport(null)}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition"
                      >
                        Close Preview
                      </button>
                      
                      {currentAttachment ? (
                        <button
                          type="button"
                          onClick={() => handleDownloadAttachment(currentAttachment)}
                          className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white font-semibold rounded-xl shadow-xs flex items-center gap-1.5 transition"
                        >
                          <Download className="w-4 h-4" /> Download Selected Attachment
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleDownloadReport(previewingReport)}
                          className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white font-semibold rounded-xl shadow-xs flex items-center gap-1.5 transition"
                        >
                          <Download className="w-4 h-4" /> Download Official PDF
                        </button>
                      )}
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* MODAL 2: Prescribe / Edit Medicine Modal */}
      {showPrescriptionModal && (
        <div 
          onClick={() => setShowPrescriptionModal(false)}
          className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl border border-slate-200 space-y-4 cursor-default animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Pill className="w-5 h-5 text-teal-700" /> {editingPrescription ? 'Edit Prescription' : 'Prescribe New Medication'}
              </h3>
              <button onClick={() => setShowPrescriptionModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRxSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Medication Name *</label>
                <input
                  type="text"
                  required
                  value={rxName}
                  onChange={(e) => setRxName(e.target.value)}
                  placeholder="e.g. Amoxicillin / Lisinopril"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Dosage</label>
                  <input
                    type="text"
                    value={rxDosage}
                    onChange={(e) => setRxDosage(e.target.value)}
                    placeholder="e.g. 500 mg"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Frequency</label>
                  <input
                    type="text"
                    value={rxFrequency}
                    onChange={(e) => setRxFrequency(e.target.value)}
                    placeholder="e.g. Twice Daily"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Duration</label>
                  <input
                    type="text"
                    value={rxDuration}
                    onChange={(e) => setRxDuration(e.target.value)}
                    placeholder="e.g. 7 Days"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Prescribing Doctor</label>
                  <input
                    type="text"
                    value={rxDoctor}
                    onChange={(e) => setRxDoctor(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Prescription Status</label>
                  <select
                    value={rxStatus}
                    onChange={(e) => setRxStatus(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
                  >
                    <option value="Active">Active</option>
                    <option value="Completed">Completed</option>
                    <option value="Discontinued">Discontinued / Stopped</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Instructions</label>
                <input
                  type="text"
                  value={rxInstructions}
                  onChange={(e) => setRxInstructions(e.target.value)}
                  placeholder="e.g. Take after meals with plenty of water"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Prescription Result / Outcome Notes</label>
                <input
                  type="text"
                  value={rxOutcome}
                  onChange={(e) => setRxOutcome(e.target.value)}
                  placeholder="e.g. Patient fever resolved after 3 days / Discontinued due to nausea"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPrescriptionModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white font-semibold rounded-xl shadow-xs"
                >
                  Save Prescription
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Log Visit History Modal */}
      {showVisitModal && (
        <div 
          onClick={() => setShowVisitModal(false)}
          className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl border border-slate-200 space-y-4 cursor-default animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-teal-700" /> Log Clinical Visit Record
              </h3>
              <button onClick={() => setShowVisitModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveVisitSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Visit Type</label>
                  <select
                    value={visitType}
                    onChange={(e) => setVisitType(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
                  >
                    <option value="Outpatient">Outpatient</option>
                    <option value="Follow-up">Follow-up</option>
                    <option value="Admission">Admission</option>
                    <option value="Emergency">Emergency</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Attending Physician</label>
                  <input
                    type="text"
                    value={visitDoctor}
                    onChange={(e) => setVisitDoctor(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Department</label>
                <input
                  type="text"
                  value={visitDept}
                  onChange={(e) => setVisitDept(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Diagnosis / Reason for Visit</label>
                <input
                  type="text"
                  value={visitDiagnosis}
                  onChange={(e) => setVisitDiagnosis(e.target.value)}
                  placeholder="e.g. Post-operative check-up"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Detailed Visit Notes & Progress</label>
                <textarea
                  rows={3}
                  value={visitNotes}
                  onChange={(e) => setVisitNotes(e.target.value)}
                  placeholder="Enter clinical observations, vitals, or discharge instructions..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowVisitModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white font-semibold rounded-xl shadow-xs"
                >
                  Save Visit Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Book / Edit Appointment Modal */}
      {showAppointmentModal && (
        <div 
          onClick={() => setShowAppointmentModal(false)}
          className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl border border-slate-200 space-y-4 cursor-default animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-teal-700" /> {editingApt ? 'Edit Appointment' : 'Book New Appointment'}
              </h3>
              <button onClick={() => setShowAppointmentModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAptSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Appointment Date</label>
                  <input
                    type="date"
                    required
                    value={aptDate}
                    onChange={(e) => setAptDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Time Slot</label>
                  <input
                    type="text"
                    required
                    value={aptTime}
                    onChange={(e) => setAptTime(e.target.value)}
                    placeholder="e.g. 10:30 AM"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Doctor Name</label>
                  <input
                    type="text"
                    value={aptDoctor}
                    onChange={(e) => setAptDoctor(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Department</label>
                  <input
                    type="text"
                    value={aptDept}
                    onChange={(e) => setAptDept(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Appointment Type</label>
                  <select
                    value={aptType}
                    onChange={(e) => setAptType(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
                  >
                    <option value="Check-up">Check-up</option>
                    <option value="Consultation">Consultation</option>
                    <option value="Follow-up">Follow-up</option>
                    <option value="Procedure">Procedure</option>
                    <option value="Emergency">Emergency</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    value={aptStatus}
                    onChange={(e) => setAptStatus(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Clinical Notes / Visit Reason</label>
                <textarea
                  rows={2}
                  value={aptNotes}
                  onChange={(e) => setAptNotes(e.target.value)}
                  placeholder="e.g. Scheduled for 3-month cardiology follow-up & ECG..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAppointmentModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white font-semibold rounded-xl shadow-xs"
                >
                  Save Appointment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: Generate / Edit Billing Invoice Modal */}
      {showBillingModal && (
        <div 
          onClick={() => setShowBillingModal(false)}
          className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl border border-slate-200 space-y-4 cursor-default animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-teal-700" /> {editingBilling ? 'Edit Billing Record / Payment' : 'Generate New Invoice'}
              </h3>
              <button onClick={() => setShowBillingModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBillingSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Invoice Description *</label>
                <input
                  type="text"
                  required
                  value={invDesc}
                  onChange={(e) => setInvDesc(e.target.value)}
                  placeholder="e.g. Inpatient Room Charges & Surgery Suite"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Total Billed ($)</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={invTotal}
                    onChange={(e) => {
                      const newTotal = Number(e.target.value);
                      setInvTotal(newTotal);
                      if (newTotal > 0 && invPaid >= newTotal) {
                        setInvStatus('Paid');
                      } else if (newTotal > invPaid && invPaid > 0 && invStatus === 'Paid') {
                        setInvStatus('Partial');
                      }
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Amount Paid ($)</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={invPaid}
                    onChange={(e) => {
                      const newPaid = Number(e.target.value);
                      setInvPaid(newPaid);
                      if (invTotal > 0 && newPaid >= invTotal) {
                        setInvStatus('Paid');
                      } else if (newPaid > 0 && newPaid < invTotal && invStatus === 'Paid') {
                        setInvStatus('Partial');
                      } else if (newPaid === 0 && invStatus === 'Paid') {
                        setInvStatus('Pending');
                      }
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Payment Status</label>
                  <select
                    value={invStatus}
                    onChange={(e) => setInvStatus(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
                  >
                    <option value="Paid">Paid</option>
                    <option value="Pending">Pending</option>
                    <option value="Partial">Partial</option>
                    <option value="Insurance Claim">Insurance Claim</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Payment Method</label>
                  <select
                    value={invMethod}
                    onChange={(e) => setInvMethod(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
                  >
                    <option value="Credit Card">Credit Card</option>
                    <option value="Cash">Cash</option>
                    <option value="Insurance Direct">Insurance Direct</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Insurance Provider</label>
                <input
                  type="text"
                  value={invInsurance}
                  onChange={(e) => setInvInsurance(e.target.value)}
                  placeholder="e.g. Blue Cross / Self-pay"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
                />
              </div>

              {invStatus === 'Partial' && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/80 space-y-3 animate-in fade-in">
                  <div>
                    <label className="block font-semibold text-amber-900 mb-1">Partial Payment Reason *</label>
                    <input
                      type="text"
                      required
                      value={invPartialReason}
                      onChange={(e) => setInvPartialReason(e.target.value)}
                      placeholder="e.g. Initial co-pay installment; insurance adjustment pending"
                      className="w-full bg-white border border-amber-200 rounded-xl px-3 py-2 text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-amber-900 mb-1">Next Scheduled Payment Date</label>
                    <input
                      type="date"
                      value={invNextPaymentDate}
                      onChange={(e) => setInvNextPaymentDate(e.target.value)}
                      className="w-full bg-white border border-amber-200 rounded-xl px-3 py-2 text-slate-800"
                    />
                  </div>
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowBillingModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white font-semibold rounded-xl shadow-xs"
                >
                  Save Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Patient Confirmation Modal */}
      {showDeleteConfirm && (
        <div 
          onClick={() => setShowDeleteConfirm(false)}
          className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 space-y-4 cursor-default animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2.5 bg-rose-100 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Confirm Patient Deletion</h3>
                <p className="text-xs text-slate-500">Irreversible Action</p>
              </div>
            </div>

            <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200">
              Are you sure you want to permanently delete patient <strong>{patient.name}</strong> ({patient.patientCode})?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeletePatient) {
                    onDeletePatient(patient.id);
                  }
                  setShowDeleteConfirm(false);
                  onClose();
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl text-xs transition flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" /> Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
