import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Users, Clock, Edit2, Trash2, ArrowUpRight, UserCheck } from 'lucide-react';
import { format, differenceInDays, differenceInHours, differenceInMinutes } from 'date-fns';
import EnrollmentModal from './EnrollmentModal';
import AttendanceDashboard from '../admin/AttendanceDashboard';
import useEnrollmentStore from '../../store/useEnrollmentStore';
import { motion } from 'framer-motion';

const EventCard = ({ event, isAdmin = false, onEdit, onDelete }) => {
  const { myEnrolledEventIds } = useEnrollmentStore();
  const isEnrolled = myEnrolledEventIds.includes(event._id);
  const [timeLeft, setTimeLeft] = useState('');
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [isAttendanceOpen, setIsAttendanceOpen] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const deadline = new Date(event.registrationDeadline);
      const now = new Date();
      
      if (deadline < now) {
        setTimeLeft('Closed');
        return;
      }

      const days = differenceInDays(deadline, now);
      const hours = differenceInHours(deadline, now) % 24;
      const minutes = differenceInMinutes(deadline, now) % 60;

      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h left`);
      } else if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m left`);
      } else {
        setTimeLeft(`${minutes}m left`);
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 60000);
    return () => clearInterval(timer);
  }, [event.registrationDeadline]);

  const isPast = new Date(event.date) < new Date();

  return (
    <>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="group relative glass p-6 sm:p-8 hover:border-accent/30 transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] flex flex-col justify-between h-full"
      >
        {/* Type, Format & Status Badges */}
        <div className="absolute top-5 right-5 flex flex-wrap gap-1.5 items-center justify-end max-w-[200px]">
          {event.status && (
            <span className={`px-2.5 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider border ${
              event.status === 'Live'
                ? 'bg-red-500/15 text-red-500 dark:text-red-400 border-red-500/30 animate-pulse'
                : event.status === 'Completed'
                ? 'bg-surface-elevated text-text-muted border-border'
                : event.status === 'Cancelled'
                ? 'bg-rose-500/15 text-rose-500 dark:text-rose-400 border-rose-500/30'
                : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
            }`}>
              {event.status}
            </span>
          )}

          <span className={`px-2.5 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider border ${
            event.type === 'Technical'
              ? 'bg-accent/10 text-blue-600 dark:text-accent-muted border-accent/20'
              : event.type === 'Non-Technical'
              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
              : event.type === 'Lecture'
              ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20'
              : event.type === 'Workshop'
              ? 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20'
              : 'bg-accent/10 text-blue-600 dark:text-accent-muted border-accent/20'
          }`}>
            {event.type || 'Technical'}
          </span>

          <span className="px-2.5 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20">
            {event.format === 'Team' || event.type === 'Team' ? 'Squad' : 'Solo'}
          </span>
        </div>

        {/* Main Content */}
        <div className="space-y-5">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-surface-elevated rounded-xl border border-border group-hover:border-accent/30 transition-all duration-300 text-accent">
                <Calendar size={18} />
              </div>
              <div>
                <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider leading-none mb-1">Schedule</p>
                <span className="text-sm font-semibold text-text-primary">
                  {format(new Date(event.date), 'MMMM dd, yyyy')}
                </span>
              </div>
            </div>
            
            <div className="pt-1">
              <h3 className="text-xl font-bold text-text-primary group-hover:text-accent transition-colors duration-300 tracking-tight leading-tight mb-2 font-heading">
                {event.title}
              </h3>
              <p className="text-text-muted text-sm line-clamp-2 leading-relaxed">
                {event.description}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 py-1">
            <div className="flex items-center gap-2 bg-surface-elevated px-3 py-1.5 rounded-lg border border-border text-text-secondary text-[11px] font-medium">
              <MapPin size={13} className="text-rose-500" />
              <span className="truncate max-w-[120px]">{event.venueOrLink}</span>
            </div>
            {event.type === 'Team' && (
              <div className="flex items-center gap-2 bg-surface-elevated px-3 py-1.5 rounded-lg border border-border text-text-secondary text-[11px] font-medium">
                <Users size={13} className="text-accent" />
                <span>Max {event.maxParticipants}</span>
              </div>
            )}
          </div>
        </div>

        {/* Action / Countdown */}
        <div className="mt-6 pt-5 flex items-center justify-between border-t border-border">
          <div className="flex flex-col">
            <span className="text-[9px] text-text-muted uppercase font-bold tracking-wider mb-1 ml-0.5">Deadline</span>
            <div className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider ${
              timeLeft === 'Closed' || isPast ? 'text-destructive' : 'text-success'
            }`}>
              <Clock size={13} strokeWidth={3} />
              {timeLeft}
            </div>
          </div>

          <div className="flex gap-2">
            {isAdmin ? (
              <div className="flex bg-surface-elevated rounded-xl border border-border p-0.5">
                <button
                  onClick={() => onEdit(event)}
                  className="p-2 text-text-muted hover:text-text-primary hover:bg-surface-elevated rounded-lg transition-all"
                  title="Edit Event"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => setIsAttendanceOpen(true)}
                  className="p-2 text-success hover:bg-success/10 rounded-lg transition-all"
                  title="Attendance"
                >
                  <UserCheck size={16} />
                </button>
                <button
                  onClick={() => onDelete(event._id)}
                  className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-all"
                  title="Delete Event"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ) : (
              <button 
                onClick={() => !isEnrolled && setIsEnrollModalOpen(true)}
                disabled={timeLeft === 'Closed' || isPast || isEnrolled}
                className={`btn-primary py-2 px-5 text-xs uppercase tracking-wider flex items-center gap-2 ${
                  isEnrolled ? '!bg-success/10 !text-success !border-success/20 !shadow-none' : ''
                }`}
              >
                <span>{isEnrolled ? 'Enrolled' : (timeLeft === 'Closed' || isPast ? (isPast ? 'Ended' : 'Closed') : 'Enroll Now')}</span>
                {!isPast && timeLeft !== 'Closed' && !isEnrolled && <ArrowUpRight size={13} strokeWidth={3} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />}
              </button>
            )}
          </div>
        </div>
      </motion.div>

      <EnrollmentModal 
        isOpen={isEnrollModalOpen} 
        onClose={() => setIsEnrollModalOpen(false)} 
        event={event} 
      />

      <AttendanceDashboard 
        isOpen={isAttendanceOpen} 
        onClose={() => setIsAttendanceOpen(false)} 
        event={event} 
      />
    </>
  );
};

export default EventCard;
