import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LogOut, Bell, Search, Hexagon, Info, Users, Newspaper, Shield, Award, 
  MessageSquare, Menu, X, ChevronRight 
} from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
import BackgroundGradient from '../components/ui/BackgroundGradient';
import ThemeToggle from '../components/ui/ThemeToggle';
import { Link, useLocation } from 'react-router-dom';
import useProfileStore from '../store/useProfileStore';

const MainLayout = ({ children }) => {
  const { user, logout } = useAuthStore();
  const { profile } = useProfileStore();
  const location = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const notificationRef = useRef(null);

  const mockNotifications = [
    { id: 1, title: 'Nebula Hackathon Live!', message: 'The coding phase has officially started. Good luck!', time: '10m ago', type: 'info' },
    { id: 2, title: 'Achievement Unlocked', message: 'You have earned the "Glassmorphic Guru" badge.', time: '2h ago', type: 'success' },
    { id: 3, title: 'Team Invitation', message: 'Nexus Coders invited you to join "Project Orion".', time: '5h ago', type: 'challenge' },
    { id: 4, title: 'System Maintenance', message: 'Arena logic update scheduled for 02:00 AM IST.', time: '1d ago', type: 'info' },
  ];

  const isAdmin = profile?.role === 'Admin' || profile?.role === 'SuperAdmin' || profile?.role === 'Faculty' || user?.role === 'Admin' || user?.role === 'SuperAdmin';

  const navLinks = [
    { to: '/dashboard', label: 'Dashboard', match: (loc) => loc.pathname === '/dashboard' && !loc.search },
    { to: '/dashboard?tab=assessments', label: 'Assessments', icon: Award, match: (loc) => loc.search.includes('tab=assessments'), accent: 'violet' },
    { to: '/dashboard?tab=feedback', label: 'Feedback', icon: MessageSquare, match: (loc) => loc.search.includes('tab=feedback'), accent: 'teal' },
    { to: '/news', label: 'News', icon: Newspaper, match: (loc) => loc.pathname === '/news', accent: 'blue' },
  ];

  const adminLinks = [
    { to: '/teams', label: 'Teams', icon: Users, match: (loc) => loc.pathname === '/teams', accent: 'violet' },
    { to: '/users', label: 'Users', icon: Shield, match: (loc) => loc.pathname === '/users' || loc.pathname === '/students', accent: 'blue' },
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

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  const renderNavLink = (link, isMobile = false) => {
    const isActive = link.match(location);
    const Icon = link.icon;

    const activeClasses = isActive
      ? `bg-accent/10 text-accent border border-accent/20`
      : `text-text-muted hover:text-text-primary hover:bg-surface-elevated`;

    if (isMobile) {
      return (
        <Link
          key={link.to}
          to={link.to}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${activeClasses}`}
        >
          {Icon && <Icon size={16} />}
          {link.label}
          <ChevronRight size={14} className="ml-auto opacity-40" />
        </Link>
      );
    }

    return (
      <Link
        key={link.to}
        to={link.to}
        className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-3 py-2 rounded-xl transition-all duration-200 ${activeClasses}`}
      >
        {Icon && <Icon size={14} />}
        {link.label}
      </Link>
    );
  };

  return (
    <div className="min-h-screen relative flex flex-col items-center">
      <BackgroundGradient />
      
      {/* ─── Top Navigation Bar ─── */}
      <motion.nav 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="w-full glass-nav sticky top-0 z-50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex justify-between items-center">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-3 group shrink-0">
            <div className="w-9 h-9 bg-accent/10 border border-accent/20 rounded-xl flex items-center justify-center group-hover:border-accent/40 transition-all duration-300 group-hover:scale-105">
              <Hexagon className="w-4.5 h-4.5 text-accent group-hover:scale-110 transition-transform" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold tracking-tight text-text-primary leading-none font-heading">Code Circle</h1>
              <p className="text-[9px] font-bold text-accent uppercase tracking-[0.2em] mt-0.5">Student Portal</p>
            </div>
          </Link>
          
          {/* Desktop Nav Links */}
          <div className="hidden lg:flex items-center gap-1 ml-8">
            {navLinks.map((link) => renderNavLink(link))}
            {isAdmin && adminLinks.map((link) => renderNavLink(link))}
          </div>

          <div className="flex-1" />

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {/* Search (desktop) */}
            <div className="hidden md:flex items-center gap-2 px-3 py-2 bg-surface-elevated/80 border border-border rounded-xl focus-within:border-accent/30 focus-within:ring-1 focus-within:ring-accent/20 transition-all">
              <Search size={15} className="text-text-muted" />
              <input 
                type="text" 
                placeholder="Search..." 
                className="bg-transparent border-none text-sm focus:outline-none placeholder-text-muted w-36 text-text-primary"
              />
            </div>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Notifications */}
            <div className="relative" ref={notificationRef}>
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className={`p-2.5 rounded-xl transition-all relative group ${
                  showNotifications 
                    ? 'bg-accent/10 text-accent border border-accent/20' 
                    : 'bg-surface-elevated border border-border text-text-muted hover:text-text-primary hover:border-border-hover'
                }`}
              >
                <Bell size={17} className={showNotifications ? 'animate-bounce' : ''} />
                <span className="absolute top-2 right-2.5 w-2 h-2 bg-accent rounded-full border-2 border-surface group-hover:scale-125 transition-transform" />
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute top-14 right-0 w-80 glass-elevated p-1 z-[100] rounded-2xl"
                  >
                    <div className="p-4 border-b border-border flex justify-between items-center">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted">Notifications</h3>
                      <button className="text-[10px] font-semibold text-accent hover:text-accent-muted uppercase tracking-wider">Mark all read</button>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {mockNotifications.map((notif) => (
                        <div key={notif.id} className="p-3 hover:bg-surface-elevated rounded-xl transition-all cursor-pointer group m-1">
                          <div className="flex gap-3">
                            <div className="w-9 h-9 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent shrink-0 group-hover:scale-105 transition-transform">
                              {notif.type === 'challenge' ? <Hexagon size={15} /> : <Info size={15} />}
                            </div>
                            <div className="flex-1 min-w-0 space-y-0.5">
                              <p className="text-xs font-semibold text-text-primary group-hover:text-accent transition-colors truncate">{notif.title}</p>
                              <p className="text-[11px] text-text-muted leading-relaxed line-clamp-2">{notif.message}</p>
                              <p className="text-[10px] font-semibold text-text-muted/60 pt-0.5">{notif.time}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="p-2 border-t border-border text-center">
                      <button className="text-[11px] font-semibold text-text-muted hover:text-text-primary transition-colors py-2 w-full rounded-lg hover:bg-surface-elevated">
                        View all notifications
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Profile & Auth */}
            {user || profile ? (
              <div className="flex items-center gap-2 pl-2 ml-1 border-l border-border">
                <Link 
                  to="/profile"
                  className="group flex items-center gap-2.5 p-1 pr-3 bg-surface-elevated/60 hover:bg-surface-elevated border border-border hover:border-border-hover rounded-xl transition-all"
                >
                  <div className="w-8 h-8 rounded-lg overflow-hidden bg-accent/10 border border-border group-hover:border-accent/30 transition-all">
                    {profile?.profilePicUrl ? (
                      <img src={profile.profilePicUrl} alt={profile.name} className="w-full h-full object-cover" loading='lazy' />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs font-bold bg-accent text-text-primary">
                        {profile?.name?.charAt(0) || user?.name?.charAt(0) || 'U'}
                      </div>
                    )}
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-xs font-semibold text-text-primary leading-none">{profile?.name || user?.name || 'User'}</p>
                    <p className="text-[10px] font-medium text-text-muted mt-0.5">{profile?.role || user?.role || 'Member'}</p>
                  </div>
                </Link>

                <button 
                  onClick={logout}
                  className="p-2 bg-destructive/5 hover:bg-destructive/10 border border-destructive/10 hover:border-destructive/20 rounded-xl text-destructive transition-all hover:scale-105 active:scale-95"
                  title="Sign Out"
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="btn-primary py-2 px-5 text-xs font-bold"
              >
                Sign In
              </Link>
            )}

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2.5 rounded-xl bg-surface-elevated border border-border text-text-muted hover:text-text-primary transition-all"
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </motion.nav>

      {/* ─── Mobile Slide-in Menu ─── */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="fixed top-0 right-0 h-full w-72 glass-elevated z-50 lg:hidden p-6 rounded-l-3xl"
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-sm font-bold text-text-primary font-heading">Navigation</h2>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-lg hover:bg-surface-elevated text-text-muted"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="space-y-1">
                {navLinks.map((link) => renderNavLink(link, true))}
                {isAdmin && (
                  <>
                    <div className="my-4 border-t border-border" />
                    <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted px-4 mb-2">Admin</p>
                    {adminLinks.map((link) => renderNavLink(link, true))}
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ─── Main Content Area ─── */}
      <main className="w-full max-w-7xl px-4 sm:px-6 pb-20 pt-6 z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname + location.search}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
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
