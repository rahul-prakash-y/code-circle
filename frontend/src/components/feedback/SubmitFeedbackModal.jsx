import React, { useState, useEffect } from 'react';
import ResponsiveModal from '../ui/ResponsiveModal';
import {
  MessageSquarePlus,
  Star,
  ShieldCheck,
  Calendar,
  Send,
  Sparkles,
  Check,
  Loader2,
} from 'lucide-react';
import useFeedbackStore from '../../store/useFeedbackStore';
import useEventStore from '../../store/useEventStore';
import toast from 'react-hot-toast';
import { HeroUISelect } from '@/components/ui/HeroUISelect';
import { HeroChip as Chip } from '@/components/ui/hero/HeroChip';

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
    <ResponsiveModal
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-accent/10 text-accent flex items-center justify-center shrink-0">
            <MessageSquarePlus className="w-4 h-4" />
          </div>
          <span>Submit Student Feedback</span>
        </div>
      }
      description="Share your experience, insights, and suggestions directly with organizers."
      dialogClassName="sm:max-w-xl p-6"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        {/* Feedback Type Toggle */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-surface-secondary border border-separator rounded-2xl">
          <button
            type="button"
            onClick={() => setType('ClubGeneral')}
            className={`py-2 px-3 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 ${
              type === 'ClubGeneral'
                ? 'bg-accent text-white shadow-xs'
                : 'text-label-secondary hover:text-label-primary'
            }`}
          >
            <Sparkles size={14} />
            <span>Club & Platform</span>
          </button>
          <button
            type="button"
            onClick={() => setType('Event')}
            className={`py-2 px-3 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 ${
              type === 'Event'
                ? 'bg-accent text-white shadow-xs'
                : 'text-label-secondary hover:text-label-primary'
            }`}
          >
            <Calendar size={14} />
            <span>Specific Event</span>
          </button>
        </div>

        {/* Event Picker (Visible if Event type selected) */}
        {type === 'Event' && (
          <div className="space-y-1.5 animate-in fade-in duration-200">
            <label className="text-xs font-semibold uppercase tracking-wider text-label-secondary">
              Select Event *
            </label>
            <HeroUISelect
              value={eventId}
              onChange={setEventId}
              placeholder="-- Choose an event to review --"
              options={(events || []).map((ev) => ({
                value: ev._id,
                label: `${ev.title} ${ev.eventDate ? `(${new Date(ev.eventDate).toLocaleDateString()})` : ''}`,
              }))}
              size="sm"
              isSearchable
            />
          </div>
        )}

        {/* Interactive Star Rating */}
        <div className="p-4 rounded-2xl bg-surface-secondary border border-separator flex flex-col items-center justify-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-label-tertiary">
            Overall Experience Rating
          </span>
          <div className="flex items-center gap-2 py-1">
            {[1, 2, 3, 4, 5].map((star) => {
              const isFilled = star <= activeRating;
              return (
                <button
                  key={star}
                  type="button"
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                  className="p-1 hover:scale-115 active:scale-95 transition cursor-pointer"
                >
                  <Star
                    size={28}
                    className={`transition-colors ${
                      isFilled
                        ? 'fill-amber-400 text-amber-400 drop-shadow-sm'
                        : 'text-separator hover:text-amber-300'
                    }`}
                  />
                </button>
              );
            })}
          </div>
          <div className="text-center">
            <span className="text-xs font-bold text-label-primary">{ratingMeta.title}</span>
            <span className="text-[11px] text-label-tertiary block">{ratingMeta.desc}</span>
          </div>
        </div>

        {/* Category Selection */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-label-secondary">
            Category Focus
          </label>
          <div className="flex flex-wrap gap-1.5">
            {categories.map((cat) => {
              const isSelected = category === cat;
              return (
                <Chip
                  key={cat}
                  size="sm"
                  color={isSelected ? 'accent' : 'default'}
                  variant={isSelected ? 'solid' : 'flat'}
                  onClick={() => setCategory(cat)}
                  startContent={isSelected ? <Check size={12} className="stroke-[3]" /> : undefined}
                  className="cursor-pointer font-semibold"
                >
                  {cat}
                </Chip>
              );
            })}
          </div>
        </div>

        {/* Text Comments Area */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wider text-label-secondary">
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
            className="w-full px-4 py-2.5 rounded-xl border border-separator bg-surface-secondary text-label-primary text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition resize-none leading-relaxed"
            required
          />
        </div>

        {/* Student Privacy Assurance Callout */}
        <div className="p-3.5 rounded-2xl bg-accent/5 border border-accent/15 flex items-start gap-3">
          <ShieldCheck size={18} className="text-accent shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed text-label-secondary">
            <strong className="text-label-primary font-semibold">Anonymous by Default: </strong>
            To promote authentic feedback, administrators see your review signed as{' '}
            <span className="font-mono text-accent font-bold bg-accent/10 px-1.5 py-0.5 rounded">
              Anonymous Student
            </span>
            .
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-separator flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 rounded-full text-xs font-medium border border-separator text-label-secondary hover:text-label-primary cursor-pointer transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-xs font-semibold bg-accent text-white hover:bg-accent-hover disabled:opacity-50 transition cursor-pointer shadow"
          >
            {submitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Submitting...</span>
              </>
            ) : (
              <>
                <Send size={13} />
                <span>Submit Feedback</span>
              </>
            )}
          </button>
        </div>
      </form>
    </ResponsiveModal>
  );
};

export default SubmitFeedbackModal;
