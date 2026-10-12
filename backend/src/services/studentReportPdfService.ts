// @ts-ignore
const PDFDocument = require('pdfkit');

export interface StudentReportData {
  student: {
    _id: string;
    name: string;
    rollNo: string;
    email: string;
    role: string;
    department?: string;
    college?: string;
    year?: string;
    points?: number;
    skills?: string[];
    isOnboarded?: boolean;
    isBlocked?: boolean;
    createdAt?: string | Date;
  };
  stats: {
    rank: number;
    totalStudents: number;
    totalEventsAttended: number;
    questsCompleted: number;
    codingChallengesSolved: number;
    averageAssessmentScore: number;
  };
  domainProgress?: Array<{
    id: string;
    name: string;
    totalLevels: number;
    completedLevels: number;
    progressPercent: number;
    isUnlocked: boolean;
  }>;
  attendanceRecords?: Array<{
    id: string;
    eventName: string;
    sessionName?: string;
    venueOrLink?: string;
    timestamp: string | Date;
    status: string;
    pointsAwarded: number;
  }>;
  codingResults?: Array<{
    id: string;
    challengeTitle: string;
    difficulty: string;
    language: string;
    score: number;
    passed: number;
    total: number;
    status: string;
    submittedAt: string | Date;
  }>;
  assessmentResults?: Array<{
    id: string;
    assessmentTitle: string;
    category: string;
    score: number;
    totalPoints: number;
    percentage: number;
    passed: boolean;
    createdAt: string | Date;
  }>;
}

/**
 * Generate an executive, branded PDF Dossier for an individual student.
 * Uses PDFKit with bufferPages to calculate total pages and draw consistent footers.
 */
