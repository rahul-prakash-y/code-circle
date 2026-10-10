import { FastifyInstance } from 'fastify';
import {
  getTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  previewCertificateTemplate,
  issueCertificates,
  getIssuedCertificates,
  revokeCertificate,
  getMyCertificates,
  verifyCertificate,
  downloadCertificatePdf,
} from '../controllers/certificateController';
import { verifyToken, isAdmin } from '../middleware/authMiddleware';

export async function certificateRoutes(fastify: FastifyInstance) {
  // Public Verification & Direct PDF Download Endpoints (No Auth Needed)
  fastify.get('/verify/:code', verifyCertificate);
  fastify.get('/download/:id', downloadCertificatePdf);

  // Authenticated Student Endpoints
  fastify.register(async (studentGroup) => {
    studentGroup.addHook('preHandler', verifyToken);
    studentGroup.get('/my-certificates', getMyCertificates);
  });

  // Admin / Faculty / SuperAdmin Endpoints
  fastify.register(async (adminGroup) => {
    adminGroup.addHook('preHandler', verifyToken);
    adminGroup.addHook('preHandler', isAdmin);

    // Template Studio CRUD
    adminGroup.get('/templates', getTemplates);
    adminGroup.post('/templates', createTemplate);
    adminGroup.put('/templates/:id', updateTemplate);
    adminGroup.delete('/templates/:id', deleteTemplate);
    adminGroup.post('/preview', previewCertificateTemplate);

    // Issuance & Ledger
    adminGroup.post('/issue', issueCertificates);
    adminGroup.get('/issued', getIssuedCertificates);
    adminGroup.patch('/issued/:id/revoke', revokeCertificate);
  });
}

export default certificateRoutes;
