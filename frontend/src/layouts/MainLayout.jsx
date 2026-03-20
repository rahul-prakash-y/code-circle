import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, User, Bell, Search, Hexagon, Info } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
import StellarBackground from '../components/ui/StellarBackground';
import { Link, useLocation } from 'react-router-dom';
import useProfileStore from '../store/useProfileStore';

const MainLayout = ({ children }) => {
  const { logout } = useAuthStore();
  const { profile } = useProfileStore();
  const location = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef(null);

  const mockNotifications = [
    { id: 1, title: 'Nebula Hackathon Live!', message: 'The coding phase has officially started. Good luck!', time: '10m ago', type: 'info' },
    { id: 2, title: 'Achievement Unlocked', message: 'You have earned the "Glassmorphic Guru" badge.', time: '2h ago', type: 'success' },
    { id: 3, title: 'Team Invitation', message: 'Nexus Coders invited you to join "Project Orion".', time: '5h ago', type: 'challenge' },
    { id: 4, title: 'System Maintenance', message: 'Arena logic update scheduled for 02:00 AM IST.', time: '1d ago', type: 'info' },
  ];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="min-h-screen text-white relative flex flex-col items-center">
      <StellarBackground />
      
      {/* Top Navigation */}
      <motion.nav 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-7xl px-6 py-8 flex justify-between items-center z-50"
      >
        <Link to="/dashboard" className="flex items-center gap-3 group">
          <div className="w-10 h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center group-hover:border-blue-500/50 transition-all duration-500">
            <Hexagon className="w-5 h-5 text-blue-400 group-hover:scale-110 transition-transform" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tighter text-white uppercase leading-none">Code Circle</h1>
            <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] mt-0.5">Unified Portal</p>
          </div>
        </Link>

        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/5 rounded-2xl focus-within:border-blue-500/30 transition-all">
            <Search size={16} className="text-slate-500" />
            <input 
              type="text" 
              placeholder="Search..." 
              className="bg-transparent border-none text-sm focus:outline-none placeholder-slate-600 w-40"
            />
          </div>

          <div className="flex items-center gap-4 pl-6 border-l border-white/10 relative" ref={notificationRef}>
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className={`p-2.5 rounded-xl transition-all relative group ${showNotifications ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-white/5 hover:bg-white/10 border border-white/5 text-slate-400 hover:text-white'}`}
            >
              <Bell size={18} className={showNotifications ? 'animate-bounce' : ''} />
              <span className="absolute top-2 right-2.5 w-2 h-2 bg-blue-500 rounded-full border-2 border-[#030303] group-hover:scale-125 transition-transform" />
            </button>

            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: 15, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute top-16 right-0 w-80 stellar-glass p-2 z-[100] border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
                >
                  <div className="p-4 border-b border-white/5 flex justify-between items-center">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Notifications</h3>
                    <button className="text-[9px] font-bold text-blue-500 hover:text-blue-400 uppercase tracking-widest">Mark all as read</button>
                  </div>
                  <div className="max-h-80 overflow-y-auto custom-scrollbar">
                    {mockNotifications.map((notif) => (
                      <div key={notif.id} className="p-4 hover:bg-white/5 rounded-2xl transition-all cursor-pointer group mb-1">
                        <div className="flex gap-4">
                          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                            {notif.type === 'challenge' ? <Hexagon size={16} /> : <Info size={16} />}
                          </div>
                          <div className="flex-1 space-y-1">
                            <p className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors">{notif.title}</p>
                            <p className="text-[10px] text-slate-500 leading-relaxed line-clamp-2">{notif.message}</p>
                            <p className="text-[9px] font-black uppercase tracking-tighter text-slate-700 pt-1">{notif.time}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-3 border-t border-white/5 text-center">
                    <button className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 hover:text-white transition-colors py-2 w-full">View all intelligence</button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            <Link 
              to="/profile"
              className="group flex items-center gap-3 p-1 pr-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl transition-all"
            >
              <div className="w-9 h-9 rounded-xl overflow-hidden bg-slate-800 border border-white/10 group-hover:border-blue-500/50 transition-all">
                {profile?.profilePicUrl ? (
                  <img src={profile.profilePicUrl} alt={profile.name} className="w-full h-full object-cover" loading='lazy' />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs font-black bg-blue-600">
                    {profile?.name?.charAt(0)}
                  </div>
                )}
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-bold text-white leading-none">{profile?.name}</p>
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">{profile?.role}</p>
              </div>
            </Link>

            <button 
              onClick={logout}
              className="p-2.5 bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 rounded-xl text-red-400 hover:text-red-300 transition-all"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Main Content Area */}
      <main className="w-full max-w-7xl px-6 pb-20 z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};

export default MainLayout;
