import { MedicalRecordRepository } from './medical-records.repository';
import { PatientRepository } from '../patients/patients.repository';
import { DoctorRepository } from '../doctors/doctors.repository';
import {
  CreateMedicalRecordInput,
  UpdateMedicalRecordInput,
  GetMedicalRecordsQuery,
} from './medical-records.validation';
import { NotFoundError } from '../../shared/errors/app-error';
import { logActivity, ActivityActor } from '../../shared/utils/activity-logger';

export class MedicalRecordService {
  private medicalRecordRepository: MedicalRecordRepository;
  private patientRepository: PatientRepository;
  private doctorRepository: DoctorRepository;

  constructor() {
    this.medicalRecordRepository = new MedicalRecordRepository();
    this.patientRepository = new PatientRepository();
    this.doctorRepository = new DoctorRepository();
  }

  private toSafeRecord(r: any) {
    if (!r) return null;
    const item = typeof r.toJSON === 'function' ? r.toJSON() : { ...r };
    if (!item.id && item._id) {
      item.id = String(item._id);
    }
    return item;
  }

  public async createMedicalRecord(input: CreateMedicalRecordInput, actor?: ActivityActor) {
    let patientName = input.patientName;
    let doctorName = input.doctorName;

    if (input.patientId) {
      const patient = await this.patientRepository.findById(input.patientId);
      if (patient) patientName = patient.name;
    }

    if (input.doctorId) {
      const doctor = await this.doctorRepository.findById(input.doctorId);
      if (doctor) doctorName = doctor.name;
    }

    const record = await this.medicalRecordRepository.create({
      patientId: input.patientId,
      patientName,
      patientCode: input.patientCode,
      doctorId: input.doctorId,
      doctorName,
      recordCode: input.recordCode,
      reportType: input.reportType,
      category: input.category,
      date: input.date,
      diagnosis: input.diagnosis,
      treatment: input.treatment,
      symptoms: input.symptoms || [],
      prescription: input.prescription || [],
      labResults: input.labResults || [],
      labResultSummary: input.labResultSummary,
      vitalSigns: input.vitalSigns || { bloodPressure: '', heartRate: '', temperature: '', weight: '', height: '' },
      status: input.status || 'Active',
      attachments: input.attachments || [],
      notes: input.notes || '',
    });

    const result = this.toSafeRecord(record);
    await logActivity(actor, 'created', 'Medical Record', `${patientName} (${input.diagnosis})`);
    return result;
  }

  public async getMedicalRecords(query: GetMedicalRecordsQuery) {
    const result = await this.medicalRecordRepository.findAll(query);
    return {
      records: result.records.map((r) => this.toSafeRecord(r)),
      meta: result.meta,
    };
  }

  public async getMedicalRecordById(id: string) {
    const record = await this.medicalRecordRepository.findById(id);
    if (!record) {
      throw new NotFoundError('Medical record not found.');
    }
    return this.toSafeRecord(record);
  }

  public async updateMedicalRecord(id: string, input: UpdateMedicalRecordInput, actor?: ActivityActor) {
    const record = await this.medicalRecordRepository.findById(id);
    if (!record) {
      throw new NotFoundError('Medical record not found.');
    }

    const updatedRecord = await this.medicalRecordRepository.update(id, input);
    const result = this.toSafeRecord(updatedRecord);
    await logActivity(actor, 'updated', 'Medical Record', `${record.patientName} (${id})`);
    return result;
  }

  public async deleteMedicalRecord(id: string, actor?: ActivityActor) {
    const record = await this.medicalRecordRepository.findById(id);
    if (!record) {
      throw new NotFoundError('Medical record not found.');
    }

    await this.medicalRecordRepository.softDelete(id);
    await logActivity(actor, 'deleted', 'Medical Record', `${record.patientName} (${id})`);
  }
}
