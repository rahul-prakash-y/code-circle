import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
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
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-2xl my-auto glass border border-separator rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-2xl max-h-[88vh] flex flex-col"
        >
          {/* Decorative ambient background glow */}
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-accent/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Header */}
          <div className="flex items-start justify-between pb-5 border-b border-separator relative z-10 shrink-0">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-accent/10 border border-accent/25 flex items-center justify-center text-accent shadow-sm">
                <IconComponent size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg sm:text-xl font-black text-label-primary tracking-tight">
                    {activeTutorial.title}
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-accent/15 text-accent border border-accent/25">
                    {activeTutorial.category === 'modal' ? 'Modal Walkthrough' : 'Page Guide'}
                  </span>
                </div>
                <p className="text-xs text-label-secondary mt-0.5 leading-relaxed">
                  {activeTutorial.subtitle}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={closeTutorial}
              className="p-2 rounded-xl bg-surface-secondary hover:bg-surface-raised border border-separator text-label-tertiary hover:text-label-primary transition-all cursor-pointer shrink-0"
              title="Close Tutorial"
            >
              <X size={18} />
            </button>
          </div>

          {/* Scrollable Content Body */}
          <div className="overflow-y-auto custom-scrollbar flex-1 py-5 space-y-6 relative z-10 pr-1">
            {/* Overview Card */}
            <div className="p-4 rounded-2xl bg-surface-secondary/70 border border-separator text-xs text-label-secondary leading-relaxed">
              <p>{activeTutorial.overview}</p>
            </div>

            {/* "What You Can Do Here" Highlights */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-amber-400" />
                <h3 className="text-xs font-black uppercase tracking-wider text-label-primary">
                  What You Can Do
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {activeTutorial.whatYouCanDo.map((action, idx) => (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-2xl border transition-all ${
                      action.highlight
                        ? 'bg-accent/5 border-accent/30 shadow-sm'
                        : 'bg-surface border-separator hover:border-separator/80'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-xs font-bold text-label-primary">{action.title}</span>
                      {action.badge && (
                        <span
                          className={`px-2 py-0.5 rounded-md text-[9px] font-extrabold tracking-wide uppercase ${
                            action.badge.toLowerCase().includes('admin')
                              ? 'bg-purple-500/15 text-purple-400 border border-purple-500/25'
                              : 'bg-surface-secondary text-label-secondary border border-separator'
                          }`}
                        >
                          {action.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-label-secondary leading-relaxed">
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
                    <div className="flex items-center gap-2 text-emerald-500">
                      <GraduationCap size={16} />
                      <h4 className="text-xs font-bold text-label-primary">For Students</h4>
                    </div>
                    <ul className="space-y-2 text-[11px] text-label-secondary leading-relaxed">
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
                    <div className="flex items-center gap-2 text-purple-400">
                      <Crown size={16} />
                      <h4 className="text-xs font-bold text-label-primary">
                        For Admins & Faculty {isAdmin && <span className="text-[10px] text-purple-400">(Your Role)</span>}
                      </h4>
                    </div>
                    <ul className="space-y-2 text-[11px] text-label-secondary leading-relaxed">
                      {activeTutorial.adminGuide.map((step, aIdx) => (
                        <li key={aIdx} className="flex items-start gap-2">
                          <CheckCircle2 size={13} className="text-purple-400 shrink-0 mt-0.5" />
                          <span>{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Pro Tips Callout Box */}
            {activeTutorial.proTips && activeTutorial.proTips.length > 0 && (
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-3 text-xs text-label-primary">
                <Lightbulb size={18} className="text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-[11px] text-amber-400 uppercase tracking-wider">
                    Pro Tips & Shortcuts
                  </p>
                  <ul className="text-[11px] text-label-secondary space-y-1">
                    {activeTutorial.proTips.map((tip, tIdx) => (
                      <li key={tIdx}>• {tip}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Footer Action */}
          <div className="pt-4 border-t border-separator flex items-center justify-between gap-3 relative z-10 shrink-0">
            <span className="text-[11px] text-label-tertiary">
              💡 Press <kbd className="px-1.5 py-0.5 bg-surface border border-separator rounded text-[10px] font-mono">Esc</kbd> to close anytime
            </span>

            <button
              type="button"
              onClick={closeTutorial}
              className="px-5 py-2.5 rounded-xl text-xs font-black text-white bg-gradient-to-r from-accent to-purple-600 hover:from-accent-hover hover:to-purple-500 shadow-lg shadow-accent/20 cursor-pointer transition-all"
            >
              Got it, let&apos;s explore!
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default TutorialModal;
