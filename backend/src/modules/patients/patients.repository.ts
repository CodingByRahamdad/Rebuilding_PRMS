import mongoose, { Types } from 'mongoose';
import { PatientModel, IPatient } from './models/patient.model';
import { GetPatientsQuery } from './patients.validation';
import { memoryStore, InMemoryPatient } from '../../shared/database/memory-store';
import { assertDatabaseConnection, isDemoModeEnabled, isDbConnected } from '../../shared/database/db-guard';

export class PatientRepository {
  public async create(patientData: Partial<IPatient>): Promise<IPatient> {
    assertDatabaseConnection();

    if (isDbConnected()) {
      try {
        return await PatientModel.create(patientData);
      } catch (err) {
        if (!isDemoModeEnabled()) throw err;
        console.warn('⚠️ Mongoose create patient failed, using memory store:', err);
      }
    }

    if (!isDemoModeEnabled()) {
      throw new Error('Database disconnected and demo mode is disabled.');
    }

    const newPatient: InMemoryPatient = {
      _id: `p-${Date.now()}`,
      id: `p-${Date.now()}`,
      patientCode: patientData.patientCode || `PT-0${Math.floor(1000 + Math.random() * 9000)}`,
      name: patientData.name || 'Anonymous Patient',
      email: patientData.email || 'patient@example.com',
      phone: patientData.phone || '+1 (555) 019-2831',
      avatar: patientData.avatar || '',
      age: patientData.age || 35,
      dateOfBirth: patientData.dateOfBirth || '',
      gender: patientData.gender || 'Female',
      bloodGroup: patientData.bloodGroup || patientData.bloodType || 'O+',
      bloodType: patientData.bloodType || patientData.bloodGroup || 'O+',
      address: patientData.address || 'Hospital Ward',
      department: patientData.department || 'Cardiology',
      doctor: patientData.doctor || 'Dr. Sarah Jenkins',
      room: patientData.room || 'Bed 105',
      condition: patientData.condition || 'Routine Observation',
      admissionDate: patientData.admissionDate || new Date().toISOString().split('T')[0],
      emergencyContact: (patientData as any).emergencyContact || { name: 'Next of Kin', relationship: 'Family', phone: '' },
      medicalHistory: (patientData as any).medicalHistory || [],
      allergies: (patientData as any).allergies || [],
      insuranceProvider: (patientData as any).insuranceProvider || '',
      insurancePolicyNumber: (patientData as any).insurancePolicyNumber || '',
      prescriptions: (patientData as any).prescriptions || [],
      reports: (patientData as any).reports || [],
      billingInvoices: (patientData as any).billingInvoices || [],
      vitals: (patientData as any).vitals || {
        bloodPressure: '120/80',
        heartRate: 72,
        temperature: 98.6,
        oxygenSaturation: 98,
      },
      status: patientData.status || 'Admitted',
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    memoryStore.patients.unshift(newPatient);
    return newPatient as unknown as IPatient;
  }

  public async findById(id: string): Promise<IPatient | null> {
    assertDatabaseConnection();

    if (isDbConnected()) {
      try {
        const filter = Types.ObjectId.isValid(id)
          ? { $or: [{ _id: id }, { patientCode: id }], isDeleted: false }
          : { patientCode: id, isDeleted: false };
        const patient = await PatientModel.findOne(filter).exec();
        if (patient) return patient;
      } catch (err) {
        if (!isDemoModeEnabled()) throw err;
        console.warn('⚠️ Mongoose findById patient failed, using memory store:', err);
      }
    }

    if (!isDemoModeEnabled()) return null;

    const pat = memoryStore.patients.find(
      (p) => (p._id === id || p.id === id || p.patientCode === id) && !p.isDeleted
    );
    if (!pat) return null;
    return pat as unknown as IPatient;
  }

  public async findByEmail(email: string): Promise<IPatient | null> {
    assertDatabaseConnection();

    if (isDbConnected()) {
      try {
        const patient = await PatientModel.findOne({ email: email.toLowerCase(), isDeleted: false }).exec();
        if (patient) return patient;
      } catch (err) {
        if (!isDemoModeEnabled()) throw err;
        console.warn('⚠️ Mongoose findByEmail patient failed, using memory store:', err);
      }
    }

    if (!isDemoModeEnabled()) return null;

    const pat = memoryStore.patients.find((p) => p.email.toLowerCase() === email.toLowerCase() && !p.isDeleted);
    if (!pat) return null;
    return pat as unknown as IPatient;
  }

  public async findAll(query: GetPatientsQuery) {
    assertDatabaseConnection();

    const { page = 1, limit = 15, gender, bloodGroup, status, search } = query;
    const skip = (page - 1) * limit;

    if (isDbConnected()) {
      try {
        const filter: any = { isDeleted: false };
        if (gender) filter.gender = gender;
        if (bloodGroup) filter.bloodGroup = bloodGroup;
        if (status) filter.status = status;
        if (search) {
          filter.$or = [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
            { phone: { $regex: search, $options: 'i' } },
            { address: { $regex: search, $options: 'i' } },
            { patientCode: { $regex: search, $options: 'i' } },
          ];
        }

        const [patients, total] = await Promise.all([
          PatientModel.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .exec(),
          PatientModel.countDocuments(filter),
        ]);

        const totalPages = Math.ceil(total / limit) || 1;

        return {
          patients,
          meta: {
            page,
            limit,
            total,
            totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
          },
        };
      } catch (err) {
        if (!isDemoModeEnabled()) throw err;
        console.warn('⚠️ Mongoose findAll patients failed, using memory store:', err);
      }
    }

    if (!isDemoModeEnabled()) {
      return {
        patients: [],
        meta: {
          page,
          limit,
          total: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPrevPage: false,
        },
      };
    }

    let filtered = memoryStore.patients.filter((p) => !p.isDeleted);
    if (gender) filtered = filtered.filter((p) => p.gender === gender);
    if (bloodGroup) filtered = filtered.filter((p) => p.bloodGroup === bloodGroup || p.bloodType === bloodGroup);
    if (status) filtered = filtered.filter((p) => p.status === status);
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.email.toLowerCase().includes(q) ||
          p.phone.toLowerCase().includes(q) ||
          p.patientCode.toLowerCase().includes(q) ||
          p.department.toLowerCase().includes(q)
      );
    }

