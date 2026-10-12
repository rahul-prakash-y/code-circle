import axios from 'axios';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import '../models/userModel';
import '../models/domainModel';
import '../models/levelModel';
import '../models/studentProgressModel';
import '../models/domainEnrollmentModel';
import '../models/courseConfigModel';

const API_BASE = 'http://localhost:5000/api';
const JWT_SECRET = process.env.JWT_SECRET || 'stellar-minimalist-secret-key-2026';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ PASSED: ${message}`);
  }
}

async function runTests() {
  console.log('========================================================================');
  console.log(' RUNNING COURSE REGISTRATION & ADMIN STUDENT ROSTER INTEGRATION TESTS');
  console.log('========================================================================\n');

  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/code-circle';
  await mongoose.connect(mongoUri);

  const UserModel = mongoose.model('User');
  const DomainModel = mongoose.model('Domain');
  const LevelModel = mongoose.model('Level');
  const StudentProgressModel = mongoose.model('StudentProgress');
  const DomainEnrollmentModel = mongoose.model('DomainEnrollment');
  const CourseConfigModel = mongoose.model('CourseConfig');

  // Ensure courses are publicly visible for registration test
  await CourseConfigModel.updateOne({}, { $set: { coursesVisibleToAll: true } }, { upsert: true });

  // 1. Setup Student User
  let studentUser = await UserModel.findOne({ role: 'Student', email: 'course-enroll-test@codecircle.edu' });
  if (!studentUser) {
    studentUser = await UserModel.create({
      name: 'Rohan Sharma',
      email: 'course-enroll-test@codecircle.edu',
      password: 'TestPassword@123',
      rollNo: `ROH${Math.floor(Math.random() * 90000 + 10000)}`,
      role: 'Student',
      department: 'CSE',
      year: '3',
      college: 'BIT',
      isBlocked: false,
    });
  }

  // 2. Setup Admin User
  let adminUser = await UserModel.findOne({ role: 'Admin', email: 'course-admin-test@codecircle.edu' });
  if (!adminUser) {
    adminUser = await UserModel.create({
      name: 'Prof. Admin',
      email: 'course-admin-test@codecircle.edu',
      password: 'TestPassword@123',
      rollNo: `ADM${Math.floor(Math.random() * 90000 + 10000)}`,
      role: 'Admin',
      department: 'CSE',
      isBlocked: false,
    });
  }

  // Tokens
  const studentToken = jwt.sign(
    { id: studentUser._id.toString(), email: studentUser.email, role: 'Student' },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
  const adminToken = jwt.sign(
    { id: adminUser._id.toString(), email: adminUser.email, role: 'Admin' },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  const studentHeaders = { Authorization: `Bearer ${studentToken}` };
  const adminHeaders = { Authorization: `Bearer ${adminToken}` };

  // 3. Create isolated Test Course
  const courseTitle = `Automated Testing Course ${Date.now()}`;
  const testCourse = await DomainModel.create({
    name: courseTitle,
    description: 'An advanced curriculum to test student course registration and admin student listings.',
    coverImageUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80',
    isLocked: false,
  });

  const level1 = await LevelModel.create({
    domainId: testCourse._id,
    levelNumber: 1,
    title: 'Curriculum Foundations',
    youtubeVideoId: 'aircAruvnKk',
    questQuestions: [
      { question: 'What is 10 + 10?', options: ['20', '30'], correctOption: 0 },
      { question: 'What is 5 * 5?', options: ['20', '25'], correctOption: 1 },
    ],
  });

  // Clear student progress and enrollments for clean state
  await StudentProgressModel.deleteOne({ userId: studentUser._id });
  await DomainEnrollmentModel.deleteMany({ domainId: testCourse._id });

  try {
    // Test 1: Fetch Courses via /api/courses (alias) and /api/domains
    console.log('--- Test 1: GET /api/courses and /api/domains ---');
    const coursesRes = await axios.get(`${API_BASE}/courses`, { headers: studentHeaders });
    assert(coursesRes.status === 200, '/api/courses returns 200');
    const targetCourse = coursesRes.data.data.find((c: any) => c._id === testCourse._id.toString());
    assert(Boolean(targetCourse), 'Newly created course found in /api/courses response');
    assert(targetCourse.enrolledStudentsCount === 0, 'Initial enrolledStudentsCount is 0');
    assert(targetCourse.isEnrolled === false, 'Student is initially not enrolled (isEnrolled: false)');

    // Test 2: Unenrolled access restrictions
    console.log('\n--- Test 2: Verify Levels Locked Before Registration ---');
    const levelsRes = await axios.get(`${API_BASE}/courses/${testCourse._id}/levels`, { headers: studentHeaders });
    assert(levelsRes.data.data.domain.isEnrolled === false, 'Course data reflects isEnrolled: false');
    assert(levelsRes.data.data.levels[0].requiresRegistration === true, 'Level 1 indicates requiresRegistration: true');
    assert(levelsRes.data.data.levels[0].isUnlocked === false, 'Level 1 is locked before registration');

    // Test 3: Quest submission blocked before registration
    console.log('\n--- Test 3: Attempt Quest Submission Before Registering ---');
    try {
      await axios.post(
        `${API_BASE}/levels/${level1._id}/submit-quest`,
        { answers: [0, 1] },
        { headers: studentHeaders }
      );
      assert(false, 'Should have failed with 403');
    } catch (err: any) {
      assert(err.response?.status === 403, 'Submit quest without registration returns 403 Forbidden');
      assert(err.response?.data?.requiresRegistration === true, 'Error response includes requiresRegistration: true');
    }

    // Test 4: Student registers for the course
    console.log('\n--- Test 4: POST /api/courses/:id/register ---');
    const regRes = await axios.post(`${API_BASE}/courses/${testCourse._id}/register`, {}, { headers: studentHeaders });
    assert(regRes.status === 201, 'Registration returns 201 Created');
    assert(regRes.data.success === true, 'Registration reports success: true');
    assert(regRes.data.data.status === 'enrolled', 'Enrollment status is initially "enrolled"');

    // Test 5: Duplicate registration prevention (Idempotency)
    console.log('\n--- Test 5: Prevent Duplicate Registrations ---');
    const dupRes = await axios.post(`${API_BASE}/courses/${testCourse._id}/register`, {}, { headers: studentHeaders });
    assert(dupRes.status === 200, 'Duplicate registration returns 200 OK');
    assert(dupRes.data.message === 'Already registered for this course', 'Duplicate message handled gracefully');

    // Test 6: Verify Course Levels unlocked after registration
    console.log('\n--- Test 6: Check Levels After Registration ---');
    const postRegLevels = await axios.get(`${API_BASE}/courses/${testCourse._id}/levels`, { headers: studentHeaders });
    assert(postRegLevels.data.data.domain.isEnrolled === true, 'Course data reflects isEnrolled: true');
    assert(postRegLevels.data.data.domain.enrolledStudentsCount === 1, 'Course reflects enrolledStudentsCount: 1');
    assert(postRegLevels.data.data.levels[0].isUnlocked === true, 'Level 1 is unlocked after registration');
    assert(postRegLevels.data.data.levels[0].requiresRegistration === false, 'Level 1 requiresRegistration: false');

    // Test 7: Student completes quest -> updates progress and enrollment status
    console.log('\n--- Test 7: Submit Passing Quest Answers ---');
    const passSubmitRes = await axios.post(
      `${API_BASE}/levels/${level1._id}/submit-quest`,
      { answers: [0, 1] },
      { headers: studentHeaders }
    );
    assert(passSubmitRes.data.data.passed === true, 'Quest submitted successfully and passed 100%');

    // Verify enrollment status updated in database
    const updatedEnrollment = await DomainEnrollmentModel.findOne({
      userId: studentUser._id,
      domainId: testCourse._id,
    });
    assert(updatedEnrollment?.status === 'completed', 'Course enrollment status updated to "completed"');

    // Test 8: Non-Admin attempts to access student roster -> 403 Forbidden
    console.log('\n--- Test 8: Student Access to Admin Roster is Blocked ---');
    try {
      await axios.get(`${API_BASE}/courses/${testCourse._id}/students`, { headers: studentHeaders });
      assert(false, 'Student should not be able to access /students endpoint');
    } catch (err: any) {
      assert(err.response?.status === 403, 'Accessing student roster as student returns 403 Forbidden');
    }

    // Test 9: Admin accesses student roster
    console.log('\n--- Test 9: Admin GET /api/courses/:id/students ---');
    const rosterRes = await axios.get(`${API_BASE}/courses/${testCourse._id}/students`, { headers: adminHeaders });
    assert(rosterRes.status === 200, 'Admin request returns 200 OK');
    assert(rosterRes.data.success === true, 'Response indicates success: true');
    assert(rosterRes.data.data.totalStudents === 1, 'Total enrolled students count is 1');
    assert(Array.isArray(rosterRes.data.data.students), 'Students is an array');

    const enrolledItem = rosterRes.data.data.students[0];
    assert(enrolledItem.user.name === 'Rohan Sharma', 'Student name matches enrolled student');
    assert(enrolledItem.user.rollNo === studentUser.rollNo, 'Student rollNo matches enrolled student');
    assert(enrolledItem.user.email === studentUser.email, 'Student email matches enrolled student');
    assert(enrolledItem.user.department === 'CSE', 'Student department matches');
    assert(Boolean(enrolledItem.enrolledAt), 'Enrolled timestamp is present');
    assert(enrolledItem.progressPercentage === 100, 'Student progress is 100%');
    assert(enrolledItem.status === 'completed', 'Student status is "completed"');
    console.log(`Registered student found: ${enrolledItem.user.name} (${enrolledItem.user.rollNo}), Progress: ${enrolledItem.progressPercentage}%`);

    // Test 10: Search filter in admin roster
    console.log('\n--- Test 10: Search Filter in Admin Roster ---');
    const searchMatch = await axios.get(`${API_BASE}/courses/${testCourse._id}/students?search=Rohan`, {
      headers: adminHeaders,
    });
    assert(searchMatch.data.data.students.length === 1, 'Search for "Rohan" returns 1 student');

    const searchNoMatch = await axios.get(`${API_BASE}/courses/${testCourse._id}/students?search=NonExistentUser`, {
      headers: adminHeaders,
    });
    assert(searchNoMatch.data.data.students.length === 0, 'Search for non-existent student returns 0');

    console.log('\n========================================================================');
    console.log(' ALL COURSE REGISTRATION & ADMIN ROSTER INTEGRATION TESTS PASSED 100%!');
    console.log('========================================================================');
  } finally {
    // Cleanup test data
    await LevelModel.deleteMany({ domainId: testCourse._id });
    await DomainModel.deleteOne({ _id: testCourse._id });
    await DomainEnrollmentModel.deleteMany({ domainId: testCourse._id });
    await StudentProgressModel.deleteOne({ userId: studentUser._id });
    await mongoose.disconnect();
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
