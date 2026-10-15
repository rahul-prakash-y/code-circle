import React from 'react';
import { User, Copy, Check } from 'lucide-react';
import { UserLookupItem } from '../../../store/useDiagnosticsStore';

interface UserBadgeProps {
  userId?: string;
  userMap?: Record<string, UserLookupItem>;
  userObj?: UserLookupItem;
  showId?: boolean;
  className?: string;
}

export const UserBadge: React.FC<UserBadgeProps> = ({
  userId,
  userMap,
  userObj,
  showId = false,
  className = '',
}) => {
  const [copied, setCopied] = React.useState(false);

  const resolved: UserLookupItem | undefined =
    userObj || (userId && userMap ? userMap[userId] : undefined);

  const handleCopyId = (e: React.MouseEvent) => {
    e.stopPropagation();
    const idToCopy = userId || resolved?._id;
    if (idToCopy) {
      navigator.clipboard.writeText(idToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  if (!resolved && !userId) {
    return <span className="text-label-tertiary text-xs italic">—</span>;
  }

  if (!resolved && userId) {
    return (
      <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-surface-secondary border border-separator text-xs ${className}`}>
        <User size={12} className="text-label-tertiary" />
        <span className="font-mono text-[11px] text-label-secondary">{userId.slice(0, 8)}...</span>
        <button
          onClick={handleCopyId}
          className="text-label-tertiary hover:text-label-primary p-0.5"
          title="Copy ObjectId"
        >
          {copied ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
        </button>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-xl bg-primary/10 border border-primary/20 text-xs ${className}`}>
      <div className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center font-bold text-[10px] shrink-0">
        {resolved?.name ? resolved.name.charAt(0).toUpperCase() : 'U'}
      </div>
      <div className="flex flex-col min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-label-primary truncate max-w-[150px]">
            {resolved?.name}
          </span>
          {resolved?.role && (
            <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-primary/20 text-primary">
              {resolved.role}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-label-tertiary font-mono">
          {resolved?.rollNo && <span>{resolved.rollNo}</span>}
          {resolved?.rollNo && resolved?.email && <span>·</span>}
          {resolved?.email && <span className="truncate max-w-[130px]">{resolved.email}</span>}
        </div>
      </div>
      {showId && (userId || resolved?._id) && (
        <button
          onClick={handleCopyId}
          className="text-label-tertiary hover:text-label-primary p-1 rounded hover:bg-surface-secondary ml-1"
          title={`Copy ID: ${userId || resolved?._id}`}
        >
          {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
        </button>
      )}
    </div>
  );
};

export default UserBadge;
