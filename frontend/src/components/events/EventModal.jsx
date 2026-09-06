import React, { useState, useEffect } from 'react';
import { X, Calendar, MapPin, Users, Type, AlignLeft, Info, Layers, Activity, CheckCircle2 } from 'lucide-react';
import useEventStore from '../../store/useEventStore';
import { toast } from 'react-hot-toast';

const EVENT_TYPES = ['Technical', 'Non-Technical', 'Lecture', 'Workshop'];
const EVENT_FORMATS = ['Individual', 'Team'];
const EVENT_STATUSES = ['Upcoming', 'Live', 'Completed', 'Cancelled'];

const EventModal = ({ isOpen, onClose, eventToEdit = null }) => {
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-full max-w-2xl glass border border-border rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border bg-surface-elevated">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent-muted">
              <Calendar size={20} />
            </div>
            <div>
              <h2 className="text-xl font-black text-text-primary">
                {eventToEdit ? 'Edit Event' : 'Create New Event'}
              </h2>
              <p className="text-xs text-text-muted font-medium">Define event specifics, type, format, and schedule</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-text-muted hover:text-text-primary rounded-xl hover:bg-surface-elevated transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-black uppercase tracking-widest text-text-muted">Event Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              placeholder="e.g. Stellar Hackathon 2026"
              className="w-full bg-surface-elevated border border-border rounded-xl px-4 py-3 text-text-primary placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-all font-medium"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-black uppercase tracking-widest text-text-muted">Description *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows={3}
              placeholder="Detail the event agenda, topics covered, and prerequisites..."
              className="w-full bg-surface-elevated border border-border rounded-xl px-4 py-3 text-text-primary placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-all resize-none font-medium text-sm"
            />
          </div>

          {/* Type Selector Pills */}
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-text-muted flex items-center gap-1.5">
              <Layers size={14} className="text-accent-muted" /> Event Type *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {EVENT_TYPES.map((t) => (
                <button
                  type="button"
                  key={t}
                  onClick={() => setFormData((prev) => ({ ...prev, type: t }))}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all border ${
                    formData.type === t
                      ? 'bg-blue-500 text-text-primary border-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.3)]'
                      : 'bg-surface-elevated text-text-muted border-border hover:bg-surface-elevated hover:text-text-primary'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Format and Status Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Format (Individual vs Team) */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-text-muted flex items-center gap-1.5">
                <Users size={14} className="text-purple-400" /> Format *
              </label>
              <div className="grid grid-cols-2 gap-2">
                {EVENT_FORMATS.map((f) => (
                  <button
                    type="button"
                    key={f}
                    onClick={() => setFormData((prev) => ({ ...prev, format: f }))}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all border ${
                      formData.format === f
                        ? 'bg-purple-600 text-text-primary border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                        : 'bg-surface-elevated text-text-muted border-border hover:bg-surface-elevated hover:text-text-primary'
                    }`}
                  >
                    {f === 'Individual' ? 'Solo (Individual)' : 'Squad (Team)'}
                  </button>
                ))}
              </div>
            </div>

            {/* Status Selector */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-text-muted flex items-center gap-1.5">
                <Activity size={14} className="text-emerald-400" /> Status *
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full bg-surface-elevated border border-border rounded-xl px-4 py-2.5 text-text-primary focus:outline-none focus:border-blue-500 transition-all font-bold text-xs uppercase tracking-wider"
              >
                {EVENT_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Max Participants (Conditional when Team) */}
          {formData.format === 'Team' && (
            <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-300">
              <label className="text-xs font-black uppercase tracking-widest text-text-muted flex items-center gap-1.5">
                <Users size={14} className="text-purple-400" /> Max Members per Team
              </label>
              <input
                type="number"
                name="maxParticipants"
                min="2"
                max="10"
                value={formData.maxParticipants}
                onChange={handleChange}
                className="w-full bg-surface-elevated border border-border rounded-xl px-4 py-2.5 text-text-primary focus:outline-none focus:border-purple-500 transition-all font-mono"
              />
            </div>
          )}

          {/* Date and Deadline */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-widest text-text-muted flex items-center gap-1.5">
                <Calendar size={14} className="text-accent-muted" /> Event Date *
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
                className="w-full bg-surface-elevated border border-border rounded-xl px-4 py-2.5 text-text-primary focus:outline-none focus:border-blue-500 transition-all scheme-dark font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-widest text-text-muted flex items-center gap-1.5">
                <Info size={14} className="text-amber-400" /> Registration Deadline
              </label>
              <input
                type="date"
                name="registrationDeadline"
                value={formData.registrationDeadline}
                onChange={handleChange}
                className="w-full bg-surface-elevated border border-border rounded-xl px-4 py-2.5 text-text-primary focus:outline-none focus:border-blue-500 transition-all scheme-dark font-medium"
              />
            </div>
          </div>

          {/* Venue or Link */}
          <div className="space-y-1.5">
            <label className="text-xs font-black uppercase tracking-widest text-text-muted flex items-center gap-1.5">
              <MapPin size={14} className="text-emerald-400" /> Venue / Meeting URL
            </label>
            <input
              type="text"
              name="venueOrLink"
              value={formData.venueOrLink}
              onChange={handleChange}
              placeholder="e.g. Audi 2 / Google Meet"
              className="w-full bg-surface-elevated border border-border rounded-xl px-4 py-2.5 text-text-primary placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-all font-medium text-sm"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-4 pt-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-surface-elevated text-text-muted hover:text-text-primary rounded-xl font-black uppercase tracking-widest text-xs hover:bg-surface-elevated transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 btn-primary py-3 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                eventToEdit ? 'Update Event' : 'Create Event'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventModal;
