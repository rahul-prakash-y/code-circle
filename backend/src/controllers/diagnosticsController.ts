import { FastifyRequest, FastifyReply } from 'fastify';
import mongoose from 'mongoose';
import os from 'os';
import axios from 'axios';
import attendanceBuffer from '../services/attendanceBuffer';
import { parsePaginationParams, buildPaginationMeta } from '../utils/pagination';

// Utility to measure Event Loop Delay (Lag) in milliseconds
const measureEventLoopLag = (): Promise<number> => {
  return new Promise((resolve) => {
    const start = process.hrtime();
    setImmediate(() => {
      const delta = process.hrtime(start);
      const nanosec = delta[0] * 1e9 + delta[1];
      const ms = nanosec / 1e6;
      resolve(Math.round(ms * 100) / 100);
    });
  });
};

// 1. Get Complete System Health & Telemetry
export const getSystemHealth = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const lagMs = await measureEventLoopLag();
    const mem = process.memoryUsage();
    const dbState = mongoose.connection.readyState;
    const dbStatusMap: Record<number, string> = {
      0: 'Disconnected',
      1: 'Connected',
      2: 'Connecting',
      3: 'Disconnecting',
    };

    // Piston RCE quick ping check
    let pistonStatus = 'Configured';
    try {
      const pistonUrl = process.env.PISTON_API_URL || 'https://emkc.org/api/v2/piston/runtimes';
      const pRes = await axios.get(pistonUrl, { timeout: 3000 });
      pistonStatus = pRes.status === 200 ? 'Operational' : 'Degraded';
    } catch {
      pistonStatus = 'Offline / Standby';
    }

    const freeMemBytes = os.freemem();
    const totalMemBytes = os.totalmem();

    const healthData = {
      status: dbState === 1 ? 'OPTIMAL' : 'DEGRADED',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      eventLoopLagMs: lagMs,
      nodeVersion: process.version,
      platform: `${os.platform()} (${os.arch()})`,
      cpuCount: os.cpus().length,
      cpuModel: os.cpus()[0]?.model || 'Standard CPU',
      loadAvg: os.loadavg(),
      memory: {
        heapUsedMB: Math.round(mem.heapUsed / 1024 / 1024),
        heapTotalMB: Math.round(mem.heapTotal / 1024 / 1024),
        rssMB: Math.round(mem.rss / 1024 / 1024),
        externalMB: Math.round(mem.external / 1024 / 1024),
        systemFreeMB: Math.round(freeMemBytes / 1024 / 1024),
        systemTotalMB: Math.round(totalMemBytes / 1024 / 1024),
        memoryUsagePercent: Math.round(((totalMemBytes - freeMemBytes) / totalMemBytes) * 100),
      },
      database: {
        status: dbStatusMap[dbState] || 'Unknown',
        host: mongoose.connection.host || 'Atlas Cluster',
        name: mongoose.connection.name || 'code_circle',
        readyState: dbState,
        modelsRegistered: Object.keys(mongoose.models).length,
      },
      services: {
        mongodb: dbState === 1 ? 'Operational' : 'Degraded',
        cloudinary: Boolean(process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_CLOUD_NAME)
          ? 'Operational'
          : 'Not Configured',
        firebaseAuth: Boolean(process.env.FIREBASE_PROJECT_ID || process.env.FIREBASE_SERVICE_ACCOUNT)
          ? 'Operational'
          : 'Standby',
        pistonRce: pistonStatus,
      },
    };

    return reply.send({ success: true, data: healthData });
  } catch (error: any) {
    req.log.error(error);
    return reply.status(500).send({ success: false, error: 'Failed to inspect system telemetry' });
  }
};

// 2. Sync / Flush Cache & Buffers
export const syncSystemCache = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    let flushedAttendanceCount = 0;
    try {
      if (attendanceBuffer && typeof attendanceBuffer.flush === 'function') {
        const flushResult = await attendanceBuffer.flush();
        flushedAttendanceCount = flushResult.flushedCount;
      }
    } catch (e: any) {
      req.log.warn(`Attendance buffer flush notice: ${e.message}`);
    }

    // Force GC if available
    let gcTriggered = false;
    if (global.gc) {
      global.gc();
      gcTriggered = true;
    }

    return reply.send({
      success: true,
      message: 'System cache & memory buffers synchronized successfully',
      flushedAttendanceCount,
      gcTriggered,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    req.log.error(error);
    return reply.status(500).send({ success: false, error: 'Failed to sync system cache' });
  }
};

