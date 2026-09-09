import React, { useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import AuthLayout from '../layouts/AuthLayout';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { 
  Lock, 
  KeyRound, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ArrowRight, 
  Mail, 
  Copy, 
  ShieldCheck, 
  Building2 
} from 'lucide-react';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const emailParam = searchParams.get('email') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);

  const { resetPasswordWithToken } = useAuthStore();
  const navigate = useNavigate();

  const adminEmail = 'codecircle@bitsathy.ac.in';

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(adminEmail);
    setCopiedEmail(true);
    toast.success('Admin email copied to clipboard!');
    setTimeout(() => setCopiedEmail(false), 2500);
  };

  const handleReset = async (e) => {
    e.preventDefault();

    if (!token) {
      return toast.error('Missing password reset token');
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

  // If token was successfully used to update password
  if (isSubmitted) {
    return (
      <AuthLayout
        title="Password Updated"
        subtitle="Your new credentials are now active."
      >
        <div className="text-center space-y-6">
          <div className="w-16 h-16 bg-success/10 border border-success/20 rounded-2xl flex items-center justify-center mx-auto text-success">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <p className="text-sm text-text-secondary font-medium">
            Your password has been successfully reset. You may now sign in to your Code Circle account.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="btn-primary w-full flex items-center justify-center gap-2 py-3 cursor-pointer"
          >
            Sign In Now <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </AuthLayout>
    );
  }

  // If no token is provided (standard self-service navigation), show the Contact Admin view
  if (!token) {
    return (
      <AuthLayout
        title="Password Reset Support"
        subtitle="Administrator assistance required"
      >
        <motion.div 
          className="space-y-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Policy Banner */}
          <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl space-y-2">
            <div className="flex items-center gap-2 text-amber-500 font-semibold text-xs uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4" />
              <span>Admin-Managed Password Policy</span>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed">
              Self-service password reset links are disabled for student security. To regain access, an Administrator or SuperAdmin will issue a temporary password for your account.
            </p>
          </div>

          {/* Contact Administrator Box */}
          <div className="surface rounded-xl p-4 border border-separator space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-text-primary">
                <Mail className="w-4 h-4 text-accent" />
                <span>Contact Administrator</span>
              </div>
              <button
                type="button"
                onClick={handleCopyEmail}
                className="text-xs text-text-muted hover:text-accent flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedEmail ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
            <div className="p-3 bg-canvas rounded-lg border border-separator text-xs font-mono text-accent select-all flex items-center justify-between">
              <span>{adminEmail}</span>
              <a 
                href={`mailto:${adminEmail}?subject=Password%20Reset%20Request`} 
                className="text-[11px] underline text-text-muted hover:text-text-primary ml-2"
              >
                Send Email
              </a>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-text-muted">
              <Building2 className="w-3.5 h-3.5 opacity-70" />
              <span>Bannari Amman Institute of Technology</span>
            </div>
          </div>

          {/* Workflow Steps */}
          <div className="space-y-2.5 pt-1">
            <p className="text-xs font-semibold text-text-primary">How it works:</p>
            <div className="space-y-2 text-xs text-text-muted">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-accent/10 text-accent font-bold flex items-center justify-center shrink-0 text-[11px]">1</span>
                <span>Contact your club administrator or send an email with your Roll Number.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-accent/10 text-accent font-bold flex items-center justify-center shrink-0 text-[11px]">2</span>
                <span>Admin generates a secure temporary password for your profile.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-accent/10 text-accent font-bold flex items-center justify-center shrink-0 text-[11px]">3</span>
                <span>Sign in using the temporary password and create your own password immediately.</span>
              </div>
            </div>
          </div>

          {/* Action button */}
          <div className="pt-2">
            <Link
              to="/login"
              className="btn-primary w-full inline-flex items-center justify-center gap-2 py-3 cursor-pointer"
            >
              Return to Sign In
            </Link>
          </div>
        </motion.div>
      </AuthLayout>
    );
  }

  // If a valid token is present in the URL, provide the secure update form
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
          variants={{ hidden: { opacity: 0, x: -10 }, visible: { opacity: 1, x: 0 } }}
          className="space-y-2"
        >
          <label className="input-label">New Password</label>
          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted group-focus-within:text-accent transition-colors" />
            <input
              type="password"
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field pl-12"
              required
              minLength={6}
            />
          </div>
        </motion.div>

        <motion.div
          variants={{ hidden: { opacity: 0, x: -10 }, visible: { opacity: 1, x: 0 } }}
          className="space-y-2"
        >
          <label className="input-label">Confirm New Password</label>
          <div className="relative group">
            <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted group-focus-within:text-accent transition-colors" />
            <input
              type="password"
              placeholder="Re-enter password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="input-field pl-12"
              required
              minLength={6}
            />
          </div>
        </motion.div>

        <motion.div
          variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}
          className="pt-2"
        >
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2 py-3.5 cursor-pointer"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Update Password'}
          </button>
        </motion.div>

        <motion.div
          variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}
          className="text-center pt-2"
        >
          <Link
            to="/login"
            className="text-xs font-semibold text-text-muted hover:text-text-primary transition-colors"
          >
            Cancel and Return to Sign In
          </Link>
        </motion.div>
      </motion.form>
    </AuthLayout>
  );
};

export default ResetPassword;
