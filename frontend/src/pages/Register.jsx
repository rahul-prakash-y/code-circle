import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import AuthLayout from '../layouts/AuthLayout';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Mail, Lock, User, Hash, Loader2 } from 'lucide-react';
import { HeroInput } from '../components/ui/HeroUIComponents';
import { Button } from '@heroui/react';

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

  const fieldVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0 }
  };

  const fields = [
    { label: 'Full Name', icon: User, type: 'text', placeholder: 'John Doe', value: name, onChange: setName },
    { label: 'University Roll Number', icon: Hash, type: 'text', placeholder: 'Ex: 2021CSE001', value: rollNo, onChange: setRollNo },
    { label: 'Email Address', icon: Mail, type: 'email', placeholder: 'name@university.edu', value: email, onChange: setEmail },
    { label: 'Password', icon: Lock, type: 'password', placeholder: '••••••••', value: password, onChange: setPassword },
  ];

  return (
    <AuthLayout 
      title="Join the Circle" 
      subtitle="Create your professional identity and start collaborating today."
    >
      <motion.form 
        onSubmit={handleRegister} 
        className="space-y-3.5 sm:space-y-4"
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
        {fields.map((field) => (
          <motion.div key={field.label} variants={fieldVariants}>
            <HeroInput
              label={field.label}
              labelPlacement="inside"
              variant="flat"
              type={field.type}
              placeholder={field.placeholder}
              value={field.value}
              onChange={(e) => field.onChange(e.target.value)}
              startContent={<field.icon className="w-4 h-4 text-text-muted" />}
              isRequired
            />
          </motion.div>
        ))}

        <motion.div 
          variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}
          className="pt-2"
        >
          <Button 
            type="submit" 
            variant="primary"
            isLoading={loading}
            size="lg"
            className="w-full py-3.5 min-h-[48px] text-sm sm:text-base font-semibold shadow-lg shadow-accent/15"
          >
            Create Account
          </Button>
        </motion.div>

        <motion.p 
          variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}
          className="text-center text-text-muted text-xs sm:text-sm mt-4 sm:mt-6 flex flex-col gap-2"
        >
          <span>
            Already have an account?{' '}
            <Link to="/login" className="text-text-primary font-semibold hover:text-accent transition-colors duration-300 underline underline-offset-4 decoration-border hover:decoration-accent/40">
              Sign In
            </Link>
          </span>
        </motion.p>
      </motion.form>
    </AuthLayout>
  );
};

export default Register;
