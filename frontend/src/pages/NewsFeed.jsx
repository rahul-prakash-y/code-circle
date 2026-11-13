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
import { NewsCardSkeleton } from '../components/ui/LoadingSkeleton';
import toast from 'react-hot-toast';
import { Button } from '@heroui/react';

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
    <div className="space-y-6 sm:space-y-8 py-2">
      {/* Page Header — Publication Masthead */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-separator">
        <div>
          <p className="meta-editorial mb-1">
            Club Publication
          </p>
          <h1 className="text-2xl sm:text-4xl font-bold text-label-primary tracking-tight font-heading">
            Official Announcements
          </h1>
          <p className="text-xs sm:text-sm text-label-secondary mt-1 max-w-xl">
            Technical initiatives, hackathon updates, workshops, and club milestones.
          </p>
        </div>

        {canPublish && (
          <Button
            variant="primary"
            size="sm"
            onPress={handleOpenCreate}
            className="flex items-center justify-center gap-2 self-start md:self-auto text-xs min-h-[40px]"
          >
            <Plus size={15} />
            <span>Publish Announcement</span>
          </Button>
        )}
      </div>

      {/* Featured / Pinned Announcement Hero */}
      {pinnedArticle && (
        <button
          type="button"
          onClick={() => handleOpenReader(pinnedArticle)}
          className="surface p-4 sm:p-7 lg:p-8 rounded-2xl sm:rounded-3xl relative overflow-hidden group cursor-pointer hover:shadow-md transition-shadow duration-200 text-left w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-center">
            {/* Image Column */}
            <div className="lg:col-span-5 h-52 sm:h-64 rounded-xl sm:rounded-2xl overflow-hidden relative border border-separator bg-canvas">
              <img
                src={pinnedArticle.coverImage || 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80'}
                alt={pinnedArticle.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-102"
              />
              <div className="absolute top-3 left-3 bg-surface/90 text-label-primary text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-md backdrop-blur-md border border-separator flex items-center gap-1.5 shadow-xs">
                <Pin size={11} className="text-accent" />
                Featured
              </div>
            </div>

            {/* Content Column */}
            <div className="lg:col-span-7 space-y-3.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="meta-editorial">
                  {pinnedArticle.tags?.[0] || 'Announcement'}
                </span>
                <span className="text-label-tertiary">·</span>
                <span className="text-xs text-label-secondary">
                  {new Date(pinnedArticle.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>

              <h2 className="text-xl sm:text-[26px] font-bold text-label-primary group-hover:text-accent transition-colors leading-snug font-heading">
                {pinnedArticle.title}
              </h2>

              <p className="text-xs sm:text-sm text-label-secondary line-clamp-3 leading-relaxed font-normal">
                {pinnedArticle.content}
              </p>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-separator">
                <div className="flex items-center gap-2 text-xs text-label-secondary">
                  <span>By {pinnedArticle.author?.name || 'Editorial Team'}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-label-tertiary">
                    <Eye size={12} /> {pinnedArticle.viewsCount || 0} views
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {canPublish && (
                    <>
                      <Button
                        size="sm"
                        variant="ghost"
                        isIconOnly
                        onPress={(e) => handleOpenEdit(pinnedArticle, e)}
                        className="min-h-[36px] min-w-[36px] text-label-secondary hover:text-label-primary"
                        title="Edit Article"
                        aria-label="Edit Article"
                      >
                        <Edit3 size={14} />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        isIconOnly
                        onPress={(e) => handleDelete(pinnedArticle._id, e)}
                        className="min-h-[36px] min-w-[36px] text-label-secondary hover:text-destructive hover:bg-destructive/10"
                        title="Delete Article"
                        aria-label="Delete Article"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </>
                  )}
                  <span className="text-xs font-semibold text-accent flex items-center gap-1">
                    Read article <ArrowRight size={13} className="transition-transform duration-200 group-hover:translate-x-[3px]" />
                  </span>
                </div>
              </div>
            </div>
          </div>
        </button>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
        {/* Category Pills */}
        <div className="flex items-center gap-1 bg-surface border border-separator p-1 rounded-full overflow-x-auto no-scrollbar max-w-full">
          {TAGS.map((t) => (
            <Button
              key={t}
              size="sm"
              variant={selectedTag === t ? 'primary' : 'ghost'}
              onPress={() => setSelectedTag(t)}
              className="px-3.5 min-h-[34px] rounded-full text-xs font-medium whitespace-nowrap"
            >
              {t}
            </Button>
          ))}
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-auto sm:min-w-[240px]">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-label-tertiary" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search announcements…"
            className="input-base pl-9 text-xs min-h-[38px] w-full"
          />
        </div>
      </div>

      {/* News Feed Cards Grid */}
      {loading && newsList.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <NewsCardSkeleton key={i} />
          ))}
        </div>
      ) : standardArticles.length === 0 && !pinnedArticle ? (
        <div className="surface p-10 sm:p-14 text-center rounded-[18px]">
          <Newspaper size={32} className="text-label-tertiary mx-auto mb-3 opacity-30" />
          <h3 className="text-base font-semibold text-label-primary">No announcements found</h3>
          <p className="text-xs text-label-secondary mt-1">
            Try adjusting your search filter or check back later.
          </p>
          {canPublish && (
            <Button variant="primary" size="sm" onPress={handleOpenCreate} className="text-xs mt-4 min-h-[40px]">
              Publish First Announcement
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {standardArticles.map((article) => (
            <button
              type="button"
              key={article._id}
              onClick={() => handleOpenReader(article)}
              className="surface overflow-hidden hover:shadow-md transition-shadow duration-200 group cursor-pointer flex flex-col justify-between rounded-[18px] text-left w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              {/* Card Cover */}
              <div>
                <div className="h-44 w-full overflow-hidden relative border-b border-separator bg-canvas">
                  <img
                    src={article.coverImage || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=600&q=80'}
                    alt={article.title}
                    className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.02]"
                  />
                  {article.tags?.[0] && (
                    <div className="absolute top-3 left-3">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-surface/90 text-label-primary border border-separator uppercase tracking-wider backdrop-blur-md">
                        {article.tags[0]}
                      </span>
                    </div>
                  )}
                </div>

                {/* Card Text Content */}
                <div className="p-4 sm:p-5 space-y-2">
                  <div className="text-[11px] text-label-tertiary">
                    {new Date(article.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </div>
                  <h3 className="text-base font-bold text-label-primary group-hover:text-accent transition-colors duration-180 line-clamp-2 leading-snug font-heading">
                    {article.title}
                  </h3>
                  <p className="text-xs text-label-secondary line-clamp-2 leading-relaxed font-normal">
                    {article.content}
                  </p>
                </div>
              </div>

              {/* Card Footer */}
              <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-3 border-t border-separator flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 min-w-0 pr-2">
                  <span className="text-label-secondary truncate max-w-[120px]">
                    {article.author?.name || 'Club Staff'}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {canPublish && (
                    <>
                      <Button
                        size="sm"
                        variant="ghost"
                        isIconOnly
                        onPress={(e) => handleOpenEdit(article, e)}
                        className="min-h-[34px] min-w-[34px] text-label-secondary hover:text-label-primary"
                        title="Edit Article"
                        aria-label="Edit Article"
                      >
                        <Edit3 size={13} />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        isIconOnly
                        onPress={(e) => handleDelete(article._id, e)}
                        className="min-h-[34px] min-w-[34px] text-label-secondary hover:text-destructive hover:bg-destructive/10"
                        title="Delete Article"
                        aria-label="Delete Article"
                      >
                        <Trash2 size={13} />
                      </Button>
                    </>
                  )}
                  <span className="font-medium text-accent flex items-center gap-1 pl-1">
                    Read <ArrowRight size={12} className="transition-transform duration-200 group-hover:translate-x-[3px]" />
                  </span>
                </div>
              </div>
            </button>
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
