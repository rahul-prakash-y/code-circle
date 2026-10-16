import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  MessageSquarePlus,
  Star,
  ShieldCheck,
  Calendar,
  Send,
  Sparkles,
  Check,
} from 'lucide-react';
import useFeedbackStore from '../../store/useFeedbackStore';
import useEventStore from '../../store/useEventStore';
import toast from 'react-hot-toast';

const categories = [
  'General',
  'Event Quality',
  'Speaker & Content',
  'Venue & Logistics',
  'Platform Experience',
  'Suggestions',
];

const RATING_LABELS = {
  1: { title: 'Needs Improvement', desc: 'Major issues encountered' },
  2: { title: 'Below Expectations', desc: 'Several areas to polish' },
  3: { title: 'Good / Average', desc: 'Met standard expectations' },
  4: { title: 'Very Good', desc: 'Impressive and well executed' },
  5: { title: 'Exceptional', desc: 'Outstanding in every aspect' },
};

export const SubmitFeedbackModal = ({ isOpen, onClose, defaultEventId = null }) => {
  const { submitFeedback, submitting } = useFeedbackStore();
  const { events, fetchEvents } = useEventStore();

  const [type, setType] = useState(defaultEventId ? 'Event' : 'ClubGeneral');
  const [eventId, setEventId] = useState(defaultEventId || '');
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [category, setCategory] = useState('General');
  const [comment, setComment] = useState('');

  const [prevDefaultEventId, setPrevDefaultEventId] = useState(defaultEventId);
  if (defaultEventId !== prevDefaultEventId) {
    setPrevDefaultEventId(defaultEventId);
    if (defaultEventId) {
      setType('Event');
      setEventId(defaultEventId);
    }
  }

  useEffect(() => {
    if (isOpen) {
      fetchEvents();
    }
  }, [isOpen, fetchEvents]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!comment.trim() || comment.trim().length < 3) {
      toast.error('Please enter your feedback comments (minimum 3 characters)');
      return;
    }

    if (type === 'Event' && !eventId) {
      toast.error('Please select an event for your feedback');
      return;
    }

    const payload = {
      type,
      eventId: type === 'Event' ? eventId : null,
      rating,
      category,
      comment: comment.trim(),
    };

    const res = await submitFeedback(payload);
    if (res.success) {
      toast.success('Thank you! Your feedback has been submitted successfully.');
      setComment('');
      onClose();
    } else {
      toast.error(res.error || 'Failed to submit feedback');
    }
  };

  const activeRating = hoverRating || rating;
  const ratingMeta = RATING_LABELS[activeRating] || RATING_LABELS[5];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/40 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ type: 'spring', damping: 26, stiffness: 320 }}
        className="w-full max-w-xl my-auto bg-surface border border-separator rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-2xl flex flex-col"
      >
        {/* Decorative soft ambient top glow */}
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-primary/5 blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex justify-between items-start pb-5 border-b border-separator relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-xs">
              <MessageSquarePlus size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
                  Student Voice
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-extrabold text-label-primary tracking-tight">
                Submit Feedback
              </h2>
              <p className="text-xs text-label-secondary mt-0.5">
                Your candid opinion directly guides club leadership and event quality
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-surface-raised hover:bg-surface-secondary text-label-secondary hover:text-label-primary transition-all border border-separator cursor-pointer"
            title="Close"
          >
            <X size={17} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="py-5 space-y-5 relative z-10">
          {/* Target Type Selector Pills */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-label-secondary">
              Feedback Context
            </label>
            <div className="grid grid-cols-2 gap-2.5 p-1 bg-surface-secondary border border-separator rounded-2xl">
              <button
                type="button"
                onClick={() => setType('ClubGeneral')}
                className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  type === 'ClubGeneral'
                    ? 'bg-surface text-primary shadow-xs border border-separator'
                    : 'text-label-secondary hover:text-label-primary'
                }`}
              >
                <Sparkles size={14} className={type === 'ClubGeneral' ? 'text-primary' : ''} />
                <span>Club in General</span>
              </button>

              <button
                type="button"
                onClick={() => setType('Event')}
                className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  type === 'Event'
                    ? 'bg-surface text-primary shadow-xs border border-separator'
                    : 'text-label-secondary hover:text-label-primary'
                }`}
              >
                <Calendar size={14} className={type === 'Event' ? 'text-primary' : ''} />
                <span>Specific Event</span>
              </button>
            </div>
          </div>

          {/* Event Dropdown (if type === 'Event') */}
          {type === 'Event' && (
            <div className="space-y-1.5 animate-in fade-in duration-200">
              <label className="text-xs font-bold uppercase tracking-wider text-label-secondary flex items-center justify-between">
                <span>Select Event *</span>
                <span className="text-[11px] font-normal text-label-tertiary">Required</span>
              </label>
              <select
                value={eventId}
                onChange={(e) => setEventId(e.target.value)}
                className="w-full px-4 py-2.5 bg-surface-raised border border-separator rounded-xl text-label-primary text-xs sm:text-sm font-medium focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all cursor-pointer"
                required
              >
                <option value="">-- Choose an event --</option>
                {events?.map((ev) => (
                  <option key={ev._id} value={ev._id}>
                    {ev.title} ({new Date(ev.date).toLocaleDateString()})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Star Rating Interactive Selector */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-label-secondary">
                Overall Experience Rating
              </label>
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20 font-mono">
                {activeRating} / 5 Stars
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-surface-secondary border border-separator flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 justify-center sm:justify-start">
                {[1, 2, 3, 4, 5].map((star) => {
                  const filled = star <= activeRating;
                  return (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-1 rounded-xl transition-all duration-150 transform hover:scale-120 active:scale-95 cursor-pointer"
                      title={`${star} Star${star > 1 ? 's' : ''}`}
                    >
                      <Star
                        size={28}
                        className={
                          filled
                            ? 'text-amber-400 fill-amber-400 filter drop-shadow-[0_2px_8px_rgba(251,191,36,0.4)]'
                            : 'text-separator-opaque hover:text-amber-300'
                        }
                      />
                    </button>
                  );
                })}
              </div>

              <div className="text-center sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-separator">
                <p className="text-xs font-bold text-label-primary">{ratingMeta.title}</p>
                <p className="text-[11px] text-label-tertiary">{ratingMeta.desc}</p>
              </div>
            </div>
          </div>

          {/* Category Tag Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-label-secondary">
              Category Tag
            </label>
            <div className="flex flex-wrap gap-1.5">
              {categories.map((cat) => {
                const isSelected = category === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-primary text-white shadow-xs border border-primary'
                        : 'bg-surface-raised text-label-secondary hover:text-label-primary border border-separator hover:border-separator-focus'
                    }`}
                  >
                    {isSelected && <Check size={12} className="stroke-[3]" />}
                    <span>{cat}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Text Comments Area */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-label-secondary">
                Detailed Thoughts & Suggestions *
              </label>
              <span className="text-[10px] text-label-tertiary font-mono">
                {comment.trim().length} chars (min 3)
              </span>
            </div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="What went exceptionally well? What could our team improve next time? Be as honest and constructive as possible..."
              rows={4}
              className="w-full px-4 py-3 bg-surface-raised border border-separator rounded-2xl text-label-primary text-xs sm:text-sm font-medium focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all placeholder:text-label-tertiary resize-none leading-relaxed"
              required
            />
          </div>

          {/* Student Privacy Assurance Callout */}
          <div className="p-3.5 rounded-2xl bg-primary/5 border border-primary/15 flex items-start gap-3">
            <ShieldCheck size={18} className="text-primary shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed text-label-secondary">
              <strong className="text-label-primary font-semibold">Anonymous by Default: </strong>
              To promote authentic and fearless feedback, standard administrators see your review signed as{' '}
              <span className="font-mono text-primary font-bold bg-primary/10 px-1.5 py-0.5 rounded">
                Anonymous Student
              </span>
              .
            </div>
          </div>

          {/* Modal Actions */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-label-secondary hover:text-label-primary bg-surface-raised hover:bg-surface-secondary border border-separator transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-primary hover:bg-primary-hover shadow-md shadow-primary/25 active:scale-95 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Send size={14} />
              <span>{submitting ? 'Submitting...' : 'Submit Feedback'}</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default SubmitFeedbackModal;

