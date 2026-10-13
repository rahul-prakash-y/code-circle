import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

async function verifyFeatures() {
  console.log('========================================================================');
  console.log('  VERIFYING EVENT PARTICIPANTS & ASSESSMENT SUBMISSION MANAGEMENT ENGINE ');
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

  const timestamp = Date.now();
  let adminToken = '';
  let studentAToken = '';
  let studentAId = '';
  let studentBToken = '';
  let studentBId = '';
  let testEventId = '';
  let testAssessmentId = '';

  try {
    // 1. Authenticate Admin
    console.log('\n--- 1. Authentication ---');
    const saLogin = await axios.post(`${API_BASE}/auth/login`, {
      identifier: 'superadmin@codecircle.com',
      password: 'SuperAdmin@2026!',
    });
    assert(saLogin.data.success === true, 'SuperAdmin login succeeded');
    adminToken = saLogin.data.token;

    // Create Student A (will register but NOT mark attendance)
    const emailA = `studentA_${timestamp}@codecircle.com`;
    const rollA = `STA${timestamp.toString().slice(-5)}`;
    const regA = await axios.post(
      `${API_BASE}/users`,
      {
        name: `Student A Absent`,
        email: emailA,
        rollNo: rollA,
        department: 'CSE',
        year: '3rd Year',
        role: 'Student',
        password: 'Password@2026!',
      },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    studentAId = regA.data.data?._id || regA.data.user?._id;
    assert(!!studentAId, 'Student A created');

    const loginA = await axios.post(`${API_BASE}/auth/login`, {
      identifier: emailA,
      password: 'Password@2026!',
    });
    studentAToken = loginA.data.token;

    // Create Student B (walk-in: will NOT register, but will mark attendance)
    const emailB = `studentB_${timestamp}@codecircle.com`;
    const rollB = `STB${timestamp.toString().slice(-5)}`;
    const regB = await axios.post(
      `${API_BASE}/users`,
      {
        name: `Student B Walkin`,
        email: emailB,
        rollNo: rollB,
        department: 'IT',
        year: '2nd Year',
        role: 'Student',
        password: 'Password@2026!',
      },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    studentBId = regB.data.data?._id || regB.data.user?._id;
    assert(!!studentBId, 'Student B created');

    const loginB = await axios.post(`${API_BASE}/auth/login`, {
      identifier: emailB,
      password: 'Password@2026!',
    });
    studentBToken = loginB.data.token;

    // 2. Create Event
    console.log('\n--- 2. Create Test Event ---');
    const eventRes = await axios.post(
      `${API_BASE}/events`,
      {
        title: `Verification Event ${timestamp}`,
        description: 'Testing participants vs registered and walkins',
        date: new Date(Date.now() + 86400000).toISOString(),
        format: 'Individual',
        type: 'Technical',
        venue: 'Lab 1',
        maxParticipants: 100,
        hourlyPoints: 50,
      },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    testEventId = eventRes.data.data?._id || eventRes.data._id;
    assert(!!testEventId, 'Test Event created');

    // 3. Student A registers for the event (does NOT mark attendance)
    console.log('\n--- 3. Student A Registers for Event ---');
    const enrollResA = await axios.post(
      `${API_BASE}/enrollments`,
      {
        event: testEventId,
        type: 'Individual',
      },
      { headers: { Authorization: `Bearer ${studentAToken}` } }
    );
    assert(enrollResA.status === 200 || enrollResA.status === 201, 'Student A registered for event');

    // 4. Student B marks attendance (walk-in attendee: never registered)
    console.log('\n--- 4. Student B Marks Attendance Without Registering (Walk-in) ---');
    // Admin creates attendance session
    const sessionRes = await axios.post(
      `${API_BASE}/attendance/sessions`,
      {
        event: testEventId,
        sessionName: 'Morning Session',
        durationMinutes: 60,
        classHours: [1, 2],
        hourlyPoints: 50,
      },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    const otp = sessionRes.data.data.otp;
    const sessionId = sessionRes.data.data._id;
    assert(!!otp, `Attendance session created with OTP: ${otp}`);

    // Student B verifies OTP to mark attendance
    const otpRes = await axios.post(
      `${API_BASE}/attendance/verify-otp`,
      {
        otp,
        sessionId,
      },
      { headers: { Authorization: `Bearer ${studentBToken}` } }
    );
    assert(otpRes.data.success === true, 'Student B successfully marked attendance via OTP');

    // 5. Verify Registered List vs Participants List
    console.log('\n--- 5. Verify Registered Students vs Participants Separation ---');
    const registeredRes = await axios.get(
      `${API_BASE}/enrollments/event/${testEventId}/registered`,
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    const registeredList = registeredRes.data;
    const registeredUserIds = registeredList.map((e: any) => e.enrolledBy?._id?.toString() || e.enrolledBy?.toString());

    assert(
      registeredUserIds.includes(studentAId.toString()),
      'Registered students list contains Student A (who pre-registered)'
    );
    assert(
      !registeredUserIds.includes(studentBId.toString()),
      'Registered students list EXCLUDES Student B (walk-in attendee who only marked attendance)'
    );

    const participantsRes = await axios.get(
      `${API_BASE}/enrollments/event/${testEventId}/participants`,
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    const participantsList = participantsRes.data;
    const participantsUserIds = participantsList.map((e: any) => e.enrolledBy?._id?.toString() || e.enrolledBy?.toString());

    assert(
      participantsUserIds.includes(studentBId.toString()),
      'Participants list CONTAINS Student B (who marked attendance, even without pre-registering)'
    );
    assert(
      !participantsUserIds.includes(studentAId.toString()),
      'Participants list EXCLUDES Student A (pre-registered student who did NOT mark attendance)'
    );

    const studentBParticipant = participantsList.find((e: any) => (e.enrolledBy?._id?.toString() || e.enrolledBy?.toString()) === studentBId.toString());
    assert(
      studentBParticipant?.isWalkIn === true,
      'Student B is flagged as isWalkIn: true in participants list'
    );

    // 6. Test Assessment Engine: Create MCQ Assessment
    console.log('\n--- 6. Test Assessment Creation & Student Submission ---');
    const assRes = await axios.post(
      `${API_BASE}/assessments`,
      {
        title: `MCQ Assessment ${timestamp}`,
        description: 'Submission management test',
        category: 'Technical',
        timeLimitMinutes: 30,
        passingScorePercentage: 50,
        questions: [
          {
            questionText: 'What is 2 + 2?',
            options: ['3', '4', '5', '6'],
            correctOptionIndex: 1,
            points: 10,
          },
          {
            questionText: 'What is 5 * 5?',
            options: ['20', '25', '30', '35'],
            correctOptionIndex: 1,
            points: 10,
          },
        ],
      },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    testAssessmentId = assRes.data.data._id;
    assert(!!testAssessmentId, 'Assessment created');

    // Student A submits assessment
    const submitRes = await axios.post(
      `${API_BASE}/assessments/${testAssessmentId}/submit`,
      {
        answers: [
          { questionIndex: 0, selectedOption: 1 },
          { questionIndex: 1, selectedOption: 0 },
        ],
        timeSpentSeconds: 45,
      },
      { headers: { Authorization: `Bearer ${studentAToken}` } }
    );
    const submissionId = submitRes.data.data.submissionId;
    assert(!!submissionId, 'Student A submitted assessment (Attempt 1)');

    // 7. Student Reappear: Student resets their own submission retry
    console.log('\n--- 7. Student Reappear: Reset Own Submission Retry ---');
    const resetMyRes = await axios.delete(
      `${API_BASE}/assessments/${testAssessmentId}/my-submission`,
      { headers: { Authorization: `Bearer ${studentAToken}` } }
    );
    assert(resetMyRes.data.success === true, 'Student DELETE /api/assessments/:id/my-submission reset attempt');

    // Check that Student A can reappear fresh and submit again
    const submitAgainRes = await axios.post(
      `${API_BASE}/assessments/${testAssessmentId}/submit`,
      {
        answers: [
          { questionIndex: 0, selectedOption: 1 },
          { questionIndex: 1, selectedOption: 1 },
        ],
        timeSpentSeconds: 30,
      },
      { headers: { Authorization: `Bearer ${studentAToken}` } }
    );
    const secondSubmissionId = submitAgainRes.data.data.submissionId;
    assert(!!secondSubmissionId, 'Student A reappeared and submitted Attempt 2 successfully (100% score)');

    // 8. Admin Submission Management: Allow Student Reappear
    console.log('\n--- 8. Admin Submission Management: Allow Student to Reappear ---');
    const adminReappearRes = await axios.post(
      `${API_BASE}/assessments/${testAssessmentId}/reappear/${studentAId}`,
      {},
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    assert(adminReappearRes.data.success === true, 'Admin POST /api/assessments/:id/reappear/:studentId cleared attempts');

    // 9. Student submits attempt 3, Admin deletes specific retry submission
    console.log('\n--- 9. Admin Submission Management: Delete Specific Retry Submission ---');
    const submit3Res = await axios.post(
      `${API_BASE}/assessments/${testAssessmentId}/submit`,
      {
        answers: [{ questionIndex: 0, selectedOption: 1 }],
        timeSpentSeconds: 20,
      },
      { headers: { Authorization: `Bearer ${studentAToken}` } }
    );
    const sub3Id = submit3Res.data.data.submissionId;
    assert(!!sub3Id, 'Student A submitted Attempt 3');

    // Admin deletes this retry submission
    const deleteSubRes = await axios.delete(
      `${API_BASE}/assessments/${testAssessmentId}/submissions/${sub3Id}`,
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    assert(deleteSubRes.data.success === true, 'Admin DELETE /api/assessments/:id/submissions/:submissionId deleted retry attempt');

    // Verify roster is empty after deletion
    const rosterRes = await axios.get(
      `${API_BASE}/assessments/${testAssessmentId}/submissions`,
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    assert(rosterRes.data.data.length === 0, 'Assessment submissions roster confirms attempt was deleted');

  } catch (error: any) {
    console.error('Test execution error:', error.response?.data || error.message);
    failed++;
  }

  console.log('\n========================================================================');
  console.log(`  VERIFICATION RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('========================================================================');
  if (failed > 0) {
    process.exit(1);
  }
}

verifyFeatures();
