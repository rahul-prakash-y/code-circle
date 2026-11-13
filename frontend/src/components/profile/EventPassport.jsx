import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button, Link as HeroLink } from '@heroui/react';
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
  const parseSafeDate = (d) => {
    if (!d) return null;
    const parsed = new Date(d);
    return isNaN(parsed.getTime()) ? null : parsed;
  };

  const dateObj = parseSafeDate(item.eventDate) || parseSafeDate(item.createdAt);
  const isAttended = item.attendanceStatus;

  const formattedDate = dateObj ? format(dateObj, 'MMMM dd, yyyy') : 'Date TBA';
  const formattedTime = dateObj ? format(dateObj, 'hh:mm a') : 'Time TBA';

  return (
    <div className="relative pl-8 sm:pl-12 pb-8 sm:pb-14 group last:pb-0">
      {/* Connector Line */}
      <div className="absolute left-[11px] sm:left-[13px] top-7 bottom-0 w-[2px] bg-surface-elevated group-last:hidden" />
      
      {/* Node Dot */}
      <motion.div 
        initial={{ scale: 0 }}
        whileInView={{ scale: 1 }}
        viewport={{ once: true }}
        className={`absolute left-0 top-2 sm:top-3 w-6 h-6 sm:w-7 sm:h-7 rounded-xl border bg-black z-10 flex items-center justify-center transition-all duration-300 group-hover:scale-105 group-hover:bg-accent-muted group-hover:border-blue-500
          ${isAttended ? 'border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.25)]' : 'border-border-hover'}`}
      >
        {isAttended ? (
          <CheckCircle2 size={13} strokeWidth={2} className="text-accent group-hover:text-text-primary" />
        ) : (
          <Clock size={13} strokeWidth={2} className="text-text-muted group-hover:text-text-primary" />
        )}
      </motion.div>

      {/* Content Card */}
      <motion.div 
        initial={{ x: 20, opacity: 0 }}
        whileInView={{ x: 0, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: index * 0.1, duration: 0.5 }}
        className="glass p-4 sm:p-6 lg:p-7 rounded-2xl sm:rounded-3xl group-hover:border-accent/30 group-hover:shadow-[0_20px_40px_-15px_rgba(59,130,246,0.1)] transition-all duration-300"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 sm:gap-6">
          <div className="space-y-3 sm:space-y-3.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`text-[11px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-lg border 
                ${isAttended ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-accent/10 border-accent/20 text-accent-muted'}`}>
                {isAttended ? 'Verified present' : 'Registered'}
              </span>

              {item.clubHoursText && (
                <span className="text-xs font-mono font-medium tabular-nums px-2 py-0.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center gap-1">
                  <Clock size={11} />
                  <span>Hours: {item.clubHoursText}</span>
                </span>
              )}

              {item.pointsAwarded > 0 && (
                <span className="text-xs font-mono font-medium tabular-nums px-2 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  +{item.pointsAwarded} pts
                </span>
              )}

              <span className="text-text-muted font-medium uppercase tracking-wider text-[11px]">{formattedDate}</span>
            </div>
            
            <h3 className="text-lg sm:text-xl font-semibold text-text-primary group-hover:text-accent-muted transition-colors tracking-tight leading-snug">
              {item.eventTitle || 'Untitled Event'}
            </h3>

            {item.sessionName && (
              <p className="text-xs text-text-muted font-normal">
                Session: <span className="text-text-primary font-medium">{item.sessionName}</span>
              </p>
            )}
            
            <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
              <div className="flex items-center gap-1.5">
                <Calendar size={13} className="text-accent" />
                <span>{formattedTime}</span>
              </div>
              <div className="flex items-center gap-1.5">
                {item.type === 'Team' ? <Users size={13} className="text-accent" /> : <MapPin size={13} className="text-accent" />}
                <span>{item.type || 'Individual'} {item.teamName ? `(${item.teamName})` : ''}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-center shrink-0">
            {item.certificateUrl ? (
              <Button
                as={HeroLink}
                target="_blank" rel="noopener noreferrer"
                href={item.certificateUrl}
                color="primary"
                variant="solid"
                startContent={<Award size={14} className="group-hover/btn:rotate-12 transition-transform" />}
                endContent={<ExternalLink size={12} />}
                className="btn-primary py-2 px-4 text-xs font-medium flex items-center gap-2 group/btn min-h-[38px]"
              >
                Certificate
              </Button>
            ) : (
              isAttended ? (
                <div className="bg-surface-elevated px-3 py-1.5 rounded-xl border border-border text-text-muted text-xs font-medium flex items-center gap-1.5 min-h-[36px]">
                  <Clock size={13} />
                  <span>Preparing certificate</span>
                </div>
              ) : (
                <div className="bg-blue-500/5 px-3 py-1.5 rounded-xl border border-blue-500/10 text-accent-muted text-xs font-medium flex items-center gap-1.5 min-h-[36px]">
                  <Clock size={13} />
                  <span>Upcoming event</span>
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
      <div className="flex items-center justify-center py-32 sm:py-40">
        <Loader2 className="animate-spin text-accent" size={36} />
      </div>
    );
  }

  if (passport.length === 0) {
    return (
      <div className="text-center py-20 sm:py-28 glass p-6 sm:p-12 max-w-xl mx-auto space-y-5 rounded-3xl">
        <div className="inline-flex p-5 sm:p-6 rounded-[2rem] bg-blue-500/5 text-blue-500/30 mb-2 border border-blue-500/10">
          <Calendar size={44} strokeWidth={1.5} />
        </div>
        <div className="space-y-1.5">
          <h3 className="text-xl sm:text-2xl font-semibold text-text-primary tracking-tight">No event history yet</h3>
          <p className="text-text-muted font-normal text-xs leading-relaxed max-w-md mx-auto">
            You haven&apos;t registered for any events yet. Check out the Events feed to explore upcoming hackathons, coding workshops, and club sessions.
          </p>
        </div>
        <div className="pt-2">
          <Link 
             to="/events"
             className="btn-primary inline-flex items-center justify-center py-2.5 px-6 min-h-[44px] text-xs font-medium"
          >
            Browse upcoming events
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-2 sm:py-6 px-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 sm:mb-12">
        <div className="space-y-1">
          <h2 className="text-2xl sm:text-3xl font-semibold text-text-primary tracking-tight leading-[1.15]">
            Event <span className="text-accent">history</span>
          </h2>
          <p className="text-text-muted text-xs font-normal">
            Track your registered events, attendance validation, and participation certificates.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/points"
            className="btn-secondary py-2 px-4 min-h-[40px] text-xs font-medium flex items-center gap-1.5 cursor-pointer"
          >
            <span>View my points</span>
          </Link>
          <div className="w-12 h-12 sm:w-14 sm:h-14 bg-accent/10 rounded-2xl border border-accent/20 text-accent-muted flex items-center justify-center shadow-xs shrink-0">
            <Award size={22} />
          </div>
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
