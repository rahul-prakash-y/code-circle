import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Lock, KeyRound, Eye, EyeOff, CheckCircle2, Loader2, LogOut, ArrowRight } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
import toast from 'react-hot-toast';
import { useNavigate, Navigate } from 'react-router-dom';
import AuthLayout from '../layouts/AuthLayout';

export const decodeJwtPayload = (token) => {
  if (!token) return null;
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
};

const SetupPassword = () => {
  const { user, token, changePassword, logout } = useAuthStore();
  const navigate = useNavigate();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Determine if user actually needs to be on this screen
  const jwtPayload = decodeJwtPayload(token);
  const isPasswordChangeRequired = Boolean(
    jwtPayload?.requirePasswordChange ||
    user?.requirePasswordChange ||
    user?.mustChangePassword
  );

  // If password was already claimed / created, redirect to dashboard
  if (user && !isPasswordChangeRequired) {
    return <Navigate to="/dashboard" replace />;
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
      toast.success('Account successfully claimed! Welcome to Code Circle!');
      navigate('/dashboard', { replace: true });
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
    <AuthLayout
      title="Claim Your Account"
      subtitle="Set your personal password to activate your membership and access the developer portal."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Security badge notice */}
        <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-3">
          <div className="p-1.5 bg-amber-500/20 rounded-xl text-amber-500 shrink-0 mt-0.5">
            <ShieldCheck size={16} strokeWidth={2.2} />
          </div>
          <div>
            <p className="text-xs font-semibold text-amber-500 dark:text-amber-400">
              Initial Login Required
            </p>
            <p className="text-[11px] text-text-muted mt-0.5 leading-relaxed">
              You are currently authenticated using default or administrator credentials. Please choose your own secure password to finalize onboarding.
            </p>
          </div>
        </div>

        {/* Current (Temporary) Password */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-text-secondary">
            Current / Temporary Password
          </label>
          <div className="relative group">
            <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted group-focus-within:text-accent transition-colors" />
            <input
              type={showCurrentPassword ? 'text' : 'password'}
              placeholder="Enter temporary password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="input-field pl-10 pr-10 text-sm"
              required
            />
            <button
              type="button"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors cursor-pointer"
            >
              {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* New Password */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-text-secondary">
            Create New Password
          </label>
          <div className="relative group">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted group-focus-within:text-accent transition-colors" />
            <input
              type={showNewPassword ? 'text' : 'password'}
              placeholder="Minimum 6 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="input-field pl-10 pr-10 text-sm"
              required
              minLength={6}
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors cursor-pointer"
            >
              {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Confirm New Password */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-text-secondary">
            Confirm New Password
          </label>
          <div className="relative group">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted group-focus-within:text-accent transition-colors" />
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Re-enter your new password"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              className="input-field pl-10 pr-10 text-sm"
              required
              minLength={6}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors cursor-pointer"
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {confirmNewPassword && newPassword !== confirmNewPassword && (
            <p className="text-xs text-destructive mt-1">Passwords do not match</p>
          )}
          {confirmNewPassword && newPassword === confirmNewPassword && newPassword.length >= 6 && (
            <p className="text-xs text-success mt-1 flex items-center gap-1 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" /> Passwords match
            </p>
          )}
        </div>

        {/* Action buttons */}
        <div className="pt-3 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleSignOut}
            className="text-xs text-text-muted hover:text-destructive flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>

          <button
            type="submit"
            disabled={loading || !currentPassword || newPassword.length < 6 || newPassword !== confirmNewPassword}
            className="btn-primary py-2.5 px-6 text-sm flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="animate-spin w-4 h-4" />
            ) : (
              <>
                <span>Claim Account</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </AuthLayout>
  );
};

export default SetupPassword;
