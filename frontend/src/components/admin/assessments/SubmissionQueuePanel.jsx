import React, { useState, useEffect, useCallback } from 'react';
import {
  Database,
  RefreshCw,
  Download,
  AlertTriangle,
  CheckCircle2,
  Clock,
  RotateCcw,
  Server,
  ShieldAlert,
} from 'lucide-react';
import { Button } from '@heroui/react';
import toast from 'react-hot-toast';
import api from '../../../lib/axios';

export const SubmissionQueuePanel = () => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await api.get('/assessments/admin/queue/status');
      if (res.data?.success) {
        setStatus(res.data.data);
      }
    } catch (err) {
      console.warn('[SubmissionQueuePanel] Error fetching status:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    // Auto-poll every 3 seconds for live exam monitoring
    const timer = setInterval(fetchStatus, 3000);
    return () => clearInterval(timer);
  }, [fetchStatus]);

  const handleFlushNow = async () => {
    setActionLoading('flush');
    try {
      const res = await api.post('/assessments/admin/queue/flush-now');
      if (res.data?.success) {
        toast.success(`Flushed ${res.data.flushedCount} item(s) to MongoDB!`);
        fetchStatus();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to flush queue');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRetryFailed = async () => {
    setActionLoading('retry');
    try {
      const res = await api.post('/assessments/admin/queue/retry-failed');
      if (res.data?.success) {
        toast.success(`Moved ${res.data.retriedCount} failed item(s) back to queue!`);
        fetchStatus();
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to retry failed items');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDownloadBackup = async () => {
    setActionLoading('backup');
    try {
      const res = await api.get('/assessments/admin/queue/download-backup');
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(res.data, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute(
        'download',
        `submission-queue-backup-${status?.nodeId || 'node'}-${Date.now()}.json`
      );
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      toast.success('In-memory queue backup downloaded successfully!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to download queue backup');
    } finally {
      setActionLoading(null);
    }
  };

  const pendingCount = status?.pendingCount ?? 0;
  const isWarningActive = pendingCount > 0;

  return (
    <div className="rounded-2xl border border-separator/80 bg-surface-secondary/50 p-5 backdrop-blur-sm space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-label-primary">
                In-Memory Submission Buffer & Queue
              </h3>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono font-medium bg-surface-tertiary border border-separator text-label-secondary">
                <Server className="w-3 h-3" />
                {status?.nodeId || 'Detecting node...'}
              </span>
            </div>
            <p className="text-xs text-label-secondary mt-0.5">
              Live batch persistence monitor (Capped at 60 doc writes/sec to MongoDB Atlas)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            isIconOnly
            onPress={fetchStatus}
            isDisabled={loading}
            className="h-8 w-8 rounded-lg"
            title="Refresh Status"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </Button>

          <Button
            size="sm"
            variant="secondary"
            onPress={handleDownloadBackup}
            isDisabled={actionLoading === 'backup'}
            className="h-8 px-3 text-xs font-medium flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Backup</span>
          </Button>

          <Button
            size="sm"
            variant="primary"
            onPress={handleFlushNow}
            isDisabled={actionLoading === 'flush' || pendingCount === 0}
            className="h-8 px-3 text-xs font-semibold flex items-center gap-1.5"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${actionLoading === 'flush' ? 'animate-spin' : ''}`} />
            <span>Flush Now</span>
          </Button>
        </div>
      </div>

      {/* Warning Banner while pending > 0 */}
      {isWarningActive && (
        <div className="rounded-xl border border-warning/40 bg-warning/10 p-3.5 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
          <div className="text-xs text-warning-foreground">
            <p className="font-semibold text-warning">
              DO NOT END EXAM, RESTART SERVER, OR DEPLOY CODE
            </p>
            <p className="mt-0.5 opacity-90">
              There are currently <strong>{pendingCount} submission(s)</strong> waiting in node process memory for durable MongoDB flush.
              Click &quot;Flush Now&quot; or allow the auto-flusher to drain the queue before taking action.
            </p>
          </div>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-3 rounded-xl bg-surface border border-separator/60">
          <p className="text-label-tertiary">Pending Queue</p>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className={`text-xl font-bold font-mono ${pendingCount > 0 ? 'text-warning' : 'text-label-primary'}`}>
              {pendingCount}
            </span>
            <span className="text-label-tertiary text-[11px]">in memory</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-surface border border-separator/60">
          <p className="text-label-tertiary">Oldest Pending</p>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-xl font-bold font-mono text-label-primary">
              {status?.oldestPendingAgeSeconds ?? 0}s
            </span>
            <span className="text-label-tertiary text-[11px]">in flight</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-surface border border-separator/60">
          <p className="text-label-tertiary">Failed Submissions</p>
          <div className="flex items-baseline justify-between mt-1">
            <span className={`text-xl font-bold font-mono ${(status?.failedCount ?? 0) > 0 ? 'text-danger' : 'text-label-primary'}`}>
              {status?.failedCount ?? 0}
            </span>
            {(status?.failedCount ?? 0) > 0 && (
              <Button
                size="sm"
                variant="ghost"
                onPress={handleRetryFailed}
                isDisabled={actionLoading === 'retry'}
                className="h-6 px-2 text-[10px] text-danger"
              >
                Retry All
              </Button>
            )}
          </div>
        </div>

        <div className="p-3 rounded-xl bg-surface border border-separator/60">
          <p className="text-label-tertiary">Last Flush</p>
          <div className="flex items-center gap-1.5 mt-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0" />
            <span className="text-[11px] font-mono text-label-secondary truncate">
              {status?.lastSuccessfulFlush
                ? new Date(status.lastSuccessfulFlush).toLocaleTimeString()
                : 'Pending first flush'}
            </span>
          </div>
        </div>
      </div>

      {/* Failed Items Drawer if any exist */}
      {(status?.failedItems?.length ?? 0) > 0 && (
        <div className="rounded-xl border border-danger/30 bg-danger/5 p-3.5 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-danger">
            <span className="flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4" />
              Failed Submissions Requiring Attention ({status.failedItems.length})
            </span>
            <Button
              size="sm"
              variant="secondary"
              onPress={handleRetryFailed}
              className="h-6 px-2.5 text-[11px]"
            >
              Retry Failed
            </Button>
          </div>
          <div className="max-h-36 overflow-y-auto space-y-1.5 text-[11px] font-mono text-label-secondary">
            {status.failedItems.map((item, idx) => (
              <div
                key={item.submissionId || idx}
                className="p-2 rounded-lg bg-surface border border-separator flex items-center justify-between gap-2"
              >
                <div className="truncate">
                  <span className="text-label-primary font-medium">{item.submissionId}</span>
                  <span className="text-danger ml-2">({item.error})</span>
                </div>
                <span className="text-label-tertiary shrink-0">Attempts: {item.attempts}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SubmissionQueuePanel;
