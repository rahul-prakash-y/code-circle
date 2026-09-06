import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, Link } from 'react-router-dom';
import Sidebar from '../components/navigation/Sidebar';
import Header from '../components/navigation/Header';
import BackgroundGradient from '../components/ui/BackgroundGradient';
import {
  X, LayoutDashboard, Calendar, Award, CalendarCheck,
  Medal, Trophy, Ticket, MessageSquare,
  Newspaper, Users, Shield, BarChart3,
} from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
import useProfileStore from '../store/useProfileStore';

const EASE_TRANSITION = { duration: 0.24, ease: [0.16, 1, 0.3, 1] };

export const MainLayout = ({ children }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('code-circle-sidebar-collapsed') === 'true';
    }
    return false;
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuthStore();
  const { profile } = useProfileStore();

  const isAdmin =
    profile?.role === 'Admin' || profile?.role === 'SuperAdmin' ||
    profile?.role === 'Faculty' || profile?.role === 'Committee' ||
    user?.role === 'Admin' || user?.role === 'SuperAdmin';

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('code-circle-sidebar-collapsed', String(next));
      return next;
    });
  };

  // Close mobile drawer on route change during render without cascading effect renders
  const [prevLocation, setPrevLocation] = useState(location.pathname + location.search);
  if (prevLocation !== location.pathname + location.search) {
    setPrevLocation(location.pathname + location.search);
    if (isMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }
  }

  // ⌘B keyboard shortcut
  useEffect(() => {
    const fn = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') { e.preventDefault(); toggleSidebar(); }
    };
    document.addEventListener('keydown', fn);
    return () => document.removeEventListener('keydown', fn);
  }, []);

  // Responsive desktop detection
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024;
    }
    return false;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const mobileLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/events', label: 'Events', icon: Calendar },
    { to: '/assessments', label: 'Assessments', icon: Award },
    { to: '/attendance', label: 'Attendance', icon: CalendarCheck },
    { to: '/certificates', label: 'Certificates', icon: Medal },
    { to: '/leaderboard', label: 'Leaderboard', icon: Trophy },
    { to: '/passport', label: 'Registrations', icon: Ticket },
    { to: '/feedback', label: 'Feedback', icon: MessageSquare },
    { to: '/news', label: 'News', icon: Newspaper },
    ...(isAdmin
      ? [
          { to: '/teams', label: 'Teams', icon: Users },
          { to: '/users', label: 'Directory', icon: Shield },
          { to: '/analytics', label: 'Analytics', icon: BarChart3 },
        ]
      : []),
  ];

  const sidebarW = isDesktop ? (isSidebarCollapsed ? 68 : 240) : 0;

  return (
    <div
      className="min-h-screen relative flex overflow-x-hidden"
      style={{ backgroundColor: 'var(--canvas)', color: 'var(--label-primary)' }}
    >
      <BackgroundGradient />

      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar isCollapsed={isSidebarCollapsed} onToggleCollapse={toggleSidebar} />
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 z-50 lg:hidden"
              style={{ background: 'rgba(0,0,0,0.40)', backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)' }}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={EASE_TRANSITION}
              className="fixed top-0 left-0 bottom-0 w-[260px] z-50 lg:hidden flex flex-col"
              style={{
                background: 'var(--glass-bg)',
                backdropFilter: 'saturate(180%) blur(24px)',
                WebkitBackdropFilter: 'saturate(180%) blur(24px)',
                boxShadow: '1px 0 0 var(--separator)',
              }}
            >
              {/* Drawer header */}
              <div
                className="flex items-center justify-between px-5 h-[60px]"
                style={{ borderBottom: '1px solid var(--separator)' }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-[10px] flex items-center justify-center"
                    style={{ background: 'var(--accent)', boxShadow: '0 2px 8px rgba(0,113,227,0.30)' }}
                  >
                    <span className="text-white font-bold text-[13px]">CC</span>
                  </div>
                  <span
                    className="text-[15px] font-semibold tracking-tight"
                    style={{ color: 'var(--label-primary)', letterSpacing: '-0.02em' }}
                  >
                    Code Circle
                  </span>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 rounded-xl active:translate-y-[1px] transition-transform"
                  style={{ color: 'var(--label-secondary)' }}
                >
                  <X size={18} strokeWidth={2} />
                </button>
              </div>

              {/* Nav links */}
              <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
                {mobileLinks.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    location.pathname === item.to ||
                    (item.to.includes('?') && location.pathname + location.search === item.to);
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] transition-colors duration-150"
                      style={{
                        background: isActive ? 'var(--accent-subtle)' : 'transparent',
                        color: isActive ? 'var(--accent)' : 'var(--label-secondary)',
                        fontWeight: isActive ? 600 : 400,
                        letterSpacing: '-0.01em',
                      }}
                    >
                      <Icon size={18} strokeWidth={isActive ? 2 : 1.75} />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>

              {/* Footer */}
              <div
                className="px-5 py-4 text-[12px]"
                style={{ color: 'var(--label-tertiary)', borderTop: '1px solid var(--separator)' }}
              >
                Code Circle v2.0
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Content — single marginLeft source for desktop only */}
      <style>{`
        @media (max-width: 1023px) {
          .cc-content-root { margin-left: 0px !important; }
        }
      `}</style>
      <motion.div
        animate={{ marginLeft: sidebarW }}
        transition={EASE_TRANSITION}
        className="cc-content-root flex-1 flex flex-col min-w-0"
      >
        <Header onOpenMobileMenu={() => setIsMobileMenuOpen(true)} />

        <main className="flex-1 w-full max-w-[1400px] mx-auto px-6 sm:px-8 lg:px-12 py-10 pb-24">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname + location.search}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </motion.div>
    </div>
  );
};

export default MainLayout;
