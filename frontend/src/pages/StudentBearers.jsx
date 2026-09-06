import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import BackgroundGradient from '../components/ui/BackgroundGradient';
import useBearerStore from '../store/useBearerStore';
import { Github, Linkedin, Mail, Instagram, ArrowLeft, Terminal, Shield, Cpu, Layout, Loader2 } from 'lucide-react';

const iconMap = {
  Shield: <Shield className="w-6 h-6 text-accent-muted" />,
  Terminal: <Terminal className="w-6 h-6 text-purple-400" />,
  Cpu: <Cpu className="w-6 h-6 text-pink-400" />,
  Layout: <Layout className="w-6 h-6 text-cyan-400" />
};

const StudentBearers = () => {
  const { bearers, loading, fetchBearers } = useBearerStore();

  useEffect(() => {
    fetchBearers();
  }, [fetchBearers]);

  return (
    <div className="min-h-screen w-full relative p-8 sm:p-12 lg:p-24 selection:bg-blue-500/30 overflow-x-hidden">
      <BackgroundGradient />
      
      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="mb-24 flex flex-col items-center text-center space-y-8"
        >
          <Link 
            to="/login" 
            className="flex items-center gap-3 text-text-muted hover:text-text-primary transition-all duration-500 glass px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] border-border hover:border-accent/30 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Login
          </Link>
          
          <div className="space-y-4">
            <h1 className="text-5xl sm:text-7xl font-black text-text-primary tracking-tighter uppercase">
              Club <span className="text-accent">Office Bearers</span>
            </h1>
            <p className="text-text-muted max-w-2xl text-xs font-semibold uppercase tracking-[0.2em] leading-relaxed mx-auto">
              Meet the student leadership team and coordinators driving Code Circle events and workshops.
            </p>
          </div>
          
          <div className="flex gap-2 opacity-50">
            <div className="w-12 h-px bg-linear-to-r from-transparent to-blue-500" />
            <div className="w-2 h-2 rounded-full border border-blue-500" />
            <div className="w-12 h-px bg-linear-to-l from-transparent to-blue-500" />
          </div>
        </motion.div>

        {loading ? (
          <div className="flex justify-center items-center py-40">
            <Loader2 className="w-16 h-16 text-accent animate-spin" strokeWidth={1} />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
            {bearers.map((bearer, index) => (
              <motion.div
                key={bearer._id}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
                className="glass p-10 group relative overflow-hidden flex flex-col items-center text-center"
              >
                <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:opacity-100 group-hover:text-accent transition-all duration-700 -rotate-12 group-hover:rotate-0">
                  {iconMap[bearer.iconType] || <Shield className="w-8 h-8" />}
                </div>
                
                <div className="relative mb-8">
                  <div className="w-28 h-28 rounded-[2.5rem] bg-surface-elevated border border-border overflow-hidden shadow-2xl group-hover:border-blue-500/50 transition-all duration-700 p-1">
                    <div className="w-full h-full rounded-[2.2rem] overflow-hidden">
                      {bearer.profilePicUrl ? (
                        <img 
                          src={bearer.profilePicUrl} 
                          alt={bearer.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-blue-500/5 text-blue-500/20 group-hover:text-accent-muted transition-colors duration-500">
                          <span className="text-4xl font-black uppercase">
                            {bearer.name.charAt(0)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-surface border border-border rounded-2xl flex items-center justify-center text-accent shadow-2xl group-hover:scale-110 transition-transform">
                     {iconMap[bearer.iconType] ? React.cloneElement(iconMap[bearer.iconType], { size: 18 }) : <Shield size={18} />}
                  </div>
                </div>
                
                <div className="space-y-4 flex-1">
                  <div className="space-y-1">
                    <h3 className="text-2xl font-black text-text-primary tracking-tight uppercase group-hover:text-accent-muted transition-colors duration-500">
                      {bearer.name}
                    </h3>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500/60 group-hover:text-accent transition-colors duration-500">
                      {bearer.role}
                    </p>
                  </div>
                  
                  <p className="text-text-muted text-[11px] font-bold uppercase tracking-widest leading-relaxed">
                    {bearer.specialization}
                  </p>
                </div>
                
                <div className="flex items-center gap-6 pt-8 mt-8 border-t border-border w-full justify-center">
                  {bearer.socialLinks?.github && (
                    <a href={bearer.socialLinks.github} target="_blank" rel="noopener noreferrer" className="text-text-muted hover:text-text-primary transition-all duration-500 hover:scale-110">
                      <Github size={18} />
                    </a>
                  )}
                  {bearer.socialLinks?.linkedin && (
                    <a href={bearer.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="text-text-muted hover:text-text-primary transition-all duration-500 hover:scale-110">
                      <Linkedin size={18} />
                    </a>
                  )}
                  {bearer.socialLinks?.instagram && (
                    <a href={bearer.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="text-text-muted hover:text-text-primary transition-all duration-500 hover:scale-110">
                      <Instagram size={18} />
                    </a>
                  )}
                  {bearer.socialLinks?.email && (
                    <a href={`mailto:${bearer.socialLinks.email}`} className="text-text-muted hover:text-text-primary transition-all duration-500 hover:scale-110">
                      <Mail size={18} />
                    </a>
                  )}
                </div>
                
                {/* Accent Glow */}
                <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-blue-500/5 blur-[60px] rounded-full group-hover:bg-accent/10 transition-all duration-1000" />
              </motion.div>
            ))}
          </div>
        )}
        
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1 }}
          className="mt-32 pt-16 border-t border-border text-center space-y-6"
        >
          <p className="text-[9px] font-black uppercase tracking-[0.5em] text-text-muted">Code Circle Student Leadership 2026</p>
          <div className="flex justify-center gap-3">
             {[...Array(3)].map((_, i) => (
               <div key={i} className={`w-1 h-1 rounded-full bg-accent/20 animate-pulse`} style={{ animationDelay: `${i * 150}ms` }} />
             ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default StudentBearers;
