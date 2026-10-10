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
import {
  buildCertificatePdfBuffer,
  uploadCertificateToCloudinary,
} from '../utils/certificatePdfRenderer';

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
      signatoryTitle: body.signatoryTitle || 'Faculty Advisor & Head of Coding Club',
      certificateId: 'PREVIEW-SAMPLE-2026',
      verificationCode: 'SAMPLE99',
      issueDate: new Date(),
      theme: body.theme || 'modern-blue',
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

// 6. Bulk / Single Issue Certificates
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
      recipientUsers = await User.find({ _id: { $in: ids } }).select('name email rollNo studentId');
    } else if (targetType === 'USERS' && Array.isArray(userIds) && userIds.length > 0) {
      recipientUsers = await User.find({ _id: { $in: userIds } }).select('name email rollNo studentId');
    } else if (targetType === 'COURSE' && targetId) {
      const DomainEnrollment = mongoose.models.DomainEnrollment;
      if (DomainEnrollment) {
        const enrolls = await DomainEnrollment.find({ domainId: targetId });
        const ids = enrolls.map((e: any) => e.userId?.toString()).filter(Boolean);
        recipientUsers = await User.find({ _id: { $in: ids } }).select('name email rollNo studentId');
      }
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
        type: template.type,
        issuerOrganization: template.signatoryOrganization,
        signatoryName: template.signatoryName,
        signatoryTitle: template.signatoryTitle,
        secondarySignatoryName: template.secondarySignatoryName,
        secondarySignatoryTitle: template.secondarySignatoryTitle,
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
    const {
      page = 1,
      limit = 25,
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

    const skip = (Number(page) - 1) * Number(limit);
    const [certificates, total] = await Promise.all([
      IssuedCertificate.find(query)
        .populate('recipientUser', 'name email rollNo avatar')
        .populate('templateId', 'theme orientation')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      IssuedCertificate.countDocuments(query),
    ]);

    return reply.send({
      success: true,
      data: certificates,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
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
    const certificates = await IssuedCertificate.find({
      recipientUser: userId,
      status: 'ACTIVE',
    })
      .populate('templateId', 'theme orientation bgImageUrl')
      .sort({ issueDate: -1 });

    return reply.send({ success: true, count: certificates.length, data: certificates });
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
      certificateId: cert.certificateId,
      verificationCode: cert.verificationCode,
      issueDate: cert.issueDate,
      theme: template?.theme || 'modern-blue',
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
