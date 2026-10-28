// @ts-ignore
const PDFDocument = require('pdfkit');
import mongoose from 'mongoose';
import User from '../models/userModel';
import { getDashboardMetrics } from './metricsService';

const getEventModel = () => {
  const mod: any = mongoose.models.Event || require('../models/eventModel');
  return mod.default || mod;
};
const getAttendanceRecordModel = () => {
  if (!mongoose.models.AttendanceSession) {
    require('../models/attendanceSessionModel');
  }
  const mod: any = mongoose.models.AttendanceRecord || require('../models/attendanceRecordModel');
  return mod.default || mod;
};

// Helper to escape CSV values safely
const escapeCsvCell = (val: any): string => {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
};

/**
 * Format CSV rows given an array of headers and array of string arrays
 */
const buildCsv = (headers: string[], rows: (string | number)[][]): string => {
  const headerLine = headers.map(escapeCsvCell).join(',');
  const rowLines = rows.map((row) => row.map(escapeCsvCell).join(','));
  return [headerLine, ...rowLines].join('\r\n');
};

// Helper to derive year label from prefix number (2-digit or 4-digit)
// Rule: starts with 2023 / 23 -> 4th Year, 2024 / 24 -> 3rd Year, 2025 / 25 -> 2nd Year, 2026+ / 26+ -> 1st Year
const deriveYearFromPrefix = (prefixNum: number): string => {
  const y = prefixNum < 100 ? 2000 + prefixNum : prefixNum;
  if (y <= 2023) return '4th Year';
  if (y === 2024) return '3rd Year';
  if (y === 2025) return '2nd Year';
  if (y >= 2026) return '1st Year';
  return '1st Year';
};

// Helper to derive student year accurately
const deriveStudentYear = (user: any): string => {
  if (!user) return '1st Year';

  const roll = String(user.rollNo || '').toUpperCase().trim();
  const email = String(user.email || '').toLowerCase().trim();

  // 1. 4-digit Year Prefix (e.g. 2023..., 2026..., 2026UAD1021, 2023CS101)
  const fourDigitMatch = roll.match(/^(20\d{2})/);
  if (fourDigitMatch) {
    return deriveYearFromPrefix(parseInt(fourDigitMatch[1], 10));
  }

  // 2. Anna University register format: 7376YY... (e.g. 7376231CS272 -> 23 -> 4th Year, 7376261CS101 -> 26 -> 1st Year)
  const auMatch = roll.match(/^7376(\d{2})/);
  if (auMatch) {
    return deriveYearFromPrefix(parseInt(auMatch[1], 10));
  }

  // 3. 2-digit roll format: e.g. 23CS012 -> 4th Year, 241CS222 -> 3rd Year, 26AD105 -> 1st Year
  const twoDigitRollMatch = roll.match(/^(\d{2})/);
  if (twoDigitRollMatch) {
    const val = parseInt(twoDigitRollMatch[1], 10);
    if (val >= 18 && val <= 30) {
      return deriveYearFromPrefix(val);
    }
  }

  // 4. Institutional email format: .ad26@bitsathy.ac.in (26 -> 1st Year) or .cs23@bitsathy.ac.in (23 -> 4th Year)
  const emailMatch = email.match(/([a-z]+)(\d{2})@bitsathy\.ac\.in/);
  if (emailMatch) {
    return deriveYearFromPrefix(parseInt(emailMatch[2], 10));
  }

  // 5. Fallback to explicitly stored user.year if roll/email didn't match
  if (user.year) {
    const yStr = String(user.year).trim();
    if (/^[1-4]$/.test(yStr)) {
      const map: Record<string, string> = { '1': '1st Year', '2': '2nd Year', '3': '3rd Year', '4': '4th Year' };
      return map[yStr] || `${yStr} Year`;
    }
    if (yStr.toLowerCase().includes('year')) return yStr;
    return `${yStr} Year`;
  }

  return '1st Year';
};

const DEPT_MAP: Record<string, string> = {
  UCS: 'CSE',
  UIT: 'IT',
  UAD: 'AIDS',
  UAL: 'AIML',
  UEC: 'ECE',
  UEI: 'EIE',
  UEE: 'EEE',
  UCE: 'CIVIL',
  UME: 'MECH',
  UBT: 'BIOTECH',
  UFT: 'FOOD TECH',

  CS: 'CSE',
  IT: 'IT',
  AD: 'AIDS',
  AL: 'AIML',
  EC: 'ECE',
  EI: 'EIE',
  EE: 'EEE',
  CE: 'CIVIL',
  ME: 'MECH',
  BT: 'BIOTECH',
  FT: 'FOOD TECH',
};

