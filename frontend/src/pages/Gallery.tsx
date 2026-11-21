import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Images,
  Calendar,
  MapPin,
  Plus,
  ChevronLeft,
  ChevronRight,
  X,
  Sparkles,
  Camera,
  Layers,
  Upload,
  Trash2,
  ExternalLink,
  Check,
  RefreshCw,
  Search,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/axios';
import useAuthStore from '../store/useAuthStore';
import useProfileStore from '../store/useProfileStore';
import { EmilButton, EmilCard } from '../components/ui/emil-ui';
import {
  EMIL_EASE_OUT,
  EMIL_EASE_IN_OUT,
  DURATION_MODAL,
  DURATION_FAST,
  emilModalVariants,
  emilBackdropVariants,
} from '../lib/motion';

export interface GalleryPhoto {
  _id?: string;
  url: string;
  caption?: string;
  source?: string;
}

export interface GalleryAlbum {
  _id: string;
  id: string;
  title: string;
  type: string;
  startDate: string | null;
  endDate: string | null;
  venueOrLink: string;
  status: string;
  coverImage: string | null;
  photoCount: number;
  images: GalleryPhoto[];
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

const CATEGORIES = ['All', 'Technical', 'Workshop', 'Hackathon', 'Non-Technical'] as const;

export const Gallery: React.FC = () => {
  const { user } = useAuthStore();
  const { profile } = useProfileStore();

  const userRole = user?.role || profile?.role;
  const canManageGallery = useMemo(() => {
    return ['Admin', 'SuperAdmin', 'Faculty', 'Committee', 'Coordinator'].includes(userRole || '');
  }, [userRole]);

  // Gallery state
  const [albums, setAlbums] = useState<GalleryAlbum[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 1,
    hasMore: false,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Lightbox Modal state
  const [lightboxAlbum, setLightboxAlbum] = useState<GalleryAlbum | null>(null);
  const [photoIndex, setPhotoIndex] = useState<number>(0);

  // Admin Quick-Add Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [eventList, setEventList] = useState<Array<{ _id: string; title: string; date?: string; type?: string }>>([]);
  const [loadingEvents, setLoadingEvents] = useState<boolean>(false);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [photoUrlInput, setPhotoUrlInput] = useState<string>('');
  const [captionInput, setCaptionInput] = useState<string>('');
  const [queuedPhotos, setQueuedPhotos] = useState<Array<{ url: string; caption: string }>>([]);
  const [savingPhotos, setSavingPhotos] = useState<boolean>(false);

  // Fetch gallery albums from backend
  const fetchGallery = useCallback(
    async (targetPage = 1, append = false) => {
      try {
        if (append) {
          setLoadingMore(true);
        } else {
          setLoading(true);
        }
        setError(null);

        const params = new URLSearchParams();
        params.set('page', String(targetPage));
        params.set('limit', '12');
        if (selectedCategory && selectedCategory !== 'All') {
          params.set('category', selectedCategory);
        }
        if (searchQuery.trim()) {
          params.set('search', searchQuery.trim());
        }

        const res = await api.get(`/gallery?${params.toString()}`);
        if (res.data && res.data.success) {
          const incoming: GalleryAlbum[] = res.data.data || [];
          setAlbums((prev) => (append ? [...prev, ...incoming] : incoming));
          setPagination(
            res.data.pagination || {
              page: targetPage,
              limit: 12,
              total: incoming.length,
              totalPages: 1,
              hasMore: false,
            }
          );
        } else {
          setError('Failed to load gallery albums.');
        }
      } catch (err: any) {
        console.error('Error fetching gallery:', err);
        setError(err.response?.data?.error || 'Unable to connect to gallery service.');
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [selectedCategory, searchQuery]
  );

  useEffect(() => {
    setPage(1);
    fetchGallery(1, false);
  }, [selectedCategory, fetchGallery]);

  // Load more pagination handler
  const handleLoadMore = () => {
    if (pagination.hasMore && !loadingMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchGallery(nextPage, true);
    }
  };

  // Keyboard navigation for Fullscreen Lightbox
  useEffect(() => {
    if (!lightboxAlbum) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLightboxAlbum(null);
      } else if (e.key === 'ArrowLeft') {
        setPhotoIndex((prev) => (prev > 0 ? prev - 1 : (lightboxAlbum.images.length - 1)));
      } else if (e.key === 'ArrowRight') {
        setPhotoIndex((prev) => (prev < lightboxAlbum.images.length - 1 ? prev + 1 : 0));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxAlbum]);

  // Open Lightbox
  const openLightbox = (album: GalleryAlbum, initialIdx = 0) => {
    if (!album.images || album.images.length === 0) {
      toast('This event has no photo memories attached yet.', {
        icon: '📷',
      });
      return;
    }
    setLightboxAlbum(album);
    setPhotoIndex(Math.max(0, Math.min(initialIdx, album.images.length - 1)));
  };

  // Lightbox navigation
  const handlePrevPhoto = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!lightboxAlbum) return;
    setPhotoIndex((prev) => (prev > 0 ? prev - 1 : lightboxAlbum.images.length - 1));
  };

  const handleNextPhoto = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!lightboxAlbum) return;
    setPhotoIndex((prev) => (prev < lightboxAlbum.images.length - 1 ? prev + 1 : 0));
  };

