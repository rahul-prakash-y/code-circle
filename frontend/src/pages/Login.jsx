import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import AuthLayout from '../layouts/AuthLayout';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { User, Lock, Loader2, Mail, KeyRound, X, Copy, ShieldCheck } from 'lucide-react';

const Login = () => {
  const [identifier, setIdentifier] = useState(''); // email or rollNo
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Forgot Password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);

  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const result = await login(identifier, password);
    
    if (result.success) {
      if (result.requirePasswordChange || result.mustChangePassword || result.user?.mustChangePassword) {
        toast('Please create your own secure password to complete onboarding', { icon: '🔐' });
        navigate('/setup-password');
      } else {
        toast.success('Welcome back to the circle!');
        navigate('/dashboard');
      }
    } else {
      toast.error(result.error);
    }
    setLoading(false);
  };

  return (
    <AuthLayout 
      title="Welcome Back" 
      subtitle="Enter your credentials to access the elite developer hub."
    >
      <motion.form 
        onSubmit={handleLogin} 
        className="space-y-4 sm:space-y-5"
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
          className="space-y-1.5 sm:space-y-2"
        >
          <label className="input-label text-xs sm:text-sm">Email or Roll Number</label>
          <div className="relative group">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted group-focus-within:text-accent transition-colors duration-300" />
            <input
              type="text"
              placeholder="Email or Roll No"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="input-field pl-12 min-h-[46px] text-sm"
              required
            />
          </div>
        </motion.div>

        <motion.div 
          variants={{
            hidden: { opacity: 0, x: -10 },
            visible: { opacity: 1, x: 0 }
          }}
          className="space-y-1.5 sm:space-y-2"
        >
          <div className="flex items-center justify-between">
            <label className="input-label text-xs sm:text-sm">Password</label>
            <button 
              type="button" 
              onClick={() => setShowForgotModal(true)} 
              className="text-[11px] uppercase tracking-wider text-accent font-semibold hover:text-accent-muted transition-colors duration-300 mb-1 cursor-pointer min-h-[36px] px-1 flex items-center touch-manipulation"
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
              className="input-field pl-12 min-h-[46px] text-sm"
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
          <button 
            type="submit" 
            disabled={loading} 
            className="btn-primary w-full flex items-center justify-center gap-2 cursor-pointer py-3.5 min-h-[48px] text-sm sm:text-base font-semibold shadow-lg shadow-accent/15"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign In'}
          </button>
        </motion.div>

        <motion.p 
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1 }
          }}
          className="text-center text-text-muted text-xs sm:text-sm mt-4 sm:mt-6 flex flex-col gap-2"
        >
          <span>
            New to the circle?{' '}
            <Link to="/register" className="text-text-primary font-semibold hover:text-accent transition-colors duration-300 underline underline-offset-4 decoration-border hover:decoration-accent/40">
              Create Account
            </Link>
          </span>
        </motion.p>
      </motion.form>

      {/* Contact Admin / Forgot Password Modal */}
      <AnimatePresence>
        {showForgotModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowForgotModal(false)}
              className="absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 16 }}
              className="relative w-full max-w-md max-h-[90dvh] overflow-y-auto glass-elevated p-5 sm:p-7 rounded-2xl z-10 space-y-4 sm:space-y-5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 sm:p-3 bg-amber-500/10 rounded-xl border border-amber-500/20 text-amber-500 shrink-0">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-text-primary font-heading">Forgot Password?</h3>
                    <p className="text-[11px] sm:text-xs text-text-muted font-medium">Contact administration for assistance</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 hover:bg-surface-elevated rounded-xl text-text-muted hover:text-text-primary transition-colors cursor-pointer"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-3.5 sm:p-4 bg-accent/10 border border-accent/20 rounded-xl space-y-1.5">
                <div className="flex items-center gap-2 text-accent text-xs font-bold uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span>Verified Reset Link Request</span>
                </div>
                <p className="text-xs text-text-secondary leading-relaxed">
                  You can submit a verified password reset request through our portal. Administrators review requests, approve user accounts, and dispatch official reset links to your registered email.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2.5 pt-1">
                <Link
                  to="/reset-password"
                  onClick={() => setShowForgotModal(false)}
                  className="btn-primary w-full py-2.5 min-h-[44px] text-xs sm:text-sm flex items-center justify-center gap-2 text-center font-medium shadow-md shadow-accent/15"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>Go to Password Reset Portal</span>
                </Link>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface border border-separator text-xs">
                  <div className="flex items-center gap-2 text-text-muted min-w-0 pr-2">
                    <Mail className="w-3.5 h-3.5 text-accent shrink-0" />
                    <span className="truncate">codecircle@bitsathy.ac.in</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText('codecircle@bitsathy.ac.in');
                      toast.success('Admin email copied to clipboard!');
                    }}
                    className="min-h-[40px] min-w-[40px] flex items-center justify-center p-2 rounded-lg hover:bg-surface-elevated text-text-muted hover:text-accent transition-colors cursor-pointer shrink-0"
                    title="Copy Email"
                    aria-label="Copy Email"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="btn-secondary w-full py-2.5 min-h-[44px] text-xs sm:text-sm cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AuthLayout>
  );
};

export default Login;