const deriveStudentDepartment = (user: any): string => {
  if (!user) return 'CSE';

  const roll = String(user.rollNo || '').toUpperCase().trim();
  const email = String(user.email || '').toLowerCase().trim();

  // 1. BIT Roll format with 3-letter UG code: e.g. 2026UAD1214 -> AIDS, 2026UCS1001 -> CSE
  const bitMatch = roll.match(/(U[A-Z]{2})/);
  if (bitMatch && DEPT_MAP[bitMatch[1]]) {
    return DEPT_MAP[bitMatch[1]];
  }

  // 2. Anna University format: 7376YY(D)XX... e.g. 7376231CS272 -> CS -> CSE
  const auMatch = roll.match(/7376\d{2,3}([A-Z]{2})/);
  if (auMatch && DEPT_MAP[auMatch[1]]) {
    return DEPT_MAP[auMatch[1]];
  }

  // 3. 2-digit roll format: e.g. 23CS012, 241CS222, 26AD105
  const rollCodeMatch = roll.match(/^\d{2,3}([A-Z]{2})/);
  if (rollCodeMatch && DEPT_MAP[rollCodeMatch[1]]) {
    return DEPT_MAP[rollCodeMatch[1]];
  }

  // 4. Institutional email: e.g. name.ad26@bitsathy.ac.in, bhavana.cs22@bitsathy.ac.in
  const emailMatch = email.match(/\.([a-z]{2,3})\d{2}@bitsathy\.ac\.in/);
  if (emailMatch) {
    const code = emailMatch[1].toUpperCase();
    if (DEPT_MAP[code]) return DEPT_MAP[code];
  }

  // 5. Normalization of existing user.department string
  if (user.department) {
    const d = String(user.department).toUpperCase().trim();
    if (DEPT_MAP[d]) return DEPT_MAP[d];
    if (d.includes('COMPUTER') || d === 'CSE') return 'CSE';
    if (d.includes('INFORMATION') || d === 'IT') return 'IT';
    if (d.includes('DATA SCIENCE') || d.includes('AIDS') || d.includes('AI & DS') || d.includes('AI&DS')) return 'AIDS';
    if (d.includes('MACHINE LEARNING') || d.includes('AIML')) return 'AIML';
    if (d.includes('COMMUNICATION') || d === 'ECE') return 'ECE';
    if (d.includes('INSTRUMENTATION') || d === 'EIE') return 'EIE';
    if (d.includes('ELECTRICAL') || d === 'EEE') return 'EEE';
    if (d.includes('CIVIL') || d === 'UCE') return 'CIVIL';
    if (d.includes('MECH') || d === 'UME') return 'MECH';
    if (d.includes('BIOTECH') || d === 'UBT') return 'BIOTECH';
    if (d.includes('FOOD') || d === 'UFT') return 'FOOD TECH';
    return String(user.department).trim();
  }

  return 'CSE';
};

export type ReportType = 'users' | 'events' | 'attendance' | 'summary';

/**
 * Generates CSV content for the requested report type
 */
export const generateCsvReport = async (type: ReportType): Promise<{ data: string; filename: string }> => {
  const timestamp = new Date().toISOString().slice(0, 10);

  if (type === 'users') {
    const users = await User.find({}).sort({ createdAt: -1 }).lean();
    const headers = ['Name', 'Roll Number', 'College', 'Year', 'Email', 'Role', 'Department', 'Blocked', 'Created Date'];
    const rows = users.map((u: any) => [
      u.name,
      u.rollNo,
      u.college || 'BIT',
      deriveStudentYear(u),
      u.email,
      u.role,
      deriveStudentDepartment(u),
      u.isBlocked ? 'Yes' : 'No',
      u.createdAt ? new Date(u.createdAt).toISOString() : 'N/A',
    ]);
    return {
      data: buildCsv(headers, rows),
      filename: `codecircle-users-report-${timestamp}.csv`,
    };
  }

  if (type === 'events') {
    const Event = getEventModel();
    const events = await Event.find({}).sort({ date: -1 }).lean();
    const headers = ['Event Title', 'Date', 'Type', 'Venue / Link', 'Max Participants', 'Created Date'];
    const rows = events.map((e: any) => [
      e.title,
      e.date ? new Date(e.date).toISOString() : 'N/A',
      e.type,
      e.venueOrLink,
      e.maxParticipants || 'Unlimited',
      e.createdAt ? new Date(e.createdAt).toISOString() : 'N/A',
    ]);
    return {
      data: buildCsv(headers, rows),
      filename: `codecircle-events-report-${timestamp}.csv`,
    };
  }

  if (type === 'attendance') {
    const AttendanceRecord = getAttendanceRecordModel();
    const records = await AttendanceRecord.find({})
      .populate('session')
      .populate('user', 'name rollNo department email college year')
      .sort({ createdAt: -1 })
      .lean();

    const headers = ['Session Name', 'Student Name', 'Roll Number', 'College', 'Year', 'Department', 'Email', 'Marked At'];
    const rows = records.map((rec: any) => [
      rec.session?.sessionName || 'Session',
      rec.user?.name || 'Unknown',
      rec.user?.rollNo || 'N/A',
      rec.user?.college || 'BIT',
      deriveStudentYear(rec.user),
      deriveStudentDepartment(rec.user),
      rec.user?.email || 'N/A',
      rec.timestamp ? new Date(rec.timestamp).toISOString() : 'N/A',
    ]);
    return {
      data: buildCsv(headers, rows),
      filename: `codecircle-attendance-report-${timestamp}.csv`,
    };
  }

  // Default: Summary metrics report
  const { metrics } = await getDashboardMetrics({ refresh: true });
  const headers = ['Metric Description', 'Metric Value', 'Report Date'];
  const rows = [
    ['Total Registered Users', metrics.totalUsers, timestamp],
    ['Active Events (Current/Upcoming)', metrics.activeEvents, timestamp],
    ['Total Events (Lifetime)', metrics.totalEvents, timestamp],
    ['Total Assessment Levels Available', metrics.totalAssessmentLevels, timestamp],
    ['Active Students / Members', metrics.details?.activeStudents || 0, timestamp],
    ['Faculty & Mentors', metrics.details?.facultyCount || 0, timestamp],
    ['Quizzes Available', metrics.details?.quizzesAvailable || 0, timestamp],
  ];

  return {
    data: buildCsv(headers, rows),
    filename: `codecircle-summary-metrics-${timestamp}.csv`,
  };
};

