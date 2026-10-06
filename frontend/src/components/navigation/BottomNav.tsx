import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Calendar,
  Award,
  Trophy,
  Newspaper,
} from 'lucide-react';

/**
 * iOS-style Bottom Navigation Bar — shown only on mobile (< md).
 * Uses backdrop-blur glassmorphism per Apple HIG.
 * Touch targets are min 44×44 px per iOS/WCAG guidelines.
 */

interface BottomNavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  match: (pathname: string) => boolean;
}

const NAV_ITEMS: BottomNavItem[] = [
  {
    to: '/dashboard',
    label: 'Home',
    icon: LayoutDashboard,
    match: (p) => p === '/dashboard' || p === '/',
  },
  {
    to: '/events',
    label: 'Events',
    icon: Calendar,
    match: (p) => p === '/events',
  },
  {
    to: '/assessments',
    label: 'Learn',
    icon: Award,
    match: (p) => p === '/assessments',
  },
  {
    to: '/leaderboard',
    label: 'Rankings',
    icon: Trophy,
    match: (p) => p === '/leaderboard',
  },
  {
    to: '/news',
    label: 'News',
    icon: Newspaper,
    match: (p) => p === '/news',
  },
];

const EASE = { duration: 0.2, ease: [0.16, 1, 0.3, 1] } as const;

export const BottomNav: React.FC = () => {
  const { pathname } = useLocation();

  return (
    <nav
      aria-label="Bottom navigation"
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
      style={{
        background: 'var(--glass-bg)',
        backdropFilter: 'saturate(180%) blur(24px)',
        WebkitBackdropFilter: 'saturate(180%) blur(24px)',
        borderTop: '1px solid var(--separator)',
        /* Safe area inset for notch/home-indicator devices */
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <div className="flex items-stretch justify-around px-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = item.match(pathname);

          return (
            <Link
              key={item.to}
              to={item.to}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
              className="relative flex flex-col items-center justify-center flex-1 py-2 gap-[3px]"
              style={{ minHeight: 56, minWidth: 44 }}
            >
              {/* Active indicator pill */}
              {isActive && (
                <motion.div
                  layoutId="bottom-nav-active"
                  className="absolute top-1.5 w-10 h-[3px] rounded-full"
                  style={{ background: 'var(--accent)' }}
                  transition={EASE}
                />
              )}

              {/* Icon with tap feedback — no whileHover to prevent sticky states */}
              <motion.div
                whileTap={{ scale: 0.88 }}
                transition={{ duration: 0.12 }}
                className="flex items-center justify-center w-7 h-7"
                style={{ color: isActive ? 'var(--accent)' : 'var(--label-tertiary)' }}
              >
                <Icon size={22} strokeWidth={isActive ? 2 : 1.6} />
              </motion.div>

              <span
                className="text-[10px] leading-none tracking-tight font-medium"
                style={{
                  color: isActive ? 'var(--accent)' : 'var(--label-tertiary)',
                  fontWeight: isActive ? 600 : 400,
                }}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
