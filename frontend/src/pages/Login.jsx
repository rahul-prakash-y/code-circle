import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import AuthLayout from '../layouts/AuthLayout';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { User, Lock, Loader2, Mail, KeyRound, X, CheckCircle2, Copy, ShieldCheck, Eye, EyeOff } from 'lucide-react';

const Login = () => {
  const [identifier, setIdentifier] = useState(''); // email or rollNo
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Forgot Password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [resetResult, setResetResult] = useState(null);

  // Change Password modal state (first-time login)
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loginCredentials, setLoginCredentials] = useState({ identifier: '', password: '' });

  const { login, forgotPassword, changePassword } = useAuthStore();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const result = await login(identifier, password);
    
    if (result.success) {
      if (result.mustChangePassword) {
        // Store credentials for the change password flow
        setLoginCredentials({ identifier, password });
        setShowChangePasswordModal(true);
        setNewPassword('');
        setConfirmNewPassword('');
        toast('Please set your own password to continue', { icon: '🔐' });
      } else {
        toast.success('Welcome back to the circle!');
        navigate('/dashboard');
      }
    } else {
      toast.error(result.error);
    }
    setLoading(false);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    if (newPassword.length < 6) {
      return toast.error('Password must be at least 6 characters');
    }
    
    if (newPassword !== confirmNewPassword) {
      return toast.error('Passwords do not match');
    }

    if (newPassword === loginCredentials.password) {
      return toast.error('New password must be different from the default password');
    }
    
    setChangePasswordLoading(true);
    
    const result = await changePassword(loginCredentials.password, newPassword);
    
    if (result.success) {
      toast.success('Password updated successfully! Welcome to the circle!');
      setShowChangePasswordModal(false);
      navigate('/dashboard');
    } else {
      toast.error(result.error || 'Failed to change password');
    }
    setChangePasswordLoading(false);
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!forgotEmail) return toast.error('Please enter your email address');

    setForgotLoading(true);
    const result = await forgotPassword(forgotEmail);
    if (result.success) {
      setResetResult(result);
      toast.success('Reset link request processed!');
    } else {
      toast.error(result.error);
    }
    setForgotLoading(false);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Reset link copied to clipboard!');
  };

  return (
    <AuthLayout 
      title="Welcome Back" 
      subtitle="Enter your credentials to access the elite developer hub."
    >
      <motion.form 
        onSubmit={handleLogin} 
        className="space-y-5"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: {
              staggerChildren: 0.1,
              delayChildren: 0.3
            }
          }
        }}
      >
        <motion.div 
          variants={{
            hidden: { opacity: 0, x: -10 },
            visible: { opacity: 1, x: 0 }
          }}
          className="space-y-2"
        >
          <label className="input-label">Email or Roll Number</label>
          <div className="relative group">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted group-focus-within:text-accent transition-colors duration-300" />
            <input
              type="text"
              placeholder="Email or Roll No"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="input-field pl-12"
              required
            />
          </div>
        </motion.div>

        <motion.div 
          variants={{
            hidden: { opacity: 0, x: -10 },
            visible: { opacity: 1, x: 0 }
          }}
          className="space-y-2"
        >
          <div className="flex items-center justify-between">
            <label className="input-label">Password</label>
            <button 
              type="button" 
              onClick={() => {
                setShowForgotModal(true);
                setResetResult(null);
                setForgotEmail('');
              }} 
              className="text-[11px] uppercase tracking-wider text-accent font-semibold hover:text-accent-muted transition-colors duration-300 mb-2 cursor-pointer"
            >
              Forgot?
            </button>
          </div>
          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted group-focus-within:text-accent transition-colors duration-300" />
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field pl-12"
              required
            />
          </div>
        </motion.div>

        <motion.div 
          variants={{
            hidden: { opacity: 0, y: 10 },
            visible: { opacity: 1, y: 0 }
          }}
          className="pt-2"
        >
          <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 cursor-pointer py-3.5 text-base">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign In'}
          </button>
        </motion.div>

        <motion.p 
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1 }
          }}
          className="text-center text-text-muted text-sm mt-6 flex flex-col gap-3"
        >
          <span>
            New to the circle?{' '}
            <Link to="/register" className="text-text-primary font-semibold hover:text-accent transition-colors duration-300 underline underline-offset-8 decoration-border hover:decoration-accent/30">
              Create Account
            </Link>
          </span>
        </motion.p>
      </motion.form>

      {/* Change Password Modal (First-Time Login) */}
      <AnimatePresence>
        {showChangePasswordModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-md glass-elevated p-8 rounded-2xl z-10"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-accent/10 rounded-xl border border-accent/20 text-accent">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-text-primary font-heading">Set Your Password</h3>
                    <p className="text-xs text-text-muted font-medium">Create a personal password to secure your account</p>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl mb-5">
                <p className="text-xs text-amber-400 leading-relaxed flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
                  You're using a default password. For security, please set your own password before continuing.
                </p>
              </div>

              <form onSubmit={handleChangePassword} className="space-y-5">
                <div className="space-y-2">
                  <label className="input-label">New Password</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted group-focus-within:text-accent transition-colors" />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      placeholder="Minimum 6 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="input-field pl-12 pr-12"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors cursor-pointer"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="input-label">Confirm New Password</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted group-focus-within:text-accent transition-colors" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Re-enter your new password"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      className="input-field pl-12 pr-12"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {confirmNewPassword && newPassword !== confirmNewPassword && (
                    <p className="text-xs text-red-400 mt-1">Passwords do not match</p>
                  )}
                  {confirmNewPassword && newPassword === confirmNewPassword && newPassword.length >= 6 && (
                    <p className="text-xs text-green-400 mt-1 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Passwords match
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={changePasswordLoading || newPassword.length < 6 || newPassword !== confirmNewPassword}
                  className="btn-primary w-full flex items-center justify-center gap-2 cursor-pointer py-3.5 text-base disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {changePasswordLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                    <>
                      <ShieldCheck className="w-5 h-5" />
                      Set Password & Continue
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Forgot Password Modal */}
      <AnimatePresence>
        {showForgotModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowForgotModal(false)}
              className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-md glass-elevated p-8 rounded-2xl z-10"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-accent/10 rounded-xl border border-accent/20 text-accent">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-text-primary font-heading">Reset Password</h3>
                    <p className="text-xs text-text-muted font-medium">Request an account recovery link</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowForgotModal(false)}
                  className="p-2 hover:bg-surface-elevated rounded-lg text-text-muted hover:text-text-primary transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {!resetResult ? (
                <form onSubmit={handleForgotPassword} className="space-y-5">
                  <div className="space-y-2">
                    <label className="input-label">Registered Email</label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted group-focus-within:text-accent transition-colors" />
                      <input
                        type="email"
                        placeholder="name@university.edu"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        className="input-field pl-12"
                        required
                      />
                    </div>
                  </div>

                  <p className="text-xs text-text-muted leading-relaxed">
                    We will generate a secure one-time password reset link valid for 1 hour.
                  </p>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowForgotModal(false)}
                      className="btn-secondary flex-1 text-xs font-semibold uppercase tracking-wider"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={forgotLoading}
                      className="btn-primary flex-1 text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {forgotLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send Reset Link'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-5">
                  <div className="p-4 bg-success/10 border border-success/20 rounded-xl flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-bold text-text-primary">Reset Link Ready</h4>
                      <p className="text-xs text-success mt-1 leading-relaxed">
                        {resetResult.message}
                      </p>
                    </div>
                  </div>

                  {resetResult.resetLink && (
                    <div className="space-y-2">
                      <label className="input-label">Recovery Link (Direct Access)</label>
                      <div className="flex items-center gap-2 p-3 bg-surface-elevated border border-border rounded-xl">
                        <input
                          type="text"
                          readOnly
                          value={resetResult.resetLink}
                          className="bg-transparent text-xs text-text-secondary font-mono flex-1 outline-none truncate"
                        />
                        <button
                          type="button"
                          onClick={() => copyToClipboard(resetResult.resetLink)}
                          className="p-1.5 hover:bg-accent/10 rounded-lg text-accent hover:text-accent-muted transition-all cursor-pointer"
                          title="Copy Link"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                      <a
                        href={resetResult.resetLink}
                        className="btn-primary w-full block text-center mt-3 text-xs py-3"
                      >
                        Proceed to Reset Password Page
                      </a>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="btn-secondary w-full text-xs font-semibold uppercase tracking-wider"
                  >
                    Close
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AuthLayout>
  );
};

export default Login;
