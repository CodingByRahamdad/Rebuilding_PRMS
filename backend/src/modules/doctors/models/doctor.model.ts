import { Schema, model, Document, Types } from 'mongoose';

export interface IDoctor extends Document {
  userId: Types.ObjectId;
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
  rating: number;
  totalPatients: number;
  status: 'Active' | 'On Leave' | 'Inactive';
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const doctorSchema = new Schema<IDoctor>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Doctor name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
    },
    avatar: {
      type: String,
      default: '',
    },
    age: {
      type: Number,
      min: 18,
      max: 120,
    },
    address: {
      type: String,
      trim: true,
      default: '',
    },
    specialization: {
      type: String,
      required: [true, 'Specialization is required'],
      index: true,
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      index: true,
    },
    licenseNumber: {
      type: String,
      required: [true, 'License number is required'],
      unique: true,
      trim: true,
    },
    experience: {
      type: String,
      required: [true, 'Experience duration is required'],
    },
    consultationFee: {
      type: Number,
      required: [true, 'Consultation fee is required'],
      min: [0, 'Fee cannot be negative'],
    },
    availability: {
      type: String,
      default: 'Mon-Fri, 09:00 AM - 05:00 PM',
    },
    rating: {
      type: Number,
      default: 4.8,
      min: 0,
      max: 5,
    },
    totalPatients: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['Active', 'On Leave', 'Inactive'],
      default: 'Active',
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

doctorSchema.index({ department: 1, status: 1 });
doctorSchema.index({ specialization: 1 });

export const DoctorModel = model<IDoctor>('Doctor', doctorSchema);
