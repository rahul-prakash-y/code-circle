import React, { useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import AuthLayout from '../layouts/AuthLayout';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Lock, KeyRound, CheckCircle2, AlertTriangle, Loader2, ArrowRight } from 'lucide-react';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const emailParam = searchParams.get('email') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const { resetPasswordWithToken } = useAuthStore();
  const navigate = useNavigate();

  const handleReset = async (e) => {
    e.preventDefault();

    if (!token) {
      return toast.error('Missing password reset token in URL');
    }

    if (password.length < 6) {
      return toast.error('Password must be at least 6 characters in length');
    }

    if (password !== confirmPassword) {
      return toast.error('Passwords do not match');
    }

    setLoading(true);
    const result = await resetPasswordWithToken(token, password);

    if (result.success) {
      setIsSubmitted(true);
      toast.success(result.message || 'Password reset successfully!');
    } else {
      toast.error(result.error || 'Failed to reset password');
    }
    setLoading(false);
  };

  if (!token) {
    return (
      <AuthLayout
        title="Invalid Reset Request"
        subtitle="This link appears to be incomplete or corrupted."
      >
        <div className="text-center space-y-6">
          <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center mx-auto text-red-400">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <p className="text-sm text-slate-400">
            No valid security token was detected in your reset link. Please contact an administrator or request a new reset link.
          </p>
          <Link
            to="/login"
            className="stellar-btn w-full inline-flex items-center justify-center gap-2"
          >
            Back to Sign In
          </Link>
        </div>
      </AuthLayout>
    );
  }

  if (isSubmitted) {
    return (
      <AuthLayout
        title="Password Updated"
        subtitle="Your new credentials are now active."
      >
        <div className="text-center space-y-6">
          <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto text-emerald-400">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <p className="text-sm text-slate-300 font-medium">
            Your password has been successfully reset. You may now sign in to your Code Circle account.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="stellar-btn w-full flex items-center justify-center gap-2"
          >
            Sign In Now <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Reset Password"
      subtitle={emailParam ? `Set a new secure password for ${emailParam}` : 'Enter your new credentials below.'}
    >
      <motion.form
        onSubmit={handleReset}
        className="space-y-5"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1, delayChildren: 0.2 },
          },
        }}
      >
        <motion.div
          variants={{
            hidden: { opacity: 0, x: -10 },
            visible: { opacity: 1, x: 0 },
          }}
          className="space-y-2"
        >
          <label className="stellar-label">New Password</label>
          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
            <input
              type="password"
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="stellar-input pl-12"
              required
              minLength={6}
            />
          </div>
        </motion.div>

        <motion.div
          variants={{
            hidden: { opacity: 0, x: -10 },
            visible: { opacity: 1, x: 0 },
          }}
          className="space-y-2"
        >
          <label className="stellar-label">Confirm New Password</label>
          <div className="relative group">
            <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
            <input
              type="password"
              placeholder="Re-enter password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="stellar-input pl-12"
              required
              minLength={6}
            />
          </div>
        </motion.div>

        <motion.div
          variants={{
            hidden: { opacity: 0, y: 10 },
            visible: { opacity: 1, y: 0 },
          }}
          className="pt-2"
        >
          <button
            type="submit"
            disabled={loading}
            className="stellar-btn w-full flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Update Password'}
          </button>
        </motion.div>

        <motion.div
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1 },
          }}
          className="text-center pt-2"
        >
          <Link
            to="/login"
            className="text-xs font-bold text-slate-500 hover:text-white transition-colors"
          >
            Cancel and Return to Sign In
          </Link>
        </motion.div>
      </motion.form>
    </AuthLayout>
  );
};

export default ResetPassword;