  // Fetch list of events when Admin modal opens
  const openAdminAddModal = async () => {
    setIsAddModalOpen(true);
    setQueuedPhotos([]);
    setPhotoUrlInput('');
    setCaptionInput('');
    if (eventList.length === 0) {
      try {
        setLoadingEvents(true);
        const res = await api.get('/events?limit=100');
        const rawEvents = res.data?.data || res.data?.events || (Array.isArray(res.data) ? res.data : []);
        setEventList(rawEvents);
        if (rawEvents.length > 0) {
          setSelectedEventId(rawEvents[0]._id || rawEvents[0].id);
        }
      } catch (err) {
        console.error('Failed to fetch events for admin picker:', err);
        toast.error('Failed to load events for selection.');
      } finally {
        setLoadingEvents(false);
      }
    }
  };

  // Add a single photo to the local staging queue
  const handleQueuePhoto = () => {
    if (!photoUrlInput.trim()) {
      toast.error('Please enter a valid image URL or upload a file.');
      return;
    }
    setQueuedPhotos((prev) => [
      ...prev,
      { url: photoUrlInput.trim(), caption: captionInput.trim() },
    ]);
    setPhotoUrlInput('');
    setCaptionInput('');
    toast.success('Photo added to staging queue.');
  };

  // Handle local image file upload via FileReader
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file (PNG, JPG, WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image exceeds 5MB size limit. Please compress or link via URL.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPhotoUrlInput(reader.result);
        if (!captionInput) {
          setCaptionInput(file.name.replace(/\.[^/.]+$/, ''));
        }
      }
    };
    reader.readAsDataURL(file);
  };

  // Remove photo from staging queue
  const handleRemoveQueuedPhoto = (idx: number) => {
    setQueuedPhotos((prev) => prev.filter((_, i) => i !== idx));
  };

  // Submit queued photos to backend PATCH /api/events/:id/gallery
  const handleSaveGalleryPhotos = async () => {
    if (!selectedEventId) {
      toast.error('Please select a target event.');
      return;
    }

    const photosToSend = [...queuedPhotos];
    if (photoUrlInput.trim()) {
      photosToSend.push({ url: photoUrlInput.trim(), caption: captionInput.trim() });
    }

    if (photosToSend.length === 0) {
      toast.error('Please add at least one photo URL to save.');
      return;
    }

    try {
      setSavingPhotos(true);
      const res = await api.patch(`/events/${selectedEventId}/gallery`, {
        action: 'append',
        images: photosToSend,
      });

      if (res.data?.success) {
        toast.success(res.data.message || 'Gallery updated successfully!');
        setIsAddModalOpen(false);
        setQueuedPhotos([]);
        setPhotoUrlInput('');
        setCaptionInput('');
        // Refresh gallery
        fetchGallery(1, false);
      } else {
        toast.error(res.data?.error || 'Failed to update event gallery.');
      }
    } catch (err: any) {
      console.error('Error updating event gallery:', err);
      toast.error(err.response?.data?.error || 'Failed to save photos to event gallery.');
    } finally {
      setSavingPhotos(false);
    }
  };

  // Format date helper
  const formatDateDisplay = (d: string | null) => {
    if (!d) return 'Date TBA';
    try {
      const parsed = new Date(d);
      if (isNaN(parsed.getTime())) return String(d);
      return parsed.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return String(d);
    }
  };

  return (
    <div className="min-h-screen bg-canvas text-label-primary px-4 sm:px-6 lg:px-8 py-8 transition-colors duration-200">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* ══════════════════════════════════════════════════════════════
            1. HEADER & ACTIONS (Apple Spatial UI / Linear Craft)
        ══════════════════════════════════════════════════════════════ */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-separator/60">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[12px] font-medium bg-primary/10 text-primary border border-primary/20 backdrop-blur-md">
              <Sparkles size={13} className="text-primary" />
              <span>Memories & Visual Archive</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-label-primary font-sans">
              Event Gallery
            </h1>
            <p className="text-[14px] sm:text-[15px] text-label-secondary max-w-2xl">
              Highlights and moments from Code Circle BIT events. Relive hackathons, workshops, and student achievements.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {canManageGallery && (
              <EmilButton
                variant="solid"
                size="md"
                onClick={openAdminAddModal}
                className="gap-2 shadow-sm font-semibold"
              >
                <Plus size={16} />
                <span>Add Event Photos</span>
              </EmilButton>
            )}

            <EmilButton
              variant="outline"
              size="md"
              isIconOnly
              onClick={() => fetchGallery(1, false)}
              className="text-label-secondary hover:text-label-primary"
              aria-label="Refresh Gallery"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            </EmilButton>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════
            2. FILTER PILLS & SEARCH BAR
        ══════════════════════════════════════════════════════════════ */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1.5 sm:pb-0 scrollbar-none">
            {CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <EmilButton
                  key={cat}
                  variant={isActive ? 'solid' : 'flat'}
                  size="sm"
                  onClick={() => setSelectedCategory(cat)}
                  className={`rounded-full px-4 text-[13px] transition-all whitespace-nowrap ${
                    isActive
                      ? 'shadow-sm'
                      : 'text-label-secondary hover:text-label-primary bg-surface-secondary'
                  }`}
                >
                  {cat}
                </EmilButton>
              );
            })}
          </div>

          {/* Quick Search */}
          <div className="relative w-full sm:w-72">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-label-secondary" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchGallery(1, false)}
              placeholder="Search albums..."
              className="w-full h-9 pl-9 pr-3 text-[13px] rounded-xl bg-surface-secondary border border-separator text-label-primary placeholder:text-label-secondary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  fetchGallery(1, false);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-label-secondary hover:text-label-primary p-0.5"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════
            3. EVENT ALBUM GRID (Responsive Masonry/Bento Grid)
        ══════════════════════════════════════════════════════════════ */}
        {loading && albums.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl border border-separator bg-surface p-4 space-y-4 animate-pulse"
              >
                <div className="w-full aspect-video rounded-xl bg-surface-secondary" />
                <div className="space-y-2">
                  <div className="h-5 bg-surface-secondary rounded-md w-3/4" />
                  <div className="h-4 bg-surface-secondary rounded-md w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-12 text-center rounded-2xl border border-destructive/20 bg-destructive/5 space-y-3">
            <p className="text-[14px] text-destructive font-medium">{error}</p>
            <EmilButton variant="outline" size="sm" onClick={() => fetchGallery(1, false)}>
              Retry Loading
            </EmilButton>
          </div>
        ) : albums.length === 0 ? (
          <div className="p-16 text-center rounded-2xl border border-separator/80 bg-surface/50 backdrop-blur-md space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-surface-secondary flex items-center justify-center mx-auto text-label-secondary border border-separator">
              <Camera size={26} />
            </div>
            <div className="space-y-1 max-w-sm mx-auto">
              <h3 className="text-[17px] font-bold text-label-primary">No Event Albums Found</h3>
              <p className="text-[13px] text-label-secondary">
                {selectedCategory !== 'All'
                  ? `No photos found in the "${selectedCategory}" category.`
                  : 'No past event photo memories have been posted yet.'}
              </p>
            </div>
            {canManageGallery && (
              <EmilButton variant="solid" size="sm" onClick={openAdminAddModal} className="gap-2">
                <Plus size={15} />
                <span>Upload First Event Photo</span>
              </EmilButton>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {albums.map((album) => {
              const hasPhotos = album.images && album.images.length > 0;
              const displayCover = album.coverImage;

              return (
                <EmilCard
                  key={album._id}
                  isPressable
                  onClick={() => openLightbox(album, 0)}
                  className="group relative flex flex-col justify-between overflow-hidden border-separator hover:border-primary/40 transition-all p-3.5 bg-surface"
                >
                  <div className="space-y-3">
                    {/* Cover Photo / Spatial Glass Visual */}
                    <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-surface-secondary border border-separator/60">
                      {displayCover ? (
                        <img
                          src={displayCover}
                          alt={album.title}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-surface-secondary to-surface text-label-secondary p-4 text-center">
                          <Camera size={28} className="opacity-50" />
                          <span className="text-[12px] font-medium opacity-75">No Cover Photo</span>
                        </div>
                      )}

                      {/* Photo count pill overlay */}
                      <div className="absolute top-2.5 right-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-black/60 text-white backdrop-blur-md border border-white/10 shadow-sm">
                        <Images size={12} />
                        <span>{album.photoCount} {album.photoCount === 1 ? 'Photo' : 'Photos'}</span>
                      </div>

                      {/* Event Type / Category Badge */}
                      <div className="absolute bottom-2.5 left-2.5 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-surface/90 text-label-primary backdrop-blur-md border border-separator/80 shadow-sm">
                        <span>{album.type || 'Event'}</span>
                      </div>
                    </div>

                    {/* Album Info */}
                    <div className="space-y-1.5 px-1">
                      <h3 className="text-[16px] font-bold tracking-tight text-label-primary line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                        {album.title}
                      </h3>

                      <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-[12px] text-label-secondary">
                        <div className="flex items-center gap-1">
                          <Calendar size={13} className="text-label-secondary/80" />
                          <span>{formatDateDisplay(album.startDate)}</span>
                        </div>

                        <div className="flex items-center gap-1 max-w-[180px] truncate">
                          <MapPin size={13} className="text-label-secondary/80 shrink-0" />
                          <span className="truncate">{album.venueOrLink || 'Campus / Online'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom Strip */}
                  <div className="pt-3 mt-3 border-t border-separator/40 flex items-center justify-between text-[12px] px-1">
                    <span className="text-primary font-medium inline-flex items-center gap-1 group-hover:underline">
                      View Album &rarr;
                    </span>

                    {canManageGallery && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEventId(album._id);
                          setIsAddModalOpen(true);
                        }}
                        className="text-label-secondary hover:text-primary transition-colors inline-flex items-center gap-1 text-[11px] font-medium"
                      >
                        <Plus size={12} />
                        <span>Add Photos</span>
                      </button>
                    )}
                  </div>
                </EmilCard>
              );
            })}
          </div>
        )}

        {/* Load More Button */}
        {pagination.hasMore && (
          <div className="pt-4 text-center">
            <EmilButton
              variant="outline"
              size="md"
              onClick={handleLoadMore}
              isLoading={loadingMore}
              className="px-6 gap-2"
            >
              <span>Load More Memories</span>
            </EmilButton>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════
          4. FULLSCREEN LIGHTBOX MODAL (Emil Kowalski sub-300ms physics)
      ══════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {lightboxAlbum && lightboxAlbum.images.length > 0 && (
          <motion.div
            variants={emilBackdropVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-2xl p-2 sm:p-6 select-none"
            onClick={() => setLightboxAlbum(null)}
          >
            <motion.div
              variants={emilModalVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: DURATION_MODAL, ease: EMIL_EASE_OUT }}
              className="relative w-full max-w-6xl h-full max-h-[92vh] flex flex-col justify-between overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Lightbox Top Bar */}
              <div className="flex items-center justify-between gap-4 px-4 py-3 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 text-white z-20">
                <div className="min-w-0">
                  <h4 className="text-[15px] sm:text-[17px] font-bold truncate">
                    {lightboxAlbum.title}
                  </h4>
                  <div className="flex items-center gap-3 text-[12px] text-white/70">
                    <span>{formatDateDisplay(lightboxAlbum.startDate)}</span>
                    <span>&bull;</span>
                    <span>
                      Photo {photoIndex + 1} of {lightboxAlbum.images.length}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <EmilButton
                    variant="ghost"
                    size="sm"
                    isIconOnly
                    onClick={() => setLightboxAlbum(null)}
                    className="text-white/80 hover:text-white hover:bg-white/10 rounded-full"
                    aria-label="Close Lightbox"
                  >
                    <X size={18} />
                  </EmilButton>
                </div>
              </div>

              {/* Main Photo Center Container */}
              <div className="relative flex-1 flex items-center justify-center my-4 overflow-hidden">
                {/* Previous Button */}
                <button
                  type="button"
                  onClick={handlePrevPhoto}
                  className="absolute left-2 sm:left-4 z-20 w-11 h-11 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center border border-white/10 backdrop-blur-md transition-all active:scale-95"
                  aria-label="Previous Photo"
                >
                  <ChevronLeft size={22} />
                </button>

                {/* Next Button */}
                <button
                  type="button"
                  onClick={handleNextPhoto}
                  className="absolute right-2 sm:right-4 z-20 w-11 h-11 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center border border-white/10 backdrop-blur-md transition-all active:scale-95"
                  aria-label="Next Photo"
                >
                  <ChevronRight size={22} />
                </button>

                {/* Displayed Image with sub-300ms cross-fade */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={photoIndex}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.18, ease: EMIL_EASE_OUT }}
                    className="relative max-h-[68vh] max-w-full flex items-center justify-center"
                  >
                    <img
                      src={lightboxAlbum.images[photoIndex]?.url}
                      alt={lightboxAlbum.images[photoIndex]?.caption || lightboxAlbum.title}
                      className="max-h-[68vh] max-w-full object-contain rounded-xl shadow-2xl border border-white/10"
                      decoding="async"
                    />
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Caption & Bottom Thumbnail Strip */}
              <div className="space-y-3 z-20">
                {/* Photo Caption Bar */}
                {lightboxAlbum.images[photoIndex]?.caption && (
                  <div className="text-center">
                    <span className="inline-block px-4 py-1.5 rounded-full bg-black/60 border border-white/10 text-white text-[13px] font-medium backdrop-blur-md max-w-lg truncate">
                      {lightboxAlbum.images[photoIndex].caption}
                    </span>
                  </div>
                )}

                {/* Thumbnail Strip */}
                {lightboxAlbum.images.length > 1 && (
                  <div className="flex items-center justify-center gap-2 overflow-x-auto p-2 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 scrollbar-none max-w-full">
                    {lightboxAlbum.images.map((img, idx) => {
                      const isCurrent = idx === photoIndex;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setPhotoIndex(idx)}
                          className={`relative w-14 h-14 sm:w-16 sm:h-16 shrink-0 rounded-xl overflow-hidden border transition-all ${
                            isCurrent
                              ? 'ring-2 ring-primary border-primary scale-105'
                              : 'opacity-50 hover:opacity-100 border-white/10'
                          }`}
                        >
                          <img
                            src={img.url}
                            alt={`Thumbnail ${idx + 1}`}
                            className="w-full h-full object-cover"
                            loading="lazy"
                            decoding="async"
                          />
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════════════════════
          5. ADMIN QUICK-ADD PHOTOS MODAL
      ══════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {isAddModalOpen && (
          <motion.div
            variants={emilBackdropVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
            onClick={() => setIsAddModalOpen(false)}
          >
            <motion.div
              variants={emilModalVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: DURATION_MODAL, ease: EMIL_EASE_OUT }}
              className="w-full max-w-xl bg-surface border border-separator rounded-2xl shadow-2xl p-6 text-label-primary space-y-6 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-3 border-b border-separator">
                <div className="space-y-0.5">
                  <h3 className="text-[18px] font-bold text-label-primary">Add Event Memories</h3>
                  <p className="text-[13px] text-label-secondary">
                    Attach photos or proofs to an event album.
                  </p>
                </div>
                <EmilButton
                  variant="ghost"
                  size="sm"
                  isIconOnly
                  onClick={() => setIsAddModalOpen(false)}
                >
                  <X size={16} />
                </EmilButton>
              </div>

              {/* Event Picker */}
              <div className="space-y-2">
                <label className="text-[13px] font-semibold text-label-primary">
                  Select Event <span className="text-destructive">*</span>
                </label>
                <select
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                  disabled={loadingEvents}
                  className="w-full h-10 px-3 text-[13px] rounded-xl bg-surface-secondary border border-separator text-label-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {loadingEvents ? (
                    <option value="">Loading events...</option>
                  ) : eventList.length === 0 ? (
                    <option value="">No events available</option>
                  ) : (
                    eventList.map((evt) => (
                      <option key={evt._id} value={evt._id}>
                        {evt.title} ({evt.type || 'Event'})
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Image Input Options */}
              <div className="space-y-4 p-4 rounded-xl bg-surface-secondary/60 border border-separator">
                <div className="space-y-2">
                  <label className="text-[12px] font-semibold text-label-primary">
                    Image URL or Base64 Data URI
                  </label>
                  <input
                    type="url"
                    value={photoUrlInput}
                    onChange={(e) => setPhotoUrlInput(e.target.value)}
                    placeholder="https://images.unsplash.com/... or data:image/..."
                    className="w-full h-9 px-3 text-[13px] rounded-lg bg-surface border border-separator text-label-primary placeholder:text-label-secondary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[12px] font-semibold text-label-primary">
                    Caption (Optional)
                  </label>
                  <input
                    type="text"
                    value={captionInput}
                    onChange={(e) => setCaptionInput(e.target.value)}
                    placeholder="e.g. Hackathon Finalists with Principal"
                    className="w-full h-9 px-3 text-[13px] rounded-lg bg-surface border border-separator text-label-primary placeholder:text-label-secondary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                {/* Local File Picker */}
                <div className="flex items-center justify-between pt-1">
                  <label className="cursor-pointer inline-flex items-center gap-1.5 text-[12px] font-medium text-primary hover:underline">
                    <Upload size={14} />
                    <span>Or choose image file (&lt;5MB)</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>

                  <EmilButton
                    variant="flat"
                    size="sm"
                    onClick={handleQueuePhoto}
                    disabled={!photoUrlInput.trim()}
                    className="gap-1.5"
                  >
                    <Plus size={14} />
                    <span>Queue Photo</span>
                  </EmilButton>
                </div>
              </div>

              {/* Queued Photos Staging List */}
              {queuedPhotos.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[12px] font-semibold text-label-primary">
                    <span>Queued Photos ({queuedPhotos.length})</span>
                    <button
                      type="button"
                      onClick={() => setQueuedPhotos([])}
                      className="text-destructive hover:underline"
                    >
                      Clear All
                    </button>
                  </div>

                  <div className="max-h-44 overflow-y-auto space-y-2 pr-1">
                    {queuedPhotos.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between gap-3 p-2 rounded-lg bg-surface-secondary border border-separator text-[12px]"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={item.url}
                            alt="Queued Preview"
                            className="w-9 h-9 rounded-md object-cover border border-separator shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="font-medium text-label-primary truncate">
                              {item.caption || 'No caption'}
                            </p>
                            <p className="text-[11px] text-label-secondary truncate max-w-xs">
                              {item.url}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveQueuedPhoto(idx)}
                          className="text-label-secondary hover:text-destructive p-1 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Modal Footer Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-separator">
                <EmilButton
                  variant="ghost"
                  size="md"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  Cancel
                </EmilButton>

                <EmilButton
                  variant="solid"
                  size="md"
                  onClick={handleSaveGalleryPhotos}
                  isLoading={savingPhotos}
                  disabled={queuedPhotos.length === 0 && !photoUrlInput.trim()}
                  className="gap-2"
                >
                  <Check size={16} />
                  <span>Save Photos to Gallery</span>
                </EmilButton>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Gallery;
