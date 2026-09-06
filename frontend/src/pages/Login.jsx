import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import AuthLayout from '../layouts/AuthLayout';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { User, Lock, Loader2, Mail, KeyRound, X, CheckCircle2, Copy } from 'lucide-react';

const Login = () => {
  const [identifier, setIdentifier] = useState(''); // email or rollNo
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Forgot Password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [resetResult, setResetResult] = useState(null);

  const { login, forgotPassword } = useAuthStore();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const result = await login(identifier, password);
    
    if (result.success) {
      toast.success('Welcome back to the circle!');
      navigate('/dashboard');
    } else {
      toast.error(result.error);
    }
    setLoading(false);
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
          <label className="stellar-label">Email or Roll Number</label>
          <div className="relative group">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-blue-500 transition-colors duration-500" />
            <input
              type="text"
              placeholder="Email or Roll No"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="stellar-input pl-12"
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
            <label className="stellar-label">Password</label>
            <button 
              type="button" 
              onClick={() => {
                setShowForgotModal(true);
                setResetResult(null);
                setForgotEmail('');
              }} 
              className="text-[10px] uppercase tracking-widest text-blue-400 font-bold hover:text-blue-300 transition-colors duration-500 mb-2 cursor-pointer"
            >
              Forgot?
            </button>
          </div>
          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-blue-500 transition-colors duration-500" />
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="stellar-input pl-12"
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
          <button type="submit" disabled={loading} className="stellar-btn w-full flex items-center justify-center gap-2 cursor-pointer">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign In'}
          </button>
        </motion.div>

        <motion.p 
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1 }
          }}
          className="text-center text-slate-500 text-sm mt-6 flex flex-col gap-3"
        >
          <span>
            New to the circle?{' '}
            <Link to="/register" className="text-white font-bold hover:text-blue-400 transition-colors duration-500 underline underline-offset-8 decoration-white/10 hover:decoration-blue-400/30">
              Create Account
            </Link>
          </span>
        </motion.p>
      </motion.form>

      {/* Forgot Password Modal */}
      <AnimatePresence>
        {showForgotModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowForgotModal(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-md stellar-glass p-8 border-blue-500/20 z-10"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20 text-blue-400">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white uppercase tracking-wider">Reset Password</h3>
                    <p className="text-xs text-slate-400 font-medium">Request an account recovery link</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowForgotModal(false)}
                  className="p-2 hover:bg-white/5 rounded-full text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {!resetResult ? (
                <form onSubmit={handleForgotPassword} className="space-y-5">
                  <div className="space-y-2">
                    <label className="stellar-label">Registered Email</label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                      <input
                        type="email"
                        placeholder="name@university.edu"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        className="stellar-input pl-12"
                        required
                      />
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed">
                    We will generate a secure one-time password reset link valid for 1 hour.
                  </p>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowForgotModal(false)}
                      className="flex-1 py-3.5 px-5 rounded-2xl bg-white/5 text-slate-400 text-xs font-bold uppercase tracking-wider hover:bg-white/10 transition-all border border-white/5"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={forgotLoading}
                      className="flex-1 py-3.5 px-5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {forgotLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send Reset Link'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-5">
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-bold text-white">Reset Link Ready</h4>
                      <p className="text-xs text-emerald-300/90 mt-1 leading-relaxed">
                        {resetResult.message}
                      </p>
                    </div>
                  </div>

                  {resetResult.resetLink && (
                    <div className="space-y-2">
                      <label className="stellar-label">Recovery Link (Direct Access)</label>
                      <div className="flex items-center gap-2 p-3 bg-slate-900 border border-white/10 rounded-xl">
                        <input
                          type="text"
                          readOnly
                          value={resetResult.resetLink}
                          className="bg-transparent text-xs text-slate-300 font-mono flex-1 outline-none truncate"
                        />
                        <button
                          type="button"
                          onClick={() => copyToClipboard(resetResult.resetLink)}
                          className="p-1.5 hover:bg-white/10 rounded-lg text-blue-400 hover:text-white transition-all cursor-pointer"
                          title="Copy Link"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                      <a
                        href={resetResult.resetLink}
                        className="stellar-btn w-full block text-center mt-3 text-xs"
                      >
                        Proceed to Reset Password Page
                      </a>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="w-full py-3 rounded-xl bg-white/5 text-slate-400 text-xs font-bold uppercase tracking-wider hover:bg-white/10 transition-all border border-white/5"
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
