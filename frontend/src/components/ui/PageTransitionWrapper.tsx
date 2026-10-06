import React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';

export interface PageTransitionWrapperProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
  className?: string;
}

/**
 * Native iOS-style page transition variants mimicking Apple's smooth
 * fade-and-scale navigation physics.
 */
export const iosPageTransitionVariants = {
  initial: {
    opacity: 0,
    scale: 0.98,
    y: 10,
  },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    y: -10,
  },
};

/**
 * Apple spring physics specification:
 * stiffness: 260, damping: 30
 */
export const iosSpringTransition = {
  type: 'spring',
  stiffness: 260,
  damping: 30,
} as const;

export const PageTransitionWrapper: React.FC<PageTransitionWrapperProps> = ({
  children,
  className = '',
  transition = iosSpringTransition,
  ...props
}) => {
  return (
    <motion.div
      variants={iosPageTransitionVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={transition}
      className={`w-full ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default PageTransitionWrapper;
