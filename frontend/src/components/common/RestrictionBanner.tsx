import React from 'react';
import { ShieldAlert, AlertTriangle, Lock } from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';

interface RestrictionBannerProps {
  feature?: 'assessments' | 'contests' | 'courses';
  className?: string;
}

export const RestrictionBanner: React.FC<RestrictionBannerProps> = ({ feature, className = '' }) => {
  const { user } = useAuthStore();

  if (!user || !user.isRestricted) {
    return null;
  }

  const restrictedFeatures: string[] = user.restrictedFeatures || [];
  if (feature && !restrictedFeatures.includes(feature)) {
    return null;
  }

  const featureLabels: Record<string, string> = {
    assessments: 'Assessments',
    contests: 'Weekly Contests',
    courses: 'Courses & Quests',
  };

  const featureList = restrictedFeatures.map((f) => featureLabels[f] || f).join(', ');

  return (
    <div
      className={`relative overflow-hidden rounded-2xl sm:rounded-3xl border border-red-500/30 bg-gradient-to-r from-red-950/40 via-red-900/20 to-neutral-900/60 backdrop-blur-xl p-5 sm:p-6 shadow-xl shadow-red-950/20 mb-6 ${className}`}
    >
      <div className="absolute top-0 right-0 -mt-6 -mr-6 w-32 h-32 bg-red-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 relative z-10">
        <div className="w-12 h-12 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-400 flex items-center justify-center shrink-0 shadow-inner">
          <ShieldAlert className="w-6 h-6" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-500/20 text-red-300 border border-red-500/30">
              Account Restricted
            </span>
            <span className="text-xs text-neutral-400">
              Blocked: <strong className="text-neutral-200">{featureList || 'Assessments & Contests'}</strong>
            </span>
          </div>

          <h3 className="text-base font-bold text-white tracking-tight">
            Restrictions Active on Your Account
          </h3>

          <p className="text-xs sm:text-sm text-neutral-300 mt-1 leading-relaxed">
            {user.restrictionReason ||
              'Your account has been restricted due to an integrity violation or rejected missed event request.'}
          </p>

          <p className="text-[11px] text-red-300/80 mt-2 flex items-center gap-1.5 font-medium">
            <Lock className="w-3.5 h-3.5 shrink-0" />
            An administrator or faculty member must review and unblock your restrictions before you can participate.
          </p>
        </div>
      </div>
    </div>
  );
};

export default RestrictionBanner;
