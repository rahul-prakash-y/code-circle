import React from 'react';
import { motion } from 'framer-motion';
import { SearchX, RotateCcw, Sparkles } from 'lucide-react';
import { Button } from '@heroui/react';
import { UX_COPY } from '@/constants/copy';

export interface NoSearchResultsProps {
  query: string;
  didYouMean?: string;
  onSelectSuggestion?: (term: string) => void;
  onClearFilters: () => void;
  popularSuggestions?: string[];
  className?: string;
}

export const NoSearchResults: React.FC<NoSearchResultsProps> = ({
  query,
  didYouMean,
  onSelectSuggestion,
  onClearFilters,
  popularSuggestions = ['Hackathon', 'Python', 'Web Development', 'Algorithms'],
  className = '',
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      role="status"
      aria-live="polite"
      className={`rounded-3xl border border-separator/80 bg-surface/80 backdrop-blur-md p-8 sm:p-12 text-center max-w-lg mx-auto shadow-sm flex flex-col items-center justify-center my-6 ${className}`}
    >
      <div className="w-14 h-14 rounded-2xl bg-separator/50 flex items-center justify-center text-label-secondary mb-4 ring-1 ring-separator/60">
        <SearchX className="w-7 h-7 text-label-secondary stroke-[1.75]" />
      </div>

      <h3 className="text-base sm:text-lg font-semibold tracking-tight text-label-primary">
        {UX_COPY.noSearch.title(query)}
      </h3>

      <p className="text-xs sm:text-sm text-label-secondary mt-1.5 max-w-md leading-relaxed">
        {UX_COPY.noSearch.suggestion}
      </p>

      {/* "Did You Mean" Suggestion */}
      {didYouMean && onSelectSuggestion && (
        <div className="mt-3 inline-flex items-center gap-1.5 text-xs text-accent bg-accent/10 px-3 py-1 rounded-full">
          <span>{UX_COPY.noSearch.didYouMean(didYouMean)}</span>
          <button
            type="button"
            onClick={() => onSelectSuggestion(didYouMean)}
            className="font-bold underline hover:opacity-80 cursor-pointer"
          >
            Search &ldquo;{didYouMean}&rdquo;
          </button>
        </div>
      )}

      {/* ONE Clear Primary Action: Clear Filters */}
      <div className="mt-6">
        <Button
          size="sm"
          variant="solid"
          color="primary"
          onPress={onClearFilters}
          startContent={<RotateCcw size={14} />}
          className="font-medium text-xs rounded-full px-5 h-9 shadow-sm"
        >
          {UX_COPY.noSearch.clearAction}
        </Button>
      </div>

      {/* Suggested Popular Terms */}
      {popularSuggestions && popularSuggestions.length > 0 && onSelectSuggestion && (
        <div className="mt-7 pt-5 border-t border-separator/60 w-full">
          <p className="text-[11px] font-semibold text-label-tertiary uppercase tracking-wider mb-2.5 flex items-center justify-center gap-1">
            <Sparkles size={11} className="text-accent" />
            <span>Popular searches</span>
          </p>
          <div className="flex flex-wrap items-center justify-center gap-1.5">
            {popularSuggestions.map((term) => (
              <button
                key={term}
                type="button"
                onClick={() => onSelectSuggestion(term)}
                className="text-xs px-2.5 py-1 rounded-full bg-surface-secondary hover:bg-separator text-label-secondary hover:text-label-primary transition-colors cursor-pointer border border-separator/40"
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default NoSearchResults;
