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

async function runCourseAccessTests() {
  console.log('========================================================================');
  console.log(' RUNNING COURSE VISIBILITY & SELECTIVE STUDENT ACCESS TESTS');
  console.log('========================================================================\n');

  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/code-circle';
  await mongoose.connect(mongoUri);

  const UserModel = mongoose.model('User');
  const DomainModel = mongoose.model('Domain');
  const CourseConfigModel = mongoose.model('CourseConfig');

  // 1. Setup Student A (will be granted access)
  let studentA = await UserModel.findOne({ email: 'student-a-access@codecircle.edu' });
  if (!studentA) {
    studentA = await UserModel.create({
      name: 'Alice Cooper',
      email: 'student-a-access@codecircle.edu',
      password: 'TestPassword@123',
      rollNo: `STUA${Math.floor(Math.random() * 90000 + 10000)}`,
      role: 'Student',
      department: 'CSE',
      isBlocked: false,
    });
  }

  // 2. Setup Student B (will NOT be granted access initially)
  let studentB = await UserModel.findOne({ email: 'student-b-blocked@codecircle.edu' });
  if (!studentB) {
    studentB = await UserModel.create({
      name: 'Bob Marley',
      email: 'student-b-blocked@codecircle.edu',
      password: 'TestPassword@123',
      rollNo: `STUB${Math.floor(Math.random() * 90000 + 10000)}`,
      role: 'Student',
      department: 'ECE',
      isBlocked: false,
    });
  }

  // 3. Setup SuperAdmin User
  let superAdmin = await UserModel.findOne({ email: 'superadmin-test@codecircle.edu' });
  if (!superAdmin) {
    superAdmin = await UserModel.create({
      name: 'Dr. SuperAdmin',
      email: 'superadmin-test@codecircle.edu',
      password: 'TestPassword@123',
      rollNo: `SUPA${Math.floor(Math.random() * 90000 + 10000)}`,
      role: 'SuperAdmin',
      department: 'CSE',
      isBlocked: false,
    });
  }

  // 4. Setup Standard Admin (to test privilege restriction)
  let standardAdmin = await UserModel.findOne({ email: 'admin-standard-test@codecircle.edu' });
  if (!standardAdmin) {
    standardAdmin = await UserModel.create({
      name: 'Standard Admin',
      email: 'admin-standard-test@codecircle.edu',
      password: 'TestPassword@123',
      rollNo: `STAD${Math.floor(Math.random() * 90000 + 10000)}`,
      role: 'Admin',
      department: 'CSE',
      isBlocked: false,
    });
  }

  // Ensure test course exists
  let testCourse = await DomainModel.findOne({ name: 'Access Control Test Course' });
  if (!testCourse) {
    testCourse = await DomainModel.create({
      name: 'Access Control Test Course',
      description: 'Course testing coming soon & selective student access',
      coverImageUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80',
      isLocked: false,
    });
  }

  // Tokens
  const tokenA = jwt.sign({ id: studentA._id.toString(), email: studentA.email, role: 'Student' }, JWT_SECRET, { expiresIn: '1h' });
  const tokenB = jwt.sign({ id: studentB._id.toString(), email: studentB.email, role: 'Student' }, JWT_SECRET, { expiresIn: '1h' });
  const tokenSuperAdmin = jwt.sign({ id: superAdmin._id.toString(), email: superAdmin.email, role: 'SuperAdmin' }, JWT_SECRET, { expiresIn: '1h' });
  const tokenStandardAdmin = jwt.sign({ id: standardAdmin._id.toString(), email: standardAdmin.email, role: 'Admin' }, JWT_SECRET, { expiresIn: '1h' });

  const headersA = { Authorization: `Bearer ${tokenA}` };
  const headersB = { Authorization: `Bearer ${tokenB}` };
  const headersSuperAdmin = { Authorization: `Bearer ${tokenSuperAdmin}` };
  const headersStandardAdmin = { Authorization: `Bearer ${tokenStandardAdmin}` };

  // --- Step 1: Standard Admin cannot modify visibility (SuperAdmin Only) ---
  console.log('--- Step 1: Standard Admin cannot toggle visibility (SuperAdmin only) ---');
  let standardAdminBlocked = false;
  try {
    await axios.patch(`${API_BASE}/courses/config/visibility`, { coursesVisibleToAll: false }, { headers: headersStandardAdmin });
  } catch (err: any) {
    if (err.response?.status === 403) standardAdminBlocked = true;
  }
  assert(standardAdminBlocked, 'Standard Admin is forbidden (403) from toggling course visibility');

  // --- Step 2: SuperAdmin sets Courses to "Coming Soon" (coursesVisibleToAll: false) ---
  console.log('\n--- Step 2: SuperAdmin sets Courses to Coming Soon mode ---');
  const setComingSoonRes = await axios.patch(
    `${API_BASE}/courses/config/visibility`,
    { coursesVisibleToAll: false },
    { headers: headersSuperAdmin }
  );
  assert(setComingSoonRes.status === 200, 'Visibility updated successfully');
  assert(setComingSoonRes.data.data.coursesVisibleToAll === false, 'coursesVisibleToAll is false');

  // Reset allowed students to empty for clean testing
  await axios.post(`${API_BASE}/courses/config/batch-allow`, { action: 'revoke_all' }, { headers: headersSuperAdmin });

  // --- Step 3: Unapproved Students (Student A and B) see "Coming Soon" ---
  console.log('\n--- Step 3: Unapproved Students see Coming Soon ---');
  const getCoursesB = await axios.get(`${API_BASE}/courses`, { headers: headersB });
  assert(getCoursesB.data.isComingSoon === true, 'Student B response flags isComingSoon: true');
  assert(getCoursesB.data.hasAccess === false, 'Student B response flags hasAccess: false');
  assert(getCoursesB.data.data.length === 0, 'Student B receives empty courses array during Coming Soon');

  // Student B attempts to get levels for course
  let getLevelsBlocked = false;
  try {
    await axios.get(`${API_BASE}/courses/${testCourse._id}/levels`, { headers: headersB });
  } catch (err: any) {
    if (err.response?.status === 403 && err.response?.data?.isComingSoon === true) {
      getLevelsBlocked = true;
    }
  }
  assert(getLevelsBlocked, 'Student B is blocked (403) from fetching course levels during Coming Soon');

  // --- Step 4: SuperAdmin selectively allows Student A ---
  console.log('\n--- Step 4: SuperAdmin selectively allows Student A to access courses ---');
  const allowStudentARes = await axios.post(
    `${API_BASE}/courses/config/allow-student`,
    { studentId: studentA._id.toString(), allow: true },
    { headers: headersSuperAdmin }
  );
  assert(allowStudentARes.status === 200, 'SuperAdmin granted access to Student A');
  assert(allowStudentARes.data.data.isAllowed === true, 'Response confirms Student A isAllowed: true');

  // SuperAdmin checks students access directory
  const studentsDirRes = await axios.get(`${API_BASE}/courses/config/students?search=Alice`, { headers: headersSuperAdmin });
  assert(studentsDirRes.status === 200, 'SuperAdmin can fetch student access directory');
  const aliceEntry = studentsDirRes.data.data.students.find((s: any) => s._id === studentA._id.toString());
  assert(aliceEntry?.isAllowed === true, 'Directory confirms Alice is marked isAllowed: true');

  // --- Step 5: Student A now has Full Early Access, while Student B is still blocked ---
  console.log('\n--- Step 5: Verify Student A has early access while Student B remains blocked ---');
  const getCoursesA = await axios.get(`${API_BASE}/courses`, { headers: headersA });
  assert(getCoursesA.data.isComingSoon === false, 'Student A isComingSoon: false');
  assert(getCoursesA.data.hasAccess === true, 'Student A hasAccess: true');
  assert(getCoursesA.data.isEarlyAccess === true, 'Student A flagged isEarlyAccess: true');
  assert(getCoursesA.data.data.length > 0, 'Student A can view full course list');

  const getCoursesB2 = await axios.get(`${API_BASE}/courses`, { headers: headersB });
  assert(getCoursesB2.data.isComingSoon === true, 'Student B is STILL in Coming Soon mode');
  assert(getCoursesB2.data.hasAccess === false, 'Student B still has no access');

  // Student A can view levels
  const getLevelsA = await axios.get(`${API_BASE}/courses/${testCourse._id}/levels`, { headers: headersA });
  assert(getLevelsA.status === 200, 'Student A can fetch course levels with early access clearance');

  // --- Step 6: SuperAdmin toggles "Show Courses" (public for everyone) ---
  console.log('\n--- Step 6: SuperAdmin clicks "Show Courses" (public for all students) ---');
  const makePublicRes = await axios.patch(
    `${API_BASE}/courses/config/visibility`,
    { coursesVisibleToAll: true },
    { headers: headersSuperAdmin }
  );
  assert(makePublicRes.status === 200, 'Visibility updated to public');
  assert(makePublicRes.data.data.coursesVisibleToAll === true, 'coursesVisibleToAll is now true');

  // Now Student B also gets full access
  const getCoursesB3 = await axios.get(`${API_BASE}/courses`, { headers: headersB });
  assert(getCoursesB3.data.isComingSoon === false, 'Student B now sees courses');
  assert(getCoursesB3.data.hasAccess === true, 'Student B now has access');
  assert(getCoursesB3.data.data.length > 0, 'Student B now receives course list');

  console.log('\n========================================================================');
  console.log(' ALL COURSE ACCESS & SELECTIVE STUDENT PERMISSION TESTS PASSED 100%!');
  console.log('========================================================================\n');

  await mongoose.disconnect();
}

runCourseAccessTests().catch((err) => {
  console.error('Test execution error:', err.response?.data || err.message);
  process.exit(1);
});
