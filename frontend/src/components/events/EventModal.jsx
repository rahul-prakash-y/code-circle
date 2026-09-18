import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Calendar, MapPin, Users, Type, AlignLeft, Info, 
  Layers, Activity, CheckCircle2, Loader2, Eye,
  Award, Upload, Trash2, ExternalLink, Sliders, Plus,
  Sparkles, Hash, CheckSquare, ChevronUp, ChevronDown, ListPlus
} from 'lucide-react';
import useEventStore from '../../store/useEventStore';
import EventDetailsModal from './EventDetailsModal';
import { toast } from 'react-hot-toast';

const EVENT_TYPES = ['Technical', 'Non-Technical', 'Lecture', 'Workshop'];
const EVENT_FORMATS = ['Individual', 'Duo', 'Team'];
const EVENT_STATUSES = ['Upcoming', 'Live', 'Completed', 'Cancelled'];

const FIELD_TYPES = [
  { value: 'text', label: 'Single-line Text', icon: Type },
  { value: 'select', label: 'Dropdown / Select Options', icon: Sliders },
  { value: 'number', label: 'Number', icon: Hash },
  { value: 'textarea', label: 'Long Text / Textarea', icon: AlignLeft },
  { value: 'checkbox', label: 'Checkbox (Yes / No)', icon: CheckSquare },
];

const CUSTOM_FIELD_PRESETS = [
  {
    label: 'T-Shirt Size',
    type: 'select',
    options: ['S', 'M', 'L', 'XL', 'XXL'],
    required: true,
    placeholder: 'Select your size',
  },
  {
    label: 'GitHub Profile',
    type: 'text',
    options: [],
    required: false,
    placeholder: 'https://github.com/username',
  },
  {
    label: 'Meal Preference',
    type: 'select',
    options: ['Veg', 'Non-Veg', 'Jain'],
    required: true,
    placeholder: 'Select meal preference',
  },
  {
    label: 'Experience Level',
    type: 'select',
    options: ['Beginner', 'Intermediate', 'Advanced'],
    required: false,
    placeholder: 'Select experience level',
  },
  {
    label: 'Discord Username',
    type: 'text',
    options: [],
    required: false,
    placeholder: 'e.g. username#0000',
  },
];

