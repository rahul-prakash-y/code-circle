import mongoose, { Document, Schema, Model } from 'mongoose';

export type TeamStatus = 'Active' | 'Inactive' | 'Blocked';

export interface ITeam extends Document {
  name: string;
  description?: string;
  leader?: mongoose.Types.ObjectId;
  members: mongoose.Types.ObjectId[];
  event?: mongoose.Types.ObjectId;
  status: TeamStatus;
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const teamSchema = new Schema<ITeam>(
  {
    name: {
      type: String,
      required: [true, 'Team name is required'],
      trim: true,
      unique: true,
      minlength: [2, 'Team name must be at least 2 characters'],
      maxlength: [60, 'Team name cannot exceed 60 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
      default: '',
    },
    leader: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    members: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    event: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      default: null,
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive', 'Blocked'],
      default: 'Active',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Keep isActive in sync with status
teamSchema.pre('save', function () {
  if (this.isModified('status')) {
    this.isActive = this.status === 'Active';
  } else if (this.isModified('isActive')) {
    this.status = this.isActive ? 'Active' : 'Inactive';
  }
});

// Indexes for fast lookup
teamSchema.index({ name: 1 });
teamSchema.index({ status: 1 });
teamSchema.index({ members: 1 });
teamSchema.index({ event: 1 });
teamSchema.index({ createdBy: 1 });

const Team: Model<ITeam> = mongoose.models.Team || mongoose.model<ITeam>('Team', teamSchema);

export default Team;
