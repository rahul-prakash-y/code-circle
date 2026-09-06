import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

async function runTests() {
  console.log('--- Starting Integration Tests for Module 1: Auth & User Management ---');
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

  try {
    // 1. Health check
    const healthRes = await axios.get(`${API_BASE}/health`);
    assert(healthRes.status === 200, 'Health endpoint responds with 200');

    // 2. SuperAdmin Login
    const superAdminLoginRes = await axios.post(`${API_BASE}/auth/login`, {
      identifier: 'superadmin@codecircle.com',
      password: 'SuperAdmin@2026!',
    });
    assert(superAdminLoginRes.data.success === true, 'SuperAdmin login succeeds');
    assert(superAdminLoginRes.data.user.role === 'SuperAdmin', 'SuperAdmin has role SuperAdmin');
    assert(!superAdminLoginRes.data.user.password, 'Raw password omitted from login response');
    const superAdminToken = superAdminLoginRes.data.token;

    // 3. Register a test student
    const testStudentRoll = `TEST${Date.now().toString().slice(-6)}`;
    const testStudentEmail = `test_${Date.now()}@bitsathy.ac.in`;
    const regRes = await axios.post(`${API_BASE}/auth/register`, {
      name: 'Test Student One',
      rollNo: testStudentRoll,
      email: testStudentEmail,
      password: 'Password123!',
      department: 'Computer Science',
    });
    assert(regRes.status === 201, 'Student registration returns 201');
    assert(regRes.data.user.role === 'Student', 'Registered user defaults to Student role');
    const studentToken = regRes.data.token;
    const studentId = regRes.data.user._id || regRes.data.user.id;

    // 4. Student attempting Admin route (/api/users) should be rejected with 403
    try {
      await axios.get(`${API_BASE}/users`, {
        headers: { Authorization: `Bearer ${studentToken}` },
      });
      assert(false, 'Student should NOT be permitted to access /api/users');
    } catch (err: any) {
      assert(err.response?.status === 403, 'Student access to /api/users is blocked with 403 Forbidden');
    }

    // 5. SuperAdmin querying users directory with pagination and search
    const usersListRes = await axios.get(`${API_BASE}/users?page=1&limit=5&search=${testStudentRoll}`, {
      headers: { Authorization: `Bearer ${superAdminToken}` },
    });
    assert(usersListRes.data.success === true, 'SuperAdmin can query /api/users');
    assert(usersListRes.data.data.pagination.total >= 1, 'Search finds registered student');
    assert(usersListRes.data.data.users[0].rollNo === testStudentRoll, 'Returned user matches query');
    assert(!usersListRes.data.data.users[0].password, 'Raw password is NOT exposed in user listing');

    // 6. Admin User Creation via /api/users
    const createdStudentRoll = `CRTD${Date.now().toString().slice(-6)}`;
    const createdStudentEmail = `created_${Date.now()}@bitsathy.ac.in`;
    const createRes = await axios.post(
      `${API_BASE}/users`,
      {
        name: 'Created By Admin',
        email: createdStudentEmail,
        rollNo: createdStudentRoll,
        role: 'Student',
        department: 'Information Technology',
      },
      { headers: { Authorization: `Bearer ${superAdminToken}` } }
    );
    assert(createRes.status === 201, 'Admin can create new user');
    assert(Boolean(createRes.data.generatedPassword), 'Temporary default password generated when omitted');
    const createdUserId = createRes.data.user._id || createRes.data.user.id;

    // 7. Update User details
    const updateRes = await axios.put(
      `${API_BASE}/users/${createdUserId}`,
      {
        name: 'Updated Name',
        department: 'AI & Data Science',
      },
      { headers: { Authorization: `Bearer ${superAdminToken}` } }
    );
    assert(updateRes.data.user.name === 'Updated Name', 'User details updated successfully');

    // 8. Toggle Block User
    const blockRes = await axios.patch(
      `${API_BASE}/users/${createdUserId}/block`,
      { isBlocked: true },
      { headers: { Authorization: `Bearer ${superAdminToken}` } }
    );
    assert(blockRes.data.user.isBlocked === true, 'User is marked as blocked');

    // Verify blocked user cannot log in
    try {
      await axios.post(`${API_BASE}/auth/login`, {
        identifier: createdStudentEmail,
        password: createRes.data.generatedPassword,
      });
      assert(false, 'Blocked user should NOT be able to log in');
    } catch (err: any) {
      assert(err.response?.status === 403, 'Blocked user login receives 403 Forbidden');
    }

    // Unblock user
    await axios.patch(
      `${API_BASE}/users/${createdUserId}/block`,
      { isBlocked: false },
      { headers: { Authorization: `Bearer ${superAdminToken}` } }
    );

    // 9. Trigger Password Reset Link
    const resetLinkRes = await axios.post(
      `${API_BASE}/users/${studentId}/reset-link`,
      {},
      { headers: { Authorization: `Bearer ${superAdminToken}` } }
    );
    assert(resetLinkRes.data.success === true, 'Reset link generated successfully');
    assert(Boolean(resetLinkRes.data.resetLink), 'Reset link URL present in response');

    // Extract token from reset link
    const resetUrl = new URL(resetLinkRes.data.resetLink);
    const resetToken = resetUrl.searchParams.get('token')!;
    assert(Boolean(resetToken), 'Extracted reset token from link');

    // Redeem reset token via /api/auth/reset-password
    const newStudentPass = 'NewlyResetPass@2026!';
    const redeemRes = await axios.post(`${API_BASE}/auth/reset-password`, {
      token: resetToken,
      newPassword: newStudentPass,
    });
    assert(redeemRes.data.success === true, 'Password reset redeemed successfully');

    // Verify student can log in with new password
    const newLoginRes = await axios.post(`${API_BASE}/auth/login`, {
      identifier: testStudentEmail,
      password: newStudentPass,
    });
    assert(newLoginRes.data.success === true, 'Student can log in with redeemed new password');

    // 10. SuperAdmin Force Password Reset
    const forceResetRes = await axios.post(
      `${API_BASE}/users/${studentId}/force-reset-password`,
      {},
      { headers: { Authorization: `Bearer ${superAdminToken}` } }
    );
    assert(forceResetRes.data.success === true, 'SuperAdmin forcefully resets user password');
    assert(Boolean(forceResetRes.data.temporaryPassword), 'Temporary password provided in response once');
    const tempPass = forceResetRes.data.temporaryPassword;

    // Verify student can log in with temporary password
    const tempLoginRes = await axios.post(`${API_BASE}/auth/login`, {
      identifier: testStudentEmail,
      password: tempPass,
    });
    assert(tempLoginRes.data.success === true, 'Student logs in successfully with SuperAdmin temporary password');

    // 11. Delete created user
    const deleteRes = await axios.delete(`${API_BASE}/users/${createdUserId}`, {
      headers: { Authorization: `Bearer ${superAdminToken}` },
    });
    assert(deleteRes.data.success === true, 'User deleted successfully');

    // Clean up test student
    await axios.delete(`${API_BASE}/users/${studentId}`, {
      headers: { Authorization: `Bearer ${superAdminToken}` },
    });

  } catch (error: any) {
    console.error('Fatal test error:', error.message, error.response?.data || '');
    failed++;
  }

  console.log(`\n========================================`);
  console.log(`Tests Finished: ${passed} PASSED, ${failed} FAILED`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests();
