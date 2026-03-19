import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Users, Clock, Edit2, Trash2, ArrowUpRight } from 'lucide-react';
import { format, differenceInDays, differenceInHours, differenceInMinutes } from 'date-fns';
import EnrollmentModal from './EnrollmentModal';
import AttendanceDashboard from '../admin/AttendanceDashboard';
import { UserCheck } from 'lucide-react';

const EventCard = ({ event, isAdmin = false, onEdit, onDelete }) => {
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
      <div className="group relative bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 hover:border-indigo-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/10 active:scale-[0.98]">
        {/* Type Badge */}
        <div className="absolute top-4 right-4 flex gap-2">
          <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
            event.type === 'Individual' 
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
              : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
          }`}>
            {event.type}
          </span>
          {isPast && (
            <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-500/20 text-slate-400 border border-slate-500/30">
              Past
            </span>
          )}
        </div>

        {/* Main Content */}
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-indigo-400">
              <div className="p-2 bg-indigo-500/10 rounded-lg group-hover:bg-indigo-500/20 transition-colors shadow-[0_0_15px_rgba(99,102,241,0.2)] group-hover:shadow-[0_0_20px_rgba(99,102,241,0.4)]">
                <Calendar size={18} />
              </div>
              <span className="text-sm font-medium">
                {format(new Date(event.date), 'MMMM dd, yyyy')}
              </span>
            </div>
            <h3 className="text-xl font-bold text-white group-hover:text-indigo-300 transition-colors line-clamp-1">
              {event.title}
            </h3>
            <p className="text-slate-400 text-sm line-clamp-2 leading-relaxed">
              {event.description}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="flex items-center gap-2 text-slate-300 text-xs">
              <MapPin size={14} className="text-rose-400" />
              <span className="truncate">{event.venueOrLink}</span>
            </div>
            {event.type === 'Team' && (
              <div className="flex items-center gap-2 text-slate-300 text-xs">
                <Users size={14} className="text-emerald-400" />
                <span>Up to {event.maxParticipants} Members</span>
              </div>
            )}
          </div>

          {/* Action / Countdown */}
          <div className="pt-4 flex items-center justify-between border-t border-white/5">
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-500 uppercase font-bold">Registration</span>
              <div className={`flex items-center gap-1.5 text-sm font-semibold ${
                timeLeft === 'Closed' || isPast ? 'text-rose-400' : 'text-emerald-400'
              }`}>
                <Clock size={14} />
                {timeLeft}
              </div>
            </div>

            <div className="flex gap-2">
              {isAdmin ? (
                <>
                  <button
                    onClick={() => onEdit(event)}
                    className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                    title="Edit Event"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => setIsAttendanceOpen(true)}
                    className="p-2 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 rounded-xl transition-all"
                    title="Attendance"
                  >
                    <UserCheck size={18} />
                  </button>
                  <button
                    onClick={() => onDelete(event._id)}
                    className="p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl transition-all"
                    title="Delete Event"
                  >
                    <Trash2 size={18} />
                  </button>
                </>
              ) : (
                <button 
                  onClick={() => setIsEnrollModalOpen(true)}
                  disabled={timeLeft === 'Closed' || isPast}
                  className="group/btn relative px-5 py-2 overflow-hidden rounded-xl bg-linear-to-r from-indigo-600 to-violet-600 font-bold text-white text-sm shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 disabled:opacity-50 disabled:grayscale transition-all active:scale-95"
                >
                  <div className="flex items-center gap-2">
                    <span>{timeLeft === 'Closed' || isPast ? (isPast ? 'Ended' : 'Closed') : 'Enroll Now'}</span>
                    <ArrowUpRight size={16} className="group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                  </div>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

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
