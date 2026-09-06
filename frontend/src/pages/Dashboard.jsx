import React, { useState, useEffect } from 'react';
import useAuthStore from '../store/useAuthStore';
import useProfileStore from '../store/useProfileStore';
import useEventStore from '../store/useEventStore';
import useMetricsStore from '../store/useMetricsStore';
import MyCertificates from '../components/dashboard/MyCertificates';
import { auth } from '../lib/firebase';
import { useNavigate } from 'react-router-dom';
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
import NewsFeed from './NewsFeed';
import { motion } from 'framer-motion';

const Dashboard = () => {
  const { user, logout } = useAuthStore();
  const { profile } = useProfileStore();
  const { deleteEvent } = useEventStore();
  const { metrics, loading: metricsLoading, fetchMetrics, isCached } = useMetricsStore();
  const navigate = useNavigate();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState(null);
  const [activeTab, setActiveTab] = useState('events');

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
        { 
          label: 'Total Users', 
          value: metrics ? metrics.totalUsers.toLocaleString() : '...', 
          icon: Users, 
          color: 'text-blue-400' 
        },
        { 
          label: 'Active Events', 
          value: metrics ? metrics.activeEvents.toLocaleString() : '...', 
          icon: Calendar, 
          color: 'text-purple-400' 
        },
        { 
          label: 'Total Events', 
          value: metrics ? metrics.totalEvents.toLocaleString() : '...', 
          icon: Trophy, 
          color: 'text-pink-400' 
        },
        { 
          label: 'Assessment Levels', 
          value: metrics ? `${metrics.totalAssessmentLevels} Available` : '...', 
          icon: Target, 
          color: 'text-emerald-400' 
        },
      ];
    }
    if (isFaculty) {
      return [
        { label: 'Dept. Points', value: '14.2k', icon: Trophy, color: 'text-amber-400' },
        { label: 'Students Mentored', value: '45', icon: BarChart3, color: 'text-blue-400' },
        { label: 'Active Sessions', value: '8', icon: Calendar, color: 'text-emerald-400' }
      ];
    }
    return [
      { label: 'Registered Events', value: user?.enrolledEvents?.length || 0, icon: Calendar, color: 'text-yellow-400' },
      { label: 'Leaderboard Rank', value: "#12", icon: BarChart3, color: 'text-blue-400' },
      { label: 'Certificates Earned', value: "Level 4", icon: Trophy, color: 'text-emerald-400' }
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

  return (
    <div className="space-y-8 py-2">
      {/* Prominent Quick Actions Command Center for Admins & Faculty */}
      {isAdmin && (
        <QuickActions
          onManageEvents={() => setActiveTab('events')}
          onOpenCreateEvent={handleCreateEvent}
        />
      )}

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Metrics & Quick Cards */}
        <section className="lg:col-span-1 space-y-6">
          <div className="stellar-glass p-8 relative overflow-hidden">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-black text-blue-500 uppercase tracking-[0.3em]">
                  {isAdmin ? 'System Metrics' : 'Performance'}
                </h2>
                {isAdmin && isCached && (
                  <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/5 text-slate-400 border border-white/5">
                    Cached
                  </span>
                )}
              </div>

              {isAdmin && (
                <button
                  onClick={() => fetchMetrics({ refresh: true })}
                  disabled={metricsLoading}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all"
                  title="Force refresh metrics"
                >
                  <RefreshCw size={14} className={metricsLoading ? 'animate-spin text-blue-400' : ''} />
                </button>
              )}
            </div>

            <div className="space-y-6">
              {getStats().map((stat, i) => (
                <div key={i} className="flex items-center justify-between group cursor-default">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 bg-white/5 rounded-xl border border-white/5 group-hover:border-white/10 transition-colors ${stat.color}`}>
                      <stat.icon size={20} />
                    </div>
                    <span className="text-sm font-bold text-slate-400 group-hover:text-white transition-colors">
                      {stat.label}
                    </span>
                  </div>
                  <span className="text-xl font-black text-white">{stat.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div 
            className="stellar-glass p-8 relative overflow-hidden group border-indigo-500/20 hover:border-indigo-500/40 transition-all cursor-pointer" 
            onClick={() => setActiveTab('events')}
          >
            <div className="relative z-10">
              <h3 className="text-xl font-black text-white group-hover:text-indigo-400 transition-colors">
                Upcoming Events
              </h3>
              <p className="text-sm text-slate-400 mt-1">Browse workshops and sessions.</p>
            </div>
            <Calendar className="w-16 h-16 text-indigo-500/10 absolute -right-4 -bottom-4 group-hover:scale-110 transition-transform duration-700" />
          </div>

          {/* Quick Tab to News Feed */}
          <div 
            onClick={() => setActiveTab('news')}
            className={`stellar-glass p-8 flex items-center gap-5 cursor-pointer transition-all border-blue-500/20 hover:border-blue-500/40 ${activeTab === 'news' ? 'border-blue-500 bg-blue-500/5' : ''}`}
          >
            <div className="w-14 h-14 bg-blue-500/10 text-blue-400 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Newspaper className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white group-hover:text-blue-400 transition-colors">
                Club News
              </h3>
              <p className="text-sm text-slate-400 mt-0.5">Announcements & bulletins</p>
            </div>
          </div>

          {(isAdmin || isFaculty) && (
            <div 
              onClick={() => navigate('/teams')}
              className="stellar-glass p-8 flex items-center gap-5 cursor-pointer transition-all border-purple-500/20 hover:border-purple-500/40 hover:bg-purple-500/5 group"
            >
              <div className="w-14 h-14 bg-purple-500/10 text-purple-400 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Users className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-xl font-black text-white group-hover:text-purple-400 transition-colors">
                  Manage Teams
                </h3>
                <p className="text-sm text-slate-400 mt-0.5">Rosters, mapping & status</p>
              </div>
            </div>
          )}

          {isAdmin && (
            <div 
              onClick={() => setActiveTab('bearers')}
              className={`stellar-glass p-8 flex items-center gap-5 cursor-pointer transition-all border-blue-500/20 hover:border-blue-500/40 ${activeTab === 'bearers' ? 'border-blue-500 bg-blue-500/5' : ''}`}
            >
              <div className="w-14 h-14 bg-blue-500/10 text-blue-400 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <ShieldIcon className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-xl font-black text-white group-hover:text-blue-400 transition-colors">
                  Office Bearers
                </h3>
                <p className="text-sm text-slate-400 mt-0.5">Manage club leadership team</p>
              </div>
            </div>
          )}
          
          {(isAdmin || isFaculty) && (
            <button
              onClick={handleCreateEvent}
              className="w-full stellar-btn flex items-center justify-center gap-2 group"
            >
              <Plus size={20} className="group-hover:rotate-90 transition-transform duration-500" />
              Create New Event
            </button>
          )}
        </section>

        {/* Right Column: Dynamic Tabs & Content Section */}
        <section className="lg:col-span-2 space-y-8">
          {/* Custom Tabs */}
          <div className="stellar-glass p-1.5 flex gap-1 bg-white/5 overflow-x-auto custom-scrollbar">
            {[
              { id: 'events', label: 'Events Feed' },
              { id: 'news', label: 'News & Announcements' },
              { id: 'attendance', label: 'Attendance' },
              { id: 'certificates', label: 'Certificates' },
              { id: 'leaderboard', label: 'Leaderboard' },
              ...(isAdmin ? [{ id: 'analytics', label: 'Analytics' }] : [{ id: 'passport', label: 'My Registrations' }])
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 min-w-[110px] py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all duration-500 ${activeTab === tab.id ? 'bg-white text-black shadow-xl' : 'text-slate-500 hover:bg-white/5 hover:text-white'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <motion.div
            key={activeTab}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="min-h-[500px]"
          >
            {activeTab === 'events' && (
              <EventFeed 
                isAdmin={isAdmin || isFaculty} 
                onEdit={handleEditEvent}
                onDelete={handleDeleteEvent}
              />
            )}
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
    </div>
  );
};

export default Dashboard;
