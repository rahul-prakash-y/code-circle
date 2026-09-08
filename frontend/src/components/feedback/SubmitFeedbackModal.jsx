import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  X,
  MessageSquarePlus,
  Star,
  ShieldCheck,
  Calendar,
  Layers,
  Send,
  Sparkles,
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

const SubmitFeedbackModal = ({ isOpen, onClose, defaultEventId = null }) => {
  const { submitFeedback, submitting } = useFeedbackStore();
  const { events, fetchEvents } = useEventStore();

  const [type, setType] = useState(defaultEventId ? 'Event' : 'ClubGeneral');
  const [eventId, setEventId] = useState(defaultEventId || '');
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [category, setCategory] = useState('General');
  const [comment, setComment] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchEvents();
      if (defaultEventId) {
        setType('Event');
        setEventId(defaultEventId);
      }
    }
  }, [isOpen, defaultEventId, fetchEvents]);

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-xl my-auto glass border border-border p-6 sm:p-8 relative overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.8)] flex flex-col"
      >
        {/* Glow ambient background */}
        <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-accent/10 blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex justify-between items-center pb-5 border-b border-border relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent-muted">
              <MessageSquarePlus size={20} />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-text-primary tracking-tight">
                Submit Student Feedback
              </h2>
              <p className="text-xs text-text-muted">
                Share your perspective to help shape club workshops, contests, and culture
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-surface-elevated hover:bg-surface-elevated text-text-muted hover:text-text-primary transition-all border border-border"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="py-5 space-y-5 relative z-10">
          {/* Target Type Selector Pills */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-text-muted">
              Feedback Context
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setType('ClubGeneral')}
                className={`py-3 px-4 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-2 border ${
                  type === 'ClubGeneral'
                    ? 'bg-accent/20 text-accent-muted border-blue-500/40 shadow-[0_0_20px_rgba(59,130,246,0.2)]'
                    : 'bg-surface-elevated text-text-muted hover:text-text-primary border-border'
                }`}
              >
                <Sparkles size={15} /> Club in General
              </button>

              <button
                type="button"
                onClick={() => setType('Event')}
                className={`py-3 px-4 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-2 border ${
                  type === 'Event'
                    ? 'bg-purple-500/20 text-purple-400 border-purple-500/40 shadow-[0_0_20px_rgba(168,85,247,0.2)]'
                    : 'bg-surface-elevated text-text-muted hover:text-text-primary border-border'
                }`}
              >
                <Calendar size={15} /> Specific Event
              </button>
            </div>
          </div>

          {/* Event Dropdown (if type === 'Event') */}
          {type === 'Event' && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-text-muted">
                Select Event *
              </label>
              <select
                value={eventId}
                onChange={(e) => setEventId(e.target.value)}
                className="w-full px-4 py-3 bg-[#0d121f] border border-border rounded-2xl text-text-primary text-sm focus:outline-none focus:border-purple-500/50 transition-all"
                required
              >
                <option value="">Choose an event...</option>
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
            <label className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center justify-between">
              <span>Overall Rating</span>
              <span className="text-amber-400 font-black">{rating} of 5 Stars</span>
            </label>
            <div className="flex items-center gap-2 p-3.5 rounded-2xl bg-white/[0.02] border border-border justify-center sm:justify-start">
              {[1, 2, 3, 4, 5].map((star) => {
                const filled = star <= (hoverRating || rating);
                return (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1.5 rounded-xl hover:scale-125 transition-transform duration-200"
                  >
                    <Star
                      size={26}
                      className={
                        filled
                          ? 'text-amber-400 fill-amber-400 filter drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]'
                          : 'text-text-muted'
                      }
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Category Tag Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-text-muted">
              Category Tag
            </label>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    category === cat
                      ? 'bg-white/20 text-text-primary border border-white/30'
                      : 'bg-surface-elevated text-text-muted hover:text-text-primary border border-border'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Text Comments Area */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-text-muted">
              Detailed Text Feedback *
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="What worked well? What could be improved? Be as candid and detailed as possible..."
              rows={4}
              className="w-full px-4 py-3 bg-surface-elevated border border-border rounded-2xl text-text-primary text-sm focus:outline-none focus:border-accent/50 transition-all placeholder-slate-600 resize-none font-sans"
              required
            />
          </div>

          {/* Student Privacy Assurance Callout */}
          <div className="p-3.5 rounded-2xl bg-blue-500/5 border border-blue-500/15 flex items-start gap-3">
            <ShieldCheck size={18} className="text-accent-muted flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-text-secondary leading-relaxed">
              <strong className="text-accent-muted font-bold">Privacy Guaranteed: </strong>
              Standard club administrators see this feedback labeled as{' '}
              <span className="text-text-primary font-mono bg-surface-elevated px-1 py-0.5 rounded">Anonymous User</span>.
            </p>
          </div>

          {/* Modal Actions */}
          <div className="pt-3 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-text-muted hover:text-text-primary bg-surface-elevated hover:bg-surface-elevated transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary py-2.5 px-6 text-xs font-black flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:brightness-110 shadow-[0_0_20px_rgba(59,130,246,0.3)] disabled:opacity-50"
            >
              <Send size={15} />
              {submitting ? 'Submitting...' : 'Submit Feedback'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default SubmitFeedbackModal;
