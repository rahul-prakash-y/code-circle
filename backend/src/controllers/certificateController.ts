import { FastifyRequest, FastifyReply } from 'fastify';
import crypto from 'crypto';
import mongoose from 'mongoose';
import {
  CertificateTemplate,
  IssuedCertificate,
  ICertificateTemplate,
} from '../models/certificateModel';
import User from '../models/userModel';
import Event from '../models/eventModel';
import Domain from '../models/domainModel';
import DomainEnrollment from '../models/domainEnrollmentModel';
import Level from '../models/levelModel';
import StudentProgress from '../models/studentProgressModel';
import {
  buildCertificatePdfBuffer,
  uploadCertificateToCloudinary,
} from '../utils/certificatePdfRenderer';
import { parsePaginationParams, buildPaginationMeta } from '../utils/pagination';

interface AuthUser {
  userId?: string;
  _id?: string;
  role?: string;
  email?: string;
  name?: string;
}

const getUserId = (req: FastifyRequest): string => {
  const user = (req as any).user as AuthUser;
  return user?.userId || user?._id || '';
};

// 1. Get All Templates (Admin / Faculty / SuperAdmin)
export const getTemplates = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const templates = await CertificateTemplate.find()
      .populate('associatedEventId', 'title date')
      .populate('associatedDomainId', 'name')
      .sort({ createdAt: -1 });

    return reply.send({ success: true, count: templates.length, data: templates });
  } catch (error: any) {
    req.log.error(error);
    return reply.status(500).send({ success: false, error: 'Failed to fetch templates' });
  }
};

// 2. Create Template
export const createTemplate = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const userId = getUserId(req);
    const body = req.body as Partial<ICertificateTemplate>;

    if (!body.title) {
      return reply.status(400).send({ success: false, error: 'Title is required' });
    }

    const template = await CertificateTemplate.create({
      ...body,
      createdBy: userId,
    });

    return reply.status(201).send({ success: true, data: template });
  } catch (error: any) {
    req.log.error(error);
    return reply.status(500).send({ success: false, error: error.message || 'Failed to create template' });
  }
};

// 3. Update Template
export const updateTemplate = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = req.params as { id: string };
    const body = req.body as Partial<ICertificateTemplate>;

    const updated = await CertificateTemplate.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return reply.status(404).send({ success: false, error: 'Template not found' });
    }

    return reply.send({ success: true, data: updated });
  } catch (error: any) {
    req.log.error(error);
    return reply.status(500).send({ success: false, error: error.message || 'Failed to update template' });
  }
};

// 4. Delete Template
export const deleteTemplate = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = req.params as { id: string };
    const deleted = await CertificateTemplate.findByIdAndDelete(id);

    if (!deleted) {
      return reply.status(404).send({ success: false, error: 'Template not found' });
    }

    return reply.send({ success: true, message: 'Template removed successfully' });
  } catch (error: any) {
    req.log.error(error);
    return reply.status(500).send({ success: false, error: 'Failed to delete template' });
  }
};

// 5. Preview Certificate Template (Streams PDF directly)
export const previewCertificateTemplate = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const body = req.body as any;
    const sampleRecipient = body.recipientName || 'RAHUL PRAKASH';
    const sampleRollNo = body.recipientRollNo || '7376222CB101';

    const pdfBuffer = await buildCertificatePdfBuffer({
      recipientName: sampleRecipient,
      recipientRollNo: sampleRollNo,
      title: body.title || 'CERTIFICATE OF EXCELLENCE',
      subtitle: body.subtitle || 'PROUDLY PRESENTED TO',
      description: body.description,
      issuerOrganization: body.signatoryOrganization || 'CODE CIRCLE · BANNARI AMMAN INSTITUTE OF TECHNOLOGY',
      signatoryName: body.signatoryName || 'Dr. S. K. Ramesh',
      signatoryTitle: body.signatoryTitle || 'Faculty Coordinator',
      secondarySignatoryName: body.secondarySignatoryName || 'Dr. P. Balasubramanie',
      secondarySignatoryTitle: body.secondarySignatoryTitle || 'Faculty Coordinator',
      tertiarySignatoryName: body.tertiarySignatoryName || 'Dr. C. Palanisamy',
      tertiarySignatoryTitle: body.tertiarySignatoryTitle || 'Faculty Coordinator',
      certificateId: 'PREVIEW-SAMPLE-2026',
      verificationCode: 'SAMPLE99',
      issueDate: new Date(),
      theme: body.theme || 'classic-ivory',
      orientation: body.orientation || 'landscape',
      bgImageUrl: body.bgImageUrl,
    });

    reply.header('Content-Type', 'application/pdf');
    reply.header('Content-Disposition', 'inline; filename="certificate_preview.pdf"');
    return reply.send(pdfBuffer);
  } catch (error: any) {
    req.log.error(error);
    return reply.status(500).send({ success: false, error: 'Failed to generate preview' });
  }
};

