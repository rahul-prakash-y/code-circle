const { admin } = require('../config/firebase');

const verifyToken = async (request, reply) => {
  try {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.status(401).send({ error: 'Unauthorized: No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    request.user = decodedToken;
  } catch (error) {
    console.error('Firebase Auth Error:', error.code, error.message);
    return reply.status(401).send({ error: 'Unauthorized: Invalid token', code: error.code });
  }
};

module.exports = verifyToken;