// 3. Database Collection Statistics
export const getDatabaseStats = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    if (!mongoose.connection.db) {
      return reply.status(503).send({ success: false, error: 'Database connection not ready' });
    }

    const collections = await mongoose.connection.db.listCollections().toArray();
    const statsList: any[] = [];
    let totalDocs = 0;

    for (const col of collections) {
      try {
        const colName = col.name;
        // Avoid system collections
        if (colName.startsWith('system.')) continue;

        const count = await mongoose.connection.db.collection(colName).countDocuments();
        totalDocs += count;

        let indexesCount = 1;
        try {
          const indexes = await mongoose.connection.db.collection(colName).indexes();
          indexesCount = indexes.length;
        } catch {
          // fallback
        }

        statsList.push({
          name: colName,
          count,
          indexesCount,
          modelName: Object.keys(mongoose.models).find(
            (m) => mongoose.models[m].collection.name === colName
          ) || null,
        });
      } catch (err) {
        // continue
      }
    }

    statsList.sort((a, b) => b.count - a.count);

    return reply.send({
      success: true,
      totalCollections: statsList.length,
      totalDocuments: totalDocs,
      collections: statsList,
    });
  } catch (error: any) {
    req.log.error(error);
    return reply.status(500).send({ success: false, error: 'Failed to fetch database statistics' });
  }
};

// Helper to normalize payload types based on Mongoose schema or standard fields
const normalizePayloadTypes = (collection: string, data: any) => {
  if (!data || typeof data !== 'object') return data;
  const normalized: any = Array.isArray(data) ? [...data] : { ...data };

  // Check if matching model exists
  const matchingModelName = Object.keys(mongoose.models).find(
    (m) => mongoose.models[m].collection.name === collection
  );
  const schema = matchingModelName ? mongoose.models[matchingModelName].schema : null;

  for (const [key, val] of Object.entries(normalized)) {
    if (val === null || val === undefined) continue;

    const schemaType = schema?.path(key);
    const instance = (schemaType as any)?.instance;

    // Convert ObjectId fields
    if (
      instance === 'ObjectID' ||
      (!instance &&
        (key === 'userId' ||
          key === 'user' ||
          key === 'studentId' ||
          key === 'student' ||
          key === 'createdBy' ||
          key === 'updatedBy' ||
          key === 'author' ||
          key === 'instructor' ||
          key === 'unblockedBy') &&
        typeof val === 'string' &&
        mongoose.isValidObjectId(val))
    ) {
      try {
        normalized[key] = new mongoose.Types.ObjectId(val as string);
      } catch {}
    } else if (
      instance === 'Date' ||
      (!instance &&
        (key.endsWith('At') || key.endsWith('Date') || key === 'dob' || key === 'dateOfBirth') &&
        typeof val === 'string' &&
        !isNaN(Date.parse(val)))
    ) {
      normalized[key] = new Date(val as string);
    } else if (
      instance === 'Number' &&
      typeof val === 'string' &&
      !isNaN(Number(val)) &&
      val.trim() !== ''
    ) {
      normalized[key] = Number(val);
    } else if (
      instance === 'Boolean' &&
      typeof val === 'string' &&
      (val === 'true' || val === 'false')
    ) {
      normalized[key] = val === 'true';
    }
  }

  return normalized;
};

