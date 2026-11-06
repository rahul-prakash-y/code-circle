import React from 'react';
import BackgroundGradient from '../components/ui/BackgroundGradient';
import { motion } from 'framer-motion';
import ThemeToggle from '../components/ui/ThemeToggle';
import { EMIL_EASE_OUT, DURATION_MODAL } from '../lib/motion';
import { Card, Avatar } from '@heroui/react';

const AuthLayout = ({ children, title, subtitle }) => {
  return (
    <div className="min-h-[100dvh] w-full flex items-center justify-center p-3.5 sm:p-6 lg:p-8 relative selection:bg-accent/20 overflow-y-auto">
      <BackgroundGradient />
      
      {/* Theme Toggle floating in corner */}
      <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-50">
        <ThemeToggle />
      </div>

      {/* Emil Kowalski Rule: Enter from scale(0.95) with 220ms fade-in, frosted backdrop-blur-xl */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: DURATION_MODAL, ease: EMIL_EASE_OUT }}
        className="w-full max-w-[460px] my-auto"
      >
        <Card
          className="w-full p-6 sm:p-8 lg:p-10 relative overflow-hidden rounded-2xl sm:rounded-3xl border border-separator/80 bg-surface/80 backdrop-blur-xl shadow-2xl"
        >
          {/* Subtle Inner Glow — accent colored */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 sm:w-1/2 h-[2px] bg-gradient-to-r from-transparent via-accent/50 to-transparent blur-[1px]" />
          
          <div className="relative z-10">
            <div className="mb-5 sm:mb-6 text-center">
              {/* Official Club Logo */}
              <div className="flex justify-center mb-4 sm:mb-5">
                <Avatar className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-accent-subtle flex items-center justify-center shadow-md overflow-hidden border border-accent/20 backdrop-blur-md">
                  <Avatar.Image 
                    src="/codecirclelogo.jpeg" 
                    alt="Code Circle Logo" 
                    className="w-full h-full object-cover"
                  />
                  <Avatar.Fallback className="text-accent font-bold">CC</Avatar.Fallback>
                </Avatar>
              </div>
              
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-label-primary mb-2 sm:mb-2.5 tracking-tight font-heading">
                {title}
              </h2>
              <p className="text-label-secondary text-xs sm:text-sm font-medium leading-relaxed max-w-[320px] mx-auto">
                {subtitle}
              </p>
            </div>
            
            {children}
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default AuthLayout;
