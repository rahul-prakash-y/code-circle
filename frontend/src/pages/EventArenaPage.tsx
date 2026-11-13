import React, { useState, useEffect, Suspense, lazy } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Button } from '@heroui/react';
import { ChevronLeft, Sparkles, AlertCircle, FileQuestion } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import useAuthStore from '@/store/useAuthStore';
import useProfileStore from '@/store/useProfileStore';
import useEventArenaStore from '@/store/useEventArenaStore';
import api from '@/lib/axios';

import EventArenaHubView from '@/components/events/arena/student/EventArenaHubView';
import ArenaWorkspaceSkeleton from '@/components/events/arena/student/ArenaWorkspaceSkeleton';

const EventArenaWorkspaceView = lazy(
  () => import('@/components/events/arena/student/EventArenaWorkspaceView')
);

export const EventArenaPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const { fetchAssessments, assessments, currentEvent, loading } = useEventArenaStore(
    useShallow((s) => ({
      fetchAssessments: s.fetchAssessments,
      assessments: s.assessments,
      currentEvent: s.currentEvent,
      loading: s.loading,
    }))
  );
  const currentUser = useAuthStore((s: any) => s.user);
  const profile = useProfileStore((s: any) => s.profile);
  const userRole = profile?.role || currentUser?.role;
  const isAdmin = ['Admin', 'SuperAdmin', 'Faculty', 'Committee'].includes(userRole);

  const currentViewParam = searchParams.get('view');
  const [activeAssessmentId, setActiveAssessmentId] = useState<string | null>(() => {
    return searchParams.get('assessmentId') || (currentViewParam === 'workspace' ? searchParams.get('round') : null);
  });

  const [isCheckingUnblockStatus, setIsCheckingUnblockStatus] = useState(false);
  const [blockedDetail, setBlockedDetail] = useState<{
    isBlocked?: boolean;
    code?: string;
    blockedType?: string;
    sourceTitle?: string;
    reason?: string;
    error?: string;
  } | null>(null);

  // Initial load: Fetch all assessments for this event
  useEffect(() => {
    if (id) {
      fetchAssessments(id);
    }
  }, [id]);

  // Handle URL query parameters for direct admin preview or refreshed view (?view=workspace&round=...)
  useEffect(() => {
    const urlAssessmentId = searchParams.get('assessmentId') || (searchParams.get('view') === 'workspace' ? searchParams.get('round') : null);
    if (urlAssessmentId && (!activeAssessmentId || activeAssessmentId !== urlAssessmentId)) {
      setActiveAssessmentId(urlAssessmentId);
      if (searchParams.get('preview') === 'true') {
        toast.success('Entered Test Preview (Admin Mode)');
      }
    } else if (!urlAssessmentId && activeAssessmentId && searchParams.get('view') !== 'workspace') {
      setActiveAssessmentId(null);
    }
  }, [searchParams, activeAssessmentId]);

  // Check anti-cheat / external block status on mount
  useEffect(() => {
    if (!id || isAdmin) return;
    api
      .get(`/events/${id}/anti-cheat/status`)
      .then((res) => {
        if (res.data?.success && res.data.isBlocked) {
          setBlockedDetail({
            isBlocked: true,
            code: res.data.blockedType === 'THIS_EVENT' ? 'STUDENT_ASSESSMENT_BLOCKED' : 'BLOCKED_BY_OTHER_ACTIVITY',
            blockedType: res.data.blockedType,
            sourceTitle: res.data.sourceTitle,
            reason: res.data.reason,
            error: res.data.error,
          });
        } else {
          setBlockedDetail(null);
        }
      })
      .catch(() => {});
  }, [id, isAdmin]);

  const handleCheckUnblockStatus = async () => {
    setIsCheckingUnblockStatus(true);
    try {
      const res = await api.get(`/events/${id}/anti-cheat/status`);
      if (res.data?.success && !res.data.isBlocked) {
        setBlockedDetail(null);
        toast.success('Your block has been cleared!');
        if (id) fetchAssessments(id);
      } else if (res.data?.isBlocked) {
        setBlockedDetail({
          isBlocked: true,
          blockedType: res.data.blockedType,
          sourceTitle: res.data.sourceTitle,
          reason: res.data.reason,
        });
        toast.error(
          res.data.sourceTitle
            ? `Still blocked by ${res.data.sourceTitle}. Please unblock that first.`
            : 'Still blocked. Contact admin.'
        );
      }
    } catch {
      toast.error('Could not verify unblock status.');
    } finally {
      setIsCheckingUnblockStatus(false);
    }
  };

  const handleSelectRound = (assessmentId: string) => {
    if (blockedDetail?.isBlocked && blockedDetail.blockedType !== 'THIS_EVENT') {
      toast.error(`Blocked by ${blockedDetail.sourceTitle || 'an external activity'}. Please unblock that first.`);
    }
    setActiveAssessmentId(assessmentId);
    setSearchParams({ view: 'workspace', round: assessmentId });
  };

  const handleReturnToHub = () => {
    setActiveAssessmentId(null);
    setSearchParams({ view: 'hub' });
    if (id) fetchAssessments(id);
  };

  if (!id) return null;

  if (!activeAssessmentId) {
    return (
      <EventArenaHubView
        assessments={assessments}
        currentEvent={currentEvent}
        loading={loading}
        isAdmin={isAdmin}
        blockedDetail={blockedDetail}
        isCheckingUnblockStatus={isCheckingUnblockStatus}
        onCheckUnblockStatus={handleCheckUnblockStatus}
        onRefresh={() => id && fetchAssessments(id)}
        onSelectAssessment={handleSelectRound}
        onBack={() => navigate('/events')}
      />
    );
  }

  const activeAssessment = assessments.find((a) => a._id === activeAssessmentId);
  const isDesignRound = activeAssessment?.type === 'UI_UX';
  const hasDesignQuestions = Boolean(
    activeAssessment?.designChallenge ||
    (activeAssessment?.designChallenges && activeAssessment.designChallenges.length > 0) ||
    ((activeAssessment as any)?.designChallengesCount && (activeAssessment as any).designChallengesCount > 0)
  );
  const hasStandardQuestions = Boolean(
    (activeAssessment?.mcqCount && activeAssessment.mcqCount > 0) ||
    (activeAssessment?.codingCount && activeAssessment.codingCount > 0) ||
    (activeAssessment?.questions?.mcqs && activeAssessment.questions.mcqs.length > 0) ||
    (activeAssessment?.questions?.coding && activeAssessment.questions.coding.length > 0)
  );
  const hasAllocatedQuestions = isDesignRound ? hasDesignQuestions : hasStandardQuestions;
  const isNoQuestionsAllocated = Boolean(
    !loading &&
    activeAssessment &&
    !hasAllocatedQuestions
  );

  if (isNoQuestionsAllocated && activeAssessment) {
    return (
      <div className="flex flex-col h-screen w-screen overflow-hidden bg-canvas text-label-primary select-none">
        {/* Workspace Top Header Bar */}
        <header className="min-h-14 py-2 border-b border-separator px-3 sm:px-6 flex items-center justify-between gap-2 shrink-0 bg-canvas/90 backdrop-blur-md z-30">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Button
              size="sm"
              variant="light"
              onPress={handleReturnToHub}
              className="rounded-xl text-label-secondary hover:text-label-primary text-xs font-semibold shrink-0 cursor-pointer"
              startContent={<ChevronLeft size={16} />}
            >
              <span className="hidden sm:inline">All Rounds</span>
            </Button>
            <div className="h-4 w-[1px] bg-surface-secondary shrink-0" />
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-7 h-7 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
                <Sparkles size={14} />
              </span>
              <span className="font-bold text-xs sm:text-sm text-label-primary truncate max-w-[160px] sm:max-w-md">
                {activeAssessment.title}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase font-bold bg-surface-secondary text-label-secondary border border-separator">
                {activeAssessment.type}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1.5">
              <AlertCircle size={13} />
              <span>No Questions Allocated</span>
            </span>
          </div>
        </header>

        {/* Workspace Message Screen Body */}
        <div className="flex-1 flex items-center justify-center p-4 sm:p-6 bg-canvas overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-lg p-6 sm:p-8 rounded-3xl bg-surface border border-separator shadow-2xl text-center space-y-6 relative overflow-hidden"
          >
            <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mx-auto shadow-inner">
              <FileQuestion size={32} />
            </div>

            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full text-[11px] font-mono uppercase tracking-wider font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                Round Setup In Progress
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-label-primary tracking-tight">
                No Questions Allocated Yet
              </h2>
              <p className="text-xs sm:text-sm text-label-secondary leading-relaxed max-w-md mx-auto">
                No questions or challenges have been published for{' '}
                <span className="font-semibold text-label-primary">
                  {activeAssessment.title}
                </span>{' '}
                yet. Please check back when the organizers publish the assessment questions, or contact your event administrator.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-surface-secondary border border-separator text-left grid grid-cols-2 gap-3 text-xs font-mono">
              <div>
                <span className="text-label-tertiary block text-[10px] uppercase">Round Type</span>
                <span className="font-bold text-label-primary">{activeAssessment.type}</span>
              </div>
              <div>
                <span className="text-label-tertiary block text-[10px] uppercase">Duration</span>
                <span className="font-bold text-label-primary">{activeAssessment.durationMinutes || 60} Minutes</span>
              </div>
              <div>
                <span className="text-label-tertiary block text-[10px] uppercase">Total Marks</span>
                <span className="font-bold text-label-primary">{activeAssessment.totalPoints || 100} Points</span>
              </div>
              <div>
                <span className="text-label-tertiary block text-[10px] uppercase">Allocated Questions</span>
                <span className="font-bold text-amber-400">0 Questions</span>
              </div>
            </div>

            <div className="space-y-2.5 pt-2">
              <Button
                color="primary"
                variant="solid"
                onPress={handleReturnToHub}
                className="w-full min-h-[42px] rounded-xl text-white text-xs font-bold shadow-lg shadow-purple-600/30 cursor-pointer"
                startContent={<ChevronLeft size={15} />}
              >
                Return to All Rounds
              </Button>
              {isAdmin && (
                <p className="text-[11px] text-label-tertiary">
                  Admin Notice: You can configure MCQs, coding challenges, or Figma tasks in the Event Arena Admin modal.
                </p>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <Suspense fallback={<ArenaWorkspaceSkeleton />}>
      <EventArenaWorkspaceView
        eventId={id}
        assessmentId={activeAssessmentId}
        isAdmin={isAdmin}
        onReturnToHub={handleReturnToHub}
        initialBlockedDetail={blockedDetail}
      />
    </Suspense>
  );
};

export default EventArenaPage;
