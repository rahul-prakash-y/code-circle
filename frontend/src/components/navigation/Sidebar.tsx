import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  Award, 
  MessageSquare, 
  Newspaper, 
  Users, 
  Shield, 
  CalendarCheck, 
  ChevronLeft, 
  ChevronRight, 
  Hexagon,
  Sparkles,
  BarChart3
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
  icon: React.ComponentType<{ size?: number; className?: string }>;
  accentColor?: string;
  match: (loc: { pathname: string; search: string }) => boolean;
}

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
      <Link
        to={item.to}
        className="block w-full focus:outline-none"
      >
        <motion.div
          whileHover={{ x: isCollapsed ? 0 : 4 }}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className={`relative flex items-center gap-3.5 px-3.5 py-3 rounded-xl transition-colors duration-200 cursor-pointer ${
            isActive
              ? 'bg-accent/15 text-accent dark:text-accent-muted border-l-4 border-accent font-bold shadow-sm shadow-accent/5'
              : 'text-text-muted hover:text-text-primary hover:bg-surface-elevated/70 font-medium border-l-4 border-transparent'
          } ${isCollapsed ? 'justify-center px-0' : ''}`}
        >
          <div className={`shrink-0 transition-transform duration-200 ${isActive ? 'scale-110 text-accent' : 'text-text-muted'}`}>
            <Icon size={20} />
          </div>

          {!isCollapsed && (
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="text-xs tracking-wide whitespace-nowrap truncate font-heading"
            >
              {item.label}
            </motion.span>
          )}

          {isActive && !isCollapsed && (
            <motion.span
              layoutId="active-indicator"
              className="ml-auto w-1.5 h-1.5 rounded-full bg-accent"
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />
          )}
        </motion.div>
      </Link>
    );

    if (isCollapsed) {
      return (
        <Tooltip key={item.to}>
          <TooltipTrigger asChild>
            {content}
          </TooltipTrigger>
          <TooltipContent side="right" className="font-semibold text-xs py-1.5 px-3">
            {item.label}
          </TooltipContent>
        </Tooltip>
      );
    }

    return <div key={item.to}>{content}</div>;
  };

  return (
    <TooltipProvider delayDuration={150}>
      <motion.aside
        initial={false}
        animate={{ width: isCollapsed ? 76 : 256 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className={`fixed top-0 left-0 bottom-0 z-40 flex flex-col justify-between 
          glass-nav border-r border-border bg-surface/90 backdrop-blur-xl select-none ${className}`}
      >
        {/* Top brand header */}
        <div className="flex flex-col">
          <div className="h-16 flex items-center justify-between px-4 border-b border-border/60">
            <Link to="/dashboard" className="flex items-center gap-3 overflow-hidden group">
              <div className="w-9 h-9 shrink-0 bg-accent/10 border border-accent/25 rounded-xl flex items-center justify-center text-accent group-hover:scale-105 group-hover:border-accent/50 transition-all duration-300">
                <Hexagon className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
              </div>
              {!isCollapsed && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden whitespace-nowrap"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-extrabold tracking-tight text-text-primary font-heading">
                      Code Circle
                    </span>
                    <Sparkles size={11} className="text-accent" />
                  </div>
                  <p className="text-[9px] font-bold text-accent uppercase tracking-[0.2em] -mt-0.5">
                    {isAdmin ? 'Admin Console' : 'Student Hub'}
                  </p>
                </motion.div>
              )}
            </Link>
          </div>

          {/* Nav List */}
          <div className="p-3 space-y-6 overflow-y-auto max-h-[calc(100vh-140px)] custom-scrollbar">
            {/* Main Portal Section */}
            <div className="space-y-1">
              {!isCollapsed && (
                <p className="px-3 text-[10px] font-extrabold uppercase tracking-widest text-text-muted/70 mb-2">
                  Portal
                </p>
              )}
              {primaryLinks.map(renderNavLink)}
            </div>

            {/* Admin Management Section */}
            {isAdmin && (
              <div className="space-y-1 pt-2 border-t border-border/60">
                {!isCollapsed && (
                  <p className="px-3 text-[10px] font-extrabold uppercase tracking-widest text-text-muted/70 mb-2">
                    Management
                  </p>
                )}
                {adminLinks.map(renderNavLink)}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Collapse Toggle */}
        <div className="p-3 border-t border-border/60 bg-surface/40">
          <button
            onClick={onToggleCollapse}
            className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-text-muted hover:text-text-primary hover:bg-surface-elevated transition-all duration-200 cursor-pointer ${
              isCollapsed ? 'justify-center' : 'justify-between'
            }`}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ rotate: isCollapsed ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                className="w-5 h-5 flex items-center justify-center"
              >
                <ChevronLeft size={18} />
              </motion.div>
              {!isCollapsed && (
                <span className="text-xs font-semibold tracking-wide">
                  Collapse Sidebar
                </span>
              )}
            </div>
            {!isCollapsed && (
              <span className="text-[10px] font-mono text-text-muted/60 uppercase">
                Tab
              </span>
            )}
          </button>
        </div>
      </motion.aside>
    </TooltipProvider>
  );
};

export default Sidebar;
