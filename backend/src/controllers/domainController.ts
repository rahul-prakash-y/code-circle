import { FastifyRequest, FastifyReply } from 'fastify';
import mongoose from 'mongoose';
import * as XLSX from 'xlsx';
import Domain, { IDomain } from '../models/domainModel';
import Level, { ILevel, IQuestQuestion, getDefaultPointsForLevel } from '../models/levelModel';
import StudentProgress from '../models/studentProgressModel';
import Assessment from '../models/assessmentModel';
import DomainEnrollment from '../models/domainEnrollmentModel';
import User from '../models/userModel';
import CourseConfig from '../models/courseConfigModel';
import CodingChallenge from '../models/codingChallengeModel';
import PointTransaction from '../models/pointTransactionModel';
import LevelAssessmentSession from '../models/levelAssessmentSessionModel';
import CodingSubmission from '../models/codingSubmissionModel';

// Interface for submitting answers
export interface SubmitQuestBody {
  answers?: number[] | { questionIndex?: number; selectedOption: number }[];
}

/**
 * Seed initial sample domains and levels if the collection is empty.
 */
export const ensureSeedData = async (adminUserId?: string) => {
  const domainCount = await Domain.countDocuments();
  if (domainCount > 0) return;

  console.log('[Domains] No domains found in database. Seeding initial domains & levels...');

  // Look for any existing assessment to link, or create a default technical assessment
  let linkedAssessment = await Assessment.findOne();
  if (!linkedAssessment) {
    const fallbackUserId = adminUserId || new mongoose.Types.ObjectId().toString();
    linkedAssessment = await Assessment.create({
      title: 'Full Stack Engineering Qualification',
      description: 'Comprehensive capstone assessment on modern web architecture and algorithmic reasoning.',
      category: 'Web Development',
      timeLimitMinutes: 25,
      passingScorePercentage: 70,
      createdBy: fallbackUserId,
      isPublished: true,
      questions: [
        {
          questionText: 'Which lifecycle event or hook in React is recommended for data fetching?',
          options: ['useEffect', 'useMemo', 'useCallback', 'useLayoutSync'],
          correctOptionIndex: 0,
          points: 5,
        },
        {
          questionText: 'What is the primary benefit of Fastify over Express in high-throughput node services?',
          options: [
            'Built-in GUI dashboard',
            'Low-overhead JSON serialization and high request throughput',
            'Mandatory Python interoperability',
            'Automatic client bundling',
          ],
          correctOptionIndex: 1,
          points: 5,
        },
      ],
    });
  }

  // Domain 1: Artificial Intelligence & LLMs
  const aiDomain = await Domain.create({
    name: 'Artificial Intelligence & LLMs',
    description: 'Master foundational neural architectures, self-attention mechanisms, and modern AI development.',
    coverImageUrl: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1200&q=80',
  });

  await Level.create([
    {
      domainId: aiDomain._id,
      levelNumber: 1,
      title: 'Neural Networks & Perceptrons',
      youtubeVideoId: 'aircAruvnKk',
      assessmentId: null,
      questQuestions: [
        {
          question: 'What is the fundamental unit of computation in an artificial neural network?',
          options: ['Neuron (Perceptron)', 'Gradient vector', 'Loss manifold', 'Activation scalar'],
          correctOption: 0,
        },
        {
          question: 'Which activation function is most widely used in modern hidden layers due to non-saturating gradients?',
          options: ['Sigmoid', 'ReLU (Rectified Linear Unit)', 'Step function', 'Linear Identity'],
          correctOption: 1,
        },
        {
          question: 'What mathematical procedure is used to compute gradients across layered networks?',
          options: ['Backpropagation via Chain Rule', 'Monte Carlo Integration', 'Gaussian Elimination', 'Eigenvector projection'],
          correctOption: 0,
        },
        {
          question: 'What role does a loss function serve during model training?',
          options: ['Compresses network weights', 'Quantifies error between predictions and ground truth', 'Encrypts telemetry data', 'Accelerates GPU memory bandwidth'],
          correctOption: 1,
        },
        {
          question: 'What problem does stochastic gradient descent (SGD) aim to minimize?',
          options: ['Empirical risk / Loss', 'Inference latency', 'Batch memory', 'Over-parameterization'],
          correctOption: 0,
        },
      ],
    },
    {
      domainId: aiDomain._id,
      levelNumber: 2,
      title: 'Deep Learning & Gradient Descent',
      youtubeVideoId: 'IHZwWFHWa-w',
      assessmentId: null,
      questQuestions: [
        {
          question: 'What happens when gradients become exponentially small in deep networks?',
          options: ['Vanishing gradient problem', 'Exploding memory overflow', 'Gradient ascent trap', 'Overfitting saturation'],
          correctOption: 0,
        },
        {
          question: 'Which optimization algorithm dynamically adapts learning rates using first and second moments?',
          options: ['Standard SGD', 'Adam optimizer', 'Simulated Annealing', 'Newton-Raphson'],
          correctOption: 1,
        },
        {
          question: 'What is the purpose of Dropout in deep neural network training?',
          options: ['Prevent overfitting by randomly zeroing activations', 'Speed up inference by 10x', 'Normalize inputs to zero mean', 'Reduce precision to 8-bit integers'],
          correctOption: 0,
        },
        {
          question: 'What does batch normalization normalize during mini-batch passes?',
          options: ['Activation outputs across the batch', 'Model file size on disk', 'Hyperparameter search space', 'Training epoch count'],
          correctOption: 0,
        },
        {
          question: 'What is a common sign of model overfitting on training data?',
          options: ['Training loss drops while validation loss rises', 'Both training and validation loss remain high', 'Weights decay to zero', 'Epochs execute significantly faster'],
          correctOption: 0,
        },
      ],
    },
    {
      domainId: aiDomain._id,
      levelNumber: 3,
      title: 'Attention Mechanisms & Transformers',
      youtubeVideoId: 'SZorAJ4I-sA',
      assessmentId: linkedAssessment._id,
      questQuestions: [
        {
          question: 'What key innovation enabled Transformers to replace recurrent networks in NLP?',
          options: ['Self-Attention mechanism allowing parallelization', 'Convolutional feature maps', 'Recurrent cell memories (LSTMs)', 'Genetic algorithmic crossovers'],
          correctOption: 0,
        },
        {
          question: 'In Scaled Dot-Product Attention, what three vectors are computed for each token?',
          options: ['Query (Q), Key (K), and Value (V)', 'Quantization, Kernel, and Variance', 'Queue, Key, and Vector', 'Quark, Kinetic, and Velocity'],
          correctOption: 0,
        },
        {
          question: 'Why is the dot product divided by the square root of key dimension dk in attention calculation?',
          options: ['To stabilize gradients by preventing extremely large magnitudes entering softmax', 'To compress token embeddings into integers', 'To satisfy GPU hardware alignment rules', 'To invert the covariance matrix'],
          correctOption: 0,
        },
        {
          question: 'What component provides sequence order information since transformers process tokens in parallel?',
          options: ['Positional encodings', 'Layer normalization', 'Skip residual connections', 'Linear output projections'],
          correctOption: 0,
        },
        {
          question: 'What is the primary role of Multi-Head Attention over single-head attention?',
          options: ['Allows the model to attend to information from different representation subspaces simultaneously', 'Halves computation time on CPU', 'Prevents matrix multiplication errors', 'Eliminates the need for training labels'],
          correctOption: 0,
        },
      ],
    },
  ]);

  // Domain 2: Full Stack Web Engineering
  const webDomain = await Domain.create({
    name: 'Full Stack Web Engineering',
    description: 'Build enterprise-grade, high-concurrency web applications with modern React, Fastify, and MongoDB.',
    coverImageUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80',
  });

  await Level.create([
    {
      domainId: webDomain._id,
      levelNumber: 1,
      title: 'Modern Component Systems & React',
      youtubeVideoId: 'w7ejDZ8SWv8',
      assessmentId: null,
      questQuestions: [
        {
          question: 'What is the core principle of React declarative rendering?',
          options: ['UI is a function of state: UI = f(state)', 'Direct DOM mutation on every user keystroke', 'Synchronous background threads on window', 'HTML string concatenation'],
          correctOption: 0,
        },
        {
          question: 'Which hook should be used to memorize expensive computed calculations between re-renders?',
          options: ['useMemo', 'useCallback', 'useEffect', 'useRef'],
          correctOption: 0,
        },
        {
          question: 'What prevents unnecessary re-rendering of child components receiving unchanged callbacks?',
          options: ['useCallback wrapping the handler', 'useLayoutEffect', 'Global window variables', 'Inline arrow functions'],
          correctOption: 0,
        },
        {
          question: 'What is the purpose of keys in React list rendering?',
          options: ['To help React identify which items have changed, added, or removed during reconciliation', 'To format CSS grid layout', 'To generate unique database UUIDs', 'To encrypt component props'],
          correctOption: 0,
        },
        {
          question: 'What does React 19 / Modern React utilize for seamless transition and suspense loading?',
          options: ['Suspense boundaries & useTransition', 'Traditional setInterval polling', 'Web Workers only', 'Blocking synchronous alerts'],
          correctOption: 0,
        },
      ],
    },
    {
      domainId: webDomain._id,
      levelNumber: 2,
      title: 'High-Performance APIs & Node.js',
      youtubeVideoId: 'SqcY0GlETPk',
      assessmentId: null,
      questQuestions: [
        {
          question: 'Why is Fastify significantly faster than legacy Node frameworks for JSON payloads?',
          options: ['Fast JSON stringification (fast-json-stringify) & schema-based compilation', 'It compiles Javascript directly into C++', 'It disables HTTP keep-alive headers', 'It bypasses the V8 garbage collector'],
          correctOption: 0,
        },
        {
          question: 'What mechanism in Node.js handles asynchronous non-blocking I/O operations?',
          options: ['The libuv Event Loop', 'Native OS Multi-process spawning per request', 'Synchronous thread sleep', 'V8 AST interpreter'],
          correctOption: 0,
        },
        {
          question: 'What HTTP status code is most appropriate for a successful resource creation?',
          options: ['201 Created', '200 OK', '204 No Content', '301 Moved Permanently'],
          correctOption: 0,
        },
        {
          question: 'What header protects API servers from Cross-Origin Resource Sharing vulnerabilities?',
          options: ['Access-Control-Allow-Origin', 'X-Frame-Options', 'Content-Security-Policy', 'Authorization'],
          correctOption: 0,
        },
        {
          question: 'What Fastify plugin is standard for handling multipart form uploads and streams?',
          options: ['@fastify/multipart', '@fastify/cors', '@fastify/sensible', '@fastify/formidable'],
          correctOption: 0,
        },
      ],
    },
    {
      domainId: webDomain._id,
      levelNumber: 3,
      title: 'Database Architecture & Indexes',
      youtubeVideoId: 'bU_k5kXn7cE',
      assessmentId: linkedAssessment._id,
      questQuestions: [
        {
          question: 'What type of index in MongoDB speeds up queries filtering on multiple fields together?',
          options: ['Compound Index', 'Single Field Index', 'TTL Index', 'Geospatial 2dsphere Index'],
          correctOption: 0,
        },
        {
          question: 'What is the primary advantage of indexing in database systems?',
          options: ['Dramatically reduces query lookup time from O(N) collection scan to O(log N) tree traversal', 'Reduces storage space on hard drives', 'Automatically cleans up old documents', 'Encrypts table columns'],
          correctOption: 0,
        },
        {
          question: 'What Mongoose operator ensures atomic updates without race conditions or overwriting whole documents?',
          options: ['$set / $addToSet / $inc', 'document.save() without version keys', 'delete document._id', 'JSON.parse()'],
          correctOption: 0,
        },
        {
          question: 'What is a covered query in MongoDB?',
          options: ['A query where all requested fields are returned directly from the index without inspecting disk documents', 'A query wrapped in a transaction lock', 'A query hidden behind a firewall', 'A cached query in Redis'],
          correctOption: 0,
        },
        {
          question: 'When should you embed related subdocuments instead of using references in MongoDB?',
          options: ['When data is accessed together (1-to-few relationship) and bounded in size', 'When child documents grow unboundedly to millions', 'When multiple collections need circular joins', 'When indexing is completely forbidden'],
          correctOption: 0,
        },
      ],
    },
  ]);

  // Domain 3: Cloud & DevOps Architecture
  const cloudDomain = await Domain.create({
    name: 'Cloud & DevOps Architecture',
    description: 'Construct resilient cloud-native infrastructures with containerization, Kubernetes, and CI/CD automation.',
    coverImageUrl: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=1200&q=80',
  });

  await Level.create([
    {
      domainId: cloudDomain._id,
      levelNumber: 1,
      title: 'Containerization & Docker Internals',
      youtubeVideoId: 'Gjnup-PuquQ',
      assessmentId: null,
      questQuestions: [
        {
          question: 'What Linux kernel primitives form the bedrock of Docker container isolation?',
          options: ['Namespaces and Control Groups (cgroups)', 'Swap files and ext4 partitions', 'IPTables and Syscall hooks only', 'Cron daemons and Systemd services'],
          correctOption: 0,
        },
        {
          question: 'What is the fundamental difference between a Docker image and a running container?',
          options: ['An image is an immutable template; a container is a running instance with a writable layer', 'An image runs on CPU while containers run on RAM only', 'Images require a hypervisor while containers do not', 'There is no difference'],
          correctOption: 0,
        },
        {
          question: 'Why are multi-stage Docker builds recommended in production pipelines?',
          options: ['To separate build dependencies from the final minimal runtime image, shrinking image size', 'To run tests in parallel across stages', 'To compile code twice for verification', 'To generate multiple Docker daemon daemons'],
          correctOption: 0,
        },
        {
          question: 'Which file specifies file paths that should be omitted when building a Docker context?',
          options: ['.dockerignore', '.env', 'Dockerfile.exclude', '.gitattributes'],
          correctOption: 0,
        },
        {
          question: 'What command inspects the log output of a running container background process?',
          options: ['docker logs <container_id>', 'docker ps -v', 'docker inspect --stdout', 'docker monitor'],
          correctOption: 0,
        },
      ],
    },
    {
      domainId: cloudDomain._id,
      levelNumber: 2,
      title: 'Kubernetes Cluster Orchestration',
      youtubeVideoId: 'X48VuDVv0do',
      assessmentId: linkedAssessment._id,
      questQuestions: [
        {
          question: 'What is the smallest deployable computing unit in Kubernetes?',
          options: ['Pod', 'Container', 'ReplicaSet', 'Deployment'],
          correctOption: 0,
        },
        {
          question: 'Which component in the Kubernetes Control Plane acts as the source of truth for cluster state?',
          options: ['etcd', 'kube-scheduler', 'kube-proxy', 'containerd'],
          correctOption: 0,
        },
        {
          question: 'What Kubernetes abstraction provides stable networking and load balancing across dynamic pods?',
          options: ['Service (ClusterIP / NodePort / LoadBalancer)', 'ConfigMap', 'DaemonSet', 'PersistentVolumeClaim'],
          correctOption: 0,
        },
        {
          question: 'What controller ensures a specified number of identical pod replicas are running at all times?',
          options: ['ReplicaSet', 'StatefulSet', 'Job controller', 'Node controller'],
          correctOption: 0,
        },
        {
          question: 'What mechanism in Kubernetes periodically checks whether an application container is healthy and ready for traffic?',
          options: ['Liveness and Readiness Probes', 'TCP Ping daemon', 'Kernel heartbeat', 'DNS Lookup loop'],
          correctOption: 0,
        },
      ],
    },
  ]);

  console.log('[Domains] Seeded 3 core domains and rich technical levels successfully.');
};

