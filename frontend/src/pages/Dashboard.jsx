import React, { useState, useEffect } from 'react';
import useAuthStore from '../store/useAuthStore';
import useProfileStore from '../store/useProfileStore';
import useEventStore from '../store/useEventStore';
import useMetricsStore from '../store/useMetricsStore';
import MyCertificates from '../components/dashboard/MyCertificates';
import { auth } from '../lib/firebase';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { 
  LogOut, 
  LayoutDashboard, 
  User, 
  Plus, 
  Calendar, 
  Award, 
  Trophy, 
  BarChart3, 
  Shield as ShieldIcon, 
  Users, 
  Layers, 
  RefreshCw,
  Newspaper,
  Zap,
  Target
} from 'lucide-react';
import EventFeed from '../components/events/EventFeed';
import EventModal from '../components/events/EventModal';
import AdminAnalytics from '../components/admin/AdminAnalytics';
import Leaderboard from '../components/dashboard/Leaderboard';
import EventPassport from '../components/profile/EventPassport';
import AttendanceHistory from '../components/dashboard/AttendanceHistory';
import AttendanceRecordsView from '../components/admin/AttendanceRecordsView';
import BearerManager from '../components/admin/BearerManager';
import QuickActions from '../components/admin/QuickActions';
import AssessmentList from '../components/assessments/AssessmentList';
import FeedbackDashboard from '../components/feedback/FeedbackDashboard';
import SubmitFeedbackModal from '../components/feedback/SubmitFeedbackModal';
import NewsFeed from './NewsFeed';
import { motion } from 'framer-motion';
import { MessageSquare, MessageSquarePlus } from 'lucide-react';
import GlassCard from '../components/ui/GlassCard';

