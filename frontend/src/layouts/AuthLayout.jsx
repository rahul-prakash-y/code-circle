import React from 'react';
import BackgroundGradient from '../components/ui/BackgroundGradient';
import { motion } from 'framer-motion';
import ThemeToggle from '../components/ui/ThemeToggle';

const AuthLayout = ({ children, title, subtitle }) => {
  return (
    <div className="h-screen w-full flex items-center justify-center p-4 sm:p-6 lg:p-8 relative selection:bg-violet-500/20 overflow-hidden">
      <BackgroundGradient />
      
      {/* Theme Toggle floating in corner */}
      <div className="absolute top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-[480px] glass-elevated p-8 sm:p-10 relative overflow-hidden rounded-3xl"
      >
        {/* Subtle Inner Glow — accent colored */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-[2px] bg-gradient-to-r from-transparent via-accent/50 to-transparent blur-[1px]" />
        
        <div className="relative z-10">
          <div className="mb-6 text-center">
            {/* Official Club Logo */}
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center shadow-lg overflow-hidden border border-accent/20 backdrop-blur-md">
                <img 
                  src="/codecirclelogo.jpeg" 
                  alt="Code Circle Logo" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            
            <h2 className="text-3xl sm:text-4xl font-extrabold text-text-primary mb-3 tracking-tight font-heading">
              {title}
            </h2>
            <p className="text-text-muted text-sm sm:text-base font-medium leading-relaxed max-w-[320px] mx-auto">
              {subtitle}
            </p>
          </div>
          
          {children}
        </div>

        {/* Decorative corner accent */}
        <div className="absolute bottom-0 right-0 w-32 h-32 bg-accent/5 blur-3xl rounded-full" />
      </motion.div>
    </div>
  );
};

export default AuthLayout;
