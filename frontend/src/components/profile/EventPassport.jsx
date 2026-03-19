import React, { useEffect } from 'react';
import { 
  Award, 
  Calendar, 
  MapPin, 
  Users, 
  ExternalLink, 
  CheckCircle2, 
  Clock 
} from 'lucide-react';
import useAnalyticsStore from '../../store/useAnalyticsStore';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

const PassportTimelineItem = ({ item, index }) => {
  const date = new Date(item.eventDate);
  const isAttended = item.attendanceStatus;

  return (
    <div className="relative pl-8 pb-12 group last:pb-0">
      {/* Connector Line */}
      <div className="absolute left-[11px] top-2 bottom-0 w-[2px] bg-white/5 group-last:hidden" />
      
      {/* Node Dot */}
      <motion.div 
        initial={{ scale: 0 }}
        whileInView={{ scale: 1 }}
        viewport={{ once: true }}
        className={`absolute left-0 top-1 w-6 h-6 rounded-full border-2 bg-slate-900 z-10 flex items-center justify-center
          ${isAttended ? 'border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'border-white/20'}`}
      >
        {isAttended ? (
          <CheckCircle2 size={12} className="text-emerald-500" />
        ) : (
          <Clock size={12} className="text-white/40" />
        )}
      </motion.div>

      {/* Content Card */}
      <motion.div 
        initial={{ x: 20, opacity: 0 }}
        whileInView={{ x: 0, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: index * 0.1 }}
        className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md shadow-xl hover:border-indigo-500/50 transition-all group-hover:bg-white/8"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border 
                ${isAttended ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-white/5 border-white/10 text-white/40'}`}>
                {isAttended ? 'Completed' : 'Upcoming'}
              </span>
              <span className="text-white/30 text-xs">{format(date, 'MMM dd, yyyy')}</span>
            </div>
            <h3 className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors uppercase tracking-tight">
              {item.eventTitle}
            </h3>
            
            <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-white/50">
              <div className="flex items-center gap-1.5">
                <Calendar size={14} className="text-indigo-400" />
                {format(date, 'hh:mm a')}
              </div>
              <div className="flex items-center gap-1.5">
                {item.type === 'Team' ? <Users size={14} className="text-indigo-400" /> : <MapPin size={14} className="text-indigo-400" />}
                {item.type} {item.teamName ? `(${item.teamName})` : ''}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start md:self-center">
            {item.certificateUrl ? (
              <a 
                href={item.certificateUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/20 transition-all hover:scale-105 active:scale-95"
              >
                <Award size={16} />
                View Certificate
                <ExternalLink size={14} />
              </a>
            ) : (
              isAttended && (
                <div className="text-white/20 text-xs font-medium italic flex items-center gap-2">
                  <Clock size={14} />
                  Certificate Processing
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
      <div className="flex items-center justify-center p-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (passport.length === 0) {
    return (
      <div className="text-center p-20 bg-white/5 rounded-3xl border border-white/10">
        <div className="inline-block p-4 rounded-full bg-indigo-500/10 text-indigo-400 mb-4">
          <Calendar size={48} />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Your Career Timeline is Empty</h3>
        <p className="text-white/40 max-w-md mx-auto">Start enrolling in events and coding challenges to build your professional portfolio and earn certificates.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8">
      <div className="flex items-center justify-between mb-12">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight uppercase">Event <span className="text-indigo-500">Passport</span></h2>
          <p className="text-white/40 text-sm">Your chronological journey through Code Circle</p>
        </div>
        <div className="p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 text-indigo-400">
          <Award size={28} />
        </div>
      </div>

      <div className="relative">
        {passport.map((item, index) => (
          <PassportTimelineItem key={item.id} item={item} index={index} />
        ))}
      </div>
    </div>
  );
};

export default EventPassport;
