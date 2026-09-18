import React, { useState, useEffect, useMemo } from 'react';
import {
  CreditCard,
  DollarSign,
  TrendingUp,
  Search,
  Filter,
  Plus,
  Download,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  ShieldCheck,
  X,
  Loader2,
  RotateCw,
  Printer,
  ChevronRight,
  User,
  Building,
  Edit2,
  Trash2,
  AlertTriangle,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  Phone,
  Hash,
  Sparkles,
  Check,
  Calendar,
  Layers,
} from 'lucide-react';
import { PaymentTransaction, Patient, PatientBillingRecord } from '../types';
import { generateAndPrintReceipt } from '../utils/receiptGenerator';

export interface PaymentsViewProps {
  payments: PaymentTransaction[];
  patients: Patient[];
  onSelectPatient?: (patient: Patient) => void;
  onSavePayment?: (payment: PaymentTransaction) => void;
  onUpdatePaymentStatus?: (paymentId: string, newStatus: PaymentTransaction['status']) => void;
  onDeletePayment?: (paymentId: string, invoiceNo: string) => void;
  onRefresh?: () => void;
}

const SERVICE_SUGGESTIONS = [
  'General Clinical Consultation',
  'Cardiology Consultation & ECG',
  'Inpatient Ward Room & Care (3 Days)',
  'MRI Brain Scan with Contrast',
  'Orthopedic Knee Arthroscopy',
  'Routine Pediatric Checkup',
  'Comprehensive Metabolic Panel & Labs',
  'Emergency Triage & Wound Suturing',
  'Laparoscopic Surgical Procedure',
  'Physical Therapy Rehabilitation',
];

