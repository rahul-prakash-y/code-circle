import React, { useEffect, useState, useMemo, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Search,
  ShieldCheck,
  Settings,
  Sparkles,
  Users,
  Compass,
} from 'lucide-react';
import useBearerStore from '../store/useBearerStore';
import useAuthStore from '../store/useAuthStore';
import BearerCard from '../components/bearers/BearerCard';

export const StudentBearers: React.FC = () => {
  const { bearers, loading, fetchBearers } = useBearerStore();
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'All' | string>('All');

  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: '-60px' });

  useEffect(() => {
    fetchBearers();
  }, [fetchBearers]);

  const isSuperAdmin = user?.role === 'SuperAdmin';

  // Distinct position categories for quick filtering
  const positions = useMemo(() => {
    const set = new Set<string>();
    bearers.forEach((b) => {
      if (b.position) set.add(b.position);
    });
    return ['All', ...Array.from(set)];
  }, [bearers]);

  const filteredBearers = useMemo(() => {
    return bearers.filter((bearer) => {
      const matchesSearch =
        bearer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bearer.position.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (bearer.bio && bearer.bio.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesFilter =
        selectedFilter === 'All' || bearer.position === selectedFilter;

      return matchesSearch && matchesFilter;
    });
  }, [bearers, searchQuery, selectedFilter]);

  // Framer motion container variants for staggered entrance
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.15,
      },
    },
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Top Navigation & Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-separator">
        <div className="flex items-center gap-3">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 text-xs font-semibold tracking-tight text-label-secondary hover:text-label-primary transition-colors cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>Dashboard</span>
          </Link>

          <span className="w-1 h-1 rounded-full bg-separator-opaque" />

          <div className="flex items-center gap-2 select-none">
            <div
              className="w-5 h-5 rounded-[6px] flex items-center justify-center text-[10px] font-bold text-white shadow-sm"
              style={{
                background: 'linear-gradient(135deg, #0077ED 0%, #0056B3 100%)',
              }}
            >
              CC
            </div>
            <span className="text-xs font-semibold text-label-primary tracking-tight">
              Code Circle
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* SuperAdmin Gateway Button */}
          {isSuperAdmin && (
            <Link
              to="/admin/bearers"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white bg-accent hover:bg-accent-hover transition-all duration-200 cursor-pointer shadow-sm"
            >
              <Settings size={12} />
              <span>Manage Bearers</span>
            </Link>
          )}

          <div className="px-3 py-1 rounded-full text-[11px] font-semibold tracking-tight text-label-secondary bg-surface-secondary border border-separator/80">
            Executive Council
          </div>
        </div>
      </div>

      {/* Main Headline Section */}
      <div className="max-w-3xl mx-auto text-center space-y-4 pt-4 sm:pt-6 mb-10 sm:mb-14">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[11.5px] font-semibold text-accent tracking-tight select-none bg-accent/10 border border-accent/20"
        >
          <Sparkles size={12} className="text-accent" />
          <span>Student Leadership • 2026 Executive Roster</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
          className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-label-primary"
        >
          Club Office Bearers
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="text-sm sm:text-base text-label-secondary leading-relaxed max-w-2xl mx-auto"
        >
          Meet the visionary students and coordinators steering Code Circle’s workshops,
          hackathons, competitive programming leagues, and community chapters.
        </motion.p>
      </div>

      {/* Search & Filter Controls */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-10 max-w-5xl mx-auto"
      >
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search
            size={15}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-label-tertiary pointer-events-none"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, position, or focus..."
            className="w-full pl-11 pr-4 py-2.5 rounded-2xl text-xs sm:text-[13px] text-label-primary placeholder:text-label-tertiary bg-surface border border-separator/80 focus:border-accent/50 focus:ring-2 focus:ring-accent/15 outline-none transition-all shadow-sm"
          />
        </div>

        {/* Position Segmented Tabs */}
        {positions.length > 2 && (
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-surface-secondary border border-separator/80 overflow-x-auto self-start md:self-auto max-w-full">
            {positions.map((pos) => {
              const isActive = selectedFilter === pos;
              return (
                <button
                  key={pos}
                  onClick={() => setSelectedFilter(pos)}
                  className={`relative px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-surface text-label-primary shadow-sm border border-separator/60'
                      : 'text-label-secondary hover:text-label-primary'
                  }`}
                >
                  <span className="relative z-10">{pos}</span>
                </button>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* Scroll Reveal Grid */}
      <div ref={containerRef}>
        {loading && bearers.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-7 sm:gap-8">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="w-full h-[460px] sm:h-[490px] rounded-[28px] bg-surface-secondary border border-separator/70 animate-pulse shadow-sm"
              />
            ))}
          </div>
        ) : filteredBearers.length > 0 ? (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate={isInView ? 'visible' : 'hidden'}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-7 sm:gap-8"
          >
            {filteredBearers.map((bearer, index) => (
              <BearerCard key={bearer._id} bearer={bearer} index={index} />
            ))}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="max-w-md mx-auto py-16 px-8 text-center rounded-3xl bg-surface border border-separator shadow-card"
          >
            <div className="w-14 h-14 rounded-2xl bg-surface-secondary border border-separator flex items-center justify-center mx-auto mb-4 text-label-tertiary">
              <Users size={24} />
            </div>
            <h3 className="text-lg font-bold text-label-primary tracking-tight">
              No Executives Found
            </h3>
            <p className="text-xs text-label-secondary mt-1 leading-relaxed">
              {searchQuery || selectedFilter !== 'All'
                ? 'No office bearers match the selected filters. Try clearing your query.'
                : 'No student bearers have been added to the club roster yet.'}
            </p>
            {(searchQuery || selectedFilter !== 'All') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedFilter('All');
                }}
                className="mt-5 px-4 py-2 rounded-xl text-xs font-semibold text-label-primary bg-surface-secondary hover:bg-surface border border-separator transition-colors cursor-pointer shadow-sm"
              >
                Clear Filters
              </button>
            )}
          </motion.div>
        )}
      </div>

      {/* Minimal Footer Stamp */}
      <div className="mt-16 text-center select-none">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] font-medium text-label-tertiary bg-surface-secondary border border-separator/80 shadow-sm">
          <Compass size={12} className="text-label-tertiary" />
          <span>Code Circle • Student Bearers Directory • 2026</span>
        </div>
      </div>
    </div>
  );
};

export default StudentBearers;
