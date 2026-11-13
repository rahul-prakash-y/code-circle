import React, { useState } from 'react';
import { motion } from 'framer-motion';

export interface HeroTabItem {
  id: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  badge?: string | number;
  disabled?: boolean;
}

export interface HeroTabsProps {
  items?: HeroTabItem[];
  selectedKey?: string;
  defaultSelectedKey?: string;
  onSelectionChange?: (key: string) => void;
  motionProps?: any;
  variant?: 'solid' | 'bordered' | 'light' | 'underlined';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  children?: React.ReactNode;
}

export const HeroTabs: React.FC<HeroTabsProps> = ({
  items = [],
  selectedKey,
  defaultSelectedKey,
  onSelectionChange,
  motionProps = { transition: { type: 'spring', stiffness: 260, damping: 30 } },
  variant = 'solid',
  size = 'md',
  className = '',
  children,
}) => {
  const [internalKey, setInternalKey] = useState<string>(
    defaultSelectedKey || (items[0]?.id ?? '')
  );
  const activeKey = selectedKey !== undefined ? selectedKey : internalKey;

  const handleSelect = (key: string) => {
    if (selectedKey === undefined) setInternalKey(key);
    onSelectionChange?.(key);
  };

  const containerPadding = size === 'sm' ? 'p-1' : size === 'lg' ? 'p-1.5' : 'p-1';
  const tabPadding =
    size === 'sm'
      ? 'px-3 py-1.5 text-xs'
      : size === 'lg'
      ? 'px-5 py-2.5 text-sm'
      : 'px-4 py-2 text-xs md:text-sm';

  return (
    <div
      className={`inline-flex items-center rounded-2xl bg-surface-secondary border border-black/5 dark:border-white/5 backdrop-blur-md ${containerPadding} ${className}`}
    >
      {items.map((tab) => {
        const isActive = activeKey === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            disabled={tab.disabled}
            onClick={() => handleSelect(tab.id)}
            className={`relative flex items-center justify-center gap-2 font-medium transition-colors select-none z-10 rounded-xl ${tabPadding} ${
              tab.disabled
                ? 'opacity-40 cursor-not-allowed'
                : isActive
                ? 'text-label-primary font-semibold'
                : 'text-label-tertiary hover:text-label-primary'
            }`}
          >
            {isActive && (
              <motion.div
                layoutId="activeTabBadge"
                className="absolute inset-0 bg-surface-raised rounded-xl shadow-sm border border-black/5 dark:border-white/10 -z-10"
                transition={motionProps.transition}
              />
            )}
            {tab.icon && <span className="shrink-0">{tab.icon}</span>}
            <span className="truncate">{tab.label}</span>
            {tab.badge !== undefined && (
              <span
                className={`ml-1 px-1.5 py-0.5 text-[10px] rounded-full font-semibold ${
                  isActive
                    ? 'bg-accent-subtle text-accent'
                    : 'bg-black/5 dark:bg-white/10 text-label-tertiary'
                }`}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
      {children}
    </div>
  );
};
