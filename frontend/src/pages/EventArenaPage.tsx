import React, { useState, useEffect, Suspense, lazy } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
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
