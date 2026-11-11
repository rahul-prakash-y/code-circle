import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@heroui/react';
import { HeroInput } from '../components/ui/HeroUIComponents';
import {
  Activity,
  Server,
  Database,
  Cpu,
  RefreshCw,
  Zap,
  HardDrive,
  ShieldCheck,
  AlertTriangle,
  Search,
  Plus,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
  CheckCircle2,
  Table,
  Layers,
  Clock,
  Terminal,
  User,
  Copy,
  Check,
  CheckSquare,
  Square,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import useDiagnosticsStore, { CollectionStat } from '../store/useDiagnosticsStore';
import { UserBadge } from '../components/admin/diagnostics/UserBadge';
import { RecordFormModal } from '../components/admin/diagnostics/RecordFormModal';
import { DeleteConfirmModal } from '../components/admin/diagnostics/DeleteConfirmModal';
import { ViewDocModal } from '../components/admin/diagnostics/ViewDocModal';
import SubmissionQueuePanel from '../components/admin/assessments/SubmissionQueuePanel';
import FailedFlushesManager from '../components/admin/diagnostics/FailedFlushesManager';
import { ErrorBoundary } from '../components/states';

export const DiagnosticsPage: React.FC = () => {
  const {
    healthData,
    databaseStats,
    totalCollections,
    totalDocuments,
    selectedCollection,
    collectionDocs,
    collectionPagination,
    userMap,
    schemaFields,
    loadingHealth,
    loadingDb,
    loadingDocs,
    syncing,
    fetchHealth,
    syncCache,
    fetchDatabaseStats,
    fetchCollectionDocuments,
    createDocument,
    updateDocument,
    deleteDocument,
    batchDeleteDocuments,
  } = useDiagnosticsStore();

  const [activeTab, setActiveTab] = useState<'health' | 'flushes' | 'failed-flushes' | 'database'>('health');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [docSearch, setDocSearch] = useState('');

  // Modals & Selection state
  const [viewDoc, setViewDoc] = useState<any | null>(null);
  const [editDoc, setEditDoc] = useState<any | null>(null);
  const [deleteDoc, setDeleteDoc] = useState<any | null>(null);
  const [isNewDocModalOpen, setIsNewDocModalOpen] = useState(false);
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);
  const [batchDeleting, setBatchDeleting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchHealth();
    fetchDatabaseStats();
  }, []);

  // 10s Auto-refresh timer
  useEffect(() => {
    if (!autoRefresh || activeTab !== 'health') return;
    const interval = setInterval(() => {
      fetchHealth();
    }, 10000);
    return () => clearInterval(interval);
  }, [autoRefresh, activeTab]);

  const handleSelectCollection = (colName: string) => {
    setSelectedRowIds([]);
    fetchCollectionDocuments(colName, 1, 20);
  };

  const handleCopyId = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleSaveEditDoc = async (payload: any) => {
    if (!selectedCollection || !editDoc) return false;
    const ok = await updateDocument(selectedCollection, editDoc._id, payload);
    if (ok) setEditDoc(null);
    return ok;
  };

  const handleSaveNewDoc = async (payload: any) => {
    if (!selectedCollection) return false;
    const ok = await createDocument(selectedCollection, payload);
    if (ok) setIsNewDocModalOpen(false);
    return ok;
  };

  const handleConfirmDelete = async () => {
    if (!selectedCollection || !deleteDoc) return;
    await deleteDocument(selectedCollection, deleteDoc._id);
    setDeleteDoc(null);
  };

  const handleToggleSelectAll = () => {
    if (selectedRowIds.length === collectionDocs.length) {
      setSelectedRowIds([]);
    } else {
      setSelectedRowIds(collectionDocs.map((d: any) => d._id));
    }
  };

  const handleToggleSelectRow = (id: string) => {
    setSelectedRowIds((prev) =>
      prev.includes(id) ? prev.filter((rId) => rId !== id) : [...prev, id]
    );
  };

  const handleBatchDelete = async () => {
    if (!selectedCollection || selectedRowIds.length === 0) return;
    if (
      confirm(
        `Permanently delete ${selectedRowIds.length} selected record(s) from '${selectedCollection}'?`
      )
    ) {
      setBatchDeleting(true);
      const ok = await batchDeleteDocuments(selectedCollection, selectedRowIds);
      setBatchDeleting(false);
      if (ok) setSelectedRowIds([]);
    }
  };

  const getDocAssociatedUserId = (doc: any, collection: string): string | null => {
    if (collection === 'users') return doc._id;
    const userKeys = [
      'userId',
      'user',
      'studentId',
      'student',
      'createdBy',
      'updatedBy',
      'author',
      'instructor',
      'unblockedBy',
      'memberId',
    ];
    for (const k of userKeys) {
      if (doc[k]) {
        if (typeof doc[k] === 'object' && doc[k]._id) return String(doc[k]._id);
        return String(doc[k]);
      }
    }
    return null;
  };

  const renderKeyPreview = (doc: any, collection: string) => {
    if (collection === 'users') {
      return (
        <div className="flex items-center gap-1.5 text-xs text-label-secondary">
          <span className="font-semibold">{doc.department || 'General'}</span>
          {doc.year && <span>· Year {doc.year}</span>}
          {doc.college && <span className="text-label-tertiary">({doc.college})</span>}
        </div>
      );
    }
    const previewText =
      doc.title ||
      doc.name ||
      doc.code ||
      doc.eventName ||
      doc.sessionId ||
      doc.subject ||
      doc.type ||
      doc.reason;
    if (previewText) {
      return (
        <span className="font-semibold text-xs text-label-primary truncate max-w-xs block">
          {previewText}
        </span>
      );
    }

    let snippet = JSON.stringify(doc);
    Object.entries(userMap).forEach(([uid, uObj]) => {
      if (snippet.includes(uid)) {
        snippet = snippet.replaceAll(`"${uid}"`, `"${uObj.name}"`);
      }
    });
    return (
      <span className="font-mono text-[11px] text-label-tertiary truncate max-w-xs block">
        {snippet.slice(0, 80)}
      </span>
    );
  };

  const formatUptime = (seconds: number) => {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${d > 0 ? `${d}d ` : ''}${h}h ${m}m ${s}s`;
  };

  return (
    <div className="max-w-7xl mx-auto py-2 sm:py-6 space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-separator pb-5 sm:pb-6">
        <div>
          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest mb-1">
            <Server size={16} />
            <span>SuperAdmin Mission Control</span>
          </div>
          <h1 className="text-xl sm:text-3xl font-extrabold text-label-primary tracking-tight">
            System Diagnostics & Database Manager
          </h1>
          <p className="text-xs text-label-tertiary mt-1">
            Real-time telemetry, cluster memory monitoring, cache sync, and low-level database collection explorer.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Tabs */}
          <div className="w-full sm:w-auto grid grid-cols-2 sm:flex items-center p-1 bg-surface-secondary border border-separator rounded-2xl shadow-xs gap-1 sm:gap-0">
            <Button
              size="sm"
              radius="lg"
              variant={activeTab === 'health' ? 'solid' : 'light'}
              color={activeTab === 'health' ? 'primary' : 'default'}
              onPress={() => setActiveTab('health')}
              className={`flex items-center justify-center whitespace-nowrap gap-2 px-3 sm:px-4 py-2 min-h-[40px] text-xs font-bold transition-all ${
                activeTab === 'health'
                  ? 'text-white shadow-md shadow-primary/20'
                  : 'text-label-secondary hover:text-label-primary'
              }`}
              startContent={<Activity size={15} />}
            >
              System Health
            </Button>
            <Button
              size="sm"
              radius="lg"
              variant={activeTab === 'flushes' ? 'solid' : 'light'}
              color={activeTab === 'flushes' ? 'primary' : 'default'}
              onPress={() => setActiveTab('flushes')}
              className={`flex items-center justify-center whitespace-nowrap gap-2 px-3 sm:px-4 py-2 min-h-[40px] text-xs font-bold transition-all ${
                activeTab === 'flushes'
                  ? 'text-white shadow-md shadow-primary/20'
                  : 'text-label-secondary hover:text-label-primary'
              }`}
              startContent={<RefreshCw size={15} />}
              endContent={
                ((healthData?.buffers?.submissionQueue?.pendingCount || 0) > 0 ||
                  (healthData?.buffers?.attendance?.queueLength || 0) > 0) ? (
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping ml-1" />
                ) : undefined
              }
            >
              Server Flushes
            </Button>
            <Button
              size="sm"
              radius="lg"
              variant={activeTab === 'failed-flushes' ? 'solid' : 'light'}
              color={activeTab === 'failed-flushes' ? 'danger' : 'default'}
              onPress={() => setActiveTab('failed-flushes')}
              className={`flex items-center justify-center whitespace-nowrap gap-2 px-3 sm:px-4 py-2 min-h-[40px] text-xs font-bold transition-all ${
                activeTab === 'failed-flushes'
                  ? 'text-white shadow-md shadow-danger/20'
                  : 'text-label-secondary hover:text-label-primary'
              }`}
              startContent={<AlertTriangle size={15} />}
              endContent={
                (healthData?.buffers?.submissionQueue?.failedCount || 0) > 0 ? (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-danger text-white">
                    {healthData?.buffers?.submissionQueue?.failedCount}
                  </span>
                ) : undefined
              }
            >
              Failed Flushes
            </Button>
            <Button
              size="sm"
              radius="lg"
              variant={activeTab === 'database' ? 'solid' : 'light'}
              color={activeTab === 'database' ? 'primary' : 'default'}
              onPress={() => setActiveTab('database')}
              className={`flex items-center justify-center whitespace-nowrap gap-2 px-3 sm:px-4 py-2 min-h-[40px] text-xs font-bold transition-all ${
                activeTab === 'database'
                  ? 'text-white shadow-md shadow-primary/20'
                  : 'text-label-secondary hover:text-label-primary'
              }`}
              startContent={<Database size={15} />}
            >
              Database Manager
            </Button>
          </div>
        </div>
      </div>

      {/* --- TAB 1: SYSTEM HEALTH --- */}
      {activeTab === 'health' && (
        <ErrorBoundary sectionName="System Health Telemetry">
          <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
          {/* Amber Warning Banner if pending submissions or attendance records are buffered in RAM */}
          {((healthData?.buffers?.submissionQueue?.pendingCount || 0) > 0 ||
            (healthData?.buffers?.attendance?.queueLength || 0) > 0) && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-pulse">
              <div className="flex items-start gap-3">
                <AlertTriangle size={20} className="shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                <div className="text-xs sm:text-sm">
                  <p className="font-bold">
                    ⚠️ Unflushed In-Memory Queue State Active!
                  </p>
                  <p className="mt-0.5 text-amber-700/80 dark:text-amber-300/80">
                    {healthData?.buffers?.submissionQueue?.pendingCount || 0} exam submission(s) and{' '}
                    {healthData?.buffers?.attendance?.queueLength || 0} attendance record(s) currently buffered in RAM.
                    Do not restart instances or conclude exam until all queues flush to Atlas.
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                color="warning"
                variant="solid"
                onPress={() => setActiveTab('flushes')}
                className="text-xs font-bold shrink-0 self-end sm:self-center"
              >
                Manage Cluster Flushes
              </Button>
            </div>
          )}

          {/* Telemetry KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* KPI 1: Memory */}
            <div className="bg-surface p-5 rounded-2xl border border-separator shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-label-secondary uppercase tracking-wider">
                  RAM Footprint
                </span>
                <div className="p-2 bg-indigo-500/10 text-indigo-500 rounded-xl">
                  <Cpu size={18} />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-label-primary">
                  {healthData?.memory.heapUsedMB || 0} MB
                </span>
                <span className="text-xs text-label-tertiary font-mono">
                  / {healthData?.memory.rssMB || 0} MB RSS
                </span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.round(
                        ((healthData?.memory.heapUsedMB || 1) / (healthData?.memory.rssMB || 100)) * 100
                      )
                    )}%`,
                  }}
                />
              </div>
              <span className="text-[10px] text-label-tertiary block font-mono">
                Heap Total: {healthData?.memory.heapTotalMB || 0} MB
              </span>
            </div>

            {/* KPI 2: Node Runtime */}
            <div className="bg-surface p-5 rounded-2xl border border-separator shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-label-secondary uppercase tracking-wider">
                  Node Engine
                </span>
                <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-xl">
                  <Server size={18} />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl sm:text-2xl font-black text-label-primary">
                  {healthData?.nodeVersion || 'v20.x'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                <CheckCircle2 size={13} />
                <span>NodeJS Production Runtime</span>
              </div>
              <span className="text-[10px] text-label-tertiary block font-mono">
                PID: {healthData?.processId || '—'}
              </span>
            </div>

            {/* KPI 3: Server Uptime */}
            <div className="bg-surface p-5 rounded-2xl border border-separator shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-label-secondary uppercase tracking-wider">
                  Continuous Uptime
                </span>
                <div className="p-2 bg-amber-500/10 text-amber-500 rounded-xl">
                  <Clock size={18} />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl sm:text-2xl font-black text-label-primary">
                  {healthData?.uptimeSeconds ? formatUptime(healthData.uptimeSeconds) : '0s'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-label-tertiary">
                <ShieldCheck size={13} className="text-primary" />
                <span>Zero Downtime Target</span>
              </div>
              <span className="text-[10px] text-label-tertiary block font-mono">
                Started: {healthData?.serverTime ? new Date(healthData.serverTime).toLocaleTimeString() : '—'}
              </span>
            </div>

            {/* KPI 4: Cache & Telemetry Refresh */}
            <div className="bg-surface p-5 rounded-2xl border border-separator shadow-sm space-y-2 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-label-secondary uppercase tracking-wider">
                    Cache & Telemetry
                  </span>
                  <div className="p-2 bg-primary/10 text-primary rounded-xl">
                    <Zap size={18} />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    Live Polling (10s)
                  </span>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <Button
                  size="sm"
                  radius="lg"
                  variant="bordered"
                  onPress={fetchHealth}
                  isLoading={loadingHealth}
                  className="flex-1 py-1.5 px-3 min-h-[38px] bg-surface-secondary hover:bg-surface border-separator text-xs font-bold text-label-primary"
                  startContent={loadingHealth ? undefined : <RefreshCw size={12} />}
                >
                  Refresh
                </Button>
                <Button
                  size="sm"
                  radius="lg"
                  color="primary"
                  variant="solid"
                  onPress={syncCache}
                  isLoading={syncing}
                  className="flex-1 py-1.5 px-3 min-h-[38px] text-xs font-bold shadow-xs hover:brightness-110"
                  startContent={syncing ? undefined : <Zap size={12} />}
                >
                  Sync Cache
                </Button>
              </div>
            </div>
          </div>

          {/* Server Flush States & In-Memory Buffers Summary */}
          <div className="bg-surface rounded-3xl border border-separator p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-xs font-bold text-label-secondary uppercase tracking-wider flex items-center gap-2">
                  <RefreshCw size={14} className="text-primary" />
                  <span>Server Flush States & In-Memory Buffers</span>
                </h3>
                <p className="text-[11px] text-label-tertiary mt-0.5">
                  Controlled batch flushing to MongoDB Atlas (cap 60 doc writes/sec) with zero data loss.
                </p>
              </div>
              <Button
                size="sm"
                variant="flat"
                color="primary"
                onPress={() => setActiveTab('flushes')}
                className="text-xs font-bold shrink-0 self-start sm:self-auto"
              >
                Open Cluster Flush Center →
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Card 1: Exam Submission In-Memory Queue */}
              <div className="p-4 bg-surface-secondary/70 rounded-2xl border border-separator/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-primary/10 text-primary rounded-lg">
                      <Layers size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-label-primary">Exam Submission Flusher</p>
                      <p className="text-[10px] text-label-tertiary">Cap 60 doc/s · 1s Auto-Flush</p>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                      (healthData?.buffers?.submissionQueue?.pendingCount || 0) > 0
                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                        : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                    }`}
                  >
                    {(healthData?.buffers?.submissionQueue?.pendingCount || 0) > 0 ? 'Flushing' : 'Idle / Flushed'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 bg-surface rounded-xl border border-separator/60">
                    <span className="text-[10px] text-label-tertiary block font-medium">Pending in RAM</span>
                    <span
                      className={`text-base font-black tabular-nums ${
                        (healthData?.buffers?.submissionQueue?.pendingCount || 0) > 0
                          ? 'text-amber-500 animate-pulse'
                          : 'text-label-primary'
                      }`}
                    >
                      {healthData?.buffers?.submissionQueue?.pendingCount ?? 0}
                    </span>
                  </div>
                  <div className="p-2 bg-surface rounded-xl border border-separator/60">
                    <span className="text-[10px] text-label-tertiary block font-medium">Oldest Item</span>
                    <span className="text-base font-black tabular-nums text-label-primary">
                      {healthData?.buffers?.submissionQueue?.oldestPendingAgeSeconds ?? 0}s
                    </span>
                  </div>
                  <div className="p-2 bg-surface rounded-xl border border-separator/60">
                    <span className="text-[10px] text-label-tertiary block font-medium">Failed Items</span>
                    <span
                      className={`text-base font-black tabular-nums ${
                        (healthData?.buffers?.submissionQueue?.failedCount || 0) > 0
                          ? 'text-danger'
                          : 'text-label-primary'
                      }`}
                    >
                      {healthData?.buffers?.submissionQueue?.failedCount ?? 0}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-label-tertiary pt-1">
                  <span>Last successful flush:</span>
                  <span className="font-mono text-label-secondary font-medium">
                    {healthData?.buffers?.submissionQueue?.lastSuccessfulFlush
                      ? new Date(healthData.buffers.submissionQueue.lastSuccessfulFlush).toLocaleTimeString()
                      : 'None yet'}
                  </span>
                </div>
              </div>

              {/* Card 2: Attendance In-Memory Write Buffer */}
              <div className="p-4 bg-surface-secondary/70 rounded-2xl border border-separator/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-emerald-500/10 text-emerald-500 rounded-lg">
                      <CheckCircle2 size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-label-primary">Attendance Buffer Flusher</p>
                      <p className="text-[10px] text-label-tertiary">BulkWrite Upsert · 4s Auto-Flush</p>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                      (healthData?.buffers?.attendance?.queueLength || 0) > 0
                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                        : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                    }`}
                  >
                    {(healthData?.buffers?.attendance?.queueLength || 0) > 0 ? 'Buffering' : 'Durable / Synced'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 bg-surface rounded-xl border border-separator/60">
                    <span className="text-[10px] text-label-tertiary block font-medium">Queued Writes</span>
                    <span
                      className={`text-base font-black tabular-nums ${
                        (healthData?.buffers?.attendance?.queueLength || 0) > 0
                          ? 'text-amber-500 animate-pulse'
                          : 'text-label-primary'
                      }`}
                    >
                      {healthData?.buffers?.attendance?.queueLength ?? 0}
                    </span>
                  </div>
                  <div className="p-2 bg-surface rounded-xl border border-separator/60">
                    <span className="text-[10px] text-label-tertiary block font-medium">Active OTPs</span>
                    <span className="text-base font-black tabular-nums text-label-primary">
                      {healthData?.buffers?.attendance?.activeOtps ?? 0}
                    </span>
                  </div>
                  <div className="p-2 bg-surface rounded-xl border border-separator/60">
                    <span className="text-[10px] text-label-tertiary block font-medium">Marked Cache</span>
                    <span className="text-base font-black tabular-nums text-label-primary">
                      {healthData?.buffers?.attendance?.markedCount ?? 0}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-label-tertiary">
                    Shutdown hook: SIGTERM/SIGINT auto-flushed
                  </span>
                  <Button
                    size="sm"
                    radius="lg"
                    variant="flat"
                    color="primary"
                    onPress={syncCache}
                    isLoading={syncing}
                    className="text-[11px] font-bold h-7 px-2.5"
                    startContent={syncing ? undefined : <RefreshCw size={11} />}
                  >
                    Sync Buffer Now
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Infrastructure Services Grid */}
          <div className="bg-surface rounded-3xl border border-separator p-5 sm:p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-label-secondary uppercase tracking-wider">
              Core Microservices & Integration Grid
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-surface-secondary rounded-2xl border border-separator flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-label-primary">MongoDB Atlas</p>
                  <p className="text-[10px] text-label-tertiary">Primary Persistence</p>
                </div>
                <span className="px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                  {healthData?.services.mongodb || 'Operational'}
                </span>
              </div>

              <div className="p-4 bg-surface-secondary rounded-2xl border border-separator flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-label-primary">Cloudinary CDN</p>
                  <p className="text-[10px] text-label-tertiary">Media & Certificates</p>
                </div>
                <span className="px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                  {healthData?.services.cloudinary || 'Operational'}
                </span>
              </div>

              <div className="p-4 bg-surface-secondary rounded-2xl border border-separator flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-label-primary">Piston Sandbox RCE</p>
                  <p className="text-[10px] text-label-tertiary">Coding Assessments</p>
                </div>
                <span className="px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                  {healthData?.services.pistonRce || 'Operational'}
                </span>
              </div>

              <div className="p-4 bg-surface-secondary rounded-2xl border border-separator flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-label-primary">Firebase Admin</p>
                  <p className="text-[10px] text-label-tertiary">Google SSO Gateway</p>
                </div>
                <span className="px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                  {healthData?.services.firebaseAuth || 'Operational'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </ErrorBoundary>
      )}

      {/* --- TAB 2: SERVER FLUSHES & CLUSTER QUEUES --- */}
      {activeTab === 'flushes' && (
        <ErrorBoundary sectionName="Cluster Flush Monitor">
          <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
          {/* Section 1: In-Memory Attendance Buffer Flusher */}
          <div className="bg-surface rounded-3xl border border-separator p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-separator/60">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 size={12} />
                    <span>In-Memory Attendance Flusher</span>
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-label-primary tracking-tight">
                  Attendance Buffer & Shared Cache Flusher
                </h3>
                <p className="text-xs text-label-tertiary mt-0.5">
                  Protects MongoDB Atlas M0 (100 ops/sec) by buffering student attendance OTP submissions in RAM,
                  writing in batches with bulkWrite upserts every 4 seconds and upon server shutdown.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button
                  size="sm"
                  radius="xl"
                  color="primary"
                  variant="solid"
                  onPress={syncCache}
                  isLoading={syncing}
                  startContent={syncing ? undefined : <RefreshCw size={14} />}
                  className="px-4 py-2 min-h-[38px] text-xs font-bold shadow-xs hover:brightness-110"
                >
                  Flush Attendance Buffer to Atlas
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 bg-surface-secondary/70 rounded-2xl border border-separator/80">
                <span className="text-[10px] font-bold text-label-secondary uppercase tracking-wider">
                  Queued Writes
                </span>
                <p
                  className={`text-2xl font-black tabular-nums mt-1 ${
                    (healthData?.buffers?.attendance?.queueLength || 0) > 0
                      ? 'text-amber-500 animate-pulse'
                      : 'text-label-primary'
                  }`}
                >
                  {healthData?.buffers?.attendance?.queueLength ?? 0}
                </p>
                <span className="text-[10px] text-label-tertiary">In-memory writeQueue</span>
              </div>

              <div className="p-4 bg-surface-secondary/70 rounded-2xl border border-separator/80">
                <span className="text-[10px] font-bold text-label-secondary uppercase tracking-wider">
                  Active OTPs
                </span>
                <p className="text-2xl font-black tabular-nums text-label-primary mt-1">
                  {healthData?.buffers?.attendance?.activeOtps ?? 0}
                </p>
                <span className="text-[10px] text-label-tertiary">Multi-node shared cache</span>
              </div>

              <div className="p-4 bg-surface-secondary/70 rounded-2xl border border-separator/80">
                <span className="text-[10px] font-bold text-label-secondary uppercase tracking-wider">
                  Marked Students
                </span>
                <p className="text-2xl font-black tabular-nums text-label-primary mt-1">
                  {healthData?.buffers?.attendance?.markedCount ?? 0}
                </p>
                <span className="text-[10px] text-label-tertiary">Sub-ms duplicate prevention</span>
              </div>

              <div className="p-4 bg-surface-secondary/70 rounded-2xl border border-separator/80">
                <span className="text-[10px] font-bold text-label-secondary uppercase tracking-wider">
                  Failed Lockouts
                </span>
                <p className="text-2xl font-black tabular-nums text-label-primary mt-1">
                  {healthData?.buffers?.attendance?.failedAttemptsCount ?? 0}
                </p>
                <span className="text-[10px] text-label-tertiary">Brute-force protection in RAM</span>
              </div>
            </div>
          </div>

          {/* Section 2: Horizontal Cluster Exam Submission Queue Monitor */}
          <SubmissionQueuePanel />

          {/* Section 3: Failed Buffer Flushes & Direct DB Synchronizer */}
          <FailedFlushesManager onRefreshHealth={fetchHealth} />
        </div>
      </ErrorBoundary>
      )}

      {/* --- TAB 3: DEDICATED FAILED FLUSHES MANAGER --- */}
      {activeTab === 'failed-flushes' && (
        <ErrorBoundary sectionName="Failed Buffer Flushes Manager">
          <FailedFlushesManager onRefreshHealth={fetchHealth} />
        </ErrorBoundary>
      )}

      {/* --- TAB 3: DATABASE MANAGER --- */}
      {activeTab === 'database' && (
        <ErrorBoundary sectionName="Database Document Explorer">
          <div className="space-y-6 animate-in fade-in duration-300">
          {/* Collections Selector Chips */}
          <div className="bg-surface p-5 rounded-3xl border border-separator space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-label-secondary uppercase tracking-wider">
                MongoDB Collections ({totalCollections}) · {totalDocuments} Total Documents
              </span>
              <Button
                isIconOnly
                size="sm"
                radius="lg"
                variant="light"
                onPress={fetchDatabaseStats}
                isLoading={loadingDb}
                className="text-label-secondary hover:text-label-primary min-w-[34px] min-h-[34px]"
                title="Refresh Collections"
              >
                <RefreshCw size={14} className={loadingDb ? 'animate-spin' : ''} />
              </Button>
            </div>

            <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-1">
              {databaseStats.map((col) => (
                <Button
                  key={col.name}
                  size="sm"
                  radius="lg"
                  variant={selectedCollection === col.name ? 'solid' : 'flat'}
                  color={selectedCollection === col.name ? 'primary' : 'default'}
                  onPress={() => handleSelectCollection(col.name)}
                  className={`px-3.5 py-2 min-h-[38px] text-xs font-semibold border transition-all ${
                    selectedCollection === col.name
                      ? 'border-primary shadow-sm shadow-primary/20'
                      : 'border-separator hover:border-primary/40'
                  }`}
                  startContent={<Database size={13} />}
                  endContent={
                    <span
                      className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${
                        selectedCollection === col.name
                          ? 'bg-white/20 text-white'
                          : 'bg-surface border border-separator/60 text-label-secondary'
                      }`}
                    >
                      {col.count}
                    </span>
                  }
                >
                  {col.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Document Explorer Grid */}
          {selectedCollection ? (
            <div className="bg-surface rounded-3xl border border-separator shadow-sm p-4 sm:p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-label-primary flex items-center gap-2">
                    <Table size={18} className="text-primary" />
                    <span>Collection: {selectedCollection}</span>
                    <span className="text-xs font-mono font-normal text-label-tertiary">
                      ({collectionPagination.total} records)
                    </span>
                  </h3>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="flex-1 sm:w-56">
                    <HeroInput
                      size="sm"
                      radius="xl"
                      value={docSearch}
                      onValueChange={(val) => {
                        setDocSearch(val);
                        fetchCollectionDocuments(selectedCollection, 1, 20, val);
                      }}
                      placeholder="Search records..."
                      startContent={<Search size={14} className="text-label-tertiary pointer-events-none" />}
                      isClearable
                    />
                  </div>

                  <Button
                    size="sm"
                    radius="xl"
                    color="primary"
                    variant="solid"
                    onPress={() => setIsNewDocModalOpen(true)}
                    startContent={<Plus size={14} />}
                    className="px-3.5 py-2 min-h-[38px] text-xs font-bold shadow-xs hover:brightness-110 shrink-0"
                  >
                    Insert Doc
                  </Button>
                </div>
              </div>

              {/* Selected records bulk actions bar */}
              {selectedRowIds.length > 0 && (
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3 bg-primary/10 border border-primary/20 rounded-2xl animate-in fade-in duration-200">
                  <span className="text-xs font-bold text-primary">
                    {selectedRowIds.length} document(s) selected
                  </span>
                  <Button
                    size="sm"
                    radius="xl"
                    color="danger"
                    variant="solid"
                    onPress={handleBatchDelete}
                    isLoading={batchDeleting}
                    startContent={batchDeleting ? undefined : <Trash2 size={13} />}
                    className="px-3.5 py-1.5 min-h-[36px] text-xs font-bold shadow-xs hover:brightness-110"
                  >
                    {batchDeleting ? 'Deleting...' : 'Delete Selected'}
                  </Button>
                </div>
              )}

              {/* Table of Records */}
              <div className="overflow-x-auto border border-separator rounded-2xl custom-scrollbar touch-pan-x">
                <table className="w-full text-left text-xs min-w-[760px]">
                  <thead className="bg-surface-secondary border-b border-separator text-label-secondary font-bold uppercase tracking-wider text-[10px]">
                    {selectedCollection === 'users' ? (
                      <tr>
                        <th className="py-3 px-3 w-10 text-center">
                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            radius="sm"
                            onPress={handleToggleSelectAll}
                            className="text-label-tertiary hover:text-label-primary p-0 min-w-[28px] min-h-[28px] w-7 h-7"
                          >
                            {selectedRowIds.length === collectionDocs.length &&
                            collectionDocs.length > 0 ? (
                              <CheckSquare size={15} className="text-primary" />
                            ) : (
                              <Square size={15} />
                            )}
                          </Button>
                        </th>
                        <th className="py-3 px-4">User Name & Account</th>
                        <th className="py-3 px-4">Role & Status</th>
                        <th className="py-3 px-4">_id</th>
                        <th className="py-3 px-4">Created At</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    ) : (
                      <tr>
                        <th className="py-3 px-3 w-10 text-center">
                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            radius="sm"
                            onPress={handleToggleSelectAll}
                            className="text-label-tertiary hover:text-label-primary p-0 min-w-[28px] min-h-[28px] w-7 h-7"
                          >
                            {selectedRowIds.length === collectionDocs.length &&
                            collectionDocs.length > 0 ? (
                              <CheckSquare size={15} className="text-primary" />
                            ) : (
                              <Square size={15} />
                            )}
                          </Button>
                        </th>
                        <th className="py-3 px-4">_id</th>
                        <th className="py-3 px-4">User Name</th>
                        <th className="py-3 px-4">Record Details</th>
                        <th className="py-3 px-4">Created At</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    )}
                  </thead>
                  <tbody className="divide-y divide-separator text-label-primary font-medium">
                    {loadingDocs ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-label-tertiary animate-pulse">
                          Fetching documents from {selectedCollection}...
                        </td>
                      </tr>
                    ) : collectionDocs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-label-tertiary">
                          No documents found in this collection.
                        </td>
                      </tr>
                    ) : selectedCollection === 'users' ? (
                      collectionDocs.map((doc: any) => {
                        const isSelected = selectedRowIds.includes(doc._id);
                        return (
                          <tr
                            key={doc._id}
                            className={`hover:bg-surface-secondary/70 transition-colors ${
                              isSelected ? 'bg-primary/5' : ''
                            }`}
                          >
                            <td className="py-3 px-3 text-center">
                              <Button
                                isIconOnly
                                size="sm"
                                variant="light"
                                radius="sm"
                                onPress={() => handleToggleSelectRow(doc._id)}
                                className="text-label-tertiary hover:text-label-primary p-0 min-w-[28px] min-h-[28px] w-7 h-7"
                              >
                                {isSelected ? (
                                  <CheckSquare size={15} className="text-primary" />
                                ) : (
                                  <Square size={15} />
                                )}
                              </Button>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                                  {doc.name ? doc.name.charAt(0).toUpperCase() : 'U'}
                                </div>
                                <div className="flex flex-col min-w-0">
                                  <span className="font-bold text-xs text-label-primary truncate">
                                    {doc.name || 'Unnamed User'}
                                  </span>
                                  <div className="flex items-center gap-1.5 text-[11px] text-label-tertiary font-mono">
                                    {doc.rollNo && <span>{doc.rollNo}</span>}
                                    {doc.rollNo && doc.email && <span>·</span>}
                                    <span className="truncate">{doc.email}</span>
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-1.5">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                                  {doc.role || 'Student'}
                                </span>
                                {doc.isBlocked && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-destructive/10 text-destructive border border-destructive/20">
                                    Blocked
                                  </span>
                                )}
                                {doc.isRestricted && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                    Restricted
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-1">
                                <span className="font-mono text-primary font-bold text-[11px]">
                                  {doc._id.slice(0, 10)}...
                                </span>
                                <Button
                                  isIconOnly
                                  size="sm"
                                  variant="light"
                                  radius="md"
                                  onPress={(e: any) => handleCopyId(doc._id, e as any)}
                                  className="text-label-tertiary hover:text-label-primary p-0 min-w-[28px] min-h-[28px] w-7 h-7"
                                  title="Copy ObjectId"
                                >
                                  {copiedId === doc._id ? (
                                    <Check size={12} className="text-emerald-500" />
                                  ) : (
                                    <Copy size={12} />
                                  )}
                                </Button>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-label-tertiary font-mono text-[11px]">
                              {doc.createdAt ? new Date(doc.createdAt).toLocaleDateString() : '—'}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="inline-flex items-center justify-end gap-1">
                                <Button
                                  isIconOnly
                                  size="sm"
                                  variant="light"
                                  radius="lg"
                                  onPress={() => setViewDoc(doc)}
                                  className="min-w-[32px] min-h-[32px] w-8 h-8 text-label-secondary hover:text-label-primary hover:bg-surface-secondary"
                                  title="Inspect Document"
                                >
                                  <Eye size={14} />
                                </Button>
                                <Button
                                  isIconOnly
                                  size="sm"
                                  variant="light"
                                  color="primary"
                                  radius="lg"
                                  onPress={() => setEditDoc(doc)}
                                  className="min-w-[32px] min-h-[32px] w-8 h-8 hover:bg-primary/10"
                                  title="Edit Form"
                                >
                                  <Edit2 size={14} />
                                </Button>
                                <Button
                                  isIconOnly
                                  size="sm"
                                  variant="light"
                                  color="danger"
                                  radius="lg"
                                  onPress={() => setDeleteDoc(doc)}
                                  className="min-w-[32px] min-h-[32px] w-8 h-8 hover:bg-destructive/10"
                                  title="Delete Record"
                                >
                                  <Trash2 size={14} />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      collectionDocs.map((doc: any) => {
                        const isSelected = selectedRowIds.includes(doc._id);
                        const associatedUserId = getDocAssociatedUserId(doc, selectedCollection);

                        return (
                          <tr
                            key={doc._id}
                            className={`hover:bg-surface-secondary/70 transition-colors ${
                              isSelected ? 'bg-primary/5' : ''
                            }`}
                          >
                            <td className="py-3 px-3 text-center">
                              <Button
                                isIconOnly
                                size="sm"
                                variant="light"
                                radius="sm"
                                onPress={() => handleToggleSelectRow(doc._id)}
                                className="text-label-tertiary hover:text-label-primary p-0 min-w-[28px] min-h-[28px] w-7 h-7"
                              >
                                {isSelected ? (
                                  <CheckSquare size={15} className="text-primary" />
                                ) : (
                                  <Square size={15} />
                                )}
                              </Button>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-1">
                                <span className="font-mono text-primary font-bold text-[11px]">
                                  {doc._id.slice(0, 10)}...
                                </span>
                                <Button
                                  isIconOnly
                                  size="sm"
                                  variant="light"
                                  radius="md"
                                  onPress={(e: any) => handleCopyId(doc._id, e as any)}
                                  className="text-label-tertiary hover:text-label-primary p-0 min-w-[28px] min-h-[28px] w-7 h-7"
                                  title="Copy ObjectId"
                                >
                                  {copiedId === doc._id ? (
                                    <Check size={12} className="text-emerald-500" />
                                  ) : (
                                    <Copy size={12} />
                                  )}
                                </Button>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              {associatedUserId ? (
                                <UserBadge userId={associatedUserId} userMap={userMap} />
                              ) : (
                                <span className="text-label-tertiary text-xs italic">—</span>
                              )}
                            </td>
                            <td className="py-3 px-4 max-w-sm">
                              {renderKeyPreview(doc, selectedCollection)}
                            </td>
                            <td className="py-3 px-4 text-label-tertiary font-mono text-[11px]">
                              {doc.createdAt ? new Date(doc.createdAt).toLocaleDateString() : '—'}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="inline-flex items-center justify-end gap-1">
                                <Button
                                  isIconOnly
                                  size="sm"
                                  variant="light"
                                  radius="lg"
                                  onPress={() => setViewDoc(doc)}
                                  className="min-w-[32px] min-h-[32px] w-8 h-8 text-label-secondary hover:text-label-primary hover:bg-surface-secondary"
                                  title="Inspect Document"
                                >
                                  <Eye size={14} />
                                </Button>
                                <Button
                                  isIconOnly
                                  size="sm"
                                  variant="light"
                                  color="primary"
                                  radius="lg"
                                  onPress={() => setEditDoc(doc)}
                                  className="min-w-[32px] min-h-[32px] w-8 h-8 hover:bg-primary/10"
                                  title="Edit Form"
                                >
                                  <Edit2 size={14} />
                                </Button>
                                <Button
                                  isIconOnly
                                  size="sm"
                                  variant="light"
                                  color="danger"
                                  radius="lg"
                                  onPress={() => setDeleteDoc(doc)}
                                  className="min-w-[32px] min-h-[32px] w-8 h-8 hover:bg-destructive/10"
                                  title="Delete Record"
                                >
                                  <Trash2 size={14} />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-label-secondary pt-2">
                <span>
                  Page {collectionPagination.page} of {collectionPagination.pages || 1}
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    isIconOnly
                    size="sm"
                    variant="flat"
                    radius="lg"
                    isDisabled={collectionPagination.page <= 1}
                    onPress={() =>
                      fetchCollectionDocuments(
                        selectedCollection,
                        collectionPagination.page - 1,
                        20,
                        docSearch
                      )
                    }
                    className="min-w-[34px] min-h-[34px] w-8 h-8 bg-surface-secondary text-label-secondary hover:text-label-primary border border-separator hover:bg-surface"
                  >
                    <ChevronLeft size={16} />
                  </Button>
                  <Button
                    isIconOnly
                    size="sm"
                    variant="flat"
                    radius="lg"
                    isDisabled={collectionPagination.page >= collectionPagination.pages}
                    onPress={() =>
                      fetchCollectionDocuments(
                        selectedCollection,
                        collectionPagination.page + 1,
                        20,
                        docSearch
                      )
                    }
                    className="min-w-[34px] min-h-[34px] w-8 h-8 bg-surface-secondary text-label-secondary hover:text-label-primary border border-separator hover:bg-surface"
                  >
                    <ChevronRight size={16} />
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-16 text-center bg-surface rounded-3xl border border-separator space-y-3">
              <Database size={36} className="mx-auto text-primary/40" />
              <h3 className="text-sm font-bold text-label-primary">Select a Collection to Inspect</h3>
              <p className="text-xs text-label-tertiary">
                Click any collection button above to browse and modify raw documents.
              </p>
            </div>
          )}
        </div>
      </ErrorBoundary>
      )}

      {/* View Document Modal (Details Form & Raw JSON) */}
      <ViewDocModal
        isOpen={Boolean(viewDoc)}
        collectionName={selectedCollection || ''}
        doc={viewDoc}
        userMap={userMap}
        onClose={() => setViewDoc(null)}
        onEdit={() => {
          setEditDoc(viewDoc);
          setViewDoc(null);
        }}
      />

      {/* Edit Document Modal (Form Component) */}
      <RecordFormModal
        isOpen={Boolean(editDoc)}
        mode="edit"
        collectionName={selectedCollection || ''}
        initialData={editDoc}
        schemaFields={schemaFields}
        userMap={userMap}
        onClose={() => setEditDoc(null)}
        onSave={handleSaveEditDoc}
      />

      {/* Insert Document Modal (Form Component) */}
      <RecordFormModal
        isOpen={isNewDocModalOpen}
        mode="create"
        collectionName={selectedCollection || ''}
        schemaFields={schemaFields}
        userMap={userMap}
        onClose={() => setIsNewDocModalOpen(false)}
        onSave={handleSaveNewDoc}
      />

      {/* Delete Record Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(deleteDoc)}
        collectionName={selectedCollection || ''}
        doc={deleteDoc}
        userMap={userMap}
        onClose={() => setDeleteDoc(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};

export default DiagnosticsPage;
