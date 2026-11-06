import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  Download,
  Eye,
  Edit2,
  Trash2,
  Sparkles,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import toast from 'react-hot-toast';
import { EmilCard, EmilButton } from '../../ui/emil-ui';
import EventDocumentEditor from './EventDocumentEditor';
import EventDocumentAdminReview from './EventDocumentAdminReview';
import EventDocumentPrintable from './EventDocumentPrintable';
import api from '../../../lib/axios';
import useAuthStore from '../../../store/useAuthStore';

export interface EventDocumentationHubProps {
  eventId?: string;
  eventTitle?: string;
  eventsList?: any[];
  className?: string;
}

export const EventDocumentationHub: React.FC<EventDocumentationHubProps> = ({
  eventId,
  eventTitle,
  eventsList = [],
  className = '',
}) => {
  const { user } = useAuthStore() as any;
  const isAdminOrFaculty = ['Admin', 'SuperAdmin', 'Faculty'].includes(user?.role);

  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Active view: 'list' | 'create' | 'edit' | 'review'
  const [currentView, setCurrentView] = useState<'list' | 'create' | 'edit' | 'review'>('list');
  const [activeDoc, setActiveDoc] = useState<any | null>(null);

  // Hidden print reference for quick download from the list view
  const [quickPrintDoc, setQuickPrintDoc] = useState<any | null>(null);
  const quickPrintRef = useRef<HTMLDivElement>(null);

  const handleQuickDownloadPdf = useReactToPrint({
    contentRef: quickPrintRef,
    documentTitle: quickPrintDoc ? `${quickPrintDoc.title.replace(/[^a-zA-Z0-9_-]/g, '_')}_Official_Doc` : 'Document',
  });

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const res = await api.get('/docs', {
        params: {
          eventId: eventId && eventId !== 'all' ? eventId : undefined,
          status: selectedStatus !== 'all' ? selectedStatus : undefined,
          search: searchQuery.trim() || undefined,
        },
      });
      setDocuments(res.data.data || []);
    } catch (err: any) {
      console.error('Failed to fetch event documents:', err);
      toast.error('Failed to load documentation');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [eventId, selectedStatus]);

  const handleDelete = async (docId: string) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    try {
      await api.delete(`/docs/${docId}`);
      toast.success('Document deleted');
      setDocuments((prev) => prev.filter((d) => d._id !== docId));
      if (activeDoc?._id === docId) {
        setCurrentView('list');
        setActiveDoc(null);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to delete');
    }
  };

  const triggerQuickDownload = (doc: any) => {
    setQuickPrintDoc(doc);
    setTimeout(() => {
      handleQuickDownloadPdf();
    }, 50);
  };

  return (
    <div className={`w-full space-y-6 ${className}`}>
      {/* Hidden printable target */}
      {quickPrintDoc && (
        <div style={{ display: 'none' }}>
          <EventDocumentPrintable ref={quickPrintRef} documentData={quickPrintDoc} />
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          VIEW 1: CREATE OR EDIT SCREEN
          ══════════════════════════════════════════════════════════════ */}
      {currentView === 'create' || currentView === 'edit' ? (
        <EventDocumentEditor
          eventId={eventId}
          eventTitle={eventTitle}
          eventsList={eventsList}
          initialDocument={currentView === 'edit' ? activeDoc : undefined}
          onSaved={() => {
            fetchDocuments();
            setCurrentView('list');
            setActiveDoc(null);
          }}
          onCancel={() => {
            setCurrentView('list');
            setActiveDoc(null);
          }}
        />
      ) : currentView === 'review' && activeDoc ? (
        /* ══════════════════════════════════════════════════════════════
           VIEW 2: ADMIN SPLIT-SCREEN REVIEW PANEL
           ══════════════════════════════════════════════════════════════ */
        <EventDocumentAdminReview
          documentData={activeDoc}
          onStatusUpdated={(updated) => {
            setActiveDoc(updated);
            fetchDocuments();
          }}
          onClose={() => {
            setCurrentView('list');
            setActiveDoc(null);
          }}
        />
      ) : (
        /* ══════════════════════════════════════════════════════════════
           VIEW 3: DOCUMENTS LIST OVERVIEW
           ══════════════════════════════════════════════════════════════ */
        <div className="space-y-4">
          {/* Header Controls */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h3 className="text-lg font-bold text-[#1D1D1F] dark:text-[#F5F5F7] flex items-center gap-2">
                <FileText size={18} className="text-primary" />
                Event Documentation & Institutional Records
              </h3>
              <p className="text-xs text-[#86868B]">
                Generate, review, and client-side export official PDF event documentation
              </p>
            </div>

            <EmilButton
              variant="solid"
              size="md"
              onClick={() => {
                setActiveDoc(null);
                setCurrentView('create');
              }}
              className="gap-2 font-medium shadow-sm"
            >
              <Plus size={16} /> Create Documentation
            </EmilButton>
          </div>

          {/* Filter Pills & Search */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto p-1 bg-black/[0.03] dark:bg-white/[0.04] rounded-2xl border border-black/5 dark:border-white/5">
              {['all', 'Approved', 'Pending', 'Draft', 'Rejected'].map((status) => (
                <button
                  key={status}
                  onClick={() => setSelectedStatus(status)}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold capitalize transition-all select-none cursor-pointer ${
                    selectedStatus === status
                      ? 'bg-white dark:bg-white/15 text-[#1D1D1F] dark:text-white shadow-xs'
                      : 'text-[#86868B] hover:text-[#1D1D1F] dark:hover:text-white'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#86868B]" />
              <input
                type="text"
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchDocuments()}
                className="w-full h-8 pl-8 pr-3 text-xs rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] text-[#1D1D1F] dark:text-white focus:outline-none focus:ring-1 focus:ring-primary/40"
              />
            </div>
          </div>

          {/* Documents Grid */}
          {loading ? (
            <div className="p-12 text-center text-xs text-[#86868B]">Loading documentation...</div>
          ) : documents.length === 0 ? (
            <EmilCard className="p-8 text-center rounded-3xl border border-dashed border-black/10 dark:border-white/10">
              <FileText size={32} className="mx-auto mb-2 text-[#86868B] opacity-50" />
              <p className="text-sm font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] mb-1">
                No documentation reports found
              </p>
              <p className="text-xs text-[#86868B] mb-4">
                Draft a new document to record event outcomes, metrics, and summary data.
              </p>
              <EmilButton
                variant="flat"
                size="sm"
                onClick={() => setCurrentView('create')}
                className="gap-1.5"
              >
                <Plus size={14} /> Draft First Document
              </EmilButton>
            </EmilCard>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {documents.map((d) => {
                const statusBadge = {
                  Approved: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
                  Pending: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
                  Draft: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
                  Rejected: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
                }[d.status as string] || 'bg-neutral-500/10 text-neutral-400 border-neutral-500/20';

                return (
                  <EmilCard
                    key={d._id}
                    className="p-5 rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#161617] shadow-sm flex flex-col justify-between hover:border-black/20 dark:hover:border-white/20 transition-all"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-[10px] font-mono font-semibold text-[#86868B]">
                          v{d.version || 1}.0 &bull; {new Date(d.createdAt).toLocaleDateString()}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${statusBadge}`}>
                          {d.status}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-[#1D1D1F] dark:text-[#F5F5F7] mb-1.5 line-clamp-1">
                        {d.title}
                      </h4>

                      <p className="text-xs text-[#86868B] line-clamp-2 mb-3">
                        {d.content?.replace(/#+\s/g, '').substring(0, 140) || 'No summary available.'}
                      </p>

                      <div className="text-[11px] text-[#86868B] flex items-center justify-between pt-2 border-t border-black/5 dark:border-white/5">
                        <span>By {d.createdBy?.name || 'Member'}</span>
                        {d.approvedBy && (
                          <span className="text-emerald-500 flex items-center gap-1">
                            <CheckCircle2 size={12} /> Approved
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="flex items-center justify-between gap-2 pt-3 mt-3 border-t border-black/5 dark:border-white/5">
                      <div className="flex items-center gap-1">
                        <EmilButton
                          variant="ghost"
                          size="sm"
                          isIconOnly
                          title="Edit"
                          onClick={() => {
                            setActiveDoc(d);
                            setCurrentView('edit');
                          }}
                        >
                          <Edit2 size={13} />
                        </EmilButton>

                        {(isAdminOrFaculty || d.createdBy?._id === user?._id) && (
                          <EmilButton
                            variant="ghost"
                            size="sm"
                            isIconOnly
                            title="Delete"
                            onClick={() => handleDelete(d._id)}
                            className="hover:text-red-500"
                          >
                            <Trash2 size={13} />
                          </EmilButton>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {isAdminOrFaculty && (
                          <EmilButton
                            variant="flat"
                            size="sm"
                            onClick={() => {
                              setActiveDoc(d);
                              setCurrentView('review');
                            }}
                            className="gap-1 text-xs"
                          >
                            <Eye size={13} /> Review
                          </EmilButton>
                        )}

                        {d.status === 'Approved' && (
                          <EmilButton
                            variant="solid"
                            size="sm"
                            onClick={() => triggerQuickDownload(d)}
                            className="gap-1.5 text-xs bg-blue-600 hover:bg-blue-500 text-white"
                          >
                            <Download size={13} /> PDF
                          </EmilButton>
                        )}
                      </div>
                    </div>
                  </EmilCard>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EventDocumentationHub;