// 6. Bulk / Single Issue Certificates (Supports Events, Courses, and User Batches)
export const issueCertificates = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const {
      templateId,
      targetType, // 'EVENT' | 'COURSE' | 'USERS'
      targetId, // Event ID or Domain ID
      userIds = [],
      customTitle,
      customDescription,
      issueDate = new Date(),
      completedOnly = false,
    } = req.body as any;

    if (!templateId) {
      return reply.status(400).send({ success: false, error: 'templateId is required' });
    }

    const template = await CertificateTemplate.findById(templateId);
    if (!template) {
      return reply.status(404).send({ success: false, error: 'Template not found' });
    }

    let recipientUsers: any[] = [];

    if (targetType === 'EVENT' && targetId) {
      // Find event attendees through enrollments or attendance records
      const AttendanceRecord = mongoose.models.AttendanceRecord;
      const Enrollment = mongoose.models.Enrollment;

      const userSet = new Set<string>();

      if (AttendanceRecord) {
        const records = await AttendanceRecord.find({ eventId: targetId });
        records.forEach((r: any) => userSet.add(r.userId.toString()));
      }
      if (Enrollment) {
        const enrolls = await Enrollment.find({ eventId: targetId });
        enrolls.forEach((e: any) => userSet.add(e.userId?.toString() || e.user?.toString()));
      }

      const ids = Array.from(userSet).filter(Boolean);
      recipientUsers = await User.find({ _id: { $in: ids } }).select('name email rollNo studentId department');
    } else if (targetType === 'USERS' && Array.isArray(userIds) && userIds.length > 0) {
      recipientUsers = await User.find({ _id: { $in: userIds } }).select('name email rollNo studentId department');
    } else if (targetType === 'COURSE' && targetId) {
      // Find course enrolled students (all or completed only)
      const domainFilter: any = { domainId: targetId };
      if (completedOnly) {
        domainFilter.status = 'completed';
      }
      const enrolls = await DomainEnrollment.find(domainFilter);
      const ids = enrolls.map((e: any) => e.userId?.toString()).filter(Boolean);
      recipientUsers = await User.find({ _id: { $in: ids } }).select('name email rollNo studentId department');
    }

    if (recipientUsers.length === 0) {
      return reply.status(400).send({
        success: false,
        error: 'No valid recipient students found for the selected criteria.',
      });
    }

    const issuedDocs: any[] = [];
    const now = new Date(issueDate);

    for (const student of recipientUsers) {
      // Generate clean unique human-readable certificate ID
      const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
      const certificateId = `CC-CERT-${now.getFullYear()}-${randomHex}`;
      const verificationCode = crypto.randomBytes(4).toString('hex').toUpperCase();

      const newCert = await IssuedCertificate.create({
        certificateId,
        verificationCode,
        templateId: template._id,
        recipientUser: student._id,
        recipientName: student.name || 'Student',
        recipientEmail: student.email || '',
        recipientRollNo: student.rollNo || student.studentId || '',
        title: customTitle || template.title,
        subtitle: template.subtitle,
        description: customDescription || template.description,
        type: targetType === 'COURSE' ? 'COURSE' : template.type,
        issuerOrganization: template.signatoryOrganization,
        signatoryName: template.signatoryName,
        signatoryTitle: template.signatoryTitle,
        secondarySignatoryName: template.secondarySignatoryName,
        secondarySignatoryTitle: template.secondarySignatoryTitle,
        tertiarySignatoryName: template.tertiarySignatoryName,
        tertiarySignatoryTitle: template.tertiarySignatoryTitle,
        issueDate: now,
        status: 'ACTIVE',
        associatedEventId: template.associatedEventId || (targetType === 'EVENT' ? targetId : null),
        associatedDomainId: template.associatedDomainId || (targetType === 'COURSE' ? targetId : null),
      });

      issuedDocs.push(newCert);
    }

    // Increment template counter
    await CertificateTemplate.findByIdAndUpdate(template._id, {
      $inc: { issuedCount: issuedDocs.length },
    });

    return reply.status(201).send({
      success: true,
      message: `Successfully issued ${issuedDocs.length} certificate(s)`,
      issuedCount: issuedDocs.length,
      data: issuedDocs,
    });
  } catch (error: any) {
    req.log.error(error);
    return reply.status(500).send({ success: false, error: error.message || 'Failed to issue certificates' });
  }
};

