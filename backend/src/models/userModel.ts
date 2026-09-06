import mongoose, { Document, Schema, Model } from 'mongoose';
import bcrypt from 'bcryptjs';
import { UserRole } from '../types';

export interface ISocialLinks {
  github?: string;
  linkedin?: string;
  leetcode?: string;
  hackerrank?: string;
}

export interface IUser extends Document {
  name: string;
  rollNo: string;
  email: string;
  role: UserRole;
  password: string;
  isBlocked: boolean;
  activeSessionId?: string | null;
  department?: string;
  skills: string[];
  socialLinks: ISocialLinks;
  profilePicUrl?: string;
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
      enum: ['Student', 'Admin', 'SuperAdmin'],
      default: 'Student',
      required: true,
      index: true,
    },
    password: { type: String, required: true },
    isBlocked: { type: Boolean, default: false, index: true },
    activeSessionId: { type: String, default: null },
    department: { type: String, trim: true, index: true },
    skills: [{ type: String, trim: true }],
    socialLinks: {
      github: { type: String, default: '' },
      linkedin: { type: String, default: '' },
      leetcode: { type: String, default: '' },
      hackerrank: { type: String, default: '' },
    },
    profilePicUrl: { type: String, default: '' },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for heavily queried filters
userSchema.index({ role: 1, isBlocked: 1 });
userSchema.index({ department: 1, role: 1 });

// Password hashing hook
userSchema.pre('save', async function () {
  if (!this.isModified('password')) {
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
