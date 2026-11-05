import React, { useState } from 'react';
import ResponsiveModal from '../../ui/ResponsiveModal';
import { Copy, Check, FileText, Code, Edit2 } from 'lucide-react';
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
    <ResponsiveModal
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-accent/10 text-accent flex items-center justify-center shrink-0">
            <FileText className="w-4 h-4" />
          </div>
          <span>{doc.title || doc.name || doc.email || doc.username || 'Document Details'}</span>
        </div>
      }
      description={`Collection: ${collectionName} • ID: ${doc._id}`}
      dialogClassName="sm:max-w-2xl p-6"
    >
      <div className="space-y-4 pt-2">
        {/* Tab switch header */}
        <div className="flex items-center justify-between p-1 bg-surface-secondary border border-separator rounded-2xl">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('details')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'details'
                  ? 'bg-accent text-white shadow-xs'
                  : 'text-label-secondary hover:text-label-primary'
              }`}
            >
              <FileText size={13} />
              <span>Details View</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('json')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'json'
                  ? 'bg-accent text-white shadow-xs'
                  : 'text-label-secondary hover:text-label-primary'
              }`}
            >
              <Code size={13} />
              <span>BSON / JSON</span>
            </button>
          </div>

          <button
            onClick={handleCopyJson}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-label-secondary hover:text-label-primary hover:bg-surface border border-separator transition-all cursor-pointer mr-1"
          >
            {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>

        {/* Body content */}
        <div className="max-h-[60vh] overflow-y-auto pr-1">
          {activeTab === 'json' ? (
            <div className="relative">
              <pre className="p-4 bg-surface-secondary border border-separator rounded-2xl font-mono text-xs text-label-primary overflow-x-auto leading-relaxed select-all">
                {JSON.stringify(doc, null, 2)}
              </pre>
            </div>
          ) : (
            <div className="space-y-2">
              {Object.keys(doc).map((key) => {
                const val = doc[key];
                const isUserField = userRefRegex.test(key);

                return (
                  <div
                    key={key}
                    className="p-3 bg-surface-secondary/50 rounded-xl border border-separator flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:border-separator/90 transition-colors"
                  >
                    <span className="text-xs font-mono font-bold text-label-secondary shrink-0">
                      {key}
                    </span>

                    <div className="text-xs truncate max-w-full sm:max-w-md text-left sm:text-right">
                      {key === '_id' ? (
                        <span className="font-mono text-accent font-bold select-all">{String(val)}</span>
                      ) : isUserField && typeof val === 'string' && val.length === 24 ? (
                        <UserBadge userId={val} userMap={userMap} />
                      ) : typeof val === 'boolean' ? (
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            val
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          {val ? 'TRUE' : 'FALSE'}
                        </span>
                      ) : typeof val === 'object' && val !== null ? (
                        <span className="font-mono text-[11px] text-label-secondary bg-surface px-2 py-0.5 rounded border border-separator select-all">
                          {JSON.stringify(val)}
                        </span>
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
        <div className="pt-4 border-t border-separator flex items-center justify-end gap-3">
          {onEdit && (
            <button
              onClick={() => {
                onClose();
                onEdit();
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-accent/10 text-accent border border-accent/20 hover:bg-accent/20 transition cursor-pointer"
            >
              <Edit2 size={13} />
              <span>Edit Document</span>
            </button>
          )}
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-full text-xs font-semibold bg-accent text-white hover:bg-accent-hover transition cursor-pointer shadow"
          >
            Close
          </button>
        </div>
      </div>
    </ResponsiveModal>
  );
};

export default ViewDocModal;
