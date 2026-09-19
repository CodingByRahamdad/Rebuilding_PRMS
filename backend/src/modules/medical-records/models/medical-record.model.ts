import { Schema, model, Document, Types } from 'mongoose';

export interface IPrescriptionItem {
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
}

export interface ILabResult {
  testName: string;
  result: string;
  date: string;
  normalRange: string;
  status: 'Normal' | 'Abnormal';
}

export interface IVitalSigns {
  bloodPressure: string;
  heartRate: string;
  temperature: string;
  weight: string;
  height: string;
}

export interface IMedicalRecord extends Document {
  patientId: Types.ObjectId | string;
  patientName: string;
  patientCode?: string;
  doctorId: Types.ObjectId | string;
  doctorName: string;
  recordCode?: string;
  reportType?: string;
  category?: string;
  date: string;
  diagnosis: string;
  treatment?: string;
  symptoms: string[];
  prescription: any;
  labResults: any[];
  labResultSummary?: string;
  vitalSigns?: IVitalSigns;
  status?: string;
  attachments?: any[];
  notes?: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const prescriptionSchema = new Schema<IPrescriptionItem>(
  {
    medication: { type: String, required: true },
    dosage: { type: String, required: true },
    frequency: { type: String, required: true },
    duration: { type: String, required: true },
  },
  { _id: false }
);

const labResultSchema = new Schema<ILabResult>(
  {
    testName: { type: String, required: true },
    result: { type: String, required: true },
    date: { type: String, required: true },
    normalRange: { type: String, required: true },
    status: { type: String, enum: ['Normal', 'Abnormal'], required: true },
  },
  { _id: false }
);

const vitalSignsSchema = new Schema<IVitalSigns>(
  {
    bloodPressure: { type: String, default: '' },
    heartRate: { type: String, default: '' },
    temperature: { type: String, default: '' },
    weight: { type: String, default: '' },
    height: { type: String, default: '' },
  },
  { _id: false }
);

const medicalRecordSchema = new Schema<IMedicalRecord>(
  {
    patientId: {
      type: Schema.Types.Mixed,
      required: [true, 'Patient ID is required'],
      index: true,
    },
    patientName: {
      type: String,
      required: [true, 'Patient name is required'],
    },
    patientCode: {
      type: String,
      default: '',
    },
    doctorId: {
      type: Schema.Types.Mixed,
      required: false,
      default: 'doc-1',
      index: true,
    },
    doctorName: {
      type: String,
      default: 'Dr. Sarah Jenkins',
    },
    recordCode: {
      type: String,
      default: '',
    },
    reportType: {
      type: String,
      default: 'Diagnostic Report',
    },
    category: {
      type: String,
      default: 'General',
    },
    date: {
      type: String,
      required: [true, 'Record date is required'],
      index: true,
    },
    diagnosis: {
      type: String,
      required: [true, 'Diagnosis is required'],
    },
    treatment: {
      type: String,
      default: '',
    },
    symptoms: {
      type: [String],
      default: [],
    },
    prescription: {
      type: Schema.Types.Mixed,
      default: [],
    },
    labResults: {
      type: [Object],
      default: [],
    },
    labResultSummary: {
      type: String,
      default: '',
    },
    vitalSigns: {
      type: vitalSignsSchema,
      required: false,
      default: () => ({ bloodPressure: '', heartRate: '', temperature: '', weight: '', height: '' }),
    },
    status: {
      type: String,
      default: 'Active',
    },
    attachments: {
      type: [Object],
      default: [],
    },
    notes: {
      type: String,
      default: '',
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: any) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

medicalRecordSchema.index({ patientId: 1, date: -1 });

export const MedicalRecordModel = model<IMedicalRecord>('MedicalRecord', medicalRecordSchema);
