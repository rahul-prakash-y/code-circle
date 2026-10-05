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
      className="group relative w-full h-[460px] sm:h-[490px] rounded-[30px] overflow-hidden select-none cursor-pointer flex flex-col justify-end"
      style={{
        // Pure true black / spatial canvas foundation with deep, soft shadows and zero visible borders
        backgroundColor: '#000000',
        boxShadow:
          '0 28px 60px -12px rgba(0, 0, 0, 0.65), 0 16px 32px -16px rgba(0, 0, 0, 0.45), 0 0 1px rgba(255, 255, 255, 0.08)',
        transformStyle: 'preserve-3d',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Inter", sans-serif',
      }}
    >
      {/* Background Image: Full fill, starts slightly desaturated, transitions smoothly to full vibrant color on hover */}
      <div className="absolute inset-0 w-full h-full overflow-hidden bg-[#0d0d0f]">
        {!imageError && bearer.photoUrl ? (
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
              // Spring-friendly transition for color vibrance
              filter: 'grayscale(28%) saturate(0.88) contrast(1.04)',
              transitionProperty: 'filter, transform',
              transitionDuration: '550ms',
              transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
            }}
            // On group hover via Tailwind/style class
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLImageElement).style.filter =
                'grayscale(0%) saturate(1.22) contrast(1.06)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLImageElement).style.filter =
                'grayscale(28%) saturate(0.88) contrast(1.04)';
            }}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#121316] via-[#09090b] to-[#000000] text-white/20">
            <span className="text-7xl font-extralight tracking-tighter text-white/30">
              {fallbackInitial}
            </span>
          </div>
        )}

        {/* Ambient subtle light sheen on top corner - Apple Vision spatial highlight */}
        <div
          className="absolute -top-24 -right-24 w-60 h-60 rounded-full pointer-events-none opacity-40 group-hover:opacity-75 transition-opacity duration-700"
          style={{
            background:
              'radial-gradient(circle, rgba(255, 255, 255, 0.18) 0%, rgba(255, 255, 255, 0) 70%)',
            filter: 'blur(20px)',
          }}
        />
      </div>

      {/* Spatial Gradient Overlay: Multi-stop rich atmospheric gradient at bottom for text contrast */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-500"
        style={{
          background:
            'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.08) 35%, rgba(0,0,0,0.65) 68%, rgba(0,0,0,0.92) 88%, #000000 100%)',
        }}
      />

      {/* Interactive Top Pill: Status or Department tag if needed */}
      <div className="absolute top-5 left-5 right-5 flex items-center justify-between pointer-events-none z-10">
        <div
          className="px-3 py-1 rounded-full text-[10.5px] font-medium tracking-tight text-white/80 flex items-center gap-1.5 shadow-lg"
          style={{
            background: 'rgba(255, 255, 255, 0.12)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
          <span>Executive</span>
        </div>

        {bearer.linkedinUrl && (
          <a
            href={bearer.linkedinUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            title={`Connect with ${bearer.name} on LinkedIn`}
            className="pointer-events-auto w-8 h-8 rounded-full flex items-center justify-center text-white/80 hover:text-white transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer shadow-lg"
            style={{
              background: 'rgba(255, 255, 255, 0.12)',
              backdropFilter: 'blur(20px) saturate(180%)',
              WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            }}
          >
            <Linkedin size={14} strokeWidth={1.8} />
          </a>
        )}
      </div>

      {/* Bottom Content Area: Name, Position, Bio */}
      <div className="relative z-10 p-6 sm:p-7 flex flex-col justify-end space-y-2.5">
        {/* Position Badge: Apple Spatial Frosted Glass Pill */}
        <div className="self-start">
          <div
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold tracking-tight text-blue-300 shadow-sm"
            style={{
              background: 'rgba(0, 122, 255, 0.18)',
              backdropFilter: 'blur(24px) saturate(190%)',
              WebkitBackdropFilter: 'blur(24px) saturate(190%)',
              letterSpacing: '-0.01em',
            }}
          >
            <Sparkles size={11} className="text-blue-400" />
            <span className="truncate max-w-[200px]">{bearer.position}</span>
          </div>
        </div>

        {/* Name: Strict tracking, bold typography */}
        <h3
          className="text-2xl sm:text-[26px] font-bold text-white tracking-[-0.03em] leading-tight drop-shadow-sm"
          style={{ letterSpacing: '-0.035em' }}
        >
          {bearer.name}
        </h3>

        {/* Bio: Max 120 chars, elegant SF Pro typography */}
        {bearer.bio ? (
          <p
            className="text-[13px] text-white/75 font-normal leading-relaxed line-clamp-3 tracking-[-0.015em]"
            style={{ letterSpacing: '-0.015em' }}
          >
            {bearer.bio}
          </p>
        ) : (
          <p className="text-[12px] text-white/40 italic tracking-tight">
            Club executive driving Code Circle initiatives.
          </p>
        )}

        {/* Micro-interaction link bar */}
        {bearer.linkedinUrl && (
          <div className="pt-1.5 flex items-center">
            <a
              href={bearer.linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1.5 text-[11.5px] font-medium text-white/60 hover:text-white transition-colors duration-200 group/link"
              style={{ letterSpacing: '-0.01em' }}
            >
              <span>Connect Profile</span>
              <ExternalLink
                size={11}
                className="opacity-60 group-hover/link:opacity-100 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform duration-200"
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
            'radial-gradient(circle at 50% 100%, rgba(0, 113, 227, 0.15) 0%, transparent 70%)',
        }}
      />
    </motion.div>
  );
};

export default BearerCard;