// 4. Get Documents from Collection (Explorer) with User Resolution & Schema
export const getCollectionDocuments = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const { collection } = req.params as { collection: string };
    const queryParams = req.query as any;
    const { search = '' } = queryParams;

    const { page, limit, skip } = parsePaginationParams(queryParams, {
      defaultLimit: 20,
      maxLimit: 100,
    });

    if (!mongoose.connection.db) {
      return reply.status(503).send({ success: false, error: 'Database connection not ready' });
    }

    const col = mongoose.connection.db.collection(collection);

    let query: any = {};
    if (search && search.trim()) {
      const term = search.trim();
      if (mongoose.isValidObjectId(term)) {
        query = { _id: new mongoose.Types.ObjectId(term) };
      } else {
        query = {
          $or: [
            { name: { $regex: term, $options: 'i' } },
            { title: { $regex: term, $options: 'i' } },
            { email: { $regex: term, $options: 'i' } },
            { studentId: { $regex: term, $options: 'i' } },
            { rollNo: { $regex: term, $options: 'i' } },
          ],
        };
      }
    }

    const [docs, total] = await Promise.all([
      col.find(query).sort({ _id: -1 }).skip(skip).limit(limit).toArray(),
      col.countDocuments(query),
    ]);

    // Extract unique user ObjectIds from documents
    const userIdsToFetch = new Set<string>();
    const userRefKeyRegex = /(user|student|createdby|updatedby|author|instructor|unblockedby|member|mentor|reviewer|participant)/i;

    for (const doc of docs) {
      if (collection === 'users') {
        if (doc._id) userIdsToFetch.add(doc._id.toString());
      } else {
        for (const [key, val] of Object.entries(doc)) {
          if (!val) continue;
          if (userRefKeyRegex.test(key)) {
            if (mongoose.isValidObjectId(val)) {
              userIdsToFetch.add(val.toString());
            } else if (typeof val === 'object' && (val as any)._bsontype === 'ObjectID') {
              userIdsToFetch.add(val.toString());
            } else if (typeof val === 'string' && mongoose.isValidObjectId(val)) {
              userIdsToFetch.add(val);
            }
          } else if (Array.isArray(val) && userRefKeyRegex.test(key)) {
            for (const item of val) {
              if (item && (mongoose.isValidObjectId(item) || (typeof item === 'string' && mongoose.isValidObjectId(item)))) {
                userIdsToFetch.add(item.toString());
              }
            }
          }
        }
      }
    }

    const userMap: Record<string, { _id: string; name: string; email: string; rollNo?: string; role?: string }> = {};

    if (collection === 'users') {
      for (const doc of docs) {
        if (doc._id) {
          userMap[doc._id.toString()] = {
            _id: doc._id.toString(),
            name: doc.name || 'Unnamed User',
            email: doc.email || '',
            rollNo: doc.rollNo || '',
            role: doc.role || 'Student',
          };
        }
      }
    } else if (userIdsToFetch.size > 0) {
      const userObjectIds = Array.from(userIdsToFetch)
        .filter((id) => mongoose.isValidObjectId(id))
        .map((id) => new mongoose.Types.ObjectId(id));

      if (userObjectIds.length > 0) {
        const users = await mongoose.connection.db
          .collection('users')
          .find({ _id: { $in: userObjectIds } }, { projection: { name: 1, email: 1, rollNo: 1, role: 1 } })
          .toArray();

        for (const u of users) {
          userMap[u._id.toString()] = {
            _id: u._id.toString(),
            name: u.name || 'Unnamed User',
            email: u.email || '',
            rollNo: u.rollNo || '',
            role: u.role || 'Student',
          };
        }
      }
    }

    // Extract schema field information if Mongoose model exists
    const matchingModelName = Object.keys(mongoose.models).find(
      (m) => mongoose.models[m].collection.name === collection
    );
    const schemaFields: Array<{ path: string; instance: string; required: boolean; defaultValue?: any }> = [];
    if (matchingModelName && mongoose.models[matchingModelName]) {
      const schema = mongoose.models[matchingModelName].schema;
      schema.eachPath((pathname: string, schematype: any) => {
        if (pathname === '__v' || pathname === '_id') return;
        schemaFields.push({
          path: pathname,
          instance: (schematype as any).instance || 'String',
          required: Boolean((schematype as any).isRequired),
          defaultValue: (schematype as any).defaultValue,
        });
      });
    }

    const pagination = buildPaginationMeta(total, page, limit);

    return reply.send({
      success: true,
      collection,
      documents: docs,
      total,
      page,
      limit,
      pages: pagination.totalPages,
      pagination,
      userMap,
      schemaFields,
    });
  } catch (error: any) {
    req.log.error(error);
    return reply.status(500).send({ success: false, error: `Failed to fetch documents from ${req.params}` });
  }
};

// 5. Create Document in Collection
export const createCollectionDocument = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const { collection } = req.params as { collection: string };
    const docData = req.body as any;

    if (!mongoose.connection.db) {
      return reply.status(503).send({ success: false, error: 'Database not ready' });
    }

    const normalizedData = normalizePayloadTypes(collection, docData);

    // Assign createdAt/updatedAt if not provided
    const payload = {
      ...normalizedData,
      createdAt: normalizedData.createdAt || new Date(),
      updatedAt: normalizedData.updatedAt || new Date(),
    };

    const result = await mongoose.connection.db.collection(collection).insertOne(payload);
    return reply.status(201).send({ success: true, insertedId: result.insertedId, document: payload });
  } catch (error: any) {
    req.log.error(error);
    return reply.status(500).send({ success: false, error: 'Failed to insert document' });
  }
};