const Dashboard = () => {
  const { user, logout } = useAuthStore();
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

  const isAdmin = profile?.role === 'Admin' || profile?.role === 'SuperAdmin' || user?.role === 'Admin' || user?.role === 'SuperAdmin';
  const isFaculty = profile?.role === 'Faculty';
  const isStudent = !isAdmin && !isFaculty;

  useEffect(() => {
    if (isAdmin || isFaculty) {
      fetchMetrics();
    }
  }, [isAdmin, isFaculty, fetchMetrics]);

  const getStats = () => {
    if (isAdmin) {
      return [
        { label: 'Total Users', value: metrics ? metrics.totalUsers.toLocaleString() : '...', icon: Users, color: 'text-accent dark:text-accent-muted' },
        { label: 'Active Events', value: metrics ? metrics.activeEvents.toLocaleString() : '...', icon: Calendar, color: 'text-violet-500 dark:text-violet-400' },
        { label: 'Total Events', value: metrics ? metrics.totalEvents.toLocaleString() : '...', icon: Trophy, color: 'text-rose-500 dark:text-rose-400' },
        { label: 'Assessment Levels', value: metrics ? `${metrics.totalAssessmentLevels} Available` : '...', icon: Target, color: 'text-emerald-500 dark:text-emerald-400' },
      ];
    }
    if (isFaculty) {
      return [
        { label: 'Dept. Points', value: '14.2k', icon: Trophy, color: 'text-amber-500 dark:text-amber-400' },
        { label: 'Students Mentored', value: '45', icon: BarChart3, color: 'text-accent dark:text-accent-muted' },
        { label: 'Active Sessions', value: '8', icon: Calendar, color: 'text-emerald-500 dark:text-emerald-400' }
      ];
    }
    return [
      { label: 'Registered Events', value: user?.enrolledEvents?.length || 0, icon: Calendar, color: 'text-amber-500 dark:text-amber-400' },
      { label: 'Leaderboard Rank', value: "#12", icon: BarChart3, color: 'text-accent dark:text-accent-muted' },
      { label: 'Certificates Earned', value: "Level 4", icon: Trophy, color: 'text-emerald-500 dark:text-emerald-400' }
    ];
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      logout();
      toast.success('Logged out successfully');
      navigate('/login');
    } catch {
      toast.error('Logout failed');
    }
  };

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
    ...(isAdmin ? [{ id: 'analytics', label: 'Analytics' }] : [{ id: 'passport', label: 'My Registrations' }])
  ];

  return (
    <div className="space-y-8 py-2">
      {/* Prominent Quick Actions Command Center for Admins & Faculty */}
      {isAdmin && (
        <QuickActions
          onManageEvents={() => setActiveTab('events')}
          onOpenCreateEvent={handleCreateEvent}
          onManageAssessments={() => setActiveTab('assessments')}
        />
      )}

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Left Column: Metrics & Quick Cards */}
        <section className="lg:col-span-1 space-y-4">
          {/* Metrics Card */}
          <GlassCard className="relative overflow-hidden">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-accent uppercase tracking-wider font-heading">
                  {isAdmin ? 'System Metrics' : 'Performance'}
                </h2>
                {isAdmin && isCached && (
                  <span className="text-[9px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-surface-elevated text-text-muted border border-border">
                    Cached
                  </span>
                )}
              </div>
              {isAdmin && (
                <button
                  onClick={() => fetchMetrics({ refresh: true })}
                  disabled={metricsLoading}
                  className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-elevated transition-all"
                  title="Force refresh metrics"
                >
                  <RefreshCw size={14} className={metricsLoading ? 'animate-spin text-accent' : ''} />
                </button>
              )}
            </div>

            <div className="space-y-5">
              {getStats().map((stat, i) => (
                <motion.div 
                  key={i} 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="flex items-center justify-between group cursor-default"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 bg-surface-elevated rounded-xl border border-border group-hover:border-border-hover transition-colors ${stat.color}`}>
                      <stat.icon size={18} />
                    </div>
                    <span className="text-sm font-medium text-text-muted group-hover:text-text-primary transition-colors">
                      {stat.label}
                    </span>
                  </div>
                  <span className="text-lg font-bold text-text-primary">{stat.value}</span>
                </motion.div>
              ))}
            </div>
          </GlassCard>

          {/* Quick Navigation Cards */}
          <GlassCard 
            variant="interactive"
            glow="violet"
            className="relative overflow-hidden group"
            onClick={() => setActiveTab('events')}
          >
            <div className="relative z-10">
              <h3 className="text-lg font-bold text-text-primary group-hover:text-accent transition-colors font-heading">
                Upcoming Events
              </h3>
              <p className="text-sm text-text-muted mt-1">Browse workshops and sessions.</p>
            </div>
            <Calendar className="w-14 h-14 text-accent/10 absolute -right-2 -bottom-2 group-hover:scale-110 transition-transform duration-500" />
          </GlassCard>

          {/* News Quick Tab */}
          <GlassCard 
            variant="interactive"
            glow="blue"
            className={`flex items-center gap-4 ${activeTab === 'news' ? 'border-accent/30 bg-blue-500/5' : ''}`}
            onClick={() => setActiveTab('news')}
          >
            <div className="w-12 h-12 bg-accent/10 text-accent dark:text-accent-muted rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Newspaper className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-text-primary group-hover:text-accent transition-colors font-heading">
                Club News
              </h3>
              <p className="text-sm text-text-muted mt-0.5">Announcements & bulletins</p>
            </div>
          </GlassCard>

          {(isAdmin || isFaculty) && (
            <GlassCard 
              variant="interactive"
              glow="violet"
              className="flex items-center gap-4 group"
              onClick={() => navigate('/teams')}
            >
              <div className="w-12 h-12 bg-violet-500/10 text-violet-500 dark:text-violet-400 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-text-primary group-hover:text-violet-500 transition-colors font-heading">
                  Manage Teams
                </h3>
                <p className="text-sm text-text-muted mt-0.5">Rosters, mapping & status</p>
              </div>
            </GlassCard>
          )}

          {isAdmin && (
            <GlassCard 
              variant="interactive"
              glow="blue"
              className={`flex items-center gap-4 ${activeTab === 'bearers' ? 'border-accent/30 bg-blue-500/5' : ''}`}
              onClick={() => setActiveTab('bearers')}
            >
              <div className="w-12 h-12 bg-accent/10 text-accent dark:text-accent-muted rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <ShieldIcon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-text-primary group-hover:text-accent transition-colors font-heading">
                  Office Bearers
                </h3>
                <p className="text-sm text-text-muted mt-0.5">Manage club leadership team</p>
              </div>
            </GlassCard>
          )}

          {/* Assessments Quick Tab */}
          <GlassCard 
            variant="interactive"
            glow="violet"
            className={`flex items-center gap-4 ${activeTab === 'assessments' ? 'border-violet-500/30 bg-violet-500/5' : ''}`}
            onClick={() => setActiveTab('assessments')}
          >
            <div className="w-12 h-12 bg-violet-500/10 text-violet-500 dark:text-violet-400 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-text-primary group-hover:text-violet-500 transition-colors font-heading">
                MCQ Assessments
              </h3>
              <p className="text-sm text-text-muted mt-0.5">Test conceptual mastery</p>
            </div>
          </GlassCard>

          {/* Feedback Quick Tab */}
          <GlassCard 
            variant="interactive"
            glow="teal"
            className={`flex items-center gap-4 ${activeTab === 'feedback' ? 'border-teal-500/30 bg-teal-500/5' : ''}`}
            onClick={() => setActiveTab('feedback')}
          >
            <div className="w-12 h-12 bg-teal-500/10 text-teal-500 dark:text-teal-400 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-text-primary group-hover:text-teal-500 transition-colors font-heading">
                Student Feedback
              </h3>
              <p className="text-sm text-text-muted mt-0.5">{isAdmin ? 'Review student insights' : 'Share your perspective'}</p>
            </div>
          </GlassCard>
          
          {/* Action Button */}
          {(isAdmin || isFaculty) ? (
            <button
              onClick={handleCreateEvent}
              className="w-full btn-primary flex items-center justify-center gap-2 group py-3.5 text-base cursor-pointer"
            >
              <Plus size={20} className="group-hover:rotate-90 transition-transform duration-500" />
              Create New Event
            </button>
          ) : (
            <button
              onClick={() => setIsFeedbackModalOpen(true)}
              className="w-full flex items-center justify-center gap-2 py-3.5 text-base font-semibold text-text-primary rounded-xl bg-gradient-to-r from-teal-500 to-blue-600 hover:brightness-110 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shadow-lg shadow-teal-500/20"
            >
              <MessageSquarePlus size={18} />
              Give Feedback
            </button>
          )}
        </section>

        {/* Right Column: Dynamic Tabs & Content Section */}
        <section className="lg:col-span-2 space-y-6">
          {/* Custom Tabs */}
          <GlassCard noPadding className="p-1.5 flex gap-1 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex-1 min-w-[100px] py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                  activeTab === tab.id 
                    ? 'bg-accent text-text-primary shadow-lg shadow-accent/20' 
                    : 'text-text-muted hover:bg-surface-elevated hover:text-text-primary'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </GlassCard>

          <motion.div
            key={activeTab}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
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
        </section>
      </div>

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
