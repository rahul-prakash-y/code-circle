import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Newspaper, 
  Search, 
  Plus, 
  Calendar, 
  Eye, 
  Tag, 
  Pin, 
  ArrowRight, 
  Edit3, 
  Trash2, 
  Sparkles,
  Loader2,
  Clock
} from 'lucide-react';
import useNewsStore from '../store/useNewsStore';
import useAuthStore from '../store/useAuthStore';
import useProfileStore from '../store/useProfileStore';
import NewsModal from '../components/news/NewsModal';
import NewsArticleReader from '../components/news/NewsArticleReader';
import toast from 'react-hot-toast';

const TAGS = ['All', 'Announcement', 'Hackathon', 'Workshop', 'Competitive', 'General'];

const NewsFeed = () => {
  const { 
    newsList, 
    loading, 
    fetchNews, 
    fetchNewsById,
    deleteNews, 
    selectedTag, 
    setSelectedTag, 
    searchQuery, 
    setSearchQuery 
  } = useNewsStore();

  const { user } = useAuthStore();
  const { profile } = useProfileStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [articleToEdit, setArticleToEdit] = useState(null);
  const [readingArticle, setReadingArticle] = useState(null);

  const canPublish = user && (
    profile?.role === 'Admin' || 
    profile?.role === 'SuperAdmin' || 
    profile?.role === 'Faculty' || 
    profile?.role === 'Committee' ||
    user?.role === 'Admin' ||
    user?.role === 'SuperAdmin'
  );

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  const handleOpenCreate = () => {
    setArticleToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (article, e) => {
    e.stopPropagation();
    setArticleToEdit(article);
    setIsModalOpen(true);
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this announcement?')) {
      try {
        await deleteNews(id);
        toast.success('Announcement deleted successfully');
      } catch {
        toast.error('Failed to delete announcement');
      }
    }
  };

  const handleOpenReader = async (article) => {
    try {
      const full = await fetchNewsById(article._id);
      setReadingArticle(full);
    } catch {
      setReadingArticle(article);
    }
  };

  const pinnedArticle = newsList.find((n) => n.pinned);
  const standardArticles = pinnedArticle
    ? newsList.filter((n) => n._id !== pinnedArticle._id)
    : newsList;

  return (
    <div className="space-y-10 py-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="p-1.5 rounded-lg bg-accent/10 text-accent-muted border border-accent/20">
              <Newspaper size={16} />
            </span>
            <span className="text-xs font-black uppercase tracking-[0.25em] text-accent-muted">
              Club Bulletin & News
            </span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-text-primary tracking-tight">
            Official Announcements
          </h1>
          <p className="text-sm text-text-muted mt-2 max-w-xl">
            Stay updated with hackathons, workshops, technical initiatives, and club milestones.
          </p>
        </div>

        {canPublish && (
          <button
            onClick={handleOpenCreate}
            className="btn-primary flex items-center gap-2 self-start md:self-auto group shadow-[0_0_25px_rgba(59,130,246,0.3)]"
          >
            <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
            <span>Publish Announcement</span>
          </button>
        )}
      </div>

      {/* Featured / Pinned Announcement Hero */}
      {pinnedArticle && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => handleOpenReader(pinnedArticle)}
          className="glass p-8 sm:p-10 border-accent/30 relative overflow-hidden group cursor-pointer hover:border-blue-500/60 transition-all duration-500"
        >
          <div className="absolute top-0 right-0 w-96 h-96 -mr-20 -mt-20 rounded-full bg-blue-500/15 blur-3xl pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
            {/* Image Column */}
            <div className="lg:col-span-5 h-64 sm:h-72 rounded-2xl overflow-hidden relative border border-border group-hover:border-blue-500/40 transition-colors">
              <img
                src={pinnedArticle.coverImage || 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80'}
                alt={pinnedArticle.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute top-3 left-3 bg-amber-500/90 text-black text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-lg backdrop-blur-md flex items-center gap-1.5 shadow-lg">
                <Pin size={12} />
                Featured Announcement
              </div>
            </div>

            {/* Content Column */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                {pinnedArticle.tags?.map((t, idx) => (
                  <span
                    key={idx}
                    className="text-xs font-bold text-accent-muted bg-accent/10 border border-accent/20 px-3 py-1 rounded-xl"
                  >
                    #{t}
                  </span>
                ))}
                <span className="text-xs text-text-muted flex items-center gap-1.5">
                  <Calendar size={13} />
                  {new Date(pinnedArticle.date).toLocaleDateString()}
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-black text-text-primary group-hover:text-accent-muted transition-colors leading-snug">
                {pinnedArticle.title}
              </h2>

              <p className="text-sm text-text-secondary line-clamp-3 leading-relaxed">
                {pinnedArticle.content}
              </p>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2 text-xs text-text-muted font-bold">
                  <span>By {pinnedArticle.author?.name || 'Editorial Team'}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Eye size={12} /> {pinnedArticle.viewsCount || 0} views
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {canPublish && (
                    <>
                      <button
                        onClick={(e) => handleOpenEdit(pinnedArticle, e)}
                        className="p-2.5 rounded-xl bg-surface-elevated hover:bg-surface-elevated text-text-secondary hover:text-text-primary transition-colors"
                        title="Edit Article"
                      >
                        <Edit3 size={15} />
                      </button>
                      <button
                        onClick={(e) => handleDelete(pinnedArticle._id, e)}
                        className="p-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors"
                        title="Delete Article"
                      >
                        <Trash2 size={15} />
                      </button>
                    </>
                  )}
                  <span className="btn-primary py-2.5 px-4 text-xs flex items-center gap-1.5">
                    Read Article <ArrowRight size={14} />
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 pt-2">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1">
          {TAGS.map((t) => (
            <button
              key={t}
              onClick={() => setSelectedTag(t)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap border ${
                selectedTag === t
                  ? 'bg-accent text-text-primary border-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.3)]'
                  : 'bg-surface-elevated text-text-muted border-border hover:bg-surface-elevated hover:text-text-primary'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Search input */}
        <div className="relative min-w-[240px]">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search news or tags..."
            className="w-full bg-surface-elevated border border-border rounded-2xl pl-10 pr-4 py-2.5 text-xs text-text-primary placeholder-slate-500 focus:outline-none focus:border-accent/50 transition-all"
          />
        </div>
      </div>

      {/* News Feed Cards Grid */}
      {loading && newsList.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-text-muted">
          <Loader2 size={36} className="animate-spin text-accent mb-3" />
          <p className="text-sm font-bold">Fetching latest announcements...</p>
        </div>
      ) : standardArticles.length === 0 && !pinnedArticle ? (
        <div className="glass p-16 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-surface-elevated border border-border flex items-center justify-center mx-auto text-text-muted">
            <Newspaper size={32} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-text-primary">No announcements found</h3>
            <p className="text-xs text-text-muted mt-1">
              Try adjusting your search filter or check back later.
            </p>
          </div>
          {canPublish && (
            <button onClick={handleOpenCreate} className="btn-primary text-xs mt-2">
              Publish First Announcement
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {standardArticles.map((article) => (
            <motion.div
              key={article._id}
              whileHover={{ y: -5 }}
              onClick={() => handleOpenReader(article)}
              className="glass overflow-hidden border-border hover:border-border-hover transition-all duration-300 group cursor-pointer flex flex-col justify-between"
            >
              {/* Card Cover */}
              <div>
                <div className="h-48 w-full overflow-hidden relative border-b border-border bg-surface-elevated">
                  <img
                    src={article.coverImage || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=600&q=80'}
                    alt={article.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-[#030303] via-transparent to-transparent opacity-80" />

                  <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                    {article.tags?.slice(0, 2).map((tg, i) => (
                      <span
                        key={i}
                        className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-black/70 text-accent-muted backdrop-blur-md border border-border uppercase tracking-wider"
                      >
                        #{tg}
                      </span>
                    ))}
                  </div>

                  <div className="absolute bottom-3 left-3 text-[11px] font-bold text-text-secondary flex items-center gap-1.5 backdrop-blur-md bg-black/50 px-2.5 py-1 rounded-lg">
                    <Calendar size={12} className="text-accent-muted" />
                    {new Date(article.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </div>
                </div>

                {/* Card Text Content */}
                <div className="p-6 space-y-2.5">
                  <h3 className="text-lg font-black text-text-primary group-hover:text-accent-muted transition-colors line-clamp-2 leading-snug">
                    {article.title}
                  </h3>
                  <p className="text-xs text-text-muted line-clamp-3 leading-relaxed">
                    {article.content}
                  </p>
                </div>
              </div>

              {/* Card Footer */}
              <div className="px-6 pb-6 pt-2 border-t border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-surface-elevated border border-border flex items-center justify-center text-[10px] font-bold text-text-primary">
                    {article.author?.name?.charAt(0) || 'A'}
                  </div>
                  <span className="text-[11px] text-text-muted font-bold truncate max-w-[100px]">
                    {article.author?.name || 'Club Staff'}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  {canPublish && (
                    <>
                      <button
                        onClick={(e) => handleOpenEdit(article, e)}
                        className="p-2 rounded-lg bg-surface-elevated hover:bg-surface-elevated text-text-muted hover:text-text-primary transition-colors"
                        title="Edit Article"
                      >
                        <Edit3 size={13} />
                      </button>
                      <button
                        onClick={(e) => handleDelete(article._id, e)}
                        className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                        title="Delete Article"
                      >
                        <Trash2 size={13} />
                      </button>
                    </>
                  )}
                  <span className="text-xs font-bold text-accent-muted group-hover:translate-x-1 transition-transform flex items-center gap-1 pl-1">
                    Read <ArrowRight size={13} />
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modals */}
      <NewsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        articleToEdit={articleToEdit}
      />

      <NewsArticleReader
        article={readingArticle}
        onClose={() => setReadingArticle(null)}
      />
    </div>
  );
};

export default NewsFeed;