// 7. Get All Issued Certificates (Ledger / Registry)
export const getIssuedCertificates = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const { page, limit, skip, sort } = parsePaginationParams(req.query as any, {
      defaultLimit: 25,
      maxLimit: 100,
      defaultSortBy: 'createdAt',
      defaultSortOrder: 'desc',
      allowedSortFields: ['createdAt', 'issueDate', 'recipientName', 'title', 'status'],
    });

    const {
      search = '',
      status = '',
      templateId = '',
    } = req.query as any;

    const query: any = {};
    if (status) {
      query.status = status;
    }
    if (templateId) {
      query.templateId = templateId;
    }
    if (search) {
      query.$or = [
        { recipientName: { $regex: search, $options: 'i' } },
        { recipientEmail: { $regex: search, $options: 'i' } },
        { recipientRollNo: { $regex: search, $options: 'i' } },
        { certificateId: { $regex: search, $options: 'i' } },
        { verificationCode: { $regex: search, $options: 'i' } },
        { title: { $regex: search, $options: 'i' } },
      ];
    }

    const [certificates, total] = await Promise.all([
      IssuedCertificate.find(query)
        .populate('recipientUser', 'name email rollNo avatar')
        .populate('templateId', 'theme orientation')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      IssuedCertificate.countDocuments(query),
    ]);

    const pagination = buildPaginationMeta(total, page, limit);

    return reply.send({
      success: true,
      data: certificates,
      pagination,
    });
  } catch (error: any) {
    req.log.error(error);
    return reply.status(500).send({ success: false, error: 'Failed to fetch issued certificates' });
  }
};

// 8. Revoke Certificate
export const revokeCertificate = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = req.params as { id: string };
    const { reason = 'Revoked by institution administration' } = req.body as any;

    const cert = await IssuedCertificate.findByIdAndUpdate(
      id,
      {
        $set: {
          status: 'REVOKED',
          revocationReason: reason,
          revokedAt: new Date(),
        },
      },
      { new: true }
    );

    if (!cert) {
      return reply.status(404).send({ success: false, error: 'Certificate not found' });
    }

    return reply.send({ success: true, message: 'Certificate revoked successfully', data: cert });
  } catch (error: any) {
    req.log.error(error);
    return reply.status(500).send({ success: false, error: 'Failed to revoke certificate' });
  }
};

// 9. Get My Personal Certificates (Student View)
export const getMyCertificates = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const userId = getUserId(req);
    const { page, limit, skip, sort } = parsePaginationParams(req.query as any, {
      defaultLimit: 20,
      maxLimit: 50,
      defaultSortBy: 'issueDate',
      defaultSortOrder: 'desc',
      allowedSortFields: ['issueDate', 'createdAt', 'title'],
    });

    const filter = {
      recipientUser: userId,
      status: 'ACTIVE',
    };

    const [certificates, total] = await Promise.all([
      IssuedCertificate.find(filter)
        .populate('templateId', 'theme orientation bgImageUrl')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      IssuedCertificate.countDocuments(filter),
    ]);

    const pagination = buildPaginationMeta(total, page, limit);

    return reply.send({
      success: true,
      count: certificates.length,
      data: certificates,
      pagination,
    });
  } catch (error: any) {
    req.log.error(error);
    return reply.status(500).send({ success: false, error: 'Failed to fetch student certificates' });
  }
};