    const total = filtered.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const patients = filtered.slice(skip, skip + limit) as unknown as IPatient[];

    return {
      patients,
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  public async update(id: string, updateData: Partial<IPatient>): Promise<IPatient | null> {
    assertDatabaseConnection();

    if (isDbConnected()) {
      try {
        const filter = Types.ObjectId.isValid(id)
          ? { $or: [{ _id: id }, { patientCode: id }], isDeleted: false }
          : { patientCode: id, isDeleted: false };
        const patient = await PatientModel.findOneAndUpdate(
          filter,
          { $set: updateData },
          { returnDocument: 'after', runValidators: true }
        ).exec();
        if (patient) return patient;
        if (!isDemoModeEnabled()) return null;
      } catch (err) {
        if (!isDemoModeEnabled()) throw err;
        console.warn('⚠️ Mongoose update patient failed, using memory store:', err);
      }
    }

    if (!isDemoModeEnabled()) return null;

    const patient = memoryStore.patients.find(
      (p) => (p._id === id || p.id === id || p.patientCode === id) && !p.isDeleted
    );
    if (!patient) return null;
    Object.assign(patient, updateData, { updatedAt: new Date() });
    return patient as unknown as IPatient;
  }

  public async softDelete(id: string): Promise<IPatient | null> {
    assertDatabaseConnection();

    if (isDbConnected()) {
      try {
        const filter = Types.ObjectId.isValid(id)
          ? { $or: [{ _id: id }, { patientCode: id }], isDeleted: false }
          : { patientCode: id, isDeleted: false };
        const patient = await PatientModel.findOneAndUpdate(
          filter,
          { $set: { isDeleted: true, status: 'Inactive' } },
          { returnDocument: 'after' }
        ).exec();
        if (patient) return patient;
        if (!isDemoModeEnabled()) return null;
      } catch (err) {
        if (!isDemoModeEnabled()) throw err;
        console.warn('⚠️ Mongoose softDelete patient failed, using memory store:', err);
      }
    }

    if (!isDemoModeEnabled()) return null;

    const patient = memoryStore.patients.find(
      (p) => (p._id === id || p.id === id || p.patientCode === id) && !p.isDeleted
    );
    if (!patient) return null;
    patient.isDeleted = true;
    patient.status = 'Inactive';
    patient.updatedAt = new Date();
    return patient as unknown as IPatient;
  }
}
