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
  ChevronLeft,
  BarChart3,
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
  icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
  match: (loc: { pathname: string; search: string }) => boolean;
}

// CC monogram lockup
const CCMark: React.FC<{ size?: number }> = ({ size = 32 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
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

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  onToggleCollapse,
  className = '',
}) => {
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

  const primaryLinks: NavItem[] = [
    {
      to: '/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      match: (loc) => loc.pathname === '/dashboard' && (!loc.search || loc.search === '?tab=events'),
    },
    {
      to: '/dashboard?tab=assessments',
      label: 'Assessments',
      icon: Award,
      match: (loc) => loc.search.includes('tab=assessments'),
    },
    {
      to: '/dashboard?tab=feedback',
      label: 'Feedback',
      icon: MessageSquare,
      match: (loc) => loc.search.includes('tab=feedback'),
    },
    {
      to: '/news',
      label: 'News & Bulletins',
      icon: Newspaper,
      match: (loc) => loc.pathname === '/news',
    },
  ];

  const adminLinks: NavItem[] = [
    {
      to: '/teams',
      label: 'Teams Roster',
      icon: Users,
      match: (loc) => loc.pathname === '/teams',
    },
    {
      to: '/users',
      label: 'User Directory',
      icon: Shield,
      match: (loc) => loc.pathname === '/users' || loc.pathname === '/students',
    },
    {
      to: '/dashboard?tab=attendance',
      label: 'Attendance',
      icon: CalendarCheck,
      match: (loc) => loc.search.includes('tab=attendance'),
    },
    {
      to: '/dashboard?tab=analytics',
      label: 'Analytics',
      icon: BarChart3,
      match: (loc) => loc.search.includes('tab=analytics'),
    },
  ];

  const renderNavLink = (item: NavItem) => {
    const isActive = item.match(location);
    const Icon = item.icon;

    const content = (
      <Link to={item.to} className="block w-full focus:outline-none">
        <div className="relative">
          {/* Floating active background pill — animated via layoutId */}
          {isActive && (
            <motion.div
              layoutId="sidebar-active-pill"
              className="absolute inset-0 rounded-xl"
              style={{ background: 'var(--accent-subtle)' }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />
          )}

          <motion.div
            whileHover={{ x: isCollapsed ? 0 : 3 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className={`relative flex items-center gap-3.5 px-3 py-2.5 rounded-xl cursor-pointer ${
              isCollapsed ? 'justify-center px-0 mx-auto w-10 h-10' : ''
            }`}
          >
            <div
              className="shrink-0"
              style={{
                color: isActive ? 'var(--accent)' : 'var(--text-muted)',
                transition: 'color 200ms ease',
              }}
            >
              <Icon size={18} strokeWidth={isActive ? 2.2 : 1.8} />
            </div>

            <AnimatePresence initial={false}>
              {!isCollapsed && (
                <motion.span
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                  className="text-[13px] tracking-tight whitespace-nowrap truncate"
                  style={{
                    fontWeight: isActive ? 600 : 400,
                    color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                    letterSpacing: '-0.01em',
                  }}
                >
                  {item.label}
                </motion.span>
              )}
            </AnimatePresence>

            {/* Accent dot indicator when expanded */}
            {isActive && !isCollapsed && (
              <motion.span
                layoutId="active-dot"
                className="ml-auto shrink-0 w-1.5 h-1.5 rounded-full"
                style={{ background: 'var(--accent)' }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
          </motion.div>
        </div>
      </Link>
    );

    if (isCollapsed) {
      return (
        <Tooltip key={item.to}>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent side="right" className="font-semibold text-xs py-1.5 px-3">
            {item.label}
          </TooltipContent>
        </Tooltip>
      );
    }

    return <div key={item.to}>{content}</div>;
  };

  return (
    <TooltipProvider delayDuration={100}>
      <motion.aside
        initial={false}
        animate={{ width: isCollapsed ? 72 : 248 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className={`fixed top-0 left-0 bottom-0 z-40 flex flex-col justify-between select-none ${className}`}
        style={{
          background: 'var(--acrylic-bg)',
          backdropFilter: 'saturate(180%) blur(40px)',
          WebkitBackdropFilter: 'saturate(180%) blur(40px)',
          boxShadow: '1px 0 0 0 var(--border-color)',
        }}
      >
        {/* Top: Brand + Nav */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Brand Header */}
          <div
            className="flex items-center h-16 px-4"
            style={{ borderBottom: '1px solid var(--border-color)' }}
          >
            <Link to="/dashboard" className="flex items-center gap-3 overflow-hidden group min-w-0">
              <motion.div
                whileHover={{ scale: 1.08, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                className="shrink-0"
                style={{ color: 'var(--accent)' }}
              >
                <CCMark size={32} />
              </motion.div>

              <AnimatePresence initial={false}>
                {!isCollapsed && (
                  <motion.div
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden whitespace-nowrap min-w-0"
                  >
                    <p
                      className="text-sm font-bold tracking-tight leading-none"
                      style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}
                    >
                      Code Circle
                    </p>
                    <p
                      className="text-[10px] font-semibold uppercase tracking-widest mt-0.5"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {isAdmin ? 'Admin Console' : 'Student Hub'}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </Link>
          </div>

          {/* Navigation */}
          <div
            className="flex-1 overflow-y-auto py-3"
            style={{ padding: isCollapsed ? '12px 10px' : '12px' }}
          >
            {/* Primary Links */}
            <div className="space-y-0.5">
              <AnimatePresence initial={false}>
                {!isCollapsed && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="px-3 text-[10px] font-semibold uppercase tracking-widest mb-2"
                    style={{ color: 'var(--text-muted)', letterSpacing: '0.1em' }}
                  >
                    Portal
                  </motion.p>
                )}
              </AnimatePresence>
              {primaryLinks.map(renderNavLink)}
            </div>

            {/* Admin Links */}
            {isAdmin && (
              <div className="mt-6 space-y-0.5">
                <div
                  className="my-3 mx-2"
                  style={{ height: '1px', background: 'var(--border-color)' }}
                />
                <AnimatePresence initial={false}>
                  {!isCollapsed && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="px-3 text-[10px] font-semibold uppercase tracking-widest mb-2"
                      style={{ color: 'var(--text-muted)', letterSpacing: '0.1em' }}
                    >
                      Management
                    </motion.p>
                  )}
                </AnimatePresence>
                {adminLinks.map(renderNavLink)}
              </div>
            )}
          </div>
        </div>

        {/* Bottom: Collapse Toggle */}
        <div
          className="p-3"
          style={{ borderTop: '1px solid var(--border-color)' }}
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onToggleCollapse}
                className={`w-full flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-colors duration-150 ${
                  isCollapsed ? 'justify-center' : 'justify-between'
                }`}
                style={{ color: 'var(--text-muted)' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)'; (e.currentTarget as HTMLButtonElement).style.background = 'var(--glass-bg)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)'; (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                <motion.div
                  animate={{ rotate: isCollapsed ? 180 : 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                >
                  <ChevronLeft size={16} strokeWidth={2} />
                </motion.div>
                <AnimatePresence initial={false}>
                  {!isCollapsed && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="flex items-center justify-between flex-1"
                    >
                      <span className="text-xs font-medium tracking-wide">Collapse</span>
                      <span
                        className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                        style={{ background: 'var(--glass-border)', color: 'var(--text-muted)' }}
                      >
                        ⌘B
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
            </TooltipTrigger>
            {isCollapsed && (
              <TooltipContent side="right" className="text-xs py-1.5 px-3">
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
