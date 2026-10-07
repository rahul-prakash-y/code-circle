import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import useDomainStore from '../store/useDomainStore';
import useAuthStore from '../store/useAuthStore';
import useProfileStore from '../store/useProfileStore';
import { IDomain, ILevel } from '../types/domain';
import LevelPathView from '../components/domains/LevelPathView';
import VideoQuestView from '../components/domains/VideoQuestView';
import QuestModal from '../components/domains/QuestModal';
import DomainEditorModal from '../components/domains/DomainEditorModal';
import LevelEditorModal from '../components/domains/LevelEditorModal';
import {
  Compass,
  ArrowRight,
  ArrowLeft,
  Search,
  Sparkles,
  CheckCircle2,
  Award,
  Layers,
  GraduationCap,
  PlayCircle,
  Clock,
  ChevronRight,
  Plus,
  Edit3,
  Trash2,
  Shield,
  BookOpen,
} from 'lucide-react';

export const DomainsPage: React.FC = () => {
  const { domainId } = useParams<{ domainId?: string }>();
  const navigate = useNavigate();

  const {
    domains,
    currentDomain,
    levels,
    activeLevel,
    isQuestModalOpen,
    loading,
    fetchDomains,
    fetchDomainLevels,
    setActiveLevel,
    closeQuestModal,
    deleteDomain,
  } = useDomainStore();

  const { user } = useAuthStore();
  const { profile } = useProfileStore();

  const isAdmin =
    profile?.role === 'Admin' ||
    profile?.role === 'SuperAdmin' ||
    profile?.role === 'Faculty' ||
    profile?.role === 'Committee' ||
    user?.role === 'Admin' ||
    user?.role === 'SuperAdmin';

  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'in_progress' | 'completed'>('all');

  // Modal management states
  const [isDomainModalOpen, setIsDomainModalOpen] = useState(false);
  const [domainToEdit, setDomainToEdit] = useState<IDomain | null>(null);
  const [isLevelModalOpen, setIsLevelModalOpen] = useState(false);
  const [levelToEdit, setLevelToEdit] = useState<ILevel | null>(null);

  // Initial fetch of all domains
  useEffect(() => {
    fetchDomains();
  }, [fetchDomains]);

  // Fetch domain levels if domainId route param is present
  useEffect(() => {
    if (domainId) {
      fetchDomainLevels(domainId);
    }
  }, [domainId, fetchDomainLevels]);

  const filteredDomains = domains.filter((d) => {
    const matchesSearch =
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.description?.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (filterMode === 'completed') return (d.progressPercentage || 0) === 100;
    if (filterMode === 'in_progress')
      return (d.progressPercentage || 0) > 0 && (d.progressPercentage || 0) < 100;
    return true;
  });

  // Overall statistics
  const totalTracks = domains.length;
  const totalCompletedLevels = domains.reduce(
    (acc, d) => acc + (d.completedLevelsCount || 0),
    0
  );
  const totalLevels = domains.reduce((acc, d) => acc + (d.totalLevels || 0), 0);

  const handleDeleteDomain = async (e: React.MouseEvent, dom: IDomain) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to permanently delete track "${dom.name}" and all its levels?`)) {
      await deleteDomain(dom._id);
    }
  };

  const handleEditDomain = (e: React.MouseEvent, dom: IDomain) => {
    e.stopPropagation();
    setDomainToEdit(dom);
    setIsDomainModalOpen(true);
  };

  // Detail / Track View when domainId is active
  if (domainId && currentDomain) {
    return (
      <div className="space-y-8 max-w-7xl mx-auto pb-16">
        {/* Navigation Breadcrumb & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-separator">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/domains')}
              className="w-9 h-9 rounded-full bg-surface border border-separator flex items-center justify-center text-label-secondary hover:text-label-primary hover:bg-surface-secondary transition cursor-pointer"
              aria-label="Back to domains"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-accent uppercase tracking-wider">
                <span>Learning Track</span>
                <span>/</span>
                <span>{currentDomain.name}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-label-primary mt-0.5">
                {currentDomain.name}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-surface-secondary border border-separator/80 text-label-secondary">
              {levels.filter((l) => l.isCompleted).length} of {levels.length} Quests Mastered
            </span>

            {isAdmin && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setLevelToEdit(null);
                    setIsLevelModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-accent text-white hover:bg-accent-hover transition shadow-sm cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Level
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDomainToEdit(currentDomain);
                    setIsDomainModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-surface border border-separator text-label-primary hover:bg-surface-secondary transition cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Edit Track
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Track Content: Video & Quest Left, Vertical Timeline Path Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Video & Quest View (8 cols on desktop) */}
          <div className="lg:col-span-7 xl:col-span-8">
            {activeLevel ? (
              <VideoQuestView
                level={activeLevel}
                onEditLevel={() => {
                  setLevelToEdit(activeLevel);
                  setIsLevelModalOpen(true);
                }}
              />
            ) : (
              <div className="p-12 rounded-[24px] bg-surface text-center text-label-secondary border border-separator/60">
                <PlayCircle className="w-12 h-12 mx-auto stroke-1 opacity-50 mb-3" />
                <p>Select a level from the path to begin studying.</p>
              </div>
            )}
          </div>

          {/* Level Timeline Path (4 cols on desktop) */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-4">
            <div className="p-5 rounded-[22px] bg-surface border border-separator/60 shadow-[0_4px_24px_rgba(0,0,0,0.02)] space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-separator">
                <div className="flex items-center gap-2">
                  <Compass className="w-4 h-4 text-accent" />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-label-primary">
                    Progression Path
                  </h3>
                </div>
                <span className="text-xs font-medium text-label-secondary">
                  {levels.length} Levels
                </span>
              </div>

              <LevelPathView
                levels={levels}
                activeLevelId={activeLevel?._id}
                onSelectLevel={(level) => setActiveLevel(level)}
              />
            </div>
          </div>
        </div>

        {/* Responsive Quest Modal */}
        <QuestModal isOpen={isQuestModalOpen} onClose={closeQuestModal} />

        {/* Admin Modals */}
        {isLevelModalOpen && (
          <LevelEditorModal
            isOpen={isLevelModalOpen}
            domainId={currentDomain._id}
            levelToEdit={levelToEdit}
            onClose={() => setIsLevelModalOpen(false)}
          />
        )}
        {isDomainModalOpen && (
          <DomainEditorModal
            isOpen={isDomainModalOpen}
            domainToEdit={domainToEdit}
            onClose={() => setIsDomainModalOpen(false)}
          />
        )}
      </div>
    );
  }

  // --- GRID VIEW: Apple Spatial UI ---
  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Editorial Header */}
      <div className="pb-4 border-b border-separator flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <p className="meta-editorial text-label-secondary">Curated Learning Tracks</p>
            {isAdmin && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400">
                Admin Management Active
              </span>
            )}
          </div>
          <h1 className="display-headline text-label-primary">Domains</h1>
          <p className="text-[14px] text-label-secondary mt-1 max-w-2xl">
            Watch focused video tutorials, study key concepts, pass mastery verification quests, and unlock accredited MCQ assessments.
          </p>
        </div>

        {/* Action & Metric Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          {isAdmin && (
            <button
              type="button"
              onClick={() => {
                setDomainToEdit(null);
                setIsDomainModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold bg-accent text-white hover:bg-accent-hover active:scale-98 transition shadow-md shadow-accent/20 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Create Domain Track
            </button>
          )}

          <div className="px-4 py-2 rounded-2xl bg-surface border border-separator/60 shadow-sm flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-accent/10 text-accent flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-label-secondary uppercase tracking-wider">
                Tracks
              </div>
              <div className="text-base font-bold text-label-primary">{totalTracks} Available</div>
            </div>
          </div>

          <div className="px-4 py-2 rounded-2xl bg-surface border border-separator/60 shadow-sm flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-label-secondary uppercase tracking-wider">
                Completed
              </div>
              <div className="text-base font-bold text-label-primary">
                {totalCompletedLevels} / {totalLevels} Levels
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 text-label-tertiary absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search domains, topics, or technologies..."
            className="w-full pl-10 pr-4 py-2.5 rounded-full bg-surface border border-separator/80 text-sm text-label-primary placeholder:text-label-tertiary focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition shadow-sm"
          />
        </div>

        {/* Filter Badges */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto p-1 rounded-xl bg-surface border border-separator shadow-sm text-xs font-medium">
          <button
            type="button"
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1 rounded-lg transition cursor-pointer ${
              filterMode === 'all'
                ? 'bg-accent text-white font-semibold'
                : 'text-label-secondary hover:text-label-primary'
            }`}
          >
            All Tracks ({domains.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('in_progress')}
            className={`px-3 py-1 rounded-lg transition cursor-pointer ${
              filterMode === 'in_progress'
                ? 'bg-accent text-white font-semibold'
                : 'text-label-secondary hover:text-label-primary'
            }`}
          >
            In Progress
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('completed')}
            className={`px-3 py-1 rounded-lg transition cursor-pointer ${
              filterMode === 'completed'
                ? 'bg-accent text-white font-semibold'
                : 'text-label-secondary hover:text-label-primary'
            }`}
          >
            Mastered
          </button>
        </div>
      </div>

      {/* Grid of Domain Cards (Apple Spatial UI: Large, borderless cards with high quality images, deep soft shadows, hover scaling) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        {filteredDomains.map((domain, index) => {
          const totalLvl = domain.totalLevels || 0;
          const completedLvl = domain.completedLevelsCount || 0;
          const pct = domain.progressPercentage || 0;

          return (
            <motion.div
              key={domain._id}
              whileHover={{ scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
              onClick={() => navigate(`/domains/${domain._id}`)}
              className="group cursor-pointer rounded-[28px] overflow-hidden bg-surface shadow-[0_8px_30px_rgb(0,0,0,0.04)] border-0 flex flex-col transition-all duration-300 relative"
            >
              {/* Cover Image Container */}
              <div className="relative w-full h-52 sm:h-56 overflow-hidden bg-surface-secondary">
                <img
                  src={domain.coverImageUrl}
                  alt={domain.name}
                  className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                  loading="lazy"
                />
                {/* Soft gradient wash */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                {/* Badges on image */}
                <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-md bg-black/40 text-white/90 border border-white/10">
                    {totalLvl} {totalLvl === 1 ? 'Level' : 'Levels'}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {pct === 100 && (
                      <span className="px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-md bg-emerald-500/80 text-white border border-emerald-400/30 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Mastered
                      </span>
                    )}

                    {/* Admin inline action pills */}
                    {isAdmin && (
                      <div className="flex items-center gap-1 bg-black/50 backdrop-blur-md p-1 rounded-full border border-white/10">
                        <button
                          type="button"
                          onClick={(e) => handleEditDomain(e, domain)}
                          className="p-1 rounded-full text-white/80 hover:text-white hover:bg-white/20 transition cursor-pointer"
                          title="Edit Domain"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteDomain(e, domain)}
                          className="p-1 rounded-full text-rose-300 hover:text-rose-100 hover:bg-rose-500/30 transition cursor-pointer"
                          title="Delete Domain"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Floating title above gradient bottom */}
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <h3 className="text-xl sm:text-[22px] font-bold tracking-tight text-white drop-shadow-sm leading-snug">
                    {domain.name}
                  </h3>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-6 flex-1 flex flex-col justify-between space-y-5">
                <p className="text-sm text-label-secondary line-clamp-2 leading-relaxed">
                  {domain.description}
                </p>

                <div className="space-y-3 pt-2">
                  {/* Progress Bar & Label */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-medium text-label-secondary">
                      <span>Progress</span>
                      <span className="text-label-primary font-semibold">
                        {completedLvl} / {totalLvl} Completed ({pct}%)
                      </span>
                    </div>

                    <div className="w-full h-2 rounded-full bg-surface-secondary overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut', delay: index * 0.1 }}
                        className={`h-full rounded-full transition-all ${
                          pct === 100
                            ? 'bg-emerald-500'
                            : 'bg-gradient-to-r from-accent to-accent-hover'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Card Action Link */}
                  <div className="pt-2 flex items-center justify-between text-xs font-semibold text-accent group-hover:text-accent-hover">
                    <span>Explore Track, Notes & Quests</span>
                    <div className="w-7 h-7 rounded-full bg-accent/10 flex items-center justify-center transition-transform group-hover:translate-x-1">
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {filteredDomains.length === 0 && !loading && (
        <div className="text-center py-16 p-8 rounded-3xl bg-surface border border-separator/60">
          <Compass className="w-12 h-12 mx-auto stroke-1 text-label-tertiary mb-3" />
          <h3 className="text-base font-bold text-label-primary">No learning tracks found</h3>
          <p className="text-xs text-label-secondary mt-1">
            Try adjusting your search query or create a new track using the button above.
          </p>
        </div>
      )}

      {/* Admin Domain Editor Modal */}
      {isDomainModalOpen && (
        <DomainEditorModal
          isOpen={isDomainModalOpen}
          domainToEdit={domainToEdit}
          onClose={() => setIsDomainModalOpen(false)}
        />
      )}
    </div>
  );
};

export default DomainsPage;
