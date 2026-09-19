import { Schema, model, Document, Types } from 'mongoose';

export type ShiftType = 'Morning' | 'Evening' | 'Night';

export interface IReceptionist extends Document {
  userId: Types.ObjectId;
  name: string;
  email: string;
  phone: string;
  address?: string;
  avatar?: string;
  department: string;
  shift: ShiftType;
  deskNumber: string;
  status: 'Active' | 'On Leave' | 'Inactive';
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const receptionistSchema = new Schema<IReceptionist>(
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
      required: [true, 'Receptionist name is required'],
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
    deskNumber: {
      type: String,
      required: [true, 'Desk number is required'],
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

export const ReceptionistModel = model<IReceptionist>('Receptionist', receptionistSchema);
