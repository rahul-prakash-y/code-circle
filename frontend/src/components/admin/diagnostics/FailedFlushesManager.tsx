import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  RotateCcw,
  Database,
  Trash2,
  RefreshCw,
  Search,
  CheckCircle2,
  Edit2,
  Copy,
  Clock,
  User as UserIcon,
  BookOpen,
  ArrowRight,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  X,
  Code2,
  Save,
  Check,
  Zap,
  FileJson,
  Upload,
  Download,
  FileUp,
  FileText,
  Layers,
  HelpCircle,
} from 'lucide-react';
import { Button } from '@heroui/react';
import toast from 'react-hot-toast';
import api from '../../../lib/axios';
import { HeroInput } from '@/components/ui/hero/HeroInput';
import useAuthStore from '../../../store/useAuthStore';
import useServerStore from '../../../store/useServerStore';

export interface FailedItemData {
  submissionId: string;
  userId: string;
  assessmentId: string;
  assessmentTitle?: string;
  error: string;
  failedAt: string | Date;
  attempts: number;
  user?: {
    id: string;
    name: string;
    email: string;
    rollNo?: string;
    department?: string;
  } | null;
  submission: {
    submissionId: string;
    userId: string;
    assessmentId: string;
    assessmentTitle?: string;
    answers?: Array<{
      questionId: string;
      selectedOption: number;
      isCorrect?: boolean;
      points?: number;
    }>;
    score: number;
    totalPoints: number;
    percentage: number;
    passed: boolean;
    pointsAwarded: number;
    timeSpentSeconds: number;
    detailedResults?: any[];
    isLate: boolean;
    submissionStatus: 'on_time' | 'late' | 'review';
    submittedAt?: string | Date;
  };
}

interface FailedFlushesManagerProps {
  onRefreshHealth?: () => void;
}

