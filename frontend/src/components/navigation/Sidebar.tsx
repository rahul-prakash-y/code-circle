import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Award,
  MessageSquare,
  Newspaper,
  Users,
  Shield,
  CalendarCheck,
  BarChart3,
  ChevronLeft,
} from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';
import useProfileStore from '../../store/useProfileStore';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  className?: string;
}

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  match: (loc: { pathname: string; search: string }) => boolean;
}

// Apple SF-style monogram mark
const AppMark: React.FC<{ collapsed: boolean }> = ({ collapsed }) => (
  <Link to="/dashboard" className="flex items-center gap-3 min-w-0 group outline-none">
    <motion.div
      className="w-8 h-8 rounded-[10px] flex items-center justify-center shrink-0 select-none"
      style={{ background: 'var(--accent)', boxShadow: '0 2px 8px rgba(0,113,227,0.30)' }}
    >
      <span className="text-white font-bold text-[13px] tracking-tight" style={{ fontFamily: 'var(--font-sans)' }}>
        CC
      </span>
    </motion.div>
    <AnimatePresence initial={false}>
      {!collapsed && (
        <motion.div
          initial={{ opacity: 0, width: 0 }}
          animate={{ opacity: 1, width: 'auto' }}
          exit={{ opacity: 0, width: 0 }}
          transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
          className="overflow-hidden whitespace-nowrap"
        >
          <span
            className="text-[15px] font-semibold tracking-tight"
            style={{ color: 'var(--label-primary)', letterSpacing: '-0.02em' }}
          >
            Code Circle
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  </Link>
);

const EASE_TRANSITION = { duration: 0.22, ease: [0.16, 1, 0.3, 1] } as const;

export const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggleCollapse, className = '' }) => {
  const location = useLocation();
  const { user } = useAuthStore();
  const { profile } = useProfileStore();

  const isAdmin =
    profile?.role === 'Admin' || profile?.role === 'SuperAdmin' ||
    profile?.role === 'Faculty' || profile?.role === 'Committee' ||
    user?.role === 'Admin' || user?.role === 'SuperAdmin';

  const primaryLinks: NavItem[] = [
    {
      to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard,
      match: (loc) => loc.pathname === '/dashboard' && (!loc.search || loc.search === '?tab=events'),
    },
    {
      to: '/dashboard?tab=assessments', label: 'Assessments', icon: Award,
      match: (loc) => loc.search.includes('tab=assessments'),
    },
    {
      to: '/dashboard?tab=feedback', label: 'Feedback', icon: MessageSquare,
      match: (loc) => loc.search.includes('tab=feedback'),
    },
    {
      to: '/news', label: 'News', icon: Newspaper,
      match: (loc) => loc.pathname === '/news',
    },
  ];

  const adminLinks: NavItem[] = [
    {
      to: '/teams', label: 'Teams', icon: Users,
      match: (loc) => loc.pathname === '/teams',
    },
    {
      to: '/users', label: 'Directory', icon: Shield,
      match: (loc) => loc.pathname === '/users' || loc.pathname === '/students',
    },
    {
      to: '/dashboard?tab=attendance', label: 'Attendance', icon: CalendarCheck,
      match: (loc) => loc.search.includes('tab=attendance'),
    },
    {
      to: '/dashboard?tab=analytics', label: 'Analytics', icon: BarChart3,
      match: (loc) => loc.search.includes('tab=analytics'),
    },
  ];

  const renderLink = (item: NavItem) => {
    const isActive = item.match(location);
    const Icon = item.icon;

    const inner = (
      <Link to={item.to} className="block w-full outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-xl">
        <div className="relative">
          {/* Floating active pill — Apple-style, no borders */}
          {isActive && (
            <motion.div
              layoutId="nav-active-bg"
              className="absolute inset-0 rounded-xl"
              style={{ background: 'var(--accent-subtle)' }}
              transition={EASE_TRANSITION}
            />
          )}

          <motion.div
            whileHover={{ x: isCollapsed ? 0 : 2 }}
            transition={EASE_TRANSITION}
            className={`relative flex items-center gap-3 rounded-xl cursor-pointer select-none ${
              isCollapsed ? 'justify-center w-10 h-10 mx-auto' : 'px-3 py-2.5'
            }`}
          >
            <div style={{ color: isActive ? 'var(--accent)' : 'var(--label-secondary)', flexShrink: 0 }}>
              <Icon size={18} strokeWidth={isActive ? 2 : 1.75} />
            </div>

            <AnimatePresence initial={false}>
              {!isCollapsed && (
                <motion.span
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -6 }}
                  transition={{ duration: 0.15 }}
                  className="text-[14px] tracking-tight whitespace-nowrap truncate"
                  style={{
                    fontWeight: isActive ? 600 : 400,
                    color: isActive ? 'var(--label-primary)' : 'var(--label-secondary)',
                    letterSpacing: '-0.01em',
                  }}
                >
                  {item.label}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </Link>
    );

    if (isCollapsed) {
      return (
        <Tooltip key={item.to}>
          <TooltipTrigger asChild>{inner}</TooltipTrigger>
          <TooltipContent side="right" className="text-[13px] font-medium">
            {item.label}
          </TooltipContent>
        </Tooltip>
      );
    }
    return <div key={item.to}>{inner}</div>;
  };

  return (
    <TooltipProvider delayDuration={80}>
      <motion.aside
        initial={false}
        animate={{ width: isCollapsed ? 68 : 240 }}
        transition={EASE_TRANSITION}
        className={`fixed top-0 left-0 bottom-0 z-40 flex flex-col justify-between select-none ${className}`}
        style={{
          background: 'var(--glass-bg)',
          backdropFilter: 'saturate(180%) blur(24px)',
          WebkitBackdropFilter: 'saturate(180%) blur(24px)',
          boxShadow: '1px 0 0 var(--separator)',
        }}
      >
        {/* Top */}
        <div className="flex flex-col overflow-hidden">
          {/* Brand */}
          <div
            className="h-[60px] flex items-center px-4"
            style={{ borderBottom: '1px solid var(--separator)' }}
          >
            <AppMark collapsed={isCollapsed} />
          </div>

          {/* Nav */}
          <nav
            className="flex-1 overflow-y-auto py-3"
            style={{ padding: isCollapsed ? '12px 8px' : '12px' }}
          >
            {/* Primary */}
            <div className="space-y-0.5">
              <AnimatePresence initial={false}>
                {!isCollapsed && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.12 }}
                    className="text-[11px] font-semibold uppercase tracking-widest px-3 mb-1.5"
                    style={{ color: 'var(--label-tertiary)', letterSpacing: '0.08em' }}
                  >
                    Portal
                  </motion.p>
                )}
              </AnimatePresence>
              {primaryLinks.map(renderLink)}
            </div>

            {/* Admin */}
            {isAdmin && (
              <div className="mt-5">
                <div className="sep mx-2 mb-3" />
                <AnimatePresence initial={false}>
                  {!isCollapsed && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.12 }}
                      className="text-[11px] font-semibold uppercase tracking-widest px-3 mb-1.5"
                      style={{ color: 'var(--label-tertiary)', letterSpacing: '0.08em' }}
                    >
                      Management
                    </motion.p>
                  )}
                </AnimatePresence>
                <div className="space-y-0.5">
                  {adminLinks.map(renderLink)}
                </div>
              </div>
            )}
          </nav>
        </div>

        {/* Bottom: collapse toggle */}
        <div
          className="p-3"
          style={{ borderTop: '1px solid var(--separator)' }}
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onToggleCollapse}
                className={`w-full flex items-center gap-3 rounded-xl cursor-pointer transition-colors duration-150 ${
                  isCollapsed ? 'justify-center w-10 h-10 mx-auto' : 'px-3 py-2.5'
                }`}
                style={{ color: 'var(--label-tertiary)' }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = 'var(--label-primary)')}
                onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = 'var(--label-tertiary)')}
                aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                <motion.div
                  animate={{ rotate: isCollapsed ? 180 : 0 }}
                  transition={EASE_TRANSITION}
                  style={{ flexShrink: 0 }}
                >
                  <ChevronLeft size={16} strokeWidth={2} />
                </motion.div>
                <AnimatePresence initial={false}>
                  {!isCollapsed && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.12 }}
                      className="flex items-center justify-between flex-1"
                    >
                      <span
                        className="text-[13px] font-medium"
                        style={{ color: 'var(--label-secondary)', letterSpacing: '-0.01em' }}
                      >
                        Collapse
                      </span>
                      <span
                        className="text-[10px] font-mono px-1.5 py-0.5 rounded-md"
                        style={{ background: 'var(--separator)', color: 'var(--label-tertiary)' }}
                      >
                        ⌘B
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
            </TooltipTrigger>
            {isCollapsed && (
              <TooltipContent side="right" className="text-[13px]">
                Expand sidebar
              </TooltipContent>
            )}
          </Tooltip>
        </div>
      </motion.aside>
    </TooltipProvider>
  );
};

export default Sidebar;
