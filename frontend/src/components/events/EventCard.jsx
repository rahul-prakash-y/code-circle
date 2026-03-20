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
        className="group relative stellar-glass p-8 hover:border-blue-500/30 transition-all duration-500 active:scale-[0.99] flex flex-col justify-between h-full"
      >
        {/* Type Badge */}
        <div className="absolute top-6 right-6 flex gap-2">
          <span className={`px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] border shadow-2xl ${
            event.type === 'Individual' 
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
              : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
          }`}>
            {event.type === 'Individual' ? 'Solo' : 'Squad'}
          </span>
          {isPast && (
            <span className="px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] bg-white/5 text-slate-500 border-white/10 border">
              Closed
            </span>
          )}
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/5 rounded-2xl border border-white/5 group-hover:border-blue-500/30 transition-all duration-500 text-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.1)] group-hover:shadow-[0_0_25px_rgba(59,130,246,0.3)]">
                <Calendar size={20} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Schedule</p>
                <span className="text-sm font-bold text-white">
                  {format(new Date(event.date), 'MMMM dd, yyyy')}
                </span>
              </div>
            </div>
            
            <div className="pt-2">
              <h3 className="text-2xl font-black text-white group-hover:text-blue-400 transition-colors duration-500 tracking-tight leading-tight mb-2">
                {event.title}
              </h3>
              <p className="text-slate-400 text-sm line-clamp-2 leading-relaxed font-medium">
                {event.description}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 py-1">
            <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-xl border border-white/5 text-slate-300 text-[11px] font-bold">
              <MapPin size={14} className="text-pink-500" />
              <span className="truncate max-w-[120px]">{event.venueOrLink}</span>
            </div>
            {event.type === 'Team' && (
              <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-xl border border-white/5 text-slate-300 text-[11px] font-bold">
                <Users size={14} className="text-blue-400" />
                <span>Max {event.maxParticipants}</span>
              </div>
            )}
          </div>
        </div>

        {/* Action / Countdown */}
        <div className="mt-8 pt-6 flex items-center justify-between border-t border-white/5">
          <div className="flex flex-col">
            <span className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-1.5 ml-0.5">Deadline</span>
            <div className={`flex items-center gap-2 text-xs font-black uppercase tracking-widest ${
              timeLeft === 'Closed' || isPast ? 'text-pink-500/80 font-bold' : 'text-emerald-400 font-bold'
            }`}>
              <Clock size={14} strokeWidth={3} />
              {timeLeft}
            </div>
          </div>

          <div className="flex gap-2">
            {isAdmin ? (
              <div className="flex bg-white/5 rounded-2xl border border-white/5 p-1">
                <button
                  onClick={() => onEdit(event)}
                  className="p-2.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                  title="Edit Event"
                >
                  <Edit2 size={18} />
                </button>
                <button
                  onClick={() => setIsAttendanceOpen(true)}
                  className="p-2.5 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 rounded-xl transition-all"
                  title="Attendance"
                >
                  <UserCheck size={18} />
                </button>
                <button
                  onClick={() => onDelete(event._id)}
                  className="p-2.5 text-pink-500 hover:text-pink-400 hover:bg-pink-500/10 rounded-xl transition-all"
                  title="Delete Event"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ) : (
              <button 
                onClick={() => !isEnrolled && setIsEnrollModalOpen(true)}
                disabled={timeLeft === 'Closed' || isPast || isEnrolled}
                className={`stellar-btn py-2.5! px-6! text-xs! uppercase! tracking-widest! flex items-center gap-2 ${
                  isEnrolled ? 'bg-emerald-500/10! text-emerald-400! border-emerald-500/20!' : ''
                }`}
              >
                <span>{isEnrolled ? 'Enrolled' : (timeLeft === 'Closed' || isPast ? (isPast ? 'Ended' : 'Closed') : 'Enroll Now')}</span>
                {!isPast && timeLeft !== 'Closed' && !isEnrolled && <ArrowUpRight size={14} strokeWidth={3} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />}
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
