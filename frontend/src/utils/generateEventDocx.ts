import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  ImageRun,
  Header,
  AlignmentType,
  BorderStyle,
  UnderlineType,
} from 'docx';
import saveAs from 'file-saver';
import { BIT_LETTERHEAD_HEADER_BASE64 } from '../components/events/documentation/bitHeaderBase64';

export interface EventReportData {
  eventName?: string;
  eventTitle?: string;
  clubName?: string;
  eventCategory?: string;
  academicYear?: string;
  date?: string | Date;
  endDate?: string | Date;
  dateDisplay?: string;
  venue?: string;
  // Core Text
  objective?: string;
  outcome?: string;
  // Evidence Images
  circularUrl?: string[] | string;
  brochureUrl?: string[] | string;
  attendanceUrl?: string[] | string;
  geoPhotoUrl?: string[] | string;
  newspaperClippingUrl?: string[] | string;
  feedbackUrl?: string[] | string;
  billSettlementUrl?: string[] | string;
  // Detailed Summary (Official BIT Template fields)
  summaryOfEvent?: string;
  eventOverview?: string;
  strategiesUsed?: string[] | string;
  activitiesDone?: string[] | string;
  accomplishments?: string[] | string;
  achievements?: string[] | string;
  takeaways?: string[] | string;
  concludingNote?: string;
  // Resource Person & Coordinator Details
  resourcePerson?: string;
  coordinatorName?: string;
  coordinatorSignatureUrl?: string;
  // Metadata / Audit
  status?: string;
  createdBy?: {
    name?: string;
    email?: string;
    rollNo?: string;
  };
  [key: string]: any;
}

/**
 * Converts Base64 data URLs or fetches remote URLs ({ mode: 'cors' }) into an ArrayBuffer.
 * Skips cleanly and safely returns null if empty, invalid, or fetch fails.
 */
export async function fetchImageBuffer(url?: string): Promise<ArrayBuffer | null> {
  if (!url || typeof url !== 'string' || !url.trim()) return null;
  const trimmed = url.trim();

  try {
    if (trimmed.startsWith('data:')) {
      const commaIdx = trimmed.indexOf(',');
      if (commaIdx !== -1) {
        const base64Data = trimmed.slice(commaIdx + 1);
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes.buffer;
      }
    }

    const res = await fetch(trimmed, { mode: 'cors' });
    if (!res.ok) {
      console.warn(`[generateEventDocx] Failed to fetch image: ${trimmed} (status: ${res.status})`);
      return null;
    }
    return await res.arrayBuffer();
  } catch (err) {
    console.warn(`[generateEventDocx] Error fetching image buffer from ${trimmed}:`, err);
    return null;
  }
}

/**
 * Detects image file type from magic bytes to guarantee docx ImageRun compatibility.
 */
function detectImageType(buffer: ArrayBuffer): 'png' | 'jpg' | 'gif' | 'bmp' {
  const bytes = new Uint8Array(buffer);
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    return 'png';
  }
  if (bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xd8) {
    return 'jpg';
  }
  if (bytes.length >= 3 && bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) {
    return 'gif';
  }
  if (bytes.length >= 2 && bytes[0] === 0x42 && bytes[1] === 0x4d) {
    return 'bmp';
  }
  return 'png';
}

/**
 * Format date strictly as DD.MM.YYYY
 */
function formatBitDate(d: string | Date | undefined): string {
  if (!d) return '';
  try {
    const dateObj = new Date(d);
    if (isNaN(dateObj.getTime())) return String(d);
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();
    return `${day}.${month}.${year}`;
  } catch {
    return String(d);
  }
}

/**
 * Helper to parse inline markdown tokens (**bold** and *italic*) into TextRun objects.
 */
function parseMarkdownTextRuns(
  text: string,
  baseOptions: { font?: string; size?: number; color?: string } = {}
): TextRun[] {
  if (!text) return [new TextRun({ text: '', ...baseOptions })];
  const tokenRegex = /(\*\*[^*]+\*\*|\*[^*]+\*)/g;
  const parts = text.split(tokenRegex);
  return parts.filter(Boolean).map((part) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      return new TextRun({ text: part.slice(2, -2), bold: true, ...baseOptions });
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
      return new TextRun({ text: part.slice(1, -1), italics: true, ...baseOptions });
    }
    return new TextRun({ text: part, ...baseOptions });
  });
}

/**
 * Parse lines or array into string array
 */
