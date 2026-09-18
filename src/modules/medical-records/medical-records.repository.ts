import mongoose from 'mongoose';
import { MedicalRecordModel, IMedicalRecord } from './models/medical-record.model';
import { GetMedicalRecordsQuery } from './medical-records.validation';
import { memoryStore, InMemoryMedicalRecord } from '../../shared/database/memory-store';
import { assertDatabaseConnection, isDemoModeEnabled, isDbConnected } from '../../shared/database/db-guard';

export class MedicalRecordRepository {
  public async create(data: Partial<IMedicalRecord>): Promise<IMedicalRecord> {
    assertDatabaseConnection();

    const recordCode = (data as any).recordCode || `MR-2026-0${Math.floor(100 + Math.random() * 900)}`;
    const enrichedData = {
      ...data,
      recordCode,
      reportType: (data as any).reportType || 'Diagnostic Report',
      category: (data as any).category || 'General',
      status: (data as any).status || 'Active',
      treatment: (data as any).treatment || '',
      labResultSummary: (data as any).labResultSummary || '',
    };

    if (isDbConnected()) {
      try {
        const created = await MedicalRecordModel.create(enrichedData);
        return created;
      } catch (err) {
        if (!isDemoModeEnabled()) throw err;
        console.warn('⚠️ Mongoose create medical record failed, using memory store:', err);
      }
    }

    const newId = `rec-${Date.now()}`;
    const newRecord: InMemoryMedicalRecord = {
      _id: newId,
      id: newId,
      recordCode,
      patientId: String(data.patientId || 'p-1'),
      patientName: data.patientName || 'Patient',
      doctorId: String(data.doctorId || 'doc-1'),
      doctorName: data.doctorName || 'Dr. Sarah Jenkins',
      date: data.date || new Date().toISOString().split('T')[0],
      diagnosis: data.diagnosis || 'Routine clinical assessment',
      symptoms: data.symptoms || [],
      treatment: (data as any).treatment || '',
      prescription: data.prescription || [],
      labResults: data.labResults || [],
      vitalSigns: data.vitalSigns || { bloodPressure: '120/80', heartRate: '72', temperature: '98.6', weight: '70', height: '175' },
      reportType: (data as any).reportType || 'Diagnostic Report',
      labResultSummary: (data as any).labResultSummary || '',
      status: (data as any).status || 'Active',
      notes: data.notes || '',
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    memoryStore.medicalRecords.unshift(newRecord);

    // Sync to patient's reports in memory store if patient found
    const targetPatient = memoryStore.patients.find(
      (p) => p._id === data.patientId || p.id === data.patientId || p.patientCode === data.patientId || (data.patientName && p.name.toLowerCase() === data.patientName.toLowerCase())
    );
    if (targetPatient) {
      const newReport = {
        id: `rep-${Date.now()}`,
        title: (data as any).reportType || data.diagnosis || 'Clinical Report',
        category: (data as any).category || 'Clinical Summary',
        date: data.date || new Date().toISOString().split('T')[0],
        doctor: data.doctorName || targetPatient.doctor,
        fileUrl: (data as any).attachments?.[0]?.url || (data as any).attachments?.[0] || undefined,
        fileName: (data as any).attachments?.[0]?.name || `${((data as any).reportType || 'Medical_Record').replace(/\s+/g, '_')}.pdf`,
        fileSize: (data as any).attachments?.[0]?.size || '1.2 MB',
        fileType: 'pdf',
        attachments: (data as any).attachments || [],
        notes: (data as any).notes || (data as any).treatment || '',
        status: (data as any).status || 'Active',
        structuredData: {
          diagnosis: data.diagnosis || targetPatient.condition,
          summary: (data as any).treatment || data.notes || 'Clinical examination and diagnostic review completed.',
        },
      };
      if (!targetPatient.reports) targetPatient.reports = [];
      targetPatient.reports.unshift(newReport);
    }

    return newRecord as unknown as IMedicalRecord;
  }

  public async findById(id: string): Promise<IMedicalRecord | null> {
    assertDatabaseConnection();

    if (isDbConnected()) {
      try {
        const record = await MedicalRecordModel.findOne({ _id: id, isDeleted: false }).exec();
        if (record) return record;
      } catch (err) {
        if (!isDemoModeEnabled()) throw err;
        console.warn('⚠️ Mongoose findById medical record failed, using memory store:', err);
      }
    }

    if (!isDemoModeEnabled()) return null;

    const record = memoryStore.medicalRecords.find((r) => (r._id === id || r.id === id || r.recordCode === id) && !r.isDeleted);
    if (!record) return null;
    return record as unknown as IMedicalRecord;
  }

  public async findAll(query: GetMedicalRecordsQuery) {
    assertDatabaseConnection();

    const { page = 1, limit = 10, patientId, doctorId, search, category, status } = query;
    const skip = (page - 1) * limit;

    if (isDbConnected()) {
      try {
        const filter: any = { isDeleted: false };
        if (patientId) filter.patientId = patientId;
        if (doctorId) filter.doctorId = doctorId;
        if (category && category !== 'All') filter.category = category;
        if (status && status !== 'All') filter.status = status;
        if (search) {
          filter.$or = [
            { patientName: { $regex: search, $options: 'i' } },
            { doctorName: { $regex: search, $options: 'i' } },
            { diagnosis: { $regex: search, $options: 'i' } },
            { recordCode: { $regex: search, $options: 'i' } },
            { reportType: { $regex: search, $options: 'i' } },
            { category: { $regex: search, $options: 'i' } },
            { treatment: { $regex: search, $options: 'i' } },
            { symptoms: { $in: [new RegExp(search, 'i')] } },
          ];
        }

        const [records, total] = await Promise.all([
          MedicalRecordModel.find(filter)
            .sort({ date: -1, createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .exec(),
          MedicalRecordModel.countDocuments(filter),
        ]);

        const totalPages = Math.ceil(total / limit) || 1;

        return {
          records,
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
        console.warn('⚠️ Mongoose findAll medical records failed, using memory store:', err);
      }
    }

    if (!isDemoModeEnabled()) {
      return {
        records: [],
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

    let filtered = memoryStore.medicalRecords.filter((r) => !r.isDeleted);
    if (patientId) filtered = filtered.filter((r) => r.patientId === patientId);
    if (doctorId) filtered = filtered.filter((r) => r.doctorId === doctorId);
    if (category && category !== 'All') {
      filtered = filtered.filter((r) => (r as any).category === category || (r as any).reportType?.includes(category));
    }
    if (status && status !== 'All') {
      filtered = filtered.filter((r) => (r as any).status === status);
    }
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          (r.patientName && r.patientName.toLowerCase().includes(q)) ||
          (r.doctorName && r.doctorName.toLowerCase().includes(q)) ||
          (r.diagnosis && r.diagnosis.toLowerCase().includes(q)) ||
          (r.recordCode && r.recordCode.toLowerCase().includes(q)) ||
          (r.patientId && r.patientId.toLowerCase().includes(q)) ||
          ((r as any).reportType && (r as any).reportType.toLowerCase().includes(q)) ||
          ((r as any).treatment && (r as any).treatment.toLowerCase().includes(q)) ||
          ((r as any).category && (r as any).category.toLowerCase().includes(q))
      );
    }

    const total = filtered.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const records = filtered.slice(skip, skip + limit) as unknown as IMedicalRecord[];

    return {
      records,
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

  public async update(id: string, updateData: Partial<IMedicalRecord>): Promise<IMedicalRecord | null> {
    assertDatabaseConnection();

    if (isDbConnected()) {
      try {
        const record = await MedicalRecordModel.findOneAndUpdate(
          { _id: id, isDeleted: false },
          { $set: updateData },
          { returnDocument: 'after', runValidators: true }
        ).exec();
        if (record) return record;
        if (!isDemoModeEnabled()) return null;
      } catch (err) {
        if (!isDemoModeEnabled()) throw err;
        console.warn('⚠️ Mongoose update medical record failed, using memory store:', err);
      }
    }

    if (!isDemoModeEnabled()) return null;

    const record = memoryStore.medicalRecords.find((r) => (r._id === id || r.id === id) && !r.isDeleted);
    if (!record) return null;
    Object.assign(record, updateData, { updatedAt: new Date() });
    return record as unknown as IMedicalRecord;
  }

  public async softDelete(id: string): Promise<IMedicalRecord | null> {
    assertDatabaseConnection();

    if (isDbConnected()) {
      try {
        const record = await MedicalRecordModel.findOneAndUpdate(
          { _id: id, isDeleted: false },
          { $set: { isDeleted: true } },
          { returnDocument: 'after' }
        ).exec();
        if (record) return record;
        if (!isDemoModeEnabled()) return null;
      } catch (err) {
        if (!isDemoModeEnabled()) throw err;
        console.warn('⚠️ Mongoose softDelete medical record failed, using memory store:', err);
      }
    }

    if (!isDemoModeEnabled()) return null;

    const record = memoryStore.medicalRecords.find((r) => (r._id === id || r.id === id) && !r.isDeleted);
    if (!record) return null;
    record.isDeleted = true;
    record.updatedAt = new Date();
    return record as unknown as IMedicalRecord;
  }
}
