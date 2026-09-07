import mongoose, { Document, Schema, Model } from 'mongoose';
import bcrypt from 'bcryptjs';
import { UserRole, ISocialLinks } from '../types';

export interface IUser extends Document {
  name: string;
  rollNo: string;
  email: string;
  role: UserRole;
  password: string;
  isBlocked: boolean;
  mustChangePassword: boolean;
  activeSessionId?: string | null;
  department?: string;
  skills: string[];
  socialLinks: ISocialLinks;
  profilePicUrl?: string;
  resetPasswordToken?: string | null;
  resetPasswordExpires?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    rollNo: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    role: {
      type: String,
      enum: ['Student', 'Admin', 'SuperAdmin', 'Member', 'Faculty', 'Committee'],
      default: 'Student',
      required: true,
      index: true,
    },
    password: { type: String, required: true },
    isBlocked: { type: Boolean, default: false, index: true },
    mustChangePassword: { type: Boolean, default: false },
    activeSessionId: { type: String, default: null },
    department: { type: String, trim: true, index: true },
    skills: [{ type: String, trim: true }],
    socialLinks: {
      github: { type: String, default: '' },
      linkedin: { type: String, default: '' },
      leetcode: { type: String, default: '' },
      hackerrank: { type: String, default: '' },
      instagram: { type: String, default: '' },
      email: { type: String, default: '' },
    },
    profilePicUrl: { type: String, default: '' },
    resetPasswordToken: { type: String, default: null, index: true },
    resetPasswordExpires: { type: Date, default: null },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for fast lookups and administration filtering
userSchema.index({ role: 1, isBlocked: 1 });
userSchema.index({ department: 1, role: 1 });
userSchema.index({ createdAt: -1 });

// Password hashing hook with idempotency protection against double-hashing
userSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }
  // If the password is already a valid bcrypt hash, do not hash again
  if (this.password.startsWith('$2a$') || this.password.startsWith('$2b$')) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Password verification method
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', userSchema);
export default User;
