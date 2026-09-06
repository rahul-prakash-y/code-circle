import React, { useState, useEffect, useRef } from 'react';
import {
  motion, AnimatePresence,
  useScroll, useTransform, useInView, useSpring,
} from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Users, Calendar, Trophy, Target, RefreshCw,
  TrendingUp, Plus, ArrowUpRight, ChevronRight,
} from 'lucide-react';

import useAuthStore from '../store/useAuthStore';
import useProfileStore from '../store/useProfileStore';
import useEventStore from '../store/useEventStore';
import useMetricsStore from '../store/useMetricsStore';

import CountUp from '../components/ui/CountUp';
import QuickActions from '../components/admin/QuickActions';
import EventFeed from '../components/events/EventFeed';
import EventModal from '../components/events/EventModal';
import AssessmentList from '../components/assessments/AssessmentList';
import FeedbackDashboard from '../components/feedback/FeedbackDashboard';
import SubmitFeedbackModal from '../components/feedback/SubmitFeedbackModal';
import NewsFeed from './NewsFeed';
import AttendanceRecordsView from '../components/admin/AttendanceRecordsView';
import AttendanceHistory from '../components/dashboard/AttendanceHistory';
import MyCertificates from '../components/dashboard/MyCertificates';
import AdminAnalytics from '../components/admin/AdminAnalytics';
import BearerManager from '../components/admin/BearerManager';
import Leaderboard from '../components/dashboard/Leaderboard';
import EventPassport from '../components/profile/EventPassport';

const SPRING = { type: 'spring', stiffness: 260, damping: 30 } as const;

// ── Scroll-driven hero ────────────────────────────────────────────────────────
const Hero = ({ greeting, firstName, isAdmin, onCreateEvent, onBrowse }) => {
  const ref = useRef(null);
  const { scrollY } = useScroll();
  const rawOpacity = useTransform(scrollY, [0, 280], [1, 0]);
  const rawY = useTransform(scrollY, [0, 280], [0, -32]);
  const opacity = useSpring(rawOpacity, { stiffness: 80, damping: 20 });
  const y = useSpring(rawY, { stiffness: 80, damping: 20 });

  return (
    <motion.section
      ref={ref}
      style={{ opacity, y }}
      className="pt-4 pb-16 md:pb-20"
    >
      {/* Status pill */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
        className="inline-flex items-center gap-2 mb-5"
      >
        <span
          className="w-2 h-2 rounded-full"
          style={{ background: 'var(--success)' }}
        />
        <span
          className="text-[12px] font-medium tracking-tight"
          style={{ color: 'var(--label-secondary)' }}
        >
          {isAdmin ? 'Admin Console · Live' : 'Portal · Active'}
        </span>
      </motion.div>

      {/* Macro headline */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
      >
        <h1 className="display-headline" style={{ color: 'var(--label-primary)' }}>
          {greeting},
        </h1>
        <h1 className="display-headline" style={{ color: 'var(--accent)' }}>
          {firstName}.
        </h1>
      </motion.div>

      {/* Body copy */}
      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1], delay: 0.22 }}
        className="mt-5 max-w-lg text-[17px] leading-relaxed"
        style={{ color: 'var(--label-secondary)' }}
      >
        {isAdmin
          ? 'Manage members, events, attendance, and assessments.'
          : 'Track your progress, explore events, and compete with peers.'}
      </motion.p>

      {/* CTAs */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.35 }}
        className="flex flex-wrap items-center gap-3 mt-8"
      >
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          transition={SPRING}
          onClick={onBrowse}
          className="btn-primary flex items-center gap-2"
        >
          Browse Events
          <ArrowUpRight size={15} strokeWidth={2} />
        </motion.button>

        {isAdmin && (
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            transition={SPRING}
            onClick={onCreateEvent}
            className="btn-secondary flex items-center gap-2"
          >
            <Plus size={15} strokeWidth={2} />
            New Event
          </motion.button>
        )}
      </motion.div>
    </motion.section>
  );
};

