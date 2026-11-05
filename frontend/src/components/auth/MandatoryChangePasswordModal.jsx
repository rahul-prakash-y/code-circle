import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Lock, KeyRound, Eye, EyeOff, CheckCircle2, Loader2, LogOut } from 'lucide-react';
import useAuthStore from '../../store/useAuthStore';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export const MandatoryChangePasswordModal = () => {
  const { user, changePassword, logout } = useAuthStore();
  const navigate = useNavigate();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // If user doesn't need to change password, do not display
  if (!user || !user.mustChangePassword) {
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!currentPassword) {
      return toast.error('Please enter the temporary password provided by your admin');
    }

    if (newPassword.length < 6) {
      return toast.error('New password must be at least 6 characters');
    }

    if (newPassword !== confirmNewPassword) {
      return toast.error('Passwords do not match');
    }

    if (newPassword === currentPassword) {
      return toast.error('New password must be different from the temporary password');
    }

    setLoading(true);
    const result = await changePassword(currentPassword, newPassword);

    if (result.success) {
      toast.success('Password updated successfully! Welcome to Code Circle!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } else {
      toast.error(result.error || 'Failed to update password');
    }
    setLoading(false);
  };

  const handleSignOut = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6">
        {/* Un-dismissible backdrop with heavy blur */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-md"
        />

        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
          className="relative w-full max-w-lg bg-surface rounded-3xl p-6 sm:p-8 border border-separator shadow-2xl z-10 space-y-6"
        >
          {/* Header */}
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-accent/10 border border-accent/20 text-accent flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  Temporary Password Active
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-label-primary tracking-tight">
                Create Your Own Password
              </h2>
              <p className="text-xs text-label-secondary leading-relaxed">
                An administrator generated a temporary password for your account. You must set your own secure password before continuing.
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Current (Temporary) Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-label-secondary uppercase tracking-wider">
                Current (Temporary) Password *
              </label>
              <div className="relative group">
                <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-label-tertiary group-focus-within:text-accent transition-colors" />
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  placeholder="Enter temporary password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-separator bg-surface-secondary text-label-primary text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-label-tertiary hover:text-label-primary transition-colors cursor-pointer"
                >
                  {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-label-secondary uppercase tracking-wider">
                New Password *
              </label>
              <div className="relative group">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-label-tertiary group-focus-within:text-accent transition-colors" />
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  placeholder="Minimum 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-separator bg-surface-secondary text-label-primary text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-label-tertiary hover:text-label-primary transition-colors cursor-pointer"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-label-secondary uppercase tracking-wider">
                Confirm New Password *
              </label>
              <div className="relative group">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-label-tertiary group-focus-within:text-accent transition-colors" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Re-enter your new password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-separator bg-surface-secondary text-label-primary text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-label-tertiary hover:text-label-primary transition-colors cursor-pointer"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {confirmNewPassword && newPassword !== confirmNewPassword && (
                <p className="text-xs text-destructive mt-1">Passwords do not match</p>
              )}
              {confirmNewPassword && newPassword === confirmNewPassword && newPassword.length >= 6 && (
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Passwords match
                </p>
              )}
            </div>

            {/* Action buttons */}
            <div className="pt-4 border-t border-separator flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleSignOut}
                className="text-xs font-medium text-label-tertiary hover:text-destructive flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>

              <button
                type="submit"
                disabled={loading || !currentPassword || newPassword.length < 6 || newPassword !== confirmNewPassword}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold bg-accent text-white hover:bg-accent-hover disabled:opacity-40 transition cursor-pointer shadow"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin w-4 h-4" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Set Password & Continue</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default MandatoryChangePasswordModal;
