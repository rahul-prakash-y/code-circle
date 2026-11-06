import React, { useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useReactToPrint } from 'react-to-print';
import {
  CheckCircle,
  XCircle,
  Download,
  ShieldCheck,
  Clock,
  User,
  Calendar,
  AlertCircle,
  FileCheck2,
  Share2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { EmilCard, EmilButton } from '../../ui/emil-ui';
import EventDocumentPrintable from './EventDocumentPrintable';
import api from '../../../lib/axios';

export interface EventDocumentAdminReviewProps {
  documentData: {
    _id: string;
    eventId?: any;
    title: string;
    content: string;
    status: 'Draft' | 'Pending' | 'Approved' | 'Rejected';
    approvedBy?: any;
    approvedAt?: string | Date | null;
    createdBy?: any;
    version?: number;
    rejectionReason?: string;
    tags?: string[];
    createdAt?: string | Date;
    updatedAt?: string | Date;
  };
  onStatusUpdated?: (updatedDoc: any) => void;
  onClose?: () => void;
}

export const EventDocumentAdminReview: React.FC<EventDocumentAdminReviewProps> = ({
  documentData: initialDoc,
  onStatusUpdated,
  onClose,
}) => {
  const [doc, setDoc] = useState(initialDoc);
  const [rejectionFeedback, setRejectionFeedback] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Hidden Ref for Client-Side PDF Generation via react-to-print
  const printableRef = useRef<HTMLDivElement>(null);

  const handleDownloadPdf = useReactToPrint({
    contentRef: printableRef,
    documentTitle: `${doc.title.replace(/[^a-zA-Z0-9_-]/g, '_')}_Official_Doc`,
  });

  const handleApprove = async () => {
    setIsProcessing(true);
    try {
      const res = await api.patch(`/docs/${doc._id}/approve`);
      setDoc(res.data.data);
      toast.success('Document approved successfully!');
      onStatusUpdated?.(res.data.data);
    } catch (err: any) {
      console.error('Approval failed:', err);
      toast.error(err.response?.data?.error || 'Failed to approve document');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionFeedback.trim()) {
      setShowRejectInput(true);
      toast('Please provide a reason or revision note for rejection', {
        icon: '⚠️',
      });
      return;
    }

    setIsProcessing(true);
    try {
      const res = await api.patch(`/docs/${doc._id}/reject`, {
        rejectionReason: rejectionFeedback.trim(),
      });
      setDoc(res.data.data);
      setShowRejectInput(false);
      toast.error('Document rejected with feedback.');
      onStatusUpdated?.(res.data.data);
    } catch (err: any) {
      console.error('Rejection failed:', err);
      toast.error(err.response?.data?.error || 'Failed to reject document');
    } finally {
      setIsProcessing(false);
    }
  };

  const statusColors = {
    Approved: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    Pending: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    Draft: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    Rejected: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
  }[doc.status] || 'bg-neutral-500/10 text-neutral-400 border-neutral-500/20';

  return (
    <div className="w-full max-w-6xl mx-auto space-y-4">
      {/* Hidden printable markup rendered purely in the DOM for react-to-print */}
      <div style={{ display: 'none' }}>
        <EventDocumentPrintable ref={printableRef} documentData={doc} />
      </div>

      {/* Split-Screen Review Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* ══════════════════════════════════════════════════════════════
            LEFT SIDE: Drafted Content View (7 Columns)
            ══════════════════════════════════════════════════════════════ */}
        <div className="lg:col-span-7 flex flex-col">
          <EmilCard className="flex-1 p-6 sm:p-8 rounded-3xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#161617] shadow-lg flex flex-col h-[650px] overflow-hidden">
            {/* Header info */}
            <div className="pb-4 mb-4 border-b border-black/5 dark:border-white/10">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[11px] uppercase tracking-wider font-semibold text-[#86868B]">
                  Document Draft &bull; v{doc.version || 1}.0
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusColors}`}>
                  {doc.status}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1D1D1F] dark:text-[#F5F5F7]">
                {doc.title}
              </h2>
            </div>

            {/* Scrollable Markdown Document Viewer */}
            <div className="flex-1 overflow-y-auto pr-2 prose dark:prose-invert prose-sm max-w-none text-[#1D1D1F] dark:text-[#E5E5EA] leading-relaxed">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {doc.content || '*No content provided for this document.*'}
              </ReactMarkdown>
            </div>
          </EmilCard>
        </div>

        {/* ══════════════════════════════════════════════════════════════
            RIGHT SIDE: Admin Review Actions & Audit Controls (5 Columns)
            ══════════════════════════════════════════════════════════════ */}
        <div className="lg:col-span-5 flex flex-col space-y-4">
          <EmilCard className="p-6 rounded-3xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#161617] shadow-lg flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-black/5 dark:border-white/10">
                <ShieldCheck size={20} className="text-primary" />
                <h3 className="text-base font-bold text-[#1D1D1F] dark:text-[#F5F5F7]">
                  Administrative Decision Panel
                </h3>
              </div>

              {/* Audit Metadata Cards */}
              <div className="space-y-3 mb-6 text-xs text-[#86868B]">
                <div className="p-3 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/5 dark:border-white/5 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <User size={14} /> Author
                  </span>
                  <span className="font-semibold text-[#1D1D1F] dark:text-white">
                    {doc.createdBy?.name || 'Authorized Member'}
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/5 dark:border-white/5 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Calendar size={14} /> Created
                  </span>
                  <span className="font-semibold text-[#1D1D1F] dark:text-white">
                    {doc.createdAt ? new Date(doc.createdAt).toLocaleDateString() : 'N/A'}
                  </span>
                </div>

                {doc.approvedBy && (
                  <div className="p-3 rounded-2xl bg-emerald-500/5 border border-emerald-500/15 flex items-center justify-between text-emerald-600 dark:text-emerald-400">
                    <span className="flex items-center gap-2">
                      <FileCheck2 size={14} /> Approved By
                    </span>
                    <span className="font-semibold">
                      {doc.approvedBy.name || 'Administrator'}
                    </span>
                  </div>
                )}

                {doc.rejectionReason && (
                  <div className="p-3 rounded-2xl bg-red-500/5 border border-red-500/15 text-red-500 dark:text-red-400 space-y-1">
                    <span className="flex items-center gap-1.5 font-semibold">
                      <AlertCircle size={14} /> Rejection Reason
                    </span>
                    <p className="text-xs text-red-600/90 dark:text-red-300">
                      {doc.rejectionReason}
                    </p>
                  </div>
                )}
              </div>

              {/* Optional Rejection Reason Box */}
              {showRejectInput && (
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-red-500 mb-1.5">
                    Reason for Rejection / Revision Notes:
                  </label>
                  <textarea
                    value={rejectionFeedback}
                    onChange={(e) => setRejectionFeedback(e.target.value)}
                    placeholder="Describe needed corrections before approval..."
                    className="w-full h-20 p-2.5 text-xs rounded-xl border border-red-500/30 bg-red-500/[0.02] dark:bg-red-500/[0.05] text-[#1D1D1F] dark:text-white focus:outline-none focus:ring-1 focus:ring-red-500"
                  />
                </div>
              )}
            </div>

            {/* Actions: Approve / Reject / Client-Side PDF Generation */}
            <div className="space-y-3 pt-4 border-t border-black/5 dark:border-white/10">
              {/* Client-Side PDF Generation: Once status is "Approved", reveal "Download Document" button */}
              {doc.status === 'Approved' ? (
                <div className="space-y-2">
                  <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center mb-2">
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1.5">
                      <CheckCircle size={15} /> Document Approved & Sealed
                    </span>
                  </div>

                  <EmilButton
                    variant="solid"
                    size="lg"
                    onClick={() => handleDownloadPdf()}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold gap-2 shadow-md cursor-pointer"
                  >
                    <Download size={18} />
                    <span>Download Document (Client-Side PDF)</span>
                  </EmilButton>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {/* Approve Action (Green, tactile 0.97 scale feedback) */}
                  <EmilButton
                    variant="solid"
                    size="md"
                    onClick={handleApprove}
                    isLoading={isProcessing}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold gap-1.5 cursor-pointer shadow-sm"
                  >
                    <CheckCircle size={16} /> Approve
                  </EmilButton>

                  {/* Reject Action (Red, tactile 0.97 scale feedback) */}
                  <EmilButton
                    variant="danger"
                    size="md"
                    onClick={handleReject}
                    isLoading={isProcessing}
                    className="bg-red-600 hover:bg-red-500 text-white font-semibold gap-1.5 cursor-pointer shadow-sm"
                  >
                    <XCircle size={16} /> Reject
                  </EmilButton>
                </div>
              )}

              {onClose && (
                <EmilButton
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="w-full text-xs text-[#86868B]"
                >
                  Close Review Panel
                </EmilButton>
              )}
            </div>
          </EmilCard>
        </div>
      </div>
    </div>
  );
};

export default EventDocumentAdminReview;
