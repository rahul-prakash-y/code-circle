import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion';
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

const mockNotifications = [
  {
    id: 1,
    title: 'Nebula Hackathon Live!',
    message: 'The coding phase has officially started. Good luck!',
    time: '10m ago',
    type: 'info' as const,
    unread: true,
  },
  {
    id: 2,
    title: 'Achievement Unlocked',
    message: 'You earned the "Top Performer" badge for this term.',
    time: '2h ago',
    type: 'success' as const,
    unread: true,
  },
  {
    id: 3,
    title: 'System Notice',
    message: 'Evaluation round scoring finalized. Check your results.',
    time: '1d ago',
    type: 'warning' as const,
    unread: false,
  },
];

const notifIconMap = {
  info: { Icon: Info, color: 'var(--accent)' },
  success: { Icon: CheckCircle2, color: 'var(--success)' },
  warning: { Icon: AlertCircle, color: 'var(--warning)' },
};

const notifListVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.05 },
  },
};
const notifItemVariants = {
  hidden: { opacity: 0, x: 12 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] } },
};

export const Header: React.FC<HeaderProps> = ({ onOpenMobileMenu, className = '' }) => {
  const { user, logout } = useAuthStore();
  const { profile } = useProfileStore();
  const navigate = useNavigate();

  const [showNotifications, setShowNotifications] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [notifications, setNotifications] = useState(mockNotifications);
  const notificationRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const unreadCount = notifications.filter((n) => n.unread).length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ⌘K shortcut to focus search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      logout();
      toast.success('Logged out successfully');
      navigate('/login');
    } catch {
      toast.error('Logout failed');
    }
  };

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  const displayName = profile?.name || user?.name || 'User';
  const displayRole = profile?.role || user?.role || 'Member';
  const initial = displayName.charAt(0).toUpperCase();

  const roleColors: Record<string, string> = {
    SuperAdmin: '#f59e0b',
    Admin: 'var(--accent)',
    Faculty: '#34d399',
    Committee: '#60a5fa',
    Student: 'var(--text-muted)',
  };
  const roleColor = roleColors[displayRole] || 'var(--text-muted)';

  return (
    <header
      className={`sticky top-0 z-30 w-full h-16 px-4 sm:px-6 flex items-center justify-between ${className}`}
      style={{
        background: 'var(--acrylic-bg)',
        backdropFilter: 'saturate(180%) blur(40px)',
        WebkitBackdropFilter: 'saturate(180%) blur(40px)',
        boxShadow: '0 1px 0 var(--border-color)',
      }}
    >
      {/* Left: Mobile toggle + Search */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-xl cursor-pointer transition-colors duration-150"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)')}
          onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)')}
          aria-label="Open menu"
        >
          <Menu size={20} strokeWidth={1.8} />
        </button>

        {/* Expanding Search */}
        <motion.div
          animate={{ width: searchFocused ? 280 : 200 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="hidden sm:flex items-center gap-2.5 px-3.5 py-2 rounded-xl overflow-hidden"
          style={{
            background: searchFocused ? 'var(--glass-bg-elevated)' : 'var(--glass-bg)',
            border: `1px solid ${searchFocused ? 'var(--accent)' : 'var(--border-color)'}`,
            boxShadow: searchFocused ? '0 0 0 3px var(--accent-subtle)' : 'none',
            transition: 'border-color 200ms ease, box-shadow 200ms ease, background 200ms ease',
          }}
        >
          <Search
            size={14}
            strokeWidth={2}
            style={{
              color: searchFocused ? 'var(--accent)' : 'var(--text-muted)',
              flexShrink: 0,
              transition: 'color 200ms ease',
            }}
          />
          <input
            ref={searchRef}
            type="text"
            placeholder="Search portal..."
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            className="bg-transparent border-none text-sm focus:outline-none w-full"
            style={{ color: 'var(--text-primary)' }}
          />
          <AnimatePresence>
            {!searchFocused && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.15 }}
                className="hidden md:inline-flex items-center text-[10px] font-mono px-1.5 py-0.5 rounded shrink-0"
                style={{
                  background: 'var(--glass-border)',
                  color: 'var(--text-muted)',
                  border: '1px solid var(--border-color)',
                }}
              >
                ⌘K
              </motion.span>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Right: Theme, Notifications, Avatar */}
      <div className="flex items-center gap-2">
        <ThemeToggle />

        {/* Notifications */}
        <div className="relative" ref={notificationRef}>
          <motion.button
            whileTap={{ scale: 0.94 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2.5 rounded-xl cursor-pointer"
            style={{
              background: showNotifications ? 'var(--accent-subtle)' : 'transparent',
              color: showNotifications ? 'var(--accent)' : 'var(--text-muted)',
              transition: 'background 200ms ease, color 200ms ease',
            }}
            onMouseEnter={(e) => {
              if (!showNotifications) (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)';
            }}
            onMouseLeave={(e) => {
              if (!showNotifications) (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)';
            }}
            aria-label="Notifications"
          >
            <Bell size={18} strokeWidth={1.8} />
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute top-2 right-2 w-2 h-2 rounded-full ring-2"
                style={{
                  background: 'var(--accent)',
                  ringColor: 'var(--surface)',
                }}
              />
            )}
          </motion.button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.96 }}
                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className="absolute top-12 right-0 w-80 z-50 rounded-2xl overflow-hidden"
                style={{
                  background: 'var(--glass-bg-elevated)',
                  backdropFilter: 'blur(24px)',
                  WebkitBackdropFilter: 'blur(24px)',
                  border: '1px solid var(--border-color)',
                  boxShadow: 'var(--shadow-deep-val)',
                }}
              >
                {/* Header */}
                <div
                  className="flex items-center justify-between px-4 py-3"
                  style={{ borderBottom: '1px solid var(--border-color)' }}
                >
                  <div className="flex items-center gap-2">
                    <h3
                      className="text-xs font-semibold uppercase tracking-wider"
                      style={{ color: 'var(--text-muted)', letterSpacing: '0.08em' }}
                    >
                      Notifications
                    </h3>
                    {unreadCount > 0 && (
                      <span
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                        style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}
                      >
                        {unreadCount}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={markAllRead}
                    className="text-[11px] font-semibold cursor-pointer transition-colors duration-150"
                    style={{ color: 'var(--accent)' }}
                  >
                    Mark all read
                  </button>
                </div>

                {/* Notification list — staggered entry */}
                <motion.div
                  variants={notifListVariants}
                  initial="hidden"
                  animate="visible"
                  className="max-h-72 overflow-y-auto"
                >
                  {notifications.map((notif) => {
                    const { Icon, color } = notifIconMap[notif.type];
                    return (
                      <motion.div
                        key={notif.id}
                        variants={notifItemVariants}
                        className="flex gap-3 px-4 py-3.5 cursor-pointer transition-colors duration-150"
                        style={{
                          background: notif.unread ? 'var(--accent-subtle)' : 'transparent',
                          borderBottom: '1px solid var(--border-color)',
                        }}
                        onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.background = 'var(--glass-bg)')}
                        onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.background = notif.unread ? 'var(--accent-subtle)' : 'transparent')}
                      >
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                          style={{ background: `${color}15`, color }}
                        >
                          <Icon size={14} strokeWidth={2} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p
                              className="text-[13px] leading-snug"
                              style={{
                                fontWeight: notif.unread ? 600 : 400,
                                color: 'var(--text-primary)',
                              }}
                            >
                              {notif.title}
                            </p>
                            {notif.unread && (
                              <span
                                className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5"
                                style={{ background: 'var(--accent)' }}
                              />
                            )}
                          </div>
                          <p
                            className="text-[12px] leading-relaxed mt-0.5 line-clamp-2"
                            style={{ color: 'var(--text-muted)' }}
                          >
                            {notif.message}
                          </p>
                          <p
                            className="text-[10px] font-mono mt-1.5"
                            style={{ color: 'var(--text-muted)' }}
                          >
                            {notif.time}
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

        {/* User Dropdown */}
        {user || profile ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl cursor-pointer focus:outline-none"
                style={{
                  background: 'var(--glass-bg)',
                  border: '1px solid var(--border-color)',
                  transition: 'border-color 200ms ease, background 200ms ease',
                }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-hover)')}
                onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-color)')}
              >
                <Avatar className="w-7 h-7 rounded-lg">
                  {profile?.profilePicUrl ? (
                    <AvatarImage src={profile.profilePicUrl} alt={displayName} className="object-cover" />
                  ) : null}
                  <AvatarFallback
                    className="rounded-lg text-[11px] font-bold"
                    style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}
                  >
                    {initial}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden sm:block text-left">
                  <p
                    className="text-[13px] font-semibold leading-none max-w-[100px] truncate"
                    style={{ color: 'var(--text-primary)', letterSpacing: '-0.01em' }}
                  >
                    {displayName}
                  </p>
                  <p
                    className="text-[10px] font-semibold mt-0.5"
                    style={{ color: roleColor }}
                  >
                    {displayRole}
                  </p>
                </div>
                <ChevronDown size={13} strokeWidth={2} style={{ color: 'var(--text-muted)' }} />
              </motion.button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              className="w-56 p-1.5 rounded-2xl border shadow-2xl"
              style={{
                background: 'var(--glass-bg-elevated)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                borderColor: 'var(--border-color)',
                boxShadow: 'var(--shadow-deep-val)',
              }}
            >
              <DropdownMenuLabel className="p-3 pb-2">
                <div className="flex items-center gap-2.5">
                  <Avatar className="w-9 h-9 rounded-xl">
                    {profile?.profilePicUrl ? (
                      <AvatarImage src={profile.profilePicUrl} alt={displayName} />
                    ) : null}
                    <AvatarFallback
                      className="rounded-xl font-bold text-xs"
                      style={{ background: 'var(--accent)', color: '#fff' }}
                    >
                      {initial}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p
                      className="text-[13px] font-semibold truncate"
                      style={{ color: 'var(--text-primary)', letterSpacing: '-0.01em' }}
                    >
                      {displayName}
                    </p>
                    <p
                      className="text-[11px] truncate mt-0.5"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {user?.email || profile?.email || ''}
                    </p>
                    <span
                      className="inline-block text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md mt-1.5"
                      style={{
                        background: `${roleColor}18`,
                        color: roleColor,
                        border: `1px solid ${roleColor}30`,
                      }}
                    >
                      {displayRole}
                    </span>
                  </div>
                </div>
              </DropdownMenuLabel>

              <DropdownMenuSeparator style={{ background: 'var(--border-color)' }} className="my-1" />

              <DropdownMenuGroup>
                <DropdownMenuItem
                  onClick={() => navigate('/profile')}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] cursor-pointer"
                  style={{ color: 'var(--text-primary)' }}
                >
                  <UserIcon size={15} strokeWidth={1.8} style={{ color: 'var(--accent)' }} />
                  <span>Profile Overview</span>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => navigate('/dashboard?tab=passport')}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] cursor-pointer"
                  style={{ color: 'var(--text-primary)' }}
                >
                  <Ticket size={15} strokeWidth={1.8} style={{ color: '#a78bfa' }} />
                  <span>My Registrations</span>
                </DropdownMenuItem>

                {(displayRole === 'SuperAdmin' || displayRole === 'Admin') && (
                  <DropdownMenuItem
                    onClick={() => navigate('/users')}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] cursor-pointer"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    <Shield size={15} strokeWidth={1.8} style={{ color: '#34d399' }} />
                    <span>User Management</span>
                  </DropdownMenuItem>
                )}
              </DropdownMenuGroup>

              <DropdownMenuSeparator style={{ background: 'var(--border-color)' }} className="my-1" />

              <DropdownMenuItem
                onClick={handleLogout}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium cursor-pointer"
                style={{ color: 'var(--destructive)' }}
              >
                <LogOut size={15} strokeWidth={1.8} />
                <span>Sign Out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Link to="/login" className="btn-primary py-2 px-4 text-xs font-bold rounded-xl">
            Sign In
          </Link>
        )}
      </div>
    </header>
  );
};

export default Header;
