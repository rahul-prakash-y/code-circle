import mongoose, { Document, Schema, Model } from 'mongoose';

export interface INews extends Document {
  title: string;
  content: string;
  coverImage?: string;
  date: Date;
  author: mongoose.Types.ObjectId;
  tags: string[];
  pinned: boolean;
  isPublished: boolean;
  viewsCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const newsSchema = new Schema<INews>(
  {
    title: {
      type: String,
      required: [true, 'Article title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    content: {
      type: String,
      required: [true, 'Article content is required'],
    },
    coverImage: {
      type: String,
      default: '',
    },
    date: {
      type: Date,
      default: Date.now,
      index: true,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    tags: {
      type: [String],
      default: ['Announcement'],
      index: true,
    },
    pinned: {
      type: Boolean,
      default: false,
      index: true,
    },
    isPublished: {
      type: Boolean,
      default: true,
      index: true,
    },
    viewsCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// High-performance compound indexes for news feed queries & sorting
newsSchema.index({ isPublished: 1, pinned: -1, date: -1 });
newsSchema.index({ title: 'text', content: 'text' });

export const News: Model<INews> = mongoose.models.News || mongoose.model<INews>('News', newsSchema);
export default News;
