import mongoose, { Document, Schema } from 'mongoose';

export interface IStudentBearer extends Document {
  name: string;
  position: string;
  photoUrl: string;
  linkedinUrl?: string;
  bio: string;
  createdAt: Date;
  updatedAt: Date;
}

const studentBearerSchema = new Schema<IStudentBearer>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    position: {
      type: String,
      required: [true, 'Position is required'],
      trim: true,
    },
    photoUrl: {
      type: String,
      required: [true, 'Photo URL is required'],
      trim: true,
    },
    linkedinUrl: {
      type: String,
      default: '',
      trim: true,
    },
    bio: {
      type: String,
      maxlength: [120, 'Bio cannot exceed 120 characters'],
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export const StudentBearer = mongoose.model<IStudentBearer>(
  'StudentBearer',
  studentBearerSchema
);

export default StudentBearer;
