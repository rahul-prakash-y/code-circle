import React, { useState } from 'react';

export interface HeroAvatarProps {
  src?: string | null;
  name?: string;
  fallback?: React.ReactNode;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  isBordered?: boolean;
  color?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  className?: string;
}

export const HeroAvatar: React.FC<HeroAvatarProps> = ({
  src,
  name,
  fallback,
  size = 'md',
  isBordered = false,
  color = 'primary',
  className = '',
}) => {
  const [imgError, setImgError] = useState(false);

  const sizeClasses = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
  }[size];

  const ringClasses = {
    default: 'ring-2 ring-black/15 dark:ring-white/20 ring-offset-2 ring-offset-surface',
    primary: 'ring-2 ring-accent ring-offset-2 ring-offset-surface',
    success: 'ring-2 ring-success ring-offset-2 ring-offset-surface',
    warning: 'ring-2 ring-warning ring-offset-2 ring-offset-surface',
    danger: 'ring-2 ring-destructive ring-offset-2 ring-offset-surface',
  }[color];

  const getInitials = (n?: string) => {
    if (!n) return '•';
    const parts = n.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return n.slice(0, 2).toUpperCase();
  };

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 rounded-full select-none overflow-hidden font-semibold transition-transform duration-150 ${sizeClasses} ${
        isBordered ? ringClasses : ''
      } bg-separator-opaque text-label-primary ${className}`}
    >
      {src && !imgError ? (
        <img
          src={src}
          alt={name || 'Avatar'}
          onError={() => setImgError(true)}
          className="w-full h-full object-cover rounded-full"
        />
      ) : fallback ? (
        fallback
      ) : (
        <span>{getInitials(name)}</span>
      )}
    </div>
  );
};

export interface HeroUserProps {
  name: string;
  description?: React.ReactNode;
  avatarProps?: HeroAvatarProps;
  className?: string;
  onClick?: () => void;
}

export const HeroUser: React.FC<HeroUserProps> = ({
  name,
  description,
  avatarProps,
  className = '',
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center gap-3 text-left ${
        onClick ? 'cursor-pointer hover:opacity-85 transition-opacity' : ''
      } ${className}`}
    >
      <HeroAvatar name={name} {...avatarProps} />
      <div className="flex flex-col min-w-0">
        <span className="text-sm font-semibold text-label-primary truncate leading-snug">
          {name}
        </span>
        {description && (
          <span className="text-xs text-label-tertiary truncate leading-tight">
            {description}
          </span>
        )}
      </div>
    </div>
  );
};

