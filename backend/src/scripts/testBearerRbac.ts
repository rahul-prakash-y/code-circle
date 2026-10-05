import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import User from '../models/userModel';
import StudentBearer from '../models/studentBearerModel';

const JWT_SECRET = process.env.JWT_SECRET || 'stellar-minimalist-secret-key-2026';

const runTests = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) throw new Error('MONGO_URI is missing');

    await mongoose.connect(mongoUri);
    console.log('[Test] Connected to MongoDB');

    // Find or create a test normal Admin
    let normalAdmin = await User.findOne({ email: 'test.admin@codecircle.com' });
    if (!normalAdmin) {
      normalAdmin = await User.create({
        name: 'Test Normal Admin',
        email: 'test.admin@codecircle.com',
        rollNo: 'ADMIN_TEST_01',
        password: 'Password123!',
        role: 'Admin',
        department: 'CS',
      });
    } else {
      normalAdmin.role = 'Admin';
      await normalAdmin.save();
    }

    // Find or create a test SuperAdmin
    let superAdmin = await User.findOne({ email: 'superadmin@codecircle.com' });
    if (!superAdmin) {
      superAdmin = await User.create({
        name: 'Test Super Admin',
        email: 'superadmin@codecircle.com',
        rollNo: 'SUPERADMIN01',
        password: 'SuperAdmin@2026!',
        role: 'SuperAdmin',
        department: 'Architecture',
      });
    } else {
      superAdmin.role = 'SuperAdmin';
      await superAdmin.save();
    }

    const adminToken = jwt.sign({ id: normalAdmin._id }, JWT_SECRET, { expiresIn: '1h' });
    const superAdminToken = jwt.sign({ id: superAdmin._id }, JWT_SECRET, { expiresIn: '1h' });

    console.log('[Test] Generated test JWTs for Admin and SuperAdmin');

    const baseUrl = 'http://localhost:5000/api/bearers';

    // 1. GET /api/bearers (Public)
    console.log('\n--- 1. Testing Public GET /api/bearers ---');
    const getRes = await fetch(baseUrl);
    console.log('Status:', getRes.status, '(Expected 200)');
    const getJson: any = await getRes.json();
    console.log(`Bearers count: ${getJson.length}`);
    if (getRes.status !== 200) throw new Error('Public GET failed');

    // 2. POST /api/bearers with Normal Admin Token (Should receive 403 Forbidden)
    console.log('\n--- 2. Testing Normal Admin POST /api/bearers (Should be 403) ---');
    const adminPostRes = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: 'Test Unauthorized Bearer',
        position: 'Test Role',
        photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb',
        bio: 'This should fail with 403 Forbidden.',
      }),
    });
    console.log('Status:', adminPostRes.status, '(Expected 403)');
    const adminPostJson = await adminPostRes.json();
    console.log('Response:', adminPostJson);
    if (adminPostRes.status !== 403) {
      throw new Error(`Expected 403 Forbidden for Admin, got ${adminPostRes.status}`);
    }

    // 3. POST /api/bearers with SuperAdmin Token (Should be 201 Created)
    console.log('\n--- 3. Testing SuperAdmin POST /api/bearers (Should be 201) ---');
    const superPostRes = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superAdminToken}`,
      },
      body: JSON.stringify({
        name: 'SuperAdmin Created Bearer',
        position: 'Innovation Lead',
        photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800',
        linkedinUrl: 'https://linkedin.com/in/test-innovation-lead',
        bio: 'Leading new campus engineering tracks and open source development.',
      }),
    });
    console.log('Status:', superPostRes.status, '(Expected 201)');
    const superPostJson: any = await superPostRes.json();
    console.log('Created Bearer ID:', superPostJson._id);
    if (superPostRes.status !== 201) {
      throw new Error(`Expected 201 Created for SuperAdmin, got ${superPostRes.status}`);
    }

    const createdId = superPostJson._id;

    // 4. PUT /api/bearers/:id with Normal Admin (Should be 403)
    console.log('\n--- 4. Testing Normal Admin PUT /api/bearers/:id (Should be 403) ---');
    const adminPutRes = await fetch(`${baseUrl}/${createdId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ position: 'Hacked Position' }),
    });
    console.log('Status:', adminPutRes.status, '(Expected 403)');
    if (adminPutRes.status !== 403) {
      throw new Error(`Expected 403 Forbidden for Admin PUT, got ${adminPutRes.status}`);
    }

    // 5. PUT /api/bearers/:id with SuperAdmin (Should be 200)
    console.log('\n--- 5. Testing SuperAdmin PUT /api/bearers/:id (Should be 200) ---');
    const superPutRes = await fetch(`${baseUrl}/${createdId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superAdminToken}`,
      },
      body: JSON.stringify({
        position: 'Chief Innovation Officer',
        bio: 'Updated bio by SuperAdmin under 120 characters.',
      }),
    });
    console.log('Status:', superPutRes.status, '(Expected 200)');
    const superPutJson: any = await superPutRes.json();
    console.log('Updated Position:', superPutJson.position);
    if (superPutRes.status !== 200 || superPutJson.position !== 'Chief Innovation Officer') {
      throw new Error('SuperAdmin PUT failed');
    }

    // 6. DELETE /api/bearers/:id with Normal Admin (Should be 403)
    console.log('\n--- 6. Testing Normal Admin DELETE /api/bearers/:id (Should be 403) ---');
    const adminDelRes = await fetch(`${baseUrl}/${createdId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    console.log('Status:', adminDelRes.status, '(Expected 403)');
    if (adminDelRes.status !== 403) {
      throw new Error(`Expected 403 Forbidden for Admin DELETE, got ${adminDelRes.status}`);
    }

    // 7. DELETE /api/bearers/:id with SuperAdmin (Should be 200)
    console.log('\n--- 7. Testing SuperAdmin DELETE /api/bearers/:id (Should be 200) ---');
    const superDelRes = await fetch(`${baseUrl}/${createdId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${superAdminToken}` },
    });
    console.log('Status:', superDelRes.status, '(Expected 200)');
    const superDelJson = await superDelRes.json();
    console.log('Delete response:', superDelJson);
    if (superDelRes.status !== 200) {
      throw new Error('SuperAdmin DELETE failed');
    }

    console.log('\n🎉 ALL RBAC AND CRUD TESTS PASSED SUCCESSFULLY! 🎉\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('[Test Failed]', err);
    process.exit(1);
  }
};

runTests();