/**
 * GET /api/domains
 * Fetch all domains enriched with student progression stats.
 */
export const getDomains = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    // Seed initial domains if database has none
    // await ensureSeedData(request.user?.id);

    const domains = await Domain.find().sort({ createdAt: 1 }).lean();

    // Check user progress if user is authenticated
    const userId = request.user?.id || (request.user as any)?._id;
    let completedLevelIds: string[] = [];

    const isAdmin =
      request.user?.role === 'Admin' ||
      request.user?.role === 'SuperAdmin' ||
      request.user?.role === 'Faculty' ||
      request.user?.role === 'Committee';

    const courseConfig = await CourseConfig.getOrCreate();
    const isStudentAllowed = Boolean(
      userId &&
        courseConfig.allowedStudentIds?.some((id) => id.toString() === userId.toString())
    );
    const hasAccess = isAdmin || courseConfig.coursesVisibleToAll || isStudentAllowed;

    // If courses are in Coming Soon mode and requester does not have access:
    if (!hasAccess) {
      return reply.status(200).send({
        success: true,
        isComingSoon: true,
        hasAccess: false,
        coursesVisibleToAll: false,
        data: [],
      });
    }

    let unlockedDomainIds: string[] = [];
    let userEnrolledDomainIds = new Set<string>();

    if (userId) {
      const studentProgress = await StudentProgress.findOne({ userId }).lean();
      if (studentProgress) {
        if (studentProgress.completedLevels) {
          completedLevelIds = studentProgress.completedLevels.map((id) => id.toString());
        }
        if (studentProgress.unlockedDomains) {
          unlockedDomainIds = studentProgress.unlockedDomains.map((id) => id.toString());
        }
      }

      const userEnrollments = await DomainEnrollment.find({ userId }).select('domainId').lean();
      userEnrollments.forEach((e) => userEnrolledDomainIds.add(e.domainId.toString()));
    }

    // Aggregate enrollment counts across all domains
    const enrollmentCounts = await DomainEnrollment.aggregate([
      { $group: { _id: '$domainId', count: { $sum: 1 } } },
    ]);
    const enrollmentCountMap = new Map<string, number>();
    enrollmentCounts.forEach((ec) => {
      enrollmentCountMap.set(ec._id.toString(), ec.count);
    });

    // Enrich each domain with total levels, completed levels, and lock status
    const enrichedDomains = await Promise.all(
      domains.map(async (domain) => {
        const levels = await Level.find({ domainId: domain._id }).select('_id levelNumber').lean();
        const totalLevels = levels.length;
        const completedLevelsCount = levels.filter((lvl) =>
          completedLevelIds.includes(lvl._id.toString())
        ).length;

        const progressPercentage =
          totalLevels > 0 ? Math.round((completedLevelsCount / totalLevels) * 100) : 0;

        const isDomainApproved = !domain.isLocked || unlockedDomainIds.includes(domain._id.toString());
        const isLockedForStudent = !isAdmin && !isDomainApproved;
        const enrolledStudentsCount = enrollmentCountMap.get(domain._id.toString()) || 0;
        const isEnrolled = isAdmin || userEnrolledDomainIds.has(domain._id.toString());

        return {
          ...domain,
          totalLevels,
          completedLevelsCount,
          progressPercentage,
          isLocked: Boolean(domain.isLocked),
          isLockedForStudent,
          enrolledStudentsCount,
          isEnrolled,
        };
      })
    );

    return reply.status(200).send({
      success: true,
      isComingSoon: false,
      hasAccess: true,
      isEarlyAccess: !isAdmin && !courseConfig.coursesVisibleToAll && isStudentAllowed,
      config: {
        coursesVisibleToAll: courseConfig.coursesVisibleToAll,
        allowedStudentsCount: courseConfig.allowedStudentIds?.length || 0,
      },
      data: enrichedDomains,
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({
      success: false,
      error: 'Failed to fetch domains',
      details: error.message,
    });
  }
};

/**
 * GET /api/domains/:id
 * Fetch a single domain along with its levels.
 */
