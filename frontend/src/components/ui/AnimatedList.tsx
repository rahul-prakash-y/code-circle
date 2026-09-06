import React from 'react';
import { motion } from 'framer-motion';

interface AnimatedListProps {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
  initialDelay?: number;
}

interface AnimatedListItemProps {
  children: React.ReactNode;
  className?: string;
  index?: number;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: (custom: { staggerDelay: number; initialDelay: number }) => ({
    opacity: 1,
    transition: {
      staggerChildren: custom.staggerDelay,
      delayChildren: custom.initialDelay,
    },
  }),
};

const itemVariants = {
  hidden: { 
    opacity: 0, 
    y: 16,
    scale: 0.98,
  },
  visible: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

export const AnimatedList: React.FC<AnimatedListProps> = ({ 
  children, 
  className = '', 
  staggerDelay = 0.06,
  initialDelay = 0,
}) => {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      custom={{ staggerDelay, initialDelay }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export const AnimatedListItem: React.FC<AnimatedListItemProps> = ({ 
  children, 
  className = '',
}) => {
  return (
    <motion.div
      variants={itemVariants}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export default AnimatedList;
