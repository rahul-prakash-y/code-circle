import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, MapPin, Users, Type, AlignLeft, Info, Layers, Activity, CheckCircle2, Loader2 } from 'lucide-react';
import useEventStore from '../../store/useEventStore';
import { toast } from 'react-hot-toast';

const EVENT_TYPES = ['Technical', 'Non-Technical', 'Lecture', 'Workshop'];
const EVENT_FORMATS = ['Individual', 'Team'];
const EVENT_STATUSES = ['Upcoming', 'Live', 'Completed', 'Cancelled'];

export const EventModal = ({
  isOpen,
  onClose,
  eventToEdit = null,
}) => {
  const { addEvent, updateEvent } = useEventStore();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    venueOrLink: '',
    type: 'Technical',
    format: 'Individual',
    status: 'Upcoming',
    maxParticipants: 4,
    registrationDeadline: '',
  });

  useEffect(() => {
    if (eventToEdit) {
      setFormData({
        title: eventToEdit.title || '',
        description: eventToEdit.description || '',
        date: eventToEdit.date ? eventToEdit.date.split('T')[0] : '',
        venueOrLink: eventToEdit.venueOrLink || '',
        type: eventToEdit.type === 'Individual' || eventToEdit.type === 'Team' ? 'Technical' : (eventToEdit.type || 'Technical'),
        format: eventToEdit.format || (eventToEdit.type === 'Team' ? 'Team' : 'Individual'),
        status: eventToEdit.status || 'Upcoming',
        maxParticipants: eventToEdit.maxParticipants || 4,
        registrationDeadline: eventToEdit.registrationDeadline
          ? eventToEdit.registrationDeadline.split('T')[0]
          : (eventToEdit.date ? eventToEdit.date.split('T')[0] : ''),
      });
    } else {
      setFormData({
        title: '',
        description: '',
        date: '',
        venueOrLink: 'Campus / Online',
        type: 'Technical',
        format: 'Individual',
        status: 'Upcoming',
        maxParticipants: 4,
        registrationDeadline: '',
      });
    }
  }, [eventToEdit, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.description || !formData.date) {
      return toast.error('Title, description, and event date are required');
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        maxParticipants: formData.format === 'Team' ? Number(formData.maxParticipants) || 4 : 0,
        registrationDeadline: formData.registrationDeadline || formData.date,
      };

      if (eventToEdit) {
        await updateEvent(eventToEdit._id, payload);
        toast.success('Event updated successfully!');
      } else {
        await addEvent(payload);
        toast.success('Event created successfully!');
      }
      onClose();
    } catch (error) {
      toast.error(error.message || 'Failed to save event');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Dark blurred backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/75 backdrop-blur-md"
          />

          {/* Centered Modal Container */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 15 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-2xl glass border border-border/80 rounded-3xl shadow-2xl overflow-hidden z-10"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border bg-surface-elevated/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
                  <Calendar size={20} />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-black text-text-primary font-heading">
                    {eventToEdit ? 'Edit Event' : 'Create New Event'}
                  </h2>
                  <p className="text-xs text-text-muted font-medium">Define event details, format, and schedule</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-text-muted hover:text-text-primary rounded-xl hover:bg-surface-elevated transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto custom-scrollbar">
              {/* Title */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                  Event Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  placeholder="e.g. Nebula Hackathon 2026"
                  className="input-field text-sm focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all duration-200"
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                  Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  rows={3}
                  placeholder="Outline the agenda, key topics, eligibility, and rules..."
                  className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-text-primary placeholder-text-muted/60 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all duration-200 resize-none text-xs leading-relaxed"
                />
              </div>

              {/* Type Selector Pills */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
                  <Layers size={14} className="text-accent" /> Event Type
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {EVENT_TYPES.map((t) => (
                    <button
                      type="button"
                      key={t}
                      onClick={() => setFormData((prev) => ({ ...prev, type: t }))}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                        formData.type === t
                          ? 'bg-accent text-white border-accent shadow-sm shadow-accent/20'
                          : 'bg-surface-elevated text-text-muted border-border hover:text-text-primary'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Format & Status Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Format Selector */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
                    <Users size={14} className="text-purple-400" /> Format
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {EVENT_FORMATS.map((f) => (
                      <button
                        type="button"
                        key={f}
                        onClick={() => setFormData((prev) => ({ ...prev, format: f }))}
                        className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                          formData.format === f
                            ? 'bg-purple-600 text-white border-purple-500 shadow-sm shadow-purple-500/20'
                            : 'bg-surface-elevated text-text-muted border-border hover:text-text-primary'
                        }`}
                      >
                        {f === 'Individual' ? 'Solo' : 'Squad (Team)'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Status Selector */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
                    <Activity size={14} className="text-emerald-400" /> Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-xs font-bold text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all duration-200 uppercase tracking-wider"
                  >
                    {EVENT_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Max Members (when Team format) */}
              {formData.format === 'Team' && (
                <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-200">
                  <label className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
                    <Users size={14} className="text-purple-400" /> Max Members per Team
                  </label>
                  <input
                    type="number"
                    name="maxParticipants"
                    min="2"
                    max="10"
                    value={formData.maxParticipants}
                    onChange={handleChange}
                    className="input-field text-xs py-2.5 font-mono focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500 transition-all"
                  />
                </div>
              )}

              {/* Date & Deadline */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
                    <Calendar size={14} className="text-accent" /> Event Date *
                  </label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    required
                    className="input-field text-xs py-2.5 focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
                    <Info size={14} className="text-amber-400" /> RSVP Deadline
                  </label>
                  <input
                    type="date"
                    name="registrationDeadline"
                    value={formData.registrationDeadline}
                    onChange={handleChange}
                    className="input-field text-xs py-2.5 focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition-all"
                  />
                </div>
              </div>

              {/* Venue or Link */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
                  <MapPin size={14} className="text-rose-400" /> Venue or Meeting Link
                </label>
                <input
                  type="text"
                  name="venueOrLink"
                  value={formData.venueOrLink}
                  onChange={handleChange}
                  placeholder="e.g. Audi 2 / meet.google.com/xyz"
                  className="input-field text-xs py-2.5 focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 px-4 rounded-xl bg-surface-elevated text-text-muted text-xs font-bold uppercase tracking-wider hover:text-text-primary transition-all border border-border cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 btn-primary py-3 px-4 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : eventToEdit ? (
                    'Save Event Changes'
                  ) : (
                    'Publish Event'
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default EventModal;
