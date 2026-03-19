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
import { Trophy, BarChart3, Fingerprint } from 'lucide-react';

const Dashboard = () => {
  const { user, logout } = useAuthStore();
  const { profile } = useProfileStore();
  const { deleteEvent } = useEventStore();
  const navigate = useNavigate();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState(null);
  const [activeTab, setActiveTab] = useState('events'); // 'events', 'certificates', 'analytics', 'leaderboard', 'passport'

  const isAdmin = profile?.role === 'Admin';

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
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <span className="text-white font-bold">C</span>
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                Code Circle
              </span>
            </div>
            <div className="flex items-center gap-6">
              <div className="hidden md:flex items-center gap-4 border-r border-slate-800 pr-6">
                <button 
                  onClick={() => navigate('/dashboard')}
                  className="text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  Dashboard
                </button>
                <button 
                  onClick={() => navigate('/profile')}
                  className="text-sm font-medium text-slate-400 hover:text-white transition-colors"
                >
                  Profile
                </button>
              </div>
              <div 
                onClick={() => navigate('/profile')}
                className="flex items-center gap-2 bg-slate-800/50 px-3 py-1.5 rounded-full border border-slate-700 cursor-pointer hover:border-indigo-500/50 transition-all group"
              >
                <User className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-medium">{user?.email}</span>
                {isAdmin && (
                  <span className="text-[10px] bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full border border-indigo-500/30 font-bold uppercase">
                    Admin
                  </span>
                )}
              </div>
              <button
                onClick={handleLogout}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3 mb-2">
              <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold text-indigo-400 uppercase tracking-widest">
                Phase 3: Event Management
              </span>
            </div>
            <h1 className="text-5xl font-extrabold text-white tracking-tight">
              {isAdmin ? 'Admin Console' : 'Student Hub'}
            </h1>
            <p className="text-slate-400 text-lg max-w-2xl">
              Welcome back, {profile?.name || 'Developer'}. Stay updated with the latest events and track your coding journey.
            </p>
          </div>

          {isAdmin && (
            <button
              onClick={handleCreateEvent}
              className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold shadow-xl shadow-indigo-500/20 hover:shadow-indigo-500/40 hover:-translate-y-1 transition-all"
            >
              <Plus size={20} />
              New Event
            </button>
          )}
        </header>

        {/* Quick Stats / Navigation */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-16">
          <div 
            onClick={() => navigate('/profile')}
            className="group glass-card p-6 flex items-center gap-4 cursor-pointer hover:border-indigo-500/50 transition-all"
          >
            <div className="w-12 h-12 bg-purple-500/10 text-purple-400 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-white group-hover:text-purple-400 transition-colors">My Profile</h3>
              <p className="text-xs text-slate-400">Manage your developer identity</p>
            </div>
          </div>

          <div 
            onClick={() => setActiveTab('leaderboard')}
            className={`group glass-card p-6 flex items-center gap-4 cursor-pointer transition-all ${activeTab === 'leaderboard' ? 'border-indigo-500 bg-indigo-500/5' : 'hover:border-indigo-500/50'}`}
          >
            <div className="w-12 h-12 bg-yellow-500/10 text-yellow-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-white group-hover:text-yellow-500 transition-colors">Leaderboard</h3>
              <p className="text-xs text-slate-400">View global standings</p>
            </div>
          </div>

          {isAdmin ? (
            <div 
              onClick={() => setActiveTab('analytics')}
              className={`group glass-card p-6 flex items-center gap-4 cursor-pointer transition-all ${activeTab === 'analytics' ? 'border-indigo-500 bg-indigo-500/5' : 'hover:border-indigo-500/50'}`}
            >
              <div className="w-12 h-12 bg-blue-500/10 text-blue-400 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <BarChart3 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-white group-hover:text-blue-400 transition-colors">Analytics</h3>
                <p className="text-xs text-slate-400">Admin dashboard stats</p>
              </div>
            </div>
          ) : (
            <div 
              onClick={() => setActiveTab('passport')}
              className={`group glass-card p-6 flex items-center gap-4 cursor-pointer transition-all ${activeTab === 'passport' ? 'border-indigo-500 bg-indigo-500/5' : 'hover:border-indigo-500/50'}`}
            >
              <div className="w-12 h-12 bg-indigo-500/10 text-indigo-400 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Fingerprint className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-white group-hover:text-indigo-400 transition-colors">Passport</h3>
                <p className="text-xs text-slate-400">Your activity timeline</p>
              </div>
            </div>
          )}
          
          <div className="md:col-span-1 glass-card p-6 flex items-center justify-between border-indigo-500/20 relative overflow-hidden group hover:border-indigo-500/50 transition-all cursor-pointer" onClick={() => setActiveTab('events')}>
             <div className="relative z-10">
                <h3 className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors">Events Feed</h3>
                <p className="text-sm text-slate-400">Explore and enroll.</p>
             </div>
             <Calendar className="w-12 h-12 text-indigo-500/10 absolute -right-2 -bottom-2" />
          </div>
        </div>

        {/* Tab Content */}
        <section className="mt-12">
          {activeTab === 'events' && (
            <EventFeed 
              isAdmin={isAdmin} 
              onEdit={handleEditEvent}
              onDelete={handleDeleteEvent}
            />
          )}
          {activeTab === 'certificates' && <MyCertificates />}
          {activeTab === 'analytics' && isAdmin && <AdminAnalytics />}
          {activeTab === 'leaderboard' && <Leaderboard />}
          {activeTab === 'passport' && !isAdmin && <EventPassport />}
        </section>
      </main>

      {/* Admin Modals */}
      <EventModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        eventToEdit={eventToEdit}
      />
    </div>
  );
};

export default Dashboard;
