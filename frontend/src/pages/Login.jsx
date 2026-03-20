import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import AuthLayout from '../layouts/AuthLayout';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { User, Lock, Loader2 } from 'lucide-react';

const Login = () => {
  const [identifier, setIdentifier] = useState(''); // email or rollNo
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
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
            <a href="#" className="text-[10px] uppercase tracking-widest text-blue-400 font-bold hover:text-blue-300 transition-colors duration-500 mb-2">Forgot?</a>
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
          <button type="submit" disabled={loading} className="stellar-btn w-full flex items-center justify-center gap-2">
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
    </AuthLayout>
  );
};

export default Login;
