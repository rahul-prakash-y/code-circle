import React, { forwardRef } from 'react';
import './report-print.css';
import { BIT_LETTERHEAD_HEADER_BASE64 } from './bitHeaderBase64';

export interface ReportData {
  eventId?: string | { _id?: string; title?: string; date?: string | Date; venueOrLink?: string };
  eventTitle?: string;
  clubName: string;
  eventCategory: string;
  academicYear: string;
  date: string | Date;
  endDate?: string | Date;
  dateDisplay?: string;
  venue: string;
  // Core Text
  objective: string;
  outcome: string;
  // Detailed Summary (Exact fields from official BIT template)
  eventOverview: string;
  strategiesUsed: string[] | string;
  activitiesDone: string[] | string;
  accomplishments: string[] | string;
  achievements: string[] | string;
  takeaways: string[] | string;
  concludingNote?: string;
  // Evidence
  circularUrl?: string[];
  brochureUrl?: string[];
  attendanceUrl?: string[];
  geoPhotoUrl?: string[];
  newspaperClippingUrl?: string[];
  feedbackUrl?: string[];
  billSettlementUrl?: string[];
  // Resource Person & Coordinator Details
  resourcePerson?: string;
  coordinatorName?: string;
  coordinatorSignatureUrl?: string;
  // Audit
  status?: string;
  createdBy?: {
    name?: string;
    email?: string;
    rollNo?: string;
  };
}

export interface OfficialReportTemplateProps {
  data: ReportData;
  isPreview?: boolean;
}

/**
 * Helper to safely format inline **bold** and *italic* markdown without innerHTML.
 */
export const renderFormattedText = (text: string): React.ReactNode => {
  if (!text) return null;

  // Split by markdown tokens: **bold** or *italic*
  const tokenRegex = /(\*\*[^*]+\*\*|\*[^*]+\*)/g;
  const parts = text.split(tokenRegex);

  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
      return <em key={index}>{part.slice(1, -1)}</em>;
    }
    return part;
  });
};

/**
 * Format date strictly as DD.MM.YYYY
 */
export const formatBitDate = (d: string | Date | undefined): string => {
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
};

/**
 * OfficialReportTemplate
 * Pixel-perfect implementation matching Bannari Amman Institute of Technology
 * official Word template reference (CODE SAGA Event.pdf).
 * Fully isolated typography in pt units.
 */
