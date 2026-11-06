import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Linkedin, Sparkles, ExternalLink } from 'lucide-react';
import { StudentBearer } from '../../store/useBearerStore';
import { EmilCard } from '../ui/emil-ui';

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
    <EmilCard
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
      className="group relative w-full h-[460px] sm:h-[490px] rounded-[28px] overflow-hidden select-none cursor-pointer flex flex-col justify-end border border-separator bg-surface shadow-sm hover:shadow-md transition-all duration-200"
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
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-surface via-surface-secondary to-canvas text-label-tertiary">
            <span className="text-7xl font-extralight tracking-tighter text-label-tertiary/40 select-none">
              {fallbackInitial}
            </span>
          </div>
        )}

        {/* Ambient subtle light sheen on top corner */}
        <div
          className="absolute -top-24 -right-24 w-60 h-60 rounded-full pointer-events-none opacity-25 group-hover:opacity-40 transition-opacity duration-700"
          style={{
            background: 'radial-gradient(circle, var(--separator) 0%, transparent 70%)',
            filter: 'blur(20px)',
          }}
        />
      </div>

      {/* Gradient Overlay for Text Readability */}
      {hasPhoto ? (
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-500 bg-gradient-to-t from-black/90 via-black/50 to-transparent"
        />
      ) : (
        <div className="absolute inset-0 pointer-events-none transition-opacity duration-500 bg-gradient-to-t from-surface via-surface/60 to-transparent" />
      )}

      {/* Top Header Pills */}
      <div className="absolute top-4 sm:top-5 left-4 sm:left-5 right-4 sm:right-5 flex items-center justify-between pointer-events-none z-10">
        <div
          className={`px-3 py-1 rounded-full text-[10.5px] font-medium tracking-tight flex items-center gap-1.5 shadow-sm backdrop-blur-md ${
            hasPhoto
              ? 'bg-surface/30 text-white border border-separator/40'
              : 'bg-surface/85 text-label-secondary border border-separator'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-success" />
          <span>Executive</span>
        </div>

        {bearer.linkedinUrl && (
          <a
            href={bearer.linkedinUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            title={`Connect with ${bearer.name} on LinkedIn`}
            className={`pointer-events-auto w-9 h-9 sm:w-8 sm:h-8 min-w-[36px] min-h-[36px] rounded-full flex items-center justify-center transition-all duration-150 hover:scale-105 active:scale-95 cursor-pointer shadow-sm backdrop-blur-md ${
              hasPhoto
                ? 'bg-surface/30 text-white/85 hover:text-white border border-separator/40'
                : 'bg-surface/85 text-label-secondary hover:text-label-primary border border-separator'
            }`}
            aria-label={`Connect with ${bearer.name} on LinkedIn`}
          >
            <Linkedin size={14} strokeWidth={1.8} />
          </a>
        )}
      </div>

      {/* Bottom Content Area: Name, Position, Bio */}
      <div className="relative z-10 p-5 sm:p-7 flex flex-col justify-end space-y-2.5">
        {/* Position Badge */}
        <div className="self-start">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold tracking-tight shadow-sm backdrop-blur-md bg-accent-subtle text-accent border border-accent/20">
            <Sparkles size={11} className="text-accent" />
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
                ? 'text-white/60'
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
              className={`inline-flex items-center gap-1.5 text-[11.5px] font-medium transition-colors duration-150 group/link min-h-[32px] ${
                hasPhoto
                  ? 'text-white/80 hover:text-white'
                  : 'text-accent hover:underline'
              }`}
            >
              <span>Connect Profile</span>
              <ExternalLink
                size={11}
                className="opacity-70 group-hover/link:opacity-100 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform duration-150"
              />
            </a>
          </div>
        )}
      </div>

      {/* Bottom ambient glow on hover */}
      <div
        className="absolute bottom-0 inset-x-0 h-1/2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700"
        style={{
          background: 'radial-gradient(circle at 50% 100%, var(--accent-subtle) 0%, transparent 70%)',
        }}
      />
    </EmilCard>
  );
};

export default BearerCard;
