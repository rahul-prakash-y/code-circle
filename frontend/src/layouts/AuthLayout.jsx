import React from 'react';
import StellarBackground from '../components/ui/StellarBackground';
import { motion } from 'framer-motion';

const AuthLayout = ({ children, title, subtitle }) => {
  return (
    <div className="h-screen w-full flex items-center justify-center p-4 sm:p-6 lg:p-8 relative selection:bg-blue-500/30 overflow-hidden">
      <StellarBackground />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-[480px] stellar-glass p-8 sm:p-10 relative overflow-hidden"
      >
        {/* Subtle Inner Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-1 bg-gradient-to-r from-transparent via-blue-500/50 to-transparent blur-[2px]" />
        
        <div className="relative z-10">
          <div className="mb-6 text-center">
            {/* Official Club Logo */}
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center shadow-[0_0_40px_rgba(255,255,255,0.15)] overflow-hidden border border-white/10 backdrop-blur-md">
                <img 
                  src="/codecirclelogo.jpeg" 
                  alt="Code Circle Logo" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-3 tracking-tight">
              {title}
            </h2>
            <p className="text-slate-400 text-sm sm:text-base font-medium leading-relaxed max-w-[320px] mx-auto">
              {subtitle}
            </p>
          </div>
          
          {children}
        </div>

        {/* Decorative corner accent */}
        <div className="absolute bottom-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl rounded-full" />
      </motion.div>
    </div>
  );
};

export default AuthLayout;
