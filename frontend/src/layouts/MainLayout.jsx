import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, Link } from 'react-router-dom';
import Sidebar from '../components/navigation/Sidebar';
import Header from '../components/navigation/Header';
import BackgroundGradient from '../components/ui/BackgroundGradient';
import {
  X, LayoutDashboard, Award, MessageSquare,
  Newspaper, Users, Shield, CalendarCheck,
} from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
import useProfileStore from '../store/useProfileStore';

const SPRING = { type: 'spring', stiffness: 260, damping: 30 };

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

  useEffect(() => { setIsMobileMenuOpen(false); }, [location.pathname, location.search]);

  // ⌘B keyboard shortcut
  useEffect(() => {
    const fn = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') { e.preventDefault(); toggleSidebar(); }
    };
    document.addEventListener('keydown', fn);
    return () => document.removeEventListener('keydown', fn);
  }, []);

  const mobileLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/dashboard?tab=assessments', label: 'Assessments', icon: Award },
    { to: '/dashboard?tab=feedback', label: 'Feedback', icon: MessageSquare },
    { to: '/news', label: 'News', icon: Newspaper },
    ...(isAdmin
      ? [
          { to: '/teams', label: 'Teams', icon: Users },
          { to: '/users', label: 'Directory', icon: Shield },
          { to: '/dashboard?tab=attendance', label: 'Attendance', icon: CalendarCheck },
        ]
      : []),
  ];

  const sidebarW = isSidebarCollapsed ? 68 : 240;

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
              transition={SPRING}
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
                <motion.button
                  whileTap={{ scale: 0.92 }}
                  transition={SPRING}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 rounded-xl"
                  style={{ color: 'var(--label-secondary)' }}
                >
                  <X size={18} strokeWidth={2} />
                </motion.button>
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

      {/* Content — single marginLeft source */}
      <motion.div
        animate={{ marginLeft: sidebarW }}
        transition={SPRING}
        className="flex-1 flex flex-col min-w-0"
      >
        {/* Mobile: override margin */}
        <style>{`@media (max-width: 1023px) { .cc-content { margin-left: 0 !important; } }`}</style>
        <div className="cc-content flex-1 flex flex-col min-w-0">
          <Header onOpenMobileMenu={() => setIsMobileMenuOpen(true)} />

          <main className="flex-1 w-full max-w-[1400px] mx-auto px-6 sm:px-8 lg:px-12 py-10 pb-24">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname + location.search}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </motion.div>
    </div>
  );
};

export default MainLayout;
