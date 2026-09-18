import { Schema, model, Document } from 'mongoose';

export interface IActivityLog extends Document {
  user: string;
  action: string;
  details: string;
  time: string;
  ipAddress?: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const activityLogSchema = new Schema<IActivityLog>(
  {
    user: {
      type: String,
      required: [true, 'User name/email is required'],
      index: true,
    },
    action: {
      type: String,
      required: [true, 'Action name is required'],
      index: true,
    },
    details: {
      type: String,
      required: [true, 'Activity details are required'],
    },
    time: {
      type: String,
      required: [true, 'Timestamp string is required'],
    },
    ipAddress: {
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

activityLogSchema.index({ createdAt: -1 });

export const ActivityLogModel = model<IActivityLog>('ActivityLog', activityLogSchema);
