import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Calendar, MapPin, Users, Type, AlignLeft, Info, 
  Layers, Activity, CheckCircle2, Loader2, Eye,
  Award, Upload, Trash2, ExternalLink
} from 'lucide-react';
import useEventStore from '../../store/useEventStore';
import EventDetailsModal from './EventDetailsModal';
import { toast } from 'react-hot-toast';

const EVENT_TYPES = ['Technical', 'Non-Technical', 'Lecture', 'Workshop'];
const EVENT_FORMATS = ['Individual', 'Duo', 'Team'];
const EVENT_STATUSES = ['Upcoming', 'Live', 'Completed', 'Cancelled'];

export const EventModal = ({
  isOpen,
  onClose,
  eventToEdit = null,
}) => {
  const { addEvent, updateEvent, uploadCertificateTemplate } = useEventStore();
  const [loading, setLoading] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [uploadingTemplate, setUploadingTemplate] = useState(false);
  const fileInputRef = useRef(null);
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
    certificateTemplateUrl: '',
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
        certificateTemplateUrl: eventToEdit.certificateTemplateUrl || '',
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
        certificateTemplateUrl: '',
      });
    }
  }, [eventToEdit, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTemplateUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      return toast.error('Please upload an image file (PNG, JPG, WebP) for the certificate template');
    }
    setUploadingTemplate(true);
    const res = await uploadCertificateTemplate(file);
    if (res.success && res.url) {
      setFormData((prev) => ({ ...prev, certificateTemplateUrl: res.url }));
      toast.success('Certificate template uploaded successfully!');
    } else {
      toast.error(res.error || 'Failed to upload certificate template');
    }
    setUploadingTemplate(false);
  };

  const handleRemoveTemplate = () => {
    setFormData((prev) => ({ ...prev, certificateTemplateUrl: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
    toast('Certificate template removed', { icon: '🗑️' });
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
        maxParticipants:
          formData.format === 'Duo'
            ? 2
            : formData.format === 'Team'
            ? Number(formData.maxParticipants) || 4
            : 0,
        registrationDeadline: formData.registrationDeadline || formData.date,
        certificateTemplateUrl: formData.certificateTemplateUrl || '',
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
                  <div className="grid grid-cols-3 gap-2">
                    {EVENT_FORMATS.map((f) => (
                      <button
                        type="button"
                        key={f}
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            format: f,
                            maxParticipants: f === 'Duo' ? 2 : f === 'Team' ? (prev.maxParticipants < 3 ? 4 : prev.maxParticipants) : 0,
                          }))
                        }
                        className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer text-center ${
                          formData.format === f
                            ? 'bg-purple-600 text-white border-purple-500 shadow-sm shadow-purple-500/20'
                            : 'bg-surface-elevated text-text-muted border-border hover:text-text-primary'
                        }`}
                      >
                        {f === 'Individual' ? 'Solo' : f === 'Duo' ? 'Duo (2)' : 'Squad'}
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

              {/* Duo Note */}
              {formData.format === 'Duo' && (
                <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center gap-2.5 text-xs text-purple-300">
                  <Users size={16} className="shrink-0 text-purple-400" />
                  <span>Duo team format locks squad size to exactly <strong>2 members</strong> (Creator + 1 Partner).</span>
                </div>
              )}

              {/* Max Members (when Squad Team format) */}
              {formData.format === 'Team' && (
                <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-200">
                  <label className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
                    <Users size={14} className="text-purple-400" /> Max Members per Team (3 to 10)
                  </label>
                  <input
                    type="number"
                    name="maxParticipants"
                    min="3"
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

              {/* Certificate Template */}
              <div className="p-4 rounded-2xl bg-surface-elevated border border-border space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Award size={16} className="text-amber-400" />
                    <label className="text-xs font-bold uppercase tracking-wider text-text-primary">
                      Certificate Template
                    </label>
                  </div>
                  {formData.certificateTemplateUrl ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <CheckCircle2 size={11} /> Uploaded
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      Required for Event
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-text-muted leading-relaxed">
                  Upload the official certificate template for this event (PNG or JPG). When attendance is confirmed, certificates are automatically generated using this custom template.
                </p>

                {formData.certificateTemplateUrl ? (
                  <div className="relative group rounded-xl overflow-hidden border border-border bg-canvas">
                    <img 
                      src={formData.certificateTemplateUrl} 
                      alt="Certificate Template Preview" 
                      className="w-full h-36 object-contain bg-black/40"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <a 
                        href={formData.certificateTemplateUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                        title="View Full Template"
                      >
                        <ExternalLink size={16} />
                      </a>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2 rounded-lg bg-accent/80 hover:bg-accent text-white transition-colors cursor-pointer"
                        title="Replace Template"
                      >
                        <Upload size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={handleRemoveTemplate}
                        className="p-2 rounded-lg bg-rose-500/80 hover:bg-rose-500 text-white transition-colors cursor-pointer"
                        title="Remove Template"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-border hover:border-accent/50 rounded-xl p-5 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors bg-canvas/50 hover:bg-accent/5"
                  >
                    {uploadingTemplate ? (
                      <>
                        <Loader2 size={24} className="animate-spin text-accent" />
                        <span className="text-xs text-text-muted font-medium">Uploading template to Cloudinary...</span>
                      </>
                    ) : (
                      <>
                        <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
                          <Upload size={18} />
                        </div>
                        <div className="text-center">
                          <p className="text-xs font-semibold text-text-primary">
                            Click or drop certificate template here
                          </p>
                          <p className="text-[10px] text-text-muted mt-0.5">
                            PNG, JPG, or WebP (Recommended: A4 Landscape / 1920x1080)
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                )}

                <input 
                  type="file" 
                  ref={fileInputRef}
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  onChange={handleTemplateUpload}
                  className="hidden"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={onClose}
                  className="py-3 px-4 rounded-xl bg-surface-elevated text-text-muted text-xs font-bold uppercase tracking-wider hover:text-text-primary transition-all border border-border cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => setShowPreviewModal(true)}
                  className="py-3 px-4 rounded-xl bg-surface-elevated text-accent text-xs font-bold uppercase tracking-wider hover:bg-canvas transition-all border border-border flex items-center justify-center gap-1.5 cursor-pointer"
                  title="Preview how this event will look"
                >
                  <Eye size={15} />
                  <span>Preview</span>
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

      {/* Live Preview Modal */}
      {showPreviewModal && (
        <EventDetailsModal
          isOpen={showPreviewModal}
          onClose={() => setShowPreviewModal(false)}
          event={{
            ...formData,
            _id: eventToEdit?._id || 'preview-event',
            maxParticipants:
              formData.format === 'Duo'
                ? 2
                : formData.format === 'Team'
                ? Number(formData.maxParticipants) || 4
                : 0,
            createdBy: { name: 'Preview Organizer (You)' },
          }}
          isAdmin={true}
        />
      )}
    </AnimatePresence>
  );
};

export default EventModal;
