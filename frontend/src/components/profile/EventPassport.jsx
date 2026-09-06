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
      <div className="absolute left-[13px] top-8 bottom-0 w-[2px] bg-surface-elevated group-last:hidden" />
      
      {/* Node Dot */}
      <motion.div 
        initial={{ scale: 0 }}
        whileInView={{ scale: 1 }}
        viewport={{ once: true }}
        className={`absolute left-0 top-3 w-7 h-7 rounded-xl border bg-black z-10 flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:bg-accent-muted group-hover:border-blue-500
          ${isAttended ? 'border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.3)]' : 'border-border-hover'}`}
      >
        {isAttended ? (
          <CheckCircle2 size={14} strokeWidth={3} className="text-accent group-hover:text-text-primary" />
        ) : (
          <Clock size={14} strokeWidth={3} className="text-text-muted group-hover:text-text-primary" />
        )}
      </motion.div>

      {/* Content Card */}
      <motion.div 
        initial={{ x: 20, opacity: 0 }}
        whileInView={{ x: 0, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: index * 0.1, duration: 0.6 }}
        className="glass p-8 group-hover:border-accent/30 group-hover:shadow-[0_20px_40px_-15px_rgba(59,130,246,0.1)] transition-all duration-500"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className={`text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-lg border 
                ${isAttended ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-accent/10 border-accent/20 text-accent-muted'}`}>
                {isAttended ? 'Attended' : 'Registered'}
              </span>
              <span className="text-text-muted font-bold uppercase tracking-widest text-[10px]">{format(date, 'MMMM dd, yyyy')}</span>
            </div>
            
            <h3 className="text-2xl font-black text-text-primary group-hover:text-accent-muted transition-colors uppercase tracking-tight leading-none">
              {item.eventTitle}
            </h3>
            
            <div className="flex flex-wrap items-center gap-6 text-[10px] font-black uppercase tracking-[0.15em] text-text-muted">
              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-accent" />
                <span>{format(date, 'hh:mm a')}</span>
              </div>
              <div className="flex items-center gap-2">
                {item.type === 'Team' ? <Users size={14} className="text-accent" /> : <MapPin size={14} className="text-accent" />}
                <span>{item.type} {item.teamName ? `(${item.teamName})` : ''}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start md:self-center">
            {item.certificateUrl ? (
              <a 
                href={item.certificateUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="btn-primary py-2.5! px-6! text-[10px]! uppercase! tracking-widest! flex items-center gap-2 group/btn"
              >
                <Award size={16} strokeWidth={2.5} className="group-hover/btn:rotate-12 transition-transform" />
                <span>Certificate</span>
                <ExternalLink size={14} strokeWidth={3} />
              </a>
            ) : (
              isAttended ? (
                <div className="bg-surface-elevated px-4 py-2 rounded-xl border border-border text-text-muted text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
                  <Clock size={14} />
                  Certificate In Preparation
                </div>
              ) : (
                <div className="bg-blue-500/5 px-4 py-2 rounded-xl border border-blue-500/10 text-accent-muted text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
                  <Clock size={14} />
                  Upcoming Event
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
        <Loader2 className="animate-spin text-accent" size={40} />
      </div>
    );
  }

  if (passport.length === 0) {
    return (
      <div className="text-center py-32 glass p-12 max-w-xl mx-auto space-y-6">
        <div className="inline-flex p-6 rounded-[2.5rem] bg-blue-500/5 text-blue-500/20 mb-4 border border-blue-500/10">
          <Calendar size={64} strokeWidth={1} />
        </div>
        <div className="space-y-2">
          <h3 className="text-2xl font-black text-text-primary uppercase tracking-tight">No Event History Yet</h3>
          <p className="text-text-muted font-medium text-xs leading-relaxed">
            You haven't registered for any events yet. Check out the Events Feed to explore upcoming hackathons, coding workshops, and club sessions!
          </p>
        </div>
        <button 
           onClick={() => window.location.href = '/dashboard'}
           className="btn-primary"
        >
          Browse Upcoming Events
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-6">
      <div className="flex items-center justify-between mb-16">
        <div className="space-y-2">
          <h2 className="text-3xl font-black text-text-primary tracking-tight uppercase">
            My Event <span className="text-accent">History</span>
          </h2>
          <p className="text-text-muted text-xs font-semibold">
            Track your registered events, attendance validation, and participation certificates.
          </p>
        </div>
        <div className="w-14 h-14 bg-accent/10 rounded-2xl border border-accent/20 text-accent-muted flex items-center justify-center shadow-[0_0_30px_rgba(59,130,246,0.1)]">
          <Award size={28} strokeWidth={2.5} />
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