export const getDomainById = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  try {
    const { id: domainId } = request.params;

    if (!mongoose.Types.ObjectId.isValid(domainId)) {
      return reply.status(400).send({ success: false, error: 'Invalid domain ID' });
    }

    const domain = await Domain.findById(domainId).lean();
    if (!domain) {
      return reply.status(404).send({ success: false, error: 'Domain not found' });
    }

    const levels = await Level.find({ domainId: domain._id })
      .select('title levelNumber points domainId codingChallengeId codingChallengePool studyMaterials questQuestions assessmentId')
      .sort({ levelNumber: 1 })
      .lean();

    return reply.status(200).send({
      success: true,
      data: {
        ...domain,
        domain,
        levels,
        totalLevels: levels.length,
      },
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({
      success: false,
      error: 'Failed to fetch domain',
      details: error.message,
    });
  }
};

/**
 * GET /api/domains/:id/levels
 * Fetch levels for a domain, ordered by levelNumber, with user progression state.
 */
export const getDomainLevels = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  try {
    const { id: domainId } = request.params;

    if (!mongoose.Types.ObjectId.isValid(domainId)) {
      return reply.status(400).send({ success: false, error: 'Invalid domain ID' });
    }

    const domain = await Domain.findById(domainId).lean();
    if (!domain) {
      return reply.status(404).send({ success: false, error: 'Domain not found' });
    }

    // Fetch levels ordered by levelNumber
    const levels = await Level.find({ domainId })
      .populate('assessmentId', 'title description category passingScorePercentage timeLimitMinutes')
      .populate('codingChallengeId', 'title description difficulty allowedLanguages timeLimitMinutes isPublished')
      .populate('codingChallengePool', 'title description difficulty allowedLanguages timeLimitMinutes isPublished')
      .sort({ levelNumber: 1 })
      .lean();

    // Fetch user progress
    const userId = request.user?.id || (request.user as any)?._id;
    let completedLevelsSet = new Set<string>();
    let unlockedDomainsSet = new Set<string>();
    let unlockedAssessmentsSet = new Set<string>();
    let completedQuestsSet = new Set<string>();
    let unlockedCodingChallengesSet = new Set<string>();
    let completedCodingChallengesSet = new Set<string>();
    let isEnrolled = false;

    const isAdmin =
      request.user?.role === 'Admin' ||
      request.user?.role === 'SuperAdmin' ||
      request.user?.role === 'Faculty' ||
      request.user?.role === 'Committee';

    if (!isAdmin) {
      const courseConfig = await CourseConfig.getOrCreate();
      const isStudentAllowed = Boolean(
        userId &&
          courseConfig.allowedStudentIds?.some((id) => id.toString() === userId.toString())
      );
      const hasAccess = courseConfig.coursesVisibleToAll || isStudentAllowed;
      if (!hasAccess) {
        return reply.status(403).send({
          success: false,
          isComingSoon: true,
          error: 'Courses are currently in Coming Soon mode. SuperAdmin early access is required.',
        });
      }
    }

    if (userId) {
      if (isAdmin) {
        isEnrolled = true;
      } else {
        const enrollment = await DomainEnrollment.findOne({ userId, domainId }).lean();
        isEnrolled = Boolean(enrollment);
      }

      const progress = await StudentProgress.findOne({ userId }).lean();
      if (progress) {
        progress.completedLevels?.forEach((lvlId) => completedLevelsSet.add(lvlId.toString()));
        progress.unlockedAssessments?.forEach((assId) => unlockedAssessmentsSet.add(assId.toString()));
        progress.unlockedDomains?.forEach((domId) => unlockedDomainsSet.add(domId.toString()));
        progress.completedQuests?.forEach((qId) => completedQuestsSet.add(qId.toString()));
        progress.unlockedCodingChallenges?.forEach((cId) => unlockedCodingChallengesSet.add(cId.toString()));
        progress.completedCodingChallenges?.forEach((cId) => completedCodingChallengesSet.add(cId.toString()));
      }

      // Check passed level assessment sessions for auto-healing
      const passedSessions = await LevelAssessmentSession.find({
        student: userId,
        level: { $in: levels.map((lvl) => lvl._id) },
        $or: [{ isCompleted: true }, { verdict: 'passed' }],
      }).select('level').lean();

      passedSessions.forEach((s) => {
        if (s.level) completedLevelsSet.add(s.level.toString());
      });

      // Also check if any level coding challenges were passed via CodingSubmission
      const allLevelPoolIds = levels.flatMap((lvl) => {
        const pool = Array.isArray(lvl.codingChallengePool) ? lvl.codingChallengePool : [];
        const poolIds = pool.map((p: any) => (p?._id ? p._id.toString() : p?.toString())).filter(Boolean);
        const single = (lvl.codingChallengeId as any)?._id
          ? (lvl.codingChallengeId as any)._id.toString()
          : lvl.codingChallengeId
          ? lvl.codingChallengeId.toString()
          : null;
        return [...poolIds, ...(single ? [single] : [])];
      });

      if (allLevelPoolIds.length > 0) {
        const passedSubs = await CodingSubmission.find({
          student: userId,
          challenge: { $in: allLevelPoolIds.map((id) => new mongoose.Types.ObjectId(id)) },
          status: 'passed',
        }).select('challenge').lean();
        passedSubs.forEach((sub) => {
          completedCodingChallengesSet.add(sub.challenge.toString());
        });
      }
    }

    const isDomainApproved = !domain.isLocked || unlockedDomainsSet.has(domain._id.toString());
    const isDomainLockedForStudent = !isAdmin && !isDomainApproved;

    // Map levels: each level unlocks strictly on completion of previous level, IF student is registered (or admin)
    const mappedLevels = levels.map((lvl, index) => {
      const codingChallenge = lvl.codingChallengeId as any;
      const codingChallengeIdStr = codingChallenge?._id
        ? codingChallenge._id.toString()
        : codingChallenge
        ? codingChallenge.toString()
        : null;
      const pool = Array.isArray(lvl.codingChallengePool) ? lvl.codingChallengePool : [];
      const poolIds = pool.map((p: any) => (p?._id ? p._id.toString() : p?.toString())).filter(Boolean);
      const hasCodingAssessment = Boolean(codingChallengeIdStr || poolIds.length > 0);

      const isCodingChallengeCompleted = hasCodingAssessment
        ? completedLevelsSet.has(lvl._id.toString()) ||
          Boolean(codingChallengeIdStr && completedCodingChallengesSet.has(codingChallengeIdStr)) ||
          poolIds.some((pid: string) => completedCodingChallengesSet.has(pid))
        : false;

      const isQuestCompleted = completedQuestsSet.has(lvl._id.toString()) || completedLevelsSet.has(lvl._id.toString());

      // Auto-heal / sync: if quest is completed AND (coding challenge is passed OR no coding challenge required), the level is completed!
      if (isQuestCompleted && (isCodingChallengeCompleted || !hasCodingAssessment)) {
        completedLevelsSet.add(lvl._id.toString());
      }
      const isCompleted = completedLevelsSet.has(lvl._id.toString());

      const previousLevel = index > 0 ? levels[index - 1] : null;
      const previousLevelDone = index === 0 || (previousLevel ? completedLevelsSet.has(previousLevel._id.toString()) : false);
      const requiresRegistration = !isAdmin && !isEnrolled;
      const isUnlocked = isAdmin || (isEnrolled && !isDomainLockedForStudent && previousLevelDone);
      const requiresPreviousLevel = index > 0 ? (previousLevel?.levelNumber || (lvl.levelNumber - 1)) : null;

      // The coding assessment is opened only if the MCQ quest is completed (70% threshold):
      const isCodingChallengeUnlocked =
        isAdmin || (isQuestCompleted && hasCodingAssessment);

      // Sanitize quest questions (strip correctOption to prevent cheating, unless admin)
      const sanitizedQuestions = lvl.questQuestions.map((q: any) => ({
        _id: q._id,
        question: q.question,
        options: q.options,
        // Only disclose correctOption if admin or if user has completed it
        ...(isAdmin ? { correctOption: q.correctOption } : {}),
      }));

      // Fallback study materials if empty
      const studyMaterials = (lvl.studyMaterials && lvl.studyMaterials.length > 0)
        ? lvl.studyMaterials
        : [
            {
              title: `${lvl.title} - Core Study Notes`,
              type: 'notes',
              content: `Key study takeaways for Level ${lvl.levelNumber}:\n• Carefully watch the lecture video before starting the verification quest.\n• Answer all questions correctly (at least 70% threshold) to unlock the hands-on coding assessment or milestone.\n• Pay special attention to algorithmic complexity, best practices, and runtime architecture.`,
            },
            {
              title: 'Curated Documentation & References',
              type: 'link',
              url: 'https://developer.mozilla.org',
              content: 'Comprehensive technical documentation and API reference for deeper architectural context.',
            },
          ];

      const videos =
        Array.isArray(lvl.videos) && lvl.videos.length > 0
          ? lvl.videos
          : Array.isArray(lvl.youtubeVideoIds) && lvl.youtubeVideoIds.length > 0
          ? lvl.youtubeVideoIds.map((vid: string, i: number) => ({
              title: `Part ${i + 1}`,
              youtubeVideoId: vid,
            }))
          : lvl.youtubeVideoId
          ? [{ title: 'Main Lecture', youtubeVideoId: lvl.youtubeVideoId }]
          : [];

      const youtubeVideoIds =
        Array.isArray(lvl.youtubeVideoIds) && lvl.youtubeVideoIds.length > 0
          ? lvl.youtubeVideoIds
          : Array.isArray(lvl.videos) && lvl.videos.length > 0
          ? lvl.videos.map((v: any) => v.youtubeVideoId)
          : lvl.youtubeVideoId
          ? [lvl.youtubeVideoId]
          : [];

      const levelPoints =
        typeof lvl.points === 'number' && lvl.points >= 0
          ? lvl.points
          : getDefaultPointsForLevel(lvl.levelNumber);

      return {
        _id: lvl._id,
        domainId: lvl.domainId,
        levelNumber: lvl.levelNumber,
        title: lvl.title,
        points: levelPoints,
        youtubeVideoId: lvl.youtubeVideoId,
        youtubeVideoIds,
        videos,
        studyMaterials,
        questQuestions: sanitizedQuestions,
        assessmentId: lvl.assessmentId,
        codingChallengeId: lvl.codingChallengeId,
        isCompleted,
        isUnlocked,
        requiresRegistration,
        isQuestCompleted,
        isCodingChallengeUnlocked,
        isCodingChallengeCompleted,
        requiresPreviousLevel,
      };
    });

    const enrolledStudentsCount = await DomainEnrollment.countDocuments({ domainId });

    // Background auto-heal in database if newly completed levels or coding challenges were found
    if (userId && !isAdmin) {
      const newlyCompleted = Array.from(completedLevelsSet).map((id) => new mongoose.Types.ObjectId(id));
      const newlyPassedChallenges = Array.from(completedCodingChallengesSet).map((id) => new mongoose.Types.ObjectId(id));
      if (newlyCompleted.length > 0 || newlyPassedChallenges.length > 0) {
        StudentProgress.updateOne(
          { userId },
          {
            $addToSet: {
              ...(newlyCompleted.length > 0 ? { completedLevels: { $each: newlyCompleted } } : {}),
              ...(newlyPassedChallenges.length > 0 ? { completedCodingChallenges: { $each: newlyPassedChallenges } } : {}),
            },
          },
          { upsert: true }
        ).catch((err) => console.warn('[DomainController] Auto-healing progress error:', err));

        if (newlyCompleted.length > 0) {
          const isAllCompleted = levels.length > 0 && levels.every((lvl) => completedLevelsSet.has(lvl._id.toString()));
          DomainEnrollment.updateOne(
            { userId, domainId },
            {
              $set: {
                status: isAllCompleted ? 'completed' : 'in_progress',
                updatedAt: new Date(),
                ...(isAllCompleted ? { completedAt: new Date() } : {}),
              },
            }
          ).catch((err) => console.warn('[DomainController] Auto-healing enrollment error:', err));
        }
      }
    }

    return reply.status(200).send({
      success: true,
      data: {
        domain: {
          ...domain,
          isLocked: Boolean(domain.isLocked),
          isLockedForStudent: isDomainLockedForStudent,
          isEnrolled,
          enrolledStudentsCount,
        },
        levels: mappedLevels,
        userProgress: {
          completedLevels: Array.from(completedLevelsSet),
          unlockedAssessments: Array.from(unlockedAssessmentsSet),
          completedQuests: Array.from(completedQuestsSet),
          unlockedCodingChallenges: Array.from(unlockedCodingChallengesSet),
          completedCodingChallenges: Array.from(completedCodingChallengesSet),
        },
      },
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({
      success: false,
      error: 'Failed to fetch domain levels',
      details: error.message,
    });
  }
};

/**
 * POST /api/levels/:id/submit-quest
 * Accepts array of answers. Validates against the database.
 * If pass rate is 100%, pushes Level ID to completedLevels and linked Assessment ID to unlockedAssessments.
 * Strictly verifies that domain is approved and previous level was completed.
 */
export const submitLevelQuest = async (
  request: FastifyRequest<{ Params: { id: string }; Body: SubmitQuestBody }>,
  reply: FastifyReply
) => {
  try {
    const { id: levelId } = request.params;
    const userId = request.user?.id || (request.user as any)?._id;

    if (!userId) {
      return reply.status(401).send({ success: false, error: 'Authentication required' });
    }

    if (!mongoose.Types.ObjectId.isValid(levelId)) {
      return reply.status(400).send({ success: false, error: 'Invalid level ID' });
    }

    const level = await Level.findById(levelId);
    if (!level) {
      return reply.status(404).send({ success: false, error: 'Level not found' });
    }

    const isAdmin =
      request.user?.role === 'Admin' ||
      request.user?.role === 'SuperAdmin' ||
      request.user?.role === 'Faculty' ||
      request.user?.role === 'Committee';

    // Anti-tamper verification for student submissions
    if (!isAdmin) {
      // 0. Verify that the student is registered for the course
      const enrollment = await DomainEnrollment.findOne({ userId, domainId: level.domainId });
      if (!enrollment) {
        return reply.status(403).send({
          success: false,
          error: 'You must register for this course before attempting quests and unlocking levels.',
          requiresRegistration: true,
        });
      }

      // 1. Verify that the parent domain is approved / unlocked
      const domain = await Domain.findById(level.domainId);
      if (!domain) {
        return reply.status(404).send({ success: false, error: 'Domain track not found' });
      }

      const progress = await StudentProgress.findOne({ userId });
      const unlockedDomains = progress?.unlockedDomains?.map((d) => d.toString()) || [];
      const isDomainApproved = !domain.isLocked || unlockedDomains.includes(domain._id.toString());

      if (!isDomainApproved) {
        return reply.status(403).send({
          success: false,
          error: 'This domain is locked pending administrator approval. Quest submissions are restricted.',
        });
      }

      // 2. Verify strict sequential progression: Level N requires Level N-1 completed
      const domainLevels = await Level.find({ domainId: level.domainId }).sort({ levelNumber: 1 }).lean();
      const currentLevelIndex = domainLevels.findIndex((lvl) => lvl._id.toString() === level._id.toString());
      if (currentLevelIndex > 0) {
        const previousLevel = domainLevels[currentLevelIndex - 1];
        const completedLevels = progress?.completedLevels?.map((l) => l.toString()) || [];
        if (!completedLevels.includes(previousLevel._id.toString())) {
          return reply.status(403).send({
            success: false,
            error: `Level ${level.levelNumber} is locked. You must complete Level ${previousLevel.levelNumber} ("${previousLevel.title}") before attempting this quest.`,
          });
        }
      }
    }

    const rawAnswers = request.body?.answers;
    if (!Array.isArray(rawAnswers)) {
      return reply.status(400).send({
        success: false,
        error: 'Invalid submission format. Answers array is required.',
      });
    }

    const totalQuestions = level.questQuestions.length;
    if (rawAnswers.length !== totalQuestions) {
      return reply.status(400).send({
        success: false,
        error: `Submission must contain exactly ${totalQuestions} answers. Received: ${rawAnswers.length}.`,
      });
    }

    // Parse answers array (supports numbers array or object array { questionIndex, selectedOption })
    const userAnswers: number[] = rawAnswers.map((item: any) => {
      if (typeof item === 'number') return item;
      if (typeof item === 'object' && item !== null && typeof item.selectedOption === 'number') {
        return item.selectedOption;
      }
      return -1;
    });

    // Score evaluation
    let correctCount = 0;
    const questionFeedback = level.questQuestions.map((q, index) => {
      const selectedOption = userAnswers[index];
      const isCorrect = selectedOption === q.correctOption;
      if (isCorrect) correctCount++;

      return {
        questionIndex: index,
        question: q.question,
        selectedOption,
        isCorrect,
        correctOption: q.correctOption,
      };
    });

    const passRate = (correctCount / totalQuestions) * 100;
    // 70% pass threshold required to pass the quest and unlock coding assessment
    const passed = passRate >= 70;

    let unlockedAssessmentId: string | null = null;
    let unlockedCodingChallengeId: string | null = null;
    let nextLevelId: string | null = null;
    let requiresCodingAssessment = false;
    let pointsAwarded = 0;

    if (passed) {
      const poolCount = Array.isArray(level.codingChallengePool) ? level.codingChallengePool.length : 0;
      const explicitChallengesCount = await CodingChallenge.countDocuments({ levelId: level._id });
      const hasCodingChallenge = Boolean(level.codingChallengeId) || poolCount > 0 || explicitChallengesCount > 0;
      requiresCodingAssessment = hasCodingChallenge;

      const updateOperations: any = {
        $addToSet: {
          completedQuests: level._id,
        },
      };

      if (hasCodingChallenge) {
        // Coding assessment is mapped (pool or individual):
        // Unlock coding assessment, but do NOT complete level or unlock next level yet!
        if (level.codingChallengeId) {
          updateOperations.$addToSet.unlockedCodingChallenges = level.codingChallengeId;
          unlockedCodingChallengeId = level.codingChallengeId.toString();
        }
        nextLevelId = null;
      } else {
        // No coding assessment mapped:
        // Complete level directly and unlock next level
        updateOperations.$addToSet.completedLevels = level._id;

        // Award points if completing this level for the first time
        const currentProgress = await StudentProgress.findOne({
          userId: new mongoose.Types.ObjectId(userId),
        }).lean();
        const alreadyCompleted = Boolean(
          currentProgress?.completedLevels?.some((l: any) => l.toString() === level._id.toString())
        );
        if (!alreadyCompleted) {
          const levelPoints =
            typeof level.points === 'number' && level.points >= 0
              ? level.points
              : getDefaultPointsForLevel(level.levelNumber);
          pointsAwarded = levelPoints;
          if (pointsAwarded > 0) {
            await User.findByIdAndUpdate(userId, { $inc: { points: pointsAwarded } });
            try {
              await PointTransaction.create({
                user: new mongoose.Types.ObjectId(userId),
                amount: pointsAwarded,
                category: 'Course',
                title: `Completed Quest: Level ${level.levelNumber} - ${level.title}`,
                description: `Successfully mastered Level ${level.levelNumber} verification quest`,
                referenceId: level._id.toString(),
                referenceModel: 'Level',
                timestamp: new Date(),
              });
            } catch (txErr) {
              console.warn('[DomainController] Could not log PointTransaction:', txErr);
            }
          }
        }

        if (level.assessmentId) {
          updateOperations.$addToSet.unlockedAssessments = level.assessmentId;
          unlockedAssessmentId = level.assessmentId.toString();
        }

        // Check next level in the domain
        const allLevels = await Level.find({ domainId: level.domainId })
          .sort({ levelNumber: 1 })
          .select('_id levelNumber title');
        const currentIndex = allLevels.findIndex((lvl) => lvl._id.toString() === level._id.toString());
        if (currentIndex !== -1 && currentIndex + 1 < allLevels.length) {
          nextLevelId = allLevels[currentIndex + 1]._id.toString();
        }
      }

      // Atomically persist progress
      await StudentProgress.findOneAndUpdate(
        { userId: new mongoose.Types.ObjectId(userId) },
        updateOperations,
        { upsert: true, new: true }
      );

      // Update student's course enrollment status
      const studentEnrollment = await DomainEnrollment.findOne({ userId, domainId: level.domainId });
      if (studentEnrollment) {
        if (studentEnrollment.status === 'enrolled') {
          studentEnrollment.status = 'in_progress';
          await studentEnrollment.save();
        }
        if (!hasCodingChallenge || !level.codingChallengeId) {
          const allDomainLevels = await Level.find({ domainId: level.domainId }).select('_id').lean();
          const currentProgress = await StudentProgress.findOne({ userId: new mongoose.Types.ObjectId(userId) }).lean();
          const doneLevelIds = new Set((currentProgress?.completedLevels || []).map((id) => id.toString()));
          if (allDomainLevels.length > 0 && allDomainLevels.every((l) => doneLevelIds.has(l._id.toString()))) {
            studentEnrollment.status = 'completed';
            studentEnrollment.completedAt = new Date();
            await studentEnrollment.save();
          }
        }
      }
    }

    const message = passed
      ? requiresCodingAssessment
        ? `Quest Passed with ${Math.round(passRate)}%! Coding assessment is unlocked. Complete the coding assessment to clear Level ${level.levelNumber}.`
        : `Quest Mastered! ${Math.round(passRate)}% score achieved.${pointsAwarded > 0 ? ` +${pointsAwarded} pts earned!` : ''} Next level unlocked!`
      : `Score: ${correctCount}/${totalQuestions} (${Math.round(passRate)}%). You must score at least 70% to pass the quest.`;

    return reply.status(200).send({
      success: true,
      data: {
        passed,
        score: correctCount,
        total: totalQuestions,
        passRate: Math.round(passRate),
        pointsAwarded,
        unlockedAssessmentId,
        unlockedCodingChallengeId,
        nextLevelId,
        requiresCodingAssessment,
        feedback: questionFeedback,
        message,
      },
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({
      success: false,
      error: 'Failed to evaluate quest answers',
      details: error.message,
    });
  }
};

/**
 * POST /api/domains (Admin)
 * Create a new domain
 */
export const createDomain = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { name, description, coverImageUrl, isLocked } = request.body as any;
    if (!name || !description) {
      return reply.status(400).send({ success: false, error: 'Name and description are required' });
    }

    const domain = await Domain.create({
      name,
      description,
      coverImageUrl: coverImageUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
      isLocked: Boolean(isLocked),
      approvedBy: isLocked ? null : request.user?.id || null,
      approvedAt: isLocked ? null : new Date(),
    });

    return reply.status(201).send({ success: true, data: domain });
  } catch (error: any) {
    return reply.status(500).send({ success: false, error: error.message });
  }
};

/**
 * PUT /api/domains/:id (Admin)
 * Update an existing domain
 */
export const updateDomain = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  try {
    const { id } = request.params;
    const { name, description, coverImageUrl, isLocked } = request.body as any;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return reply.status(400).send({ success: false, error: 'Invalid domain ID' });
    }

    const updateDoc: any = {};
    if (name) updateDoc.name = name;
    if (description !== undefined) updateDoc.description = description;
    if (coverImageUrl) updateDoc.coverImageUrl = coverImageUrl;
    if (isLocked !== undefined) {
      updateDoc.isLocked = Boolean(isLocked);
      if (!isLocked) {
        updateDoc.approvedBy = request.user?.id || null;
        updateDoc.approvedAt = new Date();
      } else {
        updateDoc.approvedBy = null;
        updateDoc.approvedAt = null;
      }
    }

    const domain = await Domain.findByIdAndUpdate(
      id,
      { $set: updateDoc },
      { new: true, runValidators: true }
    );

    if (!domain) {
      return reply.status(404).send({ success: false, error: 'Domain not found' });
    }

    return reply.status(200).send({ success: true, data: domain });
  } catch (error: any) {
    return reply.status(500).send({ success: false, error: error.message });
  }
};