// ── Single metric spotlight card ──────────────────────────────────────────────
const MetricCard = ({
  value, label, sublabel, icon: Icon, accentColor, delay = 0
}: {
  value: number; label: string; sublabel?: string;
  icon: React.ComponentType<any>; accentColor: string; delay?: number;
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-60px 0px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay }}
      className="surface p-8 flex flex-col justify-between min-h-[180px]"
    >
      <div className="flex items-center justify-between">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: `${accentColor}14`, color: accentColor }}
        >
          <Icon size={18} strokeWidth={1.75} />
        </div>
        <ChevronRight size={16} strokeWidth={1.75} style={{ color: 'var(--label-tertiary)' }} />
      </div>

      <div className="mt-auto pt-6">
        <p
          className="text-[11px] font-semibold uppercase tracking-widest mb-2"
          style={{ color: 'var(--label-secondary)', letterSpacing: '0.08em' }}
        >
          {label}
        </p>
        <div
          className="display-number-sm"
          style={{ color: accentColor === 'var(--accent)' ? 'var(--label-primary)' : accentColor }}
        >
          {isInView ? <CountUp value={value} /> : <span>0</span>}
        </div>
        {sublabel && (
          <p
            className="text-[13px] mt-2 font-medium"
            style={{ color: 'var(--label-secondary)' }}
          >
            {sublabel}
          </p>
        )}
      </div>
    </motion.div>
  );
};

// ── Participation bar (scroll-triggered) ─────────────────────────────────────
const ParticipationBar = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-40px 0px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="surface p-8 col-span-full"
    >
      <div className="flex items-end justify-between mb-6 gap-4">
        <div>
          <p
            className="text-[11px] font-semibold uppercase tracking-widest mb-1"
            style={{ color: 'var(--label-secondary)', letterSpacing: '0.08em' }}
          >
            Participation Rate
          </p>
          <div
            className="text-[3rem] font-bold leading-none tracking-tighter"
            style={{ color: 'var(--success)', letterSpacing: '-0.04em' }}
          >
            94.8%
          </div>
        </div>
        <div className="text-right">
          <p className="text-[13px]" style={{ color: 'var(--label-secondary)' }}>Target: 90%</p>
          <p className="text-[13px] font-semibold mt-0.5" style={{ color: 'var(--success)' }}>
            +4.8% above goal
          </p>
        </div>
      </div>

      {/* Progress track */}
      <div
        className="w-full rounded-full overflow-hidden"
        style={{ height: '5px', background: 'var(--separator)' }}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={isInView ? { width: '94.8%' } : {}}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
          className="h-full rounded-full"
          style={{ background: 'var(--success)' }}
        />
      </div>
    </motion.div>
  );
};

// ── Apple-style tab bar ───────────────────────────────────────────────────────
const TabBar = ({ tabs, active, onChange }) => (
  <div
    className="sticky z-20 -mx-6 sm:-mx-8 lg:-mx-12 px-6 sm:px-8 lg:px-12"
    style={{
      top: '60px',
      background: 'var(--glass-bg)',
      backdropFilter: 'saturate(180%) blur(24px)',
      WebkitBackdropFilter: 'saturate(180%) blur(24px)',
      boxShadow: '0 1px 0 var(--separator)',
    }}
  >
    <div className="flex overflow-x-auto gap-0 -mb-px">
      {tabs.map((tab) => {
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className="relative flex-shrink-0 px-4 py-[14px] text-[14px] cursor-pointer transition-colors duration-150"
            style={{
              color: isActive ? 'var(--label-primary)' : 'var(--label-secondary)',
              fontWeight: isActive ? 600 : 400,
              letterSpacing: '-0.01em',
            }}
          >
            {tab.label}
            {isActive && (
              <motion.div
                layoutId="tab-indicator"
                className="absolute bottom-0 left-0 right-0"
                style={{ height: '2px', background: 'var(--accent)', borderRadius: '1px 1px 0 0' }}
                transition={SPRING}
              />
            )}
          </button>
        );
      })}
    </div>
  </div>
);

