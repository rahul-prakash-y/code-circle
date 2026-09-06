import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Users, Clock, Edit2, Trash2, ArrowUpRight, UserCheck } from 'lucide-react';
import { format, differenceInDays, differenceInHours, differenceInMinutes } from 'date-fns';
import EnrollmentModal from './EnrollmentModal';
import AttendanceDashboard from '../admin/AttendanceDashboard';
import useEnrollmentStore from '../../store/useEnrollmentStore';

const EventCard = ({ event, isAdmin = false, onEdit, onDelete }) => {
  const { myEnrolledEventIds } = useEnrollmentStore();
  const isEnrolled = myEnrolledEventIds.includes(event._id);
  const [timeLeft, setTimeLeft] = useState('');
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [isAttendanceOpen, setIsAttendanceOpen] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      if (!event.registrationDeadline) {
        setTimeLeft('');
        return;
      }
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

  const isPast = event.date ? new Date(event.date) < new Date() : false;
  const isLive = event.status === 'Live';
  const formatLabel = event.format === 'Team' || event.type === 'Team' ? 'Team' : 'Solo';
  const categoryLabel = (event.type && event.type !== 'Team' && event.type !== 'Individual')
    ? event.type
    : 'Technical';

  return (
    <>
      <div className="surface p-6 sm:p-7 flex flex-col justify-between h-full group hover:shadow-md transition-shadow duration-200">
        <div>
          {/* Top Bar: Editorial Metadata & Live indicator */}
          <div className="flex items-center justify-between gap-3 mb-4">
            <span className="meta-editorial">
              {categoryLabel} • {formatLabel}
            </span>

            {isLive ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-red-500/10 text-destructive">
                <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" />
                LIVE
              </span>
            ) : event.status === 'Completed' || isPast ? (
              <span className="text-[11px] font-medium text-label-tertiary">
                Concluded
              </span>
            ) : null}
          </div>

          {/* Event Title — Dominant Hero */}
          <h3 className="text-xl sm:text-[21px] font-bold text-label-primary group-hover:text-accent transition-colors duration-150 tracking-tight leading-snug mb-2.5 font-heading">
            {event.title}
          </h3>

          {/* Short Description */}
          {event.description && (
            <p className="text-[14px] text-label-secondary line-clamp-2 leading-relaxed mb-6 font-normal">
              {event.description}
            </p>
          )}

          {/* Essential Details — Clean inline typography, no nested boxes */}
          <div className="space-y-2 pt-1 text-[13px] text-label-secondary">
            <div className="flex items-center gap-2.5">
              <Calendar size={14} strokeWidth={1.75} className="shrink-0 text-label-tertiary" />
              <span className="font-medium text-label-primary">
                {event.date ? format(new Date(event.date), 'EEEE, MMM d, yyyy') : 'TBA'}
              </span>
            </div>

            {event.venueOrLink && (
              <div className="flex items-center gap-2.5">
                <MapPin size={14} strokeWidth={1.75} className="shrink-0 text-label-tertiary" />
                <span className="truncate">{event.venueOrLink}</span>
              </div>
            )}

            {(event.format === 'Team' || event.type === 'Team') && event.maxParticipants && (
              <div className="flex items-center gap-2.5">
                <Users size={14} strokeWidth={1.75} className="shrink-0 text-label-tertiary" />
                <span>Squad up to {event.maxParticipants} members</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions & Status */}
        <div className="mt-7 pt-4 flex items-center justify-between border-t border-separator">
          <div className="flex flex-col min-w-0 pr-2">
            <span className="text-[10px] uppercase font-semibold text-label-tertiary tracking-wider">
              {isPast ? 'Event' : 'Deadline'}
            </span>
            <span className={`text-[13px] font-medium truncate ${
              timeLeft === 'Closed' || isPast ? 'text-label-tertiary' : 'text-label-primary'
            }`}>
              {isPast ? 'Concluded' : (timeLeft || 'Open')}
            </span>
          </div>

          <div>
            {isAdmin ? (
              <div className="flex items-center gap-0.5 p-1 rounded-xl bg-canvas border border-separator">
                <button
                  onClick={() => onEdit(event)}
                  className="p-2 text-label-secondary hover:text-label-primary hover:bg-surface rounded-lg transition-colors cursor-pointer"
                  title="Edit Event"
                >
                  <Edit2 size={15} strokeWidth={1.75} />
                </button>
                <button
                  onClick={() => setIsAttendanceOpen(true)}
                  className="p-2 text-label-secondary hover:text-accent hover:bg-surface rounded-lg transition-colors cursor-pointer"
                  title="Attendance Records"
                >
                  <UserCheck size={15} strokeWidth={1.75} />
                </button>
                <button
                  onClick={() => onDelete(event._id)}
                  className="p-2 text-label-secondary hover:text-destructive hover:bg-surface rounded-lg transition-colors cursor-pointer"
                  title="Delete Event"
                >
                  <Trash2 size={15} strokeWidth={1.75} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => !isEnrolled && setIsEnrollModalOpen(true)}
                disabled={timeLeft === 'Closed' || isPast || isEnrolled}
                className={
                  isEnrolled
                    ? 'btn-secondary text-[13px] py-1.5 px-4 opacity-90 cursor-default'
                    : 'btn-primary text-[13px] py-1.5 px-4.5 flex items-center gap-1.5'
                }
              >
                <span>
                  {isEnrolled ? 'Enrolled' : (timeLeft === 'Closed' || isPast ? (isPast ? 'Concluded' : 'Closed') : 'Enroll')}
                </span>
                {!isPast && timeLeft !== 'Closed' && !isEnrolled && (
                  <ArrowUpRight size={13} strokeWidth={2} />
                )}
              </button>
            )}
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