export const FailedFlushesManager: React.FC<FailedFlushesManagerProps> = ({ onRefreshHealth }) => {
  const { token } = useAuthStore();
  const { activeServerUrl } = useServerStore();

  const [items, setItems] = useState<FailedItemData[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Hidden File Inputs for JSON import
  const fileInputRef = useRef<HTMLInputElement>(null);
  const singleItemFileRef = useRef<HTMLInputElement>(null);

  // Batch JSON Import Modal state
  const [jsonImportModalOpen, setJsonImportModalOpen] = useState(false);
  const [importedJsonData, setImportedJsonData] = useState<any[]>([]);
  const [rawJsonText, setRawJsonText] = useState('');
  const [jsonFileName, setJsonFileName] = useState('');
  const [jsonParseError, setJsonParseError] = useState<string | null>(null);
  const [jsonImporting, setJsonImporting] = useState(false);
  const [jsonTab, setJsonTab] = useState<'preview' | 'raw'>('preview');

  // Individual Edit & Save Modal state
  const [editItem, setEditItem] = useState<FailedItemData | null>(null);
  const [itemEditMode, setItemEditMode] = useState<'form' | 'json'>('form');
  const [itemRawJson, setItemRawJson] = useState('');
  const [editForm, setEditForm] = useState<{
    score: number;
    totalPoints: number;
    percentage: number;
    passed: boolean;
    pointsAwarded: number;
    submissionStatus: 'on_time' | 'late' | 'review';
    isLate: boolean;
  }>({
    score: 0,
    totalPoints: 0,
    percentage: 0,
    passed: false,
    pointsAwarded: 0,
    submissionStatus: 'on_time',
    isLate: false,
  });

  const fetchFailedItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/assessments/admin/queue/failed-items');
      if (res.data?.success) {
        setItems(res.data.data || []);
      } else {
        toast.error(res.data?.error || 'Failed to load failed queue items');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.message || 'Error fetching failed flushes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFailedItems();
  }, [fetchFailedItems]);

  const handleCopy = (text: string, id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // ---------------------------------------------------------------------------
  // JSON FILE IMPORT & PARSING LOGIC
  // ---------------------------------------------------------------------------

  const parseAndLoadJsonContent = (text: string, filename = 'imported.json') => {
    try {
      const parsed = JSON.parse(text);
      let list: any[] = [];

      if (Array.isArray(parsed)) {
        list = parsed;
      } else if (parsed && Array.isArray(parsed.items)) {
        list = parsed.items;
      } else if (parsed && Array.isArray(parsed.failedSubmissions)) {
        list = parsed.failedSubmissions;
      } else if (parsed && Array.isArray(parsed.pendingSubmissions)) {
        list = parsed.pendingSubmissions;
      } else if (parsed && (parsed.submissionId || parsed.submission?.submissionId)) {
        list = [parsed];
      } else {
        throw new Error('Unrecognized JSON structure. Expected array or object containing failedSubmissions / items.');
      }

      if (list.length === 0) {
        throw new Error('JSON contains no submissions to import.');
      }

      // Normalize each item
      const normalized = list.map((raw: any) => {
        const sub = raw.submission ? { ...raw.submission, ...raw } : raw;
        const score = typeof sub.score === 'number' ? sub.score : 0;
        const totalPoints = typeof sub.totalPoints === 'number' ? sub.totalPoints : 100;
        const percentage = typeof sub.percentage === 'number' ? sub.percentage : (totalPoints ? Math.round((score / totalPoints) * 100) : 0);

        return {
          ...sub,
          submissionId: sub.submissionId || raw.submissionId,
          userId: sub.userId || raw.userId,
          assessmentId: sub.assessmentId || raw.assessmentId,
          assessmentTitle: sub.assessmentTitle || raw.assessmentTitle || 'Assessment',
          score,
          totalPoints,
          percentage,
          passed: typeof sub.passed === 'boolean' ? sub.passed : percentage >= 50,
          pointsAwarded: typeof sub.pointsAwarded === 'number' ? sub.pointsAwarded : 0,
          submissionStatus: sub.submissionStatus || 'on_time',
          isLate: Boolean(sub.isLate),
        };
      });

      setImportedJsonData(normalized);
      setRawJsonText(JSON.stringify(normalized, null, 2));
      setJsonFileName(filename);
      setJsonParseError(null);
      setJsonTab('preview');
      setJsonImportModalOpen(true);
      toast.success(`Loaded ${normalized.length} submission(s) from ${filename}`);
    } catch (err: any) {
      setJsonParseError(err.message || 'Invalid JSON syntax');
      toast.error(`JSON Parse Error: ${err.message}`);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      parseAndLoadJsonContent(content, file.name);
    };
    reader.onerror = () => {
      toast.error('Failed to read file');
    };
    reader.readAsText(file);

    // Reset input so same file can be selected again
    e.target.value = '';
  };

  // Commit Parsed JSON to MongoDB Atlas
  const handleCommitJsonToDatabase = async () => {
    // If raw JSON tab was edited, re-parse from raw text
    let payloadToSubmit = importedJsonData;
    if (jsonTab === 'raw') {
      try {
        const reParsed = JSON.parse(rawJsonText);
        payloadToSubmit = Array.isArray(reParsed) ? reParsed : [reParsed];
      } catch (err: any) {
        toast.error(`Raw JSON has syntax errors: ${err.message}`);
        return;
      }
    }

    if (payloadToSubmit.length === 0) {
      toast.error('No items to commit');
      return;
    }

    setJsonImporting(true);
    try {
      const res = await api.post('/assessments/admin/queue/failed-items/bulk-import-db', {
        items: payloadToSubmit,
      });

      if (res.data?.success) {
        toast.success(`Successfully saved ${res.data.savedCount} submission(s) from JSON to MongoDB Atlas!`);
        setJsonImportModalOpen(false);
        fetchFailedItems();
        onRefreshHealth?.();
      } else {
        toast.error(res.data?.error || 'Bulk JSON import failed');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.message || 'Bulk write error');
    } finally {
      setJsonImporting(false);
    }
  };

  // Export current failed items as JSON file
  const handleExportJson = () => {
    if (items.length === 0) {
      toast.error('No failed items currently in queue to export');
      return;
    }

    const exportPayload = {
      exportedAt: new Date().toISOString(),
      nodeUrl: activeServerUrl || 'active-node',
      count: items.length,
      failedSubmissions: items.map((i) => ({
        submissionId: i.submissionId,
        userId: i.userId,
        assessmentId: i.assessmentId,
        assessmentTitle: i.assessmentTitle,
        error: i.error,
        failedAt: i.failedAt,
        attempts: i.attempts,
        submission: i.submission,
      })),
    };

    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `failed-flushes-export-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${items.length} failed submission(s) to JSON!`);
  };

  // ---------------------------------------------------------------------------
  // INDIVIDUAL ITEM ACTIONS
  // ---------------------------------------------------------------------------

  // Direct Force Save to MongoDB
  const handleForceSaveToDb = async (item: FailedItemData) => {
    const actionKey = `save-${item.submissionId}`;
    setActionLoading(actionKey);
    try {
      const res = await api.post('/assessments/admin/queue/failed-items/update-db', {
        submissionId: item.submissionId,
        userId: item.userId,
        assessmentId: item.assessmentId,
        updates: item.submission,
      });

      if (res.data?.success) {
        toast.success(`Successfully saved submission ${item.submissionId} to MongoDB Atlas!`);
        fetchFailedItems();
        onRefreshHealth?.();
      } else {
        toast.error(res.data?.error || 'Failed to save to database');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.message || 'Database write failed');
    } finally {
      setActionLoading(null);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (item: FailedItemData) => {
    const sub = item.submission || ({} as any);
    setEditItem(item);
    setItemEditMode('form');
    setItemRawJson(JSON.stringify(sub, null, 2));
    setEditForm({
      score: sub.score ?? 0,
      totalPoints: sub.totalPoints ?? 100,
      percentage: sub.percentage ?? (sub.totalPoints ? Math.round((sub.score / sub.totalPoints) * 100) : 0),
      passed: Boolean(sub.passed),
      pointsAwarded: sub.pointsAwarded ?? 0,
      submissionStatus: sub.submissionStatus || 'on_time',
      isLate: Boolean(sub.isLate),
    });
  };

  // Single Item: Read JSON file to update this item
  const handleSingleItemFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editItem) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        const sub = parsed.submission ? parsed.submission : parsed;
        setItemRawJson(JSON.stringify(sub, null, 2));

        const score = typeof sub.score === 'number' ? sub.score : editForm.score;
        const totalPoints = typeof sub.totalPoints === 'number' ? sub.totalPoints : editForm.totalPoints;
        const percentage = typeof sub.percentage === 'number' ? sub.percentage : (totalPoints ? Math.round((score / totalPoints) * 100) : 0);

        setEditForm({
          score,
          totalPoints,
          percentage,
          passed: typeof sub.passed === 'boolean' ? sub.passed : percentage >= 50,
          pointsAwarded: typeof sub.pointsAwarded === 'number' ? sub.pointsAwarded : 0,
          submissionStatus: sub.submissionStatus || 'on_time',
          isLate: Boolean(sub.isLate),
        });

        toast.success(`Loaded submission data from ${file.name}!`);
      } catch (err: any) {
        toast.error(`Invalid JSON in file: ${err.message}`);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Submit Edit & Save
  const handleSaveEditedSubmission = async () => {
    if (!editItem) return;
    const actionKey = `edit-save-${editItem.submissionId}`;
    setActionLoading(actionKey);

    let updatesPayload = {
      ...editItem.submission,
      ...editForm,
    };

    // If user edited in JSON mode, parse itemRawJson
    if (itemEditMode === 'json') {
      try {
        const parsedJson = JSON.parse(itemRawJson);
        updatesPayload = {
          ...updatesPayload,
          ...parsedJson,
        };
      } catch (jsonErr: any) {
        toast.error(`Invalid JSON in editor: ${jsonErr.message}`);
        setActionLoading(null);
        return;
      }
    }

    try {
      const res = await api.post('/assessments/admin/queue/failed-items/update-db', {
        submissionId: editItem.submissionId,
        userId: editItem.userId,
        assessmentId: editItem.assessmentId,
        updates: updatesPayload,
      });

      if (res.data?.success) {
        toast.success(`Updated and committed submission to MongoDB!`);
        setEditItem(null);
        fetchFailedItems();
        onRefreshHealth?.();
      } else {
        toast.error(res.data?.error || 'Failed to commit updates');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.message || 'Update failed');
    } finally {
      setActionLoading(null);
    }
  };

  // Retry via queue
  const handleRetryQueue = async () => {
    setActionLoading('retry-queue');
    try {
      const res = await api.post('/assessments/admin/queue/retry-failed');
      if (res.data?.success) {
        toast.success(res.data.message || 'Retried failed items!');
        fetchFailedItems();
        onRefreshHealth?.();
      } else {
        toast.error(res.data?.error || 'Retry failed');
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.error || err.response?.data?.message || err.message;
      toast.error(`Retry error: ${errMsg}`);
      fetchFailedItems();
    } finally {
      setActionLoading(null);
    }
  };

  // Flush Queue Now
  const handleFlushNow = async () => {
    setActionLoading('flush-now');
    try {
      const res = await api.post('/assessments/admin/queue/flush-now');
      if (res.data?.success) {
        toast.success(`Flushed ${res.data.flushedCount} submission(s) to MongoDB!`);
        fetchFailedItems();
        onRefreshHealth?.();
      } else {
        toast.error(res.data?.error || 'Flush failed');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.message || 'Flush error');
    } finally {
      setActionLoading(null);
    }
  };

  // Discard from Queue
  const handleDiscard = async (submissionId: string) => {
    if (!confirm(`Are you sure you want to discard submission ${submissionId} from RAM? This will remove it from the failed queue.`)) {
      return;
    }

    const actionKey = `discard-${submissionId}`;
    setActionLoading(actionKey);
    try {
      const res = await api.delete(`/assessments/admin/queue/failed-items/${submissionId}`);
      if (res.data?.success) {
        toast.success(`Discarded ${submissionId} from queue.`);
        fetchFailedItems();
        onRefreshHealth?.();
      } else {
        toast.error(res.data?.error || 'Discard failed');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.message || 'Discard failed');
    } finally {
      setActionLoading(null);
    }
  };

  // Filter items
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase();
    return items.filter(
      (item) =>
        item.submissionId.toLowerCase().includes(q) ||
        item.user?.name?.toLowerCase().includes(q) ||
        item.user?.rollNo?.toLowerCase().includes(q) ||
        item.user?.email?.toLowerCase().includes(q) ||
        item.assessmentTitle?.toLowerCase().includes(q) ||
        item.error.toLowerCase().includes(q)
    );
  }, [items, searchQuery]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Hidden File Input for Batch JSON Import */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".json,application/json"
        className="hidden"
      />

      {/* Hidden File Input for Single Item JSON Import */}
      <input
        type="file"
        ref={singleItemFileRef}
        onChange={handleSingleItemFileChange}
        accept=".json,application/json"
        className="hidden"
      />

      {/* Top Banner & Control Deck */}
      <div className="bg-surface rounded-3xl border border-separator p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-separator/60">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border ${
                  items.length > 0
                    ? 'bg-danger/10 border-danger/20 text-danger'
                    : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                }`}
              >
                {items.length > 0 ? (
                  <>
                    <ShieldAlert size={12} />
                    <span>{items.length} Failed Flush(es) in RAM</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={12} />
                    <span>0 Failed Flushes · Healthy</span>
                  </>
                )}
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-extrabold text-label-primary tracking-tight">
              Failed Buffer Flushes & DB Synchronizer
            </h3>
            <p className="text-xs text-label-tertiary mt-0.5">
              Inspect in-memory submissions that failed to persist during batch write flushes. Update directly or upload a JSON file to commit submissions safely to MongoDB Atlas.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {/* JSON File Import Button */}
            <Button
              size="sm"
              radius="lg"
              variant="solid"
              color="primary"
              onPress={() => fileInputRef.current?.click()}
              className="text-xs font-bold h-9 px-3.5 shadow-sm text-white flex items-center gap-1.5"
              startContent={<Upload size={13} />}
            >
              Upload JSON File
            </Button>

            {/* Export JSON Button */}
            <Button
              size="sm"
              radius="lg"
              variant="flat"
              isDisabled={items.length === 0}
              onPress={handleExportJson}
              className="text-xs font-bold h-9 px-3"
              startContent={<Download size={13} />}
              title="Export failed items to JSON file"
            >
              Export JSON
            </Button>

            <Button
              size="sm"
              radius="lg"
              variant="flat"
              onPress={fetchFailedItems}
              isLoading={loading}
              className="text-xs font-bold h-9 px-3"
              startContent={loading ? undefined : <RefreshCw size={13} />}
            >
              Refresh
            </Button>

            <Button
              size="sm"
              radius="lg"
              variant="flat"
              color="primary"
              onPress={handleFlushNow}
              isLoading={actionLoading === 'flush-now'}
              className="text-xs font-bold h-9 px-3"
              startContent={<Database size={13} />}
            >
              Flush Queue
            </Button>

            <Button
              size="sm"
              radius="lg"
              variant="solid"
              color="warning"
              isDisabled={items.length === 0}
              onPress={handleRetryQueue}
              isLoading={actionLoading === 'retry-queue'}
              className="text-xs font-bold h-9 px-3 text-white shadow-xs"
              startContent={<RotateCcw size={13} />}
            >
              Retry via Queue
            </Button>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
          <div className="w-full sm:w-80">
            <HeroInput
              size="sm"
              placeholder="Search by Roll No, Student, Assessment, Error..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              startContent={<Search size={14} className="text-label-tertiary" />}
              isClearable
              onClear={() => setSearchQuery('')}
            />
          </div>

          <div className="flex items-center gap-3 text-xs text-label-tertiary font-medium">
            <span>
              Showing <strong className="text-label-primary">{filteredItems.length}</strong> of {items.length} failed items
            </span>
          </div>
        </div>
      </div>

      {/* Main Items Display */}
      {items.length === 0 ? (
        <div className="p-8 sm:p-12 rounded-3xl bg-surface border border-separator/80 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 size={28} />
          </div>
          <div className="space-y-1">
            <h4 className="text-base font-bold text-label-primary">All In-Memory Flushes Synced to DB</h4>
            <p className="text-xs text-label-tertiary max-w-md mx-auto">
              There are zero failed submission flushes currently sitting in process RAM. If you have an offline JSON backup or recovery file, you can upload it below to update the database.
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 pt-2">
            <Button
              size="sm"
              color="primary"
              variant="flat"
              onPress={() => fileInputRef.current?.click()}
              startContent={<Upload size={13} />}
              className="text-xs font-semibold"
            >
              Update from JSON File
            </Button>
            <Button
              size="sm"
              variant="flat"
              onPress={fetchFailedItems}
              startContent={<RefreshCw size={12} />}
              className="text-xs font-semibold"
            >
              Re-check Queue
            </Button>
          </div>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="p-8 rounded-3xl bg-surface border border-separator text-center text-xs text-label-tertiary">
          No failed submissions matched search query "{searchQuery}".
        </div>
      ) : (
        <div className="space-y-4">
          {filteredItems.map((item, index) => {
            const isExpanded = expandedRow === item.submissionId;
            const sub = item.submission || ({} as any);

            return (
              <div
                key={item.submissionId}
                className="bg-surface rounded-2xl border border-separator/80 overflow-hidden shadow-xs hover:border-separator transition-all"
              >
                {/* Header Row */}
                <div className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-2 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded-md bg-danger/10 text-danger border border-danger/20 text-[10px] font-bold uppercase tracking-wider">
                        Failed Flush #{index + 1}
                      </span>
                      <span className="font-mono text-xs font-bold text-label-primary truncate">
                        ID: {item.submissionId}
                      </span>
                      <button
                        onClick={(e) => handleCopy(item.submissionId, `id-${item.submissionId}`, e)}
                        className="p-1 hover:bg-surface-secondary rounded text-label-tertiary hover:text-label-primary transition-colors"
                        title="Copy Submission ID"
                      >
                        {copiedId === `id-${item.submissionId}` ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                      </button>
                      <span className="text-[11px] text-label-tertiary">
                        · Attempts: <strong className="text-label-secondary">{item.attempts}</strong>
                      </span>
                      <span className="text-[11px] text-label-tertiary">
                        · Failed At: {new Date(item.failedAt).toLocaleTimeString()}
                      </span>
                    </div>

                    {/* Student & Assessment Identifiers */}
                    <div className="flex items-center gap-3 sm:gap-4 flex-wrap text-xs">
                      <div className="flex items-center gap-1.5 font-semibold text-label-primary">
                        <UserIcon size={14} className="text-primary shrink-0" />
                        <span>{item.user?.name || 'Student'}</span>
                        {item.user?.rollNo && (
                          <span className="px-1.5 py-0.2 rounded bg-surface-secondary text-[11px] font-mono font-bold text-label-secondary">
                            {item.user.rollNo}
                          </span>
                        )}
                        {item.user?.email && (
                          <span className="text-label-tertiary font-normal">({item.user.email})</span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 text-label-secondary">
                        <BookOpen size={14} className="text-label-tertiary shrink-0" />
                        <span className="font-medium">{item.assessmentTitle || 'Assessment'}</span>
                      </div>
                    </div>

                    {/* Metrics preview */}
                    <div className="flex items-center gap-2 flex-wrap text-[11px]">
                      <span className="px-2 py-0.5 rounded bg-surface-secondary border border-separator text-label-secondary font-mono">
                        Score: <strong>{sub.score ?? 0}</strong> / {sub.totalPoints ?? 0} ({sub.percentage ?? 0}%)
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded border font-semibold ${
                          sub.passed
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                            : 'bg-danger/10 border-danger/20 text-danger'
                        }`}
                      >
                        {sub.passed ? 'PASSED' : 'FAILED'}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-surface-secondary border border-separator text-label-secondary">
                        Awarded: {sub.pointsAwarded ?? 0} pts
                      </span>
                      <span className="px-2 py-0.5 rounded bg-surface-secondary border border-separator text-label-secondary">
                        Status: {sub.submissionStatus || 'on_time'}
                      </span>
                      {sub.answers && (
                        <span className="text-label-tertiary">
                          ({sub.answers.length} answers logged)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions Buttons */}
                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    <Button
                      size="sm"
                      radius="lg"
                      variant="solid"
                      color="primary"
                      onPress={() => handleOpenEdit(item)}
                      className="text-xs font-bold h-8 px-3 shadow-xs"
                      startContent={<Edit2 size={13} />}
                    >
                      Edit & Save to DB
                    </Button>

                    <Button
                      size="sm"
                      radius="lg"
                      variant="flat"
                      color="success"
                      isLoading={actionLoading === `save-${item.submissionId}`}
                      onPress={() => handleForceSaveToDb(item)}
                      className="text-xs font-bold h-8 px-3"
                      startContent={<Database size={13} />}
                      title="Directly writes this submission into MongoDB Atlas"
                    >
                      Force Save to DB
                    </Button>

                    <Button
                      size="sm"
                      radius="lg"
                      variant="light"
                      color="danger"
                      isIconOnly
                      isLoading={actionLoading === `discard-${item.submissionId}`}
                      onPress={() => handleDiscard(item.submissionId)}
                      className="h-8 w-8 min-w-[32px]"
                      title="Discard from memory queue"
                    >
                      <Trash2 size={14} />
                    </Button>

                    <Button
                      size="sm"
                      radius="lg"
                      variant="light"
                      isIconOnly
                      onPress={() => setExpandedRow(isExpanded ? null : item.submissionId)}
                      className="h-8 w-8 min-w-[32px] text-label-tertiary hover:text-label-primary"
                      title={isExpanded ? 'Collapse details' : 'Expand error details'}
                    >
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </Button>
                  </div>
                </div>

                {/* Error Banner Always Visible */}
                <div className="px-4 sm:px-5 pb-3">
                  <div className="p-3 rounded-xl bg-danger/10 border border-danger/25 text-danger flex items-start gap-2.5 text-xs font-mono">
                    <AlertTriangle size={15} className="shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1 break-all">
                      <span className="font-bold block uppercase tracking-wider text-[10px] mb-0.5">
                        MongoDB BulkWrite / Persistence Error:
                      </span>
                      <span>{item.error}</span>
                    </div>
                    <button
                      onClick={(e) => handleCopy(item.error, `err-${item.submissionId}`, e)}
                      className="p-1 hover:bg-danger/20 rounded text-danger/80 hover:text-danger shrink-0 ml-2"
                      title="Copy Error"
                    >
                      {copiedId === `err-${item.submissionId}` ? <Check size={13} /> : <Copy size={13} />}
                    </button>
                  </div>
                </div>

                {/* Expanded Details: Raw JSON Payload */}
                {isExpanded && (
                  <div className="border-t border-separator/80 bg-surface-secondary/40 p-4 sm:p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-label-primary flex items-center gap-1.5">
                        <Code2 size={14} className="text-primary" />
                        In-Memory Raw Submission Payload
                      </span>
                      <button
                        onClick={(e) => handleCopy(JSON.stringify(sub, null, 2), `json-${item.submissionId}`, e)}
                        className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-1"
                      >
                        <Copy size={11} /> Copy JSON
                      </button>
                    </div>

                    <pre className="p-3.5 rounded-xl bg-surface-secondary border border-separator text-[11px] font-mono text-label-secondary overflow-x-auto max-h-60">
                      {JSON.stringify(sub, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── BATCH JSON FILE IMPORT & PREVIEW MODAL ───────────────────────── */}
      {jsonImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-3xl p-6 rounded-3xl bg-surface border border-separator shadow-2xl space-y-5 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-separator">
              <div>
                <div className="flex items-center gap-2">
                  <FileJson size={20} className="text-primary" />
                  <h3 className="text-base sm:text-lg font-bold text-label-primary">
                    Update Failed Flushes from JSON File
                  </h3>
                </div>
                <p className="text-xs text-label-tertiary mt-0.5">
                  File: <strong className="text-label-secondary">{jsonFileName}</strong> ·{' '}
                  <span className="text-primary font-bold">{importedJsonData.length}</span> submission(s) detected
                </p>
              </div>
              <button
                onClick={() => setJsonImportModalOpen(false)}
                className="p-1.5 rounded-lg text-label-tertiary hover:text-label-primary hover:bg-surface-secondary"
              >
                <X size={18} />
              </button>
            </div>

            {/* View Mode Tabs */}
            <div className="flex items-center justify-between border-b border-separator/60 pb-2">
              <div className="flex items-center gap-2 bg-surface-secondary p-1 rounded-xl border border-separator text-xs">
                <button
                  type="button"
                  onClick={() => setJsonTab('preview')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                    jsonTab === 'preview'
                      ? 'bg-surface text-label-primary shadow-xs'
                      : 'text-label-tertiary hover:text-label-primary'
                  }`}
                >
                  Parsed Preview ({importedJsonData.length})
                </button>
                <button
                  type="button"
                  onClick={() => setJsonTab('raw')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                    jsonTab === 'raw'
                      ? 'bg-surface text-label-primary shadow-xs'
                      : 'text-label-tertiary hover:text-label-primary'
                  }`}
                >
                  Raw JSON Editor
                </button>
              </div>

              <Button
                size="sm"
                variant="flat"
                onPress={() => fileInputRef.current?.click()}
                startContent={<Upload size={12} />}
                className="text-xs font-semibold"
              >
                Choose Another File
              </Button>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto min-h-0 space-y-3">
              {jsonTab === 'preview' ? (
                <div className="space-y-2.5">
                  {importedJsonData.map((item, idx) => {
                    const hasValidIds = Boolean(item.submissionId && item.userId && item.assessmentId);

                    return (
                      <div
                        key={item.submissionId || idx}
                        className="p-3.5 rounded-xl bg-surface-secondary border border-separator text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono font-bold text-label-primary">
                              #{idx + 1} {item.submissionId || 'Missing submissionId'}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                hasValidIds
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                  : 'bg-danger/10 text-danger border border-danger/20'
                              }`}
                            >
                              {hasValidIds ? 'Valid Schema' : 'Missing IDs'}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                item.passed
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                  : 'bg-danger/10 text-danger'
                              }`}
                            >
                              {item.passed ? 'PASSED' : 'FAILED'}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 text-[11px] text-label-tertiary flex-wrap">
                            <span>
                              User ID: <strong className="text-label-secondary font-mono">{String(item.userId).slice(-8)}</strong>
                            </span>
                            <span>
                              Assessment: <strong className="text-label-secondary">{item.assessmentTitle || String(item.assessmentId).slice(-8)}</strong>
                            </span>
                            <span>
                              Score: <strong className="text-label-secondary">{item.score} / {item.totalPoints}</strong> ({item.percentage}%)
                            </span>
                            <span>
                              Awarded: <strong className="text-label-secondary">{item.pointsAwarded ?? 0} pts</strong>
                            </span>
                          </div>
                        </div>

                        <div className="shrink-0 text-right">
                          <span className="text-[11px] font-mono text-label-secondary block">
                            Status: {item.submissionStatus || 'on_time'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-label-tertiary">
                    <span>You can directly edit the JSON array below before committing to database:</span>
                    <button
                      type="button"
                      onClick={(e) => handleCopy(rawJsonText, 'raw-import-copy', e)}
                      className="text-primary hover:underline flex items-center gap-1 font-semibold"
                    >
                      <Copy size={11} /> Copy JSON
                    </button>
                  </div>
                  <textarea
                    value={rawJsonText}
                    onChange={(e) => setRawJsonText(e.target.value)}
                    rows={15}
                    className="w-full p-3.5 rounded-xl bg-surface-secondary border border-separator text-xs font-mono text-label-primary focus:border-primary outline-none"
                    placeholder="[ { submissionId: ..., userId: ..., assessmentId: ... } ]"
                  />
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-separator">
              <span className="text-xs text-label-tertiary">
                Directly upserts into MongoDB <code className="text-primary font-mono font-bold">AssessmentSubmission</code>
              </span>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onPress={() => setJsonImportModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  color="primary"
                  isLoading={jsonImporting}
                  onPress={handleCommitJsonToDatabase}
                  startContent={<Database size={14} />}
                  className="font-bold px-4"
                >
                  Commit {importedJsonData.length} to Database
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── INDIVIDUAL EDIT & COMMIT MODAL (WITH JSON TOGGLE) ───────────── */}
      {editItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-xl p-6 rounded-3xl bg-surface border border-separator shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-separator">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-label-primary flex items-center gap-2">
                  <Edit2 size={16} className="text-primary" />
                  Edit & Commit Submission to MongoDB
                </h3>
                <p className="text-xs text-label-tertiary">
                  Adjust values to satisfy database schema and commit directly to MongoDB.
                </p>
              </div>
              <button
                onClick={() => setEditItem(null)}
                className="p-1.5 rounded-lg text-label-tertiary hover:text-label-primary hover:bg-surface-secondary"
              >
                <X size={18} />
              </button>
            </div>

            {/* Read-Only Info */}
            <div className="p-3.5 rounded-xl bg-surface-secondary border border-separator text-xs grid grid-cols-2 gap-2">
              <div>
                <span className="text-[10px] text-label-tertiary block uppercase font-bold">Submission ID</span>
                <span className="font-mono font-semibold text-label-primary truncate block">{editItem.submissionId}</span>
              </div>
              <div>
                <span className="text-[10px] text-label-tertiary block uppercase font-bold">Student</span>
                <span className="font-semibold text-label-primary truncate block">
                  {editItem.user?.name || editItem.userId} ({editItem.user?.rollNo || 'No Roll'})
                </span>
              </div>
            </div>

            {/* Edit Mode Switcher: Visual Form vs Raw JSON */}
            <div className="flex items-center justify-between border-b border-separator pb-2">
              <div className="flex items-center gap-1.5 bg-surface-secondary p-1 rounded-xl border border-separator text-xs">
                <button
                  type="button"
                  onClick={() => setItemEditMode('form')}
                  className={`px-3 py-1 rounded-lg font-bold transition-all ${
                    itemEditMode === 'form'
                      ? 'bg-surface text-label-primary shadow-xs'
                      : 'text-label-tertiary hover:text-label-primary'
                  }`}
                >
                  Form Mode
                </button>
                <button
                  type="button"
                  onClick={() => setItemEditMode('json')}
                  className={`px-3 py-1 rounded-lg font-bold transition-all ${
                    itemEditMode === 'json'
                      ? 'bg-surface text-label-primary shadow-xs'
                      : 'text-label-tertiary hover:text-label-primary'
                  }`}
                >
                  JSON File / Editor Mode
                </button>
              </div>

              {/* Upload JSON file for this single item */}
              <Button
                size="sm"
                variant="flat"
                onPress={() => singleItemFileRef.current?.click()}
                startContent={<FileUp size={12} />}
                className="text-xs font-semibold"
                title="Populate this submission from a local JSON file"
              >
                Load from JSON File
              </Button>
            </div>

            {/* Mode 1: Visual Form */}
            {itemEditMode === 'form' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-label-secondary block mb-1">Score</label>
                  <input
                    type="number"
                    value={editForm.score}
                    onChange={(e) => {
                      const newScore = parseFloat(e.target.value) || 0;
                      const pct = editForm.totalPoints ? Math.round((newScore / editForm.totalPoints) * 100) : 0;
                      setEditForm({
                        ...editForm,
                        score: newScore,
                        percentage: pct,
                        passed: pct >= 50,
                      });
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-surface-secondary border border-separator text-sm font-semibold text-label-primary focus:border-primary outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-label-secondary block mb-1">Total Points</label>
                  <input
                    type="number"
                    value={editForm.totalPoints}
                    onChange={(e) => {
                      const newTotal = parseFloat(e.target.value) || 0;
                      const pct = newTotal ? Math.round((editForm.score / newTotal) * 100) : 0;
                      setEditForm({
                        ...editForm,
                        totalPoints: newTotal,
                        percentage: pct,
                        passed: pct >= 50,
                      });
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-surface-secondary border border-separator text-sm font-semibold text-label-primary focus:border-primary outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-label-secondary block mb-1">Percentage (%)</label>
                  <input
                    type="number"
                    value={editForm.percentage}
                    onChange={(e) => setEditForm({ ...editForm, percentage: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-surface-secondary border border-separator text-sm font-semibold text-label-primary focus:border-primary outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-label-secondary block mb-1">Points Awarded</label>
                  <input
                    type="number"
                    value={editForm.pointsAwarded}
                    onChange={(e) => setEditForm({ ...editForm, pointsAwarded: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-surface-secondary border border-separator text-sm font-semibold text-label-primary focus:border-primary outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-label-secondary block mb-1">Submission Status</label>
                  <select
                    value={editForm.submissionStatus}
                    onChange={(e) => setEditForm({ ...editForm, submissionStatus: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-surface-secondary border border-separator text-sm font-semibold text-label-primary focus:border-primary outline-none"
                  >
                    <option value="on_time">on_time</option>
                    <option value="late">late</option>
                    <option value="review">review</option>
                  </select>
                </div>

                <div className="flex items-center gap-6 pt-5">
                  <label className="flex items-center gap-2 text-xs font-bold text-label-primary cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editForm.passed}
                      onChange={(e) => setEditForm({ ...editForm, passed: e.target.checked })}
                      className="w-4 h-4 rounded text-primary focus:ring-primary"
                    />
                    <span>Mark as Passed</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs font-bold text-label-primary cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editForm.isLate}
                      onChange={(e) => setEditForm({ ...editForm, isLate: e.target.checked })}
                      className="w-4 h-4 rounded text-primary focus:ring-primary"
                    />
                    <span>Is Late</span>
                  </label>
                </div>
              </div>
            ) : (
              /* Mode 2: Raw JSON Editor */
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-label-tertiary">
                  <span>Edit raw submission JSON payload:</span>
                  <button
                    type="button"
                    onClick={(e) => handleCopy(itemRawJson, 'copy-single-raw', e)}
                    className="text-primary hover:underline flex items-center gap-1 font-semibold"
                  >
                    <Copy size={11} /> Copy JSON
                  </button>
                </div>
                <textarea
                  value={itemRawJson}
                  onChange={(e) => setItemRawJson(e.target.value)}
                  rows={14}
                  className="w-full p-3.5 rounded-xl bg-surface-secondary border border-separator text-xs font-mono text-label-primary focus:border-primary outline-none"
                />
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-separator">
              <Button
                size="sm"
                variant="ghost"
                onPress={() => setEditItem(null)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                color="primary"
                isLoading={actionLoading === `edit-save-${editItem.submissionId}`}
                onPress={handleSaveEditedSubmission}
                startContent={<Save size={14} />}
                className="font-bold px-4"
              >
                Commit & Update DB
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FailedFlushesManager;
