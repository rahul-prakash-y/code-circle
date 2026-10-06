import React, { useState, useEffect } from 'react';
import { X, Image as ImageIcon, Calendar, Tag, Pin, FileText, Loader2, Sparkles } from 'lucide-react';
import useNewsStore from '../../store/useNewsStore';
import toast from 'react-hot-toast';
import ResponsiveModal from '../ui/ResponsiveModal';

const DEFAULT_COVER = 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80';

const SUGGESTED_TAGS = ['Announcement', 'Hackathon', 'Workshop', 'Technical', 'Competitive', 'General'];

const NewsModal = ({ isOpen, onClose, articleToEdit = null }) => {
  const { createNews, updateNews } = useNewsStore();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [date, setDate] = useState('');
  const [tags, setTags] = useState(['Announcement']);
  const [tagInput, setTagInput] = useState('');
  const [pinned, setPinned] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (articleToEdit) {
        setTitle(articleToEdit.title || '');
        setContent(articleToEdit.content || '');
        setCoverImage(articleToEdit.coverImage || '');
        setDate(articleToEdit.date ? new Date(articleToEdit.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10));
        setTags(articleToEdit.tags?.length > 0 ? articleToEdit.tags : ['Announcement']);
        setPinned(Boolean(articleToEdit.pinned));
      } else {
        setTitle('');
        setContent('');
        setCoverImage('');
        setDate(new Date().toISOString().slice(0, 10));
        setTags(['Announcement']);
        setPinned(false);
      }
    }
  }, [isOpen, articleToEdit]);

  const handleAddTag = (tagToAdd) => {
    const trimmed = (tagToAdd || tagInput).trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Article title is required');
      return;
    }
    if (!content.trim()) {
      toast.error('Article content is required');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        title: title.trim(),
        content: content.trim(),
        coverImage: coverImage.trim() || DEFAULT_COVER,
        date: date ? new Date(date) : new Date(),
        tags,
        pinned,
      };

      if (articleToEdit) {
        await updateNews(articleToEdit._id, payload);
        toast.success('Announcement updated successfully!');
      } else {
        await createNews(payload);
        toast.success('Announcement published successfully!');
      }

      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to save announcement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ResponsiveModal
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent shrink-0">
            <Sparkles size={20} />
          </div>
          <div>
            <h2 className="text-xl font-black text-text-primary leading-tight">
              {articleToEdit ? 'Edit Announcement' : 'Publish New Announcement'}
            </h2>
            <p className="text-xs text-text-muted font-normal mt-0.5">
              Broadcast news, updates, or hackathons to the community
            </p>
          </div>
        </div>
      }
      dialogClassName="sm:max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5 pt-2">
        {/* Title */}
        <div>
          <label className="input-label">Article Title *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Code Circle Annual Hackathon 2026 Registration Opened"
            className="input-field"
            required
          />
        </div>

        {/* Date and Pinned Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="input-label flex items-center gap-2">
              <Calendar size={14} className="text-accent" />
              Publication Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="input-field"
              required
            />
          </div>

          <div>
            <label className="input-label flex items-center gap-2">
              <Pin size={14} className="text-amber-400" />
              Highlight Priority
            </label>
            <label className="flex items-center gap-3 p-3.5 rounded-2xl bg-surface-elevated border border-border cursor-pointer hover:bg-surface-elevated transition-colors">
              <input
                type="checkbox"
                checked={pinned}
                onChange={(e) => setPinned(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 bg-surface-elevated border-border-hover cursor-pointer"
              />
              <span className="text-xs font-bold text-text-secondary">Pin to top of news feed</span>
            </label>
          </div>
        </div>

        {/* Cover Image URL */}
        <div>
          <label className="input-label flex items-center gap-2">
            <ImageIcon size={14} className="text-purple-400" />
            Cover Image URL (Optional)
          </label>
          <input
            type="url"
            value={coverImage}
            onChange={(e) => setCoverImage(e.target.value)}
            placeholder="https://images.unsplash.com/... or paste image URL"
            className="input-field text-xs"
          />
          {coverImage && (
            <div className="mt-2 h-28 rounded-xl overflow-hidden border border-border relative">
              <img
                src={coverImage}
                alt="Cover preview"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
              <span className="absolute bottom-2 left-2 text-[10px] bg-black/70 px-2 py-0.5 rounded text-white backdrop-blur-sm">
                Preview
              </span>
            </div>
          )}
        </div>

        {/* Tags */}
        <div>
          <label className="input-label flex items-center gap-2">
            <Tag size={14} className="text-emerald-400" />
            Category Tags
          </label>

          {/* Suggested quick tag pills */}
          <div className="flex flex-wrap gap-2 mb-2">
            {SUGGESTED_TAGS.map((stag) => (
              <button
                type="button"
                key={stag}
                onClick={() => handleAddTag(stag)}
                className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                  tags.includes(stag)
                    ? 'bg-accent text-white border-blue-400'
                    : 'bg-surface-elevated text-text-muted border-border hover:bg-surface-elevated'
                }`}
              >
                + {stag}
              </button>
            ))}
          </div>

          {/* Current Active Tags */}
          <div className="flex flex-wrap gap-2 items-center p-3 rounded-2xl bg-surface-elevated border border-border">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-500/15 border border-accent/30 text-blue-400 text-xs font-bold"
              >
                #{tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="text-accent hover:text-text-primary cursor-pointer"
                >
                  ×
                </button>
              </span>
            ))}
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddTag();
                }
              }}
              placeholder="Type tag & press Enter"
              className="bg-transparent text-xs text-text-primary placeholder:text-text-muted focus:outline-none flex-1 min-w-[140px]"
            />
          </div>
        </div>

        {/* Article Content */}
        <div>
          <label className="input-label flex items-center gap-2">
            <FileText size={14} className="text-amber-400" />
            Article Content *
          </label>
          <textarea
            rows={5}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write the article details, announcement body, schedule, rules, or prizes..."
            className="input-field resize-none text-sm leading-relaxed"
            required
          />
        </div>

        {/* Actions */}
        <div className="pt-2 flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 btn-primary flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Publishing...
              </>
            ) : (
              <>
                <Sparkles size={18} />
                {articleToEdit ? 'Save Changes' : 'Publish Article'}
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="btn-secondary px-6 text-xs cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </form>
    </ResponsiveModal>
  );
};

export default NewsModal;
