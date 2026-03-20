import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import AuthLayout from '../layouts/AuthLayout';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Mail, Lock, User, Hash, Loader2 } from 'lucide-react';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [rollNo, setRollNo] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuthStore();
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const result = await register({ name, email, rollNo, password });
    
    if (result.success) {
      toast.success('Account created successfully!');
      navigate('/dashboard');
    } else {
      toast.error(result.error);
    }
    setLoading(false);
  };

  return (
    <AuthLayout 
      title="Join the Circle" 
      subtitle="Create your professional identity and start collaborating today."
    >
      <motion.form 
        onSubmit={handleRegister} 
        className="space-y-5"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: {
              staggerChildren: 0.08,
              delayChildren: 0.2
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
          <label className="stellar-label">Full Name</label>
          <div className="relative group">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-blue-500 transition-colors duration-500" />
            <input
              type="text"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
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
          <label className="stellar-label">University Roll Number</label>
          <div className="relative group">
            <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-blue-500 transition-colors duration-500" />
            <input
              type="text"
              placeholder="Ex: 2021CSE001"
              value={rollNo}
              onChange={(e) => setRollNo(e.target.value)}
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
          <label className="stellar-label">Email Address</label>
          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-blue-500 transition-colors duration-500" />
            <input
              type="email"
              placeholder="name@university.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
          <label className="stellar-label">Password</label>
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
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Account'}
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
            Already have an account?{' '}
            <Link to="/login" className="text-white font-bold hover:text-blue-400 transition-colors duration-500 underline underline-offset-8 decoration-white/10 hover:decoration-blue-400/30">
              Sign In
            </Link>
          </span>
        </motion.p>
      </motion.form>
    </AuthLayout>
  );
};

export default Register;