/**
 * PATCH /api/domains/:id/toggle-lock (Admin)
 * Toggle domain lock status (Approved/Unlocked for students vs. Locked)
 */
export const toggleDomainLock = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  try {
    const { id } = request.params;
    const userId = request.user?.id || (request.user as any)?._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return reply.status(400).send({ success: false, error: 'Invalid domain ID' });
    }

    const domain = await Domain.findById(id);
    if (!domain) {
      return reply.status(404).send({ success: false, error: 'Domain not found' });
    }

    const newLockState = !domain.isLocked;
    domain.isLocked = newLockState;
    if (!newLockState) {
      // Unlocked & approved
      domain.approvedBy = userId ? new mongoose.Types.ObjectId(userId) : null;
      domain.approvedAt = new Date();
    } else {
      // Locked
      domain.approvedBy = null;
      domain.approvedAt = null;
    }

    await domain.save();

    return reply.status(200).send({
      success: true,
      data: domain,
      message: newLockState
        ? `Domain "${domain.name}" locked. Students cannot access quests pending approval.`
        : `Domain "${domain.name}" approved and unlocked for students!`,
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({ success: false, error: error.message });
  }
};

/**
 * DELETE /api/domains/:id (Admin)
 * Delete domain and its levels
 */
export const deleteDomain = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  try {
    const { id } = request.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return reply.status(400).send({ success: false, error: 'Invalid domain ID' });
    }

    const domain = await Domain.findByIdAndDelete(id);
    if (!domain) {
      return reply.status(404).send({ success: false, error: 'Domain not found' });
    }

    // Cascade delete levels
    await Level.deleteMany({ domainId: id });

    return reply.status(200).send({
      success: true,
      message: 'Domain and associated levels deleted successfully',
    });
  } catch (error: any) {
    return reply.status(500).send({ success: false, error: error.message });
  }
};

/**
 * POST /api/domains/:id/levels (Admin)
 * Add a new level to a domain
 */
export const createLevel = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  try {
    const { id: domainId } = request.params;
    const {
      levelNumber,
      title,
      points,
      youtubeVideoId,
      youtubeVideoIds,
      videos,
      studyMaterials,
      questQuestions,
      assessmentId,
      codingChallengeId,
    } = request.body as any;

    const sanitizedVideos = Array.isArray(videos)
      ? videos
          .filter((v: any) => v && (v.youtubeVideoId || typeof v === 'string'))
          .map((v: any) => ({
            title: v.title || '',
            youtubeVideoId: typeof v === 'string' ? v : v.youtubeVideoId,
          }))
      : Array.isArray(youtubeVideoIds)
      ? youtubeVideoIds.filter(Boolean).map((id: string, idx: number) => ({
          title: `Video ${idx + 1}`,
          youtubeVideoId: id,
        }))
      : [];

    const effectiveVideoId =
      youtubeVideoId ||
      sanitizedVideos[0]?.youtubeVideoId ||
      (Array.isArray(youtubeVideoIds) && youtubeVideoIds[0]) ||
      '';

    const effectiveVideoIds =
      sanitizedVideos.length > 0
        ? sanitizedVideos.map((v) => v.youtubeVideoId)
        : Array.isArray(youtubeVideoIds) && youtubeVideoIds.length > 0
        ? youtubeVideoIds
        : effectiveVideoId
        ? [effectiveVideoId]
        : [];

    if (!levelNumber || !title || !effectiveVideoId || !Array.isArray(questQuestions)) {
      return reply.status(400).send({
        success: false,
        error: 'levelNumber, title, video, and questQuestions are required',
      });
    }

    const effectivePoints =
      typeof points === 'number' && points >= 0
        ? points
        : getDefaultPointsForLevel(Number(levelNumber) || 1);

    const level = await Level.create({
      domainId,
      levelNumber,
      title,
      points: effectivePoints,
      youtubeVideoId: effectiveVideoId,
      youtubeVideoIds: effectiveVideoIds,
      videos:
        sanitizedVideos.length > 0
          ? sanitizedVideos
          : [{ title: 'Main Lecture', youtubeVideoId: effectiveVideoId }],
      studyMaterials: Array.isArray(studyMaterials) ? studyMaterials : [],
      questQuestions,
      assessmentId: assessmentId ? new mongoose.Types.ObjectId(assessmentId) : null,
      codingChallengeId: codingChallengeId ? new mongoose.Types.ObjectId(codingChallengeId) : null,
    });

    return reply.status(201).send({ success: true, data: level });
  } catch (error: any) {
    return reply.status(500).send({ success: false, error: error.message });
  }
};

/**
 * GET /api/levels/:id
 * Fetch single level details
 */
export const getLevelById = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  try {
    const { id } = request.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return reply.status(400).send({ success: false, error: 'Invalid level ID' });
    }

    const level = await Level.findById(id)
      .populate('assessmentId')
      .populate('codingChallengeId')
      .lean();
    if (!level) {
      return reply.status(404).send({ success: false, error: 'Level not found' });
    }

    return reply.status(200).send({ success: true, data: level });
  } catch (error: any) {
    return reply.status(500).send({ success: false, error: error.message });
  }
};

/**
 * PUT /api/levels/:id (Admin)
 * Update an existing level
 */
