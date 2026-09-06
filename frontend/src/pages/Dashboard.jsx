import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useInView, useSpring } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Users,
  Calendar,
  Trophy,
  Target,
  RefreshCw,
  Activity,
  Sparkles,
  TrendingUp,
  CheckCircle2,
  Plus,
  MessageSquarePlus,
  BarChart3,
  Award,
  Layers,
  ArrowRight,
  ChevronRight,
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

// ─── Scroll-driven metric card ─────────────────────────────────────────────
const MetricSpotlight = ({ value, label, suffix = '', prefix = '', color, icon: Icon, detail, delay = 0 }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px 0px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 48, scale: 0.96 }}
      animate={isInView ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 48, scale: 0.96 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay }}
      className="flex flex-col justify-between p-8 rounded-3xl"
      style={{
        background: 'var(--surface-elevated)',
        boxShadow: 'var(--shadow-deep-val)',
      }}
    >
      <div className="flex items-start justify-between">
        <div
          className="w-10 h-10 rounded-2xl flex items-center justify-center"
          style={{ background: `${color}18`, color }}
        >
          <Icon size={20} strokeWidth={1.8} />
        </div>
        {detail && (
          <span
            className="text-[11px] font-semibold uppercase tracking-widest px-2.5 py-1 rounded-full"
            style={{ background: 'var(--glass-border)', color: 'var(--text-muted)' }}
          >
            {detail}
          </span>
        )}
      </div>

      <div className="mt-6">
        <p
          className="text-[11px] font-semibold uppercase tracking-widest mb-2"
          style={{ color: 'var(--text-muted)', letterSpacing: '0.12em' }}
        >
          {label}
        </p>
        <div className="flex items-end gap-1">
          {prefix && (
            <span
              className="text-2xl font-bold mb-1"
              style={{ color: 'var(--text-muted)', letterSpacing: '-0.02em' }}
            >
              {prefix}
            </span>
          )}
          <div
            className="metric-number-sm"
            style={{ color }}
          >
            {isInView ? <CountUp value={value} /> : <span>0</span>}
          </div>
          {suffix && (
            <span
              className="text-lg font-bold mb-1 ml-1"
              style={{ color: 'var(--text-muted)', letterSpacing: '-0.02em' }}
            >
              {suffix}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// ─── Cinematic hero section ──────────────────────────────────────────────────
const HeroSection = ({ greeting, displayName, isAdmin, onCreateEvent, onBrowseEvents }) => {
  const ref = useRef(null);
  const { scrollY } = useScroll();
  // Parallax: hero fades + shifts up slightly as user scrolls
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);
  const y = useTransform(scrollY, [0, 300], [0, -40]);

  return (
    <motion.div
      ref={ref}
      style={{ opacity, y }}
      className="relative py-14 md:py-20 lg:py-24 overflow-hidden"
    >
      {/* Ambient orb */}
      <div
        className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[600px] h-[400px] pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse, var(--accent-subtle) 0%, transparent 70%)',
          filter: 'blur(40px)',
          opacity: 0.6,
        }}
      />

      <div className="relative z-10 max-w-4xl">
        {/* Live status chip */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="inline-flex items-center gap-2 mb-6 px-3.5 py-1.5 rounded-full"
          style={{
            background: 'var(--accent-subtle)',
            border: '1px solid var(--accent)',
            borderOpacity: 0.3,
          }}
        >
          <span className="relative flex h-2 w-2">
            <span
              className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
              style={{ background: 'var(--success)' }}
            />
            <span
              className="relative inline-flex rounded-full h-2 w-2"
              style={{ background: 'var(--success)' }}
            />
          </span>
          <span
            className="text-[11px] font-semibold uppercase tracking-widest"
            style={{ color: 'var(--accent)' }}
          >
            {isAdmin ? 'Admin Console' : 'Portal Dashboard'}
          </span>
        </motion.div>

        {/* Greeting — macro typography */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
        >
          <h1
            className="font-black leading-none tracking-tight"
            style={{
              fontSize: 'clamp(2.8rem, 6vw, 5.5rem)',
              letterSpacing: '-0.04em',
              color: 'var(--text-primary)',
              lineHeight: 1.0,
            }}
          >
            {greeting},
          </h1>
          <h1
            className="font-black leading-none"
            style={{
              fontSize: 'clamp(2.8rem, 6vw, 5.5rem)',
              letterSpacing: '-0.04em',
              color: 'var(--accent)',
              lineHeight: 1.0,
              marginTop: '0.05em',
            }}
          >
            {displayName}.
          </h1>
        </motion.div>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
          className="mt-6 max-w-xl text-base leading-relaxed"
          style={{ color: 'var(--text-muted)' }}
        >
          {isAdmin
            ? 'Manage members, events, attendance, and assessments from your command center.'
            : 'Test your skills, explore upcoming events, and track your progress in Code Circle.'}
        </motion.p>

        {/* CTA row */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.45 }}
          className="flex flex-wrap items-center gap-3 mt-8"
        >
          <motion.button
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            onClick={onBrowseEvents}
            className="btn-primary flex items-center gap-2 text-sm px-5 py-2.5 rounded-xl font-semibold"
          >
            Browse Events
            <ArrowRight size={15} strokeWidth={2} />
          </motion.button>

          {isAdmin && (
            <motion.button
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              onClick={onCreateEvent}
              className="btn-secondary flex items-center gap-2 text-sm px-5 py-2.5 rounded-xl font-semibold"
            >
              <Plus size={15} strokeWidth={2} />
              New Event
            </motion.button>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
};

// ─── Scroll-driven participation bar ────────────────────────────────────────
const ParticipationBar = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-60px 0px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 32 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="p-8 rounded-3xl col-span-full"
      style={{ background: 'var(--surface-elevated)', boxShadow: 'var(--shadow-deep-val)' }}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <p
            className="text-[11px] font-semibold uppercase tracking-widest"
            style={{ color: 'var(--text-muted)', letterSpacing: '0.12em' }}
          >
            Platform Participation
          </p>
          <p
            className="text-3xl font-black mt-1"
            style={{ color: 'var(--success)', letterSpacing: '-0.03em' }}
          >
            94.8%
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Goal: 90%</p>
          <p className="text-xs font-semibold mt-0.5" style={{ color: 'var(--success)' }}>
            +4.8% above target
          </p>
        </div>
      </div>
      <div
        className="w-full rounded-full overflow-hidden"
        style={{ height: '6px', background: 'var(--border-color)' }}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={isInView ? { width: '94.8%' } : { width: 0 }}
          transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
          className="h-full rounded-full"
          style={{
            background: 'linear-gradient(90deg, var(--accent), #34d399)',
          }}
        />
      </div>
    </motion.div>
  );
};

