import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IStudentProgress extends Document {
  userId: mongoose.Types.ObjectId;
  completedLevels: mongoose.Types.ObjectId[];
  unlockedAssessments: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const studentProgressSchema = new Schema<IStudentProgress>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      unique: true,
      index: true,
    },
    completedLevels: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Level',
      },
    ],
    unlockedAssessments: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Assessment',
      },
    ],
  },
  {
    timestamps: true,
  }
);

const StudentProgress: Model<IStudentProgress> =
  mongoose.models.StudentProgress ||
  mongoose.model<IStudentProgress>('StudentProgress', studentProgressSchema);

export default StudentProgress;
