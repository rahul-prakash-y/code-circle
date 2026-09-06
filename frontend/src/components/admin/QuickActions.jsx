import React, { useState } from 'react';
import { KeyRound, Award, Calendar, Download, ArrowUpRight } from 'lucide-react';
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
      onClick: () => setIsOtpModalOpen(true),
    },
    {
      id: 'assessments',
      title: 'Manage Assessments',
      subtitle: 'Curate MCQs & assessment tiers',
      icon: Award,
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
      onClick: () => {
        if (onManageEvents) onManageEvents();
      },
    },
    {
      id: 'reports',
      title: 'Export Reports',
      subtitle: 'Download attendance CSV & data',
      icon: Download,
      onClick: () => setIsReportsModalOpen(true),
    },
  ];

  return (
    <>
      <div className="surface p-6 sm:p-7">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-label-primary tracking-tight font-heading">
              Quick Actions
            </h3>
            <p className="text-xs text-label-secondary mt-0.5">
              Administrative shortcuts and event management tools
            </p>
          </div>
        </div>

        {/* 4 Action Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {actions.map((act) => {
            const Icon = act.icon;
            return (
              <div
                key={act.id}
                onClick={act.onClick}
                className="group relative flex flex-col justify-between p-5 rounded-2xl bg-canvas border border-separator hover:border-separator-opaque cursor-pointer transition-colors duration-150 select-none"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-9 h-9 rounded-xl bg-surface border border-separator flex items-center justify-center text-label-secondary group-hover:text-accent transition-colors">
                    <Icon size={18} strokeWidth={1.75} />
                  </div>
                  <ArrowUpRight
                    size={15}
                    strokeWidth={1.75}
                    className="text-label-tertiary group-hover:text-label-primary transition-colors"
                  />
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-label-primary group-hover:text-accent transition-colors tracking-tight">
                    {act.title}
                  </h4>
                  <p className="text-xs text-label-secondary mt-1 leading-normal font-normal">
                    {act.subtitle}
                  </p>
                </div>
              </div>
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