const CustomFieldItem = ({
  field,
  index,
  totalFields,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
}) => {
  const [optionInput, setOptionInput] = useState('');

  const handleAddOption = (e) => {
    if (e) e.preventDefault();
    const trimmed = optionInput.trim();
    if (!trimmed) return;
    const currentOptions = Array.isArray(field.options) ? field.options : [];
    if (currentOptions.includes(trimmed)) {
      toast.error('Option already exists');
      return;
    }
    onUpdate({ options: [...currentOptions, trimmed] });
    setOptionInput('');
  };

  const handleOptionKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddOption();
    }
  };

  const handleRemoveOption = (optIndex) => {
    const currentOptions = Array.isArray(field.options) ? field.options : [];
    onUpdate({ options: currentOptions.filter((_, i) => i !== optIndex) });
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="p-3.5 sm:p-4 rounded-2xl bg-canvas/60 border border-border/80 hover:border-accent/40 transition-all space-y-3 relative group shadow-inner"
    >
      {/* Top Header: Badge, Move, and Delete */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-md bg-accent/15 text-accent text-[11px] font-mono font-bold flex items-center justify-center">
            #{index + 1}
          </span>
          <span className="text-xs font-bold text-text-primary truncate max-w-[200px] sm:max-w-[320px]">
            {field.label ? field.label : <span className="text-text-muted italic">Untitled Custom Field</span>}
          </span>
          {field.required && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 font-bold uppercase tracking-wider">
              Required
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {index > 0 && (
            <button
              type="button"
              onClick={onMoveUp}
              className="p-1 text-text-muted hover:text-text-primary rounded-lg hover:bg-surface-elevated transition-colors cursor-pointer"
              title="Move Up"
            >
              <ChevronUp size={14} />
            </button>
          )}
          {index < totalFields - 1 && (
            <button
              type="button"
              onClick={onMoveDown}
              className="p-1 text-text-muted hover:text-text-primary rounded-lg hover:bg-surface-elevated transition-colors cursor-pointer"
              title="Move Down"
            >
              <ChevronDown size={14} />
            </button>
          )}
          <button
            type="button"
            onClick={onRemove}
            className="p-1.5 text-rose-400/80 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors cursor-pointer ml-1"
            title="Remove Field"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Main Grid: Label & Type */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
            Field Question / Label *
          </label>
          <input
            type="text"
            value={field.label}
            onChange={(e) => onUpdate({ label: e.target.value })}
            placeholder="e.g. T-Shirt Size, GitHub Profile"
            className="input-field text-xs py-2 focus:ring-2 focus:ring-accent/40"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
            Field Type
          </label>
          <select
            value={field.type}
            onChange={(e) => {
              const newType = e.target.value;
              onUpdate({
                type: newType,
                options: newType === 'select' ? (field.options?.length ? field.options : ['Option 1', 'Option 2']) : [],
              });
            }}
            className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-xs font-semibold text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all cursor-pointer"
          >
            {FIELD_TYPES.map((ft) => (
              <option key={ft.value} value={ft.value}>
                {ft.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Select Options Manager (when type === 'select') */}
      {field.type === 'select' && (
        <div className="p-3 rounded-xl bg-surface-elevated/70 border border-border/80 space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold uppercase tracking-wider text-accent flex items-center gap-1.5">
              <Sliders size={12} /> Dropdown Options (Custom Choices) *
            </label>
            <span className="text-[10px] text-text-muted font-mono">
              {field.options?.length || 0} choice(s)
            </span>
          </div>

          {/* Option Tags / Pills */}
          <div className="flex flex-wrap gap-1.5 min-h-[34px] p-2 rounded-xl bg-canvas/80 border border-border/60 items-center">
            {field.options && field.options.length > 0 ? (
              field.options.map((opt, optIdx) => (
                <span
                  key={optIdx}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-accent/15 text-accent border border-accent/25 animate-in fade-in zoom-in-95 duration-150"
                >
                  <span>{opt}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveOption(optIdx)}
                    className="text-accent/70 hover:text-white hover:bg-rose-500 rounded p-0.5 transition-colors cursor-pointer"
                    title={`Remove ${opt}`}
                  >
                    <X size={11} />
                  </button>
                </span>
              ))
            ) : (
              <span className="text-[11px] text-amber-400 italic px-1">
                No options added yet. Type a choice below and press Enter or click Add.
              </span>
            )}
          </div>

          {/* Add Option Input */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={optionInput}
              onChange={(e) => setOptionInput(e.target.value)}
              onKeyDown={handleOptionKeyDown}
              placeholder="Type an option (e.g. S, M, L or Veg, Non-Veg) & press Enter"
              className="input-field text-xs py-2 flex-1"
            />
            <button
              type="button"
              onClick={handleAddOption}
              className="px-3 py-2 rounded-xl bg-accent text-white text-xs font-bold hover:bg-accent/90 transition-all flex items-center gap-1 cursor-pointer shrink-0 shadow-sm"
            >
              <Plus size={13} /> Add Option
            </button>
          </div>
        </div>
      )}

      {/* Placeholder / Hint (when not checkbox) */}
      {field.type !== 'checkbox' && (
        <div className="space-y-1">
          <label className="text-[11px] font-bold uppercase tracking-wider text-text-muted">
            Placeholder / Helper Hint (Optional)
          </label>
          <input
            type="text"
            value={field.placeholder || ''}
            onChange={(e) => onUpdate({ placeholder: e.target.value })}
            placeholder={
              field.type === 'select'
                ? 'e.g. Choose your option'
                : field.type === 'number'
                ? 'e.g. 10'
                : 'e.g. Enter your link or answer here...'
            }
            className="input-field text-xs py-1.5 text-text-secondary"
          />
        </div>
      )}

      {/* Required Toggle */}
      <div className="flex items-center justify-between pt-1 border-t border-border/50">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={!!field.required}
            onChange={(e) => onUpdate({ required: e.target.checked })}
            className="w-4 h-4 rounded text-accent bg-surface border-border focus:ring-accent/40 focus:ring-offset-0 transition-all cursor-pointer"
          />
          <span className="text-xs font-semibold text-text-primary">
            Make this field required for registration
          </span>
        </label>
        <span className="text-[10px] text-text-muted font-medium">
          {field.required ? 'Mandatory for all attendees' : 'Optional for attendees'}
        </span>
      </div>
    </motion.div>
  );
};

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
    customFields: [],
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
        customFields: Array.isArray(eventToEdit.customFields)
          ? JSON.parse(JSON.stringify(eventToEdit.customFields))
          : [],
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
        customFields: [],
      });
    }
  }, [eventToEdit, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddField = (preset = null) => {
    const newField = preset
      ? {
          id: `cf_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          label: preset.label,
          type: preset.type,
          options: [...(preset.options || [])],
          required: preset.required ?? false,
          placeholder: preset.placeholder || '',
        }
      : {
          id: `cf_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          label: '',
          type: 'text',
          options: [],
          required: false,
          placeholder: '',
        };

    setFormData((prev) => ({
      ...prev,
      customFields: [...(prev.customFields || []), newField],
    }));
  };

  const handleUpdateField = (index, updates) => {
    setFormData((prev) => {
      const fields = [...(prev.customFields || [])];
      fields[index] = { ...fields[index], ...updates };
      return { ...prev, customFields: fields };
    });
  };

  const handleRemoveField = (index) => {
    setFormData((prev) => {
      const fields = (prev.customFields || []).filter((_, i) => i !== index);
      return { ...prev, customFields: fields };
    });
  };

  const handleMoveField = (index, direction) => {
    setFormData((prev) => {
      const fields = [...(prev.customFields || [])];
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= fields.length) return prev;
      const temp = fields[index];
      fields[index] = fields[targetIndex];
      fields[targetIndex] = temp;
      return { ...prev, customFields: fields };
    });
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

    // Validate custom fields
    if (formData.customFields && formData.customFields.length > 0) {
      for (let i = 0; i < formData.customFields.length; i++) {
        const field = formData.customFields[i];
        if (!field.label || !field.label.trim()) {
          return toast.error(`Please provide a question / label for Field #${i + 1}`);
        }
        if (field.type === 'select' && (!field.options || field.options.length === 0)) {
          return toast.error(`Please provide at least 1 dropdown option for "${field.label}"`);
        }
      }
    }

    setLoading(true);
    try {
      const sanitizedCustomFields = (formData.customFields || []).map((f, idx) => ({
        id: f.id || `cf_${Date.now()}_${idx}`,
        label: f.label.trim(),
        type: f.type || 'text',
        options: f.type === 'select' ? (Array.isArray(f.options) ? f.options.map(o => String(o).trim()).filter(Boolean) : []) : [],
        required: !!f.required,
        placeholder: f.placeholder ? f.placeholder.trim() : '',
      }));

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
        customFields: sanitizedCustomFields,
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

              {/* Custom Options & Registration Fields Builder */}
              <div className="p-4 sm:p-5 rounded-2xl bg-surface-elevated border border-border space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-border/70">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
                      <Sliders size={16} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-text-primary">
                          Custom Registration Fields & Options
                        </label>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-accent/10 text-accent border border-accent/20">
                          {formData.customFields?.length || 0}
                        </span>
                      </div>
                      <p className="text-[11px] text-text-muted mt-0.5">
                        Ask participants custom questions or provide dropdown choices during registration
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleAddField()}
                    className="self-start sm:self-auto px-3 py-1.5 rounded-xl bg-accent text-white text-xs font-bold hover:bg-accent/90 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm shadow-accent/20"
                  >
                    <Plus size={14} /> Add Field
                  </button>
                </div>

                {/* Quick Presets row */}
                <div className="flex flex-wrap items-center gap-1.5 bg-canvas/40 p-2.5 rounded-xl border border-border/60">
                  <span className="text-[10px] uppercase font-bold text-text-muted flex items-center gap-1 shrink-0">
                    <Sparkles size={12} className="text-amber-400" /> Quick Presets:
                  </span>
                  {CUSTOM_FIELD_PRESETS.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => handleAddField(preset)}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-surface border border-border text-text-secondary hover:text-accent hover:border-accent/50 hover:bg-accent/5 transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Plus size={11} /> {preset.label}
                    </button>
                  ))}
                </div>

                {/* List of Custom Fields */}
                <div className="space-y-3">
                  <AnimatePresence>
                    {formData.customFields && formData.customFields.length > 0 ? (
                      formData.customFields.map((field, idx) => (
                        <CustomFieldItem
                          key={field.id || idx}
                          field={field}
                          index={idx}
                          totalFields={formData.customFields.length}
                          onUpdate={(updates) => handleUpdateField(idx, updates)}
                          onRemove={() => handleRemoveField(idx)}
                          onMoveUp={() => handleMoveField(idx, -1)}
                          onMoveDown={() => handleMoveField(idx, 1)}
                        />
                      ))
                    ) : (
                      <div className="text-center py-6 px-4 rounded-xl border border-dashed border-border/80 bg-canvas/30 space-y-1.5">
                        <div className="w-9 h-9 rounded-xl bg-accent/5 text-accent/60 mx-auto flex items-center justify-center">
                          <ListPlus size={18} />
                        </div>
                        <p className="text-xs font-semibold text-text-secondary">
                          No custom fields added yet
                        </p>
                        <p className="text-[11px] text-text-muted max-w-sm mx-auto">
                          Need custom attendee details like T-shirt size, food preference, or GitHub link? Click <strong>Add Field</strong> or select a <strong>Quick Preset</strong> above.
                        </p>
                      </div>
                    )}
                  </AnimatePresence>
                </div>
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