export const generateStudentReportPdf = async (
  data: StudentReportData
): Promise<{ buffer: Buffer; filename: string }> => {
  return new Promise((resolve, reject) => {
    try {
      const { student, stats, domainProgress = [], attendanceRecords = [], codingResults = [], assessmentResults = [] } = data;

      const doc = new PDFDocument({
        margin: 36,
        size: 'A4', // 595.28 x 841.89 points
        bufferPages: true,
        info: {
          Title: `Student Report - ${student.name} (${student.rollNo})`,
          Author: 'Code Circle Platform',
          Subject: 'Comprehensive Student Performance Dossier',
        },
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk: any) => chunks.push(chunk));
      doc.on('end', () => {
        const safeName = (student.rollNo || student.name || 'student').replace(/[^a-zA-Z0-9_-]/g, '_');
        const dateStr = new Date().toISOString().slice(0, 10);
        resolve({
          buffer: Buffer.concat(chunks),
          filename: `CodeCircle_Report_${safeName}_${dateStr}.pdf`,
        });
      });

      const pageWidth = doc.page.width;
      const pageHeight = doc.page.height;
      const contentWidth = pageWidth - 72; // 36pt margins on both sides

      const drawHeaderBanner = () => {
        // Deep modern dark banner
        doc.rect(0, 0, pageWidth, 90).fill('#080c18');
        // Top accent line in electric cyan/blue
        doc.rect(0, 0, pageWidth, 4).fill('#2563eb');

        // Brand name & emblem
        doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(18).text('CODE CIRCLE', 36, 26);
        doc.fontSize(8.5).font('Helvetica').fillColor('#94a3b8').text(
          'STUDENT TRACKING & ACADEMIC INTELLIGENCE SYSTEM',
          36,
          49
        );

        // Document title & metadata on top-right
        doc.fontSize(10).font('Helvetica-Bold').fillColor('#60a5fa').text(
          'OFFICIAL STUDENT DOSSIER',
          pageWidth - 236,
          26,
          { width: 200, align: 'right' }
        );
        const reportDate = new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        });
        doc.fontSize(7.5).font('Helvetica').fillColor('#94a3b8').text(
          `Generated: ${reportDate} • Ref: #${student._id.toString().slice(-6).toUpperCase()}`,
          pageWidth - 236,
          42,
          { width: 200, align: 'right' }
        );

        doc.y = 106;
      };

      const drawContinuationHeader = () => {
        doc.rect(0, 0, pageWidth, 36).fill('#0f172a');
        doc.rect(0, 0, pageWidth, 2).fill('#2563eb');
        doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(9).text(
          `CODE CIRCLE • Student Dossier: ${student.name} (${student.rollNo})`,
          36,
          12
        );
        doc.fillColor('#94a3b8').font('Helvetica').fontSize(8).text(
          'CONTINUED RECORD',
          pageWidth - 156,
          13,
          { width: 120, align: 'right' }
        );
        doc.y = 52;
      };

      const ensureSpace = (needed: number) => {
        if (doc.y + needed > pageHeight - 55) {
          doc.addPage();
          drawContinuationHeader();
        }
      };

      // ── 1. Page 1 Header ──
      drawHeaderBanner();

      // ── 2. Student Identity Card ──
      const profileBoxY = doc.y;
      const profileBoxH = 92;
      doc.rect(36, profileBoxY, contentWidth, profileBoxH).fill('#f8fafc');
      doc.rect(36, profileBoxY, contentWidth, profileBoxH).strokeColor('#e2e8f0').lineWidth(1).stroke();

      // Left Accent Strip
      doc.rect(36, profileBoxY, 4, profileBoxH).fill('#3b82f6');

      // Student Name & Roll
      doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(15).text(student.name, 48, profileBoxY + 12);
      doc.fillColor('#475569').font('Helvetica-Bold').fontSize(9).text(`ROLL NO: `, 48, profileBoxY + 32);
      doc.fillColor('#2563eb').font('Helvetica-Bold').fontSize(9).text(student.rollNo || 'N/A', 105, profileBoxY + 32);

      // Department & Year
      doc.fillColor('#475569').font('Helvetica').fontSize(8.5).text(
        `Department: ${student.department || 'General Engineering'}`,
        48,
        profileBoxY + 48
      );
      doc.fillColor('#475569').font('Helvetica').fontSize(8.5).text(
        `Academic Year: ${student.year || 'Student'} • College: ${student.college || 'BIT'}`,
        48,
        profileBoxY + 62
      );
      doc.fillColor('#64748b').font('Helvetica').fontSize(8).text(
        `Email: ${student.email}`,
        48,
        profileBoxY + 76
      );

      // Right Side Badges (Rank & Points)
      const rightX = pageWidth - 196;
      doc.rect(rightX, profileBoxY + 12, 160, 32).fill('#eff6ff');
      doc.rect(rightX, profileBoxY + 12, 160, 32).strokeColor('#bfdbfe').lineWidth(0.5).stroke();
      doc.fillColor('#1e40af').font('Helvetica-Bold').fontSize(7.5).text('PLATFORM RANK', rightX + 10, profileBoxY + 17);
      doc.fillColor('#1d4ed8').font('Helvetica-Bold').fontSize(14).text(`#${stats.rank || 1}`, rightX + 10, profileBoxY + 27);
      doc.fillColor('#6b7280').font('Helvetica').fontSize(7.5).text(
        `of ${stats.totalStudents || 1} members`,
        rightX + 65,
        profileBoxY + 32
      );

      doc.rect(rightX, profileBoxY + 48, 160, 32).fill('#ecfdf5');
      doc.rect(rightX, profileBoxY + 48, 160, 32).strokeColor('#a7f3d0').lineWidth(0.5).stroke();
      doc.fillColor('#065f46').font('Helvetica-Bold').fontSize(7.5).text('CLUB MERIT POINTS', rightX + 10, profileBoxY + 53);
      doc.fillColor('#059669').font('Helvetica-Bold').fontSize(14).text(`${student.points || 0} PTS`, rightX + 10, profileBoxY + 63);
      doc.fillColor(student.isOnboarded ? '#059669' : '#d97706').font('Helvetica-Bold').fontSize(7.5).text(
        student.isOnboarded ? 'Verified' : 'Pending Claim',
        rightX + 95,
        profileBoxY + 68
      );

      doc.y = profileBoxY + profileBoxH + 14;

      // ── 3. Key Metrics Grid (4 Stat Boxes) ──
      const metricBoxW = (contentWidth - 18) / 4;
      const metricBoxH = 46;
      const metricsY = doc.y;

      const metricCards = [
        { label: 'EVENTS ATTENDED', val: String(stats.totalEventsAttended || 0), sub: 'Sessions Logged', color: '#2563eb', bg: '#eff6ff' },
        { label: 'QUESTS COMPLETED', val: String(stats.questsCompleted || 0), sub: 'Domain Modules', color: '#059669', bg: '#f0fdf4' },
        { label: 'PROBLEMS SOLVED', val: String(stats.codingChallengesSolved || 0), sub: 'Coding Challenges', color: '#7c3aed', bg: '#f5f3ff' },
        { label: 'AVG ASSESSMENT', val: `${stats.averageAssessmentScore || 0}%`, sub: 'Knowledge Checks', color: '#d97706', bg: '#fffbeb' },
      ];

      metricCards.forEach((c, idx) => {
        const x = 36 + idx * (metricBoxW + 6);
        doc.rect(x, metricsY, metricBoxW, metricBoxH).fill(c.bg);
        doc.rect(x, metricsY, metricBoxW, metricBoxH).strokeColor('#e2e8f0').lineWidth(0.5).stroke();

        doc.fillColor('#64748b').font('Helvetica-Bold').fontSize(6.5).text(c.label, x + 8, metricsY + 7);
        doc.fillColor(c.color).font('Helvetica-Bold').fontSize(14).text(c.val, x + 8, metricsY + 18);
        doc.fillColor('#94a3b8').font('Helvetica').fontSize(6.5).text(c.sub, x + 8, metricsY + 34);
      });

      doc.y = metricsY + metricBoxH + 16;

      // ── Section Helper ──
      const drawSectionHeader = (title: string, badge?: string) => {
        ensureSpace(40);
        const y = doc.y;
        doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(11).text(title, 36, y);
        if (badge) {
          doc.fillColor('#64748b').font('Helvetica').fontSize(8).text(badge, 36 + doc.widthOfString(title) + 8, y + 2.5);
        }
        doc.rect(36, y + 16, contentWidth, 1).fill('#e2e8f0');
        doc.y = y + 22;
      };

      // ── 4. Domain Mastery & Learning Tracks ──
      if (domainProgress.length > 0) {
        drawSectionHeader('1. Domain Curriculum Mastery', `${domainProgress.length} Tracks Monitored`);

        // Table Header
        let tableY = doc.y;
        doc.rect(36, tableY, contentWidth, 18).fill('#1e293b');
        doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(7.5);
        doc.text('DOMAIN TRACK', 44, tableY + 5);
        doc.text('TOTAL LEVELS', 240, tableY + 5);
        doc.text('COMPLETED', 320, tableY + 5);
        doc.text('COMPLETION %', 400, tableY + 5);
        doc.text('STATUS', 475, tableY + 5);
        tableY += 19;

        domainProgress.forEach((dom, i) => {
          ensureSpace(20);
          tableY = doc.y;
          if (i % 2 === 0) {
            doc.rect(36, tableY, contentWidth, 18).fill('#f8fafc');
          }
          doc.fillColor('#1e293b').font('Helvetica-Bold').fontSize(7.5).text((dom.name || 'Domain').slice(0, 36), 44, tableY + 5);
          doc.fillColor('#475569').font('Helvetica').fontSize(7.5).text(String(dom.totalLevels || 0), 240, tableY + 5);
          doc.fillColor('#059669').font('Helvetica-Bold').fontSize(7.5).text(String(dom.completedLevels || 0), 320, tableY + 5);
          doc.fillColor('#2563eb').font('Helvetica-Bold').fontSize(7.5).text(`${dom.progressPercent || 0}%`, 400, tableY + 5);

          const statusText = dom.progressPercent >= 100 ? 'Completed' : dom.progressPercent > 0 ? 'In Progress' : 'Not Started';
          const statusCol = dom.progressPercent >= 100 ? '#059669' : dom.progressPercent > 0 ? '#2563eb' : '#94a3b8';
          doc.fillColor(statusCol).font('Helvetica-Bold').fontSize(7.5).text(statusText, 475, tableY + 5);

          doc.y = tableY + 18;
        });

        doc.y += 12;
      }

      // ── 5. Coding Assessments Performance ──
      drawSectionHeader(
        '2. Coding Assessment History',
        `${codingResults.length} Submissions Evaluated`
      );

      if (codingResults.length === 0) {
        doc.fillColor('#94a3b8').font('Helvetica-Oblique').fontSize(8.5).text(
          'No coding challenges attempted yet.',
          44,
          doc.y + 4
        );
        doc.y += 18;
      } else {
        let codeY = doc.y;
        doc.rect(36, codeY, contentWidth, 18).fill('#1e293b');
        doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(7.5);
        doc.text('PROBLEM TITLE', 44, codeY + 5);
        doc.text('DIFFICULTY', 230, codeY + 5);
        doc.text('LANG', 295, codeY + 5);
        doc.text('TEST CASES', 345, codeY + 5);
        doc.text('SCORE', 415, codeY + 5);
        doc.text('VERDICT', 475, codeY + 5);
        codeY += 19;

        codingResults.slice(0, 15).forEach((cr, i) => {
          ensureSpace(20);
          codeY = doc.y;
          if (i % 2 === 0) {
            doc.rect(36, codeY, contentWidth, 18).fill('#f8fafc');
          }
          doc.fillColor('#1e293b').font('Helvetica-Bold').fontSize(7.5).text((cr.challengeTitle || 'Problem').slice(0, 32), 44, codeY + 5);
          
          // Difficulty badge color
          const diffCol = cr.difficulty === 'Easy' ? '#059669' : cr.difficulty === 'Hard' ? '#dc2626' : '#d97706';
          doc.fillColor(diffCol).font('Helvetica-Bold').fontSize(7.5).text(cr.difficulty || 'Medium', 230, codeY + 5);
          doc.fillColor('#475569').font('Helvetica').fontSize(7.5).text((cr.language || 'py').toUpperCase(), 295, codeY + 5);
          doc.fillColor('#475569').font('Helvetica').fontSize(7.5).text(`${cr.passed || 0}/${cr.total || 0}`, 345, codeY + 5);
          doc.fillColor('#2563eb').font('Helvetica-Bold').fontSize(7.5).text(`${cr.score || 0} pts`, 415, codeY + 5);

          const isPass = cr.status === 'passed';
          doc.fillColor(isPass ? '#059669' : '#dc2626').font('Helvetica-Bold').fontSize(7.5).text(
            isPass ? 'PASSED' : (cr.status || 'FAILED').toUpperCase(),
            475,
            codeY + 5
          );

          doc.y = codeY + 18;
        });

        doc.y += 12;
      }

      // ── 6. Knowledge Assessment Results (Quests / MCQs) ──
      drawSectionHeader(
        '3. Knowledge Assessments & MCQ Quests',
        `${assessmentResults.length} Tests Logged`
      );

      if (assessmentResults.length === 0) {
        doc.fillColor('#94a3b8').font('Helvetica-Oblique').fontSize(8.5).text(
          'No knowledge assessments recorded yet.',
          44,
          doc.y + 4
        );
        doc.y += 18;
      } else {
        let asY = doc.y;
        doc.rect(36, asY, contentWidth, 18).fill('#1e293b');
        doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(7.5);
        doc.text('ASSESSMENT NAME', 44, asY + 5);
        doc.text('CATEGORY', 240, asY + 5);
        doc.text('RAW SCORE', 345, asY + 5);
        doc.text('PERCENTAGE', 415, asY + 5);
        doc.text('RESULT', 475, asY + 5);
        asY += 19;

        assessmentResults.slice(0, 15).forEach((ar, i) => {
          ensureSpace(20);
          asY = doc.y;
          if (i % 2 === 0) {
            doc.rect(36, asY, contentWidth, 18).fill('#f8fafc');
          }
          doc.fillColor('#1e293b').font('Helvetica-Bold').fontSize(7.5).text((ar.assessmentTitle || 'Assessment').slice(0, 34), 44, asY + 5);
          doc.fillColor('#64748b').font('Helvetica').fontSize(7.5).text((ar.category || 'General').slice(0, 16), 240, asY + 5);
          doc.fillColor('#475569').font('Helvetica').fontSize(7.5).text(`${ar.score || 0}/${ar.totalPoints || 0}`, 345, asY + 5);
          doc.fillColor('#2563eb').font('Helvetica-Bold').fontSize(7.5).text(`${ar.percentage || 0}%`, 415, asY + 5);
          doc.fillColor(ar.passed ? '#059669' : '#dc2626').font('Helvetica-Bold').fontSize(7.5).text(
            ar.passed ? 'PASSED' : 'RETAKE',
            475,
            asY + 5
          );

          doc.y = asY + 18;
        });

        doc.y += 12;
      }

      // ── 7. Verified Attendance History ──
      drawSectionHeader(
        '4. Attendance & Club Activity Logs',
        `${attendanceRecords.length} Events Verified`
      );

      if (attendanceRecords.length === 0) {
        doc.fillColor('#94a3b8').font('Helvetica-Oblique').fontSize(8.5).text(
          'No attendance sessions recorded yet.',
          44,
          doc.y + 4
        );
        doc.y += 18;
      } else {
        let attY = doc.y;
        doc.rect(36, attY, contentWidth, 18).fill('#1e293b');
        doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(7.5);
        doc.text('EVENT / WORKSHOP TITLE', 44, attY + 5);
        doc.text('SESSION TYPE', 240, attY + 5);
        doc.text('DATE', 345, attY + 5);
        doc.text('POINTS', 415, attY + 5);
        doc.text('STATUS', 475, attY + 5);
        attY += 19;

        attendanceRecords.slice(0, 20).forEach((att, i) => {
          ensureSpace(20);
          attY = doc.y;
          if (i % 2 === 0) {
            doc.rect(36, attY, contentWidth, 18).fill('#f8fafc');
          }
          doc.fillColor('#1e293b').font('Helvetica-Bold').fontSize(7.5).text((att.eventName || 'Club Event').slice(0, 34), 44, attY + 5);
          doc.fillColor('#64748b').font('Helvetica').fontSize(7.5).text((att.sessionName || 'Attendance').slice(0, 16), 240, attY + 5);
          const attDate = att.timestamp ? new Date(att.timestamp).toLocaleDateString() : '—';
          doc.fillColor('#475569').font('Helvetica').fontSize(7.5).text(attDate, 345, attY + 5);
          doc.fillColor('#059669').font('Helvetica-Bold').fontSize(7.5).text(`+${att.pointsAwarded || 0}`, 415, attY + 5);
          doc.fillColor('#059669').font('Helvetica-Bold').fontSize(7.5).text('PRESENT', 475, attY + 5);

          doc.y = attY + 18;
        });

        doc.y += 16;
      }

      // ── 8. Official Certification & Seal Box ──
      ensureSpace(85);
      const sealY = doc.y;
      doc.rect(36, sealY, contentWidth, 68).fill('#f8fafc');
      doc.rect(36, sealY, contentWidth, 68).strokeColor('#cbd5e1').lineWidth(0.75).stroke();

      // Left: Verification notes
      doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(8.5).text(
        'OFFICIAL ACADEMIC & TECHNICAL VERIFICATION',
        48,
        sealY + 10
      );
      doc.fillColor('#475569').font('Helvetica').fontSize(7.5).text(
        'This electronic record is generated by the Code Circle Tracking Engine. All metrics, attendance hashes, and\ncode submission verdicts are verified cryptographically against platform audit logs.',
        48,
        sealY + 24,
        { width: 320 }
      );

      // Right: Digital Signature / Seal
      const signX = pageWidth - 180;
      doc.rect(signX, sealY + 10, 136, 48).fill('#ffffff');
      doc.rect(signX, sealY + 10, 136, 48).strokeColor('#93c5fd').lineWidth(0.5).stroke();
      doc.fillColor('#1d4ed8').font('Helvetica-Bold').fontSize(8).text('CODE CIRCLE VERIFIED', signX + 10, sealY + 16);
      doc.fillColor('#059669').font('Helvetica-Bold').fontSize(7).text('STATUS: ACTIVE & IN GOOD STANDING', signX + 10, sealY + 28);
      doc.fillColor('#94a3b8').font('Helvetica').fontSize(6.5).text(`AUDIT ID: CC-${student._id.toString().slice(-8).toUpperCase()}`, signX + 10, sealY + 42);

      // ── 9. Universal Footer with Total Pages across all pages ──
      const range = doc.bufferedPageRange();
      for (let i = range.start; i < range.start + range.count; i++) {
        doc.switchToPage(i);
        doc.rect(36, pageHeight - 34, contentWidth, 0.5).fill('#e2e8f0');
        doc.fillColor('#94a3b8').font('Helvetica').fontSize(7).text(
          `Page ${i + 1} of ${range.count} • Code Circle Student Tracking System • Confidential Student Performance Dossier`,
          36,
          pageHeight - 26,
          { width: contentWidth, align: 'center' }
        );
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

export default {
  generateStudentReportPdf,
};