// ── Main Dashboard ────────────────────────────────────────────────────────────
export const Dashboard = () => {
  const { user } = useAuthStore();
  const { profile } = useProfileStore();
  const { deleteEvent } = useEventStore();
  const { metrics, loading: metricsLoading, fetchMetrics } = useMetricsStore();
  const [searchParams, setSearchParams] = useSearchParams();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState(null);
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'events');

  useEffect(() => {
    const t = searchParams.get('tab');
    if (t && t !== activeTab) setActiveTab(t);
  }, [searchParams]);

  const handleTabChange = (id) => {
    setActiveTab(id);
    setSearchParams({ tab: id });
  };

  const isAdmin =
    profile?.role === 'Admin' || profile?.role === 'SuperAdmin' ||
    user?.role === 'Admin' || user?.role === 'SuperAdmin';
  const isFaculty = profile?.role === 'Faculty';

  useEffect(() => {
    if (isAdmin || isFaculty) fetchMetrics();
  }, [isAdmin, isFaculty, fetchMetrics]);

  const handleCreateEvent = () => { setEventToEdit(null); setIsModalOpen(true); };
  const handleEditEvent = (event) => { setEventToEdit(event); setIsModalOpen(true); };
  const handleDeleteEvent = async (id) => {
    if (window.confirm('Delete this event?')) {
      try { await deleteEvent(id); toast.success('Event deleted'); }
      catch { toast.error('Failed to delete'); }
    }
  };

  const tabs = [
    { id: 'events', label: 'Events' },
    { id: 'assessments', label: 'Assessments' },
    { id: 'feedback', label: 'Feedback' },
    { id: 'news', label: 'News' },
    { id: 'attendance', label: 'Attendance' },
    { id: 'certificates', label: 'Certificates' },
    { id: 'leaderboard', label: 'Leaderboard' },
    ...(isAdmin
      ? [{ id: 'analytics', label: 'Analytics' }, { id: 'bearers', label: 'Office Bearers' }]
      : [{ id: 'passport', label: 'Registrations' }]),
  ];

  const displayName = profile?.name || user?.name || 'Developer';
  const firstName = displayName.split(' ')[0];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  // Metric data
  const metricsData = [
    {
      value: isAdmin ? (metrics?.totalUsers ?? 0) : (user?.enrolledEvents?.length ?? 0),
      label: isAdmin ? 'Total Members' : 'Registered Events',
      sublabel: '+12% this term',
      icon: Users,
      accentColor: 'var(--accent)',
      delay: 0,
    },
    {
      value: isAdmin ? (metrics?.activeEvents ?? 0) : 12,
      label: isAdmin ? 'Active Events' : 'Leaderboard Rank',
      sublabel: 'Live & scheduled',
      icon: Calendar,
      accentColor: '#34C759',
      delay: 0.07,
    },
    {
      value: isAdmin ? (metrics?.totalEvents ?? 0) : 4,
      label: isAdmin ? 'Total Events' : 'Certificates',
      sublabel: 'All-time',
      icon: Trophy,
      accentColor: '#FF9F0A',
      delay: 0.14,
    },
    {
      value: metrics?.totalAssessmentLevels ?? 6,
      label: 'Skill Tracks',
      sublabel: 'Algorithmic & full-stack',
      icon: Target,
      accentColor: '#30B0C7',  /* Apple System Teal */
      delay: 0.21,
    },
  ];

  return (
    <div className="space-y-0">
      {/* Hero */}
      <Hero
        greeting={greeting}
        firstName={firstName}
        isAdmin={isAdmin}
        onCreateEvent={handleCreateEvent}
        onBrowse={() => handleTabChange('events')}
      />

      {/* Metrics grid — asymmetrical */}
      <section className="pb-10">
        {/* Metrics: 2-col on mobile, 4-col on xl */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-4">
          {metricsData.map((m) => (
            <MetricCard key={m.label} {...m} />
          ))}
        </div>

        {/* Participation bar — full width */}
        <ParticipationBar />

        {/* Quick actions (admin) */}
        {isAdmin && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="mt-4"
          >
            <QuickActions
              onManageEvents={() => handleTabChange('events')}
              onOpenCreateEvent={handleCreateEvent}
              onManageAssessments={() => handleTabChange('assessments')}
            />
          </motion.div>
        )}
      </section>

      {/* Sticky tab bar + content */}
      <div>
        <TabBar tabs={tabs} active={activeTab} onChange={handleTabChange} />

        <div className="pt-8 min-h-[500px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
            >
              {activeTab === 'events' && (
                <EventFeed isAdmin={isAdmin || isFaculty} onEdit={handleEditEvent} onDelete={handleDeleteEvent} />
              )}
              {activeTab === 'assessments' && <AssessmentList />}
              {activeTab === 'feedback' && <FeedbackDashboard />}
              {activeTab === 'news' && <NewsFeed />}
              {activeTab === 'attendance' && (
                isAdmin || isFaculty ? <AttendanceRecordsView /> : <AttendanceHistory />
              )}
              {activeTab === 'certificates' && <MyCertificates />}
              {activeTab === 'analytics' && isAdmin && <AdminAnalytics />}
              {activeTab === 'bearers' && isAdmin && <BearerManager />}
              {activeTab === 'leaderboard' && <Leaderboard />}
              {activeTab === 'passport' && !isAdmin && <EventPassport />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Modals */}
      <EventModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} eventToEdit={eventToEdit} />
      <SubmitFeedbackModal isOpen={isFeedbackModalOpen} onClose={() => setIsFeedbackModalOpen(false)} />
    </div>
  );
};

export default Dashboard;
