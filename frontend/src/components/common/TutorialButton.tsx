import React from 'react';
import { useLocation } from 'react-router-dom';
import { HelpCircle, Lightbulb } from 'lucide-react';
import useTutorialStore from '../../store/useTutorialStore';
import { TutorialData } from '../../data/tutorialData';
import { Button } from '@heroui/react';

interface TutorialButtonProps {
  tutorialId?: string;
  customTutorial?: TutorialData;
  label?: string;
  variant?: 'header' | 'inline' | 'icon';
  className?: string;
  tooltip?: string;
}

export const TutorialButton: React.FC<TutorialButtonProps> = ({
  tutorialId,
  customTutorial,
  label = 'Tutorial',
  variant = 'inline',
  className = '',
  tooltip,
}) => {
  const location = useLocation();
  const { openTutorial, openTutorialForPath } = useTutorialStore();

  const handleClick = (e: any) => {
    e?.stopPropagation?.();
    if (customTutorial) {
      openTutorial(customTutorial);
    } else if (tutorialId) {
      openTutorial(tutorialId);
    } else {
      openTutorialForPath(location.pathname);
    }
  };

  if (variant === 'header') {
    return (
      <Button
        variant="secondary"
        size="sm"
        onPress={handleClick}
        title={tooltip || 'What you can do here (Page Guide)'}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-label-secondary hover:text-label-primary bg-surface-secondary/80 hover:bg-surface-raised border border-separator/80 hover:border-accent/40 shadow-sm transition-all cursor-pointer ${className}`}
      >
        <Lightbulb size={14} className="text-warning shrink-0" />
        <span className="hidden sm:inline">{label}</span>
      </Button>
    );
  }

  if (variant === 'icon') {
    return (
      <Button
        isIconOnly
        variant="ghost"
        size="sm"
        onPress={handleClick}
        title={tooltip || 'Tutorial / What you can do here'}
        className={`p-1.5 sm:p-2 rounded-xl bg-surface-secondary hover:bg-surface-raised border border-separator text-label-secondary hover:text-label-primary transition-all cursor-pointer flex items-center justify-center shrink-0 ${className}`}
      >
        <HelpCircle size={15} className="text-accent" />
      </Button>
    );
  }

  // Default 'inline' pill button
  return (
    <Button
      variant="secondary"
      size="sm"
      onPress={handleClick}
      title={tooltip || 'What you can do on this page'}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-surface border border-separator text-label-secondary hover:text-label-primary hover:border-accent/50 shadow-sm transition-all cursor-pointer ${className}`}
    >
      <HelpCircle size={14} className="text-accent shrink-0" />
      <span>{label}</span>
    </Button>
  );
};

export default TutorialButton;
