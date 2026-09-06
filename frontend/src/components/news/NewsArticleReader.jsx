import React from 'react';
import { motion } from 'framer-motion';
import { X, Calendar, Eye, Share2, Tag, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

const NewsArticleReader = ({ article, onClose }) => {
  if (!article) return null;

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: article.title,
        text: article.content.slice(0, 100),
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Article link copied to clipboard!');
    }
  };

  const formattedDate = new Date(article.date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/90 backdrop-blur-xl overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 30 }}
        className="w-full max-w-3xl stellar-glass border border-white/10 my-8 overflow-hidden shadow-[0_25px_80px_rgba(0,0,0,0.9)] relative"
      >
        {/* Cover Image Header */}
        {article.coverImage ? (
          <div className="relative h-64 sm:h-80 w-full overflow-hidden">
            <img
              src={article.coverImage}
              alt={article.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-linear-to-t from-[#030303] via-[#030303]/40 to-transparent" />

            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2.5 rounded-full bg-black/60 text-white hover:bg-black/90 transition-all backdrop-blur-md border border-white/10"
            >
              <X size={18} />
            </button>
          </div>
        ) : (
          <div className="p-6 border-b border-white/10 flex justify-between items-center">
            <button
              onClick={onClose}
              className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft size={16} /> Back to News Feed
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/5 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        )}

        {/* Article Body Container */}
        <div className="p-6 sm:p-10 space-y-6">
          {/* Tags */}
          <div className="flex flex-wrap items-center gap-2">
            {article.tags?.map((t, idx) => (
              <span
                key={idx}
                className="px-3 py-1 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold"
              >
                #{t}
              </span>
            ))}
            {article.pinned && (
              <span className="px-3 py-1 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-black uppercase tracking-wider">
                Pinned Announcement
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="text-2xl sm:text-4xl font-black text-white leading-tight">
            {article.title}
          </h1>

          {/* Metadata banner */}
          <div className="flex flex-wrap items-center justify-between gap-4 py-4 border-y border-white/10 text-xs text-slate-400">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-800 border border-white/10 overflow-hidden flex items-center justify-center font-black text-white text-sm">
                {article.author?.profilePicUrl ? (
                  <img src={article.author.profilePicUrl} alt={article.author?.name} className="w-full h-full object-cover" />
                ) : (
                  (article.author?.name?.charAt(0) || 'A')
                )}
              </div>
              <div>
                <span className="font-bold text-white block">{article.author?.name || 'Code Circle Editorial'}</span>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider">{article.author?.role || 'Administrator'}</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <Calendar size={14} className="text-blue-400" />
                {formattedDate}
              </span>

              <span className="flex items-center gap-1.5">
                <Eye size={14} className="text-purple-400" />
                {article.viewsCount || 1} views
              </span>

              <button
                onClick={handleShare}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
                title="Share Article"
              >
                <Share2 size={16} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="text-slate-200 text-base leading-relaxed whitespace-pre-line font-sans space-y-4 pt-2">
            {article.content}
          </div>

          {/* Footer Close */}
          <div className="pt-6 border-t border-white/5 flex justify-between items-center">
            <span className="text-xs text-slate-500">Published by Code Circle Official</span>
            <button
              onClick={onClose}
              className="stellar-btn text-xs"
            >
              Close Article
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default NewsArticleReader;
