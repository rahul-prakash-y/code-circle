import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, Link } from 'react-router-dom';
import Sidebar from '../components/navigation/Sidebar';
import Header from '../components/navigation/Header';
import BackgroundGradient from '../components/ui/BackgroundGradient';
import { X, Hexagon, LayoutDashboard, Award, MessageSquare, Newspaper, Users, Shield, CalendarCheck } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
import useProfileStore from '../store/useProfileStore';

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

  return (
    <div className="min-h-screen relative flex bg-surface text-text-primary overflow-x-hidden">
      <BackgroundGradient />

      {/* Desktop Collapsible Sidebar */}
      <div className="hidden lg:block">
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={toggleSidebar}
        />
      </div>

      {/* Mobile Drawer Navigation */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 lg:hidden"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="fixed top-0 left-0 bottom-0 w-72 glass-elevated z-50 lg:hidden p-5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between pb-5 mb-5 border-b border-border/60">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-accent/15 border border-accent/30 rounded-xl flex items-center justify-center text-accent">
                      <Hexagon className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-sm font-extrabold text-text-primary font-heading">Code Circle</h2>
                      <p className="text-[9px] font-bold text-accent uppercase tracking-widest">Portal</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-2 rounded-xl bg-surface-elevated text-text-muted hover:text-text-primary"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="space-y-1">
                  {mobileLinks.map((item) => {
                    const Icon = item.icon;
                    const isActive =
                      location.pathname === item.to ||
                      (item.to.includes('?') &&
                        location.pathname + location.search === item.to);

                    return (
                      <Link
                        key={item.to}
                        to={item.to}
                        className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-semibold transition-all ${
                          isActive
                            ? 'bg-accent/15 text-accent border-l-4 border-accent font-bold'
                            : 'text-text-muted hover:text-text-primary hover:bg-surface-elevated'
                        }`}
                      >
                        <Icon size={18} className={isActive ? 'text-accent' : 'text-text-muted'} />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-border/60 text-[11px] text-text-muted text-center">
                Code Circle Portal v2.0
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <motion.div
        animate={{
          marginLeft: isSidebarCollapsed ? 76 : 256,
        }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="flex-1 flex flex-col min-w-0 transition-[margin] duration-300 w-full lg:ml-0"
        style={{
          // On mobile, margin-left is 0
          marginLeft: undefined,
        }}
      >
        <div className={`flex-1 flex flex-col min-w-0 ${isSidebarCollapsed ? 'lg:ml-[76px]' : 'lg:ml-[256px]'} transition-[margin] duration-300`}>
          {/* Top Sticky Glassmorphic Header */}
          <Header onOpenMobileMenu={() => setIsMobileMenuOpen(true)} />

          {/* Page Content View */}
          <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname + location.search}
                initial={{ opacity: 0, y: 12 }}
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
