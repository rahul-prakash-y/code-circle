import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface MagneticCTAProps {
  children: React.ReactNode;
  className?: string;
  maxDisplacement?: number; // default 3px
}

export const MagneticCTA: React.FC<MagneticCTAProps> = ({
  children,
  className = '',
  maxDisplacement = 3,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isFinePointer, setIsFinePointer] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mq = window.matchMedia('(hover: hover) and (pointer: fine)');
      setIsFinePointer(mq.matches);
      const handler = (e: MediaQueryListEvent) => setIsFinePointer(e.matches);
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    }
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isFinePointer || !ref.current) return;
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    const centerX = left + width / 2;
    const centerY = top + height / 2;
    const deltaX = (e.clientX - centerX) / (width / 2);
    const deltaY = (e.clientY - centerY) / (height / 2);

    const x = Math.max(-maxDisplacement, Math.min(maxDisplacement, deltaX * maxDisplacement));
    const y = Math.max(-maxDisplacement, Math.min(maxDisplacement, deltaY * maxDisplacement));
    setPosition({ x, y });
  };

  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 });
  };

  if (!isFinePointer) {
    return <div className={`inline-block ${className}`}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: 'tween', duration: 0.18, ease: 'easeOut' }}
      className={`inline-block ${className}`}
    >
      {children}
    </motion.div>
  );
};

export default MagneticCTA;
