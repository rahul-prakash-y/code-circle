import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  Wifi,
  WifiOff,
  AlertOctagon,
  Lock,
} from 'lucide-react';
import { Button } from '@heroui/react';
import toast from 'react-hot-toast';
import useAuthStore from '../../../store/useAuthStore';
import { DEFAULT_BACKEND_NODES } from '../../../store/useServerStore';

export const SubmissionQueuePanel = () => {
  const { token } = useAuthStore();
  const [nodeStatuses, setNodeStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [showEndExamModal, setShowEndExamModal] = useState(false);
  const [confirmOfflineAck, setConfirmOfflineAck] = useState(false);

  // Compute list of cluster backend nodes
  const clusterNodes = useMemo(() => {
    const envServers = import.meta.env.VITE_BACKEND_SERVERS;
    if (typeof envServers === 'string' && envServers.trim().length > 0) {
      return envServers
        .split(',')
        .map((s) => s.trim().replace(/\/+$/, ''))
        .filter(Boolean);
    }
    const envBaseUrl = import.meta.env.VITE_API_BASE_URL
      ? import.meta.env.VITE_API_BASE_URL.replace(/\/api\/?$/, '').replace(/\/+$/, '')
      : null;
    const candidates = [envBaseUrl, ...DEFAULT_BACKEND_NODES].filter(Boolean);
    return Array.from(new Set(candidates.map((c) => c.replace(/\/+$/, ''))));
  }, []);

  /**
   * Browser-side Fan-out:
   * Polls every cluster node concurrently using Promise.allSettled with a 60s timeout.
   * If a node is unreachable or offline, status is 'offline' and metrics are 'unknown' (never 0).
   */
  const fetchAllNodesStatus = useCallback(async () => {
    if (!token) return;

    const settled = await Promise.allSettled(
      clusterNodes.map(async (nodeUrl) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout per requirement

        try {
          // Parallel probe: fetch queue status and health (to check JWT fingerprint)
          const [queueRes, healthRes] = await Promise.all([
            fetch(`${nodeUrl}/api/assessments/admin/queue/status`, {
              method: 'GET',
              headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/json',
              },
              signal: controller.signal,
            }),
            fetch(`${nodeUrl}/api/health`, {
              method: 'GET',
              headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/json',
              },
              signal: controller.signal,
            }).catch(() => null),
          ]);

          clearTimeout(timeoutId);

          if (!queueRes.ok) {
            throw new Error(`HTTP ${queueRes.status}`);
          }

          const queueJson = await queueRes.json();
          const healthJson = healthRes && healthRes.ok ? await healthRes.json() : null;

          return {
            nodeUrl,
            status: 'online',
            nodeId: queueJson.data?.nodeId || healthJson?.nodeId || nodeUrl,
            jwtFingerprint: healthJson?.jwtFingerprint || 'unknown',
            pendingCount: queueJson.data?.pendingCount ?? 0,
            oldestPendingAgeSeconds: queueJson.data?.oldestPendingAgeSeconds ?? 0,
            lastSuccessfulFlush: queueJson.data?.lastSuccessfulFlush ?? null,
            failedCount: queueJson.data?.failedCount ?? 0,
            failedItems: queueJson.data?.failedItems || [],
            isFlushing: Boolean(queueJson.data?.isFlushing),
            warningMessage: queueJson.data?.warningMessage,
          };
        } catch (err) {
          clearTimeout(timeoutId);
          return {
            nodeUrl,
            status: 'offline',
            nodeId: nodeUrl,
            jwtFingerprint: 'unknown',
            pendingCount: 'unknown', // CRITICAL: Offline nodes show "unknown", never 0
            oldestPendingAgeSeconds: 'unknown',
            lastSuccessfulFlush: 'unknown',
            failedCount: 'unknown',
            failedItems: [],
            isFlushing: false,
            error: err.message || 'Connection failed',
          };
        }
      })
    );

    const results = settled.map((s, idx) =>
      s.status === 'fulfilled'
        ? s.value
        : {
            nodeUrl: clusterNodes[idx],
            status: 'offline',
            nodeId: clusterNodes[idx],
            jwtFingerprint: 'unknown',
            pendingCount: 'unknown',
            oldestPendingAgeSeconds: 'unknown',
            lastSuccessfulFlush: 'unknown',
            failedCount: 'unknown',
            failedItems: [],
            isFlushing: false,
            error: s.reason?.message || 'Request failed',
          }
    );

    setNodeStatuses(results);
    setLoading(false);
  }, [clusterNodes, token]);

  useEffect(() => {
    fetchAllNodesStatus();
    // Auto-poll cluster status every 4 seconds for live exam monitoring
    const timer = setInterval(fetchAllNodesStatus, 4000);
    return () => clearInterval(timer);
  }, [fetchAllNodesStatus]);

  // Actions per node
  const handleFlushNode = async (nodeUrl) => {
    setActionLoading(`flush-${nodeUrl}`);
    try {
      const res = await fetch(`${nodeUrl}/api/assessments/admin/queue/flush-now`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`Node ${nodeUrl}: Flushed ${data.flushedCount} item(s)!`);
        fetchAllNodesStatus();
      } else {
        toast.error(`Node ${nodeUrl}: ${data.error || 'Flush failed'}`);
      }
    } catch (err) {
      toast.error(`Node ${nodeUrl}: Network error triggering flush`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRetryFailedNode = async (nodeUrl) => {
    setActionLoading(`retry-${nodeUrl}`);
    try {
      const res = await fetch(`${nodeUrl}/api/assessments/admin/queue/retry-failed`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`Node ${nodeUrl}: Retried ${data.retriedCount} failed item(s)!`);
        fetchAllNodesStatus();
      } else {
        toast.error(`Node ${nodeUrl}: ${data.error || 'Retry failed'}`);
      }
    } catch (err) {
      toast.error(`Node ${nodeUrl}: Network error`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDownloadBackupNode = async (nodeUrl, nodeId) => {
    setActionLoading(`backup-${nodeUrl}`);
    try {
      const res = await fetch(`${nodeUrl}/api/assessments/admin/queue/download-backup`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute(
        'download',
        `submission-queue-backup-${nodeId || 'node'}-${Date.now()}.json`
      );
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      toast.success(`Backup downloaded for ${nodeId || nodeUrl}!`);
    } catch (err) {
      toast.error(`Failed to download backup from ${nodeUrl}: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  // Cluster-wide Global Actions
  const handleFlushAll = async () => {
    setActionLoading('flush-all');
    const onlineNodes = nodeStatuses.filter((n) => n.status === 'online');
    if (onlineNodes.length === 0) {
      toast.error('No online nodes available to flush');
      setActionLoading(null);
      return;
    }

    const promises = onlineNodes.map((n) =>
      fetch(`${n.nodeUrl}/api/assessments/admin/queue/flush-now`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
    );

    const results = await Promise.allSettled(promises);
    const successCount = results.filter((r) => r.status === 'fulfilled' && r.value.ok).length;
    toast.success(`Triggered Flush All across ${successCount}/${onlineNodes.length} nodes!`);
    fetchAllNodesStatus();
    setActionLoading(null);
  };

  const handleDownloadAllBackups = async () => {
    setActionLoading('backup-all');
    const onlineNodes = nodeStatuses.filter((n) => n.status === 'online');
    for (const node of onlineNodes) {
      await handleDownloadBackupNode(node.nodeUrl, node.nodeId);
    }
    toast.success(`Downloaded backups for all ${onlineNodes.length} online nodes!`);
    setActionLoading(null);
  };

  // Aggregate Metrics across cluster
  const totalPendingAcrossNodes = nodeStatuses.reduce((acc, n) => {
    return typeof n.pendingCount === 'number' ? acc + n.pendingCount : acc;
  }, 0);

  const hasOfflineNodes = nodeStatuses.some((n) => n.status === 'offline');
  const hasPendingSubmissions = totalPendingAcrossNodes > 0;

  // JWT Secret Consistency Check
  const onlineFingerprints = Array.from(
    new Set(
      nodeStatuses
        .filter((n) => n.status === 'online' && n.jwtFingerprint && n.jwtFingerprint !== 'unknown')
        .map((n) => n.jwtFingerprint)
    )
  );
  const isJwtSecretMismatched = onlineFingerprints.length > 1;

  // End Exam Button Blocking Logic
  const canEndExamDirectly = !hasPendingSubmissions && !hasOfflineNodes;
  const isEndExamBlocked = hasPendingSubmissions;

  const handleEndExamClick = () => {
    if (hasPendingSubmissions) {
      toast.error(
        `Cannot end exam: ${totalPendingAcrossNodes} submission(s) pending durable write in memory across cluster!`
      );
      return;
    }
    if (hasOfflineNodes) {
      // Require explicit admin confirmation for offline nodes
      setShowEndExamModal(true);
      return;
    }
    toast.success('All cluster nodes confirmed pending = 0. Exam concluded safely!');
  };

  return (
    <div className="rounded-3xl border border-separator/80 bg-surface-secondary/40 p-5 sm:p-6 backdrop-blur-md space-y-5 shadow-sm">
      {/* ── TOP HEADER & CLUSTER ACTIONS ────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-separator/60">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider bg-accent/10 border border-accent/20 text-accent">
              <Server size={12} className="text-accent" />
              <span>Multi-Node Cluster Admin</span>
            </span>
            <span className="text-xs text-label-tertiary">
              ({nodeStatuses.filter((n) => n.status === 'online').length}/{clusterNodes.length} Online)
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-label-primary flex items-center gap-2">
            <Database size={22} className="text-accent" />
            Live Exam Submission Queue Monitor
          </h2>
          <p className="text-xs sm:text-[13px] text-label-secondary mt-1">
            Browser-side fan-out across all {clusterNodes.length} horizontal Render instances.
            Monitors in-memory bounded queues, batch writes (cap 60 docs/s), and failover state.
          </p>
        </div>

        {/* Global Toolbar */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Button
            size="sm"
            variant="flat"
            color="primary"
            isLoading={actionLoading === 'flush-all'}
            onPress={handleFlushAll}
            className="text-xs font-semibold"
          >
            <RefreshCw size={14} className="mr-1" />
            Flush All
          </Button>

          <Button
            size="sm"
            variant="flat"
            color="secondary"
            isLoading={actionLoading === 'backup-all'}
            onPress={handleDownloadAllBackups}
            className="text-xs font-semibold"
          >
            <Download size={14} className="mr-1" />
            Download All Backups
          </Button>

          <Button
            size="sm"
            variant={canEndExamDirectly ? 'solid' : 'ghost'}
            color={canEndExamDirectly ? 'danger' : 'default'}
            onPress={handleEndExamClick}
            className={`text-xs font-semibold ${
              isEndExamBlocked ? 'opacity-50 cursor-not-allowed border-danger/40 text-danger' : ''
            }`}
            title={
              isEndExamBlocked
                ? 'Blocked: Submissions pending in memory'
                : hasOfflineNodes
                ? 'Requires explicit confirmation for offline nodes'
                : 'Conclude exam safely'
            }
          >
            {isEndExamBlocked && <Lock size={12} className="mr-1" />}
            End Exam
          </Button>
        </div>
      </div>

      {/* ── CRITICAL JWT SECRET MISMATCH ALERT ───────────────────────── */}
      {isJwtSecretMismatched && (
        <div className="p-4 rounded-2xl bg-danger/10 border-2 border-danger/30 text-danger flex items-start gap-3">
          <ShieldAlert size={20} className="shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm">
            <p className="font-semibold">
              ⚠️ CRITICAL JWT_SECRET MISMATCH DETECTED ACROSS CLUSTER NODES!
            </p>
            <p className="mt-1 text-danger/90">
              Multiple backend nodes return different JWT secret fingerprints (
              {onlineFingerprints.join(', ')}). A candidate authenticated on Node A will fail token
              verification if routed to Node B! Immediately align `JWT_SECRET` environment
              variables on all Render instances.
            </p>
          </div>
        </div>
      )}

      {/* ── CLUSTER WARNING BANNER (Pending Submissions in RAM) ───────── */}
      {hasPendingSubmissions && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 flex items-start gap-3 animate-pulse">
          <AlertTriangle size={20} className="shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
          <div className="text-xs sm:text-sm">
            <p className="font-semibold">
              ⚠️ WARNING: {totalPendingAcrossNodes} submission(s) pending durable write in memory!
            </p>
            <p className="mt-0.5 text-amber-700/80 dark:text-amber-300/80">
              Submissions are being written to MongoDB in controlled batches (capped at 60 doc
              writes/sec to protect Atlas M0).{' '}
              <strong>Do not end the exam, reboot instances, or deploy until all queues reach 0.</strong>
            </p>
          </div>
        </div>
      )}

      {/* ── UNREACHABLE NODES NOTICE ─────────────────────────────────── */}
      {hasOfflineNodes && !hasPendingSubmissions && (
        <div className="p-3.5 rounded-2xl bg-warning/10 border border-warning/30 text-warning-700 dark:text-warning-300 flex items-start gap-2.5">
          <WifiOff size={16} className="shrink-0 mt-0.5" />
          <p className="text-xs">
            One or more cluster nodes are currently unreachable. Offline node in-memory queue status
            is <strong>unknown</strong> (never assumed 0). Ending exam requires explicit administrator confirmation.
          </p>
        </div>
      )}

      {/* ── INDIVIDUAL NODE CARDS (Fan-Out Display) ───────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {nodeStatuses.map((node, index) => {
          const isOnline = node.status === 'online';
          const isPending = typeof node.pendingCount === 'number' && node.pendingCount > 0;
          const isFailed = typeof node.failedCount === 'number' && node.failedCount > 0;

          return (
            <div
              key={node.nodeUrl}
              className={`rounded-2xl p-4 border transition-all ${
                isOnline
                  ? isPending
                    ? 'bg-amber-500/5 border-amber-500/40 shadow-xs'
                    : 'bg-surface border-separator shadow-xs'
                  : 'bg-danger/5 border-danger/30 opacity-80'
              }`}
            >
              {/* Card Header: Node ID & Health Badge */}
              <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-separator/60">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-xs sm:text-sm text-label-primary truncate">
                      Node {index + 1}
                    </span>
                    <span className="text-[10px] text-label-tertiary truncate">
                      ({node.nodeId.substring(0, 16)})
                    </span>
                  </div>
                  <p className="text-[11px] text-label-tertiary truncate">{node.nodeUrl}</p>
                </div>

                <div className="shrink-0">
                  {isOnline ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      <Wifi size={10} /> Online
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-danger/10 text-danger border border-danger/20">
                      <WifiOff size={10} /> Offline
                    </span>
                  )}
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-2 my-3 text-xs">
                <div className="p-2 rounded-xl bg-surface-secondary/60 border border-separator/60">
                  <p className="text-[10px] font-medium text-label-tertiary uppercase">Pending in RAM</p>
                  <p
                    className={`text-base font-bold tabular-nums mt-0.5 ${
                      isOnline
                        ? isPending
                          ? 'text-amber-500 animate-pulse'
                          : 'text-label-primary'
                        : 'text-label-tertiary italic'
                    }`}
                  >
                    {isOnline ? node.pendingCount : 'unknown'}
                  </p>
                </div>

                <div className="p-2 rounded-xl bg-surface-secondary/60 border border-separator/60">
                  <p className="text-[10px] font-medium text-label-tertiary uppercase">Oldest In Queue</p>
                  <p className="text-base font-bold tabular-nums text-label-primary mt-0.5">
                    {isOnline ? `${node.oldestPendingAgeSeconds}s` : 'unknown'}
                  </p>
                </div>

                <div className="p-2 rounded-xl bg-surface-secondary/60 border border-separator/60">
                  <p className="text-[10px] font-medium text-label-tertiary uppercase">Failed Items</p>
                  <p
                    className={`text-base font-bold tabular-nums mt-0.5 ${
                      isFailed ? 'text-danger' : 'text-label-primary'
                    }`}
                  >
                    {isOnline ? node.failedCount : 'unknown'}
                  </p>
                </div>

                <div className="p-2 rounded-xl bg-surface-secondary/60 border border-separator/60">
                  <p className="text-[10px] font-medium text-label-tertiary uppercase">JWT Secret</p>
                  <p className="text-xs font-mono font-bold text-label-secondary mt-1">
                    {isOnline ? node.jwtFingerprint : 'unknown'}
                  </p>
                </div>
              </div>

              {/* Last Successful Flush Timestamp */}
              <div className="text-[11px] text-label-tertiary flex items-center justify-between pb-3">
                <span>Last flush:</span>
                <span className="font-mono text-label-secondary">
                  {node.lastSuccessfulFlush && isOnline
                    ? new Date(node.lastSuccessfulFlush).toLocaleTimeString()
                    : isOnline
                    ? 'None yet'
                    : 'unknown'}
                </span>
              </div>

              {/* Per-Node Action Controls */}
              <div className="flex items-center gap-1.5 pt-2 border-t border-separator/60">
                <Button
                  size="sm"
                  variant="flat"
                  isDisabled={!isOnline}
                  isLoading={actionLoading === `flush-${node.nodeUrl}`}
                  onPress={() => handleFlushNode(node.nodeUrl)}
                  className="flex-1 text-[11px] h-7"
                >
                  <RefreshCw size={11} className="mr-1" />
                  Flush
                </Button>

                <Button
                  size="sm"
                  variant="flat"
                  isDisabled={!isOnline || (node.failedCount === 0 || node.failedCount === 'unknown')}
                  isLoading={actionLoading === `retry-${node.nodeUrl}`}
                  onPress={() => handleRetryFailedNode(node.nodeUrl)}
                  className="text-[11px] h-7"
                >
                  <RotateCcw size={11} className="mr-1" />
                  Retry
                </Button>

                <Button
                  size="sm"
                  variant="flat"
                  isDisabled={!isOnline}
                  isLoading={actionLoading === `backup-${node.nodeUrl}`}
                  onPress={() => handleDownloadBackupNode(node.nodeUrl, node.nodeId)}
                  className="text-[11px] h-7"
                  title="Download in-memory JSON backup from this node"
                >
                  <Download size={11} />
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── OFFLINE NODES END-EXAM CONFIRMATION MODAL ─────────────────── */}
      {showEndExamModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md p-6 rounded-3xl bg-surface border border-separator shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-warning">
              <AlertOctagon size={28} />
              <h3 className="text-lg font-semibold text-label-primary">
                Unreachable Cluster Node Confirmation
              </h3>
            </div>

            <p className="text-xs text-label-secondary leading-relaxed">
              One or more cluster nodes did not respond to status probes. Their in-memory queue
              state is <strong>unknown</strong>. Submissions currently buffered in RAM on those
              instances could be lost if you end the exam or terminate servers now.
            </p>

            <div className="p-3 rounded-xl bg-surface-secondary border border-separator text-xs space-y-1">
              <p className="font-semibold text-label-primary">Unreachable Nodes:</p>
              {nodeStatuses
                .filter((n) => n.status === 'offline')
                .map((n) => (
                  <p key={n.nodeUrl} className="font-mono text-danger text-[11px]">
                    • {n.nodeUrl} ({n.error})
                  </p>
                ))}
            </div>

            <label className="flex items-start gap-2.5 text-xs text-label-secondary cursor-pointer">
              <input
                type="checkbox"
                checked={confirmOfflineAck}
                onChange={(e) => setConfirmOfflineAck(e.target.checked)}
                className="mt-0.5 rounded border-separator text-accent focus:ring-accent"
              />
              <span>
                I understand the risk and confirm that unreachable instances have either been backed
                up or contain no student submissions.
              </span>
            </label>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button
                size="sm"
                variant="ghost"
                onPress={() => {
                  setShowEndExamModal(false);
                  setConfirmOfflineAck(false);
                }}
              >
                Cancel
              </Button>

              <Button
                size="sm"
                color="danger"
                isDisabled={!confirmOfflineAck}
                onPress={() => {
                  setShowEndExamModal(false);
                  setConfirmOfflineAck(false);
                  toast.success('Exam concluded with administrator override.');
                }}
              >
                Confirm End Exam
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubmissionQueuePanel;