// 10. Public Verification
export const verifyCertificate = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const { code } = req.params as { code: string };
    const cleanCode = code.trim().toUpperCase();

    const cert = await IssuedCertificate.findOne({
      $or: [{ verificationCode: cleanCode }, { certificateId: cleanCode }],
    })
      .populate('templateId', 'theme orientation')
      .lean();

    if (!cert) {
      return reply.status(404).send({
        success: false,
        verified: false,
        error: 'No official credential was found matching this identification code.',
      });
    }

    return reply.send({
      success: true,
      verified: cert.status === 'ACTIVE',
      certificate: {
        certificateId: cert.certificateId,
        verificationCode: cert.verificationCode,
        recipientName: cert.recipientName,
        recipientRollNo: cert.recipientRollNo,
        title: cert.title,
        subtitle: cert.subtitle,
        description: cert.description,
        issuerOrganization: cert.issuerOrganization,
        signatoryName: cert.signatoryName,
        signatoryTitle: cert.signatoryTitle,
        issueDate: cert.issueDate,
        status: cert.status,
        revocationReason: cert.revocationReason,
      },
    });
  } catch (error: any) {
    req.log.error(error);
    return reply.status(500).send({ success: false, error: 'Verification failed' });
  }
};

// 11. Download Certificate PDF (Streams generated PDF on-the-fly)
export const downloadCertificatePdf = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id } = req.params as { id: string };

    const cert = await IssuedCertificate.findOne({
      $or: [
        { _id: mongoose.isValidObjectId(id) ? id : null },
        { certificateId: id.toUpperCase() },
        { verificationCode: id.toUpperCase() },
      ],
    }).populate('templateId');

    if (!cert) {
      return reply.status(404).send({ success: false, error: 'Certificate not found' });
    }

    const template = cert.templateId as any;

    const pdfBuffer = await buildCertificatePdfBuffer({
      recipientName: cert.recipientName,
      recipientRollNo: cert.recipientRollNo,
      title: cert.title,
      subtitle: cert.subtitle,
      description: cert.description,
      issuerOrganization: cert.issuerOrganization,
      signatoryName: cert.signatoryName,
      signatoryTitle: cert.signatoryTitle,
      secondarySignatoryName: cert.secondarySignatoryName,
      secondarySignatoryTitle: cert.secondarySignatoryTitle,
      tertiarySignatoryName: cert.tertiarySignatoryName,
      tertiarySignatoryTitle: cert.tertiarySignatoryTitle,
      certificateId: cert.certificateId,
      verificationCode: cert.verificationCode,
      issueDate: cert.issueDate,
      theme: template?.theme || 'royal-sapphire',
      orientation: template?.orientation || 'landscape',
      bgImageUrl: template?.bgImageUrl,
    });

    const filename = `${cert.certificateId}_${cert.recipientName.replace(/\s+/g, '_')}.pdf`;
    reply.header('Content-Type', 'application/pdf');
    reply.header('Content-Disposition', `attachment; filename="${filename}"`);
    return reply.send(pdfBuffer);
  } catch (error: any) {
    req.log.error(error);
    return reply.status(500).send({ success: false, error: 'Failed to download certificate' });
  }
};

