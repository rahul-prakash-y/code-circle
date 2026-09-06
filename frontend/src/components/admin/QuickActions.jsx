import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { KeyRound, Award, Calendar, Download, Zap, Sparkles, ArrowUpRight } from 'lucide-react';
import GenerateOtpModal from './GenerateOtpModal';
import AssessmentManagerModal from './AssessmentManagerModal';
import DownloadReportsModal from './DownloadReportsModal';

export const QuickActions = ({
  onManageEvents,
  onOpenCreateEvent,
  onManageAssessments,
}) => {
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [isAssessmentModalOpen, setIsAssessmentModalOpen] = useState(false);
  const [isReportsModalOpen, setIsReportsModalOpen] = useState(false);

  const actions = [
    {
      id: 'otp',
      title: 'Generate Attendance OTP',
      subtitle: 'Instant session verification code',
      icon: KeyRound,
      gradient: 'from-blue-500/40 via-cyan-500/40 to-teal-500/40',
      iconBg: 'bg-blue-500/10 border-blue-500/25 text-blue-500 dark:text-blue-400',
      onClick: () => setIsOtpModalOpen(true),
    },
    {
      id: 'assessments',
      title: 'Manage Assessments',
      subtitle: 'Curate MCQs & assessment tiers',
      icon: Award,
      gradient: 'from-purple-500/40 via-violet-500/40 to-pink-500/40',
      iconBg: 'bg-purple-500/10 border-purple-500/25 text-purple-500 dark:text-purple-400',
      onClick: () => {
        if (onManageAssessments) onManageAssessments();
        else setIsAssessmentModalOpen(true);
      },
    },
    {
      id: 'events',
      title: 'Manage Events',
      subtitle: 'Schedule workshops & hackathons',
      icon: Calendar,
      gradient: 'from-amber-500/40 via-orange-500/40 to-rose-500/40',
      iconBg: 'bg-amber-500/10 border-amber-500/25 text-amber-500 dark:text-amber-400',
      onClick: () => {
        if (onManageEvents) onManageEvents();
      },
    },
    {
      id: 'reports',
      title: 'Export Reports',
      subtitle: 'Download attendance CSV & PDF data',
      icon: Download,
      gradient: 'from-emerald-500/40 via-teal-500/40 to-blue-500/40',
      iconBg: 'bg-emerald-500/10 border-emerald-500/25 text-emerald-500 dark:text-emerald-400',
      onClick: () => setIsReportsModalOpen(true),
    },
  ];

  return (
    <>
      <div className="glass p-6 sm:p-7 relative overflow-hidden rounded-3xl border border-border">
        {/* Glow ambient background accent */}
        <div className="absolute top-0 right-1/4 w-96 h-40 bg-accent/5 blur-3xl pointer-events-none" />

        {/* Section Header */}
        <div className="flex items-center justify-between mb-5 relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-accent/10 border border-accent/20 text-accent">
              <Zap size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-extrabold text-text-primary font-heading tracking-tight">
                  Quick Actions
                </h3>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-accent bg-accent/10 px-2 py-0.5 rounded-full border border-accent/20">
                  Command Center
                </span>
              </div>
              <p className="text-xs text-text-muted mt-0.5">Rapid administrative shortcuts and core operations</p>
            </div>
          </div>
        </div>

        {/* 4 Action Buttons with subtle gradient borders on hover */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
          {actions.map((act) => {
            const Icon = act.icon;
            return (
              <motion.div
                key={act.id}
                whileHover={{ y: -3, scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                onClick={act.onClick}
                className="group relative p-[1px] rounded-2xl overflow-hidden cursor-pointer"
              >
                {/* Subtle animated gradient border layer */}
                <div
                  className={`absolute inset-0 bg-linear-to-r ${act.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl`}
                />

                {/* Inner button surface */}
                <div className="relative h-full flex flex-col justify-between p-5 rounded-[15px] bg-surface-elevated/90 border border-border group-hover:border-transparent transition-colors duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-2.5 rounded-xl border transition-transform duration-300 group-hover:scale-110 ${act.iconBg}`}>
                      <Icon size={20} />
                    </div>
                    <ArrowUpRight size={16} className="text-text-muted group-hover:text-text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-200" />
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-text-primary group-hover:text-accent transition-colors">
                      {act.title}
                    </h4>
                    <p className="text-[11px] text-text-muted font-medium mt-1 leading-snug">
                      {act.subtitle}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Modals */}
      <GenerateOtpModal
        isOpen={isOtpModalOpen}
        onClose={() => setIsOtpModalOpen(false)}
      />

      <AssessmentManagerModal
        isOpen={isAssessmentModalOpen}
        onClose={() => setIsAssessmentModalOpen(false)}
        onOpenAssessments={onManageAssessments}
      />

      <DownloadReportsModal
        isOpen={isReportsModalOpen}
        onClose={() => setIsReportsModalOpen(false)}
      />
    </>
  );
};

export default QuickActions;
