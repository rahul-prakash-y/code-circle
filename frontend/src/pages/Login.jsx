import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import AuthLayout from '../layouts/AuthLayout';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { User, Lock, Loader2, Mail, KeyRound, X, Copy, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { EmilButton, EmilModal } from '../components/ui/emil-ui';
import { HeroInput } from '../components/ui/HeroUIComponents';
import { Button } from '@heroui/react';

const Login = () => {
  const [identifier, setIdentifier] = useState(''); // email or rollNo
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
        toast('Please create your own secure password to complete onboarding');
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
              staggerChildren: 0.08,
              delayChildren: 0.1
            }
          }
        }}
      >
        <motion.div 
          variants={{
            hidden: { opacity: 0, y: 8 },
            visible: { opacity: 1, y: 0 }
          }}
        >
          <HeroInput
            label="Roll Number or Email"
            labelPlacement="inside"
            variant="flat"
            isRequired
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="e.g. 21CS001 or name@college.edu"
            startContent={<User className="w-4 h-4 text-text-muted" />}
            isClearable
            onClear={() => setIdentifier('')}
          />
        </motion.div>

        <motion.div 
          variants={{
            hidden: { opacity: 0, y: 8 },
            visible: { opacity: 1, y: 0 }
          }}
          className="space-y-1"
        >
          <HeroInput
            label="Password"
            labelPlacement="inside"
            variant="flat"
            type={showPassword ? 'text' : 'password'}
            isRequired
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            startContent={<Lock className="w-4 h-4 text-text-muted" />}
            endContent={
              <Button
                type="button"
                variant="ghost"
                size="sm"
                isIconOnly
                onPress={() => setShowPassword(!showPassword)}
                className="text-text-muted hover:text-text-primary min-w-[28px] min-h-[28px]"
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            }
          />
          <div className="flex justify-end pt-0.5 px-1">
            <Button 
              type="button"
              variant="ghost"
              size="sm"
              onPress={() => setShowForgotModal(true)}
              className="text-xs text-text-muted hover:text-accent font-medium min-h-[28px] px-2 h-auto"
            >
              Forgot password?
            </Button>
          </div>
        </motion.div>

        {/* Emil Kowalski Strict Rule: EmilButton with instant 0.97 tactile feedback */}
        <motion.div 
          variants={{
            hidden: { opacity: 0, y: 8 },
            visible: { opacity: 1, y: 0 }
          }}
          className="pt-2"
        >
          <EmilButton 
            type="submit" 
            isLoading={loading}
            size="lg"
            className="w-full py-3.5 min-h-[48px] text-sm sm:text-base font-semibold shadow-lg shadow-accent/20 cursor-pointer"
          >
            Sign In
          </EmilButton>
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
            <Link to="/register" className="text-text-primary font-semibold hover:text-accent transition-colors duration-200 underline underline-offset-4 decoration-border hover:decoration-accent/40">
              Create Account
            </Link>
          </span>
        </motion.p>
      </motion.form>

      {/* Contact Admin / Forgot Password EmilModal (Enters scale 0.95, backdrop-blur-md) */}
      <EmilModal
        isOpen={showForgotModal}
        onClose={() => setShowForgotModal(false)}
        maxWidth="max-w-md"
      >
        <div className="space-y-4 sm:space-y-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 sm:p-3 bg-amber-500/10 rounded-xl border border-amber-500/20 text-amber-500 shrink-0">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-text-primary font-heading">Forgot Password?</h3>
              <p className="text-[11px] sm:text-xs text-text-muted font-medium">Contact administration for assistance</p>
            </div>
          </div>

          <div className="p-3.5 sm:p-4 rounded-xl bg-surface-secondary/70 border border-separator space-y-2 text-xs sm:text-sm text-text-muted">
            <p>
              Your account is managed by the institutional administrator. To reset your credentials:
            </p>
            <ul className="list-disc list-inside space-y-1 text-xs text-text-muted font-mono">
              <li>Contact club faculty/committee</li>
              <li>Provide your registered roll number</li>
              <li>Request a secure reset passkey</li>
            </ul>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <EmilButton
              variant="outline"
              className="flex-1"
              onClick={() => {
                navigator.clipboard.writeText('support@codecircle.edu');
                toast.success('Admin email copied to clipboard!');
              }}
            >
              <Copy className="w-4 h-4 mr-1.5" />
              Copy Support Email
            </EmilButton>
            <EmilButton
              variant="solid"
              className="flex-1"
              onClick={() => setShowForgotModal(false)}
            >
              Understood
            </EmilButton>
          </div>
        </div>
      </EmilModal>
    </AuthLayout>
  );
};

export default Login;