// 6. Update Document in Collection
export const updateCollectionDocument = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const { collection, id } = req.params as { collection: string; id: string };
    const docData = req.body as any;

    if (!mongoose.connection.db) {
      return reply.status(503).send({ success: false, error: 'Database not ready' });
    }

    const normalizedData = normalizePayloadTypes(collection, docData);
    const updatePayload = { ...normalizedData };
    delete updatePayload._id;
    updatePayload.updatedAt = new Date();

    const query: any = mongoose.isValidObjectId(id) ? { _id: new mongoose.Types.ObjectId(id) } : { _id: id };

    const result = await mongoose.connection.db.collection(collection).updateOne(query, { $set: updatePayload });

    if (result.matchedCount === 0) {
      return reply.status(404).send({ success: false, error: 'Document not found' });
    }

    return reply.send({ success: true, message: 'Document updated successfully' });
  } catch (error: any) {
    req.log.error(error);
    return reply.status(500).send({ success: false, error: 'Failed to update document' });
  }
};

// 7. Delete Document in Collection
export const deleteCollectionDocument = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const { collection, id } = req.params as { collection: string; id: string };

    if (!mongoose.connection.db) {
      return reply.status(503).send({ success: false, error: 'Database not ready' });
    }

    const query: any = mongoose.isValidObjectId(id) ? { _id: new mongoose.Types.ObjectId(id) } : { _id: id };
    const result = await mongoose.connection.db.collection(collection).deleteOne(query);

    if (result.deletedCount === 0) {
      return reply.status(404).send({ success: false, error: 'Document not found' });
    }

    return reply.send({ success: true, message: 'Document deleted successfully' });
  } catch (error: any) {
    req.log.error(error);
    return reply.status(500).send({ success: false, error: 'Failed to delete document' });
  }
};

// 8. Batch Delete Documents
export const batchDeleteDocuments = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const { collection } = req.params as { collection: string };
    const { ids = [] } = req.body as { ids: string[] };

    if (!Array.isArray(ids) || ids.length === 0) {
      return reply.status(400).send({ success: false, error: 'Array of document IDs is required' });
    }

    if (!mongoose.connection.db) {
      return reply.status(503).send({ success: false, error: 'Database not ready' });
    }

    const objectIds = ids.map((id) => (mongoose.isValidObjectId(id) ? new mongoose.Types.ObjectId(id) : id));
    const result = await mongoose.connection.db
      .collection(collection)
      .deleteMany({ _id: { $in: objectIds as any } });

    return reply.send({
      success: true,
      message: `Deleted ${result.deletedCount} document(s)`,
      deletedCount: result.deletedCount,
    });
  } catch (error: any) {
    req.log.error(error);
    return reply.status(500).send({ success: false, error: 'Failed to batch delete documents' });
  }
};

// 9. Lookup Users (for User Selector Autocomplete)
export const lookupUsers = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const { search = '', limit = 15 } = req.query as any;

    if (!mongoose.connection.db) {
      return reply.status(503).send({ success: false, error: 'Database not ready' });
    }

    let query: any = {};
    if (search && search.trim()) {
      const term = search.trim();
      if (mongoose.isValidObjectId(term)) {
        query = {
          $or: [
            { _id: new mongoose.Types.ObjectId(term) },
            { rollNo: { $regex: term, $options: 'i' } },
          ],
        };
      } else {
        query = {
          $or: [
            { name: { $regex: term, $options: 'i' } },
            { email: { $regex: term, $options: 'i' } },
            { rollNo: { $regex: term, $options: 'i' } },
          ],
        };
      }
    }

    const users = await mongoose.connection.db
      .collection('users')
      .find(query, { projection: { name: 1, email: 1, rollNo: 1, role: 1 } })
      .limit(Number(limit) || 15)
      .toArray();

    return reply.send({
      success: true,
      users: users.map((u) => ({
        _id: u._id.toString(),
        name: u.name || 'Unnamed User',
        email: u.email || '',
        rollNo: u.rollNo || '',
        role: u.role || 'Student',
      })),
    });
  } catch (error: any) {
    req.log.error(error);
    return reply.status(500).send({ success: false, error: 'Failed to lookup users' });
  }
};
