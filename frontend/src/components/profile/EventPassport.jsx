import React, { useEffect } from 'react';
import { 
  Award, 
  Calendar, 
  MapPin, 
  Users, 
  ExternalLink, 
  CheckCircle2, 
  Clock,
  Loader2 
} from 'lucide-react';
import useAnalyticsStore from '../../store/useAnalyticsStore';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

const PassportTimelineItem = ({ item, index }) => {
  const date = new Date(item.eventDate);
  const isAttended = item.attendanceStatus;

  return (
    <div className="relative pl-12 pb-16 group last:pb-0">
      {/* Connector Line */}
      <div className="absolute left-[13px] top-8 bottom-0 w-[2px] bg-white/5 group-last:hidden" />
      
      {/* Node Dot */}
      <motion.div 
        initial={{ scale: 0 }}
        whileInView={{ scale: 1 }}
        viewport={{ once: true }}
        className={`absolute left-0 top-3 w-7 h-7 rounded-xl border bg-black z-10 flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:bg-blue-500 group-hover:border-blue-500
          ${isAttended ? 'border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.3)]' : 'border-white/20'}`}
      >
        {isAttended ? (
          <CheckCircle2 size={14} strokeWidth={3} className="text-blue-500 group-hover:text-white" />
        ) : (
          <Clock size={14} strokeWidth={3} className="text-slate-600 group-hover:text-white" />
        )}
      </motion.div>

      {/* Content Card */}
      <motion.div 
        initial={{ x: 20, opacity: 0 }}
        whileInView={{ x: 0, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: index * 0.1, duration: 0.6 }}
        className="stellar-glass p-8 group-hover:border-blue-500/30 group-hover:shadow-[0_20px_40px_-15px_rgba(59,130,246,0.1)] transition-all duration-500"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className={`text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-lg border 
                ${isAttended ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-white/5 border-white/10 text-slate-500'}`}>
                {isAttended ? 'Validated' : 'Scheduled'}
              </span>
              <span className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">{format(date, 'MMMM dd, yyyy')}</span>
            </div>
            
            <h3 className="text-2xl font-black text-white group-hover:text-blue-400 transition-colors uppercase tracking-tight leading-none">
              {item.eventTitle}
            </h3>
            
            <div className="flex flex-wrap items-center gap-6 text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">
              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-blue-500" />
                <span>{format(date, 'hh:mm a')}</span>
              </div>
              <div className="flex items-center gap-2">
                {item.type === 'Team' ? <Users size={14} className="text-blue-500" /> : <MapPin size={14} className="text-blue-500" />}
                <span>{item.type} {item.teamName ? `/ ${item.teamName}` : ''}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start md:self-center">
            {item.certificateUrl ? (
              <a 
                href={item.certificateUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="stellar-btn py-2.5! px-6! text-[10px]! uppercase! tracking-widest! flex items-center gap-2 group/btn"
              >
                <Award size={16} strokeWidth={2.5} className="group-hover/btn:rotate-12 transition-transform" />
                <span>Credential</span>
                <ExternalLink size={14} strokeWidth={3} />
              </a>
            ) : (
              isAttended && (
                <div className="bg-white/5 px-4 py-2 rounded-xl border border-white/5 text-slate-500 text-[9px] font-black uppercase tracking-widest flex items-center gap-2 animate-pulse">
                  <Clock size={14} />
                  Verification Pending
                </div>
              )
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const EventPassport = () => {
  const { passport, loading, fetchPassport } = useAnalyticsStore();

  useEffect(() => {
    fetchPassport();
  }, [fetchPassport]);

  if (loading && passport.length === 0) {
    return (
      <div className="flex items-center justify-center py-40">
        <Loader2 className="animate-spin text-blue-500" size={40} />
      </div>
    );
  }

  if (passport.length === 0) {
    return (
      <div className="text-center py-32 stellar-glass p-12 max-w-xl mx-auto space-y-6">
        <div className="inline-flex p-6 rounded-[2.5rem] bg-blue-500/5 text-blue-500/20 mb-4 border border-blue-500/10">
          <Calendar size={64} strokeWidth={1} />
        </div>
        <div className="space-y-2">
          <h3 className="text-2xl font-black text-white uppercase tracking-tight">Timeline Empty</h3>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] leading-relaxed">Your professional journey awaits. Enroll in coding challenges and masterclasses to build your legacy.</p>
        </div>
        <button 
           onClick={() => window.location.href = '/dashboard'}
           className="stellar-btn opacity-50 hover:opacity-100"
        >
          Explore Events
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-12 px-6">
      <div className="flex items-center justify-between mb-20">
        <div className="space-y-2">
          <h2 className="text-4xl font-black text-white tracking-tighter uppercase">Service <span className="text-blue-500">Record</span></h2>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Your chronological deployment history at Code Circle</p>
        </div>
        <div className="w-16 h-16 bg-blue-500/10 rounded-[1.5rem] border border-blue-500/20 text-blue-400 flex items-center justify-center shadow-[0_0_30px_rgba(59,130,246,0.1)]">
          <Award size={32} strokeWidth={2.5} />
        </div>
      </div>

      <div className="relative">
        {passport.map((item, index) => (
          <PassportTimelineItem key={item._id || item.id} item={item} index={index} />
        ))}
      </div>
    </div>
  );
};

export default EventPassport;
