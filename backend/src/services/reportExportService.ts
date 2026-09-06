import PDFDocument from 'pdfkit';
import mongoose from 'mongoose';
import User from '../models/userModel';
import { getDashboardMetrics } from './metricsService';

const getEventModel = () => mongoose.models.Event || require('../models/eventModel');
const getAttendanceRecordModel = () => mongoose.models.AttendanceRecord || require('../models/attendanceRecordModel');

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

export type ReportType = 'users' | 'events' | 'attendance' | 'summary';

/**
 * Generates CSV content for the requested report type
 */
export const generateCsvReport = async (type: ReportType): Promise<{ data: string; filename: string }> => {
  const timestamp = new Date().toISOString().slice(0, 10);

  if (type === 'users') {
    const users = await User.find({}).sort({ createdAt: -1 }).lean();
    const headers = ['Name', 'Roll Number', 'Email', 'Role', 'Department', 'Blocked', 'Created Date'];
    const rows = users.map((u) => [
      u.name,
      u.rollNo,
      u.email,
      u.role,
      u.department || 'N/A',
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
      .populate('user', 'name rollNo department email')
      .sort({ createdAt: -1 })
      .limit(500)
      .lean();

    const headers = ['Session Name', 'Student Name', 'Roll Number', 'Department', 'Email', 'Marked At'];
    const rows = records.map((rec: any) => [
      rec.session?.sessionName || 'Session',
      rec.user?.name || 'Unknown',
      rec.user?.rollNo || 'N/A',
      rec.user?.department || 'N/A',
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
      doc.on('data', (chunk) => chunks.push(chunk));
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
        doc.text('ROLL NO', 180, currentY + 6);
        doc.text('ROLE', 260, currentY + 6);
        doc.text('DEPT', 340, currentY + 6);
        doc.text('EMAIL', 410, currentY + 6);
        currentY += 22;

        users.forEach((u, i) => {
          if (currentY > 750) {
            doc.addPage();
            currentY = 40;
          }
          if (i % 2 === 0) {
            doc.rect(40, currentY, doc.page.width - 80, 18).fill('#f8fafc');
          }
          doc.fillColor('#334155').fontSize(8).font('Helvetica');
          doc.text(u.name.slice(0, 22), 45, currentY + 5);
          doc.text(u.rollNo, 180, currentY + 5);
          doc.text(u.role, 260, currentY + 5);
          doc.text(u.department || '-', 340, currentY + 5);
          doc.text(u.email.slice(0, 26), 410, currentY + 5);
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