export const updateLevel = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  try {
    const { id } = request.params;
    const {
      levelNumber,
      title,
      points,
      youtubeVideoId,
      youtubeVideoIds,
      videos,
      studyMaterials,
      questQuestions,
      assessmentId,
      codingChallengeId,
    } = request.body as any;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return reply.status(400).send({ success: false, error: 'Invalid level ID' });
    }

    const updateDoc: any = {};
    if (levelNumber !== undefined) updateDoc.levelNumber = levelNumber;
    if (title) updateDoc.title = title;
    if (points !== undefined) updateDoc.points = Math.max(0, Number(points) || 0);

    if (videos !== undefined || youtubeVideoIds !== undefined || youtubeVideoId !== undefined) {
      const sanitizedVideos = Array.isArray(videos)
        ? videos
            .filter((v: any) => v && (v.youtubeVideoId || typeof v === 'string'))
            .map((v: any) => ({
              title: v.title || '',
              youtubeVideoId: typeof v === 'string' ? v : v.youtubeVideoId,
            }))
        : Array.isArray(youtubeVideoIds)
        ? youtubeVideoIds.filter(Boolean).map((vidId: string, idx: number) => ({
            title: `Video ${idx + 1}`,
            youtubeVideoId: vidId,
          }))
        : [];

      const effectiveVideoId =
        sanitizedVideos[0]?.youtubeVideoId ||
        youtubeVideoId ||
        (Array.isArray(youtubeVideoIds) && youtubeVideoIds[0]) ||
        '';

      const effectiveVideoIds =
        sanitizedVideos.length > 0
          ? sanitizedVideos.map((v) => v.youtubeVideoId)
          : Array.isArray(youtubeVideoIds) && youtubeVideoIds.length > 0
          ? youtubeVideoIds
          : effectiveVideoId
          ? [effectiveVideoId]
          : [];

      if (effectiveVideoId) updateDoc.youtubeVideoId = effectiveVideoId;
      updateDoc.youtubeVideoIds = effectiveVideoIds;
      updateDoc.videos =
        sanitizedVideos.length > 0
          ? sanitizedVideos
          : effectiveVideoId
          ? [{ title: 'Main Lecture', youtubeVideoId: effectiveVideoId }]
          : [];
    }

    if (Array.isArray(studyMaterials)) updateDoc.studyMaterials = studyMaterials;
    if (Array.isArray(questQuestions)) updateDoc.questQuestions = questQuestions;
    if (assessmentId !== undefined) {
      updateDoc.assessmentId = assessmentId ? new mongoose.Types.ObjectId(assessmentId) : null;
    }
    if (codingChallengeId !== undefined) {
      updateDoc.codingChallengeId = codingChallengeId
        ? new mongoose.Types.ObjectId(codingChallengeId)
        : null;
    }

    const level = await Level.findByIdAndUpdate(id, { $set: updateDoc }, { new: true })
      .populate('assessmentId', 'title description category passingScorePercentage timeLimitMinutes')
      .populate('codingChallengeId', 'title description difficulty allowedLanguages timeLimitMinutes isPublished');
    if (!level) {
      return reply.status(404).send({ success: false, error: 'Level not found' });
    }

    return reply.status(200).send({ success: true, data: level });
  } catch (error: any) {
    return reply.status(500).send({ success: false, error: error.message });
  }
};

/**
 * DELETE /api/levels/:id (Admin)
 * Delete a level
 */
export const deleteLevel = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  try {
    const { id } = request.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return reply.status(400).send({ success: false, error: 'Invalid level ID' });
    }

    const level = await Level.findByIdAndDelete(id);
    if (!level) {
      return reply.status(404).send({ success: false, error: 'Level not found' });
    }

    return reply.status(200).send({ success: true, message: 'Level deleted successfully' });
  } catch (error: any) {
    return reply.status(500).send({ success: false, error: error.message });
  }
};

/**
 * POST /api/domains/:id/register (or /enroll)
 * Student registration for a course track.
 */
