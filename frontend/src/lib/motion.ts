import type { Transition, Variants } from 'framer-motion';

/**
 * Emil Kowalski Animation Physics & Rules
 * -------------------------------------------------------------
 * 1. Micro-interactions: scale to 0.97 on :active / whileTap.
 * 2. Entrances & Exits: NEVER animate from scale(0). Always scale(0.95) with opacity fade.
 * 3. Easing & Curves:
 *    - UI interactions / Enters: cubic-bezier(0.23, 1, 0.32, 1) [strong ease-out]
 *    - On-screen movement / Layout: cubic-bezier(0.77, 0, 0.175, 1) [ease-in-out]
 * 4. Duration Limits: All animations < 300ms. Snappy & native.
 * 5. Origin-Awareness: Dropdowns / popovers set transform-origin to trigger coords.
 * 6. Restraint: 100+ daily actions (⌘K, keyboard switches) are instant (0ms).
 */

// Easing Bezier tuples for Framer Motion
export const EMIL_EASE_OUT = [0.23, 1, 0.32, 1] as const;
export const EMIL_EASE_IN_OUT = [0.77, 0, 0.175, 1] as const;

// CSS Strings for inline or stylesheet transitions
export const EMIL_EASE_OUT_CSS = 'cubic-bezier(0.23, 1, 0.32, 1)';
export const EMIL_EASE_IN_OUT_CSS = 'cubic-bezier(0.77, 0, 0.175, 1)';

// Duration limits (strictly under 300ms)
export const DURATION_MICRO = 0.12;      // 120ms for tap feedback
export const DURATION_FAST = 0.16;       // 160ms for tooltips / badges
export const DURATION_DROPDOWN = 0.18;   // 180ms for popovers & dropdowns
export const DURATION_MODAL = 0.22;      // 220ms for dialogs & sheets
export const DURATION_LAYOUT = 0.26;     // 260ms for layout re-orders

// Standard Transitions
export const emilTapTransition: Transition = {
  duration: DURATION_MICRO,
  ease: EMIL_EASE_OUT,
};

export const emilEnterTransition: Transition = {
  duration: DURATION_MODAL,
  ease: EMIL_EASE_OUT,
};

export const emilDropdownTransition: Transition = {
  duration: DURATION_DROPDOWN,
  ease: EMIL_EASE_OUT,
};

export const emilLayoutTransition: Transition = {
  duration: DURATION_LAYOUT,
  ease: EMIL_EASE_IN_OUT,
};

export const emilInstantTransition: Transition = {
  duration: 0,
};

// Micro-interaction presets
export const emilMicroTap = {
  scale: 0.97,
  transition: emilTapTransition,
};

export const emilMicroTapSubtle = {
  scale: 0.985,
  transition: emilTapTransition,
};

// Origin-Aware Dropdown / Popover Variants (Bloom from trigger)
export type PopoverOrigin =
  | 'top'
  | 'top left'
  | 'top right'
  | 'bottom'
  | 'bottom left'
  | 'bottom right'
  | 'center';

export const createDropdownVariants = (origin: PopoverOrigin = 'top right'): Variants => ({
  initial: {
    opacity: 0,
    scale: 0.95,
    transformOrigin: origin,
  },
  animate: {
    opacity: 1,
    scale: 1,
    transformOrigin: origin,
    transition: emilDropdownTransition,
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transformOrigin: origin,
    transition: {
      duration: 0.12,
      ease: EMIL_EASE_OUT,
    },
  },
});

// Centered Modal Variants (Never scale(0))
export const emilModalVariants: Variants = {
  initial: {
    opacity: 0,
    scale: 0.95,
  },
  animate: {
    opacity: 1,
    scale: 1,
    transition: emilEnterTransition,
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: {
      duration: 0.14,
      ease: EMIL_EASE_OUT,
    },
  },
};

// Backdrop blur overlay variants
export const emilBackdropVariants: Variants = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
    transition: {
      duration: DURATION_MODAL,
      ease: EMIL_EASE_OUT,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.15,
      ease: EMIL_EASE_OUT,
    },
  },
};

// Card Entrance Variants
export const emilCardVariants: Variants = {
  initial: {
    opacity: 0,
    scale: 0.95,
  },
  animate: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.2,
      ease: EMIL_EASE_OUT,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: {
      duration: 0.14,
      ease: EMIL_EASE_OUT,
    },
  },
};

// HeroUI motionProps adapters (direct Framer Motion passthrough)
export const emilHeroDropdownMotionProps = {
  variants: createDropdownVariants('top right'),
  initial: 'initial',
  animate: 'animate',
  exit: 'exit',
};

export const emilHeroModalMotionProps = {
  variants: emilModalVariants,
  initial: 'initial',
  animate: 'animate',
  exit: 'exit',
};
