import mongoose, { Types } from 'mongoose';
import { DoctorModel, IDoctor } from './models/doctor.model';
import { GetDoctorsQuery } from './doctors.validation';
import { memoryStore, InMemoryDoctor } from '../../shared/database/memory-store';
import { assertDatabaseConnection, isDemoModeEnabled, isDbConnected } from '../../shared/database/db-guard';

export class DoctorRepository {
  public async create(doctorData: Partial<IDoctor>): Promise<IDoctor> {
    assertDatabaseConnection();

    if (isDbConnected()) {
      try {
        return await DoctorModel.create(doctorData);
      } catch (err) {
        if (!isDemoModeEnabled()) throw err;
        console.warn('⚠️ Mongoose create doctor failed, using memory store:', err);
      }
    }

    if (!isDemoModeEnabled()) {
      throw new Error('Database disconnected and demo mode is disabled.');
    }

    const newDoc: InMemoryDoctor = {
      _id: `doc-${Date.now()}`,
      name: doctorData.name || 'Dr. Alex Morgan',
      email: doctorData.email || 'doctor@example.com',
      phone: doctorData.phone || '+1 (555) 019-2831',
      avatar: doctorData.avatar || '',
      specialization: doctorData.specialization || 'Cardiology',
      department: doctorData.department || 'Cardiology',
      licenseNumber: doctorData.licenseNumber || `MD-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      experience: doctorData.experience || '10 Years',
      consultationFee: doctorData.consultationFee || 150,
      availability: doctorData.availability || 'Mon-Fri, 09:00 AM - 05:00 PM',
      rating: 4.9,
      totalPatients: 120,
      status: doctorData.status || 'Active',
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    memoryStore.doctors.unshift(newDoc);
    return newDoc as unknown as IDoctor;
  }

  public async findById(id: string): Promise<IDoctor | null> {
    assertDatabaseConnection();

    if (isDbConnected() && Types.ObjectId.isValid(id)) {
      try {
        const doc = await DoctorModel.findOne({ _id: id, isDeleted: false })
          .populate('userId', 'name email role avatar status')
          .exec();
        if (doc) return doc;
      } catch (err) {
        if (!isDemoModeEnabled()) throw err;
        console.warn('⚠️ Mongoose findById doctor failed, using memory store:', err);
      }
    }

    if (!isDemoModeEnabled()) return null;

    const doc = memoryStore.doctors.find((d) => (d._id === id || d.id === id) && !d.isDeleted);
    if (!doc) return null;
    return doc as unknown as IDoctor;
  }

  public async findByLicenseNumber(licenseNumber: string): Promise<IDoctor | null> {
    assertDatabaseConnection();

    if (isDbConnected()) {
      try {
        const doc = await DoctorModel.findOne({ licenseNumber, isDeleted: false }).exec();
        if (doc) return doc;
      } catch (err) {
        if (!isDemoModeEnabled()) throw err;
        console.warn('⚠️ Mongoose findByLicenseNumber doctor failed, using memory store:', err);
      }
    }

    if (!isDemoModeEnabled()) return null;

    const doc = memoryStore.doctors.find((d) => d.licenseNumber === licenseNumber && !d.isDeleted);
    if (!doc) return null;
    return doc as unknown as IDoctor;
  }

  public async findAll(query: GetDoctorsQuery) {
    assertDatabaseConnection();

    const { page = 1, limit = 15, department, specialization, status, search } = query;
    const skip = (page - 1) * limit;

    if (isDbConnected()) {
      try {
        const filter: any = { isDeleted: false };
        if (department) filter.department = department;
        if (specialization) filter.specialization = specialization;
        if (status) filter.status = status;
        if (search) {
          filter.$or = [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
            { specialization: { $regex: search, $options: 'i' } },
            { department: { $regex: search, $options: 'i' } },
            { licenseNumber: { $regex: search, $options: 'i' } },
          ];
        }

        const [doctors, total] = await Promise.all([
          DoctorModel.find(filter)
            .populate('userId', 'name email role avatar status')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .exec(),
          DoctorModel.countDocuments(filter),
        ]);

        const totalPages = Math.ceil(total / limit) || 1;

        return {
          doctors,
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
        console.warn('⚠️ Mongoose findAll doctors failed, using memory store:', err);
      }
    }

    if (!isDemoModeEnabled()) {
      return {
        doctors: [],
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

    let filtered = memoryStore.doctors.filter((d) => !d.isDeleted);
    if (department) filtered = filtered.filter((d) => d.department === department);
    if (specialization) filtered = filtered.filter((d) => d.specialization === specialization);
    if (status) filtered = filtered.filter((d) => d.status === status);
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.email.toLowerCase().includes(q) ||
          d.specialization.toLowerCase().includes(q) ||
          d.department.toLowerCase().includes(q) ||
          d.licenseNumber.toLowerCase().includes(q)
      );
    }

    const total = filtered.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const doctors = filtered.slice(skip, skip + limit) as unknown as IDoctor[];

    return {
      doctors,
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

  public async update(id: string, updateData: Partial<IDoctor>): Promise<IDoctor | null> {
    assertDatabaseConnection();

    if (isDbConnected() && Types.ObjectId.isValid(id)) {
      try {
        const doctor = await DoctorModel.findOneAndUpdate(
          { _id: id, isDeleted: false },
          { $set: updateData },
          { returnDocument: 'after', runValidators: true }
        ).exec();
        if (doctor) return doctor;
        if (!isDemoModeEnabled()) return null;
      } catch (err) {
        if (!isDemoModeEnabled()) throw err;
        console.warn('⚠️ Mongoose update doctor failed, using memory store:', err);
      }
    }

    if (!isDemoModeEnabled()) return null;

    const doc = memoryStore.doctors.find((d) => (d._id === id || d.id === id) && !d.isDeleted);
    if (!doc) return null;
    Object.assign(doc, updateData, { updatedAt: new Date() });
    return doc as unknown as IDoctor;
  }

  public async softDelete(id: string): Promise<IDoctor | null> {
    assertDatabaseConnection();

    if (isDbConnected() && Types.ObjectId.isValid(id)) {
      try {
        const doctor = await DoctorModel.findOneAndUpdate(
          { _id: id, isDeleted: false },
          { $set: { isDeleted: true, status: 'Inactive' } },
          { returnDocument: 'after' }
        ).exec();
        if (doctor) return doctor;
        if (!isDemoModeEnabled()) return null;
      } catch (err) {
        if (!isDemoModeEnabled()) throw err;
        console.warn('⚠️ Mongoose softDelete doctor failed, using memory store:', err);
      }
    }

    if (!isDemoModeEnabled()) return null;

    const doc = memoryStore.doctors.find((d) => (d._id === id || d.id === id) && !d.isDeleted);
    if (!doc) return null;
    doc.isDeleted = true;
    doc.status = 'Inactive';
    doc.updatedAt = new Date();
    return doc as unknown as IDoctor;
  }
}
