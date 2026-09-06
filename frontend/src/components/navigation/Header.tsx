import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Bell,
  Menu,
  LogOut,
  User as UserIcon,
  Shield,
  ChevronDown,
  Ticket,
  X,
  CheckCircle2,
  AlertCircle,
  Info,
} from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';
import useProfileStore from '../../store/useProfileStore';
import ThemeToggle from '../ui/ThemeToggle';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { auth } from '../../lib/firebase';
import toast from 'react-hot-toast';

interface HeaderProps {
  onOpenMobileMenu?: () => void;
  className?: string;
}

const SPRING = { type: 'spring', stiffness: 260, damping: 30 } as const;

const mockNotifications = [
  {
    id: 1,
    title: 'Nebula Hackathon Live',
    message: 'The coding phase has started. Good luck!',
    time: '10m ago',
    type: 'info' as const,
    unread: true,
  },
  {
    id: 2,
    title: 'Achievement Unlocked',
    message: 'You earned the "Top Performer" badge.',
    time: '2h ago',
    type: 'success' as const,
    unread: true,
  },
  {
    id: 3,
    title: 'Evaluation Complete',
    message: 'Round scoring has been finalized.',
    time: '1d ago',
    type: 'warning' as const,
    unread: false,
  },
];

const notifIcons = {
  info: { Icon: Info, color: 'var(--accent)' },
  success: { Icon: CheckCircle2, color: 'var(--success)' },
  warning: { Icon: AlertCircle, color: 'var(--warning)' },
};

const roleColors: Record<string, string> = {
  SuperAdmin: '#FF9F0A',
  Admin: 'var(--accent)',
  Faculty: '#34C759',
  Committee: '#30B0C7',     /* Apple System Teal */
  Student: 'var(--label-secondary)',
};

