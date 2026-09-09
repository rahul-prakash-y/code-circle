import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Calendar,
  MapPin,
  Users,
  Clock,
  ExternalLink,
  ShieldCheck,
  Share2,
  CheckCircle2,
  ArrowUpRight,
  UserCheck,
} from 'lucide-react';
import { format, differenceInDays, differenceInHours, differenceInMinutes } from 'date-fns';
import toast from 'react-hot-toast';

export const EventDetailsModal = ({
  isOpen,
  onClose,
  event,
  isEnrolled = false,
  isAdmin = false,
  onEnroll,
  onEdit,
  onViewParticipants,
}) => {
  if (!isOpen || !event) return null;

  const eventDate = event.date ? new Date(event.date) : null;
  const deadline = event.registrationDeadline ? new Date(event.registrationDeadline) : null;
  const now = new Date();

  const isPast = eventDate ? eventDate < now : false;
  const isDeadlinePassed = deadline ? deadline < now : false;

  const isLive =
    (event.status && event.status.toLowerCase() === 'live') ||
    (eventDate &&
      eventDate.getFullYear() === now.getFullYear() &&
      eventDate.getMonth() === now.getMonth() &&
      eventDate.getDate() === now.getDate() &&
      event.status !== 'Completed' &&
      event.status !== 'Cancelled');

  const formatLabel =
    event.format === 'Duo'
      ? 'Duo (Pair)'
      : event.format === 'Team' || event.type === 'Team'
      ? `Squad (up to ${event.maxParticipants || 4})`
      : 'Solo (Individual)';

  const categoryLabel =
    event.type && event.type !== 'Team' && event.type !== 'Individual'
      ? event.type
      : 'Technical';

  // Calculate deadline countdown
  let deadlineCountdown = '';
  if (deadline) {
    if (isDeadlinePassed) {
      deadlineCountdown = 'Registration Closed';
    } else {
      const days = differenceInDays(deadline, now);
      const hours = differenceInHours(deadline, now) % 24;
      const minutes = differenceInMinutes(deadline, now) % 60;
      if (days > 0) deadlineCountdown = `${days}d ${hours}h left to register`;
      else if (hours > 0) deadlineCountdown = `${hours}h ${minutes}m left to register`;
      else deadlineCountdown = `${minutes}m left to register`;
    }
  }

  const isUrl =
    event.venueOrLink &&
    (event.venueOrLink.startsWith('http://') || event.venueOrLink.startsWith('https://'));

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.origin + '/events');
      toast.success('Event link copied to clipboard!');
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/75 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-2xl bg-surface border border-separator rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[88vh]"
          style={{ backgroundColor: 'var(--surface)', color: 'var(--label-primary)' }}
        >
          {/* Header Banner */}
          <div className="relative p-6 sm:p-7 border-b border-separator bg-canvas/60">
            <div className="flex items-center justify-between gap-4 mb-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-accent-subtle text-accent">
                  {categoryLabel}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-separator text-label-secondary">
                  {formatLabel}
                </span>
                {isLive && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-500/15 text-destructive border border-red-500/20">
                    <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
                    LIVE NOW
                  </span>
                )}
                {event.status === 'Completed' && (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-separator text-label-tertiary">
                    Completed
                  </span>
                )}
                {event.status === 'Cancelled' && (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-destructive/10 text-destructive">
                    Cancelled
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleShare}
                  className="p-2 rounded-xl text-label-secondary hover:text-label-primary hover:bg-canvas transition-colors"
                  title="Share Event"
                >
                  <Share2 size={16} />
                </button>
                <button
                  onClick={onClose}
                  className="p-2 rounded-xl text-label-secondary hover:text-label-primary hover:bg-canvas transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-label-primary tracking-tight leading-tight font-heading">
              {event.title}
            </h1>

            {deadlineCountdown && (
              <div className="mt-3 flex items-center gap-2 text-xs font-medium text-label-secondary">
                <Clock size={14} className="text-accent" />
                <span>{deadlineCountdown}</span>
              </div>
            )}
          </div>

          {/* Body Content */}
          <div className="p-6 sm:p-7 space-y-6 overflow-y-auto custom-scrollbar flex-1">
            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="p-4 rounded-2xl bg-canvas border border-separator flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-accent-subtle text-accent flex items-center justify-center shrink-0">
                  <Calendar size={18} />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] uppercase font-semibold text-label-tertiary tracking-wider">
                    Date & Schedule
                  </p>
                  <p className="text-sm font-bold text-label-primary mt-0.5">
                    {eventDate ? format(eventDate, 'EEEE, MMMM d, yyyy') : 'TBA'}
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-canvas border border-separator flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0">
                  <MapPin size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] uppercase font-semibold text-label-tertiary tracking-wider">
                    Venue / Link
                  </p>
                  {isUrl ? (
                    <a
                      href={event.venueOrLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-bold text-accent hover:underline flex items-center gap-1 mt-0.5 truncate"
                    >
                      <span className="truncate">{event.venueOrLink}</span>
                      <ExternalLink size={13} className="shrink-0" />
                    </a>
                  ) : (
                    <p className="text-sm font-bold text-label-primary mt-0.5 truncate">
                      {event.venueOrLink || 'Campus / Online'}
                    </p>
                  )}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-canvas border border-separator flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                  <Users size={18} />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] uppercase font-semibold text-label-tertiary tracking-wider">
                    Team Format
                  </p>
                  <p className="text-sm font-bold text-label-primary mt-0.5">
                    {event.format === 'Duo'
                      ? 'Duo (2 Participants)'
                      : event.format === 'Team' || event.type === 'Team'
                      ? `Squad (Max ${event.maxParticipants || 4} Members)`
                      : 'Individual Participant'}
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-canvas border border-separator flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                  <ShieldCheck size={18} />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] uppercase font-semibold text-label-tertiary tracking-wider">
                    Organizer / Host
                  </p>
                  <p className="text-sm font-bold text-label-primary mt-0.5 truncate">
                    {event.createdBy?.name || 'Code Circle Academic Team'}
                  </p>
                </div>
              </div>
            </div>

            {/* Description Section */}
            <div className="space-y-2.5">
              <h3 className="text-xs uppercase font-bold text-label-tertiary tracking-wider">
                Event Overview & Agenda
              </h3>
              <div className="p-5 rounded-2xl bg-canvas/50 border border-separator text-sm text-label-secondary leading-relaxed whitespace-pre-wrap">
                {event.description}
              </div>
            </div>

            {/* Registration status / info banner */}
            {isEnrolled && (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3 text-emerald-500">
                <CheckCircle2 size={20} className="shrink-0" />
                <div className="text-xs">
                  <p className="font-bold">You are enrolled in this event</p>
                  <p className="text-emerald-500/80 mt-0.5">
                    Your registration has been confirmed. Check your Registrations passport for details.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-5 sm:p-6 border-t border-separator bg-canvas/40 flex items-center justify-between gap-4">
            <button
              onClick={onClose}
              className="btn-secondary text-xs py-2 px-4 cursor-pointer"
            >
              Close
            </button>

            <div className="flex items-center gap-2">
              {isAdmin && (
                <>
                  <button
                    onClick={() => {
                      onClose();
                      if (onViewParticipants) onViewParticipants(event);
                    }}
                    className="btn-secondary flex items-center gap-1.5 text-xs py-2 px-3.5 cursor-pointer text-accent"
                  >
                    <UserCheck size={15} />
                    <span>Participants</span>
                  </button>
                  <button
                    onClick={() => {
                      onClose();
                      if (onEdit) onEdit(event);
                    }}
                    className="btn-secondary text-xs py-2 px-3.5 cursor-pointer"
                  >
                    Edit Event
                  </button>
                </>
              )}

              {!isAdmin && (
                <button
                  onClick={() => {
                    onClose();
                    if (!isEnrolled && onEnroll) onEnroll(event);
                  }}
                  disabled={isEnrolled || isDeadlinePassed || isPast}
                  className={
                    isEnrolled
                      ? 'btn-secondary text-xs py-2 px-5 opacity-90 cursor-default'
                      : 'btn-primary text-xs py-2 px-5 flex items-center gap-2 cursor-pointer'
                  }
                >
                  <span>
                    {isEnrolled
                      ? 'Enrolled'
                      : isPast
                      ? 'Event Concluded'
                      : isDeadlinePassed
                      ? 'Registration Closed'
                      : 'Enroll Now'}
                  </span>
                  {!isEnrolled && !isDeadlinePassed && !isPast && (
                    <ArrowUpRight size={14} />
                  )}
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default EventDetailsModal;