export const registerForDomain = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  try {
    const { id: domainId } = request.params;
    const userId = request.user?.id || (request.user as any)?._id;

    if (!userId) {
      return reply.status(401).send({ success: false, error: 'Authentication required' });
    }

    if (!mongoose.Types.ObjectId.isValid(domainId)) {
      return reply.status(400).send({ success: false, error: 'Invalid course ID' });
    }

    const domain = await Domain.findById(domainId);
    if (!domain) {
      return reply.status(404).send({ success: false, error: 'Course not found' });
    }

    const isAdmin =
      request.user?.role === 'Admin' ||
      request.user?.role === 'SuperAdmin' ||
      request.user?.role === 'Faculty' ||
      request.user?.role === 'Committee';

    if (!isAdmin) {
      const courseConfig = await CourseConfig.getOrCreate();
      const isStudentAllowed = Boolean(
        userId &&
          courseConfig.allowedStudentIds?.some((id) => id.toString() === userId.toString())
      );
      const hasAccess = courseConfig.coursesVisibleToAll || isStudentAllowed;
      if (!hasAccess) {
        return reply.status(403).send({
          success: false,
          isComingSoon: true,
          error: 'Course registration is temporarily unavailable. Courses are coming soon.',
        });
      }
    }

    if (!isAdmin && domain.isLocked) {
      const progress = await StudentProgress.findOne({ userId });
      const unlockedDomains = progress?.unlockedDomains?.map((d) => d.toString()) || [];
      if (!unlockedDomains.includes(domain._id.toString())) {
        return reply.status(403).send({
          success: false,
          error: 'This course is locked pending administrator approval. Registration is temporarily closed.',
        });
      }
    }

    // Check if already registered
    let enrollment = await DomainEnrollment.findOne({ userId, domainId });
    if (enrollment) {
      return reply.status(200).send({
        success: true,
        message: 'Already registered for this course',
        data: enrollment,
      });
    }

    enrollment = await DomainEnrollment.create({
      userId,
      domainId,
      enrolledAt: new Date(),
      status: 'enrolled',
    });

    return reply.status(201).send({
      success: true,
      message: `Successfully registered for ${domain.name}!`,
      data: enrollment,
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({
      success: false,
      error: 'Failed to register for course',
      details: error.message,
    });
  }
};

/**
 * GET /api/domains/:id/students (Admin / Faculty)
 * View list of registered students for a course track with their progress metrics.
 */
export const getEnrolledStudents = async (
  request: FastifyRequest<{ Params: { id: string }; Querystring: { search?: string } }>,
  reply: FastifyReply
) => {
  try {
    const { id: domainId } = request.params;
    const { search } = (request.query || {}) as any;

    if (!mongoose.Types.ObjectId.isValid(domainId)) {
      return reply.status(400).send({ success: false, error: 'Invalid course ID' });
    }

    const domain = await Domain.findById(domainId).lean();
    if (!domain) {
      return reply.status(404).send({ success: false, error: 'Course not found' });
    }

    // Get all levels for this domain
    const levels = await Level.find({ domainId }).select('_id levelNumber').lean();
    const totalLevels = levels.length;
    const levelIdStrings = new Set(levels.map((lvl) => lvl._id.toString()));

    // Fetch enrollments populated with user info
    const enrollments = await DomainEnrollment.find({ domainId })
      .populate('userId', 'name rollNo email department year college profilePicUrl role')
      .sort({ enrolledAt: -1 })
      .lean();

    // Batch fetch student progress
    const userIds = enrollments.map((e) => (e.userId as any)?._id).filter(Boolean);
    const progressDocs = await StudentProgress.find({ userId: { $in: userIds } }).lean();
    const progressMap = new Map<string, string[]>();
    progressDocs.forEach((doc) => {
      progressMap.set(
        doc.userId.toString(),
        (doc.completedLevels || []).map((id) => id.toString())
      );
    });

    // Also check any passed level assessment sessions for these students and domain levels
    const passedSessions = await LevelAssessmentSession.find({
      student: { $in: userIds },
      level: { $in: Array.from(levelIdStrings).map((id) => new mongoose.Types.ObjectId(id)) },
      $or: [{ isCompleted: true }, { verdict: 'passed' }],
    }).select('student level').lean();

    passedSessions.forEach((s) => {
      if (s.student && s.level) {
        const studentIdStr = s.student.toString();
        const levelIdStr = s.level.toString();
        const currentList = progressMap.get(studentIdStr) || [];
        if (!currentList.includes(levelIdStr)) {
          currentList.push(levelIdStr);
          progressMap.set(studentIdStr, currentList);
        }
      }
    });

    let enrolledStudents = enrollments
      .filter((e) => e.userId != null)
      .map((e) => {
        const u = e.userId as any;
        const userCompleted = progressMap.get(u._id.toString()) || [];
        const completedLevelsCount = userCompleted.filter((lvlId) => levelIdStrings.has(lvlId)).length;
        const progressPercentage =
          totalLevels > 0 ? Math.round((completedLevelsCount / totalLevels) * 100) : 0;

        let status = e.status;
        if (progressPercentage === 100) {
          status = 'completed';
        } else if (completedLevelsCount > 0) {
          status = 'in_progress';
        } else {
          status = 'enrolled';
        }

        return {
          enrollmentId: e._id,
          user: {
            _id: u._id,
            name: u.name,
            rollNo: u.rollNo,
            email: u.email,
            department: u.department,
            year: u.year,
            college: u.college,
            profilePicUrl: u.profilePicUrl,
            role: u.role,
          },
          enrolledAt: e.enrolledAt,
          status,
          completedLevelsCount,
          totalLevels,
          progressPercentage,
        };
      });

    // Optional query filter
    if (search && typeof search === 'string' && search.trim()) {
      const q = search.trim().toLowerCase();
      enrolledStudents = enrolledStudents.filter(
        (s) =>
          s.user.name?.toLowerCase().includes(q) ||
          s.user.rollNo?.toLowerCase().includes(q) ||
          s.user.email?.toLowerCase().includes(q) ||
          s.user.department?.toLowerCase().includes(q)
      );
    }

    return reply.status(200).send({
      success: true,
      data: {
        domain: {
          _id: domain._id,
          name: domain.name,
          description: domain.description,
          totalLevels,
        },
        totalStudents: enrolledStudents.length,
        students: enrolledStudents,
      },
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({
      success: false,
      error: 'Failed to fetch enrolled students',
      details: error.message,
    });
  }
};

/**
 * GET /api/courses/config/access
 * Returns course access & visibility state for the requester.
 */
export const getCourseAccessConfig = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const user = request.user;
    const userId = user?.id || (user as any)?._id;
    const isAdmin =
      user?.role === 'Admin' ||
      user?.role === 'SuperAdmin' ||
      user?.role === 'Faculty' ||
      user?.role === 'Committee';
    const isSuperAdmin = user?.role === 'SuperAdmin';

    const config = await CourseConfig.getOrCreate();

    const isStudentAllowed = Boolean(
      userId &&
      config.allowedStudentIds?.some((id) => id.toString() === userId.toString())
    );

    const hasAccess = isAdmin || config.coursesVisibleToAll || isStudentAllowed;
    const isComingSoon = !hasAccess;
    const isEarlyAccess = !isAdmin && !config.coursesVisibleToAll && isStudentAllowed;

    return reply.status(200).send({
      success: true,
      data: {
        coursesVisibleToAll: config.coursesVisibleToAll,
        hasAccess,
        isEarlyAccess,
        isComingSoon,
        allowedStudentsCount: config.allowedStudentIds?.length || 0,
        ...(isSuperAdmin ? { allowedStudentIds: config.allowedStudentIds } : {}),
      },
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({
      success: false,
      error: 'Failed to fetch course access config',
      details: error.message,
    });
  }
};

/**
 * PATCH /api/courses/config/visibility (SuperAdmin)
 * Toggle whether courses are live for all students or in "Courses Coming Soon" mode.
 */
export const updateCourseVisibility = async (
  request: FastifyRequest<{ Body: { coursesVisibleToAll: boolean } }>,
  reply: FastifyReply
) => {
  try {
    const { coursesVisibleToAll } = request.body || {};
    if (typeof coursesVisibleToAll !== 'boolean') {
      return reply.status(400).send({
        success: false,
        error: 'coursesVisibleToAll boolean is required',
      });
    }

    const config = await CourseConfig.getOrCreate();
    config.coursesVisibleToAll = coursesVisibleToAll;
    config.updatedBy = new mongoose.Types.ObjectId(request.user!.id);
    await config.save();

    return reply.status(200).send({
      success: true,
      message: coursesVisibleToAll
        ? 'Courses are now LIVE for all students.'
        : 'Courses are now in Coming Soon mode. Only SuperAdmin-approved students can view them.',
      data: {
        coursesVisibleToAll: config.coursesVisibleToAll,
        allowedStudentsCount: config.allowedStudentIds?.length || 0,
      },
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({
      success: false,
      error: 'Failed to update course visibility',
      details: error.message,
    });
  }
};

/**
 * POST /api/courses/config/allow-student (SuperAdmin)
 * Grant or revoke course access for an individual student.
 */
export const setStudentCourseAccess = async (
  request: FastifyRequest<{ Body: { studentId: string; allow: boolean } }>,
  reply: FastifyReply
) => {
  try {
    const { studentId, allow } = request.body || {};
    if (!studentId || !mongoose.Types.ObjectId.isValid(studentId)) {
      return reply.status(400).send({ success: false, error: 'Valid studentId is required' });
    }
    if (typeof allow !== 'boolean') {
      return reply.status(400).send({ success: false, error: 'allow boolean is required' });
    }

    const student = await User.findById(studentId).select('name email rollNo');
    if (!student) {
      return reply.status(404).send({ success: false, error: 'Student not found' });
    }

    const config = await CourseConfig.getOrCreate();
    const studentObjId = new mongoose.Types.ObjectId(studentId);

    if (allow) {
      if (!config.allowedStudentIds.some((id) => id.toString() === studentId)) {
        config.allowedStudentIds.push(studentObjId);
      }
    } else {
      config.allowedStudentIds = config.allowedStudentIds.filter(
        (id) => id.toString() !== studentId
      );
    }

    config.updatedBy = new mongoose.Types.ObjectId(request.user!.id);
    await config.save();

    return reply.status(200).send({
      success: true,
      message: allow
        ? `Access granted for ${student.name} (${student.rollNo})`
        : `Course access revoked for ${student.name} (${student.rollNo})`,
      data: {
        studentId,
        isAllowed: allow,
        allowedStudentsCount: config.allowedStudentIds.length,
      },
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({
      success: false,
      error: 'Failed to update student course access',
      details: error.message,
    });
  }
};

/**
 * POST /api/courses/config/batch-allow (SuperAdmin)
 * Batch grant or revoke course access across students.
 */
export const batchSetCourseAccess = async (
  request: FastifyRequest<{
    Body: { action: 'allow_all' | 'revoke_all' | 'allow_selected'; studentIds?: string[] };
  }>,
  reply: FastifyReply
) => {
  try {
    const { action, studentIds } = request.body || {};
    const config = await CourseConfig.getOrCreate();

    if (action === 'allow_all') {
      const allStudents = await User.find({ role: 'Student' }).select('_id').lean();
      config.allowedStudentIds = allStudents.map((s) => s._id);
    } else if (action === 'revoke_all') {
      config.allowedStudentIds = [];
    } else if (action === 'allow_selected' && Array.isArray(studentIds)) {
      const validIds = studentIds
        .filter((id) => mongoose.Types.ObjectId.isValid(id))
        .map((id) => new mongoose.Types.ObjectId(id));
      config.allowedStudentIds = validIds;
    } else {
      return reply.status(400).send({ success: false, error: 'Invalid batch action' });
    }

    config.updatedBy = new mongoose.Types.ObjectId(request.user!.id);
    await config.save();

    return reply.status(200).send({
      success: true,
      message: `Batch update successful. ${config.allowedStudentIds.length} students now have course access.`,
      data: {
        allowedStudentsCount: config.allowedStudentIds.length,
      },
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({
      success: false,
      error: 'Failed to batch update student access',
      details: error.message,
    });
  }
};

/**
 * GET /api/courses/config/students (SuperAdmin)
 * Fetch directory of students indicating their course access status.
 */
export const getStudentsWithCourseAccess = async (
  request: FastifyRequest<{ Querystring: { search?: string; page?: string; limit?: string; filter?: string } }>,
  reply: FastifyReply
) => {
  try {
    const { search = '', page = '1', limit = '10', filter: statusFilter = 'all' } = request.query || {};
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(200, Math.max(1, parseInt(limit) || 10));

    const config = await CourseConfig.getOrCreate();
    const allowedSet = new Set(config.allowedStudentIds.map((id) => id.toString()));

    const mongoFilter: any = { role: 'Student' };

    if (statusFilter === 'allowed') {
      mongoFilter._id = { $in: config.allowedStudentIds };
    } else if (statusFilter === 'locked') {
      mongoFilter._id = { $nin: config.allowedStudentIds };
    }

    if (search.trim()) {
      const sanitizedSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(sanitizedSearch, 'i');
      mongoFilter.$or = [
        { name: regex },
        { rollNo: regex },
        { email: regex },
        { department: regex },
      ];
    }

    const [total, students, totalStudents] = await Promise.all([
      User.countDocuments(mongoFilter),
      User.find(mongoFilter)
        .select('name rollNo email department year college createdAt')
        .sort({ name: 1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean(),
      User.countDocuments({ role: 'Student' }),
    ]);

    const mappedStudents = students.map((s) => ({
      _id: s._id.toString(),
      name: s.name,
      rollNo: s.rollNo,
      email: s.email,
      department: s.department || 'N/A',
      year: s.year || 'N/A',
      college: s.college || 'BIT',
      isAllowed: allowedSet.has(s._id.toString()),
    }));

    const totalPages = Math.max(1, Math.ceil(total / limitNum));

    return reply.status(200).send({
      success: true,
      data: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages,
        totalStudents,
        totalAllowed: config.allowedStudentIds.length,
        coursesVisibleToAll: config.coursesVisibleToAll,
        students: mappedStudents,
      },
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({
      success: false,
      error: 'Failed to fetch student access list',
      details: error.message,
    });
  }
};

/**
 * Helper to generate default verification quest questions if none provided in Excel
 */
const createDefaultVerificationQuestions = (levelTitle: string): IQuestQuestion[] => [
  {
    question: `What is the core conceptual foundation covered in "${levelTitle}"?`,
    options: ['Core architectural foundation', 'Secondary side-effect', 'Legacy syntax', 'Deprecated runtime rule'],
    correctOption: 0,
  },
  {
    question: 'Which method or approach yields optimal runtime performance and scalability?',
    options: ['Synchronous blocking loop', 'Asynchronous non-blocking architecture', 'Thread sleep polling', 'Manual memory deallocation'],
    correctOption: 1,
  },
  {
    question: 'How should data flow and state changes be structured across modules?',
    options: ['Direct DOM alteration', 'Declarative state flow and strict immutability', 'Global window variables', 'Unchecked event dispatchers'],
    correctOption: 1,
  },
  {
    question: 'What architectural safeguard prevents production regressions?',
    options: ['Automated verification suites and strict type validation', 'Disabling strict mode', 'Suppressing all error logs', 'Hardcoding secret credentials'],
    correctOption: 0,
  },
  {
    question: 'What is the recommended production deployment practice for modern services?',
    options: ['Unminified single server scripts', 'Containerized multi-stage image orchestration', 'Manual FTP copy over HTTP', 'Direct root server access'],
    correctOption: 1,
  },
];

/**
 * Clean and extract YouTube 11-char Video ID
 */
const cleanYouTubeVideoId = (input: string): string => {
  if (!input) return 'aircAruvnKk';
  const trimmed = String(input).trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
  const match = trimmed.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/
  );
  return match ? match[1] : trimmed.slice(0, 11) || 'aircAruvnKk';
};

/**
 * GET /api/domains/admin/template or /api/courses/admin/template
 * Download comprehensive sample Excel template for Courses & Levels bulk upload.
 */
export const downloadCourseLevelsTemplate = async (request: FastifyRequest, reply: FastifyReply) => {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Courses
  const sampleCourses = [
    {
      CourseName: 'Full Stack Web Engineering',
      Description: 'Master modern frontend with React/Next.js, high-throughput Fastify APIs, MongoDB architecture, and scalable cloud deployments.',
      CoverImageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
      IsLocked: 'No',
    },
    {
      CourseName: 'Algorithms & Competitive Programming',
      Description: 'Deep dive into computational complexity, dynamic programming, graph traversal, and technical interview mastery.',
      CoverImageUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80',
      IsLocked: 'No',
    },
  ];
  const wsCourses = XLSX.utils.json_to_sheet(sampleCourses);
  XLSX.utils.book_append_sheet(wb, wsCourses, 'Courses');

  // Sheet 2: Levels
  const sampleLevels = [
    {
      CourseName: 'Full Stack Web Engineering',
      LevelNumber: 1,
      Title: 'Modern JavaScript & Async Foundations',
      YouTubeVideo: 'https://www.youtube.com/watch?v=aircAruvnKk',
      Points: 50,
      StudyMaterialTitle: 'Modern JS Cheatsheet',
      StudyMaterialContent: 'Key takeaways: Event loop, Promises, Microtasks, and non-blocking asynchronous architecture.',
      StudyMaterialUrl: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript',
      QuestQuestion: 'What Linux kernel primitives form the bedrock of container isolation in modern cloud infrastructure?',
      OptionA: 'Namespaces and Control Groups (cgroups)',
      OptionB: 'IPTables and Syscall hooks only',
      OptionC: 'Cron daemons and Systemd services',
      OptionD: 'Swap files and ext4 partitions',
      CorrectOption: 'A',
      LinkedAssessment: 'Full Stack Engineering Qualification',
    },
    {
      CourseName: 'Full Stack Web Engineering',
      LevelNumber: 1,
      Title: 'Modern JavaScript & Async Foundations',
      YouTubeVideo: 'https://www.youtube.com/watch?v=aircAruvnKk',
      Points: 50,
      StudyMaterialTitle: '',
      StudyMaterialContent: '',
      StudyMaterialUrl: '',
      QuestQuestion: 'Which method or approach yields optimal runtime performance in high-throughput Node.js microservices?',
      OptionA: 'Synchronous blocking loop',
      OptionB: 'Asynchronous non-blocking architecture',
      OptionC: 'Thread sleep polling',
      OptionD: 'Manual memory deallocation',
      CorrectOption: 'B',
      LinkedAssessment: '',
    },
    {
      CourseName: 'Full Stack Web Engineering',
      LevelNumber: 2,
      Title: 'High-Throughput Fastify API Architecture',
      YouTubeVideo: 'https://www.youtube.com/watch?v=X48VuDVv0do',
      Points: 50,
      StudyMaterialTitle: 'Fastify Architecture Guide',
      StudyMaterialContent: 'Schema-based JSON compilation, route encapsulation, and Fastify plugin ecosystem.',
      StudyMaterialUrl: 'https://fastify.dev/docs/latest/',
      QuestQuestion: 'What is the primary benefit of Fastify over traditional frameworks in high-throughput node services?',
      OptionA: 'Built-in GUI dashboard',
      OptionB: 'Low-overhead JSON serialization and fast routing',
      OptionC: 'Mandatory Python interoperability',
      OptionD: 'Automatic client bundling',
      CorrectOption: 'B',
      LinkedAssessment: '',
    },
    {
      CourseName: 'Algorithms & Competitive Programming',
      LevelNumber: 1,
      Title: 'Time Complexity & Asymptotic Analysis',
      YouTubeVideo: 'https://www.youtube.com/watch?v=8hly31xKli0',
      Points: 25,
      StudyMaterialTitle: 'Big O Quick Reference',
      StudyMaterialContent: 'Time and space complexity cheat sheet covering O(1), O(log n), O(n), O(n log n), and O(n^2).',
      StudyMaterialUrl: 'https://en.wikipedia.org/wiki/Big_O_notation',
      QuestQuestion: 'What is the average time complexity of searching in a well-balanced Hash Table?',
      OptionA: 'O(1)',
      OptionB: 'O(n)',
      OptionC: 'O(log n)',
      OptionD: 'O(n^2)',
      CorrectOption: 'A',
      LinkedAssessment: 'Data Structures & Algorithms MCQ Exam',
    },
  ];
  const wsLevels = XLSX.utils.json_to_sheet(sampleLevels);
  XLSX.utils.book_append_sheet(wb, wsLevels, 'Levels');

  // Sheet 3: Instructions
  const instructions = [
    {
      Sheet: 'Courses',
      Column: 'CourseName',
      Required: 'YES',
      Description: 'Unique name of the course track (e.g. Full Stack Web Engineering)',
    },
    {
      Sheet: 'Courses',
      Column: 'Description',
      Required: 'YES',
      Description: 'Detailed overview of the track and curriculum goals',
    },
    {
      Sheet: 'Courses',
      Column: 'CoverImageUrl',
      Required: 'NO',
      Description: 'Image URL for course cover card (defaults to a high-res Unsplash banner if omitted)',
    },
    {
      Sheet: 'Courses',
      Column: 'IsLocked',
      Required: 'NO',
      Description: 'Yes / No. Whether the course is locked pending approval (defaults to No)',
    },
    {
      Sheet: 'Levels',
      Column: 'CourseName',
      Required: 'YES',
      Description: 'Course to attach this level to (must match a CourseName from Courses sheet, or existing course)',
    },
    {
      Sheet: 'Levels',
      Column: 'LevelNumber',
      Required: 'YES',
      Description: 'Progression sequence number (1, 2, 3...)',
    },
    {
      Sheet: 'Levels',
      Column: 'Title',
      Required: 'YES',
      Description: 'Title of the level / lesson',
    },
    {
      Sheet: 'Levels',
      Column: 'YouTubeVideo',
      Required: 'YES',
      Description: 'YouTube Video ID (11 chars) or full URL (e.g. https://www.youtube.com/watch?v=aircAruvnKk)',
    },
    {
      Sheet: 'Levels',
      Column: 'Points',
      Required: 'NO',
      Description: 'Custom points awarded to student upon completing this level (defaults to 50)',
    },
    {
      Sheet: 'Levels',
      Column: 'StudyMaterialTitle',
      Required: 'NO',
      Description: 'Title of reading material or notes',
    },
    {
      Sheet: 'Levels',
      Column: 'StudyMaterialContent',
      Required: 'NO',
      Description: 'Summary notes, markdown takeaways, or description',
    },
    {
      Sheet: 'Levels',
      Column: 'StudyMaterialUrl',
      Required: 'NO',
      Description: 'Documentation link or article reference URL',
    },
    {
      Sheet: 'Levels',
      Column: 'QuestQuestion',
      Required: 'NO',
      Description: 'Verification question prompt. Multiple rows with the same LevelNumber add multiple questions to that level!',
    },
    {
      Sheet: 'Levels',
      Column: 'OptionA',
      Required: 'YES (if QuestQuestion present)',
      Description: 'First answer choice',
    },
    {
      Sheet: 'Levels',
      Column: 'OptionB',
      Required: 'YES (if QuestQuestion present)',
      Description: 'Second answer choice',
    },
    {
      Sheet: 'Levels',
      Column: 'OptionC',
      Required: 'NO',
      Description: 'Third answer choice',
    },
    {
      Sheet: 'Levels',
      Column: 'OptionD',
      Required: 'NO',
      Description: 'Fourth answer choice',
    },
    {
      Sheet: 'Levels',
      Column: 'CorrectOption',
      Required: 'YES (if QuestQuestion present)',
      Description: 'Correct option: A, B, C, or D (or 1, 2, 3, 4)',
    },
    {
      Sheet: 'Levels',
      Column: 'LinkedAssessment',
      Required: 'NO',
      Description: 'Title or ID of an existing MCQ Assessment to link to this level',
    },
  ];
  const wsInstructions = XLSX.utils.json_to_sheet(instructions);
  XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instructions');

  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  return reply
    .header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    .header('Content-Disposition', 'attachment; filename="course_levels_sample_template.xlsx"')
    .send(buffer);
};

/**
 * POST /api/domains/admin/bulk-upload or /api/courses/admin/bulk-upload
 * Bulk upload courses and levels from an Excel file (.xlsx / .xls).
 * Supports:
 * - Creating or updating multiple Courses
 * - Creating or updating sequential Levels for each Course
 * - Custom Points for each Level
 * - Multi-question quest parsing per level
 * - Target Course mode (appending levels directly to an existing course)
 */
export const bulkUploadCoursesAndLevels = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const user = request.user;
    if (!user) {
      return reply.status(401).send({ success: false, error: 'Unauthorized' });
    }

    const query = request.query as any;
    let targetDomainId: string | null = query?.domainId || query?.courseId ? String(query.domainId || query.courseId).trim() : null;

    let data: any = null;
    try {
      data = await request.file();
    } catch (err: any) {
      return reply.status(400).send({
        success: false,
        error: 'Failed to read upload file stream: ' + (err.message || 'Stream error'),
      });
    }

    if (!data) {
      return reply.status(400).send({ success: false, error: 'No Excel file uploaded' });
    }

    const filename = (data.filename || '').toLowerCase();
    if (!filename.endsWith('.xlsx') && !filename.endsWith('.xls')) {
      return reply.status(400).send({
        success: false,
        error: 'Only .xlsx and .xls Excel files are supported',
      });
    }

    if (data.fields?.domainId) {
      const val = typeof data.fields.domainId === 'object' && 'value' in data.fields.domainId
        ? (data.fields.domainId as any).value
        : data.fields.domainId;
      if (val && String(val).trim()) targetDomainId = String(val).trim();
    } else if (data.fields?.courseId) {
      const val = typeof data.fields.courseId === 'object' && 'value' in data.fields.courseId
        ? (data.fields.courseId as any).value
        : data.fields.courseId;
      if (val && String(val).trim()) targetDomainId = String(val).trim();
    }

    const chunks: Buffer[] = [];
    for await (const chunk of data.file) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    if (buffer.length === 0) {
      return reply.status(400).send({ success: false, error: 'Uploaded Excel file is empty' });
    }

    const workbook = XLSX.read(buffer, { type: 'buffer' });
    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      return reply.status(400).send({ success: false, error: 'Excel file has no valid sheets' });
    }

    // Helper to find value from row case-insensitively
    const getVal = (row: any, ...keys: string[]): string => {
      const rowKeys = Object.keys(row);
      for (const k of keys) {
        const target = k.toLowerCase().replace(/[^a-z0-9]/g, '');
        const matchedKey = rowKeys.find(
          (rk) => rk.toLowerCase().replace(/[^a-z0-9]/g, '') === target
        );
        if (matchedKey && row[matchedKey] !== undefined && row[matchedKey] !== null) {
          return String(row[matchedKey]).trim();
        }
      }
      return '';
    };

    const errors: string[] = [];
    let coursesCreated = 0;
    let coursesUpdated = 0;
    let levelsCreated = 0;
    let levelsUpdated = 0;

    // Detect target domain if specified
    let targetDomainDoc: any = null;
    if (targetDomainId && mongoose.Types.ObjectId.isValid(targetDomainId)) {
      targetDomainDoc = await Domain.findById(targetDomainId);
      if (!targetDomainDoc) {
        return reply.status(404).send({ success: false, error: 'Target course not found' });
      }
    }

    const domainCache = new Map<string, any>();
    if (targetDomainDoc) {
      domainCache.set(targetDomainDoc.name.toLowerCase().trim(), targetDomainDoc);
    }

    // Look for Courses sheet
    const coursesSheetName = workbook.SheetNames.find(
      (s) => s.toLowerCase() === 'courses' || s.toLowerCase() === 'course' || s.toLowerCase() === 'domains'
    );

    if (coursesSheetName) {
      const courseRows: any[] = XLSX.utils.sheet_to_json(workbook.Sheets[coursesSheetName], { defval: '' });
      for (let idx = 0; idx < courseRows.length; idx++) {
        const row = courseRows[idx];
        const rowNum = idx + 2;
        const name = getVal(row, 'CourseName', 'Name', 'Title', 'DomainName', 'Domain');
        if (!name) continue;

        const description =
          getVal(row, 'Description', 'Desc', 'Overview') ||
          `Master core architecture, verified quest milestones, and assessments in ${name}.`;
        const coverImageUrl =
          getVal(row, 'CoverImageUrl', 'CoverImage', 'Image', 'Cover') ||
          'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80';
        const isLockedRaw = getVal(row, 'IsLocked', 'Locked');
        const isLocked = isLockedRaw.toLowerCase() === 'yes' || isLockedRaw.toLowerCase() === 'true';

        try {
          const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          let existingDomain = await Domain.findOne({
            name: { $regex: new RegExp(`^${escapedName}$`, 'i') },
          });

          if (existingDomain) {
            existingDomain.description = description;
            if (coverImageUrl) existingDomain.coverImageUrl = coverImageUrl;
            existingDomain.isLocked = isLocked;
            await existingDomain.save();
            coursesUpdated++;
            domainCache.set(name.toLowerCase().trim(), existingDomain);
          } else {
            const newDomain = await Domain.create({
              name: name.trim(),
              description: description.trim(),
              coverImageUrl: coverImageUrl.trim(),
              isLocked,
              approvedBy: new mongoose.Types.ObjectId(user.id),
              approvedAt: new Date(),
            });
            coursesCreated++;
            domainCache.set(name.toLowerCase().trim(), newDomain);
          }
        } catch (domErr: any) {
          errors.push(`Courses Sheet Row #${rowNum} ("${name}"): ${domErr.message || 'Failed to save course'}`);
        }
      }
    }

    // Look for Levels sheet, or fall back to any sheet not named Instructions
    const levelsSheetName =
      workbook.SheetNames.find(
        (s) =>
          s.toLowerCase() === 'levels' ||
          s.toLowerCase() === 'level' ||
          s.toLowerCase() === 'quests' ||
          s.toLowerCase() === 'curriculum'
      ) ||
      workbook.SheetNames.find((s) => !s.toLowerCase().includes('instruct') && s !== coursesSheetName) ||
      workbook.SheetNames[0];

    const levelRows: any[] = XLSX.utils.sheet_to_json(workbook.Sheets[levelsSheetName], { defval: '' });

    // Group level rows by (CourseName, LevelNumber)
    interface ILevelGroup {
      courseName: string;
      levelNumber: number;
      title: string;
      youtubeVideo: string;
      points: number;
      studyMaterials: Array<{ title: string; content?: string; url?: string; type: 'notes' | 'link' | 'article' }>;
      questQuestions: IQuestQuestion[];
      linkedAssessmentTitle: string;
      firstRow: number;
    }

    const levelGroups = new Map<string, ILevelGroup>();

    levelRows.forEach((row, idx) => {
      const rowNum = idx + 2;
      let courseName = getVal(row, 'CourseName', 'Course', 'DomainName', 'Domain', 'Track');
      if (!courseName && targetDomainDoc) {
        courseName = targetDomainDoc.name;
      }
      if (!courseName) {
        const hasData = Object.values(row).some((v) => String(v).trim().length > 0);
        if (hasData) {
          errors.push(`Levels Sheet Row #${rowNum}: Missing CourseName`);
        }
        return;
      }

      const rawLvlNum = getVal(row, 'LevelNumber', 'Level', 'Lvl', 'Number');
      const levelNumber = Math.max(1, parseInt(rawLvlNum, 10) || 1);
      const title = getVal(row, 'Title', 'LevelTitle', 'LessonTitle', 'Topic') || `Level ${levelNumber}`;
      const youtubeVideo = getVal(row, 'YouTubeVideo', 'VideoUrl', 'Video', 'YouTube', 'YouTubeId');
      const pointsVal = Number(getVal(row, 'Points', 'CustomPoints', 'PointsReward', 'Score')) || getDefaultPointsForLevel(levelNumber);
      const linkedAssessment = getVal(row, 'LinkedAssessment', 'Assessment', 'AssessmentTitle');

      const groupKey = `${courseName.toLowerCase().trim()}:::${levelNumber}`;
      if (!levelGroups.has(groupKey)) {
        levelGroups.set(groupKey, {
          courseName: courseName.trim(),
          levelNumber,
          title,
          youtubeVideo,
          points: Math.max(0, pointsVal),
          studyMaterials: [],
          questQuestions: [],
          linkedAssessmentTitle: linkedAssessment,
          firstRow: rowNum,
        });
      }

      const group = levelGroups.get(groupKey)!;
      if (title && group.title === `Level ${levelNumber}`) group.title = title;
      if (youtubeVideo && !group.youtubeVideo) group.youtubeVideo = youtubeVideo;
      if (pointsVal && group.points === getDefaultPointsForLevel(levelNumber)) group.points = pointsVal;
      if (linkedAssessment && !group.linkedAssessmentTitle) group.linkedAssessmentTitle = linkedAssessment;

      // Extract Study Material if present on this row
      const smTitle = getVal(row, 'StudyMaterialTitle', 'MaterialTitle', 'ReadingTitle');
      const smContent = getVal(row, 'StudyMaterialContent', 'Notes', 'Content', 'MaterialContent');
      const smUrl = getVal(row, 'StudyMaterialUrl', 'MaterialUrl', 'Url', 'DocUrl');
      if (smTitle || smContent || smUrl) {
        const matTitle = smTitle || `${group.title} Reference Notes`;
        if (!group.studyMaterials.some((m) => m.title.toLowerCase() === matTitle.toLowerCase())) {
          group.studyMaterials.push({
            title: matTitle,
            content: smContent || 'Key concepts and architectural rules for this level.',
            url: smUrl || '',
            type: smUrl ? 'link' : 'notes',
          });
        }
      }

      // Extract Quest Question if present on this row
      const questionText = getVal(row, 'QuestQuestion', 'QuestionText', 'Question', 'QuestionPrompt');
      if (questionText) {
        const optA = getVal(row, 'OptionA', 'Option1', 'A');
        const optB = getVal(row, 'OptionB', 'Option2', 'B');
        const optC = getVal(row, 'OptionC', 'Option3', 'C');
        const optD = getVal(row, 'OptionD', 'Option4', 'D');

        const options = [optA, optB, optC, optD].filter((opt) => opt.length > 0);
        if (options.length < 2) {
          errors.push(
            `Row #${rowNum} (Quest Question "${questionText.slice(0, 30)}..."): At least 2 options (OptionA and OptionB) are required`
          );
        } else {
          const rawCorrect = getVal(row, 'CorrectOption', 'CorrectAnswer', 'Answer', 'Correct');
          let correctOptionIndex = 0;
          const upper = (rawCorrect || '').toUpperCase().trim();
          if (upper === 'A' || upper === '1' || upper === 'OPTION A' || upper === 'OPTION 1') {
            correctOptionIndex = 0;
          } else if (upper === 'B' || upper === '2' || upper === 'OPTION B' || upper === 'OPTION 2') {
            correctOptionIndex = 1;
          } else if (upper === 'C' || upper === '3' || upper === 'OPTION C' || upper === 'OPTION 3') {
            correctOptionIndex = 2;
          } else if (upper === 'D' || upper === '4' || upper === 'OPTION D' || upper === 'OPTION 4') {
            correctOptionIndex = 3;
          } else {
            const matchIdx = options.findIndex((o) => o.toLowerCase() === (rawCorrect || '').toLowerCase());
            if (matchIdx !== -1) correctOptionIndex = matchIdx;
          }

          if (correctOptionIndex >= options.length) correctOptionIndex = 0;

          group.questQuestions.push({
            question: questionText,
            options,
            correctOption: correctOptionIndex,
          });
        }
      }
    });

    if (levelGroups.size === 0 && !coursesSheetName) {
      return reply.status(400).send({
        success: false,
        error: errors.length > 0 ? errors.slice(0, 5).join(' | ') : 'No valid course or level data found in Excel sheet',
        errors,
      });
    }

    // Process Level Groups
    for (const group of levelGroups.values()) {
      const courseKey = group.courseName.toLowerCase().trim();
      let domain = domainCache.get(courseKey);

      if (!domain) {
        const escaped = group.courseName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        domain = await Domain.findOne({
          name: { $regex: new RegExp(`^${escaped}$`, 'i') },
        });

        if (!domain) {
          // Create course if not already present
          try {
            domain = await Domain.create({
              name: group.courseName,
              description: `Master core architectural principles and verification quests in ${group.courseName}.`,
              coverImageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
              isLocked: false,
              approvedBy: new mongoose.Types.ObjectId(user.id),
              approvedAt: new Date(),
            });
            coursesCreated++;
          } catch (createDomErr: any) {
            errors.push(`Course "${group.courseName}": Failed to auto-create parent course: ${createDomErr.message}`);
            continue;
          }
        }
        domainCache.set(courseKey, domain);
      }

      // Resolve linked assessment if provided
      let linkedAssessmentId: mongoose.Types.ObjectId | null = null;
      if (group.linkedAssessmentTitle) {
        const titleOrId = group.linkedAssessmentTitle.trim();
        if (mongoose.Types.ObjectId.isValid(titleOrId)) {
          linkedAssessmentId = new mongoose.Types.ObjectId(titleOrId);
        } else {
          const escapedAss = titleOrId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const foundAss = await Assessment.findOne({
            title: { $regex: new RegExp(`^${escapedAss}$`, 'i') },
          }).select('_id');
          if (foundAss) {
            linkedAssessmentId = foundAss._id as mongoose.Types.ObjectId;
          }
        }
      }

      // Clean YouTube ID
      const cleanedVideoId = cleanYouTubeVideoId(group.youtubeVideo);

      // Default quest questions if none provided in sheet
      const questQuestions =
        group.questQuestions.length > 0
          ? group.questQuestions
          : createDefaultVerificationQuestions(group.title);

      // Default study materials if none provided
      const studyMaterials =
        group.studyMaterials.length > 0
          ? group.studyMaterials
          : [
              {
                title: `${group.title} - Core Study Notes`,
                type: 'notes' as const,
                content: `Key study takeaways for Level ${group.levelNumber}:\n• Carefully watch the lecture video before starting the verification quest.\n• Answer all questions correctly to unlock further milestones.\n• Pay special attention to algorithmic complexity, best practices, and runtime architecture.`,
              },
              {
                title: 'Curated Documentation & References',
                type: 'link' as const,
                url: 'https://developer.mozilla.org',
                content: 'Comprehensive technical documentation and API reference for deeper architectural context.',
              },
            ];

      try {
        const existingLevel = await Level.findOne({
          domainId: domain._id,
          levelNumber: group.levelNumber,
        });

        if (existingLevel) {
          existingLevel.title = group.title;
          existingLevel.youtubeVideoId = cleanedVideoId;
          existingLevel.points = group.points;
          existingLevel.questQuestions = questQuestions;
          existingLevel.studyMaterials = studyMaterials;
          if (linkedAssessmentId) existingLevel.assessmentId = linkedAssessmentId;
          await existingLevel.save();
          levelsUpdated++;
        } else {
          await Level.create({
            domainId: domain._id,
            levelNumber: group.levelNumber,
            title: group.title,
            youtubeVideoId: cleanedVideoId,
            points: group.points,
            questQuestions,
            studyMaterials,
            assessmentId: linkedAssessmentId || null,
          });
          levelsCreated++;
        }
      } catch (lvlErr: any) {
        errors.push(
          `Level #${group.levelNumber} ("${group.title}") in Course "${group.courseName}": ${lvlErr.message || 'Failed to save level'}`
        );
      }
    }

    const totalProcessed = levelsCreated + levelsUpdated + coursesCreated + coursesUpdated;
    if (totalProcessed === 0 && errors.length > 0) {
      return reply.status(400).send({
        success: false,
        error: errors.slice(0, 5).join(' | '),
        errors,
      });
    }

    return reply.send({
      success: true,
      message: `Bulk upload completed successfully! ${coursesCreated} course(s) created, ${coursesUpdated} updated. ${levelsCreated} level(s) created, ${levelsUpdated} updated.`,
      coursesCreated,
      coursesUpdated,
      levelsCreated,
      levelsUpdated,
      errors: errors.length ? errors : undefined,
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({
      success: false,
      error: 'Bulk upload failed: ' + (error.message || 'Server error'),
    });
  }
};

/**
 * Get all student submissions for a specific course level (Admin/Faculty).
 * Consolidates LevelAssessmentSession records, CodingSubmissions, and Quest completions.
 */
export const getLevelSubmissions = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { id: levelId } = request.params as { id: string };

    if (!mongoose.Types.ObjectId.isValid(levelId)) {
      return reply.status(400).send({ success: false, error: 'Invalid level ID' });
    }

    const level = await Level.findById(levelId)
      .populate('domainId', 'name description')
      .populate('codingChallengeId', 'title slug difficulty marks');

    if (!level) {
      return reply.status(404).send({ success: false, error: 'Level not found' });
    }

    // 1. Fetch all LevelAssessmentSessions for this level
    const sessions = await LevelAssessmentSession.find({ level: levelId })
      .populate('student', 'name email rollNo department avatar studentId')
      .populate('submissions.challengeId', 'title slug difficulty marks')
      .populate('submissions.submissionId')
      .sort({ updatedAt: -1 })
      .lean();

    // 2. Fetch students who completed quest or level from StudentProgress
    const progressRecords = await StudentProgress.find({
      $or: [{ completedLevels: levelId }, { completedQuests: levelId }],
    })
      .populate('userId', 'name email rollNo department avatar studentId')
      .lean();

    // 3. Fetch direct CodingSubmissions if challenge exists
    let directSubmissions: any[] = [];
    if (level.codingChallengeId) {
      const challengeId = (level.codingChallengeId as any)._id || level.codingChallengeId;
      directSubmissions = await CodingSubmission.find({ challenge: challengeId })
        .populate('student', 'name email rollNo department avatar studentId')
        .sort({ createdAt: -1 })
        .lean();
    }

    // Consolidate submissions by student
    const studentMap = new Map<string, any>();

    // Process sessions
    for (const s of sessions) {
      const student = s.student as any;
      if (!student || !student._id) continue;
      const sId = student._id.toString();

      if (!studentMap.has(sId)) {
        studentMap.set(sId, {
          student: {
            _id: student._id,
            name: student.name || 'Anonymous Student',
            email: student.email,
            rollNo: student.rollNo || student.studentId || '',
            department: student.department || '',
            avatar: student.avatar || '',
          },
          levelCompleted: false,
          questCompleted: false,
          sessions: [],
          submissions: [],
          bestScore: 0,
          verdict: s.verdict || 'unattempted',
          totalAttempts: 0,
          lastActivityAt: s.updatedAt || s.createdAt,
        });
      }

      const rec = studentMap.get(sId)!;
      rec.totalAttempts += 1;
      rec.sessions.push({
        _id: s._id,
        attemptNumber: s.attemptNumber,
        isCompleted: s.isCompleted,
        verdict: s.verdict,
        score: s.pointsAwarded || 0,
        startTime: s.startTime,
        completedAt: s.completedAt,
        submissions: s.submissions || [],
      });

      if (s.pointsAwarded && s.pointsAwarded > rec.bestScore) {
        rec.bestScore = s.pointsAwarded;
      }
      if (s.verdict === 'passed') {
        rec.verdict = 'passed';
      } else if (rec.verdict !== 'passed' && s.verdict) {
        rec.verdict = s.verdict;
      }

      // Collect code submissions
      if (Array.isArray(s.submissions)) {
        for (const sub of s.submissions) {
          rec.submissions.push({
            challengeTitle: (sub.challengeId as any)?.title || 'Coding Challenge',
            language: sub.language,
            code: sub.code,
            status: sub.status,
            score: sub.score,
            passed: sub.passed,
            total: sub.total,
            submittedAt: sub.submittedAt,
            details: sub.submissionId || null,
          });
        }
      }
    }

    // Process direct submissions
    for (const d of directSubmissions) {
      const student = d.student as any;
      if (!student || !student._id) continue;
      const sId = student._id.toString();

      if (!studentMap.has(sId)) {
        studentMap.set(sId, {
          student: {
            _id: student._id,
            name: student.name || 'Anonymous Student',
            email: student.email,
            rollNo: student.rollNo || student.studentId || '',
            department: student.department || '',
            avatar: student.avatar || '',
          },
          levelCompleted: false,
          questCompleted: false,
          sessions: [],
          submissions: [],
          bestScore: 0,
          verdict: d.status === 'passed' ? 'passed' : 'failed',
          totalAttempts: 1,
          lastActivityAt: d.createdAt,
        });
      }

      const rec = studentMap.get(sId)!;
      const exists = rec.submissions.some((sub: any) => sub.details?._id?.toString() === d._id.toString());
      if (!exists) {
        rec.submissions.push({
          challengeTitle: (level.codingChallengeId as any)?.title || 'Coding Challenge',
          language: d.language,
          code: d.code,
          status: d.status,
          score: d.score,
          passed: d.testCasesPassed,
          total: d.totalTestCases,
          submittedAt: d.createdAt,
          details: {
            executionTime: d.executionTime,
            memory: d.memory,
            error: d.error,
            testCasesPassed: d.testCasesPassed,
            totalTestCases: d.totalTestCases,
          },
        });
        if (d.status === 'passed') rec.verdict = 'passed';
        if (d.score > rec.bestScore) rec.bestScore = d.score;
      }
    }

    // Process progress records for quest and level completion flags
    for (const prog of progressRecords) {
      const user = prog.userId as any;
      if (!user || !user._id) continue;
      const sId = user._id.toString();

      if (!studentMap.has(sId)) {
        studentMap.set(sId, {
          student: {
            _id: user._id,
            name: user.name || 'Anonymous Student',
            email: user.email,
            rollNo: user.rollNo || user.studentId || '',
            department: user.department || '',
            avatar: user.avatar || '',
          },
          levelCompleted: false,
          questCompleted: false,
          sessions: [],
          submissions: [],
          bestScore: 0,
          verdict: 'unattempted',
          totalAttempts: 0,
          lastActivityAt: prog.updatedAt || prog.createdAt,
        });
      }

      const rec = studentMap.get(sId)!;
      const completedLevels = (prog.completedLevels || []).map((l: any) => l.toString());
      const completedQuests = (prog.completedQuests || []).map((q: any) => q.toString());

      if (completedLevels.includes(levelId)) {
        rec.levelCompleted = true;
        rec.verdict = 'passed';
      }
      if (completedQuests.includes(levelId)) {
        rec.questCompleted = true;
      }
    }

    const students = Array.from(studentMap.values()).sort((a, b) => {
      if (a.verdict === 'passed' && b.verdict !== 'passed') return -1;
      if (b.verdict === 'passed' && a.verdict !== 'passed') return 1;
      return new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime();
    });

    return reply.send({
      success: true,
      level: {
        _id: level._id,
        levelNumber: level.levelNumber,
        title: level.title,
        domain: level.domainId,
        codingChallenge: level.codingChallengeId,
      },
      totalStudents: students.length,
      passedCount: students.filter((s) => s.verdict === 'passed' || s.levelCompleted).length,
      students,
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.status(500).send({
      success: false,
      error: 'Failed to fetch level submissions: ' + (error.message || 'Server error'),
    });
  }
};

export default {
  getDomains,
  getDomainById,
  getDomainLevels,
  submitLevelQuest,
  createDomain,
  updateDomain,
  toggleDomainLock,
  deleteDomain,
  createLevel,
  getLevelById,
  updateLevel,
  deleteLevel,
  getLevelSubmissions,
  registerForDomain,
  getEnrolledStudents,
  getCourseAccessConfig,
  updateCourseVisibility,
  setStudentCourseAccess,
  batchSetCourseAccess,
  getStudentsWithCourseAccess,
  downloadCourseLevelsTemplate,
  bulkUploadCoursesAndLevels,
};

