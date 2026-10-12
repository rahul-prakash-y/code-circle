import { FastifyInstance } from 'fastify';
import {
  getSystemHealth,
  syncSystemCache,
  getDatabaseStats,
  getCollectionDocuments,
  createCollectionDocument,
  updateCollectionDocument,
  deleteCollectionDocument,
  batchDeleteDocuments,
} from '../controllers/diagnosticsController';
import { verifyToken, requireSuperAdmin } from '../middleware/authMiddleware';

export async function diagnosticsRoutes(fastify: FastifyInstance) {
  // All diagnostics endpoints require SuperAdmin clearance
  fastify.addHook('preHandler', verifyToken);
  fastify.addHook('preHandler', requireSuperAdmin);

  // System Telemetry & Cluster Cache Control
  fastify.get('/health', getSystemHealth);
  fastify.post('/sync-cache', syncSystemCache);

  // Database Collection Diagnostics & Manager
  fastify.get('/database/stats', getDatabaseStats);
  fastify.get('/database/collections/:collection', getCollectionDocuments);
  fastify.post('/database/collections/:collection', createCollectionDocument);
  fastify.put('/database/collections/:collection/:id', updateCollectionDocument);
  fastify.patch('/database/collections/:collection/:id', updateCollectionDocument);
  fastify.delete('/database/collections/:collection/:id', deleteCollectionDocument);
  fastify.post('/database/collections/:collection/batch-delete', batchDeleteDocuments);
}

export default diagnosticsRoutes;
