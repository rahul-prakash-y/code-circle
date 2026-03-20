import React, { useState } from 'react';
import useAuthStore from '../store/useAuthStore';
import useProfileStore from '../store/useProfileStore';
import useEventStore from '../store/useEventStore';
import MyCertificates from '../components/dashboard/MyCertificates';
import { auth } from '../lib/firebase';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { LogOut, LayoutDashboard, User, Plus, Calendar, Award } from 'lucide-react';
import EventFeed from '../components/events/EventFeed';
import EventModal from '../components/events/EventModal';
import AdminAnalytics from '../components/admin/AdminAnalytics';
import Leaderboard from '../components/dashboard/Leaderboard';
import EventPassport from '../components/profile/EventPassport';
import { Trophy, BarChart3, Fingerprint, Shield as ShieldIcon } from 'lucide-react';
import BearerManager from '../components/admin/BearerManager';
import { motion } from 'framer-motion';

const Dashboard = () => {
  const { user, logout } = useAuthStore();
  const { profile } = useProfileStore();
  const { deleteEvent } = useEventStore();
  const navigate = useNavigate();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState(null);
  const [activeTab, setActiveTab] = useState('events');

  const isAdmin = profile?.role === 'Admin';
  const isFaculty = profile?.role === 'Faculty';
  const isStudent = !isAdmin && !isFaculty;

  const getStats = () => {
    if (isAdmin) {
      return [
        { label: 'Total Enrollment', value: '1,240', icon: Trophy, color: 'text-blue-400' },
        { label: 'System Health', value: '98%', icon: BarChart3, color: 'text-emerald-400' },
        { label: 'Active Events', value: '12', icon: Fingerprint, color: 'text-purple-400' }
      ];
    }
    if (isFaculty) {
      return [
        { label: 'Dept. Points', value: '14.2k', icon: Trophy, color: 'text-amber-400' },
        { label: 'Mentored', value: '45', icon: BarChart3, color: 'text-blue-400' },
        { label: 'Lab Capacity', value: '85%', icon: Fingerprint, color: 'text-emerald-400' }
      ];
    }
    return [
      { label: 'Events Attended', value: user?.enrolledEvents?.length || 0, icon: Trophy, color: 'text-yellow-400' },
      { label: 'Global Rank', value: "#12", icon: BarChart3, color: 'text-blue-400' },
      { label: 'Passport Status', value: "Level 4", icon: Fingerprint, color: 'text-emerald-400' }
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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-8">
      {/* Quick Stats Grid */}
      <section className="lg:col-span-1 space-y-6">
          <div className="stellar-glass p-8">
            <h2 className="text-sm font-black text-blue-500 uppercase tracking-[0.3em] mb-6">Performance</h2>
            <div className="space-y-6">
              {getStats().map((stat, i) => (
                <div key={i} className="flex items-center justify-between group cursor-default">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 bg-white/5 rounded-xl border border-white/5 group-hover:border-white/10 transition-colors ${stat.color}`}>
                      <stat.icon size={20} />
                    </div>
                    <span className="text-sm font-bold text-slate-400 group-hover:text-white transition-colors">{stat.label}</span>
                  </div>
                  <span className="text-xl font-black text-white">{stat.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="stellar-glass p-8 relative overflow-hidden group border-indigo-500/20 hover:border-indigo-500/40 transition-all cursor-pointer" onClick={() => setActiveTab('events')}>
             <div className="relative z-10">
                <h3 className="text-xl font-black text-white group-hover:text-indigo-400 transition-colors">Find Events</h3>
                <p className="text-sm text-slate-400 mt-1">Explore and enroll.</p>
             </div>
             <Calendar className="w-16 h-16 text-indigo-500/10 absolute -right-4 -bottom-4 group-hover:scale-110 transition-transform duration-700" />
          </div>

          {isAdmin && (
            <div 
              onClick={() => setActiveTab('bearers')}
              className={`stellar-glass p-8 flex items-center gap-5 cursor-pointer transition-all border-blue-500/20 hover:border-blue-500/40 ${activeTab === 'bearers' ? 'border-blue-500 bg-blue-500/5' : ''}`}
            >
              <div className="w-14 h-14 bg-blue-500/10 text-blue-400 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <ShieldIcon className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-xl font-black text-white group-hover:text-blue-400 transition-colors">Bearers</h3>
                <p className="text-sm text-slate-400 mt-0.5">Manage leadership</p>
              </div>
            </div>
          )}
          
          {isAdmin && (
            <button
              onClick={handleCreateEvent}
              className="w-full stellar-btn flex items-center justify-center gap-2 group"
            >
              <Plus size={20} className="group-hover:rotate-90 transition-transform duration-500" />
              Create New Event
            </button>
          )}
        </section>

        {/* Content Section */}
        <section className="lg:col-span-2 space-y-8">
          {/* Custom Tabs */}
          <div className="stellar-glass p-1.5 flex gap-1 bg-white/5">
            {[
              { id: 'events', label: 'Feed' },
              { id: 'certificates', label: 'Credits' },
              { id: 'leaderboard', label: 'Leaderboard' },
              ...(isAdmin ? [{ id: 'analytics', label: 'Admin' }] : [{ id: 'passport', label: 'Passport' }])
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all duration-500 ${activeTab === tab.id ? 'bg-white text-black shadow-xl' : 'text-slate-500 hover:bg-white/5 hover:text-white'}`}
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
                isAdmin={isAdmin} 
                onEdit={handleEditEvent}
                onDelete={handleDeleteEvent}
              />
            )}
            {activeTab === 'certificates' && <MyCertificates />}
            {activeTab === 'analytics' && isAdmin && <AdminAnalytics />}
            {activeTab === 'bearers' && isAdmin && <BearerManager />}
            {activeTab === 'leaderboard' && <Leaderboard />}
            {activeTab === 'passport' && !isAdmin && <EventPassport />}
          </motion.div>
        </section>
      <EventModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        eventToEdit={eventToEdit}
      />
    </div>
  );
};

export default Dashboard;
