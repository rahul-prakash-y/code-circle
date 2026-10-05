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
    <div
      className="min-h-screen w-full relative selection:bg-blue-500/20 text-white overflow-x-hidden"
      style={{
        // Pure true black spatial background with zero visible borders
        backgroundColor: '#000000',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Inter", sans-serif',
      }}
    >
      {/* Apple Spatial Ambient Illumination */}
      <div
        className="fixed top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] pointer-events-none opacity-30 select-none"
        style={{
          background:
            'radial-gradient(ellipse at 50% 0%, rgba(0, 113, 227, 0.28) 0%, rgba(94, 92, 230, 0.12) 45%, transparent 75%)',
          filter: 'blur(80px)',
        }}
      />
      <div
        className="fixed bottom-0 right-0 w-[600px] h-[500px] pointer-events-none opacity-20 select-none"
        style={{
          background:
            'radial-gradient(circle at 100% 100%, rgba(48, 209, 88, 0.15) 0%, transparent 70%)',
          filter: 'blur(90px)',
        }}
      />

      {/* Floating Apple-Style Navigation Header */}
      <header className="sticky top-6 z-50 max-w-6xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-center justify-between px-5 py-3 rounded-full"
          style={{
            background: 'rgba(24, 24, 28, 0.65)',
            backdropFilter: 'blur(28px) saturate(190%)',
            WebkitBackdropFilter: 'blur(28px) saturate(190%)',
            boxShadow:
              '0 16px 36px -10px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(255, 255, 255, 0.12)',
          }}
        >
          <div className="flex items-center gap-3">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 text-xs font-semibold tracking-tight text-white/70 hover:text-white transition-colors duration-200 cursor-pointer"
            >
              <ArrowLeft size={14} />
              <span>Back</span>
            </Link>

            <span className="w-1 h-1 rounded-full bg-white/20" />

            <div className="flex items-center gap-2 select-none">
              <div
                className="w-5 h-5 rounded-[6px] flex items-center justify-center text-[10px] font-bold text-white shadow-sm"
                style={{
                  background: 'linear-gradient(135deg, #0077ED 0%, #0056B3 100%)',
                }}
              >
                CC
              </div>
              <span
                className="text-xs font-semibold text-white/90 tracking-[-0.02em]"
                style={{ letterSpacing: '-0.02em' }}
              >
                Code Circle
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* SuperAdmin Gateway Button */}
            {isSuperAdmin && (
              <Link
                to="/admin/bearers"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-white tracking-tight transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer shadow-md"
                style={{
                  background: 'linear-gradient(135deg, #0071E3 0%, #0056B3 100%)',
                  boxShadow: '0 4px 14px rgba(0, 113, 227, 0.4)',
                }}
              >
                <Settings size={12} />
                <span>Manage Bearers</span>
              </Link>
            )}

            <div
              className="px-3 py-1 rounded-full text-[11px] font-semibold tracking-tight text-white/80"
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
              }}
            >
              Executive Council
            </div>
          </div>
        </motion.div>
      </header>

      {/* Main Hero & Content Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20 pb-28 relative z-10">
        {/* Apple Headline Section */}
        <div className="max-w-3xl mx-auto text-center space-y-5 mb-14 sm:mb-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[11.5px] font-semibold text-blue-300 tracking-tight select-none shadow-sm"
            style={{
              background: 'rgba(0, 113, 227, 0.16)',
              backdropFilter: 'blur(20px)',
              letterSpacing: '-0.01em',
            }}
          >
            <Sparkles size={12} className="text-blue-400" />
            <span>Student Leadership • 2026 Executive Roster</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-[-0.04em] text-white leading-[1.06]"
            style={{ letterSpacing: '-0.04em' }}
          >
            Club Office Bearers
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="text-base sm:text-lg text-white/65 font-normal tracking-[-0.02em] leading-relaxed max-w-2xl mx-auto"
            style={{ letterSpacing: '-0.02em' }}
          >
            Meet the visionary students and coordinators steering Code Circle’s workshops,
            hackathons, competitive programming leagues, and community chapters.
          </motion.p>
        </div>

        {/* Search & Filter Controls (Zero Visible Borders, Spatial Glass) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-12 max-w-5xl mx-auto"
        >
          {/* Spatial Search Bar */}
          <div className="relative flex-1 max-w-md">
            <Search
              size={15}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, position, or focus..."
              className="w-full pl-11 pr-4 py-3 rounded-2xl text-xs sm:text-[13px] text-white placeholder-white/40 outline-none transition-all duration-300"
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                boxShadow:
                  '0 12px 28px -8px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
                letterSpacing: '-0.01em',
              }}
            />
          </div>

          {/* Spatial Segmented Position Tabs */}
          {positions.length > 2 && (
            <div
              className="flex items-center gap-1.5 p-1 rounded-2xl overflow-x-auto self-start md:self-auto max-w-full custom-scrollbar"
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
              }}
            >
              {positions.map((pos) => {
                const isActive = selectedFilter === pos;
                return (
                  <button
                    key={pos}
                    onClick={() => setSelectedFilter(pos)}
                    className="relative px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer whitespace-nowrap"
                    style={{
                      color: isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.55)',
                      letterSpacing: '-0.015em',
                    }}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeFilterPill"
                        className="absolute inset-0 rounded-xl"
                        style={{
                          background: 'rgba(255, 255, 255, 0.16)',
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                        }}
                        transition={{ type: 'spring', stiffness: 260, damping: 30 }}
                      />
                    )}
                    <span className="relative z-10">{pos}</span>
                  </button>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Scroll Reveal Grid: Staggered entrance using Framer Motion */}
        <div ref={containerRef}>
          {loading && bearers.length === 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {[1, 2, 3, 4].map((n) => (
                <div
                  key={n}
                  className="w-full h-[480px] rounded-[30px] animate-pulse"
                  style={{
                    backgroundColor: '#111215',
                    boxShadow: '0 24px 48px rgba(0, 0, 0, 0.6)',
                  }}
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
              transition={{ duration: 0.5 }}
              className="max-w-md mx-auto py-20 px-8 text-center rounded-[32px]"
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                backdropFilter: 'blur(30px)',
                boxShadow: '0 30px 60px rgba(0, 0, 0, 0.6)',
              }}
            >
              <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-4 text-white/40">
                <Users size={24} />
              </div>
              <h3 className="text-lg font-bold text-white tracking-tight">
                No Executives Found
              </h3>
              <p className="text-xs text-white/50 mt-1 leading-relaxed">
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
                  className="mt-5 px-4 py-2 rounded-full text-xs font-semibold text-white bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
                >
                  Clear Filters
                </button>
              )}
            </motion.div>
          )}
        </div>

        {/* Minimal Footer Stamp */}
        <div className="mt-28 text-center select-none">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] font-medium text-white/40 bg-white/5 shadow-inner">
            <Compass size={12} className="text-white/30" />
            <span>Code Circle • Student Bearers Directory • 2026</span>
          </div>
        </div>
      </main>
    </div>
  );
};

export default StudentBearers;
