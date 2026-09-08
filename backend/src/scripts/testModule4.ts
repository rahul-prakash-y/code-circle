import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

async function runModule4Tests() {
  console.log('========================================================================');
  console.log('  STARTING INTEGRATION TESTS FOR MODULE 4: ASSESSMENTS & FEEDBACK       ');
  console.log('========================================================================');

  let passed = 0;
  let failed = 0;

  const assert = (condition: boolean, testName: string, extraInfo = '') => {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName} ${extraInfo}`);
      failed++;
    }
  };

  let superAdminToken = '';
  let adminToken = '';
  let studentToken = '';
  let studentId = '';
  let studentName = '';
  let studentRollNo = '';
  let createdAssessmentId = '';
  let testEventId = '';

  try {
    // -------------------------------------------------------------
    // Step 1: Authentication & Setup
    // -------------------------------------------------------------
    console.log('\n--- Step 1: Authentication for Roles ---');
    
    // 1.1 SuperAdmin Login
    const timestamp = Date.now();
    const saLogin = await axios.post(`${API_BASE}/auth/login`, {
      identifier: 'superadmin@codecircle.com',
      password: 'SuperAdmin@2026!',
    });
    assert(saLogin.data.success === true, 'SuperAdmin login succeeded');
    superAdminToken = saLogin.data.token;

    // 1.2 Standard Admin Account (Create via SuperAdmin or Login)
    const adminEmail = `admin_${timestamp}@codecircle.com`;
    const adminRoll = `ADM${timestamp.toString().slice(-5)}`;
    const adminPassword = 'AdminPassword@2026!';

    const createAdminRes = await axios.post(
      `${API_BASE}/users`,
      {
        name: 'Standard Admin User',
        rollNo: adminRoll,
        email: adminEmail,
        password: adminPassword,
        role: 'Admin',
        department: 'Information Technology',
      },
      { headers: { Authorization: `Bearer ${superAdminToken}` } }
    );
    assert(createAdminRes.status === 201, 'SuperAdmin created standard Admin account');

    const adminLogin = await axios.post(`${API_BASE}/auth/login`, {
      identifier: adminEmail,
      password: adminPassword,
    });
    adminToken = adminLogin.data.token;
    assert(!!adminToken, 'Standard Admin logged in successfully with Admin clearance');

    // 1.3 Student Account (Create or Login)
    studentRollNo = `STU${timestamp.toString().slice(-6)}`;
    studentName = `Student Tester ${timestamp.toString().slice(-4)}`;
    const studentEmail = `student_${timestamp}@codecircle.edu`;

    const regStudent = await axios.post(`${API_BASE}/auth/register`, {
      name: studentName,
      rollNo: studentRollNo,
      email: studentEmail,
      password: 'StudentPass@2026!',
      role: 'Student',
      department: 'Computer Science',
    });
    assert(regStudent.status === 201, 'Student registered successfully');
    studentToken = regStudent.data.token;
    studentId = regStudent.data.user.id || regStudent.data.user._id;

    // 1.4 Get or Create a test event for linkage
    const eventsRes = await axios.get(`${API_BASE}/events`, {
      headers: { Authorization: `Bearer ${superAdminToken}` },
    });
    if (eventsRes.data.data && eventsRes.data.data.length > 0) {
      testEventId = eventsRes.data.data[0]._id;
    } else {
      const newEvent = await axios.post(
        `${API_BASE}/events`,
        {
          title: 'Module 4 Demo Hackathon',
          description: 'Testing assessment and feedback engine',
          type: 'Technical',
          format: 'Individual',
          date: new Date(Date.now() + 86400000).toISOString(),
          status: 'Upcoming',
        },
        { headers: { Authorization: `Bearer ${superAdminToken}` } }
      );
      testEventId = newEvent.data._id;
    }
    assert(!!testEventId, 'Test Event acquired for assessment and feedback linkage');

    // -------------------------------------------------------------
    // Step 2: Assessment Management CRUD
    // -------------------------------------------------------------
    console.log('\n--- Step 2: Assessment Engine & Dynamic MCQ CRUD ---');

    const assessmentPayload = {
      title: `Full Stack Assessment ${timestamp}`,
      description: 'Test on modern React, Node, and Fastify web architecture',
      category: 'Web Development',
      eventId: testEventId,
      timeLimitMinutes: 20,
      passingScorePercentage: 60,
      isPublished: true,
      questions: [
        {
          questionText: 'Which HTTP method is idempotent according to REST conventions?',
          options: ['POST', 'PUT', 'PATCH', 'CONNECT'],
          correctOptionIndex: 1, // PUT
          explanation: 'PUT replaces target resource state and is idempotent.',
          points: 1,
        },
        {
          questionText: 'What hook is utilized for handling side-effects in functional React components?',
          options: ['useState', 'useReducer', 'useEffect', 'useMemo'],
          correctOptionIndex: 2, // useEffect
          explanation: 'useEffect handles component lifecycles and side-effects.',
          points: 1,
        },
        {
          questionText: 'In Fastify, what hook executes before the route handler for authentication?',
          options: ['preHandler', 'onRequest', 'preSerialization', 'onSend'],
          correctOptionIndex: 0, // preHandler
          explanation: 'preHandler executes right before the route handler.',
          points: 1,
        },
      ],
    };

    // 2.1 Standard Admin creates assessment
    const createAssRes = await axios.post(`${API_BASE}/assessments`, assessmentPayload, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(createAssRes.status === 201, 'Admin POST /api/assessments creates assessment with 201');
    assert(createAssRes.data.data.questions.length === 3, 'Assessment contains 3 dynamic MCQ questions');
    createdAssessmentId = createAssRes.data.data._id;

    // 2.2 Student fetches assessment -> Anti-cheat verification
    const studentGetRes = await axios.get(`${API_BASE}/assessments/${createdAssessmentId}`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert(studentGetRes.status === 200, 'Student can GET /api/assessments/:id');
    const studentQuestion = studentGetRes.data.data.questions[0];
    assert(
      studentQuestion.correctOptionIndex === undefined,
      'Anti-cheat: correctOptionIndex is NOT exposed to student'
    );
    assert(
      studentQuestion.explanation === undefined,
      'Anti-cheat: explanation is NOT exposed to student'
    );
    assert(studentQuestion.options.length === 4, 'Question options array preserved for student');

    // 2.3 Student submits assessment answers
    // Question 0: student picks index 1 (correct)
    // Question 1: student picks index 2 (correct)
    // Question 2: student picks index 3 (wrong, correct is 0)
    console.log('\n--- Step 3: Student Assessment Taking & Automated Scoring ---');
    const submissionPayload = {
      answers: [
        { questionIndex: 0, selectedOption: 1 }, // Correct (+1)
        { questionIndex: 1, selectedOption: 2 }, // Correct (+1)
        { questionIndex: 2, selectedOption: 3 }, // Wrong (+0)
      ],
      timeSpentSeconds: 145,
    };

    const submitRes = await axios.post(
      `${API_BASE}/assessments/${createdAssessmentId}/submit`,
      submissionPayload,
      { headers: { Authorization: `Bearer ${studentToken}` } }
    );
    assert(submitRes.status === 201, 'Student POST /api/assessments/:id/submit returns 201');
    const result = submitRes.data.data;
    assert(result.score === 2, `Score calculated accurately: 2 points earned (received: ${result.score})`);
    assert(result.totalPoints === 3, 'Total points equals 3');
    assert(result.percentage === 66.7, `Percentage calculated accurately: 66.7% (received: ${result.percentage})`);
    assert(result.passed === true, 'Student passed assessment (66.7% >= 60% threshold)');
    assert(result.detailedResults.length === 3, 'Detailed results returned with answer review');
    assert(result.detailedResults[0].isCorrect === true, 'Question 1 marked correct');
    assert(result.detailedResults[2].isCorrect === false, 'Question 3 marked incorrect');

    // 2.4 Student checks their personal submission history
    const mySubsRes = await axios.get(`${API_BASE}/assessments/my-submissions`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert(mySubsRes.data.data.length >= 1, 'Student can retrieve personal submissions');

    // 2.5 Admin views submissions for the assessment
    const adminSubsRes = await axios.get(`${API_BASE}/assessments/${createdAssessmentId}/submissions`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(adminSubsRes.data.data.length >= 1, 'Admin can view student submissions roster');
    assert(adminSubsRes.data.data[0].user.rollNo === studentRollNo, 'Student roll number visible in admin roster');

    // -------------------------------------------------------------
    // Step 4: Student Feedback System & Privacy Enforcement
    // -------------------------------------------------------------
    console.log('\n--- Step 4: Student Feedback System & Privacy Verification ---');

    // 4.1 Student submits General Club Feedback
    const generalFbPayload = {
      type: 'ClubGeneral',
      rating: 5,
      category: 'General',
      comment: 'Code Circle workshops and mentorship sessions are outstanding!',
    };
    const submitGeneralFb = await axios.post(`${API_BASE}/feedback`, generalFbPayload, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert(submitGeneralFb.status === 201, 'Student submitted General Club Feedback');

    // 4.2 Student submits Event Feedback
    const eventFbPayload = {
      type: 'Event',
      eventId: testEventId,
      rating: 4,
      category: 'Event Content',
      comment: 'Great problem difficulty and engaging competition logistics.',
    };
    const submitEventFb = await axios.post(`${API_BASE}/feedback`, eventFbPayload, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert(submitEventFb.status === 201, 'Student submitted Event Feedback');

    // 4.3 Student views their own feedbacks
    const myFbRes = await axios.get(`${API_BASE}/feedback/my`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert(myFbRes.data.data.length >= 2, 'Student can fetch their own submitted feedback history');

    // 4.4 Standard Admin fetches feedback -> VERIFY PRIVACY ANONYMIZATION
    console.log('\n--- Step 5: Privacy Logic Testing (Standard Admin vs SuperAdmin) ---');
    const adminFbRes = await axios.get(`${API_BASE}/feedback`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(adminFbRes.status === 200, 'Standard Admin can GET /api/feedback');
    assert(adminFbRes.data.isSuperAdminView === false, 'isSuperAdminView is FALSE for standard Admin');
    
    // Check anonymity of student records
    const adminFeedbacks = adminFbRes.data.data;
    const targetAdminFb = adminFeedbacks.find((f: any) => f.comment.includes('outstanding'));
    assert(!!targetAdminFb, 'Target feedback found in Admin list');
    assert(
      targetAdminFb.user.name === 'Anonymous User',
      `Privacy Passed: Admin sees name as "Anonymous User" (got: ${targetAdminFb.user.name})`
    );
    assert(
      targetAdminFb.user.rollNo === 'ANONYMOUS',
      `Privacy Passed: Admin sees rollNo as "ANONYMOUS" (got: ${targetAdminFb.user.rollNo})`
    );
    assert(
      targetAdminFb.user.email === 'anonymous@codecircle.internal',
      'Privacy Passed: Admin cannot see real student email'
    );
    assert(targetAdminFb.isAnonymous === true, 'Feedback marked isAnonymous = true for Admin');

    // 4.5 SuperAdmin fetches feedback -> VERIFY IDENTITY ATTRIBUTION
    const saFbRes = await axios.get(`${API_BASE}/feedback`, {
      headers: { Authorization: `Bearer ${superAdminToken}` },
    });
    assert(saFbRes.status === 200, 'SuperAdmin can GET /api/feedback');
    assert(saFbRes.data.isSuperAdminView === true, 'isSuperAdminView is TRUE for SuperAdmin');

    const saFeedbacks = saFbRes.data.data;
    const targetSaFb = saFeedbacks.find((f: any) => f.comment.includes('outstanding'));
    assert(!!targetSaFb, 'Target feedback found in SuperAdmin list');
    assert(
      targetSaFb.user.name === studentName,
      `SuperAdmin Attribution: Full student name visible (${targetSaFb.user.name})`
    );
    assert(
      targetSaFb.user.rollNo === studentRollNo,
      `SuperAdmin Attribution: Full student rollNo visible (${targetSaFb.user.rollNo})`
    );
    assert(
      targetSaFb.user.email === studentEmail,
      `SuperAdmin Attribution: Full student email visible (${targetSaFb.user.email})`
    );
    assert(targetSaFb.isAnonymous === false, 'Feedback marked isAnonymous = false for SuperAdmin');

    // 4.6 Feedback Stats
    const statsRes = await axios.get(`${API_BASE}/feedback/stats`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(statsRes.status === 200, 'GET /api/feedback/stats returns 200');
    assert(statsRes.data.data.totalFeedbacks >= 2, 'Feedback stats reflect submitted entries');
    assert(statsRes.data.data.averageRating > 0, 'Average rating computed accurately');

  } catch (err: any) {
    console.error('💥 Test Execution Error:', err.response?.data || err.message);
    failed++;
  }

  console.log('\n========================================================================');
  console.log(`MODULE 4 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('========================================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runModule4Tests();
