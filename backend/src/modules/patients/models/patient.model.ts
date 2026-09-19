import { Schema, model, Document, Types } from 'mongoose';

export type GenderType = 'Male' | 'Female' | 'Other';

export interface IEmergencyContact {
  name: string;
  relationship: string;
  phone: string;
}

export interface IPatient extends Document {
  userId?: Types.ObjectId;
  patientCode?: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  age?: number;
  dateOfBirth: string;
  gender: GenderType;
  bloodGroup: string;
  bloodType?: string;
  address: string;
  department?: string;
  doctor?: string;
  room?: string;
  condition?: string;
  admissionDate?: string;
  emergencyContact: IEmergencyContact;
  medicalHistory: any[];
  allergies: string[];
  insuranceProvider?: string;
  insurancePolicyNumber?: string;
  prescriptions?: any[];
  reports?: any[];
  billingInvoices?: any[];
  vitals?: any;
  status: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const emergencyContactSchema = new Schema<IEmergencyContact>(
  {
    name: { type: String, required: true },
    relationship: { type: String, default: 'Next of Kin' },
    phone: { type: String, default: '' },
  },
  { _id: false }
);

const patientSchema = new Schema<IPatient>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
      index: true,
    },
    patientCode: {
      type: String,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Patient name is required'],
      trim: true,
      index: true,
    },
    email: {
      type: String,
      required: [true, 'Patient email is required'],
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: [true, 'Patient phone number is required'],
      trim: true,
    },
    avatar: {
      type: String,
      default: '',
    },
    age: {
      type: Number,
      default: 35,
    },
    dateOfBirth: {
      type: String,
      default: '',
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other'],
      default: 'Male',
    },
    bloodGroup: {
      type: String,
      default: 'O+',
    },
    bloodType: {
      type: String,
      default: 'O+',
    },
    address: {
      type: String,
      default: 'Hospital Ward',
    },
    department: {
      type: String,
      default: 'General Medicine',
    },
    doctor: {
      type: String,
      default: 'Dr. Alex Morgan',
    },
    room: {
      type: String,
      default: 'Room 101',
    },
    condition: {
      type: String,
      default: 'Stable',
    },
    admissionDate: {
      type: String,
      default: () => new Date().toISOString().split('T')[0],
    },
    emergencyContact: {
      type: emergencyContactSchema,
      default: () => ({ name: 'Next of Kin', relationship: 'Family', phone: '' }),
    },
    medicalHistory: {
      type: Schema.Types.Mixed,
      default: [],
    },
    allergies: {
      type: [String],
      default: [],
    },
    insuranceProvider: {
      type: String,
      default: '',
    },
    insurancePolicyNumber: {
      type: String,
      default: '',
    },
    prescriptions: {
      type: Schema.Types.Mixed,
      default: [],
    },
    reports: {
      type: Schema.Types.Mixed,
      default: [],
    },
    billingInvoices: {
      type: Schema.Types.Mixed,
      default: [],
    },
    vitals: {
      type: Schema.Types.Mixed,
      default: () => ({
        bloodPressure: '120/80',
        heartRate: 72,
        temperature: 98.6,
        oxygenSaturation: 98,
      }),
    },
    status: {
      type: String,
      default: 'Admitted',
      index: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
    strict: false,
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

patientSchema.index({ name: 'text', email: 'text', phone: 'text' });

export const PatientModel = model<IPatient>('Patient', patientSchema);
