const axios = require('axios');
const Submission = require('../models/submissionModel');
const Problem = require('../models/problemModel');

const JUDGE0_URL = process.env.JUDGE0_URL || 'https://judge0-ce.p.rapidapi.com';
const JUDGE0_KEY = process.env.JUDGE0_KEY;
const JUDGE0_HOST = process.env.JUDGE0_HOST || 'judge0-ce.p.rapidapi.com';

const submitCode = async (req, reply) => {
  const { id } = req.params;
  const { code, languageId } = req.body;
  const userId = req.user.uid; // From auth middleware

  try {
    const problem = await Problem.findById(id);
    if (!problem) return reply.code(404).send({ message: 'Problem not found' });

    // Prepare batch submission for Judge0
    const submissions = problem.testCases.map(tc => ({
      language_id: languageId,
      source_code: Buffer.from(code).toString('base64'),
      stdin: Buffer.from(tc.input).toString('base64'),
      expected_output: Buffer.from(tc.expectedOutput).toString('base64'),
    }));

    // Send to Judge0 (Note: RapidAPI requires X-RapidAPI-Key and X-RapidAPI-Host)
    const response = await axios.post(`${JUDGE0_URL}/submissions/batch?base64_encoded=true`, 
      { submissions },
      {
        headers: {
          'content-type': 'application/json',
          'X-RapidAPI-Key': JUDGE0_KEY,
          'X-RapidAPI-Host': JUDGE0_HOST,
        }
      }
    );

    const tokens = response.data.map(s => s.token).join(',');

    // Poll for results (Simplified for this task, in production use webhooks or background job)
    let results = [];
    let processing = true;
    let attempts = 0;

    while (processing && attempts < 10) {
      const resultRes = await axios.get(`${JUDGE0_URL}/submissions/batch?tokens=${tokens}&base64_encoded=true`, {
        headers: {
          'X-RapidAPI-Key': JUDGE0_KEY,
          'X-RapidAPI-Host': JUDGE0_HOST,
        }
      });

      results = resultRes.data.submissions;
      processing = results.some(r => r.status.id <= 2); // 1: In Queue, 2: Processing
      if (processing) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        attempts++;
      }
    }

    // Process results
    const processedResults = results.map((res, index) => ({
      testCaseId: problem.testCases[index]._id,
      status: res.status.description,
      stdout: res.stdout ? Buffer.from(res.stdout, 'base64').toString() : null,
      stderr: res.stderr ? Buffer.from(res.stderr, 'base64').toString() : null,
      time: parseFloat(res.time),
      memory: parseFloat(res.memory),
    }));

    const finalStatus = processedResults.every(r => r.status === 'Accepted') ? 'Accepted' : 'Wrong Answer';

    const submission = new Submission({
      user: userId, // Assuming user is tracked by UID in this specific app logic or ref search needed
      problem: id,
      code,
      languageId,
      status: finalStatus,
      results: processedResults
    });

    await submission.save();

    return reply.send({
      submissionId: submission._id,
      status: finalStatus,
      results: processedResults
    });

  } catch (error) {
    console.error('Judge0 Error:', error.response?.data || error.message);
    return reply.code(500).send({ message: 'Internal Server Error during code execution' });
  }
};

module.exports = {
  submitCode
};
