import React, { useState, useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useOutlet, Link, Outlet } from 'react-router-dom';
import Sidebar from '../components/navigation/Sidebar';
import Header from '../components/navigation/Header';
import BottomNav from '../components/navigation/BottomNav';
import BackgroundGradient from '../components/ui/BackgroundGradient';
import PageTransitionWrapper from '../components/ui/PageTransitionWrapper';
import { PageSkeleton } from '../components/ui/LoadingSkeleton';
import { preloadRoute, preloadCommonRoutes } from '../lib/routePreload';
import {
  X, LayoutDashboard, Calendar, Award, CalendarCheck,
  Medal, Trophy, Ticket, MessageSquare,
  Newspaper, Users, Crown, Shield, BarChart3,
  Compass, UserCheck,
  Flame, Sparkles, KeyRound, Activity,
} from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
import useProfileStore from '../store/useProfileStore';
import MandatoryChangePasswordModal from '../components/auth/MandatoryChangePasswordModal';

import { EMIL_EASE_OUT, EMIL_EASE_IN_OUT } from '../lib/motion';
const EASE_TRANSITION = { duration: 0.22, ease: EMIL_EASE_OUT };

export const MainLayout = ({ children }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('code-circle-sidebar-collapsed') === 'true';
    }
    return false;
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const outlet = useOutlet();
  const { user } = useAuthStore();
  const { profile } = useProfileStore();

  // Preload common routes during idle time so page changes are instantaneous
  useEffect(() => {
    preloadCommonRoutes();
  }, []);

  // Scroll window to top on route change for native SPA feel
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [location.pathname]);

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

  // Close mobile drawer on route change without cascading effect renders
  const [prevLocation, setPrevLocation] = useState(location.pathname + location.search);
  if (prevLocation !== location.pathname + location.search) {
    setPrevLocation(location.pathname + location.search);
    if (isMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }
  }

  // ⌘B keyboard shortcut (desktop only)
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
      const desktop = window.innerWidth >= 1024;
      setIsDesktop(desktop);
      // Close mobile menu when viewport becomes desktop
      if (desktop) setIsMobileMenuOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isSuperAdmin =
    profile?.role === 'SuperAdmin' || user?.role === 'SuperAdmin';

  // Full link list for the mobile slide-over drawer (admin/power-user access)
  const mobileLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/events', label: 'Events', icon: Calendar },
    { to: '/courses', label: 'Courses', icon: Compass },
    { to: '/assessments', label: 'Assessments', icon: Award },
    { to: '/contests', label: 'Contests', icon: Flame },
    { to: '/attendance', label: 'Attendance', icon: CalendarCheck },
    { to: '/certificates', label: 'Certificates', icon: Medal },
    { to: '/leaderboard', label: 'Leaderboard', icon: Trophy },
    { to: '/points', label: 'My Points', icon: Sparkles },
    { to: '/passport', label: 'Registrations', icon: Ticket },
    { to: '/feedback', label: 'Feedback', icon: MessageSquare },
    { to: '/news', label: 'News', icon: Newspaper },
    { to: '/bearers', label: 'Student Bearers', icon: Crown },
    ...(isSuperAdmin
      ? [
          { to: '/bearers/manage', label: 'Manage Bearers', icon: Crown },
          { to: '/diagnostics', label: 'Diagnostics', icon: Activity },
        ]
      : []),
    ...(isAdmin
      ? [
          { to: '/users', label: 'Directory', icon: Shield },
          { to: '/password-resets', label: 'Password Resets', icon: KeyRound },
          { to: '/tracking', label: 'Student Tracking', icon: UserCheck },
          { to: '/analytics', label: 'Analytics', icon: BarChart3 },
        ]
      : []),
  ];

  const sidebarW = isDesktop ? (isSidebarCollapsed ? 68 : 240) : 0;

  return (
    <div
      className="min-h-[100dvh] relative flex overflow-x-hidden"
      style={{ backgroundColor: 'var(--canvas)', color: 'var(--label-primary)' }}
    >
      <BackgroundGradient />

      {/* Desktop Sidebar — hidden on mobile & tablets (< 1024px) */}
      <div className="hidden lg:block">
        <Sidebar isCollapsed={isSidebarCollapsed} onToggleCollapse={toggleSidebar} />
      </div>

      {/* Mobile Slide-Over Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 z-50 lg:hidden backdrop-blur-md" style={{ background: 'var(--surface-overlay)' }}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={EASE_TRANSITION}
              className="fixed top-0 left-0 bottom-0 w-[min(300px,85vw)] z-50 lg:hidden flex flex-col"
              style={{
                background: 'var(--surface)',
                borderRight: '1px solid var(--separator)',
                boxShadow: 'var(--shadow-xl)',
              }}
            >
              {/* Drawer header */}
              <div
                className="flex items-center justify-between px-5 h-[60px] shrink-0"
                style={{ borderBottom: '1px solid var(--separator)' }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-[10px] flex items-center justify-center shrink-0"
                    style={{ background: 'var(--accent)', boxShadow: '0 2px 8px var(--accent-subtle)' }}
                  >
                    <span className="text-white font-bold text-[13px]">CC</span>
                  </div>
                  <span
                    className="text-[15px] font-semibold tracking-tight truncate"
                    style={{ color: 'var(--label-primary)', letterSpacing: '-0.02em' }}
                  >
                    Code Circle
                  </span>
                </div>
                {/* 44×44 close button per iOS touch target spec */}
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-center rounded-xl emil-press cursor-pointer"
                  style={{ color: 'var(--label-secondary)', minWidth: 44, minHeight: 44 }}
                  aria-label="Close menu"
                >
                  <X size={18} strokeWidth={2} />
                </button>
              </div>

              {/* Nav links */}
              <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5 custom-scrollbar">
                {mobileLinks.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    location.pathname === item.to ||
                    (item.to.includes('?') && location.pathname + location.search === item.to);
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      onMouseEnter={() => preloadRoute(item.to)}
                      onTouchStart={() => preloadRoute(item.to)}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-3 rounded-xl text-[14px] transition-colors duration-150"
                      style={{
                        background: isActive ? 'var(--accent-subtle)' : 'transparent',
                        color: isActive ? 'var(--accent)' : 'var(--label-secondary)',
                        fontWeight: isActive ? 600 : 400,
                        letterSpacing: '-0.01em',
                        minHeight: 44,
                      }}
                    >
                      <Icon size={18} strokeWidth={isActive ? 2 : 1.75} />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  );
                })}
              </nav>

              {/* Footer */}
              <div
                className="px-5 py-3.5 text-[11px] shrink-0"
                style={{ color: 'var(--label-tertiary)', borderTop: '1px solid var(--separator)' }}
              >
                Code Circle v2.0 · Student Platform
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Content area */}
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

        {/*
          Mobile-first padding:
          - Mobile (< 640px): px-3.5 py-4, pb-24 to comfortably clear bottom nav (56px + safe-area)
          - Tablet (640px - 1023px): px-6 py-6, pb-8 (since bottom nav is hidden on md+)
          - Desktop (>= 1024px): px-8 lg:px-10 py-7, pb-10
        */}
        <main className="flex-1 w-full mx-auto px-3.5 sm:px-6 lg:px-10 py-4 sm:py-6 lg:py-7 pb-24 md:pb-8">
          <Suspense fallback={<PageSkeleton />}>
            <AnimatePresence mode="wait" initial={false}>
              <PageTransitionWrapper key={location.pathname}>
                <Suspense fallback={<PageSkeleton />}>
                  {children || outlet || <Outlet />}
                </Suspense>
              </PageTransitionWrapper>
            </AnimatePresence>
          </Suspense>
        </main>
      </motion.div>

      {/* iOS Bottom Navigation — visible only on mobile (< md: 768px) */}
      {/* <BottomNav /> */}

      <MandatoryChangePasswordModal />
    </div>
  );
};

export default MainLayout;
