import mongoose, { Document, Schema, Model } from 'mongoose';

export type CertificateType = 'EVENT' | 'COURSE' | 'ASSESSMENT' | 'CUSTOM' | 'HACKATHON';
export type CertificateTheme = 'modern-blue' | 'executive-gold' | 'cyber-dark' | 'emerald-minimal' | 'ruby-elegance';
export type CertificateOrientation = 'landscape' | 'portrait';
export type CertificateStatus = 'ACTIVE' | 'REVOKED';

export interface ICertificateTemplate extends Document {
  title: string;
  subtitle: string;
  description: string;
  type: CertificateType;
  theme: CertificateTheme;
  orientation: CertificateOrientation;
  bgImageUrl?: string;
  badgeUrl?: string;
  signatureUrl?: string;
  signatoryName: string;
  signatoryTitle: string;
  signatoryOrganization: string;
  secondarySignatoryName?: string;
  secondarySignatoryTitle?: string;
  primaryColor: string;
  accentColor: string;
  associatedEventId?: mongoose.Types.ObjectId;
  associatedDomainId?: mongoose.Types.ObjectId;
  isActive: boolean;
  issuedCount: number;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IIssuedCertificate extends Document {
  certificateId: string; // Unique human-readable ID e.g., CC-CERT-2026-9F8A1B
  verificationCode: string; // 8-char crypto token for public verification
  templateId?: mongoose.Types.ObjectId;
  recipientUser: mongoose.Types.ObjectId;
  recipientName: string;
  recipientEmail: string;
  recipientRollNo?: string;
  title: string;
  subtitle: string;
  description: string;
  type: CertificateType;
  issuerOrganization: string;
  signatoryName: string;
  signatoryTitle: string;
  secondarySignatoryName?: string;
  secondarySignatoryTitle?: string;
  issueDate: Date;
  status: CertificateStatus;
  revocationReason?: string;
  revokedAt?: Date;
  certificatePdfUrl?: string;
  associatedEventId?: mongoose.Types.ObjectId;
  associatedDomainId?: mongoose.Types.ObjectId;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const certificateTemplateSchema = new Schema<ICertificateTemplate>(
  {
    title: {
      type: String,
      required: [true, 'Template title is required'],
      trim: true,
    },
    subtitle: {
      type: String,
      default: 'Certificate of Appreciation & Excellence',
      trim: true,
    },
    description: {
      type: String,
      default: 'In recognition of outstanding performance, active participation, and technical excellence.',
      trim: true,
    },
    type: {
      type: String,
      enum: ['EVENT', 'COURSE', 'ASSESSMENT', 'CUSTOM', 'HACKATHON'],
      default: 'EVENT',
    },
    theme: {
      type: String,
      enum: ['modern-blue', 'executive-gold', 'cyber-dark', 'emerald-minimal', 'ruby-elegance'],
      default: 'modern-blue',
    },
    orientation: {
      type: String,
      enum: ['landscape', 'portrait'],
      default: 'landscape',
    },
    bgImageUrl: {
      type: String,
      default: '',
    },
    badgeUrl: {
      type: String,
      default: '',
    },
    signatureUrl: {
      type: String,
      default: '',
    },
    signatoryName: {
      type: String,
      default: 'Dr. S. K. Ramesh',
      trim: true,
    },
    signatoryTitle: {
      type: String,
      default: 'Faculty Coordinator & Club Advisor',
      trim: true,
    },
    signatoryOrganization: {
      type: String,
      default: 'Code Circle · Bannari Amman Institute of Technology',
      trim: true,
    },
    secondarySignatoryName: {
      type: String,
      default: 'President, Code Circle',
      trim: true,
    },
    secondarySignatoryTitle: {
      type: String,
      default: 'Technical Club Executive Board',
      trim: true,
    },
    primaryColor: {
      type: String,
      default: '#3b82f6',
    },
    accentColor: {
      type: String,
      default: '#1e40af',
    },
    associatedEventId: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      default: null,
    },
    associatedDomainId: {
      type: Schema.Types.ObjectId,
      ref: 'Domain',
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    issuedCount: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

const issuedCertificateSchema = new Schema<IIssuedCertificate>(
  {
    certificateId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    verificationCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    templateId: {
      type: Schema.Types.ObjectId,
      ref: 'CertificateTemplate',
      default: null,
    },
    recipientUser: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    recipientName: {
      type: String,
      required: true,
      trim: true,
    },
    recipientEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    recipientRollNo: {
      type: String,
      default: '',
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    subtitle: {
      type: String,
      default: 'Certificate of Excellence',
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    type: {
      type: String,
      enum: ['EVENT', 'COURSE', 'ASSESSMENT', 'CUSTOM', 'HACKATHON'],
      default: 'EVENT',
    },
    issuerOrganization: {
      type: String,
      default: 'Code Circle · Bannari Amman Institute of Technology',
    },
    signatoryName: {
      type: String,
      default: 'Faculty Advisor',
    },
    signatoryTitle: {
      type: String,
      default: 'Code Circle Executive Committee',
    },
    secondarySignatoryName: {
      type: String,
      default: '',
    },
    secondarySignatoryTitle: {
      type: String,
      default: '',
    },
    issueDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'REVOKED'],
      default: 'ACTIVE',
      index: true,
    },
    revocationReason: {
      type: String,
      default: '',
    },
    revokedAt: {
      type: Date,
      default: null,
    },
    certificatePdfUrl: {
      type: String,
      default: '',
    },
    associatedEventId: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      default: null,
    },
    associatedDomainId: {
      type: Schema.Types.ObjectId,
      ref: 'Domain',
      default: null,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

// Compound indexes for rapid lookups
issuedCertificateSchema.index({ recipientUser: 1, associatedEventId: 1 });
issuedCertificateSchema.index({ recipientUser: 1, associatedDomainId: 1 });

export const CertificateTemplate: Model<ICertificateTemplate> =
  mongoose.models.CertificateTemplate ||
  mongoose.model<ICertificateTemplate>('CertificateTemplate', certificateTemplateSchema);

export const IssuedCertificate: Model<IIssuedCertificate> =
  mongoose.models.IssuedCertificate ||
  mongoose.model<IIssuedCertificate>('IssuedCertificate', issuedCertificateSchema);

export default CertificateTemplate;
