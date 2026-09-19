import { Schema, model, Document, Types } from 'mongoose';

export type PaymentStatus = 'Paid' | 'Pending' | 'Partial' | 'Overdue' | 'Refunded';
export type PaymentMethod = 'Cash' | 'Credit Card' | 'Insurance' | 'Bank Transfer' | 'Insurance Claim' | 'Apple Pay' | 'Bank Wire' | string;

export interface IPayment extends Document {
  patientId: Types.ObjectId | string;
  patientName: string;
  appointmentId?: Types.ObjectId | string;
  serviceName: string;
  amount: number;
  status: PaymentStatus;
  date: string;
  dueDate: string;
  paymentMethod: PaymentMethod;
  transactionId?: string;
  partialReason?: string;
  nextPaymentDate?: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    patientId: {
      type: Schema.Types.Mixed,
      required: [true, 'Patient ID is required'],
      index: true,
    },
    patientName: {
      type: String,
      required: [true, 'Patient name is required'],
      trim: true,
    },
    appointmentId: {
      type: Schema.Types.Mixed,
      required: false,
    },
    serviceName: {
      type: String,
      required: [true, 'Service name is required'],
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount cannot be negative'],
    },
    status: {
      type: String,
      enum: ['Paid', 'Pending', 'Partial', 'Overdue', 'Refunded'],
      default: 'Pending',
      index: true,
    },
    date: {
      type: String,
      required: [true, 'Date is required'],
      index: true,
    },
    dueDate: {
      type: String,
      required: [true, 'Due date is required'],
    },
    paymentMethod: {
      type: String,
      required: [true, 'Payment method is required'],
    },
    transactionId: {
      type: String,
      default: '',
    },
    partialReason: {
      type: String,
      default: '',
    },
    nextPaymentDate: {
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

paymentSchema.index({ status: 1, date: -1 });

export const PaymentModel = model<IPayment>('Payment', paymentSchema);
