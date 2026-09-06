import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

async function runModule3Tests() {
  console.log('===============================================================');
  console.log('  STARTING INTEGRATION TESTS FOR MODULE 3: EVENTS, TEAMS, OTP  ');
  console.log('===============================================================');

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

  let adminToken = '';
  let authHeaders = {};
  let createdEventId = '';
  let createdTeamId = '';
  let generatedOtp = '';
  let currentUserId = '';

  try {
    // 1. Authenticate as SuperAdmin
    console.log('\n--- Step 1: Admin Authentication ---');
    const loginRes = await axios.post(`${API_BASE}/auth/login`, {
      identifier: 'superadmin@codecircle.com',
      password: 'SuperAdmin@2026!',
    });
    assert(loginRes.data.success === true, 'Admin login succeeds');
    adminToken = loginRes.data.token;
    currentUserId = loginRes.data.user.id || loginRes.data.user._id;
    authHeaders = { headers: { Authorization: `Bearer ${adminToken}` } };

    // 2. Events Management CRUD
    console.log('\n--- Step 2: Events Management CRUD ---');
    const eventPayload = {
      title: `E2E Test Hackathon ${Date.now()}`,
      description: 'Full stack autonomous coding hackathon with OTP tracking',
      type: 'Workshop',
      format: 'Team',
      date: new Date(Date.now() + 86400000).toISOString(),
      status: 'Upcoming',
      venueOrLink: 'Auditorium A / Online',
      maxParticipants: 4,
      registrationDeadline: new Date(Date.now() + 43200000).toISOString(),
    };

    const createEventRes = await axios.post(`${API_BASE}/events`, eventPayload, authHeaders);
    assert(createEventRes.status === 201, 'POST /api/events creates event with 201');
    assert(createEventRes.data.type === 'Workshop', 'Event type correctly set to Workshop');
    assert(createEventRes.data.format === 'Team', 'Event format correctly set to Team');
    assert(createEventRes.data.status === 'Upcoming', 'Event status correctly set to Upcoming');
    createdEventId = createEventRes.data._id;
    console.log(`Created Event ID: ${createdEventId}`);

    // Read Events with filters
    const getEventsRes = await axios.get(`${API_BASE}/events?type=Workshop&format=Team`, authHeaders);
    assert(getEventsRes.status === 200, 'GET /api/events with filters returns 200');
    assert(
      getEventsRes.data.some((e: any) => e._id === createdEventId),
      'Created event present in filtered events query'
    );

    // Read Single Event
    const singleEventRes = await axios.get(`${API_BASE}/events/${createdEventId}`, authHeaders);
    assert(singleEventRes.status === 200, 'GET /api/events/:id returns 200');
    assert(singleEventRes.data.title === eventPayload.title, 'Single event title matches');

    // Update Event to Status Live
    const updateEventRes = await axios.put(
      `${API_BASE}/events/${createdEventId}`,
      { status: 'Live', title: `${eventPayload.title} (Live)` },
      authHeaders
    );
    assert(updateEventRes.status === 200, 'PUT /api/events/:id updates event');
    assert(updateEventRes.data.status === 'Live', 'Event status transitioned to Live');

    // 3. Teams Management CRUD & Member Assignment
    console.log('\n--- Step 3: Teams Management CRUD & Student Mapping ---');
    const teamPayload = {
      name: `Orion Coders ${Date.now()}`,
      description: 'Team specialized in scalable distributed web systems',
      event: createdEventId,
      status: 'Active',
    };

    const createTeamRes = await axios.post(`${API_BASE}/teams`, teamPayload, authHeaders);
    assert(createTeamRes.status === 201, 'POST /api/teams creates team with 201');
    assert(createTeamRes.data.success === true, 'Team creation indicates success');
    createdTeamId = createTeamRes.data.team._id;
    console.log(`Created Team ID: ${createdTeamId}`);

    // Map/assign current student/admin to the team
    const assignRes = await axios.post(
      `${API_BASE}/teams/${createdTeamId}/members`,
      { members: [currentUserId] },
      authHeaders
    );
    assert(assignRes.status === 200, 'POST /api/teams/:id/members maps student to team');
    assert(
      assignRes.data.team.members.some((m: any) => m._id === currentUserId || m === currentUserId),
      'Assigned member is present in team roster'
    );

    // Block the team
    const blockRes = await axios.patch(
      `${API_BASE}/teams/${createdTeamId}/status`,
      { status: 'Blocked' },
      authHeaders
    );
    assert(blockRes.status === 200, 'PATCH /api/teams/:id/status blocks team');
    assert(blockRes.data.team.status === 'Blocked', 'Team status is Blocked');
    assert(blockRes.data.team.isActive === false, 'Blocked team isActive is false');

    // Deactivate the team
    const deactivateRes = await axios.patch(
      `${API_BASE}/teams/${createdTeamId}/status`,
      { status: 'Inactive' },
      authHeaders
    );
    assert(deactivateRes.status === 200, 'PATCH /api/teams/:id/status deactivates team');
    assert(deactivateRes.data.team.status === 'Inactive', 'Team status is Inactive');

    // Reactivate the team
    const reactivateRes = await axios.patch(
      `${API_BASE}/teams/${createdTeamId}/status`,
      { status: 'Active' },
      authHeaders
    );
    assert(reactivateRes.status === 200, 'PATCH /api/teams/:id/status activates team');
    assert(reactivateRes.data.team.status === 'Active', 'Team status is Active');

    // Query teams list
    const getTeamsRes = await axios.get(`${API_BASE}/teams?status=Active`, authHeaders);
    assert(getTeamsRes.status === 200, 'GET /api/teams returns 200');
    assert(
      getTeamsRes.data.teams.some((t: any) => t._id === createdTeamId),
      'Created team found in active teams list'
    );

    // 4. OTP Attendance System
    console.log('\n--- Step 4: Time-Sensitive 6-Digit OTP & Attendance ---');
    const sessionRes = await axios.post(
      `${API_BASE}/attendance/sessions`,
      {
        event: createdEventId,
        sessionName: 'Module 3 Verification Session',
        durationMinutes: 30,
      },
      authHeaders
    );
    assert(sessionRes.status === 201, 'POST /api/attendance/sessions creates OTP session');
    assert(typeof sessionRes.data.otp === 'string', 'OTP is generated as a string');
    assert(sessionRes.data.otp.length === 6, 'Generated OTP is exactly 6 digits');
    assert(/^\d{6}$/.test(sessionRes.data.otp), 'Generated OTP is strictly numeric 6 digits');
    generatedOtp = sessionRes.data.otp;
    console.log(`Generated 6-Digit Event OTP: ${generatedOtp}`);

    // Check active session endpoint
    const activeSessionRes = await axios.get(
      `${API_BASE}/attendance/sessions/active/${createdEventId}`,
      authHeaders
    );
    assert(activeSessionRes.status === 200, 'GET /api/attendance/sessions/active/:eventId returns 200');
    assert(activeSessionRes.data.session.otp === generatedOtp, 'Active session OTP matches generated OTP');
    assert(activeSessionRes.data.session.remainingSeconds > 0, 'Remaining seconds countdown is positive');

    // Student submits valid OTP to mark attendance
    const markRes = await axios.post(
      `${API_BASE}/attendance/mark`,
      { otp: generatedOtp },
      authHeaders
    );
    assert(markRes.status === 200, 'POST /api/attendance/mark marks attendance');
    assert(markRes.data.success === true, 'Attendance mark confirms success');

    // Verify duplicate attendance prevention
    try {
      await axios.post(`${API_BASE}/attendance/mark`, { otp: generatedOtp }, authHeaders);
      assert(false, 'Duplicate attendance should have failed');
    } catch (dupErr: any) {
      assert(
        dupErr.response?.status === 400,
        'Duplicate attendance request rejected with 400 Bad Request'
      );
      assert(
        dupErr.response?.data?.error?.includes('already been marked'),
        'Duplicate attendance error indicates attendance already marked'
      );
    }

    // Verify invalid OTP rejection
    try {
      await axios.post(`${API_BASE}/attendance/mark`, { otp: '000000' }, authHeaders);
      assert(false, 'Invalid OTP should have failed');
    } catch (invErr: any) {
      assert(invErr.response?.status === 400, 'Invalid OTP rejected with 400 Bad Request');
    }

    // 5. Admin Attendance Records View Queries
    console.log('\n--- Step 5: Admin Attendance Records Dual-Filter Queries ---');

    // Query 1: Filter attendance by Event
    const eventRecordsRes = await axios.get(
      `${API_BASE}/attendance/records?eventId=${createdEventId}`,
      authHeaders
    );
    assert(eventRecordsRes.status === 200, 'GET /api/attendance/records?eventId=... returns 200');
    assert(eventRecordsRes.data.data.mode === 'event', 'Records response mode is event');
    assert(eventRecordsRes.data.data.records.length >= 1, 'Records contains marked student attendee');
    assert(
      eventRecordsRes.data.data.records[0].user._id === currentUserId,
      'Attendee student user ID matches test user'
    );

    // Query 2: Filter attendance by Student
    const studentRecordsRes = await axios.get(
      `${API_BASE}/attendance/records?studentId=${currentUserId}`,
      authHeaders
    );
    assert(studentRecordsRes.status === 200, 'GET /api/attendance/records?studentId=... returns 200');
    assert(studentRecordsRes.data.data.mode === 'student', 'Records response mode is student');
    assert(
      studentRecordsRes.data.data.records.some((r: any) => r.event?._id === createdEventId),
      'Student records list includes the newly attended event'
    );

    // 6. Cleanup Test Artifacts
    console.log('\n--- Step 6: Cleanup Test Artifacts ---');
    await axios.delete(`${API_BASE}/teams/${createdTeamId}`, authHeaders);
    console.log('Cleaned up test team');
    await axios.delete(`${API_BASE}/events/${createdEventId}`, authHeaders);
    console.log('Cleaned up test event');
    assert(true, 'Test artifacts cleaned up successfully');

  } catch (err: any) {
    console.error('Fatal test error:', err.response?.data || err.message);
    failed++;
  }

  console.log('\n===============================================================');
  console.log(`  INTEGRATION TEST SUMMARY: ${passed} PASSED, ${failed} FAILED  `);
  console.log('===============================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runModule3Tests();
