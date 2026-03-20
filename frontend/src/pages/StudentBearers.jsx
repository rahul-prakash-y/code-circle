import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import StellarBackground from '../components/ui/StellarBackground';
import { Github, Linkedin, Mail, ArrowLeft, Terminal, Shield, Cpu, Layout } from 'lucide-react';

const bearers = [
  {
    name: "Rahul Prakash",
    role: "President",
    specialization: "AI & System Architecture",
    icon: <Shield className="w-6 h-6 text-blue-400" />,
    github: "#",
    linkedin: "#",
    email: "#"
  },
  {
    name: "Sarah Chen",
    role: "Vice President",
    specialization: "Full Stack Development",
    icon: <Terminal className="w-6 h-6 text-purple-400" />,
    github: "#",
    linkedin: "#",
    email: "#"
  },
  {
    name: "Alex Rivera",
    role: "Technical Lead",
    specialization: "Cloud Computing & DevOps",
    icon: <Cpu className="w-6 h-6 text-pink-400" />,
    github: "#",
    linkedin: "#",
    email: "#"
  },
  {
    name: "Mia Wong",
    role: "Design Lead",
    specialization: "UI/UX & Creative Direction",
    icon: <Layout className="w-6 h-6 text-cyan-400" />,
    github: "#",
    linkedin: "#",
    email: "#"
  }
];

const StudentBearers = () => {
  return (
    <div className="min-h-screen w-full relative p-6 sm:p-12 lg:p-20 selection:bg-blue-500/30">
      <StellarBackground />
      
      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-16 flex flex-col items-center text-center"
        >
          <Link 
            to="/login" 
            className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors duration-500 mb-8 self-start stellar-glass px-4 py-2 rounded-xl text-sm font-bold uppercase tracking-widest"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Portal
          </Link>
          
          <h1 className="text-4xl sm:text-6xl font-black text-white mb-6 tracking-tighter">
            STUDENT <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500">BEARERS</span>
          </h1>
          <p className="text-slate-400 max-w-2xl text-lg font-medium leading-relaxed">
            The visionary minds leading Code Circle towards excellence. Our administration is dedicated to fostering a culture of innovation and collaborative growth.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {bearers.map((bearer, index) => (
            <motion.div
              key={bearer.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="stellar-glass p-8 group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4 opacity-50 group-hover:opacity-100 transition-opacity duration-500">
                {bearer.icon}
              </div>
              
              <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 shadow-xl group-hover:bg-blue-500/10 group-hover:border-blue-500/30 transition-all duration-500">
                <span className="text-3xl font-black text-white/20 group-hover:text-blue-400 transition-colors duration-500">
                  {bearer.name.charAt(0)}
                </span>
              </div>
              
              <h3 className="text-xl font-extrabold text-white mb-2 tracking-tight group-hover:text-blue-400 transition-colors duration-500">
                {bearer.name}
              </h3>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-500 mb-4">
                {bearer.role}
              </p>
              <p className="text-slate-400 text-xs font-medium leading-relaxed mb-8">
                {bearer.specialization}
              </p>
              
              <div className="flex items-center gap-4 pt-4 border-t border-white/5">
                <a href={bearer.github} className="text-slate-500 hover:text-white transition-colors duration-500">
                  <Github className="w-5 h-5" />
                </a>
                <a href={bearer.linkedin} className="text-slate-500 hover:text-white transition-colors duration-500">
                  <Linkedin className="w-5 h-5" />
                </a>
                <a href={bearer.email} className="text-slate-500 hover:text-white transition-colors duration-500">
                  <Mail className="w-5 h-5" />
                </a>
              </div>
              
              {/* Subtle hover glow */}
              <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-blue-500/5 blur-3xl rounded-full group-hover:bg-blue-500/20 transition-all duration-700" />
            </motion.div>
          ))}
        </div>
        
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.8 }}
          className="mt-20 pt-12 border-t border-white/5 text-center"
        >
          <p className="text-[10px] uppercase tracking-[0.4em] text-slate-600 font-bold mb-4">Code Circle Administration</p>
          <div className="flex justify-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500/40 animate-pulse" />
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500/40 animate-pulse delay-75" />
            <span className="w-1.5 h-1.5 rounded-full bg-pink-500/40 animate-pulse delay-150" />
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default StudentBearers;
