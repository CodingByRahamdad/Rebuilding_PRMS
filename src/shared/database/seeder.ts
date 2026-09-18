import { UserModel } from '../../modules/users/models/user.model';
import { DoctorModel } from '../../modules/doctors/models/doctor.model';
import { NurseModel } from '../../modules/nurses/models/nurse.model';
import { ReceptionistModel } from '../../modules/receptionists/models/receptionist.model';
import { PatientModel } from '../../modules/patients/models/patient.model';
import { AppointmentModel } from '../../modules/appointments/models/appointment.model';
import { MedicalRecordModel } from '../../modules/medical-records/models/medical-record.model';
import { PaymentModel } from '../../modules/payments/models/payment.model';
import { ServiceModel } from '../../modules/services/models/service.model';
import { ActivityLogModel } from '../../modules/analytics/models/activity-log.model';
import { AuthUtils } from '../../modules/auth/auth.utils';

export async function seedDatabase(): Promise<void> {
  try {
    const defaultPasswordHash = await AuthUtils.hashPassword('Admin123!');

    // Always ensure at least the Super Admin user exists for authentication
    const existingAdmin = await UserModel.findOne({ email: 'alex.morgan@prms.hospital' });
    if (!existingAdmin) {
      await UserModel.create({
        name: 'Dr. Alex Morgan',
        email: 'alex.morgan@prms.hospital',
        passwordHash: defaultPasswordHash,
        role: 'Super Admin',
        phone: '+1 (555) 019-2834',
        avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80',
        status: 'Active',
      });
      console.log('👤 Super Admin account initialized: alex.morgan@prms.hospital');
    }

    if (process.env.ENABLE_DEMO_MODE === 'false') {
      console.log('🔒 [Production Mode] Demo seeding disabled. Skipping automatic mock data generation.');
      return;
    }

    const patientCount = await PatientModel.countDocuments();
    if (patientCount > 0) {
      console.log('🌱 Database already populated. Skipping initial seed.');
      return;
    }

    console.log('🌱 Database is empty. Seeding initial PRMS enterprise data...');

    // 1. Seed Other Demo Users
    const docUser = await UserModel.create({
      name: 'Dr. Sarah Jenkins',
      email: 'sarah.jenkins@prms.hospital',
      passwordHash: defaultPasswordHash,
      role: 'Doctor',
      phone: '+1 (555) 392-8102',
      avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&auto=format&fit=crop&q=80',
      status: 'Active',
    });

    const nurseUser = await UserModel.create({
      name: 'Nurse Clara Oswald',
      email: 'clara.oswald@prms.hospital',
      passwordHash: defaultPasswordHash,
      role: 'Nurse',
      phone: '+1 (555) 482-9910',
      avatar: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=150&auto=format&fit=crop&q=80',
      status: 'Active',
    });

    const receptionistUser = await UserModel.create({
      name: 'David Miller',
      email: 'david.miller@prms.hospital',
      passwordHash: defaultPasswordHash,
      role: 'Receptionist',
      phone: '+1 (555) 771-3342',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      status: 'Active',
    });

    const patientUser = await UserModel.create({
      name: 'Ines Williams',
      email: 'ines.williams@example.com',
      passwordHash: defaultPasswordHash,
      role: 'Patient',
      phone: '+1 (555) 234-5678',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
      status: 'Active',
    });

    // 2. Seed Staff Profiles
    const doctor = await DoctorModel.create({
      userId: docUser._id,
      name: docUser.name,
      email: docUser.email,
      phone: docUser.phone,
      avatar: docUser.avatar,
      specialization: 'Senior Cardiology',
      department: 'Cardiology',
      licenseNumber: 'MD-99214-CAR',
      experience: '14 Years',
      consultationFee: 250,
      availability: 'Mon-Fri, 08:30 AM - 04:30 PM',
      status: 'Active',
    });

    const nurse = await NurseModel.create({
      userId: nurseUser._id,
      name: nurseUser.name,
      email: nurseUser.email,
      phone: nurseUser.phone,
      avatar: nurseUser.avatar,
      department: 'Intensive Care Unit (ICU)',
      shift: 'Morning',
      licenseNumber: 'RN-88310-ICU',
      assignedWard: 'ICU Ward 3B - Bed 04',
      status: 'Active',
    });

    const receptionist = await ReceptionistModel.create({
      userId: receptionistUser._id,
      name: receptionistUser.name,
      email: receptionistUser.email,
      phone: receptionistUser.phone,
      avatar: receptionistUser.avatar,
      department: 'Central Intake & Admissions',
      shift: 'Morning',
      deskNumber: 'Desk A-01 (Main Lobby)',
      status: 'Active',
    });

    // 3. Seed Patients
    const patient1 = await PatientModel.create({
      userId: patientUser._id,
      name: patientUser.name,
      email: patientUser.email,
      phone: patientUser.phone,
      avatar: patientUser.avatar,
      dateOfBirth: '1992-04-14',
      gender: 'Female',
      bloodGroup: 'O+',
      address: '742 Evergreen Terrace, Springfield',
      emergencyContact: {
        name: 'Mark Williams',
        relationship: 'Spouse',
        phone: '+1 (555) 998-1122',
      },
      medicalHistory: ['Hypertension', 'Mild Asthma'],
      allergies: ['Penicillin'],
      insuranceProvider: 'Blue Cross Blue Shield',
      insurancePolicyNumber: 'BCBS-99182301',
      status: 'Active',
    });

    const patient2 = await PatientModel.create({
      name: 'Robert Vance',
      email: 'robert.vance@example.com',
      phone: '+1 (555) 882-9901',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      dateOfBirth: '1984-11-22',
      gender: 'Male',
      bloodGroup: 'A+',
      address: '104 Scranton Business Park',
      emergencyContact: {
        name: 'Phyllis Vance',
        relationship: 'Spouse',
        phone: '+1 (555) 334-1122',
      },
      medicalHistory: ['Type 2 Diabetes'],
      allergies: ['Sulfa Drugs'],
      insuranceProvider: 'Aetna Health',
      insurancePolicyNumber: 'AET-8821092',
      status: 'Active',
    });

    // 4. Seed Medical Services
    const service1 = await ServiceModel.create({
      name: 'Comprehensive Cardiac Evaluation',
      category: 'Consultation & Diagnostics',
      department: 'Cardiology',
      cost: 350,
      description: 'In-depth cardiovascular consultation, ECG review, and lifestyle risk assessment.',
      durationMinutes: 45,
      isAvailable: true,
    });

    const service2 = await ServiceModel.create({
      name: 'Routine Blood Panel & Metabolic Screening',
      category: 'Laboratory',
      department: 'Pathology',
      cost: 120,
      description: 'Complete blood count (CBC), lipid profile, and liver/kidney enzyme panel.',
      durationMinutes: 20,
      isAvailable: true,
    });

    // 5. Seed Appointments
    await AppointmentModel.create({
      patientId: patient1._id.toString(),
      patientName: patient1.name,
      doctorId: doctor._id.toString(),
      doctorName: doctor.name,
      department: 'Cardiology',
      date: '2026-08-01',
      time: '10:00 AM',
      type: 'In-Person',
      status: 'Confirmed',
      symptoms: 'Mild chest tightness and shortness of breath during exercise.',
      notes: 'Patient requested morning slot.',
    });

    await AppointmentModel.create({
      patientId: patient2._id.toString(),
      patientName: patient2.name,
      doctorId: doctor._id.toString(),
      doctorName: doctor.name,
      department: 'Cardiology',
      date: '2026-08-01',
      time: '11:30 AM',
      type: 'Follow-up',
      status: 'Pending',
      symptoms: 'Routine 3-month diabetes and blood pressure check-up.',
      notes: 'Fast 8 hours prior for blood sample.',
    });

    // 6. Seed Medical Records
    await MedicalRecordModel.create({
      patientId: patient1._id.toString(),
      patientName: patient1.name,
      doctorId: doctor._id.toString(),
      doctorName: doctor.name,
      date: '2026-07-28',
      diagnosis: 'Essential Hypertension with Mild Exertional Dyspnea',
      symptoms: ['Chest Tightness', 'Fatigue'],
      prescription: [
        {
          medication: 'Lisinopril',
          dosage: '10mg',
          frequency: 'Once Daily (Morning)',
          duration: '30 Days',
        },
        {
          medication: 'Aspirin',
          dosage: '81mg',
          frequency: 'Once Daily',
          duration: '30 Days',
        },
      ],
      labResults: [
        {
          testName: 'Lipid Panel',
          result: 'Total Cholesterol 195 mg/dL',
          date: '2026-07-27',
          normalRange: '< 200 mg/dL',
          status: 'Normal',
        },
      ],
      vitalSigns: {
        bloodPressure: '138/88 mmHg',
        heartRate: '76 bpm',
        temperature: '98.6 °F',
        weight: '68 kg',
        height: '165 cm',
      },
      notes: 'Patient advised low-sodium diet and daily 30-min walking.',
    });

    // 7. Seed Payments
    await PaymentModel.create({
      patientId: patient1._id.toString(),
      patientName: patient1.name,
      serviceName: service1.name,
      amount: 350,
      status: 'Paid',
      date: '2026-07-28',
      dueDate: '2026-07-28',
      paymentMethod: 'Credit Card',
      transactionId: 'TXN-998201948',
    });

    await PaymentModel.create({
      patientId: patient2._id.toString(),
      patientName: patient2.name,
      serviceName: service2.name,
      amount: 120,
      status: 'Pending',
      date: '2026-07-30',
      dueDate: '2026-08-05',
      paymentMethod: 'Insurance',
      transactionId: 'TXN-PENDING-002',
    });

    // 8. Seed Activity Logs
    await ActivityLogModel.create({
      user: 'Dr. Alex Morgan',
      action: 'SYSTEM_INITIALIZATION',
      details: 'Hospital PRMS enterprise instance initialized with secure role RBAC and MongoDB schemas.',
      time: new Date().toLocaleString(),
      ipAddress: '127.0.0.1',
    });

    await ActivityLogModel.create({
      user: 'David Miller',
      action: 'PATIENT_REGISTERED',
      details: 'Registered new intake patient: Ines Williams.',
      time: new Date().toLocaleString(),
      ipAddress: '192.168.1.102',
    });

    console.log('✅ PRMS Enterprise database successfully seeded!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  }
}
