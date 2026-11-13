import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Lock, KeyRound, Eye, EyeOff, CheckCircle2, Loader2, LogOut, ArrowRight } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
import toast from 'react-hot-toast';
import { EmilButton } from '../components/ui/emil-ui';
import { HeroInput } from '@/components/ui/hero/HeroInput';
import { Button } from '@heroui/react';
import { useNavigate, Navigate } from 'react-router-dom';
import AuthLayout from '../layouts/AuthLayout';
import { decodeJwtPayload } from '../lib/jwt';

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
        <HeroInput
          label="Current / Temporary Password"
          labelPlacement="inside"
          variant="flat"
          isRequired
          type={showCurrentPassword ? 'text' : 'password'}
          placeholder="Enter temporary password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          startContent={<KeyRound className="w-4 h-4 text-text-muted" />}
          endContent={
            <Button
              type="button"
              variant="ghost"
              size="sm"
              isIconOnly
              onPress={() => setShowCurrentPassword(!showCurrentPassword)}
              className="text-text-muted hover:text-text-primary min-w-[28px] min-h-[28px]"
              aria-label="Toggle password visibility"
            >
              {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
          }
        />

        {/* New Password */}
        <HeroInput
          label="Create New Password"
          labelPlacement="inside"
          variant="flat"
          isRequired
          type={showNewPassword ? 'text' : 'password'}
          placeholder="Minimum 6 characters"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          minLength={6}
          startContent={<Lock className="w-4 h-4 text-text-muted" />}
          endContent={
            <Button
              type="button"
              variant="ghost"
              size="sm"
              isIconOnly
              onPress={() => setShowNewPassword(!showNewPassword)}
              className="text-text-muted hover:text-text-primary min-w-[28px] min-h-[28px]"
              aria-label="Toggle password visibility"
            >
              {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
          }
        />

        {/* Confirm New Password */}
        <div className="space-y-1">
          <HeroInput
            label="Confirm New Password"
            labelPlacement="inside"
            variant="flat"
            isRequired
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="Re-enter your new password"
            value={confirmNewPassword}
            onChange={(e) => setConfirmNewPassword(e.target.value)}
            minLength={6}
            startContent={<Lock className="w-4 h-4 text-text-muted" />}
            endContent={
              <Button
                type="button"
                variant="ghost"
                size="sm"
                isIconOnly
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                className="text-text-muted hover:text-text-primary min-w-[28px] min-h-[28px]"
                aria-label="Toggle password visibility"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            }
          />

          {confirmNewPassword && newPassword !== confirmNewPassword && (
            <p className="text-xs text-destructive mt-1 px-1 font-medium">Passwords do not match</p>
          )}
          {confirmNewPassword && newPassword === confirmNewPassword && newPassword.length >= 6 && (
            <p className="text-xs text-success mt-1 px-1 flex items-center gap-1 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" /> Passwords match
            </p>
          )}
        </div>

        {/* Action buttons */}
        <div className="pt-3 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onPress={handleSignOut}
            className="min-h-[44px] text-xs text-text-muted hover:text-destructive flex items-center justify-center sm:justify-start gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </Button>

          <Button
            type="submit"
            variant="primary"
            isDisabled={loading || !currentPassword || newPassword.length < 6 || newPassword !== confirmNewPassword}
            isLoading={loading}
            className="w-full sm:w-auto min-h-[48px] py-3 px-6 text-sm flex items-center justify-center gap-2 shadow-lg shadow-accent/15"
          >
            <span>Claim Account</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </form>
    </AuthLayout>
  );
};

export default SetupPassword;
