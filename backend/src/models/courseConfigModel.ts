import mongoose, { Document, Schema, Model } from 'mongoose';

export interface ICourseConfig extends Document {
  coursesVisibleToAll: boolean;
  allowedStudentIds: mongoose.Types.ObjectId[];
  updatedBy?: mongoose.Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICourseConfigModel extends Model<ICourseConfig> {
  getOrCreate(): Promise<ICourseConfig>;
}

const courseConfigSchema = new Schema<ICourseConfig>(
  {
    coursesVisibleToAll: {
      type: Boolean,
      default: true,
      index: true,
    },
    allowedStudentIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
        index: true,
      },
    ],
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Singleton helper
courseConfigSchema.statics.getOrCreate = async function () {
  let config = await this.findOne();
  if (!config) {
    config = await this.create({
      coursesVisibleToAll: true,
      allowedStudentIds: [],
    });
  }
  return config;
};

const CourseConfig: ICourseConfigModel =
  (mongoose.models.CourseConfig as ICourseConfigModel) ||
  mongoose.model<ICourseConfig, ICourseConfigModel>('CourseConfig', courseConfigSchema);

export default CourseConfig;