// 12. Claim Course Certificate (Student endpoint upon completing a domain/course)
export const claimCourseCertificate = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const userId = getUserId(req);
    const { domainId } = req.params as { domainId: string };

    if (!mongoose.isValidObjectId(domainId)) {
      return reply.status(400).send({ success: false, error: 'Invalid course/domain ID' });
    }

    const domain = await Domain.findById(domainId);
    if (!domain) {
      return reply.status(404).send({ success: false, error: 'Course not found' });
    }

    // Check if certificate already issued to this user for this domain
    const existingCert = await IssuedCertificate.findOne({
      recipientUser: userId,
      associatedDomainId: domainId,
      status: 'ACTIVE',
    });

    if (existingCert) {
      return reply.send({
        success: true,
        message: 'Course completion certificate already issued.',
        data: existingCert,
      });
    }

    // Check student progress for this domain
    const totalLevels = await Level.countDocuments({ domainId });
    const progress = await StudentProgress.findOne({ userId });
    const domainLevels = await Level.find({ domainId }).select('_id');
    const levelIds = domainLevels.map((l) => l._id.toString());

    const completedLevelIds = (progress?.completedLevels || []).map((l: any) => l.toString());
    const isDomainCompleted =
      totalLevels > 0 && levelIds.every((lid) => completedLevelIds.includes(lid));

    // Also check DomainEnrollment status
    const enrollment = await DomainEnrollment.findOne({ userId, domainId });
    const isEnrolledCompleted = enrollment?.status === 'completed';

    if (!isDomainCompleted && !isEnrolledCompleted) {
      return reply.status(400).send({
        success: false,
        error: 'You must complete all levels in this course before claiming the certificate.',
      });
    }

    // Mark enrollment as completed if not yet
    if (enrollment && enrollment.status !== 'completed') {
      enrollment.status = 'completed';
      enrollment.completedAt = new Date();
      await enrollment.save();
    }

    // Find suitable template for this course or generic COURSE template
    let template = await CertificateTemplate.findOne({
      associatedDomainId: domainId,
      isActive: true,
    });

    if (!template) {
      template = await CertificateTemplate.findOne({
        type: 'COURSE',
        isActive: true,
      });
    }

    if (!template) {
      template = await CertificateTemplate.findOne({ isActive: true });
    }

    const user = await User.findById(userId);
    if (!user) {
      return reply.status(404).send({ success: false, error: 'User not found' });
    }

    const now = new Date();
    const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
    const certificateId = `CC-CERT-${now.getFullYear()}-${randomHex}`;
    const verificationCode = crypto.randomBytes(4).toString('hex').toUpperCase();

    const certTitle = template?.title || `${domain.name} - Certificate of Mastery`;
    const certDesc =
      template?.description ||
      `In recognition of technical excellence and successful completion of all curriculum benchmarks for ${domain.name}.`;

    const newCert = await IssuedCertificate.create({
      certificateId,
      verificationCode,
      templateId: template?._id ? (template._id as any) : undefined,
      recipientUser: user._id,
      recipientName: user.name || 'Student',
      recipientEmail: user.email || '',
      recipientRollNo: user.rollNo || (user as any).studentId || '',
      title: certTitle,
      subtitle: template?.subtitle || 'Course Completion & Technical Certification',
      description: certDesc,
      type: 'COURSE',
      issuerOrganization:
        template?.signatoryOrganization || 'Code Circle · Bannari Amman Institute of Technology',
      signatoryName: template?.signatoryName || 'Dr. S. K. Ramesh',
      signatoryTitle: template?.signatoryTitle || 'Faculty Coordinator',
      secondarySignatoryName: template?.secondarySignatoryName || 'Dr. P. Balasubramanie',
      secondarySignatoryTitle: template?.secondarySignatoryTitle || 'Faculty Coordinator',
      tertiarySignatoryName: template?.tertiarySignatoryName || 'Dr. C. Palanisamy',
      tertiarySignatoryTitle: template?.tertiarySignatoryTitle || 'Faculty Coordinator',
      issueDate: now,
      status: 'ACTIVE',
      associatedDomainId: domainId,
    });

    if (template) {
      await CertificateTemplate.findByIdAndUpdate(template._id, {
        $inc: { issuedCount: 1 },
      });
    }

    return reply.status(201).send({
      success: true,
      message: 'Congratulations! Your Course Completion Certificate has been issued.',
      data: newCert,
    });
  } catch (error: any) {
    req.log.error(error);
    return reply.status(500).send({
      success: false,
      error: error.message || 'Failed to claim course certificate',
    });
  }
};