export const Header: React.FC<HeaderProps> = ({ onOpenMobileMenu, className = '' }) => {
  const { user, logout } = useAuthStore();
  const { profile } = useProfileStore();
  const navigate = useNavigate();

  const [showNotifications, setShowNotifications] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [notifications, setNotifications] = useState(mockNotifications);
  const notifRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const unread = notifications.filter((n) => n.unread).length;

  // Close notif panel on outside click
  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  // ⌘K to focus search
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    document.addEventListener('keydown', fn);
    return () => document.removeEventListener('keydown', fn);
  }, []);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      logout();
      toast.success('Signed out');
      navigate('/login');
    } catch {
      toast.error('Sign out failed');
    }
  };

  const displayName = profile?.name || user?.name || 'User';
  const displayRole = profile?.role || user?.role || 'Member';
  const initial = displayName.charAt(0).toUpperCase();
  const roleColor = roleColors[displayRole] || 'var(--label-secondary)';

  return (
    <header
      className={`sticky top-0 z-30 w-full h-[60px] flex items-center px-5 justify-between ${className}`}
      style={{
        background: 'var(--glass-bg)',
        backdropFilter: 'saturate(180%) blur(24px)',
        WebkitBackdropFilter: 'saturate(180%) blur(24px)',
        boxShadow: '0 1px 0 var(--separator)',
      }}
    >
      {/* Left */}
      <div className="flex items-center gap-3">
        {/* Mobile hamburger */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          transition={SPRING}
          onClick={onOpenMobileMenu}
          className="lg:hidden btn-ghost p-2 rounded-xl"
          aria-label="Open menu"
        >
          <Menu size={20} strokeWidth={1.75} style={{ color: 'var(--label-secondary)' }} />
        </motion.button>

        {/* Search — expands on focus */}
        <motion.div
          animate={{ width: searchFocused ? 260 : 180 }}
          transition={SPRING}
          className="hidden sm:flex items-center gap-2.5 rounded-xl px-3.5 py-2 overflow-hidden"
          style={{
            background: searchFocused ? 'var(--surface)' : 'var(--separator)',
            boxShadow: searchFocused ? '0 0 0 3px var(--accent-ring)' : 'none',
            transition: 'background 200ms ease, box-shadow 200ms ease',
          }}
        >
          <Search
            size={14}
            strokeWidth={2}
            style={{
              color: searchFocused ? 'var(--accent)' : 'var(--label-tertiary)',
              flexShrink: 0,
              transition: 'color 200ms ease',
            }}
          />
          <input
            ref={searchRef}
            type="text"
            placeholder="Search…"
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            className="bg-transparent border-none text-[14px] focus:outline-none w-full"
            style={{ color: 'var(--label-primary)', fontFamily: 'var(--font-sans)' }}
          />
          <AnimatePresence>
            {!searchFocused && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.12 }}
                className="hidden md:flex text-[10px] font-mono shrink-0 px-1.5 py-0.5 rounded-md"
                style={{ background: 'var(--surface)', color: 'var(--label-tertiary)' }}
              >
                ⌘K
              </motion.span>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        <ThemeToggle />

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.94 }}
            transition={SPRING}
            onClick={() => setShowNotifications((v) => !v)}
            className="relative p-2.5 rounded-xl cursor-pointer"
            style={{
              background: showNotifications ? 'var(--accent-subtle)' : 'transparent',
              color: showNotifications ? 'var(--accent)' : 'var(--label-secondary)',
              transition: 'background 200ms ease, color 200ms ease',
            }}
            aria-label="Notifications"
          >
            <Bell size={18} strokeWidth={1.75} />
            {unread > 0 && (
              <span
                className="absolute top-2 right-2 w-[7px] h-[7px] rounded-full"
                style={{ background: 'var(--accent)' }}
              />
            )}
          </motion.button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.97 }}
                transition={SPRING}
                className="absolute top-[calc(100%+8px)] right-0 w-[340px] z-50 rounded-2xl overflow-hidden"
                style={{
                  background: 'var(--surface)',
                  boxShadow: 'var(--shadow-xl)',
                  border: '1px solid var(--separator)',
                }}
              >
                {/* Notif header */}
                <div
                  className="flex items-center justify-between px-5 py-4"
                  style={{ borderBottom: '1px solid var(--separator)' }}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="text-[13px] font-semibold"
                      style={{ color: 'var(--label-primary)', letterSpacing: '-0.01em' }}
                    >
                      Notifications
                    </span>
                    {unread > 0 && (
                      <span
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                        style={{ background: 'var(--accent)', color: '#fff' }}
                      >
                        {unread}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => setNotifications((p) => p.map((n) => ({ ...n, unread: false })))}
                    className="text-[13px] font-medium cursor-pointer"
                    style={{ color: 'var(--accent)' }}
                  >
                    Mark all read
                  </button>
                </div>

                {/* Notif list — staggered */}
                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={{
                    hidden: {},
                    visible: { transition: { staggerChildren: 0.05 } },
                  }}
                  className="divide-y"
                  style={{ borderColor: 'var(--separator)' }}
                >
                  {notifications.map((n) => {
                    const { Icon, color } = notifIcons[n.type];
                    return (
                      <motion.div
                        key={n.id}
                        variants={{
                          hidden: { opacity: 0, x: 10 },
                          visible: { opacity: 1, x: 0, transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] } },
                        }}
                        className="flex gap-3.5 px-5 py-4 cursor-pointer transition-colors duration-150"
                        style={{
                          background: n.unread ? 'var(--accent-subtle)' : 'transparent',
                          borderColor: 'var(--separator)',
                        }}
                        onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.background = 'var(--canvas)')}
                        onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.background = n.unread ? 'var(--accent-subtle)' : 'transparent')}
                      >
                        <div
                          className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                          style={{ background: `${color}18`, color }}
                        >
                          <Icon size={14} strokeWidth={2} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p
                              className="text-[13px] leading-tight"
                              style={{ fontWeight: n.unread ? 600 : 400, color: 'var(--label-primary)' }}
                            >
                              {n.title}
                            </p>
                            {n.unread && (
                              <span
                                className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5"
                                style={{ background: 'var(--accent)' }}
                              />
                            )}
                          </div>
                          <p
                            className="text-[12px] leading-relaxed mt-0.5 line-clamp-2"
                            style={{ color: 'var(--label-secondary)' }}
                          >
                            {n.message}
                          </p>
                          <p
                            className="text-[11px] mt-1.5 font-mono"
                            style={{ color: 'var(--label-tertiary)' }}
                          >
                            {n.time}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Avatar / Dropdown */}
        {user || profile ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                transition={SPRING}
                className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-full cursor-pointer outline-none"
                style={{
                  background: 'var(--separator)',
                  transition: 'background 200ms ease',
                }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = 'var(--separator-opaque)')}
                onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = 'var(--separator)')}
              >
                <Avatar className="w-7 h-7 rounded-full">
                  {profile?.profilePicUrl && (
                    <AvatarImage src={profile.profilePicUrl} alt={displayName} className="object-cover" />
                  )}
                  <AvatarFallback
                    className="rounded-full text-[11px] font-bold"
                    style={{ background: 'var(--accent)', color: '#fff' }}
                  >
                    {initial}
                  </AvatarFallback>
                </Avatar>
                <span
                  className="hidden sm:block text-[13px] font-medium tracking-tight max-w-[100px] truncate"
                  style={{ color: 'var(--label-primary)', letterSpacing: '-0.01em' }}
                >
                  {displayName.split(' ')[0]}
                </span>
                <ChevronDown size={12} strokeWidth={2} style={{ color: 'var(--label-tertiary)' }} />
              </motion.button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              className="w-56 p-1.5 rounded-2xl"
              style={{
                background: 'var(--surface)',
                boxShadow: 'var(--shadow-xl)',
                border: '1px solid var(--separator)',
              }}
            >
              {/* User info */}
              <div className="px-3 py-3 mb-1">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10 rounded-full">
                    {profile?.profilePicUrl && (
                      <AvatarImage src={profile.profilePicUrl} alt={displayName} />
                    )}
                    <AvatarFallback
                      className="rounded-full font-bold text-sm"
                      style={{ background: 'var(--accent)', color: '#fff' }}
                    >
                      {initial}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p
                      className="text-[14px] font-semibold tracking-tight truncate"
                      style={{ color: 'var(--label-primary)', letterSpacing: '-0.01em' }}
                    >
                      {displayName}
                    </p>
                    <p
                      className="text-[11px] truncate"
                      style={{ color: 'var(--label-secondary)' }}
                    >
                      {user?.email || profile?.email || ''}
                    </p>
                    <span
                      className="tag mt-1.5"
                      style={{
                        background: `${roleColor}18`,
                        color: roleColor,
                        fontSize: '10px',
                      }}
                    >
                      {displayRole}
                    </span>
                  </div>
                </div>
              </div>

              <div className="sep mx-1 mb-1" />

              <DropdownMenuGroup>
                <DropdownMenuItem
                  onClick={() => navigate('/profile')}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] cursor-pointer"
                  style={{ color: 'var(--label-primary)' }}
                >
                  <UserIcon size={15} strokeWidth={1.75} style={{ color: 'var(--accent)' }} />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => navigate('/dashboard?tab=passport')}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] cursor-pointer"
                  style={{ color: 'var(--label-primary)' }}
                >
                  <Ticket size={15} strokeWidth={1.75} style={{ color: 'var(--label-secondary)' }} />
                  My Registrations
                </DropdownMenuItem>
                {(displayRole === 'SuperAdmin' || displayRole === 'Admin') && (
                  <DropdownMenuItem
                    onClick={() => navigate('/users')}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] cursor-pointer"
                    style={{ color: 'var(--label-primary)' }}
                  >
                    <Shield size={15} strokeWidth={1.75} style={{ color: 'var(--success)' }} />
                    User Management
                  </DropdownMenuItem>
                )}
              </DropdownMenuGroup>

              <div className="sep mx-1 my-1" />

              <DropdownMenuItem
                onClick={handleLogout}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] cursor-pointer font-medium"
                style={{ color: 'var(--destructive)' }}
              >
                <LogOut size={15} strokeWidth={1.75} />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Link to="/login" className="btn-primary text-sm px-5 py-2">
            Sign In
          </Link>
        )}
      </div>
    </header>
  );
};

export default Header;
