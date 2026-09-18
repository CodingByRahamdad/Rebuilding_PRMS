import { Schema, model, Document, Types } from 'mongoose';

export type AppointmentStatus = 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled';
export type AppointmentType =
  | 'In-Person'
  | 'Video Call'
  | 'Follow-up'
  | 'Emergency'
  | 'Procedure'
  | 'Check-up'
  | 'Consultation';

export interface IAppointment extends Document {
  patientId: Types.ObjectId | string;
  patientName: string;
  doctorId: Types.ObjectId | string;
  doctorName: string;
  department: string;
  date: string;
  time: string;
  type: AppointmentType | string;
  status: AppointmentStatus;
  symptoms?: string;
  notes?: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const appointmentSchema = new Schema<IAppointment>(
  {
    patientId: {
      type: Schema.Types.Mixed,
      required: false,
      default: () => `PT-${Math.floor(1000 + Math.random() * 9000)}`,
      index: true,
    },
    patientName: {
      type: String,
      required: [true, 'Patient name is required'],
      trim: true,
    },
    doctorId: {
      type: Schema.Types.Mixed,
      required: false,
      default: () => `doc-${Math.floor(100 + Math.random() * 900)}`,
      index: true,
    },
    doctorName: {
      type: String,
      required: [true, 'Doctor name is required'],
      trim: true,
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      index: true,
    },
    date: {
      type: String,
      required: [true, 'Appointment date is required'],
      index: true,
    },
    time: {
      type: String,
      required: [true, 'Appointment time is required'],
    },
    type: {
      type: String,
      enum: [
        'In-Person',
        'Video Call',
        'Follow-up',
        'Emergency',
        'Procedure',
        'Check-up',
        'Consultation',
      ],
      default: 'Consultation',
    },
    status: {
      type: String,
      enum: ['Pending', 'Confirmed', 'Completed', 'Cancelled'],
      default: 'Pending',
      index: true,
    },
    symptoms: {
      type: String,
      default: '',
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

appointmentSchema.index({ date: 1, doctorId: 1, status: 1 });
appointmentSchema.index({ patientId: 1, date: -1 });

export const AppointmentModel = model<IAppointment>('Appointment', appointmentSchema);
