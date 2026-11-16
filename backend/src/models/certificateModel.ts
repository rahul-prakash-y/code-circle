import mongoose, { Document, Schema, Model } from 'mongoose';

export type CertificateType = 'EVENT' | 'COURSE' | 'ASSESSMENT' | 'CUSTOM' | 'HACKATHON';
export type CertificateTheme =
  | 'classic-ivory'
  | 'imperial-gold'
  | 'royal-sapphire'
  | 'emerald-merit'
  | 'ruby-excellence'
  | 'amethyst-prestige'
  | 'monochrome-executive'
  | 'ocean-azure'
  | 'crimson-collegiate'
  | 'nordic-frost'
  | 'champagne-vintage'
  | 'sunset-topaz'
  | 'rose-elegance'
  | 'corporate-steel'
  | 'botanical-sage'
  | 'modern-blue'
  | 'executive-gold'
  | 'cyber-dark'
  | 'emerald-minimal'
  | 'ruby-elegance'
  | 'cyber-emerald'
  | 'luxury-amethyst';
export type CertificateOrientation = 'landscape' | 'portrait';
export type CertificateStatus = 'ACTIVE' | 'PENDING_APPROVAL' | 'REVOKED';

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
  signatoryDepartment?: string;
  signatoryOrganization: string;
  secondarySignatoryName?: string;
  secondarySignatoryTitle?: string;
  secondarySignatoryDepartment?: string;
  tertiarySignatoryName?: string;
  tertiarySignatoryTitle?: string;
  tertiarySignatoryDepartment?: string;
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
  theme?: CertificateTheme | string;
  orientation?: CertificateOrientation;
  primaryColor?: string;
  accentColor?: string;
  bgImageUrl?: string;
  badgeUrl?: string;
  issuerOrganization: string;
  signatoryName: string;
  signatoryTitle: string;
  signatoryDepartment?: string;
  secondarySignatoryName?: string;
  secondarySignatoryTitle?: string;
  secondarySignatoryDepartment?: string;
  tertiarySignatoryName?: string;
  tertiarySignatoryTitle?: string;
  tertiarySignatoryDepartment?: string;
  issueDate: Date;
  status: CertificateStatus;
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
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
      enum: [
        'classic-ivory',
        'imperial-gold',
        'royal-sapphire',
        'emerald-merit',
        'ruby-excellence',
        'amethyst-prestige',
        'monochrome-executive',
        'ocean-azure',
        'crimson-collegiate',
        'nordic-frost',
        'champagne-vintage',
        'sunset-topaz',
        'rose-elegance',
        'corporate-steel',
        'botanical-sage',
        'modern-blue',
        'executive-gold',
        'cyber-dark',
        'emerald-minimal',
        'ruby-elegance',
        'cyber-emerald',
        'luxury-amethyst',
      ],
      default: 'classic-ivory',
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
      default: 'Dr. Dhanasekar R',
      trim: true,
    },
    signatoryTitle: {
      type: String,
      default: 'Faculty Coordinator',
      trim: true,
    },
    signatoryDepartment: {
      type: String,
      default: 'Faculty Coordinator · EIE',
      trim: true,
    },
    signatoryOrganization: {
      type: String,
      default: 'Code Circle · Bannari Amman Institute of Technology',
      trim: true,
    },
    secondarySignatoryName: {
      type: String,
      default: 'Dr. Nandhini K M',
      trim: true,
    },
    secondarySignatoryTitle: {
      type: String,
      default: 'Faculty Coordinator',
      trim: true,
    },
    secondarySignatoryDepartment: {
      type: String,
      default: 'Faculty Coordinator · EIE',
      trim: true,
    },
    tertiarySignatoryName: {
      type: String,
      default: 'Prof. RATHNA S',
      trim: true,
    },
    tertiarySignatoryTitle: {
      type: String,
      default: 'Faculty Coordinator',
      trim: true,
    },
    tertiarySignatoryDepartment: {
      type: String,
      default: 'Faculty Coordinator · CSE',
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
    theme: {
      type: String,
      default: 'classic-ivory',
    },
    orientation: {
      type: String,
      enum: ['landscape', 'portrait'],
      default: 'landscape',
    },
    primaryColor: {
      type: String,
      default: '',
    },
    accentColor: {
      type: String,
      default: '',
    },
    bgImageUrl: {
      type: String,
      default: '',
    },
    badgeUrl: {
      type: String,
      default: '',
    },
    issuerOrganization: {
      type: String,
      default: 'Code Circle · Bannari Amman Institute of Technology',
    },
    signatoryName: {
      type: String,
      default: 'Dr. Dhanasekar R',
    },
    signatoryTitle: {
      type: String,
      default: 'Faculty Coordinator',
    },
    signatoryDepartment: {
      type: String,
      default: 'Faculty Coordinator · EIE',
    },
    secondarySignatoryName: {
      type: String,
      default: 'Dr. Nandhini K M',
    },
    secondarySignatoryTitle: {
      type: String,
      default: 'Faculty Coordinator',
    },
    secondarySignatoryDepartment: {
      type: String,
      default: 'Faculty Coordinator · EIE',
    },
    tertiarySignatoryName: {
      type: String,
      default: 'Prof. RATHNA S',
    },
    tertiarySignatoryTitle: {
      type: String,
      default: 'Faculty Coordinator',
    },
    tertiarySignatoryDepartment: {
      type: String,
      default: 'Faculty Coordinator · CSE',
    },
    issueDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'PENDING_APPROVAL', 'REVOKED'],
      default: 'ACTIVE',
      index: true,
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    approvedAt: {
      type: Date,
      default: null,
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
issuedCertificateSchema.index({ recipientUser: 1, status: 1, issueDate: -1 });
issuedCertificateSchema.index({ status: 1, createdAt: -1 });
issuedCertificateSchema.index({ templateId: 1, createdAt: -1 });

export const CertificateTemplate: Model<ICertificateTemplate> =
  mongoose.models.CertificateTemplate ||
  mongoose.model<ICertificateTemplate>('CertificateTemplate', certificateTemplateSchema);

export const IssuedCertificate: Model<IIssuedCertificate> =
  mongoose.models.IssuedCertificate ||
  mongoose.model<IIssuedCertificate>('IssuedCertificate', issuedCertificateSchema);

export default CertificateTemplate;