// ─── Tab Bar (Sticky, Apple-style underline) ─────────────────────────────────
const TabBar = ({ tabs, activeTab, onTabChange }) => {
  return (
    <div
      className="sticky z-20 flex overflow-x-auto"
      style={{
        top: '64px',
        background: 'var(--acrylic-bg)',
        backdropFilter: 'saturate(180%) blur(40px)',
        WebkitBackdropFilter: 'saturate(180%) blur(40px)',
        boxShadow: '0 1px 0 var(--border-color)',
      }}
    >
      <div className="flex gap-0 w-full">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className="relative flex-shrink-0 px-4 py-4 text-[13px] font-medium cursor-pointer transition-colors duration-200 whitespace-nowrap"
              style={{
                color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                fontWeight: isActive ? 600 : 400,
                letterSpacing: '-0.01em',
              }}
            >
              {tab.label}
              {/* Animated underline via layoutId */}
              {isActive && (
                <motion.div
                  layoutId="tab-underline"
                  className="tab-active-bar"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// ─── Main Dashboard ──────────────────────────────────────────────────────────
export const Dashboard = () => {
  const { user } = useAuthStore();
  const { profile } = useProfileStore();
  const { deleteEvent } = useEventStore();
  const { metrics, loading: metricsLoading, fetchMetrics } = useMetricsStore();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState(null);
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'events');

  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId });
  };

  const isAdmin =
    profile?.role === 'Admin' ||
    profile?.role === 'SuperAdmin' ||
    user?.role === 'Admin' ||
    user?.role === 'SuperAdmin';
  const isFaculty = profile?.role === 'Faculty';

  useEffect(() => {
    if (isAdmin || isFaculty) {
      fetchMetrics();
    }
  }, [isAdmin, isFaculty, fetchMetrics]);

  const handleCreateEvent = () => {
    setEventToEdit(null);
    setIsModalOpen(true);
  };

  const handleEditEvent = (event) => {
    setEventToEdit(event);
    setIsModalOpen(true);
  };

  const handleDeleteEvent = async (id) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        await deleteEvent(id);
        toast.success('Event deleted successfully');
      } catch {
        toast.error('Failed to delete event');
      }
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
      : [{ id: 'passport', label: 'My Registrations' }]),
  ];

  const displayName = profile?.name?.split(' ')[0] || user?.name?.split(' ')[0] || 'Developer';
  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'Good morning' : currentHour < 18 ? 'Good afternoon' : 'Good evening';

  // Metric data
  const metrics4 = [
    {
      value: isAdmin ? (metrics?.totalUsers ?? 0) : (user?.enrolledEvents?.length ?? 0),
      label: isAdmin ? 'Total Users' : 'Registered Events',
      color: 'var(--accent)',
      icon: Users,
      detail: '+12% this term',
      delay: 0,
    },
    {
      value: isAdmin ? (metrics?.activeEvents ?? 0) : 12,
      label: isAdmin ? 'Active Events' : 'Leaderboard Rank',
      prefix: isAdmin ? '' : '#',
      color: '#a78bfa',
      icon: Calendar,
      detail: 'Live & Scheduled',
      delay: 0.08,
    },
    {
      value: isAdmin ? (metrics?.totalEvents ?? 0) : 4,
      label: isAdmin ? 'Total Events' : 'Certificates Earned',
      color: '#f59e0b',
      icon: Trophy,
      detail: 'All-time',
      delay: 0.16,
    },
    {
      value: metrics?.totalAssessmentLevels ?? 6,
      label: 'Skill Tracks',
      suffix: '',
      color: '#34d399',
      icon: Target,
      detail: 'Curated',
      delay: 0.24,
    },
  ];

  return (
    <div className="space-y-0">
      {/* ─── Cinematic Hero ─── */}
      <HeroSection
        greeting={greeting}
        displayName={displayName}
        isAdmin={isAdmin}
        onCreateEvent={handleCreateEvent}
        onBrowseEvents={() => handleTabChange('events')}
      />

      {/* ─── Metric Strip (scroll-driven) ─── */}
      <section className="pb-12">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-4"
        >
          {metrics4.map((m) => (
            <MetricSpotlight key={m.label} {...m} />
          ))}
        </motion.div>

        {/* Participation Bar */}
        <ParticipationBar />

        {/* Quick Actions (admin only) */}
        {isAdmin && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
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

      {/* ─── Sticky Tab Strip + Content ─── */}
      <div>
        <TabBar tabs={tabs} activeTab={activeTab} onTabChange={handleTabChange} />

        {/* Tab content with AnimatePresence */}
        <div className="pt-6 min-h-[500px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
              {activeTab === 'events' && (
                <EventFeed
                  isAdmin={isAdmin || isFaculty}
                  onEdit={handleEditEvent}
                  onDelete={handleDeleteEvent}
                />
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
      <EventModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        eventToEdit={eventToEdit}
      />
      <SubmitFeedbackModal
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
      />
    </div>
  );
};

export default Dashboard;
