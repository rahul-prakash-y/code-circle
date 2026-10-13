import mongoose, { Document, Schema, Model } from 'mongoose';

export type PointCategory = 'Attendance' | 'Coding' | 'Course' | 'Contest' | 'Bonus' | 'Adjustment';

export interface IPointTransaction extends Document {
  user: mongoose.Types.ObjectId;
  amount: number;
  category: PointCategory;
  title: string;
  description?: string;
  referenceId?: string;
  referenceModel?: string;
  classHours?: number[];
  metadata?: Record<string, any>;
  balanceAfter?: number;
  awardedBy?: mongoose.Types.ObjectId;
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

const pointTransactionSchema = new Schema<IPointTransaction>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    category: {
      type: String,
      enum: ['Attendance', 'Coding', 'Course', 'Contest', 'Bonus', 'Adjustment'],
      default: 'Attendance',
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    referenceId: {
      type: String,
      default: null,
      index: true,
    },
    referenceModel: {
      type: String,
      default: null,
    },
    classHours: {
      type: [Number],
      default: [],
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    balanceAfter: {
      type: Number,
      default: null,
    },
    awardedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

pointTransactionSchema.index({ user: 1, timestamp: -1 });
pointTransactionSchema.index({ user: 1, category: 1, timestamp: -1 });
pointTransactionSchema.index({ timestamp: -1 });

export const PointTransaction: Model<IPointTransaction> =
  mongoose.models.PointTransaction ||
  mongoose.model<IPointTransaction>('PointTransaction', pointTransactionSchema);

export default PointTransaction;
