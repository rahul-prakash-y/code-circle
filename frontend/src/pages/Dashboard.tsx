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
import MagneticCTA from '../components/ui/MagneticCTA';

// ── Scroll-driven hero (subtle depth, max 12-16px movement) ────────────────────
const Hero = ({ greeting, firstName, isAdmin, onCreateEvent, onBrowse }) => {
  const ref = useRef(null);
  const { scrollY } = useScroll();
  const headingY = useTransform(scrollY, [0, 220], [0, -12]);
  const subtextY = useTransform(scrollY, [0, 220], [0, -8]);
  const subtextOpacity = useTransform(scrollY, [0, 180], [1, 0.85]);
  const statusY = useTransform(scrollY, [0, 220], [0, -5]);
  const heroOpacity = useTransform(scrollY, [0, 260], [1, 0.25]);

  return (
    <motion.section
      ref={ref}
      style={{ opacity: heroOpacity }}
      className="pt-2 pb-12 md:pb-16"
    >
      {/* Status pill */}
      <motion.div style={{ y: statusY }} className="inline-flex items-center gap-2 mb-4">
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{ background: 'var(--success)' }}
        />
        <span
          className="text-[12px] font-medium tracking-tight text-label-secondary"
        >
          {isAdmin ? 'Admin Console · Active' : 'Portal · Online'}
        </span>
      </motion.div>

      {/* Macro headline */}
      <motion.div style={{ y: headingY }}>
        <h1 className="display-headline text-label-primary">
          {greeting},
        </h1>
        <h1 className="display-headline text-accent">
          {firstName}.
        </h1>
      </motion.div>

      {/* Body copy */}
      <motion.p
        style={{ y: subtextY, opacity: subtextOpacity }}
        className="mt-4 max-w-lg text-[16px] text-label-secondary leading-relaxed font-normal"
      >
        {isAdmin
          ? 'Manage members, events, attendance, and assessments.'
          : 'Track your progress, explore events, and compete with peers.'}
      </motion.p>

      {/* CTAs */}
      <div className="flex flex-wrap items-center gap-3 mt-7">
        <MagneticCTA maxDisplacement={3}>
          <button
            onClick={onBrowse}
            className="btn-primary flex items-center gap-2 text-[14px]"
          >
            Browse Events
            <ArrowUpRight size={14} strokeWidth={2} />
          </button>
        </MagneticCTA>

        {isAdmin && (
          <button
            onClick={onCreateEvent}
            className="btn-secondary flex items-center gap-2 text-[14px]"
          >
            <Plus size={14} strokeWidth={2} />
            New Event
          </button>
        )}
      </div>
    </motion.section>
  );
};

// ── Single metric spotlight card (tactile hover + zero re-render CSS spotlight) ──
const MetricCard = ({
  value, label, sublabel, icon: Icon, delay = 0
}: {
  value: number; label: string; sublabel?: string;
  icon: React.ComponentType<any>; delay?: number;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-40px 0px' });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
    e.currentTarget.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      className="surface spotlight-card interactive-card p-7 flex flex-col justify-between min-h-[170px] group cursor-default"
    >
      <div className="flex items-center justify-between">
        <div className="w-8 h-8 rounded-xl bg-canvas border border-separator flex items-center justify-center text-label-secondary group-hover:text-accent transition-colors duration-200">
          <Icon size={16} strokeWidth={1.75} />
        </div>
        <ChevronRight size={15} strokeWidth={1.75} className="text-label-tertiary group-hover:translate-x-0.5 transition-transform duration-200" />
      </div>

      <div className="mt-auto pt-5">
        <p className="meta-editorial mb-1.5 text-label-secondary group-hover:text-label-primary transition-colors duration-200">
          {label}
        </p>
        <div className="display-number-sm text-label-primary">
          {isInView ? <CountUp value={value} /> : <span>0</span>}
        </div>
        {sublabel && (
          <p className="text-[13px] mt-1.5 font-normal text-label-secondary group-hover:text-label-primary/80 transition-colors duration-200">
            {sublabel}
          </p>
        )}
      </div>
    </div>
  );
};

// ── Participation bar (scroll-triggered) ─────────────────────────────────────
const ParticipationBar = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-40px 0px' });

  return (
    <div
      ref={ref}
      className="surface p-7 col-span-full"
    >
      <div className="flex items-end justify-between mb-5 gap-4">
        <div>
          <p className="meta-editorial mb-1">
            Participation Rate
          </p>
          <div className="text-[2.6rem] font-bold leading-none tracking-tight text-label-primary">
            94.8%
          </div>
        </div>
        <div className="text-right">
          <p className="text-[12px] text-label-secondary">Target: 90%</p>
          <p className="text-[12px] font-semibold mt-0.5 text-success">
            +4.8% above goal
          </p>
        </div>
      </div>

      {/* Progress track */}
      <div
        className="w-full rounded-full overflow-hidden"
        style={{ height: '4px', background: 'var(--separator)' }}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={isInView ? { width: '94.8%' } : {}}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
          className="h-full rounded-full"
          style={{ background: 'var(--accent)' }}
        />
      </div>
    </div>
  );
};

// ── Apple-style tab bar with sliding indicator ───────────────────────────────
const TabBar = ({ tabs, active, onChange }) => (
  <div
    className="sticky z-20 -mx-6 sm:-mx-8 lg:-mx-12 px-6 sm:px-8 lg:px-12"
    style={{
      top: '56px',
      background: 'var(--glass-bg)',
      backdropFilter: 'saturate(180%) blur(20px)',
      WebkitBackdropFilter: 'saturate(180%) blur(20px)',
      boxShadow: '0 1px 0 var(--separator)',
    }}
  >
    <div className="flex overflow-x-auto gap-1 -mb-px py-1.5">
      {tabs.map((tab) => {
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className="relative flex-shrink-0 px-3.5 py-2 text-[13px] rounded-lg cursor-pointer transition-colors duration-150 outline-none select-none"
            style={{
              color: isActive ? 'var(--label-primary)' : 'var(--label-secondary)',
              fontWeight: isActive ? 600 : 400,
              letterSpacing: '-0.01em',
            }}
          >
            {isActive && (
              <motion.div
                layoutId="dashboard-tab-indicator"
                className="absolute inset-0 rounded-lg"
                style={{ background: 'var(--separator)' }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              />
            )}
            <span className="relative z-10">{tab.label}</span>
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
      delay: 0,
    },
    {
      value: isAdmin ? (metrics?.activeEvents ?? 0) : 12,
      label: isAdmin ? 'Active Events' : 'Leaderboard Rank',
      sublabel: 'Live & scheduled',
      icon: Calendar,
      delay: 0.05,
    },
    {
      value: isAdmin ? (metrics?.totalEvents ?? 0) : 4,
      label: isAdmin ? 'Total Events' : 'Certificates',
      sublabel: 'All-time',
      icon: Trophy,
      delay: 0.1,
    },
    {
      value: metrics?.totalAssessmentLevels ?? 6,
      label: 'Skill Tracks',
      sublabel: 'Algorithmic & practical',
      icon: Target,
      delay: 0.15,
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
