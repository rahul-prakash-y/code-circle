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
  AlertTriangle,
  Info,
  Plus,
  Trash2,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import useAuthStore from '../../store/useAuthStore';
import useProfileStore from '../../store/useProfileStore';
import useNotificationStore from '../../store/useNotificationStore';
import CreateNotificationModal from '../notifications/CreateNotificationModal';
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

const EASE_TRANSITION = { duration: 0.18, ease: [0.16, 1, 0.3, 1] } as const;

const notifIcons = {
  info: { Icon: Info, color: 'var(--accent)' },
  success: { Icon: CheckCircle2, color: 'var(--success)' },
  warning: { Icon: AlertTriangle, color: 'var(--warning)' },
  urgent: { Icon: AlertCircle, color: '#FF3B30' },
};

const getTimeAgo = (dateStr?: string) => {
  if (!dateStr) return 'Recently';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'Recently';
    return formatDistanceToNow(d, { addSuffix: true });
  } catch {
    return 'Recently';
  }
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

  const {
    notifications,
    unreadCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotificationStore();

  const [showNotifications, setShowNotifications] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const isAdmin =
    profile?.role === 'Admin' ||
    profile?.role === 'SuperAdmin' ||
    user?.role === 'Admin' ||
    user?.role === 'SuperAdmin';

  const unread = unreadCount;

  // Fetch live notifications on mount and when dropdown opens
  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user, fetchNotifications]);

  useEffect(() => {
    if (showNotifications && user) {
      fetchNotifications();
    }
  }, [showNotifications, user, fetchNotifications]);

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
  const roleColor = roleColors[displayRole] || 'var(--label-secondary)';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <header
      className={`sticky top-0 z-30 w-full h-[56px] flex items-center px-6 justify-between ${className}`}
      style={{
        background: 'var(--glass-bg)',
        backdropFilter: 'saturate(180%) blur(20px)',
        WebkitBackdropFilter: 'saturate(180%) blur(20px)',
        borderBottom: '1px solid var(--separator)',
        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.02)',
      }}
    >
      {/* Left */}
      <div className="flex items-center gap-3">
        {/* Mobile hamburger */}
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-xl text-label-secondary hover:text-label-primary hover:bg-separator transition-colors"
          aria-label="Open menu"
        >
          <Menu size={18} strokeWidth={1.75} />
        </button>

        {/* Search — expands smoothly on focus */}
        <div
          className="hidden sm:flex items-center gap-2 rounded-xl px-3 py-1.5 overflow-hidden transition-all duration-200"
          style={{
            width: searchFocused ? 260 : 190,
            background: searchFocused ? 'var(--surface)' : 'var(--canvas)',
            boxShadow: searchFocused ? '0 0 0 2px var(--accent-ring)' : 'none',
            border: searchFocused ? '1px solid var(--accent)' : '1px solid var(--separator)',
          }}
        >
          <Search
            size={13.5}
            strokeWidth={2}
            style={{
              color: searchFocused ? 'var(--accent)' : 'var(--label-secondary)',
              flexShrink: 0,
            }}
          />
          <input
            ref={searchRef}
            type="text"
            placeholder="Search…"
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            className="bg-transparent border-none text-[13px] focus:outline-none w-full"
            style={{ color: 'var(--label-primary)', fontFamily: 'var(--font-sans)' }}
          />
          <AnimatePresence>
            {!searchFocused && (
              <span
                className="hidden md:flex text-[10px] font-mono shrink-0 px-1.5 py-0.5 rounded-md text-label-secondary bg-surface border border-separator/80 font-medium"
              >
                ⌘K
              </span>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        <ThemeToggle />

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications((v) => !v)}
            className="relative p-2 rounded-xl cursor-pointer text-label-secondary hover:text-label-primary hover:bg-separator transition-colors"
            style={{
              background: showNotifications ? 'var(--accent-subtle)' : 'transparent',
              color: showNotifications ? 'var(--accent)' : undefined,
            }}
            aria-label="Notifications"
          >
            <Bell size={17} strokeWidth={1.75} />
            {unread > 0 && (
              <span
                className="absolute top-1.5 right-1.5 w-[6px] h-[6px] rounded-full"
                style={{ background: 'var(--accent)' }}
              />
            )}
          </button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={EASE_TRANSITION}
                className="absolute top-[calc(100%+8px)] right-0 w-[340px] z-50 rounded-2xl overflow-hidden"
                style={{
                  background: 'var(--surface)',
                  boxShadow: 'var(--shadow-xl)',
                  border: '1px solid var(--separator)',
                }}
              >
                {/* Notif header */}
                <div
                  className="flex items-center justify-between px-5 py-3.5"
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
                  <div className="flex items-center gap-2">
                    {unread > 0 && (
                      <button
                        onClick={() => markAllAsRead()}
                        className="text-[12px] font-medium cursor-pointer hover:underline"
                        style={{ color: 'var(--accent)' }}
                      >
                        Mark all read
                      </button>
                    )}
                    {isAdmin && (
                      <button
                        onClick={() => {
                          setShowNotifications(false);
                          setIsBroadcastModalOpen(true);
                        }}
                        className="px-2 py-1 rounded-lg text-[11px] font-semibold bg-accent text-white flex items-center gap-1 hover:opacity-90 transition-opacity cursor-pointer shadow-sm"
                        title="Broadcast new announcement"
                      >
                        <Plus size={12} strokeWidth={2.5} />
                        <span>Broadcast</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Notif list — staggered */}
                {notifications.length === 0 ? (
                  <div className="py-10 px-5 text-center flex flex-col items-center justify-center">
                    <Bell size={24} className="text-label-tertiary mb-2 opacity-50" />
                    <p className="text-[13px] font-medium text-label-secondary">
                      No notifications yet
                    </p>
                    <p className="text-[11px] text-label-tertiary mt-0.5">
                      Club announcements and updates will appear here.
                    </p>
                  </div>
                ) : (
                  <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={{
                      hidden: {},
                      visible: { transition: { staggerChildren: 0.05 } },
                    }}
                    className="divide-y max-h-[360px] overflow-y-auto"
                    style={{ borderColor: 'var(--separator)' }}
                  >
                    {notifications.map((n) => {
                      const notifConf = notifIcons[n.type] || notifIcons.info;
                      const Icon = notifConf.Icon;
                      const color = notifConf.color;
                      const notifId = n.id || n._id;

                      return (
                        <motion.div
                          key={notifId}
                          variants={{
                            hidden: { opacity: 0, x: 10 },
                            visible: { opacity: 1, x: 0, transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] } },
                          }}
                          onClick={() => {
                            if (n.unread) markAsRead(notifId);
                            if (n.link) {
                              setShowNotifications(false);
                              navigate(n.link);
                            }
                          }}
                          className="group/item flex gap-3 px-4 py-3.5 cursor-pointer transition-colors duration-150 relative"
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
                            <div className="flex items-start justify-between gap-1.5">
                              <p
                                className="text-[13px] leading-tight line-clamp-1"
                                style={{ fontWeight: n.unread ? 600 : 400, color: 'var(--label-primary)' }}
                              >
                                {n.title}
                              </p>
                              <div className="flex items-center gap-1.5 shrink-0">
                                {n.unread && (
                                  <span
                                    className="w-2 h-2 rounded-full shrink-0"
                                    style={{ background: 'var(--accent)' }}
                                  />
                                )}
                                {isAdmin && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deleteNotification(notifId);
                                    }}
                                    className="opacity-0 group-hover/item:opacity-100 p-0.5 text-label-tertiary hover:text-red-500 rounded transition-all cursor-pointer"
                                    title="Delete notification"
                                  >
                                    <Trash2 size={12} strokeWidth={2} />
                                  </button>
                                )}
                              </div>
                            </div>
                            <p
                              className="text-[12px] leading-relaxed mt-1 line-clamp-2"
                              style={{ color: 'var(--label-secondary)' }}
                            >
                              {n.message}
                            </p>
                            <div className="flex items-center gap-2 mt-1.5">
                              <span
                                className="text-[11px] font-mono"
                                style={{ color: 'var(--label-tertiary)' }}
                              >
                                {getTimeAgo(n.createdAt)}
                              </span>
                              {n.targetRole && n.targetRole !== 'All' && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-canvas border border-separator text-label-tertiary">
                                  {n.targetRole}
                                </span>
                              )}
                              {n.link && (
                                <span className="text-[10.5px] text-accent font-medium hover:underline">
                                  View link →
                                </span>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Avatar / Dropdown */}
        {user || profile ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-full cursor-pointer outline-none bg-separator hover:bg-separator-opaque transition-colors duration-150"
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
              </button>
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
                      className="inline-flex px-2 py-0.5 mt-1.5 rounded-full text-[10px] font-semibold uppercase tracking-wider"
                      style={{
                        background: 'var(--accent-subtle)',
                        color: 'var(--accent)',
                        border: '1px solid var(--separator)',
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

      {/* Admin Broadcast Notification Modal */}
      {isAdmin && (
        <CreateNotificationModal
          isOpen={isBroadcastModalOpen}
          onClose={() => setIsBroadcastModalOpen(false)}
        />
      )}
    </header>
  );
};

export default Header;
