import { Schema, model, Document } from 'mongoose';

export type UserRole = 'Super Admin' | 'Doctor' | 'Nurse' | 'Receptionist' | 'Patient';
export type UserStatus = 'Active' | 'On Leave' | 'Inactive';

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  avatar?: string;
  status: UserStatus;
  phone: string;
  refreshToken?: string;
  passwordResetTokenHash?: string | null;
  passwordResetExpires?: Date | null;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
      select: false, // Hidden by default in queries for security
    },
    role: {
      type: String,
      enum: ['Super Admin', 'Doctor', 'Nurse', 'Receptionist', 'Patient'],
      required: [true, 'Role is required'],
      index: true,
    },
    avatar: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['Active', 'On Leave', 'Inactive'],
      default: 'Active',
      index: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    refreshToken: {
      type: String,
      select: false,
    },
    passwordResetTokenHash: {
      type: String,
      select: false,
    },
    passwordResetExpires: {
      type: Date,
      select: false,
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
        delete ret.passwordHash;
        delete ret.refreshToken;
        delete ret.passwordResetTokenHash;
        delete ret.passwordResetExpires;
        return ret;
      },
    },
  }
);

// Indexes
userSchema.index({ email: 1, isDeleted: 1 });
userSchema.index({ role: 1, isDeleted: 1 });

export const UserModel = model<IUser>('User', userSchema);
