import bcrypt from 'bcryptjs';
import { initialPatients, initialDoctors } from '../data/mockData';

export interface InMemoryUser {
  _id: string;
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: 'Super Admin' | 'Doctor' | 'Nurse' | 'Receptionist' | 'Patient';
  avatar?: string;
  status: 'Active' | 'On Leave' | 'Inactive';
  phone: string;
  refreshToken?: string | null;
  passwordResetTokenHash?: string | null;
  passwordResetExpires?: Date | null;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface InMemoryPatient {
  _id: string;
  id: string;
  patientCode: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  age: number;
  dateOfBirth: string;
  gender: 'Male' | 'Female' | 'Other';
  bloodGroup: string;
  bloodType: string;
  address: string;
  department: string;
  doctor: string;
  room: string;
  condition: string;
  admissionDate: string;
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  medicalHistory: any[];
  allergies: string[];
  insuranceProvider?: string;
  insurancePolicyNumber?: string;
  prescriptions: any[];
  reports: any[];
  billingInvoices: any[];
  vitals: {
    bloodPressure: string;
    heartRate: number;
    temperature: number;
    oxygenSaturation: number;
  };
  status: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface InMemoryDoctor {
  _id: string;
  id: string;
  userId?: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  age?: number;
  address?: string;
  specialization: string;
  department: string;
  licenseNumber: string;
  experience: string;
  consultationFee: number;
  availability: string;
  status: 'Active' | 'On Leave' | 'Inactive';
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface InMemoryAppointment {
  _id: string;
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  department: string;
  date: string;
  time: string;
  type: 'In-Person' | 'Online Consultation' | 'Emergency' | 'Follow-up';
  status: 'Pending' | 'Confirmed' | 'In Progress' | 'Completed' | 'Cancelled';
  symptoms: string;
  notes?: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface InMemoryMedicalRecord {
  _id: string;
  id: string;
  recordCode?: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  date: string;
  diagnosis: string;
  symptoms: string[];
  treatment?: string;
  prescription: any[];
  labResults: any[];
  vitalSigns?: any;
  reportType?: string;
  category?: string;
  labResultSummary?: string;
  attachments?: any[];
  status?: string;
  notes?: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface InMemoryPayment {
  _id: string;
  id: string;
  invoiceCode?: string;
  invoiceNo?: string;
  patientId: string;
  patientName: string;
  serviceName: string;
  serviceType?: string;
  amount: number;
  paidAmount?: number;
  status: 'Paid' | 'Pending' | 'Overdue' | 'Partially Paid' | 'Cancelled' | 'Completed' | 'Partial' | 'Insurance Claim' | 'Failed';
  date: string;
  dueDate: string;
  paymentMethod: 'Cash' | 'Credit Card' | 'Debit Card' | 'Insurance' | 'Online / Bank Transfer' | 'Apple Pay' | 'Bank Wire' | 'Insurance Direct' | 'Bank Transfer' | any;
  transactionId?: string;
  insuranceProvider?: string;
  claimId?: string;
  partialReason?: string;
  nextPaymentDate?: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Pre-computed bcrypt hash for 'Admin123!'
const DEFAULT_PASSWORD_HASH = bcrypt.hashSync('Admin123!', 10);

class MemoryStore {
  private static instance: MemoryStore;

  public users: InMemoryUser[] = [];
  public patients: InMemoryPatient[] = [];
  public doctors: InMemoryDoctor[] = [];
  public appointments: InMemoryAppointment[] = [];
  public medicalRecords: InMemoryMedicalRecord[] = [];
  public payments: InMemoryPayment[] = [];
  public services: any[] = [];
  public activityLogs: any[] = [];

  private constructor() {
    this.seedDefaultData();
  }

  public static getInstance(): MemoryStore {
    if (!MemoryStore.instance) {
      MemoryStore.instance = new MemoryStore();
    }
    return MemoryStore.instance;
  }

  public seedDefaultData() {
    if (process.env.ENABLE_DEMO_MODE === 'false') {
      // In production mode with demo disabled, do not seed mock clinical records, appointments, or staff
      this.users = [
        {
          _id: 'usr-1',
          id: 'usr-1',
          name: 'Dr. Alex Morgan',
          email: 'alex.morgan@prms.hospital',
          passwordHash: DEFAULT_PASSWORD_HASH,
          role: 'Super Admin',
          phone: '+1 (555) 019-2834',
          avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80',
          status: 'Active',
          isDeleted: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      this.patients = [];
      this.doctors = [];
      this.appointments = [];
      this.medicalRecords = [];
      this.payments = [];
      this.services = [];
      this.activityLogs = [];
      return;
    }

    // 1. Users
    this.users = [
      {
        _id: 'usr-1',
        id: 'usr-1',
        name: 'Dr. Alex Morgan',
        email: 'alex.morgan@prms.hospital',
        passwordHash: DEFAULT_PASSWORD_HASH,
        role: 'Super Admin',
        phone: '+1 (555) 019-2834',
        avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80',
        status: 'Active',
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: 'usr-2',
        id: 'usr-2',
        name: 'Dr. Sarah Jenkins',
        email: 'sarah.jenkins@prms.hospital',
        passwordHash: DEFAULT_PASSWORD_HASH,
        role: 'Doctor',
        phone: '+1 (555) 392-8102',
        avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&auto=format&fit=crop&q=80',
        status: 'Active',
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: 'usr-3',
        id: 'usr-3',
        name: 'Nurse Clara Oswald',
        email: 'clara.oswald@prms.hospital',
        passwordHash: DEFAULT_PASSWORD_HASH,
        role: 'Nurse',
        phone: '+1 (555) 482-9910',
        avatar: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=150&auto=format&fit=crop&q=80',
        status: 'Active',
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: 'usr-4',
        id: 'usr-4',
        name: 'David Miller',
        email: 'david.miller@prms.hospital',
        passwordHash: DEFAULT_PASSWORD_HASH,
        role: 'Receptionist',
        phone: '+1 (555) 771-3342',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        status: 'Active',
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: 'usr-5',
        id: 'usr-5',
        name: 'Ines Williams',
        email: 'ines.williams@example.com',
        passwordHash: DEFAULT_PASSWORD_HASH,
        role: 'Patient',
        phone: '+1 (555) 234-5678',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
        status: 'Active',
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    // 2. Doctors (populated dynamically from initialDoctors)
    this.doctors = initialDoctors.map((d, idx) => ({
      _id: d.id || `doc-${idx + 1}`,
      id: d.id || `doc-${idx + 1}`,
      userId: `usr-doc-${idx + 1}`,
      name: d.name,
      email: d.email || `${d.name.toLowerCase().replace(/[^a-z0-9]/g, '.')}@meridianhealth.org`,
      phone: d.phone || '+1 (555) 000-0000',
      avatar: d.avatar || '',
      age: d.age || 45,
      address: d.address || '742 Evergreen Terrace, Springfield, OR',
      specialization: d.specialty || 'General Medicine',
      department: d.department || 'General Medicine',
      licenseNumber: `MD-${88000 + idx}`,
      experience: `${d.experienceYears || 12} Years`,
      consultationFee: 200,
      availability: d.dutySchedule?.[0] ? `${d.dutySchedule[0].day}, ${d.dutySchedule[0].shift}` : 'Mon-Fri, 08:30 AM - 04:30 PM',
      status: d.status === 'On Duty' || d.status === 'Available' ? 'Active' : d.status === 'On Leave' ? 'On Leave' : 'Active',
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    // 3. Patients (populated dynamically from initialPatients)
    this.patients = initialPatients.map((p, idx) => ({
      _id: p.id || `p-${idx + 1}`,
      id: p.id || `p-${idx + 1}`,
      patientCode: p.patientCode || `PT-0${1001 + idx}`,
      name: p.name,
      email: p.email || `patient${idx + 1}@meridianhealth.org`,
      phone: p.phone || '+1 (555) 000-0000',
      avatar: p.avatar || '',
      age: p.age || 35,
      dateOfBirth: `${2026 - (p.age || 35)}-01-01`,
      gender: (p.gender as 'Male' | 'Female' | 'Other') || 'Female',
      bloodGroup: p.bloodType || 'O+',
      bloodType: p.bloodType || 'O+',
      address: p.address || '742 Evergreen Terrace, Springfield',
      department: p.department || 'General Medicine',
      doctor: p.doctor || 'Dr. Alex Morgan',
      room: p.room || 'Room 101',
      condition: p.condition || 'General Observation',
      admissionDate: p.admissionDate || '2026-07-28',
      emergencyContact: {
        name: p.emergencyContact?.name || 'Emergency Contact',
        relationship: (p.emergencyContact as any)?.relationship || (p.emergencyContact as any)?.relation || 'Spouse',
        phone: p.emergencyContact?.phone || '+1 (555) 000-0001',
      },
      medicalHistory: p.medicalHistory || [],
      allergies: p.allergies || [],
      insuranceProvider: (p.billingInvoices && p.billingInvoices[0]?.insuranceProvider) || 'Blue Cross Blue Shield',
      insurancePolicyNumber: `POL-${100000 + idx}`,
      prescriptions: p.prescriptions || [],
      reports: p.reports || [],
      billingInvoices: p.billingInvoices || [],
      vitals: p.vitals || {
        bloodPressure: '120/80',
        heartRate: 72,
        temperature: 98.6,
        oxygenSaturation: 99,
      },
      status: p.status || 'Admitted',
      isDeleted: false,
      createdAt: new Date(p.admissionDate || '2026-07-28'),
      updatedAt: new Date(),
    }));

    // 4. Appointments (Comprehensive set for testing 20 items pagination)
    this.appointments = [
      {
        _id: 'apt-1',
        id: 'apt-1',
        patientId: 'p-1',
        patientName: 'Ines Williams',
        doctorId: 'doc-1',
        doctorName: 'Dr. Sarah Jenkins',
        department: 'Cardiology',
        date: '2026-08-18',
        time: '09:00 AM',
        type: 'In-Person',
        status: 'Pending',
        symptoms: 'Mild chest tightness during exercise.',
        notes: 'Priority morning follow-up on ECG reading.',
        isDeleted: false,
        createdAt: new Date('2026-08-18T08:30:00Z'),
        updatedAt: new Date('2026-08-18T08:30:00Z'),
      },
      {
        _id: 'apt-2',
        id: 'apt-2',
        patientId: 'p-2',
        patientName: 'Robert Vance',
        doctorId: 'doc-2',
        doctorName: 'Dr. Alex Morgan',
        department: 'General Medicine',
        date: '2026-08-18',
        time: '09:30 AM',
        type: 'Follow-up',
        status: 'Pending',
        symptoms: 'Routine 3-month diabetes check-up.',
        notes: 'Fasting blood panel required.',
        isDeleted: false,
        createdAt: new Date('2026-08-18T08:15:00Z'),
        updatedAt: new Date('2026-08-18T08:15:00Z'),
      },
      {
        _id: 'apt-3',
        id: 'apt-3',
        patientId: 'p-3',
        patientName: 'Elena Rostova',
        doctorId: 'doc-3',
        doctorName: 'Dr. Kenji Tanaka',
        department: 'Orthopedics',
        date: '2026-08-18',
        time: '10:15 AM',
        type: 'In-Person',
        status: 'Pending',
        symptoms: 'Post-operative knee recovery review.',
        notes: 'Patient requested walking mobility assessment.',
        isDeleted: false,
        createdAt: new Date('2026-08-18T07:45:00Z'),
        updatedAt: new Date('2026-08-18T07:45:00Z'),
      },
      {
        _id: 'apt-4',
        id: 'apt-4',
        patientId: 'p-4',
        patientName: 'Marcus Aurelius',
        doctorId: 'doc-4',
        doctorName: 'Dr. Naomi Chen',
        department: 'Dermatology',
        date: '2026-08-18',
        time: '11:00 AM',
        type: 'In-Person',
        status: 'Pending',
        symptoms: 'Skin lesion evaluation on forearm.',
        notes: 'Dermoscopy screening requested.',
        isDeleted: false,
        createdAt: new Date('2026-08-18T07:30:00Z'),
        updatedAt: new Date('2026-08-18T07:30:00Z'),
      },
      {
        _id: 'apt-5',
        id: 'apt-5',
        patientId: 'p-5',
        patientName: 'Amina Diallo',
        doctorId: 'doc-5',
        doctorName: 'Dr. Aisha Patel',
        department: 'Pediatrics',
        date: '2026-08-18',
        time: '11:30 AM',
        type: 'In-Person',
        status: 'Pending',
        symptoms: 'Infant routine wellness and vaccination schedule.',
        notes: '6-month booster immunization.',
        isDeleted: false,
        createdAt: new Date('2026-08-18T07:00:00Z'),
        updatedAt: new Date('2026-08-18T07:00:00Z'),
      },
      {
        _id: 'apt-6',
        id: 'apt-6',
        patientId: 'p-1',
        patientName: 'Ines Williams',
        doctorId: 'doc-1',
        doctorName: 'Dr. Sarah Jenkins',
        department: 'Cardiology',
        date: '2026-08-17',
        time: '02:00 PM',
        type: 'In-Person',
        status: 'Confirmed',
        symptoms: 'Blood pressure monitoring review.',
        notes: 'Hypertension maintenance protocol.',
        isDeleted: false,
        createdAt: new Date('2026-08-17T10:00:00Z'),
        updatedAt: new Date('2026-08-17T10:00:00Z'),
      },
      {
        _id: 'apt-7',
        id: 'apt-7',
        patientId: 'p-2',
        patientName: 'Robert Vance',
        doctorId: 'doc-2',
        doctorName: 'Dr. Alex Morgan',
        department: 'General Medicine',
        date: '2026-08-17',
        time: '03:30 PM',
        type: 'Online Consultation',
        status: 'Confirmed',
        symptoms: 'Telehealth follow-up on insulin dosage adjustments.',
        notes: 'Video consultation link sent to patient email.',
        isDeleted: false,
        createdAt: new Date('2026-08-17T09:00:00Z'),
        updatedAt: new Date('2026-08-17T09:00:00Z'),
      },
      {
        _id: 'apt-8',
        id: 'apt-8',
        patientId: 'p-3',
        patientName: 'Elena Rostova',
        doctorId: 'doc-6',
        doctorName: 'Dr. David Okonkwo',
        department: 'General Surgery',
        date: '2026-08-17',
        time: '04:00 PM',
        type: 'In-Person',
        status: 'Confirmed',
        symptoms: 'Pre-operative clearance consultation.',
        notes: 'Surgical consent documentation prepared.',
        isDeleted: false,
        createdAt: new Date('2026-08-17T08:30:00Z'),
        updatedAt: new Date('2026-08-17T08:30:00Z'),
      },
      {
        _id: 'apt-9',
        id: 'apt-9',
        patientId: 'p-4',
        patientName: 'Marcus Aurelius',
        doctorId: 'doc-1',
        doctorName: 'Dr. Sarah Jenkins',
        department: 'Cardiology',
        date: '2026-08-16',
        time: '10:00 AM',
        type: 'In-Person',
        status: 'Confirmed',
        symptoms: 'Holter monitor diagnostic readout.',
        notes: '24-hour cardiac rhythm analysis.',
        isDeleted: false,
        createdAt: new Date('2026-08-16T11:00:00Z'),
        updatedAt: new Date('2026-08-16T11:00:00Z'),
      },
      {
        _id: 'apt-10',
        id: 'apt-10',
        patientId: 'p-5',
        patientName: 'Amina Diallo',
        doctorId: 'doc-4',
        doctorName: 'Dr. Naomi Chen',
        department: 'Dermatology',
        date: '2026-08-16',
        time: '11:45 AM',
        type: 'In-Person',
        status: 'Confirmed',
        symptoms: 'Allergic contact dermatitis flare-up.',
        notes: 'Topical steroid treatment prescribed.',
        isDeleted: false,
        createdAt: new Date('2026-08-16T09:00:00Z'),
        updatedAt: new Date('2026-08-16T09:00:00Z'),
      },
      {
        _id: 'apt-11',
        id: 'apt-11',
        patientId: 'p-1',
        patientName: 'Ines Williams',
        doctorId: 'doc-3',
        doctorName: 'Dr. Kenji Tanaka',
        department: 'Orthopedics',
        date: '2026-08-15',
        time: '01:15 PM',
        type: 'In-Person',
        status: 'Completed',
        symptoms: 'Lumbar spine ergonomic evaluation.',
        notes: 'Physical therapy referral issued.',
        isDeleted: false,
        createdAt: new Date('2026-08-15T12:00:00Z'),
        updatedAt: new Date('2026-08-15T14:00:00Z'),
      },
      {
        _id: 'apt-12',
        id: 'apt-12',
        patientId: 'p-2',
        patientName: 'Robert Vance',
        doctorId: 'doc-5',
        doctorName: 'Dr. Aisha Patel',
        department: 'General Medicine',
        date: '2026-08-15',
        time: '02:30 PM',
        type: 'In-Person',
        status: 'Completed',
        symptoms: 'Seasonal allergy assessment and antihistamine review.',
        notes: 'Prescription renewed for 60 days.',
        isDeleted: false,
        createdAt: new Date('2026-08-15T10:00:00Z'),
        updatedAt: new Date('2026-08-15T15:30:00Z'),
      },
      {
        _id: 'apt-13',
        id: 'apt-13',
        patientId: 'p-3',
        patientName: 'Elena Rostova',
        doctorId: 'doc-2',
        doctorName: 'Dr. Alex Morgan',
        department: 'General Medicine',
        date: '2026-08-14',
        time: '09:00 AM',
        type: 'In-Person',
        status: 'Completed',
        symptoms: 'Annual executive physical examination.',
        notes: 'Full metabolic panel completed.',
        isDeleted: false,
        createdAt: new Date('2026-08-14T08:00:00Z'),
        updatedAt: new Date('2026-08-14T10:30:00Z'),
      },
      {
        _id: 'apt-14',
        id: 'apt-14',
        patientId: 'p-4',
        patientName: 'Marcus Aurelius',
        doctorId: 'doc-6',
        doctorName: 'Dr. David Okonkwo',
        department: 'General Surgery',
        date: '2026-08-14',
        time: '11:00 AM',
        type: 'In-Person',
        status: 'Completed',
        symptoms: 'Post-surgical incision inspection.',
        notes: 'Wound healing well, sutures removed.',
        isDeleted: false,
        createdAt: new Date('2026-08-14T09:30:00Z'),
        updatedAt: new Date('2026-08-14T11:45:00Z'),
      },
      {
        _id: 'apt-15',
        id: 'apt-15',
        patientId: 'p-5',
        patientName: 'Amina Diallo',
        doctorId: 'doc-1',
        doctorName: 'Dr. Sarah Jenkins',
        department: 'Cardiology',
        date: '2026-08-13',
        time: '03:00 PM',
        type: 'In-Person',
        status: 'Completed',
        symptoms: 'Stress echocardiogram screening.',
        notes: 'Normal sinus rhythm and ejection fraction > 60%.',
        isDeleted: false,
        createdAt: new Date('2026-08-13T13:00:00Z'),
        updatedAt: new Date('2026-08-13T16:00:00Z'),
      },
      {
        _id: 'apt-16',
        id: 'apt-16',
        patientId: 'p-1',
        patientName: 'Ines Williams',
        doctorId: 'doc-4',
        doctorName: 'Dr. Naomi Chen',
        department: 'Dermatology',
        date: '2026-08-12',
        time: '10:30 AM',
        type: 'In-Person',
        status: 'Completed',
        symptoms: 'Routine skin check-up.',
        notes: 'No abnormal melanocytic changes.',
        isDeleted: false,
        createdAt: new Date('2026-08-12T09:00:00Z'),
        updatedAt: new Date('2026-08-12T11:30:00Z'),
      },
      {
        _id: 'apt-17',
        id: 'apt-17',
        patientId: 'p-2',
        patientName: 'Robert Vance',
        doctorId: 'doc-3',
        doctorName: 'Dr. Kenji Tanaka',
        department: 'Orthopedics',
        date: '2026-08-11',
        time: '04:15 PM',
        type: 'In-Person',
        status: 'Completed',
        symptoms: 'Right shoulder rotator cuff strain.',
        notes: 'Recommended physical therapy twice weekly.',
        isDeleted: false,
        createdAt: new Date('2026-08-11T14:00:00Z'),
        updatedAt: new Date('2026-08-11T17:00:00Z'),
      },
      {
        _id: 'apt-18',
        id: 'apt-18',
        patientId: 'p-3',
        patientName: 'Elena Rostova',
        doctorId: 'doc-5',
        doctorName: 'Dr. Aisha Patel',
        department: 'Pediatrics',
        date: '2026-08-10',
        time: '08:30 AM',
        type: 'In-Person',
        status: 'Completed',
        symptoms: 'Family pediatric consultation.',
        notes: 'Childhood growth chart on target.',
        isDeleted: false,
        createdAt: new Date('2026-08-10T08:00:00Z'),
        updatedAt: new Date('2026-08-10T09:30:00Z'),
      },
      {
        _id: 'apt-19',
        id: 'apt-19',
        patientId: 'p-4',
        patientName: 'Marcus Aurelius',
        doctorId: 'doc-2',
        doctorName: 'Dr. Alex Morgan',
        department: 'General Medicine',
        date: '2026-08-09',
        time: '02:00 PM',
        type: 'In-Person',
        status: 'Completed',
        symptoms: 'Mild respiratory congestion and cough.',
        notes: 'Prescribed saline nebulizer and rest.',
        isDeleted: false,
        createdAt: new Date('2026-08-09T11:00:00Z'),
        updatedAt: new Date('2026-08-09T15:00:00Z'),
      },
      {
        _id: 'apt-20',
        id: 'apt-20',
        patientId: 'p-5',
        patientName: 'Amina Diallo',
        doctorId: 'doc-6',
        doctorName: 'Dr. David Okonkwo',
        department: 'General Surgery',
        date: '2026-08-08',
        time: '09:45 AM',
        type: 'In-Person',
        status: 'Completed',
        symptoms: 'Abdominal pain ultrasound follow-up.',
        notes: 'Gallbladder ultrasound normal.',
        isDeleted: false,
        createdAt: new Date('2026-08-08T08:30:00Z'),
        updatedAt: new Date('2026-08-08T11:00:00Z'),
      },
      {
        _id: 'apt-21',
        id: 'apt-21',
        patientId: 'p-1',
        patientName: 'Ines Williams',
        doctorId: 'doc-2',
        doctorName: 'Dr. Alex Morgan',
        department: 'General Medicine',
        date: '2026-08-07',
        time: '11:15 AM',
        type: 'In-Person',
        status: 'Cancelled',
        symptoms: 'Patient reschedule request due to business travel.',
        notes: 'Rescheduled to August 18.',
        isDeleted: false,
        createdAt: new Date('2026-08-07T09:00:00Z'),
        updatedAt: new Date('2026-08-07T10:00:00Z'),
      },
      {
        _id: 'apt-22',
        id: 'apt-22',
        patientId: 'p-2',
        patientName: 'Robert Vance',
        doctorId: 'doc-4',
        doctorName: 'Dr. Naomi Chen',
        department: 'Dermatology',
        date: '2026-08-06',
        time: '01:00 PM',
        type: 'In-Person',
        status: 'Cancelled',
        symptoms: 'Scheduling conflict.',
        notes: 'Cancelled with 24 hours notice.',
        isDeleted: false,
        createdAt: new Date('2026-08-06T10:00:00Z'),
        updatedAt: new Date('2026-08-06T12:00:00Z'),
      },
      {
        _id: 'apt-23',
        id: 'apt-23',
        patientId: 'p-3',
        patientName: 'Elena Rostova',
        doctorId: 'doc-1',
        doctorName: 'Dr. Sarah Jenkins',
        department: 'Cardiology',
        date: '2026-08-05',
        time: '03:45 PM',
        type: 'In-Person',
        status: 'Completed',
        symptoms: 'Lipid panel assessment.',
        notes: 'Cholesterol levels within optimal limits.',
        isDeleted: false,
        createdAt: new Date('2026-08-05T13:00:00Z'),
        updatedAt: new Date('2026-08-05T16:30:00Z'),
      },
      {
        _id: 'apt-24',
        id: 'apt-24',
        patientId: 'p-4',
        patientName: 'Marcus Aurelius',
        doctorId: 'doc-3',
        doctorName: 'Dr. Kenji Tanaka',
        department: 'Orthopedics',
        date: '2026-08-04',
        time: '10:00 AM',
        type: 'In-Person',
        status: 'Completed',
        symptoms: 'Wrist sprain rehabilitation check.',
        notes: 'Splint removed, gentle exercises advised.',
        isDeleted: false,
        createdAt: new Date('2026-08-04T09:00:00Z'),
        updatedAt: new Date('2026-08-04T11:00:00Z'),
      },
      {
        _id: 'apt-25',
        id: 'apt-25',
        patientId: 'p-5',
        patientName: 'Amina Diallo',
        doctorId: 'doc-2',
        doctorName: 'Dr. Alex Morgan',
        department: 'General Medicine',
        date: '2026-08-03',
        time: '02:30 PM',
        type: 'In-Person',
        status: 'Completed',
        symptoms: 'Routine biometric health screening.',
        notes: 'Vitals and biomarkers all normal.',
        isDeleted: false,
        createdAt: new Date('2026-08-03T11:00:00Z'),
        updatedAt: new Date('2026-08-03T15:15:00Z'),
      },
    ];

    // 5. Medical Records (25+ items to support 10 per page pagination)
    this.medicalRecords = [
      {
        _id: 'rec-1',
        id: 'rec-1',
        recordCode: 'MR-2026-081',
        patientId: 'p-1',
        patientName: 'Ines Williams',
        doctorId: 'doc-1',
        doctorName: 'Dr. Liam Reynolds',
        date: '2026-07-28',
        diagnosis: 'Supraventricular Tachycardia (SVT)',
        symptoms: ['Palpitations', 'Chest Tightness', 'Dizziness'],
        treatment: 'Continuous ECG telemetry monitoring and Beta-blocker titration.',
        prescription: [
          { medication: 'Metoprolol Succinate ER', dosage: '25mg', frequency: 'Once Daily (OD)', duration: '30 Days' },
          { medication: 'Aspirin Low Dose', dosage: '81mg', frequency: 'Once Daily (OD)', duration: '90 Days' },
        ],
        labResults: [
          { testName: '12-Lead ECG', result: 'Sinus rhythm with occasional PACs', date: '2026-07-28', normalRange: 'Sinus rhythm', status: 'Normal' },
          { testName: 'Lipid Panel', result: '195 mg/dL', date: '2026-07-27', normalRange: '< 200 mg/dL', status: 'Normal' },
        ],
        reportType: '12-Lead Electrocardiogram & Telemetry',
        category: 'Cardiology',
        labResultSummary: 'Sinus rhythm, occasional PACs. HR average 88 bpm. Ejection fraction 62%.',
        status: 'Active',
        vitalSigns: { bloodPressure: '128/82', heartRate: '78', temperature: '98.6', weight: '68', height: '168' },
        notes: 'Telemetry continuous tracking established. Patient reports symptom relief.',
        isDeleted: false,
        createdAt: new Date('2026-07-28T14:30:00Z'),
        updatedAt: new Date('2026-07-28T14:30:00Z'),
      },
      {
        _id: 'rec-2',
        id: 'rec-2',
        recordCode: 'MR-2026-079',
        patientId: 'p-2',
        patientName: 'Kwame Kware',
        doctorId: 'doc-4',
        doctorName: 'Dr. Sarah Chen',
        date: '2026-07-28',
        diagnosis: 'Generalized Anxiety Disorder',
        symptoms: ['Restlessness', 'Insomnia', 'Muscle Tension'],
        treatment: 'Cognitive Behavioral Therapy session #4 and selective serotonin reuptake inhibitor continuation.',
        prescription: [
          { medication: 'Sertraline HCl', dosage: '50mg', frequency: 'Once Daily (Morning)', duration: '60 Days' },
        ],
        labResults: [
          { testName: 'GAD-7 Anxiety Scale', result: 'Score 8 (Mild)', date: '2026-07-28', normalRange: '< 5', status: 'Normal' },
        ],
        reportType: 'Psychometric Stress & Anxiety Score Index',
        category: 'Psychiatry',
        labResultSummary: 'GAD-7 score reduced from 16 to 8 (Moderate to Mild). Positive therapy response.',
        status: 'Active',
        vitalSigns: { bloodPressure: '118/76', heartRate: '72', temperature: '98.4', weight: '76', height: '180' },
        notes: 'Sleep hygiene routine implemented. Next session in 3 weeks.',
        isDeleted: false,
        createdAt: new Date('2026-07-28T11:00:00Z'),
        updatedAt: new Date('2026-07-28T11:00:00Z'),
      },
      {
        _id: 'rec-3',
        id: 'rec-3',
        recordCode: 'MR-2026-075',
        patientId: 'p-3',
        patientName: 'Elia Harris',
        doctorId: 'doc-3',
        doctorName: 'Dr. Kenji Tanaka',
        date: '2026-07-26',
        diagnosis: 'Right Knee Medial Meniscal Tear',
        symptoms: ['Joint Line Tenderness', 'Knee Locking', 'Localized Swelling'],
        treatment: 'Arthroscopic Partial Meniscectomy followed by guided physical therapy.',
        prescription: [
          { medication: 'Ibuprofen', dosage: '400mg', frequency: 'Three Times Daily (TDS)', duration: '14 Days' },
        ],
        labResults: [
          { testName: 'Right Knee High-Res MRI', result: 'Complex tear posterior horn medial meniscus', date: '2026-07-25', normalRange: 'Intact meniscus', status: 'Abnormal' },
        ],
        reportType: 'Knee MRI & Post-Op Orthopedic Radiograph',
        category: 'Orthopedics',
        labResultSummary: 'Medial meniscus partial resection completed cleanly. Articular cartilage intact.',
        status: 'Active',
        vitalSigns: { bloodPressure: '122/80', heartRate: '68', temperature: '98.6', weight: '62', height: '165' },
        notes: 'Post-op knee flexion 90 degrees attained with minimal discomfort.',
        isDeleted: false,
        createdAt: new Date('2026-07-26T16:00:00Z'),
        updatedAt: new Date('2026-07-26T16:00:00Z'),
      },
      {
        _id: 'rec-4',
        id: 'rec-4',
        recordCode: 'MR-2026-068',
        patientId: 'p-4',
        patientName: 'David Johnson',
        doctorId: 'doc-6',
        doctorName: 'Dr. David Okonkwo',
        date: '2026-07-25',
        diagnosis: 'Cholelithiasis with Chronic Cholecystitis',
        symptoms: ['Right Upper Quadrant Pain', 'Biliary Colic', 'Nausea post-fatty meal'],
        treatment: 'Elective Laparoscopic Cholecystectomy with standard four-port technique.',
        prescription: [
          { medication: 'Cefuroxime Axetil', dosage: '500mg', frequency: 'Twice Daily (BD)', duration: '7 Days' },
          { medication: 'Paracetamol', dosage: '1000mg', frequency: 'Four Times Daily (QDS)', duration: '5 Days' },
        ],
        labResults: [
          { testName: 'Abdominal Ultrasound', result: 'Multiple acoustic-shadowing stones in gallbladder', date: '2026-07-24', normalRange: 'Acalculous', status: 'Abnormal' },
          { testName: 'Liver Function Panel', result: 'ALT 38 U/L, Bilirubin 0.9 mg/dL', date: '2026-07-25', normalRange: 'ALT < 45 U/L', status: 'Normal' },
        ],
        reportType: 'Surgical Pathology & Abdominal Ultrasound',
        category: 'Surgery',
        labResultSummary: 'Gallbladder histopathology confirmed chronic cholecystitis with cholelithiasis.',
        status: 'Active',
        vitalSigns: { bloodPressure: '124/78', heartRate: '74', temperature: '98.8', weight: '82', height: '178' },
        notes: 'Uneventful recovery. Port wounds clean and dry.',
        isDeleted: false,
        createdAt: new Date('2026-07-25T10:30:00Z'),
        updatedAt: new Date('2026-07-25T10:30:00Z'),
      },
      {
        _id: 'rec-5',
        id: 'rec-5',
        recordCode: 'MR-2026-050',
        patientId: 'p-5',
        patientName: 'Sophia Kim',
        doctorId: 'doc-2',
        doctorName: 'Dr. Ahmed Al-Rashid',
        date: '2026-07-20',
        diagnosis: 'Chronic Migraine with Visual Aura',
        symptoms: ['Unilateral Throbbing Headache', 'Scintillating Scotoma', 'Photophobia'],
        treatment: 'Prophylactic topiramate initiation and rescue triptan protocol.',
        prescription: [
          { medication: 'Sumatriptan Succinate', dosage: '50mg', frequency: 'PRN at onset', duration: '30 Days' },
          { medication: 'Topiramate', dosage: '25mg', frequency: 'Nightly', duration: '60 Days' },
        ],
        labResults: [
          { testName: 'Brain MRI with Contrast', result: 'Unremarkable intracranial structures, no ischemia', date: '2026-07-19', normalRange: 'Normal', status: 'Normal' },
          { testName: 'Standard 32-Channel EEG', result: 'Normal alpha background rhythm, no epileptiform spikes', date: '2026-07-20', normalRange: 'Normal', status: 'Normal' },
        ],
        reportType: 'Brain MRI with Contrast & EEG Analysis',
        category: 'Neurology',
        labResultSummary: 'Normal brain MRI scan. No intracranial lesion or acute infarction.',
        status: 'Completed',
        vitalSigns: { bloodPressure: '112/74', heartRate: '70', temperature: '98.2', weight: '54', height: '162' },
        notes: 'Headache diary issued to track dietary and sleep triggers.',
        isDeleted: false,
        createdAt: new Date('2026-07-20T14:15:00Z'),
        updatedAt: new Date('2026-07-20T14:15:00Z'),
      },
      {
        _id: 'rec-6',
        id: 'rec-6',
        recordCode: 'MR-2026-048',
        patientId: 'p-1',
        patientName: 'Ines Williams',
        doctorId: 'doc-5',
        doctorName: 'Dr. Naomi Chen',
        date: '2026-07-18',
        diagnosis: 'Contact Dermatitis & Eczematous Patch',
        symptoms: ['Pruritic Erythematous Plaque', 'Skin Flaking'],
        treatment: 'Topical hydrocortisone cream and fragrance-free emollient regimen.',
        prescription: [
          { medication: 'Hydrocortisone Valerate Cream 0.2%', dosage: 'Thin film', frequency: 'Twice Daily', duration: '14 Days' },
        ],
        labResults: [
          { testName: 'Skin Allergen Patch Test (80 allergens)', result: 'Positive +2 for Nickel Sulfate', date: '2026-07-17', normalRange: 'Negative', status: 'Abnormal' },
        ],
        reportType: 'Comprehensive Skin Allergen Patch Panel',
        category: 'Dermatology',
        labResultSummary: 'Contact hypersensitivity confirmed for nickel sulfate. Mild reactivity.',
        status: 'Active',
        vitalSigns: { bloodPressure: '120/80', heartRate: '72', temperature: '98.4', weight: '68', height: '168' },
        notes: 'Advised avoiding metallic jewelry and dietary nickel reduction.',
        isDeleted: false,
        createdAt: new Date('2026-07-18T09:45:00Z'),
        updatedAt: new Date('2026-07-18T09:45:00Z'),
      },
      {
        _id: 'rec-7',
        id: 'rec-7',
        recordCode: 'MR-2026-042',
        patientId: 'p-2',
        patientName: 'Robert Vance',
        doctorId: 'doc-2',
        doctorName: 'Dr. Alex Morgan',
        date: '2026-07-15',
        diagnosis: 'Type 2 Diabetes Mellitus with Mild Hyperlipidemia',
        symptoms: ['Polyuria', 'Mild Fatigue', 'Occasional Blurred Vision'],
        treatment: 'Metformin monotherapy and lifestyle glycemic index counseling.',
        prescription: [
          { medication: 'Metformin HCl 500mg', dosage: '500mg', frequency: 'Twice Daily (with meals)', duration: '90 Days' },
          { medication: 'Atorvastatin Calcium', dosage: '20mg', frequency: 'Nightly', duration: '90 Days' },
        ],
        labResults: [
          { testName: 'Hemoglobin A1c (HbA1c)', result: '7.2%', date: '2026-07-14', normalRange: '< 5.7%', status: 'Abnormal' },
          { testName: 'Fasting Plasma Glucose', result: '142 mg/dL', date: '2026-07-14', normalRange: '70-99 mg/dL', status: 'Abnormal' },
          { testName: 'Serum Creatinine', result: '0.9 mg/dL', date: '2026-07-14', normalRange: '0.7-1.3 mg/dL', status: 'Normal' },
        ],
        reportType: 'Comprehensive Metabolic Panel & Glycemic Audit',
        category: 'Laboratory',
        labResultSummary: 'HbA1c 7.2%, fasting glucose 142 mg/dL. Renal indices well preserved.',
        status: 'Active',
        vitalSigns: { bloodPressure: '130/84', heartRate: '76', temperature: '98.6', weight: '88', height: '175' },
        notes: 'Target HbA1c < 6.8% in 3 months. Continuous glucose monitor recommended.',
        isDeleted: false,
        createdAt: new Date('2026-07-15T11:20:00Z'),
        updatedAt: new Date('2026-07-15T11:20:00Z'),
      },
      {
        _id: 'rec-8',
        id: 'rec-8',
        recordCode: 'MR-2026-039',
        patientId: 'p-3',
        patientName: 'Elena Rostova',
        doctorId: 'doc-1',
        doctorName: 'Dr. Sarah Jenkins',
        date: '2026-07-12',
        diagnosis: 'Iron Deficiency Anemia (Mild)',
        symptoms: ['Exertional Fatigue', 'Pallor', 'Brittle Nails'],
        treatment: 'Oral ferrous sulfate supplementation with Vitamin C ascorbic acid booster.',
        prescription: [
          { medication: 'Ferrous Sulfate 325mg', dosage: '325mg (65mg elemental Fe)', frequency: 'Once Daily on empty stomach', duration: '60 Days' },
          { medication: 'Ascorbic Acid (Vitamin C)', dosage: '500mg', frequency: 'Once Daily', duration: '60 Days' },
        ],
        labResults: [
          { testName: 'Complete Blood Count (CBC) - Hemoglobin', result: '10.8 g/dL', date: '2026-07-11', normalRange: '12.0-15.5 g/dL', status: 'Abnormal' },
          { testName: 'Serum Ferritin', result: '14 ng/mL', date: '2026-07-11', normalRange: '20-200 ng/mL', status: 'Abnormal' },
          { testName: 'Total Iron Binding Capacity (TIBC)', result: '420 ug/dL', date: '2026-07-11', normalRange: '250-400 ug/dL', status: 'Abnormal' },
        ],
        reportType: 'Complete Blood Count & Iron Studies Panel',
        category: 'Laboratory',
        labResultSummary: 'Microcytic hypochromic indices consistent with iron depletion. No hemolysis.',
        status: 'Active',
        vitalSigns: { bloodPressure: '116/72', heartRate: '80', temperature: '98.4', weight: '58', height: '166' },
        notes: 'Follow-up CBC scheduled in 8 weeks to assess reticulocyte recovery.',
        isDeleted: false,
        createdAt: new Date('2026-07-12T08:30:00Z'),
        updatedAt: new Date('2026-07-12T08:30:00Z'),
      },
      {
        _id: 'rec-9',
        id: 'rec-9',
        recordCode: 'MR-2026-035',
        patientId: 'p-4',
        patientName: 'Marcus Aurelius',
        doctorId: 'doc-3',
        doctorName: 'Dr. Kenji Tanaka',
        date: '2026-07-10',
        diagnosis: 'Lumbar Spine Spondylosis (L4-L5)',
        symptoms: ['Lower Back Stiffness', 'Radiating Gluteal Discomfort'],
        treatment: 'Core strengthening physical therapy, ergonomic lumbar support, and NSAID therapy.',
        prescription: [
          { medication: 'Meloxicam 15mg', dosage: '15mg', frequency: 'Once Daily with food', duration: '30 Days' },
        ],
        labResults: [
          { testName: 'Lumbar Spine MRI (L1-S1)', result: 'Mild L4-L5 disc desiccation, no nerve root compression', date: '2026-07-09', normalRange: 'No disc protrusion', status: 'Abnormal' },
        ],
        reportType: 'Lumbar Spine Diagnostic MRI & Biomechanical Assessment',
        category: 'Radiology',
        labResultSummary: 'L4-L5 mild disc bulge without thecal sac distortion. Lumbar lordosis preserved.',
        status: 'Active',
        vitalSigns: { bloodPressure: '126/82', heartRate: '70', temperature: '98.5', weight: '85', height: '183' },
        notes: 'Recommended twice-weekly physical therapy and 30-minute daily walking.',
        isDeleted: false,
        createdAt: new Date('2026-07-10T13:45:00Z'),
        updatedAt: new Date('2026-07-10T13:45:00Z'),
      },
      {
        _id: 'rec-10',
        id: 'rec-10',
        recordCode: 'MR-2026-030',
        patientId: 'p-5',
        patientName: 'Amina Diallo',
        doctorId: 'doc-1',
        doctorName: 'Dr. Sarah Jenkins',
        date: '2026-07-08',
        diagnosis: 'Atypical Non-Cardiac Chest Pain',
        symptoms: ['Intermittent Sharp Chest Discomfort', 'Acid Reflux'],
        treatment: 'Gastroesophageal reflux trial with proton pump inhibitor and dietary adjustment.',
        prescription: [
          { medication: 'Pantoprazole Sodium 40mg', dosage: '40mg', frequency: 'Once Daily 30 mins before breakfast', duration: '30 Days' },
        ],
        labResults: [
          { testName: 'Cardiac Troponin I (High Sensitivity)', result: '< 3 ng/L', date: '2026-07-08', normalRange: '< 14 ng/L', status: 'Normal' },
          { testName: 'Transthoracic Echocardiogram (TTE)', result: 'Normal LV cavity size, EF 65%', date: '2026-07-08', normalRange: 'EF > 55%', status: 'Normal' },
        ],
        reportType: 'Cardiac Troponin Biomarkers & Echocardiography',
        category: 'Cardiology',
        labResultSummary: 'Normal troponin series, negative acute coronary syndrome. Normal wall motion.',
        status: 'Completed',
        vitalSigns: { bloodPressure: '118/74', heartRate: '68', temperature: '98.6', weight: '60', height: '170' },
        notes: 'Cardiac pathology ruled out; symptoms consistent with GERD.',
        isDeleted: false,
        createdAt: new Date('2026-07-08T15:00:00Z'),
        updatedAt: new Date('2026-07-08T15:00:00Z'),
      },
      {
        _id: 'rec-11',
        id: 'rec-11',
        recordCode: 'MR-2026-028',
        patientId: 'p-1',
        patientName: 'Ines Williams',
        doctorId: 'doc-2',
        doctorName: 'Dr. Alex Morgan',
        date: '2026-07-05',
        diagnosis: 'Routine Executive Biometric Examination',
        symptoms: ['Asymptomatic routine preventive checkup'],
        treatment: 'Dietary guidance and annual vaccination review.',
        prescription: [],
        labResults: [
          { testName: 'Comprehensive Wellness Profile (36 biomarkers)', result: 'All parameters within optimal range', date: '2026-07-04', normalRange: 'Optimal', status: 'Normal' },
        ],
        reportType: 'Executive Preventive Health & Biometric Audit',
        category: 'Clinical Summary',
        labResultSummary: 'Optimal cardio-metabolic markers. BMI 24.1, lipid ratio 3.2.',
        status: 'Completed',
        vitalSigns: { bloodPressure: '120/78', heartRate: '70', temperature: '98.6', weight: '68', height: '168' },
        notes: 'Annual executive checkup verified and signed off.',
        isDeleted: false,
        createdAt: new Date('2026-07-05T09:00:00Z'),
        updatedAt: new Date('2026-07-05T09:00:00Z'),
      },
      {
        _id: 'rec-12',
        id: 'rec-12',
        recordCode: 'MR-2026-025',
        patientId: 'p-2',
        patientName: 'Robert Vance',
        doctorId: 'doc-6',
        doctorName: 'Dr. David Okonkwo',
        date: '2026-07-02',
        diagnosis: 'Right Inguinal Hernia (Reducible)',
        symptoms: ['Groin Bulge with Coughing', 'Mild Dull Dragging Sensation'],
        treatment: 'Scheduled elective robotic-assisted transabdominal preperitoneal (TAPP) repair.',
        prescription: [
          { medication: 'Acetaminophen 500mg', dosage: '500mg', frequency: 'PRN for discomfort', duration: '14 Days' },
        ],
        labResults: [
          { testName: 'Groin & Pelvic Soft Tissue Ultrasound', result: '2.2cm direct inguinal defect with fat protrusion', date: '2026-07-01', normalRange: 'No defect', status: 'Abnormal' },
        ],
        reportType: 'High-Resolution Groin Ultrasound & Surgical Consult',
        category: 'Surgery',
        labResultSummary: 'Direct inguinal hernia identified, completely reducible, no signs of incarceration.',
        status: 'Active',
        vitalSigns: { bloodPressure: '128/80', heartRate: '72', temperature: '98.4', weight: '88', height: '175' },
        notes: 'Pre-operative clearance complete. Elective repair scheduled.',
        isDeleted: false,
        createdAt: new Date('2026-07-02T10:15:00Z'),
        updatedAt: new Date('2026-07-02T10:15:00Z'),
      },
      {
        _id: 'rec-13',
        id: 'rec-13',
        recordCode: 'MR-2026-020',
        patientId: 'p-3',
        patientName: 'Elena Rostova',
        doctorId: 'doc-5',
        doctorName: 'Dr. Aisha Patel',
        date: '2026-06-28',
        diagnosis: 'Seasonal Allergic Rhinitis with Conjunctivitis',
        symptoms: ['Sneezing', 'Nasal Congestion', 'Watery Itchy Eyes'],
        treatment: 'Intranasal fluticasone propionate spray and oral second-generation antihistamine.',
        prescription: [
          { medication: 'Fluticasone Propionate Nasal Spray 50mcg', dosage: '2 sprays per nostril', frequency: 'Once Daily', duration: '60 Days' },
          { medication: 'Cetirizine HCl 10mg', dosage: '10mg', frequency: 'Nightly', duration: '30 Days' },
        ],
        labResults: [
          { testName: 'Total Serum IgE & Specific Pollen Profile', result: 'IgE 185 IU/mL (Elevated grass & birch reactivity)', date: '2026-06-27', normalRange: '< 100 IU/mL', status: 'Abnormal' },
        ],
        reportType: 'Serum Allergy IgE Panel & Immunological Assessment',
        category: 'Laboratory',
        labResultSummary: 'Elevated IgE specific to seasonal aeroallergens. HEENT examination consistent with allergic rhinitis.',
        status: 'Active',
        vitalSigns: { bloodPressure: '114/70', heartRate: '74', temperature: '98.6', weight: '58', height: '166' },
        notes: 'HEPA air filter recommended in bedroom.',
        isDeleted: false,
        createdAt: new Date('2026-06-28T14:20:00Z'),
        updatedAt: new Date('2026-06-28T14:20:00Z'),
      },
      {
        _id: 'rec-14',
        id: 'rec-14',
        recordCode: 'MR-2026-018',
        patientId: 'p-4',
        patientName: 'Marcus Aurelius',
        doctorId: 'doc-1',
        doctorName: 'Dr. Liam Reynolds',
        date: '2026-06-25',
        diagnosis: 'Cardiovascular Exercise Stress Test Clearance',
        symptoms: ['Pre-marathon fitness evaluation'],
        treatment: 'Cleared for high-intensity cardiovascular training and endurance events.',
        prescription: [],
        labResults: [
          { testName: 'Bruce Protocol Treadmill Stress Test', result: 'Completed Stage 4 (13.4 METs), no ST depression or arrhythmias', date: '2026-06-25', normalRange: '> 10 METs', status: 'Normal' },
        ],
        reportType: 'Cardiopulmonary Exercise Stress Test (CPET)',
        category: 'Cardiology',
        labResultSummary: 'Peak HR 178 bpm (98% predicted max). Normal blood pressure response and recovery curve.',
        status: 'Completed',
        vitalSigns: { bloodPressure: '122/76', heartRate: '62', temperature: '98.4', weight: '85', height: '183' },
        notes: 'Excellent athletic functional capacity demonstrated.',
        isDeleted: false,
        createdAt: new Date('2026-06-25T11:00:00Z'),
        updatedAt: new Date('2026-06-25T11:00:00Z'),
      },
      {
        _id: 'rec-15',
        id: 'rec-15',
        recordCode: 'MR-2026-015',
        patientId: 'p-5',
        patientName: 'Sophia Kim',
        doctorId: 'doc-4',
        doctorName: 'Dr. Naomi Chen',
        date: '2026-06-20',
        diagnosis: 'Atypical Nevus on Left Upper Back',
        symptoms: ['Irregular Pigmented Macule 6mm'],
        treatment: 'Excisional punch biopsy performed under local anesthesia; pathology evaluated.',
        prescription: [
          { medication: 'Mupirocin 2% Ointment', dosage: 'Thin layer', frequency: 'Twice Daily', duration: '7 Days' },
        ],
        labResults: [
          { testName: 'Dermatopathology Histological Biopsy', result: 'Compound dysplastic nevus with mild atypia, clear margins', date: '2026-06-22', normalRange: 'Benign nevus', status: 'Normal' },
        ],
        reportType: 'Histopathology Surgical Biopsy Examination',
        category: 'Pathology',
        labResultSummary: 'Benign dysplastic nevus. Surgical excision margins clean. No malignant melanoma.',
        status: 'Completed',
        vitalSigns: { bloodPressure: '110/72', heartRate: '68', temperature: '98.6', weight: '54', height: '162' },
        notes: 'Suture removal complete. Annual full-body skin screening recommended.',
        isDeleted: false,
        createdAt: new Date('2026-06-20T16:30:00Z'),
        updatedAt: new Date('2026-06-20T16:30:00Z'),
      },
      {
        _id: 'rec-16',
        id: 'rec-16',
        recordCode: 'MR-2026-012',
        patientId: 'p-1',
        patientName: 'Ines Williams',
        doctorId: 'doc-3',
        doctorName: 'Dr. Kenji Tanaka',
        date: '2026-06-15',
        diagnosis: 'Right Carpal Tunnel Syndrome (Mild)',
        symptoms: ['Nocturnal Hand Numbness', 'Tingling in Thumb & Index Fingers'],
        treatment: 'Neutral wrist splinting during sleep and tendon gliding ergonomic exercises.',
        prescription: [
          { medication: 'Naproxen Sodium 220mg', dosage: '220mg', frequency: 'Twice Daily with food', duration: '14 Days' },
        ],
        labResults: [
          { testName: 'Nerve Conduction Velocity (NCV / EMG)', result: 'Mild median motor latency prolongation (4.2ms)', date: '2026-06-14', normalRange: '< 3.8ms', status: 'Abnormal' },
        ],
        reportType: 'Electromyography & Nerve Conduction Study (EMG/NCV)',
        category: 'Neurology',
        labResultSummary: 'Mild focal median neuropathy at right carpal tunnel. No denervation changes.',
        status: 'Active',
        vitalSigns: { bloodPressure: '124/80', heartRate: '72', temperature: '98.4', weight: '68', height: '168' },
        notes: 'Splinting trial ongoing. Re-evaluate in 6 weeks.',
        isDeleted: false,
        createdAt: new Date('2026-06-15T10:00:00Z'),
        updatedAt: new Date('2026-06-15T10:00:00Z'),
      },
      {
        _id: 'rec-17',
        id: 'rec-17',
        recordCode: 'MR-2026-010',
        patientId: 'p-2',
        patientName: 'Robert Vance',
        doctorId: 'doc-1',
        doctorName: 'Dr. Sarah Jenkins',
        date: '2026-06-10',
        diagnosis: 'Early Stage Left Ventricular Diastolic Dysfunction (Grade 1)',
        symptoms: ['Mild exertional shortness of breath when climbing stairs'],
        treatment: 'Aggressive BP control and sodium restriction to < 2000mg/day.',
        prescription: [
          { medication: 'Lisinopril', dosage: '10mg', frequency: 'Once Daily', duration: '90 Days' },
        ],
        labResults: [
          { testName: 'Color Doppler Echocardiography', result: 'E/A ratio 0.78, normal LV ejection fraction (60%)', date: '2026-06-09', normalRange: 'E/A > 1.0', status: 'Abnormal' },
          { testName: 'BNP (B-Type Natriuretic Peptide)', result: '42 pg/mL', date: '2026-06-09', normalRange: '< 100 pg/mL', status: 'Normal' },
        ],
        reportType: 'Comprehensive Color Doppler Echocardiography',
        category: 'Cardiology',
        labResultSummary: 'Grade 1 impaired LV relaxation without elevated filling pressures or pulmonary hypertension.',
        status: 'Active',
        vitalSigns: { bloodPressure: '132/84', heartRate: '74', temperature: '98.6', weight: '88', height: '175' },
        notes: 'Follow-up echocardiogram in 12 months.',
        isDeleted: false,
        createdAt: new Date('2026-06-10T15:20:00Z'),
        updatedAt: new Date('2026-06-10T15:20:00Z'),
      },
      {
        _id: 'rec-18',
        id: 'rec-18',
        recordCode: 'MR-2026-008',
        patientId: 'p-3',
        patientName: 'Elena Rostova',
        doctorId: 'doc-2',
        doctorName: 'Dr. Alex Morgan',
        date: '2026-06-05',
        diagnosis: 'Hypothyroidism (Primary, Hashimoto-related)',
        symptoms: ['Cold Intolerance', 'Weight Gain', 'Dry Skin'],
        treatment: 'Levothyroxine replacement therapy with TSH monitoring at 6-week intervals.',
        prescription: [
          { medication: 'Levothyroxine Sodium 50mcg', dosage: '50mcg', frequency: 'Once Daily 30 mins before breakfast with water', duration: '90 Days' },
        ],
        labResults: [
          { testName: 'Serum TSH (Thyroid Stimulating Hormone)', result: '6.8 uIU/mL', date: '2026-06-04', normalRange: '0.4-4.0 uIU/mL', status: 'Abnormal' },
          { testName: 'Free Thyroxine (Free T4)', result: '0.85 ng/dL', date: '2026-06-04', normalRange: '0.9-1.7 ng/dL', status: 'Abnormal' },
          { testName: 'Anti-TPO Antibodies', result: '142 IU/mL', date: '2026-06-04', normalRange: '< 35 IU/mL', status: 'Abnormal' },
        ],
        reportType: 'Thyroid Function Panel & Autoantibody Screen',
        category: 'Laboratory',
        labResultSummary: 'Elevated TSH with positive Anti-TPO antibodies consistent with autoimmune thyroiditis.',
        status: 'Active',
        vitalSigns: { bloodPressure: '116/74', heartRate: '64', temperature: '97.8', weight: '59', height: '166' },
        notes: 'Retest TSH and Free T4 in 6 weeks.',
        isDeleted: false,
        createdAt: new Date('2026-06-05T08:45:00Z'),
        updatedAt: new Date('2026-06-05T08:45:00Z'),
      },
      {
        _id: 'rec-19',
        id: 'rec-19',
        recordCode: 'MR-2026-005',
        patientId: 'p-4',
        patientName: 'Marcus Aurelius',
        doctorId: 'doc-6',
        doctorName: 'Dr. David Okonkwo',
        date: '2026-05-28',
        diagnosis: 'Left Rotator Cuff Supraspinatus Tendinopathy',
        symptoms: ['Pain on Abduction above 90 degrees', 'Nighttime Shoulder Aching'],
        treatment: 'Subacromial corticosteroid injection and guided rotator cuff strengthening exercises.',
        prescription: [
          { medication: 'Celecoxib 200mg', dosage: '200mg', frequency: 'Once Daily', duration: '21 Days' },
        ],
        labResults: [
          { testName: 'Left Shoulder MRI without Contrast', result: 'Supraspinatus tendinosis with minor articular surface fraying, no full tear', date: '2026-05-27', normalRange: 'Intact cuff', status: 'Abnormal' },
        ],
        reportType: 'Shoulder High-Field MRI & Orthopedic Exam',
        category: 'Orthopedics',
        labResultSummary: 'Intact supraspinatus tendon with focal tendinosis. Subacromial bursa mildly thickened.',
        status: 'Active',
        vitalSigns: { bloodPressure: '124/78', heartRate: '68', temperature: '98.5', weight: '85', height: '183' },
        notes: 'Ultrasound-guided subacromial injection delivered with good precision and immediate pain relief.',
        isDeleted: false,
        createdAt: new Date('2026-05-28T13:10:00Z'),
        updatedAt: new Date('2026-05-28T13:10:00Z'),
      },
      {
        _id: 'rec-20',
        id: 'rec-20',
        recordCode: 'MR-2026-001',
        patientId: 'p-5',
        patientName: 'Sophia Kim',
        doctorId: 'doc-5',
        doctorName: 'Dr. Aisha Patel',
        date: '2026-05-20',
        diagnosis: 'Acute Uncomplicated Streptococcal Pharyngitis',
        symptoms: ['Sore Throat', 'Fever 101.2F', 'Tonsillar Exudates', 'Cervical Lymphadenopathy'],
        treatment: 'Oral amoxicillin course and symptomatic throat lozenges.',
        prescription: [
          { medication: 'Amoxicillin Trihydrate 500mg', dosage: '500mg', frequency: 'Three Times Daily (TDS)', duration: '10 Days' },
          { medication: 'Ibuprofen 400mg', dosage: '400mg', frequency: 'PRN every 6 hours', duration: '5 Days' },
        ],
        labResults: [
          { testName: 'Rapid Strep A Immunoassay', result: 'Positive for Group A Streptococcus antigen', date: '2026-05-20', normalRange: 'Negative', status: 'Abnormal' },
          { testName: 'Throat Culture & Sensitivity', result: 'Heavy growth Streptococcus pyogenes, susceptible to penicillin', date: '2026-05-22', normalRange: 'Normal flora', status: 'Abnormal' },
        ],
        reportType: 'Microbiology Throat Culture & Rapid Antigen Test',
        category: 'Laboratory',
        labResultSummary: 'Group A Streptococcus identified. Full antibiotic sensitivity verified.',
        status: 'Completed',
        vitalSigns: { bloodPressure: '112/70', heartRate: '88', temperature: '101.2', weight: '54', height: '162' },
        notes: 'Patient completed 10-day antibiotic course with complete symptom resolution.',
        isDeleted: false,
        createdAt: new Date('2026-05-20T09:30:00Z'),
        updatedAt: new Date('2026-05-20T09:30:00Z'),
      },
    ];

    // 6. Payments
    this.payments = [
      {
        _id: 'pay-1',
        id: 'pay-1',
        invoiceCode: 'INV-2026-001',
        patientId: 'PT-01001',
        patientName: 'Ines Williams',
        serviceName: 'Comprehensive Cardiac Evaluation',
        amount: 350,
        status: 'Paid',
        date: '2026-07-28',
        dueDate: '2026-07-28',
        paymentMethod: 'Credit Card',
        transactionId: 'TXN-998201948',
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: 'pay-2',
        id: 'pay-2',
        invoiceCode: 'INV-2026-002',
        patientId: 'PT-01002',
        patientName: 'Robert Vance',
        serviceName: 'Routine Blood Panel & Metabolic Screening',
        amount: 120,
        status: 'Pending',
        date: '2026-07-30',
        dueDate: '2026-08-05',
        paymentMethod: 'Insurance',
        transactionId: 'TXN-PENDING-002',
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    // 7. Activity Logs
    this.activityLogs = [
      {
        _id: 'act-1',
        id: 'act-1',
        user: 'Dr. Sarah Chen',
        author: 'Dr. Sarah Chen',
        role: 'Doctor',
        action: 'updated prescription for',
        target: 'John Doe',
        details: 'John Doe',
        time: '5 min. ago',
        timeAgo: '5 min. ago',
        timestamp: '10:07 AM',
        ipAddress: '192.168.1.105',
        isDeleted: false,
        createdAt: new Date(Date.now() - 5 * 60 * 1000),
      },
      {
        _id: 'act-2',
        id: 'act-2',
        user: 'Nurse Priya Sharma',
        author: 'Nurse Priya Sharma',
        role: 'Nurse',
        action: 'admitted patient',
        target: 'Isabella Martinez',
        details: 'Isabella Martinez',
        time: '10 min. ago',
        timeAgo: '10 min. ago',
        timestamp: '10:02 AM',
        ipAddress: '192.168.1.108',
        isDeleted: false,
        createdAt: new Date(Date.now() - 10 * 60 * 1000),
      },
      {
        _id: 'act-3',
        id: 'act-3',
        user: 'Dr. Marcus Reynolds',
        author: 'Dr. Marcus Reynolds',
        role: 'Doctor',
        action: 'completed consultation with',
        target: 'Robert Wilson',
        details: 'Robert Wilson',
        time: '42 min. ago',
        timeAgo: '42 min. ago',
        timestamp: '09:30 AM',
        ipAddress: '192.168.1.112',
        isDeleted: false,
        createdAt: new Date(Date.now() - 42 * 60 * 1000),
      },
      {
        _id: 'act-4',
        id: 'act-4',
        user: 'Lab Perception',
        author: 'Lab Perception',
        role: 'Lab Technician',
        action: 'uploaded lab report for',
        target: 'Emily Davis',
        details: 'Emily Davis',
        time: '1 hr. ago',
        timeAgo: '1 hr. ago',
        timestamp: '09:12 AM',
        ipAddress: '192.168.1.115',
        isDeleted: false,
        createdAt: new Date(Date.now() - 60 * 60 * 1000),
      },
      {
        _id: 'act-5',
        id: 'act-5',
        user: 'Reception',
        author: 'Reception',
        role: 'Staff',
        action: 'scheduled appointment for',
        target: 'Michael Brown',
        details: 'Michael Brown',
        time: '2 hr. ago',
        timeAgo: '2 hr. ago',
        timestamp: '08:15 AM',
        ipAddress: '192.168.1.120',
        isDeleted: false,
        createdAt: new Date(Date.now() - 120 * 60 * 1000),
      },
      {
        _id: 'act-6',
        id: 'act-6',
        user: 'Dr. Ahmed Al-Rashid',
        author: 'Dr. Ahmed Al-Rashid',
        role: 'Doctor',
        action: 'discharged patient',
        target: 'Sophia Kim',
        details: 'Sophia Kim',
        time: '3 hr. ago',
        timeAgo: '3 hr. ago',
        timestamp: '07:10 AM',
        ipAddress: '192.168.1.125',
        isDeleted: false,
        createdAt: new Date(Date.now() - 180 * 60 * 1000),
      },
      {
        _id: 'act-7',
        id: 'act-7',
        user: 'System',
        author: 'System',
        role: 'Automated System',
        action: 'flagged critical visits for',
        target: 'James Thompson',
        details: 'James Thompson',
        time: '5 hr. ago',
        timeAgo: '5 hr. ago',
        timestamp: '05:12 AM',
        ipAddress: '127.0.0.1',
        isDeleted: false,
        createdAt: new Date(Date.now() - 300 * 60 * 1000),
      },
      {
        _id: 'act-8',
        id: 'act-8',
        user: 'Dr. Alex Morgan',
        author: 'Dr. Alex Morgan',
        role: 'Super Admin',
        action: 'verified clinical records for',
        target: 'Ines Williams',
        details: 'Ines Williams',
        time: '6 hr. ago',
        timeAgo: '6 hr. ago',
        timestamp: '04:15 AM',
        ipAddress: '127.0.0.1',
        isDeleted: false,
        createdAt: new Date(Date.now() - 360 * 60 * 1000),
      },
    ];
  }
}

export const memoryStore = MemoryStore.getInstance();
