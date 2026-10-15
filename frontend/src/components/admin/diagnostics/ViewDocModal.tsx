import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Check, FileText, Code, Edit2 } from 'lucide-react';
import { UserBadge } from './UserBadge';
import { UserLookupItem } from '../../../store/useDiagnosticsStore';

interface ViewDocModalProps {
  isOpen: boolean;
  collectionName: string;
  doc: any;
  userMap?: Record<string, UserLookupItem>;
  onClose: () => void;
  onEdit?: () => void;
}

export const ViewDocModal: React.FC<ViewDocModalProps> = ({
  isOpen,
  collectionName,
  doc,
  userMap = {},
  onClose,
  onEdit,
}) => {
  const [activeTab, setActiveTab] = useState<'details' | 'json'>('details');
  const [copied, setCopied] = useState(false);

  if (!isOpen || !doc) return null;

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(doc, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const userRefRegex = /(user|student|createdby|updatedby|author|instructor|unblockedby|member|mentor)/i;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 dark:bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="bg-surface rounded-3xl border border-separator max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-separator px-6 py-4 bg-surface-secondary/40">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-surface border border-separator text-label-secondary">
                {collectionName}
              </span>
              <span className="text-xs font-mono text-label-secondary">
                _id: <span className="font-bold text-primary">{doc._id}</span>
              </span>
            </div>
            <h3 className="text-base font-bold text-label-primary mt-1 truncate max-w-md">
              {doc.title || doc.name || doc.email || doc.username || `Document Details`}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            {/* Tab switch */}
            <div className="flex items-center p-1 bg-surface-secondary border border-separator rounded-xl">
              <button
                type="button"
                onClick={() => setActiveTab('details')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'details'
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-label-secondary hover:text-label-primary'
                }`}
              >
                <FileText size={13} />
                <span>Details</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('json')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'json'
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-label-secondary hover:text-label-primary'
                }`}
              >
                <Code size={13} />
                <span>JSON</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 hover:bg-surface-secondary rounded-xl text-label-tertiary hover:text-label-primary transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'json' ? (
            <div className="relative">
              <button
                onClick={handleCopyJson}
                className="absolute top-3 right-3 px-2.5 py-1.5 bg-surface rounded-xl border border-separator text-xs font-semibold text-label-secondary hover:text-label-primary transition-colors flex items-center gap-1.5 shadow-xs"
              >
                {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                <span>{copied ? 'Copied!' : 'Copy JSON'}</span>
              </button>
              <pre className="overflow-auto bg-surface-secondary dark:bg-zinc-950 p-4 rounded-2xl text-xs font-mono text-label-primary dark:text-emerald-400 border border-separator leading-relaxed max-h-[50vh]">
                {JSON.stringify(doc, null, 2)}
              </pre>
            </div>
          ) : (
            <div className="space-y-3">
              {Object.entries(doc).map(([key, val]) => {
                const isUserField =
                  userRefRegex.test(key) ||
                  (typeof val === 'string' && userMap[val]) ||
                  (collectionName === 'users' && key === '_id');

                return (
                  <div
                    key={key}
                    className="p-3 bg-surface-secondary/50 rounded-2xl border border-separator/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <span className="text-xs font-bold text-label-secondary font-mono shrink-0 min-w-[140px]">
                      {key}
                    </span>

                    <div className="flex-1 text-right sm:text-right text-xs">
                      {isUserField && val ? (
                        <div className="flex sm:justify-end">
                          <UserBadge
                            userId={typeof val === 'object' && val?._id ? val._id : String(val)}
                            userMap={userMap}
                            showId
                          />
                        </div>
                      ) : typeof val === 'boolean' ? (
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            val
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                              : 'bg-surface border border-separator text-label-tertiary'
                          }`}
                        >
                          {val ? 'TRUE' : 'FALSE'}
                        </span>
                      ) : key.endsWith('At') && typeof val === 'string' ? (
                        <span className="font-mono text-label-secondary">
                          {new Date(val).toLocaleString()}
                        </span>
                      ) : Array.isArray(val) ? (
                        <div className="flex flex-wrap sm:justify-end gap-1">
                          {val.map((item: any, i: number) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded-lg bg-surface border border-separator text-[11px] font-mono"
                            >
                              {typeof item === 'object' ? JSON.stringify(item) : String(item)}
                            </span>
                          ))}
                        </div>
                      ) : typeof val === 'object' && val !== null ? (
                        <pre className="font-mono text-[10px] text-left p-2 bg-surface rounded-xl border border-separator overflow-x-auto max-h-28">
                          {JSON.stringify(val, null, 2)}
                        </pre>
                      ) : (
                        <span className="text-label-primary font-medium select-all break-all">
                          {String(val ?? '—')}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-separator px-6 py-4 bg-surface-secondary/40">
          <button
            onClick={handleCopyJson}
            className="flex items-center gap-1.5 text-xs font-semibold text-label-secondary hover:text-label-primary transition-colors"
          >
            {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
            <span>{copied ? 'JSON Copied' : 'Copy Full Document'}</span>
          </button>

          <div className="flex items-center gap-2">
            {onEdit && (
              <button
                onClick={() => {
                  onClose();
                  onEdit();
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl shadow-xs hover:brightness-110 transition-all"
              >
                <Edit2 size={13} />
                <span>Edit Document</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 bg-surface-secondary text-label-primary text-xs font-bold rounded-xl border border-separator hover:bg-surface transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ViewDocModal;
