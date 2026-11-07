/**
 * DEPRECATED ENDPOINT (Option B - SEC-Hardening)
 * POST /api/problems/:id/submit
 * Direct RapidAPI un-sandboxed execution path has been removed.
 * Modern sandboxed execution routes through /api/assessments/code/submit via RCEService.
 */
const submitCode = async (req, reply) => {
  return reply.code(410).send({
    success: false,
    error: 'This execution endpoint has been deprecated. Please use /api/assessments/code/submit for sandboxed execution.',
    code: 'ENDPOINT_DEPRECATED',
  });
};

module.exports = {
  submitCode,
};
