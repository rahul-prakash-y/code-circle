import { FastifyInstance } from 'fastify';
import domainController from '../controllers/domainController';
import { optionalToken, verifyToken, isAdminOrFaculty, isSuperAdmin } from '../middleware/authMiddleware';

export async function domainRoutes(fastify: FastifyInstance) {
  // Course Access & Visibility Configuration (SuperAdmin control)
  fastify.get('/config/access', { preHandler: [optionalToken] }, domainController.getCourseAccessConfig as any);
  fastify.get('/config/students', { preHandler: [verifyToken, isSuperAdmin] }, domainController.getStudentsWithCourseAccess as any);
  fastify.patch('/config/visibility', { preHandler: [verifyToken, isSuperAdmin] }, domainController.updateCourseVisibility as any);
  fastify.post('/config/allow-student', { preHandler: [verifyToken, isSuperAdmin] }, domainController.setStudentCourseAccess as any);
  fastify.post('/config/batch-allow', { preHandler: [verifyToken, isSuperAdmin] }, domainController.batchSetCourseAccess as any);

  // Public / Student endpoints (with optional token parsing to enrich progression stats)
  fastify.get('/', { preHandler: [optionalToken] }, domainController.getDomains as any);
  fastify.get('/:id', { preHandler: [optionalToken] }, domainController.getDomainById as any);
  fastify.get('/:id/levels', { preHandler: [optionalToken] }, domainController.getDomainLevels as any);

  // Student registration endpoints
  fastify.post('/:id/register', { preHandler: [verifyToken] }, domainController.registerForDomain as any);
  fastify.post('/:id/enroll', { preHandler: [verifyToken] }, domainController.registerForDomain as any);

  // Administrative endpoints
  fastify.get('/:id/students', { preHandler: [verifyToken, isAdminOrFaculty] }, domainController.getEnrolledStudents as any);
  fastify.post('/', { preHandler: [verifyToken, isAdminOrFaculty] }, domainController.createDomain as any);
  fastify.put('/:id', { preHandler: [verifyToken, isAdminOrFaculty] }, domainController.updateDomain as any);
  fastify.patch('/:id/toggle-lock', { preHandler: [verifyToken, isAdminOrFaculty] }, domainController.toggleDomainLock as any);
  fastify.delete('/:id', { preHandler: [verifyToken, isAdminOrFaculty] }, domainController.deleteDomain as any);
  fastify.post('/:id/levels', { preHandler: [verifyToken, isAdminOrFaculty] }, domainController.createLevel as any);
}

export default domainRoutes;
