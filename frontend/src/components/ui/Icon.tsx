import React from 'react';
import { type LucideIcon, type LucideProps } from 'lucide-react';

export type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | number;

const SIZE_MAP: Record<'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl', number> = {
  xs: 12, // Badges, tags, micro-indicators
  sm: 16, // Inputs, chips, compact buttons, table cells
  md: 20, // Standard buttons, nav items, dropdowns
  lg: 24, // Section headers, feature cards, prominent actions
  xl: 32, // Large headers, feature cards
  '2xl': 48, // Empty state illustrations, hero focal points
};

export interface IconProps extends Omit<LucideProps, 'size'> {
  icon: LucideIcon;
  size?: IconSize;
  className?: string;
  strokeWidth?: number;
}

/**
 * Standardized Design System Icon Component.
 * Enforces unified optical sizing, 1.75-2px stroke hierarchy, and currentColor inheritance.
 */
export const Icon: React.FC<IconProps> = ({
  icon: Component,
  size = 'md',
  strokeWidth,
  className = '',
  ...props
}) => {
  const numericSize = typeof size === 'number' ? size : SIZE_MAP[size] || 20;
  // Emil Kowalski optical stroke scaling: larger icons benefit from slightly lighter stroke
  const defaultStroke = numericSize >= 32 ? 1.75 : 2;
  const appliedStroke = strokeWidth ?? defaultStroke;

  return (
    <Component
      size={numericSize}
      strokeWidth={appliedStroke}
      className={`shrink-0 text-current transition-colors duration-150 ${className}`}
      aria-hidden={props['aria-label'] ? undefined : true}
      {...props}
    />
  );
};

export interface IconContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'primary' | 'secondary' | 'neutral' | 'success' | 'warning' | 'danger';
  interactive?: boolean;
}

const CONTAINER_SIZES = {
  sm: 'w-8 h-8 rounded-lg',
  md: 'w-10 h-10 rounded-xl',
  lg: 'w-12 h-12 rounded-2xl',
  xl: 'w-16 h-16 rounded-3xl',
};

const CONTAINER_VARIANTS = {
  primary: 'bg-primary/10 text-primary border border-primary/20',
  secondary: 'bg-content2 text-foreground border border-separator',
  neutral: 'bg-default-100 text-default-600 border border-separator',
  success: 'bg-success/10 text-success border border-success/20',
  warning: 'bg-warning/10 text-warning border border-warning/20',
  danger: 'bg-danger/10 text-danger border border-danger/20',
};

/**
 * Soft rounded container for feature sections and empty states.
 * Provides subtle Emil Kowalski motion physics and Apple OLED glass aesthetics.
 */
export const IconContainer: React.FC<IconContainerProps> = ({
  children,
  size = 'md',
  variant = 'primary',
  interactive = false,
  className = '',
  ...props
}) => {
  return (
    <div
      className={`flex items-center justify-center shrink-0 backdrop-blur-md ${CONTAINER_SIZES[size]} ${CONTAINER_VARIANTS[variant]} ${
        interactive
          ? 'transition-transform duration-150 ease-out hover:scale-105 active:scale-95 motion-reduce:transform-none'
          : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

// ── Shared Standardized Brand Icons (Unified 24px ViewBox & currentColor) ─────────
export interface BrandIconProps extends React.SVGProps<SVGSVGElement> {
  size?: IconSize;
}

export const GitHubBrandIcon: React.FC<BrandIconProps> = ({ size = 'md', className = '', ...props }) => {
  const numericSize = typeof size === 'number' ? size : SIZE_MAP[size] || 20;
  return (
    <svg
      width={numericSize}
      height={numericSize}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={`shrink-0 text-current ${className}`}
      aria-hidden="true"
      {...props}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
      />
    </svg>
  );
};

export const HackerRankBrandIcon: React.FC<BrandIconProps> = ({ size = 'md', className = '', ...props }) => {
  const numericSize = typeof size === 'number' ? size : SIZE_MAP[size] || 20;
  return (
    <svg
      width={numericSize}
      height={numericSize}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={`shrink-0 text-current ${className}`}
      aria-hidden="true"
      {...props}
    >
      <path d="M4 3h4.5v7h7V3H20v18h-4.5v-7h-7v7H4V3z" />
    </svg>
  );
};

export const LeetCodeBrandIcon: React.FC<BrandIconProps> = ({ size = 'md', className = '', ...props }) => {
  const numericSize = typeof size === 'number' ? size : SIZE_MAP[size] || 20;
  return (
    <svg
      width={numericSize}
      height={numericSize}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={`shrink-0 text-current ${className}`}
      aria-hidden="true"
      {...props}
    >
      <path d="M13.483 0a1.374 1.374 0 0 0-.961.438L7.116 6.226l-3.854 4.126a5.266 5.266 0 0 0-1.209 2.104 5.35 5.35 0 0 0-.125.513 5.527 5.527 0 0 0 .062 2.362 5.83 5.83 0 0 0 .349 1.017 5.938 5.938 0 0 0 1.271 1.818l4.277 4.193.039.038c2.248 2.165 5.852 2.133 8.063-.074l2.396-2.392c.54-.54.54-1.414.003-1.955a1.378 1.378 0 0 0-1.951-.003l-2.396 2.392a3.021 3.021 0 0 1-4.205.038l-.02-.019-4.276-4.193c-.652-.64-.972-1.469-.948-2.263a2.68 2.68 0 0 1 .066-.523 2.545 2.545 0 0 1 .619-1.164L9.13 8.114c1.058-1.134 3.204-1.27 4.43-.278l3.501 2.831c.593.48 1.461.387 1.94-.207a1.384 1.384 0 0 0-.207-1.943l-3.5-2.831c-.8-.647-1.766-1.045-2.774-1.202l2.015-2.158A1.384 1.384 0 0 0 13.483 0zm-2.866 12.815a1.38 1.38 0 0 0-1.38 1.382 1.38 1.38 0 0 0 1.38 1.382H20.79a1.38 1.38 0 0 0 1.38-1.382 1.38 1.38 0 0 0-1.38-1.382z" />
    </svg>
  );
};

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  'aria-label': string;
  tooltip?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'ghost' | 'flat' | 'solid';
}

const BUTTON_SIZES = {
  sm: 'w-7 h-7 min-w-7',
  md: 'w-9 h-9 min-w-9',
  lg: 'w-10 h-10 min-w-10',
};

const BUTTON_VARIANTS = {
  ghost: 'bg-transparent hover:bg-default-100 text-default-600 hover:text-foreground',
  flat: 'bg-default-100/60 hover:bg-default-200/80 text-foreground border border-separator',
  solid: 'bg-primary text-primary-foreground hover:bg-primary-hover shadow-sm',
};

/**
 * Standardized icon-only action button.
 * Enforces aria-label, optional tooltip, and Emil Kowalski sub-300ms micro-spring physics.
 */
export const IconButton: React.FC<IconButtonProps> = ({
  'aria-label': ariaLabel,
  tooltip,
  size = 'md',
  variant = 'ghost',
  className = '',
  children,
  ...props
}) => {
  const button = (
    <button
      type="button"
      aria-label={ariaLabel}
      className={`inline-flex items-center justify-center rounded-xl cursor-pointer transition-all duration-150 ease-out hover:scale-105 active:scale-95 motion-reduce:transform-none disabled:opacity-50 disabled:pointer-events-none ${
        BUTTON_SIZES[size]
      } ${BUTTON_VARIANTS[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );

  return button;
};

export default Icon;
