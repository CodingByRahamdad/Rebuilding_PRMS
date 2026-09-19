import { Schema, model, Document } from 'mongoose';

export interface IService extends Document {
  name: string;
  category: string;
  department: string;
  cost: number;
  description: string;
  durationMinutes: number;
  isAvailable: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const serviceSchema = new Schema<IService>(
  {
    name: {
      type: String,
      required: [true, 'Service name is required'],
      trim: true,
      unique: true,
      index: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      index: true,
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      index: true,
    },
    cost: {
      type: Number,
      required: [true, 'Cost is required'],
      min: [0, 'Cost cannot be negative'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
    },
    durationMinutes: {
      type: Number,
      required: [true, 'Duration in minutes is required'],
      min: [1, 'Duration must be at least 1 minute'],
    },
    isAvailable: {
      type: Boolean,
      default: true,
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

export const ServiceModel = model<IService>('Service', serviceSchema);
