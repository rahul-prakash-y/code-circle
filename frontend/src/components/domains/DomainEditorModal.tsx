import React, { useState, useEffect } from 'react';
import ResponsiveModal from '../ui/ResponsiveModal';
import useDomainStore from '../../store/useDomainStore';
import { IDomain } from '../../types/domain';
import { Layers, Image, FileText, Check, Loader2, Lock, ShieldCheck } from 'lucide-react';

interface DomainEditorModalProps {
  isOpen: boolean;
  domainToEdit?: IDomain | null;
  onClose: () => void;
}

const PRESET_COVERS = [
  { label: 'Artificial Intelligence', url: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Web Architecture', url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Cloud & Infrastructure', url: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Cybersecurity', url: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Mobile Engineering', url: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=1200&q=80' },
  { label: 'System Design', url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=80' },
];

export const DomainEditorModal: React.FC<DomainEditorModalProps> = ({
  isOpen,
  domainToEdit,
  onClose,
}) => {
  const { createDomain, updateDomain } = useDomainStore();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState(PRESET_COVERS[0].url);
  const [isLocked, setIsLocked] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (domainToEdit) {
      setName(domainToEdit.name || '');
      setDescription(domainToEdit.description || '');
      setCoverImageUrl(domainToEdit.coverImageUrl || PRESET_COVERS[0].url);
      setIsLocked(Boolean(domainToEdit.isLocked));
    } else {
      setName('');
      setDescription('');
      setCoverImageUrl(PRESET_COVERS[0].url);
      setIsLocked(false);
    }
  }, [domainToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !description.trim()) return;

    setSubmitting(true);
    let success = false;
    if (domainToEdit?._id) {
      success = await updateDomain(domainToEdit._id, {
        name: name.trim(),
        description: description.trim(),
        coverImageUrl: coverImageUrl.trim(),
        isLocked,
      });
    } else {
      success = await createDomain({
        name: name.trim(),
        description: description.trim(),
        coverImageUrl: coverImageUrl.trim(),
        isLocked,
      });
    }
    setSubmitting(false);

    if (success) {
      onClose();
    }
  };

  return (
    <ResponsiveModal
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-accent/10 text-accent flex items-center justify-center">
            <Layers className="w-4 h-4" />
          </div>
          <span>{domainToEdit ? 'Edit Course' : 'Create Course'}</span>
        </div>
      }
      description="Configure course curriculum properties, visual cover art, and learning objectives."
      dialogClassName="sm:max-w-lg p-6"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-label-secondary uppercase tracking-wider">
            Course Title *
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Artificial Intelligence & LLMs"
            className="w-full px-4 py-2.5 rounded-xl bg-surface-secondary border border-separator text-sm text-label-primary focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-label-secondary uppercase tracking-wider">
            Curriculum Description *
          </label>
          <textarea
            required
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Provide a high-level description of what students will master across this track..."
            className="w-full px-4 py-2.5 rounded-xl bg-surface-secondary border border-separator text-sm text-label-primary focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent resize-none"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-label-secondary uppercase tracking-wider flex items-center justify-between">
            <span>Cover Image URL *</span>
            <span className="text-[11px] font-normal lowercase">Preview below</span>
          </label>
          <input
            type="url"
            required
            value={coverImageUrl}
            onChange={(e) => setCoverImageUrl(e.target.value)}
            placeholder="https://images.unsplash.com/..."
            className="w-full px-4 py-2 rounded-xl bg-surface-secondary border border-separator text-xs text-label-primary font-mono focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
          />

          {/* Preset cover pickers */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {PRESET_COVERS.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCoverImageUrl(preset.url)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition cursor-pointer ${
                  coverImageUrl === preset.url
                    ? 'bg-accent text-white border-accent'
                    : 'bg-surface border-separator text-label-secondary hover:text-label-primary'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Visual preview */}
          {coverImageUrl && (
            <div className="relative w-full h-32 rounded-xl overflow-hidden mt-2 border border-separator">
              <img
                src={coverImageUrl}
                alt="Cover Preview"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = PRESET_COVERS[0].url;
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-3">
                <span className="text-xs font-semibold text-white drop-shadow">
                  {name || 'Domain Title Preview'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Domain Lock & Student Approval Toggle */}
        <div className="p-4 rounded-2xl bg-surface-secondary/70 border border-separator/80 space-y-2">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                  isLocked
                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                    : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                }`}
              >
                {isLocked ? <Lock className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
              </div>
              <div>
                <div className="text-xs font-bold text-label-primary">
                  {isLocked ? 'Domain Locked (Restricted)' : 'Approved & Unlocked for Students'}
                </div>
                <div className="text-[11px] text-label-secondary">
                  {isLocked
                    ? 'Students cannot access levels or submit quests until approved.'
                    : 'Enrolled students can freely study and progress sequentially.'}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsLocked(!isLocked)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                !isLocked ? 'bg-emerald-500' : 'bg-separator'
              }`}
              title={isLocked ? 'Click to approve & unlock' : 'Click to lock'}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  !isLocked ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        <div className="pt-4 border-t border-separator flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-full text-xs font-medium border border-separator text-label-secondary hover:text-label-primary cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || !name.trim() || !description.trim()}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-xs font-semibold bg-accent text-white hover:bg-accent-hover disabled:opacity-40 transition cursor-pointer shadow"
          >
            {submitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Saving...
              </>
            ) : domainToEdit ? (
              'Save Changes'
            ) : (
              'Create Course'
            )}
          </button>
        </div>
      </form>
    </ResponsiveModal>
  );
};

export default DomainEditorModal;
