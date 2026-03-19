import React, { useState, useEffect } from 'react';
import { X, Calendar, MapPin, Users, Type, AlignLeft, Info } from 'lucide-react';
import useEventStore from '../../store/useEventStore';
import { toast } from 'react-hot-toast';

const EventModal = ({ isOpen, onClose, eventToEdit = null }) => {
  const { addEvent, updateEvent } = useEventStore();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    venueOrLink: '',
    type: 'Individual',
    maxParticipants: 0,
    registrationDeadline: ''
  });

  useEffect(() => {
    if (eventToEdit) {
      setFormData({
        title: eventToEdit.title,
        description: eventToEdit.description,
        date: eventToEdit.date.split('T')[0],
        venueOrLink: eventToEdit.venueOrLink,
        type: eventToEdit.type,
        maxParticipants: eventToEdit.maxParticipants || 0,
        registrationDeadline: eventToEdit.registrationDeadline.split('T')[0]
      });
    } else {
      setFormData({
        title: '',
        description: '',
        date: '',
        venueOrLink: '',
        type: 'Individual',
        maxParticipants: 0,
        registrationDeadline: ''
      });
    }
  }, [eventToEdit, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (eventToEdit) {
        await updateEvent(eventToEdit._id, formData);
        toast.success('Event updated successfully!');
      } else {
        await addEvent(formData);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-slate-900/90 border border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            {eventToEdit ? 'Edit Event' : 'Create New Event'}
          </h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
          {/* Title */}
          <div className="relative group">
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              placeholder=" "
              className="peer w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-transparent focus:outline-none focus:border-indigo-500 transition-all"
            />
            <label className="absolute left-4 top-3 text-slate-400 text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:top-3 peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-indigo-400 bg-slate-900 px-1 pointer-events-none">
              Event Title
            </label>
          </div>

          {/* Description */}
          <div className="relative group">
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows="3"
              placeholder=" "
              className="peer w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-transparent focus:outline-none focus:border-indigo-500 transition-all resize-none"
            />
            <label className="absolute left-4 top-3 text-slate-400 text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:top-3 peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-indigo-400 bg-slate-900 px-1 pointer-events-none">
              Event Description
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Event Date */}
            <div className="space-y-2">
              <label className="text-sm text-slate-400 flex items-center gap-2 px-1">
                <Calendar size={14} className="text-indigo-400" /> Event Date
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
                className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition-all scheme-dark"
              />
            </div>

            {/* Registration Deadline */}
            <div className="space-y-2">
              <label className="text-sm text-slate-400 flex items-center gap-2 px-1">
                <Info size={14} className="text-rose-400" /> Reg. Deadline
              </label>
              <input
                type="date"
                name="registrationDeadline"
                value={formData.registrationDeadline}
                onChange={handleChange}
                required
                className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition-all scheme-dark"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            {/* Venue or Link */}
            <div className="relative group">
              <input
                type="text"
                name="venueOrLink"
                value={formData.venueOrLink}
                onChange={handleChange}
                required
                placeholder=" "
                className="peer w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-transparent focus:outline-none focus:border-indigo-500 transition-all"
              />
              <label className="absolute left-4 top-3 text-slate-400 text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:top-3 peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-indigo-400 bg-slate-900 px-1 pointer-events-none">
                Venue or Meeting Link
              </label>
            </div>

            {/* Event Type Toggle */}
            <div className="flex items-center justify-between p-3 bg-slate-800/30 border border-slate-700/50 rounded-xl">
              <span className="text-sm text-slate-300 flex items-center gap-2">
                <Type size={16} className="text-indigo-400" /> Type: {formData.type}
              </span>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ 
                  ...prev, 
                  type: prev.type === 'Individual' ? 'Team' : 'Individual' 
                }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                  formData.type === 'Team' ? 'bg-indigo-600' : 'bg-slate-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    formData.type === 'Team' ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Max Participants (Conditional) */}
          {formData.type === 'Team' && (
            <div className="relative group animate-in slide-in-from-top duration-300">
              <input
                type="number"
                name="maxParticipants"
                value={formData.maxParticipants}
                onChange={handleChange}
                min="2"
                required={formData.type === 'Team'}
                placeholder=" "
                className="peer w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-transparent focus:outline-none focus:border-indigo-500 transition-all"
              />
              <label className="absolute left-4 top-3 text-slate-400 text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:top-3 peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-indigo-400 bg-slate-900 px-1 pointer-events-none">
                Max Participants per Team
              </label>
            </div>
          )}

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-slate-800 text-white rounded-xl font-medium hover:bg-slate-700 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-2 px-6 py-3 bg-linear-to-r from-indigo-600 to-violet-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </div>
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
