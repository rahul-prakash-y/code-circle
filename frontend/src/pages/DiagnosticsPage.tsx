import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import useDiagnosticsStore, { CollectionStat } from '../store/useDiagnosticsStore';

export const DiagnosticsPage: React.FC = () => {
  const {
    healthData,
    databaseStats,
    totalCollections,
    totalDocuments,
    selectedCollection,
    collectionDocs,
    collectionPagination,
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
  } = useDiagnosticsStore();

  const [activeTab, setActiveTab] = useState<'health' | 'database'>('health');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [docSearch, setDocSearch] = useState('');

  // Modals
  const [viewDoc, setViewDoc] = useState<any | null>(null);
  const [editDoc, setEditDoc] = useState<any | null>(null);
  const [editDocJson, setEditDocJson] = useState('');
  const [isNewDocModalOpen, setIsNewDocModalOpen] = useState(false);
  const [newDocJson, setNewDocJson] = useState('{\n  \n}');

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
    fetchCollectionDocuments(colName, 1, 20);
  };

  const handleSaveEditDoc = async () => {
    if (!selectedCollection || !editDoc) return;
    try {
      const parsed = JSON.parse(editDocJson);
      const ok = await updateDocument(selectedCollection, editDoc._id, parsed);
      if (ok) setEditDoc(null);
    } catch (err: any) {
      toast.error('Invalid JSON format: ' + err.message);
    }
  };

  const handleSaveNewDoc = async () => {
    if (!selectedCollection) return;
    try {
      const parsed = JSON.parse(newDocJson);
      const ok = await createDocument(selectedCollection, parsed);
      if (ok) {
        setIsNewDocModalOpen(false);
        setNewDocJson('{\n  \n}');
      }
    } catch (err: any) {
      toast.error('Invalid JSON format: ' + err.message);
    }
  };

  const formatUptime = (seconds: number) => {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${d > 0 ? `${d}d ` : ''}${h}h ${m}m ${s}s`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-separator pb-6">
        <div>
          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest mb-1">
            <Server size={16} />
            <span>SuperAdmin Mission Control</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-label-primary tracking-tight">
            System Diagnostics & Database Manager
          </h1>
          <p className="text-xs text-label-tertiary mt-1">
            Real-time telemetry, cluster memory monitoring, cache sync, and low-level database collection explorer.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Tabs */}
          <div className="flex items-center p-1 bg-surface-secondary border border-separator rounded-2xl shadow-xs">
            <button
              onClick={() => setActiveTab('health')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'health'
                  ? 'bg-primary text-white shadow-md shadow-primary/20'
                  : 'text-label-secondary hover:text-label-primary'
              }`}
            >
              <Activity size={15} />
              <span>System Health</span>
            </button>
            <button
              onClick={() => setActiveTab('database')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'database'
                  ? 'bg-primary text-white shadow-md shadow-primary/20'
                  : 'text-label-secondary hover:text-label-primary'
              }`}
            >
              <Database size={15} />
              <span>Database Manager</span>
            </button>
          </div>
        </div>
      </div>

      {/* --- TAB 1: SYSTEM HEALTH --- */}
      {activeTab === 'health' && (
        <div className="space-y-8 animate-in fade-in duration-300">
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
            </div>

            {/* KPI 2: Event Loop Lag */}
            <div className="bg-surface p-5 rounded-2xl border border-separator shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-label-secondary uppercase tracking-wider">
                  Event Loop Latency
                </span>
                <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-xl">
                  <Zap size={18} />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-label-primary">
                  {healthData?.eventLoopLagMs || 0} ms
                </span>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  Sub-5ms
                </span>
              </div>
              <p className="text-[11px] text-label-tertiary">Real-time Node.js I/O loop responsiveness</p>
            </div>

            {/* KPI 3: Process Uptime */}
            <div className="bg-surface p-5 rounded-2xl border border-separator shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-label-secondary uppercase tracking-wider">
                  Process Uptime
                </span>
                <div className="p-2 bg-amber-500/10 text-amber-500 rounded-xl">
                  <Clock size={18} />
                </div>
              </div>
              <div className="text-xl font-black text-label-primary font-mono truncate">
                {formatUptime(healthData?.uptimeSeconds || 0)}
              </div>
              <p className="text-[11px] text-label-tertiary font-mono">
                Node {healthData?.nodeVersion || 'v20'} · {healthData?.platform || 'Node'}
              </p>
            </div>

            {/* KPI 4: Database Pool */}
            <div className="bg-surface p-5 rounded-2xl border border-separator shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-label-secondary uppercase tracking-wider">
                  MongoDB Status
                </span>
                <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-xl">
                  <Database size={18} />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                  {healthData?.database.status || 'Connected'}
                </span>
              </div>
              <p className="text-[11px] text-label-tertiary font-mono truncate">
                {healthData?.database.name || 'code_circle'} ({healthData?.database.modelsRegistered || 0} schemas)
              </p>
            </div>
          </div>

          {/* Sync & Buffer Control Panel */}
          <div className="bg-surface rounded-3xl border border-separator p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Zap size={24} />
              </div>
              <div>
                <h3 className="text-base font-bold text-label-primary">
                  Cluster Cache & Write-Buffer Synchronization
                </h3>
                <p className="text-xs text-label-tertiary mt-0.5">
                  Forces an immediate flush of high-throughput in-memory attendance queues to MongoDB Atlas and triggers cache hydration.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`px-3.5 py-2 text-xs font-semibold rounded-xl border transition-all ${
                  autoRefresh
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                    : 'bg-surface-secondary border-separator text-label-secondary hover:text-label-primary'
                }`}
              >
                Auto-Refresh {autoRefresh ? 'ON (10s)' : 'OFF'}
              </button>
              <button
                onClick={syncCache}
                disabled={syncing}
                className="px-5 py-2.5 bg-primary text-white text-xs font-bold rounded-xl shadow-md shadow-primary/20 hover:brightness-110 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <RefreshCw size={15} className={syncing ? 'animate-spin' : ''} />
                <span>{syncing ? 'Flushing Buffers...' : 'Sync Buffers Now'}</span>
              </button>
            </div>
          </div>

          {/* Infrastructure Services Grid */}
          <div className="bg-surface rounded-3xl border border-separator p-6 shadow-sm space-y-4">
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
      )}

      {/* --- TAB 2: DATABASE MANAGER --- */}
      {activeTab === 'database' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Collections Selector Chips */}
          <div className="bg-surface p-5 rounded-3xl border border-separator space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-label-secondary uppercase tracking-wider">
                MongoDB Collections ({totalCollections}) · {totalDocuments} Total Documents
              </span>
              <button
                onClick={fetchDatabaseStats}
                className="p-1.5 text-label-secondary hover:text-label-primary transition-colors"
                title="Refresh Collections"
              >
                <RefreshCw size={14} className={loadingDb ? 'animate-spin' : ''} />
              </button>
            </div>

            <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto pr-1">
              {databaseStats.map((col) => (
                <button
                  key={col.name}
                  onClick={() => handleSelectCollection(col.name)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all flex items-center gap-2 ${
                    selectedCollection === col.name
                      ? 'bg-primary text-white border-primary shadow-sm shadow-primary/20'
                      : 'bg-surface-secondary border-separator text-label-primary hover:border-primary/40 hover:bg-surface'
                  }`}
                >
                  <Database size={13} />
                  <span>{col.name}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${
                      selectedCollection === col.name
                        ? 'bg-white/20 text-white'
                        : 'bg-surface border border-separator/60 text-label-secondary'
                    }`}
                  >
                    {col.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Document Explorer Grid */}
          {selectedCollection ? (
            <div className="bg-surface rounded-3xl border border-separator shadow-sm p-6 space-y-4">
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

                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-2.5 text-label-tertiary" />
                    <input
                      type="text"
                      value={docSearch}
                      onChange={(e) => {
                        setDocSearch(e.target.value);
                        fetchCollectionDocuments(selectedCollection, 1, 20, e.target.value);
                      }}
                      placeholder="Search collection records..."
                      className="pl-8 pr-3 py-1.5 text-xs bg-surface-secondary border border-separator rounded-xl text-label-primary focus:outline-none focus:border-primary focus:bg-surface w-52"
                    />
                  </div>

                  <button
                    onClick={() => setIsNewDocModalOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-xs font-bold rounded-xl shadow-xs hover:brightness-110 transition-all shrink-0"
                  >
                    <Plus size={14} />
                    <span>Insert Doc</span>
                  </button>
                </div>
              </div>

              {/* Table of Records */}
              <div className="overflow-x-auto border border-separator rounded-2xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-secondary border-b border-separator text-label-secondary font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3 px-4">_id</th>
                      <th className="py-3 px-4">Key Preview</th>
                      <th className="py-3 px-4">Created At</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-separator text-label-primary font-medium">
                    {loadingDocs ? (
                      <tr>
                        <td colSpan={4} className="py-12 text-center text-label-tertiary animate-pulse">
                          Fetching documents from {selectedCollection}...
                        </td>
                      </tr>
                    ) : collectionDocs.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-12 text-center text-label-tertiary">
                          No documents found in this collection.
                        </td>
                      </tr>
                    ) : (
                      collectionDocs.map((doc: any) => (
                        <tr key={doc._id} className="hover:bg-surface-secondary/70 transition-colors">
                          <td className="py-3 px-4 font-mono text-primary font-bold">{doc._id}</td>
                          <td className="py-3 px-4 max-w-md truncate font-mono text-[11px] text-label-secondary">
                            {doc.title || doc.name || doc.email || doc.username || JSON.stringify(doc).slice(0, 80)}
                          </td>
                          <td className="py-3 px-4 text-label-tertiary font-mono text-[11px]">
                            {doc.createdAt ? new Date(doc.createdAt).toLocaleDateString() : '—'}
                          </td>
                          <td className="py-3 px-4 text-right space-x-1.5">
                            <button
                              onClick={() => setViewDoc(doc)}
                              className="p-1.5 hover:bg-surface-secondary text-label-secondary hover:text-label-primary rounded-lg transition-colors"
                              title="Inspect JSON"
                            >
                              <Eye size={14} />
                            </button>
                            <button
                              onClick={() => {
                                setEditDoc(doc);
                                setEditDocJson(JSON.stringify(doc, null, 2));
                              }}
                              className="p-1.5 hover:bg-primary/10 text-primary rounded-lg transition-colors"
                              title="Edit Document"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Delete document ${doc._id}?`)) {
                                  deleteDocument(selectedCollection, doc._id);
                                }
                              }}
                              className="p-1.5 hover:bg-destructive/10 text-destructive rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between text-xs text-label-secondary pt-2">
                <span>
                  Page {collectionPagination.page} of {collectionPagination.pages || 1}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={collectionPagination.page <= 1}
                    onClick={() =>
                      fetchCollectionDocuments(
                        selectedCollection,
                        collectionPagination.page - 1,
                        20,
                        docSearch
                      )
                    }
                    className="p-1.5 bg-surface-secondary text-label-secondary hover:text-label-primary rounded-lg border border-separator disabled:opacity-30 hover:bg-surface transition-colors"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    disabled={collectionPagination.page >= collectionPagination.pages}
                    onClick={() =>
                      fetchCollectionDocuments(
                        selectedCollection,
                        collectionPagination.page + 1,
                        20,
                        docSearch
                      )
                    }
                    className="p-1.5 bg-surface-secondary text-label-secondary hover:text-label-primary rounded-lg border border-separator disabled:opacity-30 hover:bg-surface transition-colors"
                  >
                    <ChevronRight size={16} />
                  </button>
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
      )}

      {/* View Document Modal */}
      <AnimatePresence>
        {viewDoc && (
          <div className="fixed inset-0 z-50 bg-black/40 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface rounded-2xl border border-separator max-w-2xl w-full p-6 space-y-4 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
            >
              <div className="flex items-center justify-between border-b border-separator pb-3">
                <h3 className="text-sm font-bold text-label-primary font-mono">
                  Inspect Document: {viewDoc._id}
                </h3>
                <button
                  onClick={() => setViewDoc(null)}
                  className="p-1 hover:bg-surface-secondary rounded-lg text-label-tertiary hover:text-label-primary"
                >
                  <X size={16} />
                </button>
              </div>
              <pre className="flex-1 overflow-auto bg-surface-secondary dark:bg-zinc-950 p-4 rounded-xl text-xs font-mono text-label-primary dark:text-emerald-400 border border-separator">
                {JSON.stringify(viewDoc, null, 2)}
              </pre>
              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setViewDoc(null)}
                  className="px-4 py-2 bg-surface-secondary text-label-primary text-xs font-bold rounded-xl border border-separator hover:bg-surface transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Document Modal */}
      <AnimatePresence>
        {editDoc && (
          <div className="fixed inset-0 z-50 bg-black/40 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface rounded-2xl border border-separator max-w-2xl w-full p-6 space-y-4 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
            >
              <div className="flex items-center justify-between border-b border-separator pb-3">
                <h3 className="text-sm font-bold text-label-primary font-mono">
                  Edit Document ({editDoc._id})
                </h3>
                <button
                  onClick={() => setEditDoc(null)}
                  className="p-1 hover:bg-surface-secondary rounded-lg text-label-tertiary hover:text-label-primary"
                >
                  <X size={16} />
                </button>
              </div>
              <textarea
                rows={14}
                value={editDocJson}
                onChange={(e) => setEditDocJson(e.target.value)}
                className="w-full flex-1 font-mono text-xs p-4 bg-surface-secondary dark:bg-zinc-950 border border-separator rounded-xl text-label-primary focus:outline-none focus:border-primary resize-none"
              />
              <div className="flex justify-end gap-2 pt-2 border-t border-separator">
                <button
                  onClick={() => setEditDoc(null)}
                  className="px-4 py-2 text-xs font-bold text-label-secondary hover:text-label-primary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEditDoc}
                  className="px-5 py-2 bg-primary text-white text-xs font-bold rounded-xl shadow-xs hover:brightness-110 active:scale-95 transition-all"
                >
                  Save Changes
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Insert Document Modal */}
      <AnimatePresence>
        {isNewDocModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/40 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface rounded-2xl border border-separator max-w-2xl w-full p-6 space-y-4 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
            >
              <div className="flex items-center justify-between border-b border-separator pb-3">
                <h3 className="text-sm font-bold text-label-primary font-mono">
                  Insert Document into '{selectedCollection}'
                </h3>
                <button
                  onClick={() => setIsNewDocModalOpen(false)}
                  className="p-1 hover:bg-surface-secondary rounded-lg text-label-tertiary hover:text-label-primary"
                >
                  <X size={16} />
                </button>
              </div>
              <textarea
                rows={12}
                value={newDocJson}
                onChange={(e) => setNewDocJson(e.target.value)}
                className="w-full flex-1 font-mono text-xs p-4 bg-surface-secondary dark:bg-zinc-950 border border-separator rounded-xl text-label-primary focus:outline-none focus:border-primary resize-none"
              />
              <div className="flex justify-end gap-2 pt-2 border-t border-separator">
                <button
                  onClick={() => setIsNewDocModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-label-secondary hover:text-label-primary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveNewDoc}
                  className="px-5 py-2 bg-primary text-white text-xs font-bold rounded-xl shadow-xs hover:brightness-110 active:scale-95 transition-all"
                >
                  Insert Document
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DiagnosticsPage;
