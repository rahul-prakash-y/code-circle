import React, { forwardRef } from 'react';

export interface ReportData {
  eventId?: string | { _id?: string; title?: string; date?: string | Date; venueOrLink?: string };
  clubName: string;
  eventCategory: string;
  academicYear: string;
  date: string | Date;
  venue: string;
  // Core Text
  objective: string;
  outcome: string;
  // Detailed Summary
  eventOverview: string;
  strategiesUsed: string[] | string;
  activitiesDone: string[] | string;
  accomplishments: string[] | string;
  takeaways: string[] | string;
  // Evidence
  circularUrl: string[];
  brochureUrl: string[];
  geoPhotoUrl: string[];
  feedbackUrl: string[];
  billSettlementUrl: string[];
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
}

/**
 * OfficialReportTemplate
 * Institutional Event Documentation Report formatted strictly according to
 * Bannari Amman Institute of Technology institutional standards.
 * 
 * Configured with strict A4 dimensions (210mm x 297mm), serif typography,
 * high-contrast black & white layout, and real <img> tags for evidence audit attachments.
 */
export const OfficialReportTemplate = forwardRef<HTMLDivElement, OfficialReportTemplateProps>(
  ({ data }, ref) => {
    // Format list items whether provided as array or newline-delimited string
    const formatList = (items: string[] | string | undefined): string[] => {
      if (!items) return [];
      if (Array.isArray(items)) return items.filter(Boolean);
      return items
        .split('\n')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
    };

    const formatDate = (d: string | Date | undefined) => {
      if (!d) return 'N/A';
      try {
        return new Date(d).toLocaleDateString('en-US', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        });
      } catch {
        return String(d);
      }
    };

    const strategies = formatList(data.strategiesUsed);
    const activities = formatList(data.activitiesDone);
    const accomplishments = formatList(data.accomplishments);
    const takeaways = formatList(data.takeaways);

    return (
      <div
        ref={ref}
        className="w-[210mm] min-h-[297mm] bg-white text-black p-8 font-serif text-sm leading-relaxed box-border mx-auto print:m-0 print:p-8 print:w-[210mm] print:min-h-0 print:text-black print:bg-white"
        style={{
          color: '#111111',
          backgroundColor: '#ffffff',
          fontFamily: '"Times New Roman", Times, Georgia, serif',
        }}
      >
        <style dangerouslySetInnerHTML={{
          __html: `
            @media print {
              @page {
                size: A4 portrait;
                margin: 12mm 10mm 12mm 10mm;
              }
              body {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                background-color: #ffffff !important;
                color: #000000 !important;
              }
              .no-print {
                display: none !important;
              }
              .page-break-after {
                page-break-after: always;
                break-after: page;
              }
            }
          `
        }} />

        {/* ══════════════════════════════════════════════════════════════
            OFFICIAL BANNARI AMMAN INSTITUTE OF TECHNOLOGY HEADER
        ══════════════════════════════════════════════════════════════ */}
        <header className="border-b-[3px] border-black pb-3 mb-6 text-center">
          <div className="flex items-center justify-between gap-4 mb-2">
            {/* Left Institutional Emblem / Crest */}
            <div className="w-16 h-16 flex-shrink-0 flex items-center justify-center border-2 border-black rounded-full font-bold text-lg text-black bg-neutral-50">
              <span>BIT</span>
            </div>

            {/* Central Institutional Letterhead */}
            <div className="flex-1 text-center">
              <h1 className="text-xl sm:text-2xl font-black tracking-wide uppercase text-black font-serif leading-tight">
                Bannari Amman Institute of Technology
              </h1>
              <p className="text-[10px] sm:text-[11px] font-semibold text-neutral-800 leading-tight mt-0.5">
                (An Autonomous Institution Affiliated to Anna University Chennai &bull; Approved by AICTE &bull; Accredited by NAAC with &ldquo;A+&rdquo; Grade)
              </p>
              <p className="text-[10px] text-neutral-700 tracking-tight mt-0.5">
                SATHYAMANGALAM &ndash; 638 401, ERODE DISTRICT, TAMIL NADU, INDIA
              </p>
              <p className="text-[9px] text-neutral-600 tracking-wider">
                Ph: 04295-226000 &bull; Web: www.bitsathy.ac.in &bull; Email: stay@bitsathy.ac.in
              </p>
            </div>

            {/* Right Organization Crest / Club Emblem */}
            <div className="w-16 h-16 flex-shrink-0 flex flex-col items-center justify-center border-2 border-black rounded-full font-bold text-[11px] text-black bg-neutral-50 text-center leading-none">
              <span>CODE</span>
              <span>CIRCLE</span>
            </div>
          </div>

          <div className="w-full border-t border-black my-1.5" />

          {/* Sub-Header & Designation */}
          <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider px-2 py-0.5 bg-neutral-100 border border-black">
            <span>DEPARTMENT / CLUB: {data.clubName || 'CODE CIRCLE'}</span>
            <span>ACADEMIC YEAR: {data.academicYear || '2025-2026'}</span>
          </div>

          <h2 className="text-base sm:text-lg font-black tracking-wider uppercase text-black mt-2 underline decoration-2 underline-offset-4">
            Official Event Completion &amp; Documentation Report
          </h2>
        </header>

        {/* ══════════════════════════════════════════════════════════════
            SECTION 1: BASIC INFORMATION TABLE
        ══════════════════════════════════════════════════════════════ */}
        <section className="mb-6">
          <h3 className="text-xs font-bold uppercase tracking-wider border-b border-black pb-1 mb-2 bg-neutral-200 px-2 py-1">
            1. Basic Event Information
          </h3>
          <table className="w-full border-collapse border border-black text-xs">
            <tbody>
              <tr>
                <td className="border border-black font-bold p-1.5 w-1/4 bg-neutral-50">Event Name / Title</td>
                <td className="border border-black p-1.5 w-3/4 font-semibold">
                  {typeof data.eventId === 'object' && data.eventId?.title
                    ? data.eventId.title
                    : 'Institutional Event Report'}
                </td>
              </tr>
              <tr>
                <td className="border border-black font-bold p-1.5 bg-neutral-50">Club / Cell / Forum</td>
                <td className="border border-black p-1.5">{data.clubName}</td>
              </tr>
              <tr>
                <td className="border border-black font-bold p-1.5 bg-neutral-50">Category of Event</td>
                <td className="border border-black p-1.5">{data.eventCategory}</td>
              </tr>
              <tr>
                <td className="border border-black font-bold p-1.5 bg-neutral-50">Date of Conduct</td>
                <td className="border border-black p-1.5">{formatDate(data.date)}</td>
              </tr>
              <tr>
                <td className="border border-black font-bold p-1.5 bg-neutral-50">Venue / Platform</td>
                <td className="border border-black p-1.5">{data.venue}</td>
              </tr>
              <tr>
                <td className="border border-black font-bold p-1.5 bg-neutral-50">Academic Year</td>
                <td className="border border-black p-1.5">{data.academicYear}</td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            SECTION 2: CORE TEXT (OBJECTIVE & OUTCOME)
        ══════════════════════════════════════════════════════════════ */}
        <section className="mb-6">
          <h3 className="text-xs font-bold uppercase tracking-wider border-b border-black pb-1 mb-2 bg-neutral-200 px-2 py-1">
            2. Core Objectives &amp; Expected Outcomes
          </h3>
          
          <div className="space-y-3 text-xs">
            <div className="border border-black p-2.5 bg-white">
              <span className="font-bold underline uppercase block mb-1">2.1 Objective of the Event:</span>
              <p className="whitespace-pre-wrap leading-relaxed text-neutral-900">
                {data.objective || 'Not specified'}
              </p>
            </div>

            <div className="border border-black p-2.5 bg-white">
              <span className="font-bold underline uppercase block mb-1">2.2 Attained Learning Outcomes:</span>
              <p className="whitespace-pre-wrap leading-relaxed text-neutral-900">
                {data.outcome || 'Not specified'}
              </p>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            SECTION 3: DETAILED SUMMARY
        ══════════════════════════════════════════════════════════════ */}
        <section className="mb-6">
          <h3 className="text-xs font-bold uppercase tracking-wider border-b border-black pb-1 mb-2 bg-neutral-200 px-2 py-1">
            3. Detailed Event Summary &amp; Methodology
          </h3>

          <div className="space-y-3 text-xs">
            {data.eventOverview && (
              <div className="border border-black p-2.5">
                <span className="font-bold underline uppercase block mb-1">3.1 Executive Overview:</span>
                <p className="whitespace-pre-wrap leading-relaxed text-neutral-900">
                  {data.eventOverview}
                </p>
              </div>
            )}

            {strategies.length > 0 && (
              <div className="border border-black p-2.5">
                <span className="font-bold underline uppercase block mb-1">3.2 Pedagogical Strategies &amp; Methodology:</span>
                <ul className="list-disc list-inside space-y-1 pl-1 text-neutral-900">
                  {strategies.map((item, idx) => (
                    <li key={idx} className="leading-snug">{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {activities.length > 0 && (
              <div className="border border-black p-2.5">
                <span className="font-bold underline uppercase block mb-1">3.3 Key Activities &amp; Practical Sessions Conducted:</span>
                <ul className="list-disc list-inside space-y-1 pl-1 text-neutral-900">
                  {activities.map((item, idx) => (
                    <li key={idx} className="leading-snug">{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {accomplishments.length > 0 && (
              <div className="border border-black p-2.5">
                <span className="font-bold underline uppercase block mb-1">3.4 Tangible Accomplishments &amp; Milestones:</span>
                <ul className="list-disc list-inside space-y-1 pl-1 text-neutral-900">
                  {accomplishments.map((item, idx) => (
                    <li key={idx} className="leading-snug">{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {takeaways.length > 0 && (
              <div className="border border-black p-2.5">
                <span className="font-bold underline uppercase block mb-1">3.5 Participant Takeaways &amp; Feedback Highlights:</span>
                <ul className="list-disc list-inside space-y-1 pl-1 text-neutral-900">
                  {takeaways.map((item, idx) => (
                    <li key={idx} className="leading-snug">{item}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            SECTION 4: EVIDENCE & AUDIT ATTACHMENTS (Direct <img> tags)
        ══════════════════════════════════════════════════════════════ */}
        <section className="mb-6 page-break-after">
          <h3 className="text-xs font-bold uppercase tracking-wider border-b border-black pb-1 mb-2 bg-neutral-200 px-2 py-1">
            4. Documentary Evidence &amp; Compliance Records
          </h3>

          <div className="space-y-4 text-xs">
            {/* 4.1 Circular */}
            <div className="border border-black p-3">
              <span className="font-bold uppercase block mb-2 underline">
                4.1 Official Circular / Administrative Approval:
              </span>
              {data.circularUrl && data.circularUrl.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {data.circularUrl.map((url, idx) => (
                    <div key={idx} className="border border-neutral-300 p-1 flex flex-col items-center">
                      <img
                        src={url}
                        alt={`Circular Page ${idx + 1}`}
                        className="max-h-[220px] w-auto object-contain"
                      />
                      <span className="text-[10px] text-neutral-600 mt-1 italic">
                        Circular Annexure {idx + 1}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="italic text-neutral-500">No circular copy attached.</p>
              )}
            </div>

            {/* 4.2 Brochure */}
            <div className="border border-black p-3">
              <span className="font-bold uppercase block mb-2 underline">
                4.2 Event Brochure &amp; Schedule Leaflet:
              </span>
              {data.brochureUrl && data.brochureUrl.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {data.brochureUrl.map((url, idx) => (
                    <div key={idx} className="border border-neutral-300 p-1 flex flex-col items-center">
                      <img
                        src={url}
                        alt={`Brochure Page ${idx + 1}`}
                        className="max-h-[220px] w-auto object-contain"
                      />
                      <span className="text-[10px] text-neutral-600 mt-1 italic">
                        Brochure Leaflet {idx + 1}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="italic text-neutral-500">No brochure copy attached.</p>
              )}
            </div>

            {/* 4.3 Geo-Tagged Photographs */}
            <div className="border border-black p-3">
              <span className="font-bold uppercase block mb-2 underline">
                4.3 Geo-Tagged Photographs of Live Event:
              </span>
              {data.geoPhotoUrl && data.geoPhotoUrl.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {data.geoPhotoUrl.map((url, idx) => (
                    <div key={idx} className="border border-neutral-300 p-1 flex flex-col items-center">
                      <img
                        src={url}
                        alt={`Geo-tagged Photograph ${idx + 1}`}
                        className="max-h-[220px] w-auto object-contain"
                      />
                      <span className="text-[10px] text-neutral-600 mt-1 italic">
                        Geo-Photo Record #{idx + 1} &bull; Bannari Amman Institute of Technology
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="italic text-neutral-500">No geo-tagged photographs attached.</p>
              )}
            </div>

            {/* 4.4 Feedback Summary */}
            <div className="border border-black p-3">
              <span className="font-bold uppercase block mb-2 underline">
                4.4 Participant Feedback Analysis / Attendance Proof:
              </span>
              {data.feedbackUrl && data.feedbackUrl.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {data.feedbackUrl.map((url, idx) => (
                    <div key={idx} className="border border-neutral-300 p-1 flex flex-col items-center">
                      <img
                        src={url}
                        alt={`Feedback Analysis ${idx + 1}`}
                        className="max-h-[220px] w-auto object-contain"
                      />
                      <span className="text-[10px] text-neutral-600 mt-1 italic">
                        Feedback Chart / Sign-off {idx + 1}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="italic text-neutral-500">No feedback summary attached.</p>
              )}
            </div>

            {/* 4.5 Bill Settlement Copy */}
            <div className="border border-black p-3">
              <span className="font-bold uppercase block mb-2 underline">
                4.5 Bill Settlement &amp; Financial Statement Copy:
              </span>
              {data.billSettlementUrl && data.billSettlementUrl.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {data.billSettlementUrl.map((url, idx) => (
                    <div key={idx} className="border border-neutral-300 p-1 flex flex-col items-center">
                      <img
                        src={url}
                        alt={`Bill Statement ${idx + 1}`}
                        className="max-h-[220px] w-auto object-contain"
                      />
                      <span className="text-[10px] text-neutral-600 mt-1 italic">
                        Settlement Voucher / Bill Copy {idx + 1}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="italic text-neutral-500">No bill settlement copy attached.</p>
              )}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            SECTION 5: SIGNATURE & OFFICIAL APPROVAL MATRIX
        ══════════════════════════════════════════════════════════════ */}
        <section className="mt-8 pt-4 border-t-2 border-black">
          <div className="grid grid-cols-3 gap-6 text-center text-xs">
            {/* Student Lead */}
            <div className="flex flex-col justify-end items-center h-28 border-t border-dashed border-neutral-500 pt-2">
              <span className="font-bold uppercase">Student Coordinator</span>
              <span className="text-[11px] text-neutral-600">
                {data.createdBy?.name || 'Authorized Student Lead'}
              </span>
              <span className="text-[10px] text-neutral-500">
                {data.createdBy?.rollNo ? `Roll No: ${data.createdBy.rollNo}` : 'Code Circle Core Team'}
              </span>
            </div>

            {/* Faculty Advisor */}
            <div className="flex flex-col justify-end items-center h-28 border-t border-dashed border-neutral-500 pt-2">
              <span className="font-bold uppercase">Faculty Advisor / In-Charge</span>
              <span className="text-[11px] text-neutral-600">Department of Computer Science</span>
              <span className="text-[10px] text-neutral-500">Bannari Amman Institute of Technology</span>
            </div>

            {/* HoD / Dean */}
            <div className="flex flex-col justify-end items-center h-28 border-t border-dashed border-neutral-500 pt-2">
              <span className="font-bold uppercase">Head of the Department / Dean</span>
              <span className="text-[11px] text-neutral-600">Academic &amp; Student Affairs</span>
              <span className="text-[10px] text-neutral-500">Official Institutional Seal</span>
            </div>
          </div>

          <div className="text-center text-[10px] text-neutral-500 mt-6 pt-2 border-t border-neutral-300">
            Document generated and authenticated electronically through Code Circle Portal &bull; Bannari Amman Institute of Technology &bull; Sathyamangalam
          </div>
        </section>
      </div>
    );
  }
);

OfficialReportTemplate.displayName = 'OfficialReportTemplate';

export default OfficialReportTemplate;