function parseListItems(content?: string[] | string): string[] {
  if (!content) return [];
  if (Array.isArray(content)) {
    return content.map((s) => s.trim()).filter(Boolean);
  }
  return content
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Convert string or string[] to clean URL list
 */
function toUrlArray(val?: string[] | string): string[] {
  if (!val) return [];
  if (Array.isArray(val)) return val.filter((u) => typeof u === 'string' && u.trim().length > 0);
  if (typeof val === 'string' && val.trim().length > 0) return [val.trim()];
  return [];
}

/**
 * Client-side Word (.docx) generator for Bannari Amman Institute of Technology event reports.
 */
export async function generateEventDocx(report: EventReportData): Promise<void> {
  const font = 'Times New Roman';
  const baseSize = 22; // 11pt in half-points

  // 1. Resolve Event Name / Title
  const resolvedEventName = (
    report.eventName ||
    report.eventTitle ||
    (typeof report.eventId === 'object' && report.eventId?.title ? report.eventId.title : '') ||
    'EVENT REPORT'
  ).toUpperCase();

  // 2. Resolve Formatted Date string
  let resolvedDate = report.dateDisplay || '';
  if (!resolvedDate) {
    const startFormatted = formatBitDate(report.date);
    if (report.endDate) {
      const endFormatted = formatBitDate(report.endDate);
      resolvedDate = `${startFormatted} AND ${endFormatted}`;
    } else {
      resolvedDate = startFormatted;
    }
  }

  // 3. Repeating Header definition matching OfficialReportTemplate.tsx preview
  const headerBuffer = await fetchImageBuffer(
    report.headerImgUrl || BIT_LETTERHEAD_HEADER_BASE64
  );

  const headerChildren: Paragraph[] = [];
  if (headerBuffer) {
    const headerImgType = detectImageType(headerBuffer);
    headerChildren.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 120 },
        children: [
          new ImageRun({
            data: headerBuffer,
            transformation: { width: 694, height: 81 },
            type: headerImgType,
          }),
        ],
      })
    );
  } else {
    // Fallback if image buffer cannot be loaded
    headerChildren.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 30 },
        children: [
          new TextRun({
            text: 'BANNARI AMMAN INSTITUTE OF TECHNOLOGY',
            bold: true,
            font,
            size: 24, // 12pt
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 20 },
        children: [
          new TextRun({
            text: "(An Autonomous Institution Affiliated to Anna University Chennai • Approved by AICTE • Accredited by NAAC with 'A+' Grade)",
            font,
            size: 17, // ~8.5pt
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 20 },
        children: [
          new TextRun({
            text: 'SATHYAMANGALAM - 638 401, ERODE DISTRICT, TAMIL NADU, INDIA',
            font,
            size: 17, // ~8.5pt
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        border: {
          bottom: {
            color: '000000',
            space: 4,
            style: BorderStyle.SINGLE,
            size: 6,
          },
        },
        spacing: { after: 180 },
        children: [
          new TextRun({
            text: 'Phone: 04295 - 226000 | Website: www.bitsathy.ac.in | Email: stp@bitsathy.ac.in',
            font,
            size: 16, // 8pt
          }),
        ],
      })
    );
  }

  const repeatingHeader = new Header({
    children: headerChildren,
  });

  const children: Paragraph[] = [];

  // ══════════════════════════════════════════════════════════════
  // TITLE & METADATA
  // ══════════════════════════════════════════════════════════════
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 180, after: 240 },
      children: [
        new TextRun({
          text: `REPORT ON “${resolvedEventName}”`,
          bold: true,
          font,
          size: 28, // 14pt
        }),
      ],
    })
  );

  children.push(
    new Paragraph({
      spacing: { after: 80 },
      children: [
        new TextRun({ text: 'Name of the Club: ', bold: true, font, size: baseSize }),
        new TextRun({ text: report.clubName || 'CODE CIRCLE - BIT', font, size: baseSize }),
      ],
    }),
    new Paragraph({
      spacing: { after: 80 },
      children: [
        new TextRun({ text: 'Event Category: ', bold: true, font, size: baseSize }),
        new TextRun({
          text: report.eventCategory || 'TECHNICAL EVENT',
          italics: true,
          font,
          size: baseSize,
        }),
      ],
    }),
    new Paragraph({
      spacing: { after: 80 },
      children: [
        new TextRun({ text: 'Academic Year: ', bold: true, font, size: baseSize }),
        new TextRun({ text: report.academicYear || '2024-2025', font, size: baseSize }),
      ],
    }),
    new Paragraph({
      spacing: { after: 80 },
      children: [
        new TextRun({ text: 'Date: ', bold: true, font, size: baseSize }),
        new TextRun({ text: resolvedDate, font, size: baseSize }),
      ],
    }),
    new Paragraph({
      spacing: { after: 160 },
      children: [
        new TextRun({ text: 'Venue: ', bold: true, font, size: baseSize }),
        new TextRun({ text: report.venue || 'BIO TECH SEMINAR HALL', font, size: baseSize }),
      ],
    })
  );

  // ══════════════════════════════════════════════════════════════
  // OBJECTIVES & OUTCOMES
  // ══════════════════════════════════════════════════════════════
  children.push(
    new Paragraph({
      spacing: { before: 160, after: 80 },
      children: [
        new TextRun({
          text: 'Objective of the event: ',
          bold: true,
          underline: { type: UnderlineType.SINGLE },
          font,
          size: baseSize,
        }),
      ],
    }),
    new Paragraph({
      spacing: { after: 160 },
      children: parseMarkdownTextRuns(
        report.objective ||
          'The primary objective of this event was to enhance technical competencies and foster collaborative problem-solving.',
        { font, size: baseSize }
      ),
    }),
    new Paragraph({
      spacing: { before: 160, after: 80 },
      children: [
        new TextRun({
          text: 'Outcome of the event: ',
          bold: true,
          underline: { type: UnderlineType.SINGLE },
          font,
          size: baseSize,
        }),
      ],
    }),
    new Paragraph({
      spacing: { after: 200 },
      children: parseMarkdownTextRuns(
        report.outcome ||
          'The event successfully provided participants with hands-on exposure and practical competencies.',
        { font, size: baseSize }
      ),
    })
  );

  // ══════════════════════════════════════════════════════════════
  // EMBEDDED EVIDENCE IMAGES
  // ══════════════════════════════════════════════════════════════
  const evidenceSections: Array<{ label: string; urls: string[] | string | undefined }> = [
    { label: 'Circular*', urls: report.circularUrl },
    { label: 'Brochure*', urls: report.brochureUrl },
    { label: 'Geo Photo Proofs with caption*', urls: report.geoPhotoUrl },
    { label: 'Feedback/Attendees Satisfaction Survey*', urls: report.feedbackUrl },
    { label: 'Bill settlement Copy', urls: report.billSettlementUrl },
  ];

  for (const sec of evidenceSections) {
    children.push(
      new Paragraph({
        spacing: { before: 200, after: 100 },
        children: [
          new TextRun({
            text: sec.label,
            bold: true,
            underline: { type: UnderlineType.SINGLE },
            font,
            size: baseSize,
          }),
        ],
      })
    );

    const urls = toUrlArray(sec.urls);
    for (const url of urls) {
      const buffer = await fetchImageBuffer(url);
      if (buffer) {
        const detectedType = detectImageType(buffer);
        children.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 180 },
            children: [
              new ImageRun({
                data: buffer,
                transformation: { width: 540, height: 340 },
                type: detectedType,
              }),
            ],
          })
        );
      }
    }
  }

  // ══════════════════════════════════════════════════════════════
  // DETAILED SUMMARY SECTIONS
  // ══════════════════════════════════════════════════════════════
  children.push(
    new Paragraph({
      spacing: { before: 240, after: 120 },
      children: [
        new TextRun({
          text: 'Summary of the event:',
          bold: true,
          underline: { type: UnderlineType.SINGLE },
          font,
          size: baseSize,
        }),
      ],
    })
  );

  // Sub-heading 1: Event overview :
  children.push(
    new Paragraph({
      spacing: { before: 120, after: 60 },
      children: [
        new TextRun({
          text: '●  Event overview :',
          bold: true,
          font,
          size: baseSize,
        }),
      ],
    })
  );
  const overviewParas = parseListItems(report.eventOverview);
  if (overviewParas.length > 0) {
    for (const p of overviewParas) {
      children.push(
        new Paragraph({
          indent: { left: 360 },
          spacing: { after: 80 },
          children: parseMarkdownTextRuns(p, { font, size: baseSize }),
        })
      );
    }
  } else {
    children.push(
      new Paragraph({
        indent: { left: 360 },
        spacing: { after: 80 },
        children: [
          new TextRun({
            text: 'Detailed overview of the event proceedings and schedule.',
            font,
            size: baseSize,
          }),
        ],
      })
    );
  }

  // Sub-heading 2: Strategies used
  children.push(
    new Paragraph({
      spacing: { before: 120, after: 60 },
      children: [
        new TextRun({
          text: '●  Strategies used',
          bold: true,
          font,
          size: baseSize,
        }),
      ],
    })
  );
  const strategies = parseListItems(report.strategiesUsed);
  if (strategies.length > 0) {
    for (const item of strategies) {
      const clean = item.replace(/^[•\-\*]\s*/, '').trim();
      children.push(
        new Paragraph({
          bullet: { level: 0 },
          spacing: { after: 60 },
          children: parseMarkdownTextRuns(clean, { font, size: baseSize }),
        })
      );
    }
  }

  // Sub-heading 3: Activities done
  children.push(
    new Paragraph({
      spacing: { before: 120, after: 60 },
      children: [
        new TextRun({
          text: '●  Activities done',
          bold: true,
          font,
          size: baseSize,
        }),
      ],
    })
  );
  const activities = parseListItems(report.activitiesDone);
  if (activities.length > 0) {
    for (const item of activities) {
      const clean = item.replace(/^[•\-\*]\s*/, '').trim();
      children.push(
        new Paragraph({
          bullet: { level: 0 },
          spacing: { after: 60 },
          children: parseMarkdownTextRuns(clean, { font, size: baseSize }),
        })
      );
    }
  }

  // Sub-heading 4: Accomplishments
  children.push(
    new Paragraph({
      spacing: { before: 120, after: 60 },
      children: [
        new TextRun({
          text: '●  Accomplishments',
          bold: true,
          font,
          size: baseSize,
        }),
      ],
    })
  );
  const accomplishments = parseListItems(report.accomplishments);
  if (accomplishments.length > 0) {
    for (const item of accomplishments) {
      const clean = item.replace(/^[•\-\*]\s*/, '').trim();
      children.push(
        new Paragraph({
          bullet: { level: 0 },
          spacing: { after: 60 },
          children: parseMarkdownTextRuns(clean, { font, size: baseSize }),
        })
      );
    }
  }

  // Sub-heading 5: Achievements
  children.push(
    new Paragraph({
      spacing: { before: 120, after: 60 },
      children: [
        new TextRun({
          text: '●  Achievements',
          bold: true,
          font,
          size: baseSize,
        }),
      ],
    })
  );
  const achievements = parseListItems(report.achievements);
  if (achievements.length > 0) {
    for (const item of achievements) {
      const clean = item.replace(/^[•\-\*]\s*/, '').trim();
      children.push(
        new Paragraph({
          bullet: { level: 0 },
          spacing: { after: 60 },
          children: parseMarkdownTextRuns(clean, { font, size: baseSize }),
        })
      );
    }
  }

  // Sub-heading 6: Conclude with a set of takeaways
  children.push(
    new Paragraph({
      spacing: { before: 120, after: 60 },
      children: [
        new TextRun({
          text: '●  Conclude with a set of takeaways',
          bold: true,
          font,
          size: baseSize,
        }),
      ],
    })
  );
  const takeaways = parseListItems(report.takeaways);
  if (takeaways.length > 0) {
    for (const item of takeaways) {
      const clean = item.replace(/^[•\-\*]\s*/, '').trim();
      children.push(
        new Paragraph({
          bullet: { level: 0 },
          spacing: { after: 60 },
          children: parseMarkdownTextRuns(clean, { font, size: baseSize }),
        })
      );
    }
  }

  // Optional concluding note
  if (report.concludingNote) {
    children.push(
      new Paragraph({
        spacing: { before: 140, after: 120 },
        children: parseMarkdownTextRuns(report.concludingNote, { font, size: baseSize }),
      })
    );
  }

  // ══════════════════════════════════════════════════════════════
  // FOOTER SIGNATURE BLOCK (Right-aligned Coordinator)
  // ══════════════════════════════════════════════════════════════
  if (report.coordinatorSignatureUrl) {
    const sigBuffer = await fetchImageBuffer(report.coordinatorSignatureUrl);
    if (sigBuffer) {
      const sigType = detectImageType(sigBuffer);
      children.push(
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          spacing: { before: 300, after: 60 },
          children: [
            new ImageRun({
              data: sigBuffer,
              transformation: { width: 140, height: 60 },
              type: sigType,
            }),
          ],
        })
      );
    }
  }

  children.push(
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      spacing: { before: report.coordinatorSignatureUrl ? 60 : 360, after: 40 },
      children: [
        new TextRun({
          text: 'Coordinator',
          bold: true,
          font,
          size: baseSize,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      spacing: { after: 80 },
      children: [
        new TextRun({
          text: `(${report.coordinatorName || 'R.Dhanasekar'})`,
          font,
          size: baseSize,
        }),
      ],
    })
  );

  // ══════════════════════════════════════════════════════════════
  // BUILD DOCUMENT (A4: 11906 x 16838 twips, 720 twips margins)
  // ══════════════════════════════════════════════════════════════
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: {
              width: 11906,
              height: 16838,
            },
            margin: {
              top: 720,
              right: 720,
              bottom: 720,
              left: 720,
              header: 360,
            },
          },
        },
        headers: {
          default: repeatingHeader,
        },
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const downloadName = `${report.eventName || report.eventTitle || 'Event'}_Report.docx`;
  saveAs(blob, downloadName);
}

export default generateEventDocx;