export const OfficialReportTemplate = forwardRef<HTMLDivElement, OfficialReportTemplateProps>(
  ({ data, isPreview = false }, ref) => {
    // 1. Resolve Event Title without printing MongoDB ObjectId
    const rawTitle =
      data.eventTitle ||
      (typeof data.eventId === 'object' && data.eventId?.title ? data.eventId.title : '');
    const isObjectId = typeof data.eventId === 'string' && /^[0-9a-fA-F]{24}$/.test(data.eventId);
    const resolvedEventTitle =
      rawTitle ||
      (typeof data.eventId === 'string' && !isObjectId ? data.eventId : 'EVENT REPORT');

    // 2. Format Date
    let dateStr = data.dateDisplay || '';
    if (!dateStr) {
      const startFormatted = formatBitDate(data.date);
      if (data.endDate) {
        const endFormatted = formatBitDate(data.endDate);
        dateStr = `${startFormatted} AND ${endFormatted}`;
      } else {
        dateStr = startFormatted;
      }
    }

    // 3. Coordinator name fallback
    const coordinatorName =
      data.coordinatorName || data.createdBy?.name || 'R.Dhanasekar';

    // 4. Helper to parse text lines or bullet items
    const parseItems = (content: string[] | string | undefined): string[] => {
      if (!content) return [];
      if (Array.isArray(content)) {
        return content.map((s) => s.trim()).filter((s) => s.length > 0);
      }
      return content
        .split('\n')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
    };

    const strategiesItems = parseItems(data.strategiesUsed);
    const activitiesItems = parseItems(data.activitiesDone);
    const accomplishmentsItems = parseItems(data.accomplishments);
    const achievementsItems = parseItems(data.achievements);
    const takeawaysItems = parseItems(data.takeaways);
    const overviewParagraphs = parseItems(data.eventOverview);

    // Render list items (with bullet symbol if bulleted, or as paragraph)
    const renderSummaryItems = (items: string[], defaultBullet = false) => {
      if (items.length === 0) return null;

      return items.map((item, idx) => {
        const isBulleted =
          defaultBullet ||
          item.startsWith('') ||
          item.startsWith('•') ||
          item.startsWith('- ') ||
          item.startsWith('* ');

        const cleanText = item
          .replace(/^[•\-\*]\s*/, '')
          .trim();

        if (isBulleted) {
          return (
            <div key={idx} className="bit-report-summary-bullet-item">
              <span className="bit-report-item-bullet-symbol"></span>
              <div>{renderFormattedText(cleanText)}</div>
            </div>
          );
        }

        return (
          <p key={idx} className="bit-report-summary-paragraph">
            {renderFormattedText(item)}
          </p>
        );
      });
    };

    return (
      <div
        ref={ref}
        className={`bit-report-wrapper ${isPreview ? 'bit-report-preview-mode' : 'bit-report-print-mode'}`}
      >
        <table className="bit-report-table">
          {/* Repeating Header on every page */}
          <thead className="bit-report-thead">
            <tr>
              <td className="bit-report-header-cell">
                <img
                  src={BIT_LETTERHEAD_HEADER_BASE64}
                  alt="Bannari Amman Institute of Technology Header"
                  className="bit-report-header-img"
                />
              </td>
            </tr>
          </thead>

          {/* Continuous Body Flow */}
          <tbody className="bit-report-tbody">
            <tr>
              <td className="bit-report-content-cell">
                {/* 1. REPORT TITLE */}
                <h1 className="bit-report-title">
                  REPORT ON “{resolvedEventTitle}”
                </h1>

                {/* 2. BASIC INFO LINES */}
                <div className="bit-report-info-line">
                  Name of the Club: {data.clubName || 'CODE CIRCLE - BIT'}
                </div>
                <div className="bit-report-info-line">
                  Event Category:{' '}
                  <span className="category-italic">
                    {data.eventCategory || 'TECHNICAL EVENT'}
                  </span>
                </div>
                <div className="bit-report-info-line">
                  Academic Year: {data.academicYear || '2024-2025'}
                </div>
                <div className="bit-report-info-line">
                  Date:{dateStr}
                </div>
                <div className="bit-report-info-line">
                  Venue: {data.venue || 'BIO TECH SEMINAR HALL'}
                </div>

                {/* 3. OBJECTIVE OF THE EVENT */}
                <div className="bit-report-heading first-section">
                  <span className="underline-label">Objective of the event</span>
                  <span className="trailing-colon"> :</span>
                </div>
                <p className="bit-report-body-p">
                  {renderFormattedText(
                    data.objective ||
                      'The primary objective of this event was to enhance technical competencies and foster collaborative problem-solving.'
                  )}
                </p>

                {/* 4. OUTCOME OF THE EVENT */}
                <div className="bit-report-heading">
                  <span className="underline-label">Outcome of the event</span>
                  <span className="trailing-colon"> :</span>
                </div>
                <p className="bit-report-body-p">
                  {renderFormattedText(
                    data.outcome ||
                      'The event successfully provided participants with hands-on exposure and practical competencies.'
                  )}
                </p>

                {/* 5. CIRCULAR* */}
                <div className="bit-report-heading">
                  <span className="underline-label">Circular*</span>
                </div>
                {data.circularUrl && data.circularUrl.length > 0 && (
                  <div className="bit-report-evidence-block">
                    {data.circularUrl.map((url, idx) => (
                      <div key={idx} className="bit-report-evidence-img-wrapper">
                        <img
                          src={url}
                          alt={`Circular ${idx + 1}`}
                          className="bit-report-img portrait"
                        />
                        <div className="bit-report-img-rule" style={{ width: '308.2pt' }} />
                      </div>
                    ))}
                  </div>
                )}

                {/* 6. BROCHURE* */}
                <div className="bit-report-heading">
                  <span className="underline-label">Brochure*</span>
                </div>
                {data.brochureUrl && data.brochureUrl.length > 0 && (
                  <div className="bit-report-evidence-block">
                    {data.brochureUrl.map((url, idx) => (
                      <div key={idx} className="bit-report-evidence-img-wrapper">
                        <img
                          src={url}
                          alt={`Brochure ${idx + 1}`}
                          className="bit-report-img portrait"
                        />
                        <div className="bit-report-img-rule" style={{ width: '297pt' }} />
                      </div>
                    ))}
                  </div>
                )}

                {/* 7. ATTENDANCE* */}
                <div className="bit-report-heading">
                  <span className="underline-label">Attendance*</span>{' '}
                  {(!data.attendanceUrl || data.attendanceUrl.length === 0) && (
                    <span className="trailing-italic">
                      (BIT header, Event Title, Table contains: S.No., Name of the participants, , Signature of the students, Signature of the Co-ordinator and Club In charge)
                    </span>
                  )}
                </div>
                {data.attendanceUrl && data.attendanceUrl.length > 0 && (
                  <div className="bit-report-evidence-block">
                    {data.attendanceUrl.map((url, idx) => (
                      <div key={idx} className="bit-report-evidence-img-wrapper">
                        <img
                          src={url}
                          alt={`Attendance Record ${idx + 1}`}
                          className="bit-report-img landscape"
                        />
                        <div className="bit-report-img-rule" style={{ width: '451.3pt' }} />
                      </div>
                    ))}
                  </div>
                )}

                {/* 8. GEO PHOTO PROOFS WITH CAPTION* AND NEWSPAPER CLIPPING (IF ANY) */}
                <div className="bit-report-heading" style={{ breakAfter: 'auto' }}>
                  <span className="underline-label">
                    Geo Photo Proofs with caption* and Newspaper Clipping
                  </span>{' '}
                  <span className="trailing-italic">(if any)</span>
                </div>
                {((data.geoPhotoUrl && data.geoPhotoUrl.length > 0) ||
                  (data.newspaperClippingUrl && data.newspaperClippingUrl.length > 0)) && (
                  <div className="bit-report-evidence-block" style={{ breakBefore: 'page' }}>
                    {data.geoPhotoUrl?.map((url, idx) => (
                      <div key={`geo-${idx}`} className="bit-report-evidence-img-wrapper" style={{ marginBottom: '12pt' }}>
                        <img
                          src={url}
                          alt={`Geo Photo Record ${idx + 1}`}
                          className="bit-report-img landscape geo-photo"
                        />
                        <div className="bit-report-img-rule" style={{ width: '451.3pt' }} />
                      </div>
                    ))}
                    {data.newspaperClippingUrl?.map((url, idx) => (
                      <div key={`clipping-${idx}`} className="bit-report-evidence-img-wrapper" style={{ marginBottom: '12pt' }}>
                        <img
                          src={url}
                          alt={`Newspaper Clipping ${idx + 1}`}
                          className="bit-report-img landscape"
                        />
                        <div className="bit-report-img-rule" style={{ width: '451.3pt' }} />
                      </div>
                    ))}
                  </div>
                )}

                {/* 9. FEEDBACK/ ATTENDEES SATISFACTION SURVEY* */}
                <div className="bit-report-heading">
                  <span className="underline-label">
                    Feedback/ Attendees Satisfaction Survey*
                  </span>
                </div>
                {data.feedbackUrl && data.feedbackUrl.length > 0 && (
                  <div className="bit-report-evidence-block">
                    {data.feedbackUrl.map((url, idx) => (
                      <div key={idx} className="bit-report-evidence-img-wrapper">
                        <img
                          src={url}
                          alt={`Feedback Survey ${idx + 1}`}
                          className="bit-report-img landscape"
                        />
                        <div className="bit-report-img-rule" style={{ width: '451.3pt' }} />
                      </div>
                    ))}
                  </div>
                )}

                {/* 10. COORDINATOR SIGNATURE BLOCK (Right-aligned) */}
                <div className="bit-report-coordinator-container">
                  {data.coordinatorSignatureUrl && (
                    <img
                      src={data.coordinatorSignatureUrl}
                      alt="Coordinator Signature"
                      className="bit-report-coordinator-sig-img"
                    />
                  )}
                  <div className="bit-report-coordinator-label">Coordinator</div>
                  <div className="bit-report-coordinator-name">
                    ({coordinatorName})
                  </div>
                </div>

                {/* 11. RESOURCE PERSON DETAIL WITH THEIR EXPERTISE */}
                <div className="bit-report-heading" style={{ breakBefore: 'page' }}>
                  <span className="underline-label">
                    Resource Person detail with their expertise
                  </span>
                  <span className="trailing-colon">
                    {' '}: <span className="trailing-italic">{data.resourcePerson || 'NIL'}</span>
                  </span>
                </div>

                {/* 12. BILL SETTLEMENT COPY */}
                <div className="bit-report-heading">
                  <span className="underline-label">Bill settlement Copy</span>
                </div>
                {data.billSettlementUrl && data.billSettlementUrl.length > 0 && (
                  <div className="bit-report-evidence-block">
                    {data.billSettlementUrl.map((url, idx) => (
                      <div key={idx} className="bit-report-evidence-img-wrapper">
                        <img
                          src={url}
                          alt={`Bill Settlement ${idx + 1}`}
                          className="bit-report-img landscape"
                        />
                        <div className="bit-report-img-rule" style={{ width: '451.3pt' }} />
                      </div>
                    ))}
                  </div>
                )}

                {/* 13. SUMMARY OF THE EVENT */}
                <div className="bit-report-heading">
                  <span className="underline-label">Summary of the event:</span>
                </div>

                {/* Sub-heading 1: Event overview : */}
                <div className="bit-report-summary-subheading-row first-subheading">
                  <span className="bit-report-bullet-dot">●</span>
                  <span className="bit-report-subheading-text">
                    Event overview
                  </span>
                  <span className="bit-report-subheading-colon"> :</span>
                </div>
                <div className="bit-report-summary-indent-area">
                  {overviewParagraphs.length > 0 ? (
                    overviewParagraphs.map((p, idx) => (
                      <p key={idx} className="bit-report-summary-paragraph">
                        {renderFormattedText(p)}
                      </p>
                    ))
                  ) : (
                    <p className="bit-report-summary-paragraph">
                      {renderFormattedText(data.eventOverview || '')}
                    </p>
                  )}
                </div>

                {/* Sub-heading 2: Strategies used */}
                <div className="bit-report-summary-subheading-row">
                  <span className="bit-report-bullet-dot">●</span>
                  <span className="bit-report-subheading-text">Strategies used</span>
                </div>
                <div className="bit-report-summary-indent-area">
                  {renderSummaryItems(strategiesItems, false)}
                </div>

                {/* Sub-heading 3: Activities done */}
                <div className="bit-report-summary-subheading-row">
                  <span className="bit-report-bullet-dot">●</span>
                  <span className="bit-report-subheading-text">Activities done</span>
                </div>
                <div className="bit-report-summary-indent-area">
                  {renderSummaryItems(activitiesItems, true)}
                </div>

                {/* Sub-heading 4: Accomplishments */}
                <div className="bit-report-summary-subheading-row">
                  <span className="bit-report-bullet-dot">●</span>
                  <span className="bit-report-subheading-text">Accomplishments</span>
                </div>
                <div className="bit-report-summary-indent-area">
                  {renderSummaryItems(accomplishmentsItems, true)}
                </div>

                {/* Sub-heading 5: Achievements */}
                <div className="bit-report-summary-subheading-row">
                  <span className="bit-report-bullet-dot">●</span>
                  <span className="bit-report-subheading-text">Achievements</span>
                </div>
                <div className="bit-report-summary-indent-area">
                  {renderSummaryItems(achievementsItems, true)}
                </div>

                {/* Sub-heading 6: Conclude with a set of takeaways */}
                <div className="bit-report-summary-subheading-row">
                  <span className="bit-report-bullet-dot">●</span>
                  <span className="bit-report-subheading-text">
                    Conclude with a set of takeaways
                  </span>
                </div>
                <div className="bit-report-summary-indent-area">
                  {renderSummaryItems(takeawaysItems, false)}
                </div>

                {/* 14. CONCLUDING NOTE (Full margin, no 36pt indent) */}
                {data.concludingNote && (
                  <div className="bit-report-concluding-paragraph">
                    {renderFormattedText(data.concludingNote)}
                  </div>
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }
);

OfficialReportTemplate.displayName = 'OfficialReportTemplate';

export default OfficialReportTemplate;
