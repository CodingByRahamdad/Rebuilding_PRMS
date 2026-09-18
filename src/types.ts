export type UserRole = 'admin' | 'doctor' | 'nurse' | 'receptionist' | 'patient';

export type RoleType = 'Super Admin' | 'Doctor' | 'Nurse' | 'Receptionist' | 'Billing Officer';

export interface UserRoleProfile {
  id: UserRole;
  name: string;
  title: string;
  avatar: string;
  badgeColor: string;
  permissions: string[];
  description: string;
}

export type NavigationTab =
  | 'dashboard'
  | 'analytics'
  | 'patients'
  | 'doctors'
  | 'nurses'
  | 'receptionists'
  | 'appointments'
  | 'medical-records'
  | 'staff-depts'
  | 'payments'
  | 'services'
  | 'profile'
  | 'settings';

export type TimeRange = 'today' | 'week' | 'month';

export type AppointmentStatus = 'Pending' | 'Completed' | 'Confirmed' | 'Cancelled';

export type AppointmentType = 'Procedure' | 'Check-up' | 'Consultation' | 'Follow-up';

export interface Appointment {
  id: string;
  time: string;
  patientName: string;
  patientInitials?: string;
  patientId: string;
  doctorName: string;
  doctorId?: string;
  department: string;
  type: AppointmentType;
  status: AppointmentStatus;
  date: string;
  notes?: string;
}

export interface ActivityItem {
  id: string;
  timeAgo: string;
  author: string;
  role: string;
  action: string;
  target: string;
  timestamp: string;
}

export interface Prescription {
  id: string;
  medicineName: string;
  dosage: string;
  frequency: string;
  duration: string;
  prescribedBy: string;
  startDate: string;
  endDate: string;
  status: 'Active' | 'Completed' | 'Discontinued';
  instructions?: string;
  outcomeResult?: string;
}

export interface ReportAttachment {
  id?: string;
  name: string;
  url: string;
  size?: string;
  type?: 'pdf' | 'image' | 'document' | string;
}

export interface PatientReport {
  id: string;
  title: string;
  date: string;
  category?: 'Laboratory' | 'Radiology' | 'Pathology' | 'Cardiology' | 'Prescription' | 'Discharge Summary' | string;
  doctor?: string;
  doctorName?: string;
  status: 'Active' | 'Pending Review' | 'Archived' | 'Finalized' | 'Completed' | string;
  diagnosis?: string;
  summary?: string;
  notes?: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number | string;
  fileUrl?: string;
  attachments?: ReportAttachment[];
  uploadedAt?: string;
  structuredData?: {
    diagnosis?: string;
    summary?: string;
  };
}

export interface PatientBillingRecord {
  id: string;
  invoiceNumber: string;
  date: string;
  description: string;
  totalAmount: number;
  paidAmount: number;
  status: 'Paid' | 'Pending' | 'Partial' | 'Insurance Claim';
  insuranceProvider?: string;
  paymentMethod?: string;
  partialReason?: string;
  nextPaymentDate?: string;
}

export interface VisitHistoryItem {
  id: string;
  date: string;
  visitType: 'Outpatient' | 'Admission' | 'Emergency' | 'Follow-up';
  doctorName: string;
  department: string;
  diagnosis: string;
  notes: string;
}

export interface Patient {
  id: string;
  patientCode: string;
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  department: string;
  doctor: string;
  room: string;
  status: 'Admitted' | 'Outpatient' | 'Discharged' | 'Emergency';
  admissionDate: string;
  bloodType: string;
  condition: string;
  phone: string;
  email: string;
  password?: string;
  avatar?: string;
  address?: string;
  emergencyContact?: {
    name: string;
    relation: string;
    phone: string;
  };
  allergies?: string[];
  medicalHistory?: VisitHistoryItem[];
  prescriptions?: Prescription[];
  reports?: PatientReport[];
  billingInvoices?: PatientBillingRecord[];
  vitals?: {
    bloodPressure: string;
    heartRate: number;
    temperature: number;
    oxygenSaturation: number;
  };
}

export interface DoctorScheduleDay {
  day: string;
  shift: string;
  location: string;
}