export const PaymentsView: React.FC<PaymentsViewProps> = ({
  payments = [],
  patients = [],
  onSelectPatient,
  onSavePayment,
  onUpdatePaymentStatus,
  onDeletePayment,
  onRefresh,
}) => {
  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [methodFilter, setMethodFilter] = useState<string>('All');
  const [timeRangeFilter, setTimeRangeFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 200);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<PaymentTransaction | null>(null);
  const [invoiceToDelete, setInvoiceToDelete] = useState<PaymentTransaction | null>(null);
  const [selectedReceiptInvoice, setSelectedReceiptInvoice] = useState<PaymentTransaction | null>(null);

  // Form State for Record / Edit Payment
  const [formPatient, setFormPatient] = useState<Patient | null>(null);
  const [formPatientSearch, setFormPatientSearch] = useState('');
  const [formPatientPage, setFormPatientPage] = useState(1);
  const PATIENTS_PER_FORM_PAGE = 4;

  const [formPatientName, setFormPatientName] = useState('');
  const [formPatientId, setFormPatientId] = useState('');
  const [formServiceType, setFormServiceType] = useState('General Clinical Consultation');
  const [formTotalAmount, setFormTotalAmount] = useState<number | ''>(250);
  const [formPaidAmount, setFormPaidAmount] = useState<number | ''>(250);
  const [formPaymentMethod, setFormPaymentMethod] = useState<string>('Credit Card');
  const [formStatus, setFormStatus] = useState<PaymentTransaction['status']>('Completed');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formInsuranceProvider, setFormInsuranceProvider] = useState('');
  const [formClaimId, setFormClaimId] = useState('');
  const [formPartialReason, setFormPartialReason] = useState('');
  const [formNextPaymentDate, setFormNextPaymentDate] = useState('');

  // Date ranges for time filtering
  const timeDates = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];
    return { todayStr, sevenDaysAgoStr, thirtyDaysAgoStr };
  }, []);

  // Payments filtered by time range for stats and forecast
  const timeFilteredPayments = useMemo(() => {
    if (timeRangeFilter === 'all') return payments;
    return payments.filter((p) => {
      if (!p.date) return false;
      if (timeRangeFilter === 'today') {
        return p.date === timeDates.todayStr;
      }
      if (timeRangeFilter === 'week') {
        return p.date >= timeDates.sevenDaysAgoStr;
      }
      if (timeRangeFilter === 'month') {
        return p.date >= timeDates.thirtyDaysAgoStr;
      }
      return true;
    });
  }, [payments, timeRangeFilter, timeDates]);

  // Top 3 Cards Metric Calculations (from time-filtered payments list)
  const totalRevenue = useMemo(() => {
    return timeFilteredPayments.reduce((sum, p) => {
      const isPaid = p.status === 'Completed' || p.status === 'Paid';
      const isPartial = p.status === 'Partial';
      if (isPaid) {
        return sum + (typeof p.paidAmount === 'number' ? p.paidAmount : (p.amount || 0));
      }
      if (isPartial) {
        return sum + (typeof p.paidAmount === 'number' ? p.paidAmount : Math.round((p.amount || 0) * 0.5));
      }
      return sum + (typeof p.paidAmount === 'number' && p.paidAmount > 0 ? p.paidAmount : 0);
    }, 0);
  }, [timeFilteredPayments]);

  const settledCount = useMemo(() => {
    return timeFilteredPayments.filter((p) => p.status === 'Completed' || p.status === 'Paid').length;
  }, [timeFilteredPayments]);

  const pendingClaims = useMemo(() => {
    return timeFilteredPayments.reduce((sum, p) => {
      if (p.status === 'Pending' || p.status === 'Insurance Claim') {
        return sum + (p.amount || 0);
      }
      if (p.status === 'Partial') {
        const paid = typeof p.paidAmount === 'number' ? p.paidAmount : (p.amount || 0) * 0.5;
        return sum + Math.max(0, (p.amount || 0) - paid);
      }
      return sum;
    }, 0);
  }, [timeFilteredPayments]);

  const pendingCount = useMemo(() => {
    return timeFilteredPayments.filter((p) => p.status === 'Pending' || p.status === 'Insurance Claim' || p.status === 'Partial').length;
  }, [timeFilteredPayments]);

  const totalInvoices = timeFilteredPayments.length;
  const totalInvoicedGross = useMemo(() => {
    return timeFilteredPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  }, [timeFilteredPayments]);

  // Filtered Payments List (Time Range + Search + Status + Method)
  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      const q = debouncedSearch.toLowerCase().trim();
      const matchesSearch =
        !q ||
        p.patientName.toLowerCase().includes(q) ||
        p.invoiceNo.toLowerCase().includes(q) ||
        p.patientId.toLowerCase().includes(q) ||
        p.serviceType.toLowerCase().includes(q) ||
        (p.insuranceProvider && p.insuranceProvider.toLowerCase().includes(q)) ||
        (p.claimId && p.claimId.toLowerCase().includes(q));

      const matchesStatus =
        statusFilter === 'All' ||
        p.status.toLowerCase() === statusFilter.toLowerCase() ||
        (statusFilter === 'Completed' && (p.status === 'Paid' || p.status === 'Completed')) ||
        (statusFilter === 'Pending' && (p.status === 'Pending' || p.status === 'Insurance Claim'));

      const matchesMethod =
        methodFilter === 'All' || p.paymentMethod.toLowerCase() === methodFilter.toLowerCase();

      let matchesTime = true;
      if (timeRangeFilter === 'today') {
        matchesTime = p.date === timeDates.todayStr;
      } else if (timeRangeFilter === 'week') {
        matchesTime = !p.date || p.date >= timeDates.sevenDaysAgoStr;
      } else if (timeRangeFilter === 'month') {
        matchesTime = !p.date || p.date >= timeDates.thirtyDaysAgoStr;
      }

      return matchesSearch && matchesStatus && matchesMethod && matchesTime;
    });
  }, [payments, debouncedSearch, statusFilter, methodFilter, timeRangeFilter, timeDates]);

  // Paginated List
  const totalPages = Math.max(1, Math.ceil(filteredPayments.length / limit));
  const paginatedPayments = useMemo(() => {
    const start = (currentPage - 1) * limit;
    return filteredPayments.slice(start, start + limit);
  }, [filteredPayments, currentPage, limit]);

  // Filtered Patients for Record / Edit Payment Modal Search
  const filteredSelectorPatients = useMemo(() => {
    if (!formPatientSearch.trim()) return patients;
    const q = formPatientSearch.toLowerCase().trim();
    return patients.filter((p) => {
      return (
        p.name.toLowerCase().includes(q) ||
        (p.patientCode && p.patientCode.toLowerCase().includes(q)) ||
        p.id.toLowerCase().includes(q) ||
        (p.phone && p.phone.toLowerCase().includes(q)) ||
        (p.department && p.department.toLowerCase().includes(q))
      );
    });
  }, [patients, formPatientSearch]);

  const totalSelectorPages = Math.max(1, Math.ceil(filteredSelectorPatients.length / PATIENTS_PER_FORM_PAGE));
  const paginatedSelectorPatients = useMemo(() => {
    const start = (formPatientPage - 1) * PATIENTS_PER_FORM_PAGE;
    return filteredSelectorPatients.slice(start, start + PATIENTS_PER_FORM_PAGE);
  }, [filteredSelectorPatients, formPatientPage]);

  // Open "Record Payment" Modal
  const handleOpenAddModal = (presetPatient?: Patient) => {
    if (presetPatient) {
      setFormPatient(presetPatient);
      setFormPatientName(presetPatient.name);
      setFormPatientId(presetPatient.patientCode || presetPatient.id);
    } else {
      setFormPatient(null);
      setFormPatientName('');
      setFormPatientId('');
    }
    setFormPatientSearch('');
    setFormPatientPage(1);
    setFormServiceType('General Clinical Consultation');
    setFormTotalAmount(250);
    setFormPaidAmount(250);
    setFormPaymentMethod('Credit Card');
    setFormStatus('Completed');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormInsuranceProvider('');
    setFormClaimId('');
    setFormPartialReason('');
    setFormNextPaymentDate('');
    setShowAddModal(true);
  };

  // Open "Edit Invoice" Modal
  const handleOpenEditModal = (inv: PaymentTransaction) => {
    setEditingInvoice(inv);
    const matchedPat = patients.find(
      (p) => p.id === inv.patientId || p.patientCode === inv.patientId || p.name.toLowerCase() === inv.patientName.toLowerCase()
    );
    setFormPatient(matchedPat || null);
    setFormPatientName(inv.patientName);
    setFormPatientId(inv.patientId);
    setFormPatientSearch('');
    setFormPatientPage(1);
    setFormServiceType(inv.serviceType);
    setFormTotalAmount(inv.amount);
    setFormPaidAmount(typeof inv.paidAmount === 'number' ? inv.paidAmount : (inv.status === 'Completed' || inv.status === 'Paid' ? inv.amount : inv.status === 'Partial' ? inv.amount * 0.5 : 0));
    setFormPaymentMethod(inv.paymentMethod || 'Credit Card');
    setFormStatus(inv.status);
    setFormDate(inv.date || new Date().toISOString().split('T')[0]);
    setFormInsuranceProvider(inv.insuranceProvider || '');
    setFormClaimId(inv.claimId || '');
    setFormPartialReason(inv.partialReason || '');
    setFormNextPaymentDate(inv.nextPaymentDate || '');
  };

  // Form selection helper
  const handleSelectPatientInForm = (p: Patient) => {
    setFormPatient(p);
    setFormPatientName(p.name);
    setFormPatientId(p.patientCode || p.id);
  };

  // Quick Inline Status Change
  const handleInlineStatusChange = (paymentId: string, invoiceNo: string, newStatus: PaymentTransaction['status']) => {
    if (onUpdatePaymentStatus) {
      onUpdatePaymentStatus(paymentId, newStatus);
    }
    showToast(`Invoice ${invoiceNo} status updated to ${newStatus}. Synced with patient record.`, 'info');
  };

  // Submit Record / Edit Invoice Form
  const handleSubmitInvoiceForm = (e: React.FormEvent) => {
    e.preventDefault();
    const finalPatientName = formPatientName.trim();
    if (!finalPatientName) {
      showToast('Please select or specify a patient name.', 'error');
      return;
    }

    const numTotal = typeof formTotalAmount === 'number' ? Math.max(0, formTotalAmount) : 0;
    const numPaid = typeof formPaidAmount === 'number' ? Math.max(0, formPaidAmount) : 0;

    // Auto-align status if needed
    let computedStatus = formStatus;
    if (numTotal > 0 && numPaid >= numTotal && computedStatus !== 'Pending') {
      computedStatus = 'Completed';
    } else if (numPaid > 0 && numPaid < numTotal && computedStatus !== 'Pending') {
      computedStatus = 'Partial';
    } else if (numPaid === 0 && computedStatus === 'Completed') {
      computedStatus = 'Pending';
    }

    const isEditing = Boolean(editingInvoice);
    const targetId = editingInvoice ? editingInvoice.id : `pay-${Date.now()}`;
    const targetInvoiceNo = editingInvoice?.invoiceNo || `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const targetPatientId = formPatient ? (formPatient.patientCode || formPatient.id) : (formPatientId || `PAT-${Math.floor(8000 + Math.random() * 1000)}`);

    const transaction: PaymentTransaction = {
      id: targetId,
      invoiceNo: targetInvoiceNo,
      patientName: finalPatientName,
      patientId: targetPatientId,
      amount: numTotal,
      paidAmount: numPaid,
      serviceType: formServiceType.trim(),
      date: formDate,
      paymentMethod: formPaymentMethod as any,
      status: computedStatus,
      insuranceProvider: (formPaymentMethod.toLowerCase().includes('insurance') || formInsuranceProvider) ? formInsuranceProvider.trim() : undefined,
      claimId: (formPaymentMethod.toLowerCase().includes('insurance') || formClaimId) ? formClaimId.trim() : undefined,
      partialReason: computedStatus === 'Partial' ? (formPartialReason.trim() || 'Co-pay installment recorded, balance pending') : undefined,
      nextPaymentDate: computedStatus === 'Partial' ? formNextPaymentDate : undefined,
    };

    if (onSavePayment) {
      onSavePayment(transaction);
    }

    if (isEditing) {
      showToast(`Invoice ${targetInvoiceNo} updated. Changes synced to patient profile.`, 'success');
      setEditingInvoice(null);
    } else {
      showToast(`Invoice ${targetInvoiceNo} successfully created and linked to ${finalPatientName}'s payment section!`, 'success');
      setShowAddModal(false);
    }
  };

  // Handle Delete Invoice
  const handleConfirmDelete = () => {
    if (!invoiceToDelete) return;
    const invNo = invoiceToDelete.invoiceNo;
    if (onDeletePayment) {
      onDeletePayment(invoiceToDelete.id, invNo);
    }
    showToast(`Invoice ${invNo} deleted from payments and patient profile.`, 'info');
    setInvoiceToDelete(null);
  };

  // Refresh handler
  const handleRefreshClick = () => {
    setIsRefreshing(true);
    if (onRefresh) {
      onRefresh();
    }
    setTimeout(() => {
      setIsRefreshing(false);
      showToast('Billing & payment transactions synchronized.', 'info');
    }, 400);
  };

  // CSV Export
  const exportCSV = () => {
    const headers = 'Invoice No,Patient Name,Patient ID,Service Description,Date,Payment Method,Total Amount,Paid Amount,Status,Insurance,Claim ID\n';
    const rows = filteredPayments
      .map(
        (p) =>
          `"${p.invoiceNo}","${p.patientName}","${p.patientId}","${p.serviceType}","${p.date}","${p.paymentMethod}",${p.amount},${p.paidAmount ?? (p.status === 'Completed' ? p.amount : 0)},"${p.status}","${p.insuranceProvider || ''}","${p.claimId || ''}"`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Hospital_Billing_Export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    showToast('Billing ledger exported to CSV successfully.');
  };

  return (
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto space-y-6">
      {/* Toast Notification Alert */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-[9999] px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-semibold animate-in slide-in-from-bottom-3 duration-200 border ${
            toastMessage.type === 'success'
              ? 'bg-slate-900 text-white border-slate-800'
              : toastMessage.type === 'error'
              ? 'bg-rose-900 text-rose-50 border-rose-700'
              : 'bg-slate-900 text-white border-slate-800'
          }`}
        >
          {toastMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
          {toastMessage.type === 'error' && <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />}
          {toastMessage.type === 'info' && <Sparkles className="w-4 h-4 text-teal-400 shrink-0" />}
          <span>{toastMessage.text}</span>
          <button onClick={() => setToastMessage(null)} className="ml-2 text-slate-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header & Time Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Billing & Payments Center</span>
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
              Live Synchronized
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time patient billing, invoice lifecycle, insurance claims clearance, and automated revenue tracking.
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 flex-wrap sm:flex-nowrap">
          {/* Time Range Selector (Daily / Weekly / Monthly / All) */}
          <div className="inline-flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => {
                setTimeRangeFilter('today');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                timeRangeFilter === 'today'
                  ? 'bg-white text-teal-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Daily (Today)
            </button>
            <button
              onClick={() => {
                setTimeRangeFilter('week');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                timeRangeFilter === 'week'
                  ? 'bg-white text-teal-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Weekly
            </button>
            <button
              onClick={() => {
                setTimeRangeFilter('month');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                timeRangeFilter === 'month'
                  ? 'bg-white text-teal-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => {
                setTimeRangeFilter('all');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                timeRangeFilter === 'all'
                  ? 'bg-white text-teal-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Time
            </button>
          </div>

          <button
            onClick={handleRefreshClick}
            disabled={isRefreshing}
            className="h-10 inline-flex items-center justify-center gap-2 px-3.5 sm:px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl shadow-xs transition cursor-pointer whitespace-nowrap shrink-0 active:scale-95"
            title="Refresh Invoices & Patient Sync"
          >
            <RotateCw className={`w-4 h-4 text-teal-700 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Sync Data</span>
          </button>
          <button
            onClick={exportCSV}
            className="h-10 inline-flex items-center justify-center gap-2 px-3.5 sm:px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl shadow-xs transition cursor-pointer whitespace-nowrap shrink-0 active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => handleOpenAddModal()}
            className="h-10 inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-2 bg-teal-800 hover:bg-teal-900 text-white font-semibold text-xs rounded-xl shadow-xs transition cursor-pointer whitespace-nowrap shrink-0 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Record Payment</span>
          </button>
        </div>
      </div>

      {/* TOP 3 CARDS: Live Dynamic Data (Respecting Time Filter) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Total Revenue Processed */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center space-x-4">
          <div className="p-3.5 bg-emerald-50 text-emerald-700 rounded-xl shrink-0 border border-emerald-100">
            <DollarSign className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-medium text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Total Revenue Processed</span>
              <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-1.5 py-0.2 rounded">
                {timeRangeFilter === 'today' ? 'Daily' : timeRangeFilter === 'week' ? 'Weekly' : timeRangeFilter === 'month' ? 'Monthly' : 'All'}
              </span>
            </div>
            <div className="text-2xl font-extrabold text-slate-900 mt-0.5 truncate">
              ${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-emerald-700 font-semibold mt-0.5 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>{settledCount} Settled Payments</span>
            </div>
          </div>
        </div>

        {/* Card 2: Pending Claims & Receivables */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center space-x-4">
          <div className="p-3.5 bg-amber-50 text-amber-700 rounded-xl shrink-0 border border-amber-100">
            <Clock className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-medium text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Pending Claims & Receivables</span>
              <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded">
                Outstanding
              </span>
            </div>
            <div className="text-2xl font-extrabold text-slate-900 mt-0.5 truncate">
              ${pendingClaims.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-amber-700 font-semibold mt-0.5 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{pendingCount} Awaiting Insurance / Balance</span>
            </div>
          </div>
        </div>

        {/* Card 3: Total Invoices Issued */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center space-x-4">
          <div className="p-3.5 bg-teal-50 text-teal-800 rounded-xl shrink-0 border border-teal-100">
            <CreditCard className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-medium text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Total Invoices Issued</span>
              <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded">
                Ledger
              </span>
            </div>
            <div className="text-2xl font-extrabold text-slate-900 mt-0.5 truncate">
              {totalInvoices} Invoices
            </div>
            <div className="text-[11px] text-teal-700 font-semibold mt-0.5 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5" />
              <span>${totalInvoicedGross.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Invoiced Total</span>
            </div>
          </div>
        </div>
      </div>

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
              placeholder="Search by patient name, ID (e.g. PT-01836), invoice #, service, or insurance provider..."
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
            {/* Payment Method Filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={methodFilter}
                onChange={(e) => {
                  setMethodFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-transparent focus:outline-none cursor-pointer font-medium"
              >
                <option value="All">All Methods</option>
                <option value="Credit Card">Credit Card</option>
                <option value="Insurance Claim">Insurance Claim</option>
                <option value="Apple Pay">Apple Pay</option>
                <option value="Bank Wire">Bank Wire</option>
                <option value="Cash">Cash</option>
                <option value="Insurance Direct">Insurance Direct</option>
                <option value="Bank Transfer">Bank Transfer</option>
              </select>
            </div>

            {/* Page Size */}
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
                <option value={10}>10 / page</option>
                <option value={20}>20 / page</option>
                <option value={50}>50 / page</option>
              </select>
            </div>
          </div>
        </div>

        {/* Quick Status Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
          {['All', 'Completed', 'Pending', 'Partial', 'Insurance Claim', 'Failed'].map((st) => (
            <button
              key={st}
              onClick={() => {
                setStatusFilter(st);
                setCurrentPage(1);
              }}
              className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                statusFilter === st
                  ? 'bg-teal-800 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st === 'All' ? 'All Statuses' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Showing counter */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <div>
          Showing page <span className="font-bold text-slate-800">{currentPage}</span> of{' '}
          <span className="font-bold text-slate-800">{totalPages}</span> (
          <span className="font-bold text-slate-800">{filteredPayments.length}</span> matching invoices)
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Linked with Patient Profile Payment Portfolios</span>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-4">Invoice #</th>
                <th className="py-3.5 px-4">Patient</th>
                <th className="py-3.5 px-4">Service & Insurance Details</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Method</th>
                <th className="py-3.5 px-4 text-right">Amount ($)</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {paginatedPayments.map((payment) => {
                const matchedPatient = patients.find(
                  (p) =>
                    p.id === payment.patientId ||
                    p.patientCode === payment.patientId ||
                    p.name.toLowerCase() === payment.patientName.toLowerCase()
                );

                const paidAmt =
                  typeof payment.paidAmount === 'number'
                    ? payment.paidAmount
                    : payment.status === 'Completed' || payment.status === 'Paid'
                    ? payment.amount
                    : payment.status === 'Partial'
                    ? payment.amount * 0.5
                    : 0;

                const dueAmt = Math.max(0, payment.amount - paidAmt);

                return (
                  <tr key={payment.id} className="hover:bg-slate-50/80 transition">
                    {/* Invoice No */}
                    <td className="py-3.5 px-4 font-mono font-bold text-teal-800">
                      <button
                        onClick={() => setSelectedReceiptInvoice(payment)}
                        className="hover:underline cursor-pointer text-left"
                        title="Click to view receipt"
                      >
                        {payment.invoiceNo}
                      </button>
                    </td>

                    {/* Patient */}
                    <td className="py-3.5 px-4">
                      <div
                        onClick={() => matchedPatient && onSelectPatient && onSelectPatient(matchedPatient)}
                        className={`group ${matchedPatient && onSelectPatient ? 'cursor-pointer' : ''}`}
                      >
                        <div className="font-bold text-slate-900 group-hover:text-teal-700 transition flex items-center gap-1.5">
                          <span>{payment.patientName}</span>
                          {matchedPatient && onSelectPatient && (
                            <ChevronRight className="w-3 h-3 text-slate-400 group-hover:text-teal-700" />
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {payment.patientId}
                          {matchedPatient && ` • ${matchedPatient.department}`}
                        </div>
                      </div>
                    </td>

                    {/* Service & Insurance */}
                    <td className="py-3.5 px-4 text-slate-700 max-w-xs">
                      <div className="font-medium text-slate-800">{payment.serviceType}</div>
                      {payment.insuranceProvider && (
                        <div className="text-[11px] text-blue-700 font-semibold flex items-center gap-1 mt-0.5">
                          <ShieldCheck className="w-3 h-3 text-blue-500 shrink-0" />
                          <span>
                            {payment.insuranceProvider}
                            {payment.claimId && ` (${payment.claimId})`}
                          </span>
                        </div>
                      )}
                      {payment.partialReason && payment.status === 'Partial' && (
                        <div className="text-[10px] text-amber-700 font-medium mt-0.5 line-clamp-1">
                          Note: {payment.partialReason}
                        </div>
                      )}
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">{payment.date}</td>

                    {/* Payment Method */}
                    <td className="py-3.5 px-4 font-medium text-slate-700 whitespace-nowrap">
                      {payment.paymentMethod}
                    </td>

                    {/* Amount */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="font-bold text-slate-900 text-sm">${payment.amount.toFixed(2)}</div>
                      {payment.status === 'Partial' && (
                        <div className="text-[10px] text-amber-700 font-medium">
                          Paid: ${paidAmt.toFixed(2)} (Due: ${dueAmt.toFixed(2)})
                        </div>
                      )}
                    </td>

                    {/* Quick Status Selector */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="inline-flex items-center gap-1">
                        <select
                          value={payment.status === 'Paid' ? 'Completed' : payment.status}
                          onChange={(e) =>
                            handleInlineStatusChange(payment.id, payment.invoiceNo, e.target.value as any)
                          }
                          className={`text-[11px] font-bold rounded-lg px-2 py-1 border cursor-pointer focus:outline-none transition ${
                            payment.status === 'Completed' || payment.status === 'Paid'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : payment.status === 'Partial'
                              ? 'bg-amber-50 text-amber-800 border-amber-300'
                              : payment.status === 'Insurance Claim'
                              ? 'bg-blue-50 text-blue-800 border-blue-200'
                              : payment.status === 'Pending'
                              ? 'bg-sky-50 text-sky-800 border-sky-200'
                              : 'bg-rose-50 text-rose-800 border-rose-200'
                          }`}
                        >
                          <option value="Completed">Completed</option>
                          <option value="Pending">Pending</option>
                          <option value="Partial">Partial</option>
                          <option value="Insurance Claim">Insurance Claim</option>
                          <option value="Failed">Failed</option>
                        </select>
                      </div>
                    </td>

                    {/* Actions: Receipt, Edit, Delete */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        {/* Receipt Button */}
                        <button
                          onClick={() =>
                            generateAndPrintReceipt({
                              invoiceNumber: payment.invoiceNo,
                              patientName: payment.patientName,
                              patientId: payment.patientId,
                              patientAddress: matchedPatient?.address || 'Hospital Patient Inpatient Record',
                              patientPhone: matchedPatient?.phone || '',
                              date: payment.date,
                              serviceType: payment.serviceType,
                              totalAmount: payment.amount,
                              paidAmount: paidAmt,
                              dueAmount: dueAmt,
                              paymentMethod: payment.paymentMethod,
                              status: payment.status === 'Completed' || payment.status === 'Paid' ? 'Paid' : payment.status,
                              insuranceProvider: payment.insuranceProvider,
                              partialReason: payment.partialReason,
                              nextPaymentDate: payment.nextPaymentDate,
                              attendingDoctor: matchedPatient?.doctor || 'Hospital Physician',
                              department: matchedPatient?.department || 'General Medicine',
                            })
                          }
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-[11px] transition flex items-center gap-1 cursor-pointer"
                          title="Download / Print Receipt"
                        >
                          <Download className="w-3 h-3" />
                          <span className="hidden sm:inline">Receipt</span>
                        </button>

                        {/* Edit Button */}
                        <button
                          onClick={() => handleOpenEditModal(payment)}
                          className="px-2.5 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 font-semibold rounded-lg text-[11px] transition flex items-center gap-1 border border-teal-200/80 cursor-pointer"
                          title="Edit Invoice"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span className="hidden sm:inline">Edit</span>
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => setInvoiceToDelete(payment)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          title="Delete Invoice"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {paginatedPayments.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-400">
                    <FileText className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-700 text-sm">No payment invoices found</p>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                      No invoices match the current search or filters. Click &ldquo;Record Payment&rdquo; to create a new invoice linked to a patient.
                    </p>
                    <button
                      onClick={() => {
                        setSearchTerm('');
                        setStatusFilter('All');
                        setMethodFilter('All');
                        setCurrentPage(1);
                      }}
                      className="mt-3 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg cursor-pointer"
                    >
                      Reset All Filters
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 bg-slate-50/50">
            <div>
              Showing <span className="font-bold text-slate-800">{(currentPage - 1) * limit + 1}</span> to{' '}
              <span className="font-bold text-slate-800">
                {Math.min(currentPage * limit, filteredPayments.length)}
              </span>{' '}
              of <span className="font-bold text-slate-800">{filteredPayments.length}</span> invoices
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                title="First Page"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 font-semibold disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
              >
                Previous
              </button>

              <span className="px-3 py-1 font-bold text-slate-800">
                Page {currentPage} of {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 font-semibold disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
              >
                Next
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                title="Last Page"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL 1: RECORD NEW PAYMENT / EDIT INVOICE (Searchable Patient Lookup + Full Details) */}
      {(showAddModal || editingInvoice) && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 my-8 max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-teal-50 text-teal-800 rounded-xl border border-teal-200">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">
                    {editingInvoice ? `Edit Invoice (${editingInvoice.invoiceNo})` : 'Record Payment & Generate Invoice'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Creates an official invoice and links directly with the patient&apos;s personal billing records.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingInvoice(null);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitInvoiceForm} className="space-y-4 text-xs">
              {/* SECTION 1: SEARCHABLE PATIENT LOOKUP (by Name, Phone, or Patient ID) */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-slate-800 font-bold flex items-center gap-1.5">
                    <User className="w-4 h-4 text-teal-700" />
                    <span>Select Patient <span className="text-rose-500">*</span></span>
                  </label>
                  {formPatient && (
                    <button
                      type="button"
                      onClick={() => {
                        setFormPatient(null);
                        setFormPatientName('');
                        setFormPatientId('');
                      }}
                      className="text-xs text-teal-700 hover:underline font-semibold cursor-pointer"
                    >
                      Change Patient
                    </button>
                  )}
                </div>

                {formPatient ? (
                  <div className="p-3.5 bg-white rounded-xl border border-teal-200 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-teal-800 text-white font-bold flex items-center justify-center text-sm shrink-0">
                        {formPatient.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-sm">
                          {formPatient.name}
                        </div>
                        <div className="text-slate-500 text-xs flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-teal-700 font-semibold">
                            {formPatient.patientCode || formPatient.id}
                          </span>
                          <span>•</span>
                          <span>Dept: {formPatient.department}</span>
                          <span>•</span>
                          <span>Phone: {formPatient.phone}</span>
                        </div>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-full border border-emerald-200 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Selected
                    </span>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {/* Patient Search Input */}
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={formPatientSearch}
                        onChange={(e) => {
                          setFormPatientSearch(e.target.value);
                          setFormPatientPage(1);
                        }}
                        placeholder="Search patient by Name, Phone Number, or Patient ID code (e.g. PT-01836)..."
                        className="w-full bg-white border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                      />
                    </div>

                    {/* Paginated Patients List */}
                    <div className="space-y-1.5 max-h-48 overflow-y-auto">
                      {paginatedSelectorPatients.length === 0 ? (
                        <div className="py-6 text-center text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
                          No matching patients found. Type custom patient name below or try another search.
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
                          Page {formPatientPage} of {totalSelectorPages} ({filteredSelectorPatients.length} patients)
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setFormPatientPage((p) => Math.max(1, p - 1))}
                            disabled={formPatientPage === 1}
                            className="px-2 py-1 bg-white border border-slate-200 rounded-lg disabled:opacity-40 cursor-pointer font-semibold"
                          >
                            Prev
                          </button>
                          <button
                            type="button"
                            onClick={() => setFormPatientPage((p) => Math.min(totalSelectorPages, p + 1))}
                            disabled={formPatientPage === totalSelectorPages}
                            className="px-2 py-1 bg-white border border-slate-200 rounded-lg disabled:opacity-40 cursor-pointer font-semibold"
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Manual Name Fallback */}
                    <div className="pt-2 border-t border-slate-200/60">
                      <label className="block text-slate-600 font-semibold mb-1">
                        Or enter patient name manually:
                      </label>
                      <input
                        type="text"
                        value={formPatientName}
                        onChange={(e) => setFormPatientName(e.target.value)}
                        placeholder="e.g. Eleanor Vance"
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION 2: SERVICE & INVOICE DETAILS */}
              <div className="space-y-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Service Rendered / Invoice Description <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formServiceType}
                    onChange={(e) => setFormServiceType(e.target.value)}
                    placeholder="e.g. Cardiology Consultation & ECG Telemetry"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  />
                  {/* Service suggestion pills */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pt-1.5 no-scrollbar">
                    {SERVICE_SUGGESTIONS.slice(0, 4).map((sugg) => (
                      <button
                        type="button"
                        key={sugg}
                        onClick={() => setFormServiceType(sugg)}
                        className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-0.5 rounded-md whitespace-nowrap cursor-pointer"
                      >
                        + {sugg}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      Total Billed ($) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min={0}
                      required
                      value={formTotalAmount}
                      onChange={(e) => {
                        const val = e.target.value === '' ? '' : Number(e.target.value);
                        setFormTotalAmount(val);
                        if (typeof val === 'number' && typeof formPaidAmount === 'number') {
                          if (val > 0 && formPaidAmount >= val) {
                            setFormStatus('Completed');
                          } else if (formPaidAmount > 0 && formPaidAmount < val) {
                            setFormStatus('Partial');
                          }
                        }
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Amount Paid ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      min={0}
                      value={formPaidAmount}
                      onChange={(e) => {
                        const val = e.target.value === '' ? '' : Number(e.target.value);
                        setFormPaidAmount(val);
                        if (typeof val === 'number' && typeof formTotalAmount === 'number') {
                          if (formTotalAmount > 0 && val >= formTotalAmount) {
                            setFormStatus('Completed');
                          } else if (val > 0 && val < formTotalAmount) {
                            setFormStatus('Partial');
                          } else if (val === 0) {
                            setFormStatus('Pending');
                          }
                        }
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Transaction Date</label>
                    <input
                      type="date"
                      required
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Payment Method</label>
                    <select
                      value={formPaymentMethod}
                      onChange={(e) => setFormPaymentMethod(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none cursor-pointer"
                    >
                      <option value="Credit Card">Credit Card</option>
                      <option value="Insurance Claim">Insurance Claim</option>
                      <option value="Apple Pay">Apple Pay</option>
                      <option value="Bank Wire">Bank Wire</option>
                      <option value="Cash">Cash</option>
                      <option value="Insurance Direct">Insurance Direct</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Payment Status</label>
                    <select
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none cursor-pointer"
                    >
                      <option value="Completed">Completed / Settled</option>
                      <option value="Pending">Pending / Unpaid</option>
                      <option value="Partial">Partial Payment</option>
                      <option value="Insurance Claim">Insurance Claim Processing</option>
                      <option value="Failed">Failed / Declined</option>
                    </select>
                  </div>
                </div>

                {/* Insurance Details Section */}
                {(formPaymentMethod.toLowerCase().includes('insurance') || formStatus === 'Insurance Claim') && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-blue-50/60 p-3.5 rounded-xl border border-blue-200/80 animate-in fade-in">
                    <div>
                      <label className="block text-blue-900 font-semibold mb-1">Insurance Provider</label>
                      <input
                        type="text"
                        value={formInsuranceProvider}
                        onChange={(e) => setFormInsuranceProvider(e.target.value)}
                        placeholder="e.g. BlueCross HealthCare"
                        className="w-full bg-white border border-blue-200 rounded-xl px-3 py-1.5 text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-blue-900 font-semibold mb-1">Claim Reference ID</label>
                      <input
                        type="text"
                        value={formClaimId}
                        onChange={(e) => setFormClaimId(e.target.value)}
                        placeholder="e.g. CLM-88412"
                        className="w-full bg-white border border-blue-200 rounded-xl px-3 py-1.5 text-slate-800 font-mono"
                      />
                    </div>
                  </div>
                )}

                {/* Partial Payment Details Section */}
                {formStatus === 'Partial' && (
                  <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200/80 space-y-3 animate-in fade-in">
                    <div>
                      <label className="block font-semibold text-amber-900 mb-1">Partial Payment Reason *</label>
                      <input
                        type="text"
                        required
                        value={formPartialReason}
                        onChange={(e) => setFormPartialReason(e.target.value)}
                        placeholder="e.g. Initial co-pay deposit processed; remaining claim under review"
                        className="w-full bg-white border border-amber-200 rounded-xl px-3 py-1.5 text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-amber-900 mb-1">Next Scheduled Payment Due Date</label>
                      <input
                        type="date"
                        value={formNextPaymentDate}
                        onChange={(e) => setFormNextPaymentDate(e.target.value)}
                        className="w-full bg-white border border-amber-200 rounded-xl px-3 py-1.5 text-slate-800"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingInvoice(null);
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-800 hover:bg-teal-900 text-white font-semibold rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingInvoice ? 'Update Invoice & Sync' : 'Create Invoice & Sync'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: DELETE CONFIRMATION MODAL */}
      {invoiceToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2.5 bg-rose-50 rounded-xl border border-rose-200">
                <AlertTriangle className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Delete Payment Invoice?</h3>
                <p className="text-xs text-slate-500 font-mono">{invoiceToDelete.invoiceNo}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to delete invoice <strong className="text-slate-900 font-mono">{invoiceToDelete.invoiceNo}</strong> (${invoiceToDelete.amount.toFixed(2)}) for patient <strong className="text-slate-900">{invoiceToDelete.patientName}</strong>?
            </p>
            <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-[11px] text-rose-900">
              Notice: This will immediately delete this billing record from both the general ledger and the patient&apos;s profile payment section.
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setInvoiceToDelete(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Permanently</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: OFFICIAL RECEIPT VIEWER & PRINTER */}
      {selectedReceiptInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-teal-800" />
                <h3 className="font-bold text-slate-900 text-base">Official Hospital Invoice Statement</h3>
              </div>
              <button
                onClick={() => setSelectedReceiptInvoice(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Invoice Number:</span>
                  <span className="font-mono font-bold text-teal-900">{selectedReceiptInvoice.invoiceNo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Patient Name:</span>
                  <span className="font-semibold text-slate-800">{selectedReceiptInvoice.patientName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Patient ID:</span>
                  <span className="font-mono text-slate-700">{selectedReceiptInvoice.patientId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Transaction Date:</span>
                  <span className="text-slate-700">{selectedReceiptInvoice.date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Payment Method:</span>
                  <span className="text-slate-700 font-medium">{selectedReceiptInvoice.paymentMethod}</span>
                </div>
              </div>

              <div className="space-y-1.5 pt-1">
                <div className="text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                  Service Breakdown
                </div>
                <div className="flex justify-between p-2.5 bg-slate-100/70 rounded-xl font-medium">
                  <span className="text-slate-800">{selectedReceiptInvoice.serviceType}</span>
                  <span className="font-bold text-slate-900">${selectedReceiptInvoice.amount.toFixed(2)}</span>
                </div>
              </div>

              {selectedReceiptInvoice.insuranceProvider && (
                <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-blue-950 text-[11px]">
                  <strong>Insurance Provider:</strong> {selectedReceiptInvoice.insuranceProvider}{' '}
                  {selectedReceiptInvoice.claimId && `(${selectedReceiptInvoice.claimId})`}
                </div>
              )}

              {selectedReceiptInvoice.status === 'Partial' && (
                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-[11px] space-y-1">
                  {selectedReceiptInvoice.partialReason && (
                    <p><strong>Reason:</strong> {selectedReceiptInvoice.partialReason}</p>
                  )}
                  {selectedReceiptInvoice.nextPaymentDate && (
                    <p><strong>Next Payment Due:</strong> {selectedReceiptInvoice.nextPaymentDate}</p>
                  )}
                </div>
              )}

              <div className="flex justify-between items-center p-3 bg-teal-50 rounded-xl border border-teal-100">
                <span className="font-bold text-slate-800 text-sm">Total Billed</span>
                <span className="font-extrabold text-teal-900 text-lg">
                  ${selectedReceiptInvoice.amount.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                onClick={() =>
                  generateAndPrintReceipt({
                    invoiceNumber: selectedReceiptInvoice.invoiceNo,
                    patientName: selectedReceiptInvoice.patientName,
                    patientId: selectedReceiptInvoice.patientId,
                    date: selectedReceiptInvoice.date,
                    serviceType: selectedReceiptInvoice.serviceType,
                    totalAmount: selectedReceiptInvoice.amount,
                    paidAmount:
                      typeof selectedReceiptInvoice.paidAmount === 'number'
                        ? selectedReceiptInvoice.paidAmount
                        : selectedReceiptInvoice.status === 'Completed' || selectedReceiptInvoice.status === 'Paid'
                        ? selectedReceiptInvoice.amount
                        : selectedReceiptInvoice.amount * 0.5,
                    paymentMethod: selectedReceiptInvoice.paymentMethod,
                    status: selectedReceiptInvoice.status,
                    insuranceProvider: selectedReceiptInvoice.insuranceProvider,
                    claimId: selectedReceiptInvoice.claimId,
                    partialReason: selectedReceiptInvoice.partialReason,
                    nextPaymentDate: selectedReceiptInvoice.nextPaymentDate,
                  })
                }
                className="flex items-center space-x-1.5 px-3.5 py-2 bg-teal-800 hover:bg-teal-900 text-white font-semibold text-xs rounded-xl transition shadow-xs cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Official Receipt</span>
              </button>
              <button
                onClick={() => setSelectedReceiptInvoice(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
