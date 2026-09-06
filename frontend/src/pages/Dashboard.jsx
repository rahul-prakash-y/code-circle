import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  ArrowRight
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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.05,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.45,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

export const Dashboard = () => {
  const { user } = useAuthStore();
  const { profile } = useProfileStore();
  const { deleteEvent } = useEventStore();
  const { metrics, loading: metricsLoading, fetchMetrics, isCached } = useMetricsStore();
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
    { id: 'events', label: 'Events Feed' },
    { id: 'assessments', label: 'Assessments' },
    { id: 'feedback', label: 'Feedback' },
    { id: 'news', label: 'News & Bulletins' },
    { id: 'attendance', label: 'Attendance' },
    { id: 'certificates', label: 'Certificates' },
    { id: 'leaderboard', label: 'Leaderboard' },
    ...(isAdmin ? [{ id: 'analytics', label: 'Analytics' }] : [{ id: 'passport', label: 'My Registrations' }]),
    ...(isAdmin ? [{ id: 'bearers', label: 'Office Bearers' }] : []),
  ];

  const displayName = profile?.name || user?.name || 'Developer';
  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'Good morning' : currentHour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="space-y-8 py-2">
      {/* ─── Bento Grid Hero & Metrics Section ─── */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 auto-rows-fr"
      >
        {/* Bento Card 1: Welcome & Status Hero (Spans 2 columns) */}
        <motion.div
          variants={cardVariants}
          className="col-span-1 md:col-span-2 glass p-6 sm:p-7 relative overflow-hidden rounded-3xl border border-border flex flex-col justify-between"
        >
          {/* Ambient Glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-accent/10 blur-3xl pointer-events-none -mr-16 -mt-16" />

          <div className="space-y-3 relative z-10">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/10 border border-accent/25 text-accent text-[10px] font-extrabold uppercase tracking-widest">
                <Sparkles size={12} />
                Portal Dashboard
              </span>

              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
                  Live Status
                </span>
              </div>
            </div>

            <div>
              <h2 className="text-xl sm:text-2xl font-black text-text-primary font-heading tracking-tight">
                {greeting}, {displayName}!
              </h2>
              <p className="text-xs sm:text-sm text-text-muted mt-1 leading-relaxed max-w-md">
                {isAdmin
                  ? 'Manage members, events, attendance records, and competitive assessments from your command center.'
                  : 'Welcome back to Code Circle. Test your skills in MCQ assessments and check upcoming club events.'}
              </p>
            </div>
          </div>

          <div className="pt-5 mt-4 border-t border-border/60 flex flex-wrap items-center justify-between gap-3 relative z-10">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-text-secondary">Quick Tab:</span>
              <button
                onClick={() => handleTabChange('events')}
                className="text-xs font-bold text-accent hover:underline flex items-center gap-1 cursor-pointer"
              >
                Browse Events <ArrowRight size={13} />
              </button>
            </div>

            {isAdmin && (
              <button
                onClick={handleCreateEvent}
                className="btn-primary py-2 px-4 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Plus size={14} /> New Event
              </button>
            )}
          </div>
        </motion.div>

        {/* Bento Card 2: Total Users (Spans 1 column) */}
        <motion.div
          variants={cardVariants}
          className="col-span-1 glass p-6 relative overflow-hidden rounded-3xl border border-border flex flex-col justify-between group hover:border-accent/30 transition-all duration-300"
        >
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-2xl bg-accent/10 border border-accent/25 text-accent group-hover:scale-110 transition-transform duration-300">
              <Users size={22} />
            </div>
            {isAdmin && (
              <button
                onClick={() => fetchMetrics({ refresh: true })}
                disabled={metricsLoading}
                className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-elevated transition-colors cursor-pointer"
                title="Refresh metrics"
              >
                <RefreshCw size={13} className={metricsLoading ? 'animate-spin text-accent' : ''} />
              </button>
            )}
          </div>

          <div className="mt-4">
            <p className="text-[11px] font-extrabold uppercase tracking-widest text-text-muted">
              {isAdmin ? 'Total Users' : 'Registered Events'}
            </p>
            <div className="text-3xl font-black text-text-primary mt-1 font-heading">
              <CountUp value={isAdmin ? (metrics?.totalUsers ?? 0) : (user?.enrolledEvents?.length ?? 0)} />
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-500 font-bold mt-2">
              <TrendingUp size={13} />
              <span>+12% active this term</span>
            </div>
          </div>
        </motion.div>

        {/* Bento Card 3: Active Events (Spans 1 column) */}
        <motion.div
          variants={cardVariants}
          className="col-span-1 glass p-6 relative overflow-hidden rounded-3xl border border-border flex flex-col justify-between group hover:border-violet-500/30 transition-all duration-300"
        >
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-2xl bg-violet-500/10 border border-violet-500/25 text-violet-500 dark:text-violet-400 group-hover:scale-110 transition-transform duration-300">
              <Calendar size={22} />
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-widest bg-violet-500/10 text-violet-400 border border-violet-500/20">
              Live & Scheduled
            </span>
          </div>

          <div className="mt-4">
            <p className="text-[11px] font-extrabold uppercase tracking-widest text-text-muted">
              {isAdmin ? 'Active Events' : 'Rank on Leaderboard'}
            </p>
            <div className="text-3xl font-black text-text-primary mt-1 font-heading">
              <CountUp value={isAdmin ? (metrics?.activeEvents ?? 0) : 12} prefix={isAdmin ? '' : '#'} />
            </div>
            <p className="text-[11px] text-text-muted font-medium mt-2">
              {isAdmin ? 'Currently open for RSVP' : 'Top 5% among peers'}
            </p>
          </div>
        </motion.div>

        {/* Bento Card 4: Total Events & Contests (Spans 1 column) */}
        <motion.div
          variants={cardVariants}
          className="col-span-1 glass p-6 relative overflow-hidden rounded-3xl border border-border flex flex-col justify-between group hover:border-amber-500/30 transition-all duration-300"
        >
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-500 dark:text-amber-400 group-hover:scale-110 transition-transform duration-300">
              <Trophy size={22} />
            </div>
            <span className="text-[9px] font-extrabold uppercase tracking-widest text-amber-500 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
              Sessions
            </span>
          </div>

          <div className="mt-4">
            <p className="text-[11px] font-extrabold uppercase tracking-widest text-text-muted">
              {isAdmin ? 'Total Events' : 'Certificates Earned'}
            </p>
            <div className="text-3xl font-black text-text-primary mt-1 font-heading">
              <CountUp value={isAdmin ? (metrics?.totalEvents ?? 0) : 4} />
            </div>
            <p className="text-[11px] text-text-muted font-medium mt-2">
              {isAdmin ? 'All-time workshops & hackathons' : 'Level verified badge'}
            </p>
          </div>
        </motion.div>

        {/* Bento Card 5: MCQ Assessment Tracks (Spans 1 column) */}
        <motion.div
          variants={cardVariants}
          className="col-span-1 glass p-6 relative overflow-hidden rounded-3xl border border-border flex flex-col justify-between group hover:border-emerald-500/30 transition-all duration-300"
        >
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-500 dark:text-emerald-400 group-hover:scale-110 transition-transform duration-300">
              <Target size={22} />
            </div>
            <span className="text-[9px] font-extrabold uppercase tracking-widest text-emerald-500 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
              Curated
            </span>
          </div>

          <div className="mt-4">
            <p className="text-[11px] font-extrabold uppercase tracking-widest text-text-muted">
              Skill Assessments
            </p>
            <div className="text-3xl font-black text-text-primary mt-1 font-heading">
              <CountUp value={metrics?.totalAssessmentLevels || 6} suffix=" Tracks" />
            </div>
            <p className="text-[11px] text-text-muted font-medium mt-2">
              Algorithmic & full-stack challenges
            </p>
          </div>
        </motion.div>

        {/* Bento Card 6: Engagement & Verified Attendance (Spans 2 columns) */}
        <motion.div
          variants={cardVariants}
          className="col-span-1 md:col-span-2 glass p-6 relative overflow-hidden rounded-3xl border border-border flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-teal-500/10 border border-teal-500/25 text-teal-500 dark:text-teal-400">
                <BarChart3 size={20} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-text-primary font-heading">Platform Participation</h4>
                <p className="text-[11px] text-text-muted">Active attendance and verified completion rate</p>
              </div>
            </div>
            <span className="text-sm font-black font-mono text-teal-500">94.8%</span>
          </div>

          <div className="space-y-2 mt-4">
            <div className="w-full bg-surface-elevated rounded-full h-2.5 overflow-hidden border border-border/60">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: '94.8%' }}
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
                className="bg-linear-to-r from-accent via-purple-500 to-teal-400 h-full rounded-full"
              />
            </div>
            <div className="flex justify-between text-[10px] text-text-muted font-mono">
              <span>Goal: 90%</span>
              <span className="text-emerald-400 font-bold">Target Exceeded (+4.8%)</span>
            </div>
          </div>
        </motion.div>

        {/* Bento Card 7: Quick Actions Panel (Full width row spanning 4 columns) */}
        {isAdmin && (
          <motion.div variants={cardVariants} className="col-span-1 md:col-span-2 lg:col-span-4">
            <QuickActions
              onManageEvents={() => handleTabChange('events')}
              onOpenCreateEvent={handleCreateEvent}
              onManageAssessments={() => handleTabChange('assessments')}
            />
          </motion.div>
        )}
      </motion.div>

      {/* ─── Dynamic Interactive Tabs Section ─── */}
      <div className="space-y-6 pt-2">
        {/* Sleek Tab Navigation Pill Bar */}
        <div className="glass p-1.5 flex gap-1 overflow-x-auto custom-scrollbar rounded-2xl border border-border">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex-1 min-w-[120px] py-2.5 px-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-accent text-white shadow-md shadow-accent/25'
                    : 'text-text-muted hover:text-text-primary hover:bg-surface-elevated'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Dynamic Tab Views */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="min-h-[500px]"
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
