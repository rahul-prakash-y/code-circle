import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Linkedin, Sparkles, ExternalLink } from 'lucide-react';
import { StudentBearer } from '../../store/useBearerStore';

interface BearerCardProps {
  bearer: StudentBearer;
  index?: number;
}

export const BearerCard: React.FC<BearerCardProps> = ({ bearer, index = 0 }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const hasPhoto = !imageError && Boolean(bearer.photoUrl);
  // Fallback avatar if photo fails to load
  const fallbackInitial = bearer.name ? bearer.name.charAt(0).toUpperCase() : 'C';

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 35 },
        visible: {
          opacity: 1,
          y: 0,
          transition: {
            type: 'spring',
            stiffness: 260,
            damping: 30,
            delay: (index % 4) * 0.08,
          },
        },
      }}
      whileHover={{
        scale: 1.02,
        y: -4,
        transition: {
          type: 'spring',
          stiffness: 260,
          damping: 30,
        },
      }}
      className="group relative w-full h-[460px] sm:h-[490px] rounded-[28px] overflow-hidden select-none cursor-pointer flex flex-col justify-end border border-separator/80 bg-surface shadow-card hover:shadow-card-elevated transition-all duration-300"
      style={{
        transformStyle: 'preserve-3d',
      }}
    >
      {/* Background Container */}
      <div className="absolute inset-0 w-full h-full overflow-hidden bg-surface-secondary">
        {hasPhoto ? (
          <motion.img
            src={bearer.photoUrl}
            alt={bearer.name}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
            initial={{ opacity: 0 }}
            animate={{ opacity: imageLoaded ? 1 : 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="w-full h-full object-cover object-top transition-all duration-700 ease-out group-hover:scale-105"
            style={{
              filter: 'grayscale(15%) saturate(0.95)',
              transitionProperty: 'filter, transform',
              transitionDuration: '550ms',
              transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLImageElement).style.filter =
                'grayscale(0%) saturate(1.15) contrast(1.04)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLImageElement).style.filter =
                'grayscale(15%) saturate(0.95)';
            }}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 via-slate-50 to-blue-50/50 dark:from-[#161617] dark:via-[#1c1c1e] dark:to-[#0a0a0b] text-label-tertiary">
            <span className="text-7xl font-extralight tracking-tighter text-label-secondary/35 dark:text-white/20 select-none">
              {fallbackInitial}
            </span>
          </div>
        )}

        {/* Ambient subtle light sheen on top corner */}
        <div
          className="absolute -top-24 -right-24 w-60 h-60 rounded-full pointer-events-none opacity-25 dark:opacity-40 group-hover:opacity-50 transition-opacity duration-700"
          style={{
            background:
              'radial-gradient(circle, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0) 70%)',
            filter: 'blur(20px)',
          }}
        />
      </div>

      {/* Gradient Overlay for Text Readability */}
      {hasPhoto ? (
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-500"
          style={{
            background:
              'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.1) 32%, rgba(0,0,0,0.72) 70%, rgba(0,0,0,0.92) 100%)',
          }}
        />
      ) : (
        <div className="absolute inset-0 pointer-events-none transition-opacity duration-500 bg-gradient-to-t from-surface via-surface/60 to-transparent dark:from-surface dark:via-surface/70" />
      )}

      {/* Top Header Pills */}
      <div className="absolute top-5 left-5 right-5 flex items-center justify-between pointer-events-none z-10">
        <div
          className={`px-3 py-1 rounded-full text-[10.5px] font-medium tracking-tight flex items-center gap-1.5 shadow-sm backdrop-blur-md ${
            hasPhoto
              ? 'bg-black/40 text-white/90 border border-white/15'
              : 'bg-surface/85 dark:bg-white/10 text-label-secondary border border-separator'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)]" />
          <span>Executive</span>
        </div>

        {bearer.linkedinUrl && (
          <a
            href={bearer.linkedinUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            title={`Connect with ${bearer.name} on LinkedIn`}
            className={`pointer-events-auto w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer shadow-sm backdrop-blur-md ${
              hasPhoto
                ? 'bg-black/40 text-white/85 hover:text-white border border-white/15'
                : 'bg-surface/85 dark:bg-white/10 text-label-secondary hover:text-label-primary border border-separator'
            }`}
          >
            <Linkedin size={14} strokeWidth={1.8} />
          </a>
        )}
      </div>

      {/* Bottom Content Area: Name, Position, Bio */}
      <div className="relative z-10 p-6 sm:p-7 flex flex-col justify-end space-y-2.5">
        {/* Position Badge */}
        <div className="self-start">
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold tracking-tight shadow-sm backdrop-blur-md ${
              hasPhoto
                ? 'bg-blue-500/25 text-blue-200 border border-blue-400/30'
                : 'bg-accent/10 text-accent border border-accent/20'
            }`}
          >
            <Sparkles size={11} className={hasPhoto ? 'text-blue-300' : 'text-accent'} />
            <span className="truncate max-w-[200px]">{bearer.position}</span>
          </div>
        </div>

        {/* Name */}
        <h3
          className={`text-2xl sm:text-[26px] font-bold tracking-tight leading-tight ${
            hasPhoto
              ? 'text-white drop-shadow-sm'
              : 'text-label-primary'
          }`}
        >
          {bearer.name}
        </h3>

        {/* Bio */}
        {bearer.bio ? (
          <p
            className={`text-[13px] font-normal leading-relaxed line-clamp-3 ${
              hasPhoto
                ? 'text-white/80'
                : 'text-label-secondary'
            }`}
          >
            {bearer.bio}
          </p>
        ) : (
          <p
            className={`text-[12px] italic tracking-tight ${
              hasPhoto
                ? 'text-white/45'
                : 'text-label-tertiary'
            }`}
          >
            Club executive driving Code Circle initiatives.
          </p>
        )}

        {/* LinkedIn Link Bar */}
        {bearer.linkedinUrl && (
          <div className="pt-1.5 flex items-center">
            <a
              href={bearer.linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className={`inline-flex items-center gap-1.5 text-[11.5px] font-medium transition-colors duration-200 group/link ${
                hasPhoto
                  ? 'text-white/70 hover:text-white'
                  : 'text-accent hover:underline'
              }`}
            >
              <span>Connect Profile</span>
              <ExternalLink
                size={11}
                className="opacity-70 group-hover/link:opacity-100 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform duration-200"
              />
            </a>
          </div>
        )}
      </div>

      {/* Bottom ambient glow on hover */}
      <div
        className="absolute bottom-0 inset-x-0 h-1/2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700"
        style={{
          background:
            'radial-gradient(circle at 50% 100%, rgba(0, 113, 227, 0.12) 0%, transparent 70%)',
        }}
      />
    </motion.div>
  );
};

export default BearerCard;
