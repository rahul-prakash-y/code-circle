import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IDomain extends Document {
  name: string;
  description: string;
  coverImageUrl: string;
  createdAt: Date;
  updatedAt: Date;
}

const domainSchema = new Schema<IDomain>(
  {
    name: {
      type: String,
      required: [true, 'Domain name is required'],
      unique: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Domain description is required'],
      trim: true,
      default: '',
    },
    coverImageUrl: {
      type: String,
      required: [true, 'Cover image URL is required'],
      trim: true,
      default: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
    },
  },
  {
    timestamps: true,
  }
);

const Domain: Model<IDomain> =
  mongoose.models.Domain || mongoose.model<IDomain>('Domain', domainSchema);

export default Domain;
