import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { KeyRound, Award, Calendar, Download, Zap, Sparkles } from 'lucide-react';
import GenerateOtpModal from './GenerateOtpModal';
import AssessmentManagerModal from './AssessmentManagerModal';
import DownloadReportsModal from './DownloadReportsModal';

const QuickActions = ({ onManageEvents, onOpenCreateEvent, onManageAssessments }) => {
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [isAssessmentModalOpen, setIsAssessmentModalOpen] = useState(false);
  const [isReportsModalOpen, setIsReportsModalOpen] = useState(false);

  const actions = [
    {
      id: 'otp',
      title: 'Generate OTP',
      subtitle: 'Attendance verification',
      icon: KeyRound,
      color: 'text-blue-400',
      glow: 'group-hover:border-blue-500/50 group-hover:shadow-[0_0_25px_rgba(59,130,246,0.25)]',
      bgGlow: 'bg-blue-500/10 border-blue-500/20',
      onClick: () => setIsOtpModalOpen(true),
    },
    {
      id: 'assessments',
      title: 'Manage Assessments',
      subtitle: 'Tiers & problem tracks',
      icon: Award,
      color: 'text-purple-400',
      glow: 'group-hover:border-purple-500/50 group-hover:shadow-[0_0_25px_rgba(168,85,247,0.25)]',
      bgGlow: 'bg-purple-500/10 border-purple-500/20',
      onClick: () => setIsAssessmentModalOpen(true),
    },
    {
      id: 'events',
      title: 'Manage Events',
      subtitle: 'Catalog & scheduling',
      icon: Calendar,
      color: 'text-amber-400',
      glow: 'group-hover:border-amber-500/50 group-hover:shadow-[0_0_25px_rgba(245,158,11,0.25)]',
      bgGlow: 'bg-amber-500/10 border-amber-500/20',
      onClick: () => {
        if (onManageEvents) onManageEvents();
      },
    },
    {
      id: 'reports',
      title: 'Download Reports',
      subtitle: 'CSV & PDF exports',
      icon: Download,
      color: 'text-emerald-400',
      glow: 'group-hover:border-emerald-500/50 group-hover:shadow-[0_0_25px_rgba(16,185,129,0.25)]',
      bgGlow: 'bg-emerald-500/10 border-emerald-500/20',
      onClick: () => setIsReportsModalOpen(true),
    },
  ];

  return (
    <>
      <div className="stellar-glass p-6 sm:p-8 relative overflow-hidden">
        {/* Glow ambient background accent */}
        <div className="absolute top-0 right-1/4 w-96 h-40 bg-blue-500/5 blur-3xl pointer-events-none" />

        {/* Section Header */}
        <div className="flex items-center justify-between mb-6 relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <Zap size={18} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white tracking-wide flex items-center gap-2">
                Quick Actions
                <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                  Command Center
                </span>
              </h3>
              <p className="text-xs text-slate-400">Essential administrative controls and rapid operations</p>
            </div>
          </div>
        </div>

        {/* 4 Action Buttons Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
          {actions.map((act) => {
            const Icon = act.icon;
            return (
              <motion.button
                key={act.id}
                whileHover={{ y: -3, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={act.onClick}
                className={`p-5 rounded-2xl bg-white/5 border border-white/10 text-left transition-all duration-300 group cursor-pointer flex flex-col justify-between ${act.glow}`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-2xl border transition-transform duration-300 group-hover:scale-110 ${act.bgGlow} ${act.color}`}>
                    <Icon size={22} />
                  </div>
                  <Sparkles size={14} className="text-white/20 group-hover:text-white/60 transition-colors" />
                </div>

                <div>
                  <h4 className="text-sm font-black text-white group-hover:text-blue-400 transition-colors">
                    {act.title}
                  </h4>
                  <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                    {act.subtitle}
                  </p>
                </div>
              </motion.button>
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
