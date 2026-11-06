import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Code,
  Quote,
  Eye,
  Columns,
  Edit3,
  Save,
  Send,
  Sparkles,
  FileText,
  Tag,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { EmilCard, EmilButton } from '../../ui/emil-ui';
import api from '../../../lib/axios';

export interface EventDocumentEditorProps {
  eventId?: string;
  eventTitle?: string;
  eventsList?: any[];
  initialDocument?: {
    _id?: string;
    eventId?: any;
    title?: string;
    content?: string;
    status?: string;
    tags?: string[];
  };
  onSaved?: (doc: any) => void;
  onCancel?: () => void;
}

export const EventDocumentEditor: React.FC<EventDocumentEditorProps> = ({
  eventId,
  eventTitle,
  eventsList = [],
  initialDocument,
  onSaved,
  onCancel,
}) => {
  const [targetEventId, setTargetEventId] = useState<string>(
    eventId || (typeof initialDocument?.eventId === 'object' ? initialDocument.eventId?._id : initialDocument?.eventId) || ''
  );
  const [title, setTitle] = useState(
    initialDocument?.title || (eventTitle ? `${eventTitle} - Event Report` : '')
  );
  const [content, setContent] = useState(
    initialDocument?.content ||
      `# Executive Summary\n\nProvide an overview of the event objectives, outcomes, and attendance.\n\n## Key Highlights\n- Point 1\n- Point 2\n\n## Assessment Results & Metrics\nSummary of student performance and engagement.\n\n## Recommendations & Learnings\nFuture improvements for upcoming editions.`
  );
  const [tagsInput, setTagsInput] = useState(initialDocument?.tags?.join(', ') || 'Documentation, Event Report');
  const [viewMode, setViewMode] = useState<'edit' | 'split' | 'preview'>('split');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Markdown formatting helpers
  const insertFormatting = (prefix: string, suffix: string = '') => {
    const textarea = document.getElementById('markdown-editor-area') as HTMLTextAreaElement | null;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = content.substring(start, end);
    const replacement = `${prefix}${selected || 'text'}${suffix}`;

    const newContent = content.substring(0, start) + replacement + content.substring(end);
    setContent(newContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + (selected.length || 4));
    }, 10);
  };

  const handleSave = async (targetStatus: 'Draft' | 'Pending') => {
    if (!targetEventId) {
      toast.error('Please select an event for this documentation');
      return;
    }
    if (!title.trim()) {
      toast.error('Document title is required');
      return;
    }
    if (!content.trim()) {
      toast.error('Document content cannot be empty');
      return;
    }

    setIsSubmitting(true);
    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    try {
      let res;
      if (initialDocument?._id) {
        // Update existing document
        res = await api.put(`/docs/${initialDocument._id}`, {
          title,
          content,
          status: targetStatus,
          tags,
        });
      } else {
        // Create new document
        res = await api.post('/docs', {
          eventId: targetEventId,
          title,
          content,
          status: targetStatus,
          tags,
        });
      }

      toast.success(
        targetStatus === 'Pending'
          ? 'Submitted for Admin Review!'
          : 'Document saved as draft.'
      );
      onSaved?.(res.data.data);
    } catch (err: any) {
      console.error('Failed to save document:', err);
      toast.error(err.response?.data?.error || 'Failed to save document');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <EmilCard className="w-full max-w-5xl mx-auto p-4 sm:p-6 rounded-3xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#161617] shadow-xl overflow-hidden">
      {/* Top Bar: Title & View Mode Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-black/5 dark:border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
            <FileText size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#1D1D1F] dark:text-[#F5F5F7]">
              Event Documentation Generator
            </h2>
            <p className="text-xs text-[#86868B]">
              Author and format structured documentation reports for institutional approval
            </p>
          </div>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-1 p-1 bg-black/5 dark:bg-white/5 rounded-xl border border-black/5 dark:border-white/10">
          <button
            type="button"
            onClick={() => setViewMode('edit')}
            className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
              viewMode === 'edit'
                ? 'bg-white dark:bg-white/15 text-[#1D1D1F] dark:text-white shadow-xs'
                : 'text-[#86868B] hover:text-[#1D1D1F] dark:hover:text-white'
            }`}
          >
            <Edit3 size={13} /> Edit
          </button>
          <button
            type="button"
            onClick={() => setViewMode('split')}
            className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
              viewMode === 'split'
                ? 'bg-white dark:bg-white/15 text-[#1D1D1F] dark:text-white shadow-xs'
                : 'text-[#86868B] hover:text-[#1D1D1F] dark:hover:text-white'
            }`}
          >
            <Columns size={13} /> Split
          </button>
          <button
            type="button"
            onClick={() => setViewMode('preview')}
            className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
              viewMode === 'preview'
                ? 'bg-white dark:bg-white/15 text-[#1D1D1F] dark:text-white shadow-xs'
                : 'text-[#86868B] hover:text-[#1D1D1F] dark:hover:text-white'
            }`}
          >
            <Eye size={13} /> Preview
          </button>
        </div>
      </div>

      {/* Meta Input Fields: Title & Tags */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 my-4">
        {!eventId && eventsList.length > 0 && (
          <div className="md:col-span-3">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#86868B] mb-1">
              Select Event
            </label>
            <select
              value={targetEventId}
              onChange={(e) => setTargetEventId(e.target.value)}
              className="w-full h-10 px-3.5 text-sm rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] text-[#1D1D1F] dark:text-[#F5F5F7] focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
            >
              <option value="">-- Choose Target Event --</option>
              {eventsList.map((ev) => (
                <option key={ev._id} value={ev._id}>
                  {ev.title}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="md:col-span-2">
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#86868B] mb-1">
            Document Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Code Hackathon 2026 - Post-Event Documentation"
            className="w-full h-10 px-3.5 text-sm rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] text-[#1D1D1F] dark:text-[#F5F5F7] focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#86868B] mb-1">
            Tags (comma separated)
          </label>
          <input
            type="text"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="Report, Assessment, Technical"
            className="w-full h-10 px-3.5 text-sm rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] text-[#1D1D1F] dark:text-[#F5F5F7] focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
          />
        </div>
      </div>

      {/* Markdown Toolbar */}
      {viewMode !== 'preview' && (
        <div className="flex flex-wrap items-center gap-1 p-2 rounded-xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/5 dark:border-white/5 mb-3 text-[#1D1D1F] dark:text-[#F5F5F7]">
          <button
            type="button"
            onClick={() => insertFormatting('**', '**')}
            title="Bold"
            className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-[#86868B] hover:text-[#1D1D1F] dark:hover:text-white transition-colors"
          >
            <Bold size={15} />
          </button>
          <button
            type="button"
            onClick={() => insertFormatting('*', '*')}
            title="Italic"
            className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-[#86868B] hover:text-[#1D1D1F] dark:hover:text-white transition-colors"
          >
            <Italic size={15} />
          </button>
          <button
            type="button"
            onClick={() => insertFormatting('# ')}
            title="Heading 1"
            className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-[#86868B] hover:text-[#1D1D1F] dark:hover:text-white transition-colors"
          >
            <Heading1 size={15} />
          </button>
          <button
            type="button"
            onClick={() => insertFormatting('## ')}
            title="Heading 2"
            className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-[#86868B] hover:text-[#1D1D1F] dark:hover:text-white transition-colors"
          >
            <Heading2 size={15} />
          </button>
          <span className="w-px h-4 bg-black/10 dark:bg-white/10 mx-1" />
          <button
            type="button"
            onClick={() => insertFormatting('- ')}
            title="Bullet List"
            className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-[#86868B] hover:text-[#1D1D1F] dark:hover:text-white transition-colors"
          >
            <List size={15} />
          </button>
          <button
            type="button"
            onClick={() => insertFormatting('1. ')}
            title="Numbered List"
            className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-[#86868B] hover:text-[#1D1D1F] dark:hover:text-white transition-colors"
          >
            <ListOrdered size={15} />
          </button>
          <button
            type="button"
            onClick={() => insertFormatting('`', '`')}
            title="Code"
            className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-[#86868B] hover:text-[#1D1D1F] dark:hover:text-white transition-colors"
          >
            <Code size={15} />
          </button>
          <button
            type="button"
            onClick={() => insertFormatting('> ')}
            title="Quote"
            className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-[#86868B] hover:text-[#1D1D1F] dark:hover:text-white transition-colors"
          >
            <Quote size={15} />
          </button>
        </div>
      )}

      {/* Editor & Preview Workspaces */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[420px]">
        {/* Editor Pane */}
        {viewMode !== 'preview' && (
          <div className={`${viewMode === 'split' ? 'col-span-1' : 'col-span-2 md:col-span-2'} h-full flex flex-col`}>
            <textarea
              id="markdown-editor-area"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your event documentation here in Markdown..."
              className="w-full flex-1 p-4 font-mono text-xs sm:text-sm rounded-2xl border border-black/10 dark:border-white/10 bg-[#FAFAFA] dark:bg-[#0D0D0E] text-[#1D1D1F] dark:text-[#F5F5F7] resize-none focus:outline-none focus:ring-2 focus:ring-primary/40 leading-relaxed overflow-y-auto"
            />
          </div>
        )}

        {/* Live Preview Pane */}
        {viewMode !== 'edit' && (
          <div className={`${viewMode === 'split' ? 'col-span-1' : 'col-span-2 md:col-span-2'} h-full p-5 rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#111112] overflow-y-auto`}>
            <div className="text-[11px] uppercase tracking-wider font-semibold text-[#86868B] mb-3 pb-2 border-b border-black/5 dark:border-white/5">
              Live Markdown Preview
            </div>
            <div className="prose dark:prose-invert prose-sm max-w-none text-[#1D1D1F] dark:text-[#E5E5EA] leading-relaxed">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {content || '*No content to preview*'}
              </ReactMarkdown>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Actions Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-5 mt-4 border-t border-black/5 dark:border-white/10">
        <div className="text-xs text-[#86868B] flex items-center gap-2">
          <span>{content.split(/\s+/).filter(Boolean).length} words</span>
          <span>&bull;</span>
          <span>{content.length} characters</span>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {onCancel && (
            <EmilButton
              variant="flat"
              size="md"
              onClick={onCancel}
              disabled={isSubmitting}
              className="flex-1 sm:flex-initial"
            >
              Cancel
            </EmilButton>
          )}

          <EmilButton
            variant="outline"
            size="md"
            onClick={() => handleSave('Draft')}
            isLoading={isSubmitting}
            className="flex-1 sm:flex-initial gap-1.5"
          >
            <Save size={15} /> Save Draft
          </EmilButton>

          <EmilButton
            variant="solid"
            size="md"
            onClick={() => handleSave('Pending')}
            isLoading={isSubmitting}
            className="flex-1 sm:flex-initial gap-1.5 font-semibold"
          >
            <Send size={15} /> Submit for Review
          </EmilButton>
        </div>
      </div>
    </EmilCard>
  );
};

export default EventDocumentEditor;
