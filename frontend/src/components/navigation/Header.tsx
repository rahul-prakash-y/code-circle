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
  Sparkles,
  Ticket,
  Hexagon,
  Info
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

export const Header: React.FC<HeaderProps> = ({
  onOpenMobileMenu,
  className = '',
}) => {
  const { user, logout } = useAuthStore();
  const { profile } = useProfileStore();
  const navigate = useNavigate();

  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  const mockNotifications = [
    { id: 1, title: 'Nebula Hackathon Live!', message: 'The coding phase has officially started. Good luck!', time: '10m ago', type: 'info' },
    { id: 2, title: 'Achievement Unlocked', message: 'You earned the "Glassmorphic Guru" badge.', time: '2h ago', type: 'success' },
    { id: 3, title: 'System Notice', message: 'Evaluation round scoring finalized.', time: '1d ago', type: 'info' },
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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

  const displayName = profile?.name || user?.name || 'User';
  const displayRole = profile?.role || user?.role || 'Member';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <header 
      className={`sticky top-0 z-30 w-full h-16 px-4 sm:px-6 
        backdrop-blur-md bg-surface/70 border-b border-border/80 
        flex items-center justify-between transition-colors duration-200 ${className}`}
    >
      {/* Left items: Mobile toggle & Search */}
      <div className="flex items-center gap-3">
        {/* Mobile menu trigger button */}
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-xl bg-surface-elevated border border-border text-text-muted hover:text-text-primary transition-colors cursor-pointer"
          aria-label="Open menu"
        >
          <Menu size={18} />
        </button>

        {/* Global Search Input */}
        <div className="relative flex items-center">
          <div className="hidden sm:flex items-center gap-2.5 px-3.5 py-2 bg-surface-elevated/80 border border-border rounded-xl focus-within:border-accent/40 focus-within:ring-2 focus-within:ring-accent/20 transition-all duration-200 w-44 md:w-64">
            <Search size={15} className="text-text-muted shrink-0" />
            <input
              type="text"
              placeholder="Search portal..."
              className="bg-transparent border-none text-xs text-text-primary focus:outline-none placeholder-text-muted/70 w-full"
            />
            <span className="hidden md:inline-block text-[10px] font-mono text-text-muted/60 bg-surface border border-border/60 px-1.5 py-0.5 rounded">
              /
            </span>
          </div>
        </div>
      </div>

      {/* Right items: Theme toggle, Notifications, User Profile */}
      <div className="flex items-center gap-2.5">
        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Notifications Popover */}
        <div className="relative" ref={notificationRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className={`p-2.5 rounded-xl transition-all duration-200 relative cursor-pointer ${
              showNotifications
                ? 'bg-accent/15 text-accent border border-accent/30'
                : 'bg-surface-elevated border border-border text-text-muted hover:text-text-primary hover:border-border-hover'
            }`}
            title="Notifications"
            aria-label="Notifications"
          >
            <Bell size={17} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-accent rounded-full ring-2 ring-surface" />
          </button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className="absolute top-12 right-0 w-80 glass-elevated p-1 z-50 rounded-2xl shadow-xl border border-border"
              >
                <div className="p-3.5 border-b border-border flex justify-between items-center">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted">
                    Notifications
                  </h3>
                  <button 
                    onClick={() => setShowNotifications(false)}
                    className="text-[10px] font-semibold text-accent hover:underline uppercase tracking-wider"
                  >
                    Clear All
                  </button>
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-border/40">
                  {mockNotifications.map((notif) => (
                    <div key={notif.id} className="p-3 hover:bg-surface-elevated rounded-xl transition-colors cursor-pointer m-1">
                      <div className="flex gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent shrink-0">
                          <Info size={14} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-text-primary truncate">{notif.title}</p>
                          <p className="text-[11px] text-text-muted leading-relaxed line-clamp-2 mt-0.5">{notif.message}</p>
                          <p className="text-[9px] text-text-muted/60 mt-1 font-mono">{notif.time}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User Profile Dropdown using Shadcn UI */}
        {user || profile ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2.5 p-1 pr-2.5 bg-surface-elevated/70 hover:bg-surface-elevated border border-border hover:border-border-hover rounded-xl transition-all duration-200 group cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent/30">
                <Avatar className="w-8 h-8 rounded-lg border border-accent/20 group-hover:border-accent/40 transition-colors">
                  {profile?.profilePicUrl ? (
                    <AvatarImage src={profile.profilePicUrl} alt={displayName} className="object-cover" />
                  ) : null}
                  <AvatarFallback className="bg-accent/15 text-accent font-bold text-xs rounded-lg">
                    {initial}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-bold text-text-primary leading-none group-hover:text-accent transition-colors truncate max-w-[110px]">
                    {displayName}
                  </p>
                  <p className="text-[10px] font-semibold text-text-muted mt-0.5 tracking-wide">
                    {displayRole}
                  </p>
                </div>
                <ChevronDown size={13} className="text-text-muted group-hover:text-text-primary transition-transform duration-200 group-data-[state=open]:rotate-180" />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-56 p-1.5 rounded-2xl glass-elevated border border-border shadow-2xl">
              <DropdownMenuLabel className="p-2.5 pb-2">
                <div className="flex items-center gap-2.5">
                  <Avatar className="w-9 h-9 rounded-xl border border-accent/30">
                    {profile?.profilePicUrl ? (
                      <AvatarImage src={profile.profilePicUrl} alt={displayName} />
                    ) : null}
                    <AvatarFallback className="bg-accent text-white font-bold text-xs rounded-xl">
                      {initial}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-text-primary truncate">{displayName}</p>
                    <p className="text-[10px] text-text-muted truncate">{user?.email || profile?.email || ''}</p>
                    <span className="inline-block text-[9px] font-extrabold uppercase tracking-widest text-accent bg-accent/10 px-2 py-0.5 rounded-md mt-1 border border-accent/20">
                      {displayRole}
                    </span>
                  </div>
                </div>
              </DropdownMenuLabel>

              <DropdownMenuSeparator className="my-1 bg-border/60" />

              <DropdownMenuGroup>
                <DropdownMenuItem 
                  onClick={() => navigate('/profile')} 
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-text-primary hover:bg-accent/10 hover:text-accent cursor-pointer transition-colors"
                >
                  <UserIcon size={15} className="text-accent" />
                  <span>Profile Overview</span>
                </DropdownMenuItem>

                <DropdownMenuItem 
                  onClick={() => navigate('/dashboard?tab=passport')} 
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-text-primary hover:bg-accent/10 hover:text-accent cursor-pointer transition-colors"
                >
                  <Ticket size={15} className="text-purple-400" />
                  <span>My Registrations</span>
                </DropdownMenuItem>

                {displayRole === 'SuperAdmin' || displayRole === 'Admin' ? (
                  <DropdownMenuItem 
                    onClick={() => navigate('/users')} 
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-text-primary hover:bg-accent/10 hover:text-accent cursor-pointer transition-colors"
                  >
                    <Shield size={15} className="text-emerald-400" />
                    <span>User Management</span>
                  </DropdownMenuItem>
                ) : null}
              </DropdownMenuGroup>

              <DropdownMenuSeparator className="my-1 bg-border/60" />

              <DropdownMenuItem 
                onClick={handleLogout}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-destructive hover:bg-destructive/10 cursor-pointer transition-colors"
              >
                <LogOut size={15} />
                <span>Sign Out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Link
            to="/login"
            className="btn-primary py-2 px-4 text-xs font-bold rounded-xl"
          >
            Sign In
          </Link>
        )}
      </div>
    </header>
  );
};

export default Header;
