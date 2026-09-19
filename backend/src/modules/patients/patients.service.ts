import { PatientRepository } from './patients.repository';
import { UserRepository } from '../users/users.repository';
import { CreatePatientInput, UpdatePatientInput, GetPatientsQuery } from './patients.validation';
import { AuthUtils } from '../auth/auth.utils';
import { ConflictError, NotFoundError } from '../../shared/errors/app-error';
import { logActivity, ActivityActor } from '../../shared/utils/activity-logger';

export class PatientService {
  private patientRepository: PatientRepository;
  private userRepository: UserRepository;

  constructor() {
    this.patientRepository = new PatientRepository();
    this.userRepository = new UserRepository();
  }

  public async createPatient(input: CreatePatientInput, actor?: ActivityActor) {
    const existingPatient = await this.patientRepository.findByEmail(input.email);
    if (existingPatient) {
      throw new ConflictError(`A patient with email address '${input.email}' is already registered.`);
    }

    const existingUser = await this.userRepository.findByEmail(input.email);
    if (existingUser) {
      throw new ConflictError(`An account with email address '${input.email}' is already registered in the system.`);
    }

    const passwordHash = await AuthUtils.hashPassword(input.password || 'PatientPass123!');
    const newUser = await this.userRepository.create({
      name: input.name,
      email: input.email.toLowerCase(),
      passwordHash,
      role: 'Patient',
      phone: input.phone,
      avatar: input.avatar || '',
      status: 'Active',
    });
    const userId = newUser._id.toString();

    const patient = await this.patientRepository.create({
      userId: userId as any,
      patientCode: input.patientCode || `PT-0${Math.floor(1000 + Math.random() * 9000)}`,
      name: input.name,
      email: input.email.toLowerCase(),
      phone: input.phone,
      avatar: input.avatar || '',
      age: input.age ?? 35,
      dateOfBirth: input.dateOfBirth || '',
      gender: input.gender || 'Male',
      bloodGroup: input.bloodGroup || input.bloodType || 'O+',
      bloodType: input.bloodType || input.bloodGroup || 'O+',
      address: input.address || 'Hospital Ward',
      department: input.department || 'General Medicine',
      doctor: input.doctor || 'Dr. Alex Morgan',
      room: input.room || 'Room 101',
      condition: input.condition || 'Stable',
      admissionDate: input.admissionDate || new Date().toISOString().split('T')[0],
      emergencyContact: input.emergencyContact || { name: 'Next of Kin', relationship: 'Family', phone: '' },
      medicalHistory: input.medicalHistory || [],
      allergies: input.allergies || [],
      insuranceProvider: input.insuranceProvider || '',
      insurancePolicyNumber: input.insurancePolicyNumber || '',
      prescriptions: input.prescriptions || [],
      reports: input.reports || [],
      billingInvoices: input.billingInvoices || [],
      vitals: input.vitals || {
        bloodPressure: '120/80',
        heartRate: 72,
        temperature: 98.6,
        oxygenSaturation: 98,
      },
      status: input.status || 'Admitted',
    });

    const result = patient.toJSON();
    await logActivity(actor, 'created', 'Patient', patient.name);
    return result;
  }

  public async getPatients(query: GetPatientsQuery) {
    const result = await this.patientRepository.findAll(query);
    return {
      patients: result.patients.map((p) => p.toJSON()),
      meta: result.meta,
    };
  }

  public async getPatientById(id: string) {
    const patient = await this.patientRepository.findById(id);
    if (!patient) {
      throw new NotFoundError('Patient record not found.');
    }
    return patient.toJSON();
  }

  public async updatePatient(id: string, input: UpdatePatientInput, actor?: ActivityActor) {
    const patient = await this.patientRepository.findById(id);
    if (!patient) {
      throw new NotFoundError('Patient record not found.');
    }

    if (input.email && input.email.toLowerCase() !== patient.email) {
      const existingEmail = await this.patientRepository.findByEmail(input.email);
      if (existingEmail) {
        throw new ConflictError(`Email '${input.email}' is already registered to another patient.`);
      }
    }

    const updatedPatient = await this.patientRepository.update(id, input);

    if (patient.userId) {
      const userUpdate: any = {};
      if (input.name) userUpdate.name = input.name;
      if (input.email) userUpdate.email = input.email.toLowerCase();
      if (input.phone) userUpdate.phone = input.phone;
      if (input.avatar) userUpdate.avatar = input.avatar;
      if (input.status) userUpdate.status = input.status;
      if (Object.keys(userUpdate).length > 0) {
        await this.userRepository.update((patient.userId as any).id || (patient.userId as any).toString(), userUpdate);
      }
    }

    const result = updatedPatient?.toJSON();
    await logActivity(actor, 'updated', 'Patient', updatedPatient?.name || patient.name);
    return result;
  }

  public async deletePatient(id: string, actor?: ActivityActor) {
    const patient = await this.patientRepository.findById(id);
    if (!patient) {
      throw new NotFoundError('Patient record not found.');
    }

    await this.patientRepository.softDelete(id);
    if (patient.userId) {
      await this.userRepository.softDelete((patient.userId as any).id || (patient.userId as any).toString());
    }

    await logActivity(actor, 'deleted', 'Patient', patient.name);
  }
}