export interface DoctorReview {
  id: string;
  patientName: string;
  rating: number; // 1 to 5
  comment: string;
  date: string;
}

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  department: string;
  status: 'On Duty' | 'In Surgery' | 'On Leave' | 'Available';
  patientsCount: number;
  rating: number;
  phone: string;
  email: string;
  password?: string;
  avatar?: string;
  age?: number;
  address?: string;
  degrees?: string;
  experienceYears?: number;
  bio?: string;
  expertise?: string[];
  officeRoom?: string;
  dutySchedule?: DoctorScheduleDay[];
  languages?: string[];
  reviews?: DoctorReview[];
}

export interface Nurse {
  id: string;
  nurseCode: string;
  name: string;
  avatar?: string;
  role: string;
  department: string;
  shift: 'Morning (07:00 - 15:00)' | 'Evening (15:00 - 23:00)' | 'Night (23:00 - 07:00)' | string;
  status: 'On Duty' | 'On Break' | 'Off Duty' | 'In Ward' | string;
  assignedWard: string;
  patientLoad: number;
  phone: string;
  email: string;
  address?: string;
  age?: number;
  assignedPatientIds?: string[];
  password?: string;
  experienceYears: number;
  certifications: string[];
  rating?: number;
  reviews?: DoctorReview[];
  dutySchedule?: DoctorScheduleDay[];
  degrees?: string;
  bio?: string;
  languages?: string[];
}

export interface Receptionist {
  id: string;
  staffCode: string;
  name: string;
  avatar?: string;
  deskLocation: string;
  shift: 'Morning Shift' | 'Evening Shift' | 'Night Shift' | string;
  status: 'Active' | 'On Break' | 'Off Duty' | string;
  checkInsToday: number;
  extension: string;
  phone: string;
  email: string;
  address?: string;
  password?: string;
  languages: string[];
  rating?: number;
  reviews?: DoctorReview[];
  dutySchedule?: DoctorScheduleDay[];
  experienceYears?: number;
  bio?: string;
  certifications?: string[];
  todaysTasks?: string[];
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  recipientId: string;
  recipientName: string;
  text: string;
  timestamp: string;
  isSender: boolean;
}

export interface Department {
  id?: string;
  name: string;
  head?: string;
  floor?: string;
  rooms?: number;
  contact?: string;
  color?: string;
}

export interface BedOccupancy {
  rate: number;
  occupied: number;
  total: number;
}

export interface DepartmentBedStatus {
  department: string;
  occupied: number;
  total: number;
  percentage: number;
  color: string;
}

export interface PatientVisitData {
  month: string;
  outpatient: number;
  emergency: number;
}

export interface DepartmentDistributionData {
  name: string;
  value: number;
  percentage: number;
  color: string;
}

export interface WeeklyAdmissionData {
  day: string;
  shortDay: string;
  admissions: number;
}

export interface MedicalRecord {
  id: string;
  recordCode: string;
  patientName: string;
  patientId: string;
  doctorName: string;
  date: string;
  diagnosis: string;
  treatment: string;
  prescription: string;
  status: 'Active' | 'Archived' | 'Pending Review' | 'Completed' | string;
  reportType?: string;
  category?: string;
  labResultSummary?: string;
  attachments?: ReportAttachment[] | any[];
  vitals?: {
    bloodPressure: string;
    heartRate: string;
    temp: string;
  };
}

export interface PaymentTransaction {
  id: string;
  invoiceNo: string;
  patientName: string;
  patientId: string;
  amount: number;
  paidAmount?: number;
  serviceType: string;
  date: string;
  paymentMethod: 'Credit Card' | 'Insurance Claim' | 'Bank Wire' | 'Cash' | 'Apple Pay' | 'Insurance Direct' | 'Bank Transfer' | string;
  status: 'Completed' | 'Pending' | 'Partial' | 'Failed' | 'Refunded' | 'Insurance Claim' | 'Paid' | string;
  insuranceProvider?: string;
  claimId?: string;
  partialReason?: string;
  nextPaymentDate?: string;
}

export interface HospitalServiceItem {
  id: string;
  code: string;
  name: string;
  category: 'Consultation' | 'Diagnostics & Labs' | 'Surgery & Procedures' | 'Emergency' | 'Therapy & Rehab' | 'Pharmacy';
  cost: number;
  department: string;
  durationMinutes: number;
  status: 'Active' | 'Inactive';
  description: string;
}

export interface AuthProfile {
  id: string;
  name: string;
  email: string;
  role: 'Super Admin' | 'Doctor' | 'Nurse' | 'Receptionist' | 'Billing Officer';
  title: string;
  department: string;
  phone: string;
  avatar: string;
  badgeColor: string;
  permissions: string[];
}

