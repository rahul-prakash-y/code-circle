import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, Link } from 'react-router-dom';
import Sidebar from '../components/navigation/Sidebar';
import Header from '../components/navigation/Header';
import BackgroundGradient from '../components/ui/BackgroundGradient';
import {
  X,
  LayoutDashboard,
  Award,
  MessageSquare,
  Newspaper,
  Users,
  Shield,
  CalendarCheck,
} from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
import useProfileStore from '../store/useProfileStore';

// CC mark for mobile drawer
const CCMark = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="32" height="32" rx="10" fill="currentColor" fillOpacity="0.10"/>
    <text
      x="50%"
      y="52%"
      dominantBaseline="middle"
      textAnchor="middle"
      fontFamily="Inter, system-ui, sans-serif"
      fontWeight="900"
      fontSize="13"
      letterSpacing="-0.5"
      fill="currentColor"
    >
      CC
    </text>
  </svg>
);

export const MainLayout = ({ children }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('code-circle-sidebar-collapsed');
      return saved === 'true';
    }
    return false;
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuthStore();
  const { profile } = useProfileStore();

  const isAdmin =
    profile?.role === 'Admin' ||
    profile?.role === 'SuperAdmin' ||
    profile?.role === 'Faculty' ||
    profile?.role === 'Committee' ||
    user?.role === 'Admin' ||
    user?.role === 'SuperAdmin';

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('code-circle-sidebar-collapsed', String(next));
      return next;
    });
  };

  // Close mobile drawer on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname, location.search]);

  // ⌘B to toggle sidebar on desktop
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault();
        toggleSidebar();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const mobileLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/dashboard?tab=assessments', label: 'Assessments', icon: Award },
    { to: '/dashboard?tab=feedback', label: 'Feedback', icon: MessageSquare },
    { to: '/news', label: 'News & Bulletins', icon: Newspaper },
    ...(isAdmin
      ? [
          { to: '/teams', label: 'Teams Roster', icon: Users },
          { to: '/users', label: 'User Directory', icon: Shield },
          { to: '/dashboard?tab=attendance', label: 'Attendance', icon: CalendarCheck },
        ]
      : []),
  ];

  const sidebarW = isSidebarCollapsed ? 72 : 248;

  return (
    <div className="min-h-screen relative flex bg-surface text-text-primary overflow-x-hidden">
      <BackgroundGradient />

      {/* Desktop Collapsible Sidebar */}
      <div className="hidden lg:block">
        <Sidebar isCollapsed={isSidebarCollapsed} onToggleCollapse={toggleSidebar} />
      </div>

      {/* Mobile Drawer Navigation */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 z-50 lg:hidden"
              style={{
                background: 'rgba(0,0,0,0.6)',
                backdropFilter: 'blur(4px)',
                WebkitBackdropFilter: 'blur(4px)',
              }}
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="fixed top-0 left-0 bottom-0 w-72 z-50 lg:hidden flex flex-col"
              style={{
                background: 'var(--acrylic-bg)',
                backdropFilter: 'saturate(180%) blur(40px)',
                WebkitBackdropFilter: 'saturate(180%) blur(40px)',
                boxShadow: '1px 0 0 0 var(--border-color)',
              }}
            >
              {/* Drawer Header */}
              <div
                className="flex items-center justify-between p-5"
                style={{ borderBottom: '1px solid var(--border-color)' }}
              >
                <div className="flex items-center gap-3">
                  <div style={{ color: 'var(--accent)' }}>
                    <CCMark />
                  </div>
                  <div>
                    <h2
                      className="text-sm font-bold tracking-tight"
                      style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}
                    >
                      Code Circle
                    </h2>
                    <p
                      className="text-[10px] font-semibold uppercase tracking-widest"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      Portal
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 rounded-xl cursor-pointer transition-colors duration-150"
                  style={{ color: 'var(--text-muted)', background: 'var(--glass-bg)' }}
                >
                  <X size={18} strokeWidth={2} />
                </button>
              </div>

              {/* Nav Links */}
              <div className="flex-1 overflow-y-auto p-4 space-y-1">
                {mobileLinks.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    location.pathname === item.to ||
                    (item.to.includes('?') && location.pathname + location.search === item.to);

                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      className="flex items-center gap-3 px-3.5 py-3 rounded-xl text-[13px] font-medium transition-colors duration-150"
                      style={{
                        background: isActive ? 'var(--accent-subtle)' : 'transparent',
                        color: isActive ? 'var(--accent)' : 'var(--text-muted)',
                        fontWeight: isActive ? 600 : 400,
                      }}
                    >
                      <Icon size={18} strokeWidth={isActive ? 2.2 : 1.8} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>

              {/* Footer */}
              <div
                className="p-4 text-center text-[11px]"
                style={{ color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)' }}
              >
                Code Circle Portal v2.0
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area — single margin source (no double-margin bug) */}
      <motion.div
        className="flex-1 flex flex-col min-w-0"
        animate={{ marginLeft: sidebarW }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        style={{ marginLeft: 0 }} // mobile default; motion.div overrides on lg
      >
        {/* Inline style override for mobile: ignore the animated marginLeft */}
        <style>{`
          @media (max-width: 1023px) {
            .main-content-area { margin-left: 0 !important; }
          }
        `}</style>
        <div className="main-content-area flex-1 flex flex-col min-w-0">
          {/* Sticky Acrylic Header */}
          <Header onOpenMobileMenu={() => setIsMobileMenuOpen(true)} />

          {/* Page Content */}
          <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname + location.search}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
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
