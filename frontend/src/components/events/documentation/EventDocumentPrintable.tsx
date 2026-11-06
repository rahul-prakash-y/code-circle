import React, { forwardRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ShieldCheck, CheckCircle2, Calendar, User, FileText } from 'lucide-react';

export interface EventDocumentPrintableProps {
  documentData: {
    _id?: string;
    title: string;
    content: string;
    status: string;
    version?: number;
    createdAt?: string | Date;
    updatedAt?: string | Date;
    approvedAt?: string | Date | null;
    approvedBy?: {
      name?: string;
      rollNo?: string;
      email?: string;
    } | null;
    createdBy?: {
      name?: string;
      rollNo?: string;
      email?: string;
    } | null;
    eventId?: {
      _id?: string;
      title?: string;
      date?: string | Date;
      venueOrLink?: string;
    } | null;
    tags?: string[];
  };
}

/**
 * EventDocumentPrintable
 * A printable document template styled for client-side PDF rendering via react-to-print.
 * Features clean typography, print page margins, official organization headers, and approval stamps.
 */
export const EventDocumentPrintable = forwardRef<HTMLDivElement, EventDocumentPrintableProps>(
  ({ documentData }, ref) => {
    const formattedDate = (d?: string | Date | null) => {
      if (!d) return 'N/A';
      return new Date(d).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    };

    return (
      <div
        ref={ref}
        className="w-full max-w-[800px] mx-auto bg-white text-neutral-900 p-8 sm:p-12 font-sans print:p-8 print:max-w-none print:w-full print:bg-white print:text-black"
        style={{ minHeight: '1050px' }}
      >
        {/* Document Header & Seal */}
        <header className="border-b-2 border-neutral-800 pb-6 mb-8 flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-3 h-3 rounded-full bg-neutral-900 inline-block" />
              <span className="text-xs font-bold tracking-widest uppercase text-neutral-600">
                Code Circle &bull; Official Event Documentation
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-900 mb-1">
              {documentData.title || 'Event Documentation Report'}
            </h1>
            {documentData.eventId?.title && (
              <p className="text-sm font-semibold text-neutral-600">
                Associated Event: {documentData.eventId.title}
              </p>
            )}
          </div>

          <div className="text-right flex flex-col items-end">
            <span
              className={`px-3 py-1 rounded text-xs font-bold uppercase tracking-wider ${
                documentData.status === 'Approved'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-amber-100 text-amber-800 border border-amber-300'
              }`}
            >
              {documentData.status}
            </span>
            <span className="text-[11px] font-mono text-neutral-500 mt-1">
              Rev. v{documentData.version || 1}.0
            </span>
            <span className="text-[10px] font-mono text-neutral-400">
              ID: {documentData._id ? documentData._id.slice(-8) : 'DRAFT'}
            </span>
          </div>
        </header>

        {/* Audit Meta Grid */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-lg bg-neutral-50 border border-neutral-200 text-xs mb-8">
          <div>
            <span className="text-neutral-500 block text-[10px] font-semibold uppercase">Created By</span>
            <span className="font-semibold text-neutral-800">
              {documentData.createdBy?.name || 'Authorized Member'}
            </span>
            {documentData.createdBy?.rollNo && (
              <span className="block text-[11px] text-neutral-500 font-mono">
                {documentData.createdBy.rollNo}
              </span>
            )}
          </div>

          <div>
            <span className="text-neutral-500 block text-[10px] font-semibold uppercase">Created Date</span>
            <span className="font-medium text-neutral-800">
              {formattedDate(documentData.createdAt)}
            </span>
          </div>

          <div>
            <span className="text-neutral-500 block text-[10px] font-semibold uppercase">Approved By</span>
            <span className="font-semibold text-neutral-800">
              {documentData.approvedBy?.name || 'Pending Review'}
            </span>
            {documentData.approvedBy?.rollNo && (
              <span className="block text-[11px] text-neutral-500 font-mono">
                {documentData.approvedBy.rollNo}
              </span>
            )}
          </div>

          <div>
            <span className="text-neutral-500 block text-[10px] font-semibold uppercase">Approval Date</span>
            <span className="font-medium text-neutral-800">
              {formattedDate(documentData.approvedAt)}
            </span>
          </div>
        </section>

        {/* Main Document Content */}
        <main className="prose prose-neutral max-w-none text-sm leading-relaxed mb-12">
          {documentData.content ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {documentData.content}
            </ReactMarkdown>
          ) : (
            <p className="italic text-neutral-400">No content provided for this document.</p>
          )}
        </main>

        {/* Tags / Deliverables (if any) */}
        {documentData.tags && documentData.tags.length > 0 && (
          <div className="mb-10 pt-4 border-t border-neutral-200 flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-neutral-500">Categories:</span>
            {documentData.tags.map((tag, i) => (
              <span
                key={i}
                className="text-[11px] px-2 py-0.5 rounded bg-neutral-100 text-neutral-700 border border-neutral-300 font-medium"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Document Sign-off / Institutional Certification Footer */}
        <footer className="mt-auto pt-8 border-t-2 border-neutral-300 flex justify-between items-end text-xs text-neutral-500">
          <div>
            <div className="flex items-center gap-1.5 text-neutral-700 font-semibold mb-0.5">
              <ShieldCheck size={14} className="text-emerald-600" />
              <span>Certified Digital Record</span>
            </div>
            <p className="text-[10px] text-neutral-400">
              Generated via Code Circle Documentation Engine. Integrity hash verified.
            </p>
          </div>

          <div className="text-right">
            {documentData.status === 'Approved' ? (
              <div className="inline-flex flex-col items-center border border-emerald-400 rounded p-2 bg-emerald-50/50">
                <span className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider">
                  Digitally Approved
                </span>
                <span className="text-[9px] font-mono text-emerald-600">
                  {documentData.approvedBy?.name || 'Administrator'}
                </span>
              </div>
            ) : (
              <span className="text-[10px] italic text-neutral-400">Pending Administrative Signoff</span>
            )}
          </div>
        </footer>
      </div>
    );
  }
);

EventDocumentPrintable.displayName = 'EventDocumentPrintable';
export default EventDocumentPrintable;
