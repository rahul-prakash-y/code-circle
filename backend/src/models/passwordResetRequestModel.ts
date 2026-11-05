import mongoose, { Document, Schema, Model } from 'mongoose';

export type ResetRequestStatus = 'pending' | 'approved' | 'rejected';

export interface IPasswordResetRequest extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  email: string;
  rollNo: string;
  department?: string;
  status: ResetRequestStatus;
  resetToken?: string | null;
  resetTokenExpires?: Date | null;
  emailSent: boolean;
  emailSentAt?: Date | null;
  emailError?: string | null;
  emailAttempts: number;
  approvedBy?: mongoose.Types.ObjectId | null;
  approvedAt?: Date | null;
  rejectedBy?: mongoose.Types.ObjectId | null;
  rejectedAt?: Date | null;
  rejectionReason?: string | null;
  isUsed: boolean;
  usedAt?: Date | null;
  verificationMethod: 'password' | 'rollNo';
  reason?: string;
  requestIp?: string;
  createdAt: Date;
  updatedAt: Date;
}

const passwordResetRequestSchema = new Schema<IPasswordResetRequest>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    rollNo: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    department: {
      type: String,
      default: '',
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
    resetToken: {
      type: String,
      default: null,
      index: true,
    },
    resetTokenExpires: {
      type: Date,
      default: null,
    },
    emailSent: {
      type: Boolean,
      default: false,
      index: true,
    },
    emailSentAt: {
      type: Date,
      default: null,
    },
    emailError: {
      type: String,
      default: null,
    },
    emailAttempts: {
      type: Number,
      default: 0,
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    rejectedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    rejectedAt: {
      type: Date,
      default: null,
    },
    rejectionReason: {
      type: String,
      default: null,
    },
    isUsed: {
      type: Boolean,
      default: false,
      index: true,
    },
    usedAt: {
      type: Date,
      default: null,
    },
    verificationMethod: {
      type: String,
      enum: ['password', 'rollNo'],
      default: 'password',
    },
    reason: {
      type: String,
      default: '',
      trim: true,
    },
    requestIp: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for fast admin querying and filtering
passwordResetRequestSchema.index({ status: 1, emailSent: 1, createdAt: -1 });
passwordResetRequestSchema.index({ email: 1, status: 1 });

const PasswordResetRequest: Model<IPasswordResetRequest> =
  mongoose.models.PasswordResetRequest ||
  mongoose.model<IPasswordResetRequest>('PasswordResetRequest', passwordResetRequestSchema);

export default PasswordResetRequest;
