import React from 'react';
import ResponsiveModal from '../ui/ResponsiveModal';
import {
  Sparkles,
  Lightbulb,
  CheckCircle2,
  Compass,
  Award,
  Code2,
  Flame,
  Calendar,
  CalendarCheck,
  Medal,
  Trophy,
  Ticket,
  MessageSquare,
  Newspaper,
  UserCheck,
  BarChart3,
  Shield,
  FileSpreadsheet,
  Edit3,
  Users,
  LayoutDashboard,
  HelpCircle,
  GraduationCap,
  Crown,
} from 'lucide-react';
import useTutorialStore from '../../store/useTutorialStore';
import useAuthStore from '../../store/useAuthStore';

// Map icon strings to Lucide components
const ICON_MAP: Record<string, React.ElementType> = {
  LayoutDashboard,
  Compass,
  Award,
  Code2,
  Flame,
  Calendar,
  CalendarCheck,
  Medal,
  Trophy,
  Sparkles,
  Ticket,
  MessageSquare,
  Newspaper,
  UserCheck,
  BarChart3,
  Shield,
  FileSpreadsheet,
  Edit3,
  Users,
  HelpCircle,
  GraduationCap,
  Crown,
};

export const TutorialModal: React.FC = () => {
  const { activeTutorial, isOpen, closeTutorial } = useTutorialStore();
  const { user } = useAuthStore();

  if (!isOpen || !activeTutorial) return null;

  const IconComponent = ICON_MAP[activeTutorial.icon] || HelpCircle;
  const isAdmin =
    user?.role === 'Admin' ||
    user?.role === 'SuperAdmin' ||
    user?.role === 'Faculty' ||
    user?.role === 'Committee';

  return (
    <ResponsiveModal
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) closeTutorial();
      }}
      title={
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-accent/10 text-accent flex items-center justify-center shrink-0">
            <IconComponent className="w-4 h-4" />
          </div>
          <span>{activeTutorial.title}</span>
        </div>
      }
      description={activeTutorial.subtitle}
      dialogClassName="sm:max-w-2xl p-6"
    >
      <div className="space-y-5 pt-2">
        {/* Overview Card */}
        <div className="p-4 rounded-2xl bg-surface-secondary border border-separator text-xs text-label-secondary leading-relaxed font-normal">
          <p>{activeTutorial.overview}</p>
        </div>

        {/* Scrollable Content Body */}
        <div className="max-h-[50vh] overflow-y-auto space-y-5 pr-1">
          {/* Highlights */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles size={15} className="text-amber-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-label-primary">
                What you can do
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {activeTutorial.whatYouCanDo.map((action, idx) => (
                <div
                  key={idx}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    action.highlight
                      ? 'bg-accent/5 border-accent/30 shadow-xs'
                      : 'bg-surface border-separator'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-xs font-semibold text-label-primary">{action.title}</span>
                    {action.badge && (
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-semibold tracking-wider uppercase ${
                          action.badge.toLowerCase().includes('admin')
                            ? 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/25'
                            : 'bg-surface-secondary text-label-secondary border border-separator'
                        }`}
                      >
                        {action.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-label-secondary leading-relaxed font-normal">
                    {action.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Role Guidance (Student / Admin) */}
          {(activeTutorial.studentGuide || activeTutorial.adminGuide) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {activeTutorial.studentGuide && (
                <div className="p-4 rounded-2xl bg-surface border border-separator space-y-2.5">
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                    <GraduationCap size={16} />
                    <h4 className="text-xs font-bold text-label-primary">For students</h4>
                  </div>
                  <ul className="space-y-2 text-[11px] text-label-secondary leading-relaxed font-normal">
                    {activeTutorial.studentGuide.map((step, sIdx) => (
                      <li key={sIdx} className="flex items-start gap-2">
                        <CheckCircle2 size={13} className="text-emerald-500 shrink-0 mt-0.5" />
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {activeTutorial.adminGuide && (
                <div
                  className={`p-4 rounded-2xl border space-y-2.5 ${
                    isAdmin
                      ? 'bg-purple-500/5 border-purple-500/30'
                      : 'bg-surface border-separator'
                  }`}
                >
                  <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
                    <Crown size={16} />
                    <h4 className="text-xs font-bold text-label-primary">
                      For admins & faculty {isAdmin && <span className="text-[10px] text-purple-500 font-normal">(Your role)</span>}
                    </h4>
                  </div>
                  <ul className="space-y-2 text-[11px] text-label-secondary leading-relaxed font-normal">
                    {activeTutorial.adminGuide.map((step, aIdx) => (
                      <li key={aIdx} className="flex items-start gap-2">
                        <CheckCircle2 size={13} className="text-purple-500 shrink-0 mt-0.5" />
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Tips Callout Box */}
          {activeTutorial.proTips && activeTutorial.proTips.length > 0 && (
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-3 text-xs text-label-primary">
              <Lightbulb size={18} className="text-amber-500 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-[11px] text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                  Tips & shortcuts
                </p>
                <ul className="text-[11px] text-label-secondary space-y-1 font-normal">
                  {activeTutorial.proTips.map((tip, tIdx) => (
                    <li key={tIdx}>• {tip}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer Action */}
        <div className="pt-4 border-t border-separator flex items-center justify-between gap-3">
          <span className="text-[11px] text-label-tertiary">
            Press <kbd className="px-1.5 py-0.5 bg-surface-secondary border border-separator rounded text-[10px] font-mono">Esc</kbd> to close
          </span>

          <button
            type="button"
            onClick={closeTutorial}
            className="px-5 py-2 rounded-full text-xs font-semibold text-white bg-accent hover:bg-accent-hover transition cursor-pointer shadow"
          >
            Got it
          </button>
        </div>
      </div>
    </ResponsiveModal>
  );
};

export default TutorialModal;