/**
 * Generates modern styled PDF Buffer for the requested report type using pdfkit
 */
export const generatePdfReport = async (type: ReportType): Promise<{ buffer: Buffer; filename: string }> => {
  const timestamp = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({
        margin: 40,
        size: 'A4',
        info: {
          Title: `Code Circle - ${type.toUpperCase()} Report`,
          Author: 'Code Circle Platform',
        },
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk: any) => chunks.push(chunk));
      doc.on('end', () => {
        resolve({
          buffer: Buffer.concat(chunks),
          filename: `codecircle-${type}-report-${new Date().toISOString().slice(0, 10)}.pdf`,
        });
      });

      // --- Header / Brand Banner ---
      doc.rect(0, 0, doc.page.width, 100).fill('#05070f');

      // Accent top line
      doc.rect(0, 0, doc.page.width, 4).fill('#3b82f6');

      doc.fillColor('#ffffff')
        .font('Helvetica-Bold')
        .fontSize(22)
        .text('CODE CIRCLE', 40, 30);

      doc.fontSize(10)
        .font('Helvetica')
        .fillColor('#94a3b8')
        .text('ADVANCED CODING & TECHNICAL CLUB INTELLIGENCE REPORT', 40, 56);

      doc.fontSize(10)
        .fillColor('#60a5fa')
        .text(`Report: ${type.toUpperCase()}`, doc.page.width - 180, 34, { align: 'right' });

      doc.fontSize(8)
        .fillColor('#94a3b8')
        .text(`Generated on: ${timestamp}`, doc.page.width - 180, 50, { align: 'right' });

      doc.moveDown(5);

      // --- Summary Section ---
      const { metrics } = await getDashboardMetrics();

      doc.rect(40, 115, doc.page.width - 80, 60).fill('#0f172a');
      doc.rect(40, 115, doc.page.width - 80, 60).strokeColor('#1e293b').lineWidth(1).stroke();

      const colWidth = (doc.page.width - 80) / 4;
      const metricBoxes = [
        { label: 'TOTAL USERS', val: String(metrics.totalUsers), col: '#3b82f6' },
        { label: 'ACTIVE EVENTS', val: String(metrics.activeEvents), col: '#a855f7' },
        { label: 'TOTAL EVENTS', val: String(metrics.totalEvents), col: '#ec4899' },
        { label: 'ASSESSMENT LEVELS', val: String(metrics.totalAssessmentLevels), col: '#10b981' },
      ];

      metricBoxes.forEach((m, idx) => {
        const xPos = 40 + idx * colWidth;
        doc.fontSize(7)
          .font('Helvetica-Bold')
          .fillColor('#94a3b8')
          .text(m.label, xPos + 10, 125);

        doc.fontSize(16)
          .font('Helvetica-Bold')
          .fillColor(m.col)
          .text(m.val, xPos + 10, 142);
      });

      doc.y = 195;

      // --- Body Data by Report Type ---
      if (type === 'users') {
        doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(14).text('Registered Users Roster', 40, doc.y);
        doc.moveDown(0.5);

        const users = await User.find({}).sort({ createdAt: -1 }).limit(30).lean();

        // Table Header
        let currentY = doc.y;
        doc.rect(40, currentY, doc.page.width - 80, 20).fill('#1e293b');
        doc.fillColor('#ffffff').fontSize(8).font('Helvetica-Bold');
        doc.text('NAME', 45, currentY + 6);
        doc.text('ROLL NO', 160, currentY + 6);
        doc.text('COLLEGE', 235, currentY + 6);
        doc.text('YEAR', 285, currentY + 6);
        doc.text('DEPT', 335, currentY + 6);
        doc.text('EMAIL', 420, currentY + 6);
        currentY += 22;

        users.forEach((u: any, i: number) => {
          if (currentY > 750) {
            doc.addPage();
            currentY = 40;
          }
          if (i % 2 === 0) {
            doc.rect(40, currentY, doc.page.width - 80, 18).fill('#f8fafc');
          }
          doc.fillColor('#334155').fontSize(7.5).font('Helvetica');
          doc.text(u.name.slice(0, 18), 45, currentY + 5);
          doc.text(u.rollNo, 160, currentY + 5);
          doc.text(u.college || 'BIT', 235, currentY + 5);
          doc.text(deriveStudentYear(u), 285, currentY + 5);
          doc.text(deriveStudentDepartment(u).slice(0, 14), 335, currentY + 5);
          doc.text(u.email.slice(0, 24), 420, currentY + 5);
          currentY += 19;
        });
      } else if (type === 'events') {
        doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(14).text('Club Events Directory', 40, doc.y);
        doc.moveDown(0.5);

        const Event = getEventModel();
        const events = await Event.find({}).sort({ date: -1 }).limit(25).lean();

        let currentY = doc.y;
        doc.rect(40, currentY, doc.page.width - 80, 20).fill('#1e293b');
        doc.fillColor('#ffffff').fontSize(8).font('Helvetica-Bold');
        doc.text('EVENT TITLE', 45, currentY + 6);
        doc.text('DATE', 240, currentY + 6);
        doc.text('TYPE', 330, currentY + 6);
        doc.text('VENUE / LINK', 410, currentY + 6);
        currentY += 22;

        events.forEach((ev: any, i: number) => {
          if (currentY > 750) {
            doc.addPage();
            currentY = 40;
          }
          if (i % 2 === 0) {
            doc.rect(40, currentY, doc.page.width - 80, 18).fill('#f8fafc');
          }
          doc.fillColor('#334155').fontSize(8).font('Helvetica');
          doc.text(ev.title.slice(0, 32), 45, currentY + 5);
          doc.text(new Date(ev.date).toLocaleDateString(), 240, currentY + 5);
          doc.text(ev.type, 330, currentY + 5);
          doc.text((ev.venueOrLink || '').slice(0, 26), 410, currentY + 5);
          currentY += 19;
        });
      } else {
        // Summary or Attendance
        doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(14).text('Performance & Analytics Overview', 40, doc.y);
        doc.moveDown(0.5);

        let currentY = doc.y;
        const summaryData = [
          ['Total Active Users', `${metrics.totalUsers} registered members`],
          ['Active Ongoing / Upcoming Events', `${metrics.activeEvents} scheduled`],
          ['Total Lifetime Events', `${metrics.totalEvents} organized`],
          ['Total Assessment Levels Available', `${metrics.totalAssessmentLevels} (Easy, Medium, Hard + Quiz tracks)`],
          ['Active Students / Members', `${metrics.details?.activeStudents || 0} enrolled`],
          ['Faculty Mentors', `${metrics.details?.facultyCount || 0} registered`],
          ['Assessment Difficulty Tiers', (metrics.details?.assessmentDifficulties || ['Easy', 'Medium', 'Hard']).join(', ')],
          ['Interactive Quizzes', `${metrics.details?.quizzesAvailable || 0} modules`],
        ];

        summaryData.forEach(([label, value], i) => {
          if (i % 2 === 0) {
            doc.rect(40, currentY, doc.page.width - 80, 24).fill('#f1f5f9');
          }
          doc.fillColor('#1e293b').fontSize(9).font('Helvetica-Bold').text(label, 50, currentY + 7);
          doc.fillColor('#2563eb').fontSize(9).font('Helvetica').text(value, 280, currentY + 7);
          currentY += 25;
        });
      }

      // --- Footer ---
      doc.fontSize(8)
        .font('Helvetica')
        .fillColor('#94a3b8')
        .text('Confidential - For Code Circle Internal Administration Only', 40, doc.page.height - 30, {
          align: 'center',
          width: doc.page.width - 80,
        });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};
