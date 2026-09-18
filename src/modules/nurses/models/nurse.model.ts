import { Schema, model, Document, Types } from 'mongoose';

export type ShiftType = 'Morning' | 'Evening' | 'Night';

export interface INurse extends Document {
  userId: Types.ObjectId;
  name: string;
  email: string;
  phone: string;
  address?: string;
  avatar?: string;
  department: string;
  shift: ShiftType;
  licenseNumber: string;
  assignedWard: string;
  patientLoad?: number;
  assignedPatientIds?: string[];
  status: 'Active' | 'On Leave' | 'Inactive';
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const nurseSchema = new Schema<INurse>(
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
      required: [true, 'Nurse name is required'],
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
    address: {
      type: String,
      default: '',
    },
    avatar: {
      type: String,
      default: '',
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      index: true,
    },
    shift: {
      type: String,
      enum: ['Morning', 'Evening', 'Night'],
      required: [true, 'Shift assignment is required'],
    },
    licenseNumber: {
      type: String,
      required: [true, 'License number is required'],
      unique: true,
      trim: true,
    },
    assignedWard: {
      type: String,
      required: [true, 'Assigned ward is required'],
    },
    patientLoad: {
      type: Number,
      default: 0,
    },
    assignedPatientIds: {
      type: [String],
      default: [],
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

nurseSchema.index({ department: 1, shift: 1 });

export const NurseModel = model<INurse>('Nurse', nurseSchema);
