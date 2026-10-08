import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IDomainEnrollment extends Document {
  userId: mongoose.Types.ObjectId;
  domainId: mongoose.Types.ObjectId;
  enrolledAt: Date;
  status: 'enrolled' | 'in_progress' | 'completed';
  completedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const domainEnrollmentSchema = new Schema<IDomainEnrollment>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    domainId: {
      type: Schema.Types.ObjectId,
      ref: 'Domain',
      required: [true, 'Domain ID is required'],
      index: true,
    },
    enrolledAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    status: {
      type: String,
      enum: ['enrolled', 'in_progress', 'completed'],
      default: 'enrolled',
      index: true,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Unique compound index so a student cannot register twice for the same domain / course
domainEnrollmentSchema.index({ userId: 1, domainId: 1 }, { unique: true });

const DomainEnrollment: Model<IDomainEnrollment> =
  mongoose.models.DomainEnrollment ||
  mongoose.model<IDomainEnrollment>('DomainEnrollment', domainEnrollmentSchema);

export default DomainEnrollment;
