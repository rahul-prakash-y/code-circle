import React, { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Palette, ExternalLink, X } from 'lucide-react';
import { Button, Link } from '@heroui/react';

interface FigmaPreviewModalProps {
  figmaUrl: string | null;
  onClose: () => void;
}

export const FigmaPreviewModal: React.FC<FigmaPreviewModalProps> = memo(({
  figmaUrl,
  onClose,
}) => {
  if (!figmaUrl) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full sm:max-w-5xl h-[82vh] rounded-t-3xl sm:rounded-2xl bg-surface border border-separator shadow-2xl flex flex-col overflow-hidden"
        >
          <div className="px-6 py-3.5 border-b border-separator flex items-center justify-between shrink-0 bg-white/[0.02]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-pink-500/15 border border-pink-500/30 flex items-center justify-center text-pink-400">
                <Palette size={16} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-label-primary ">Interactive Figma Prototype Embed</h4>
                <Link
                  target="_blank"
                  rel="noopener noreferrer"
                  href={figmaUrl}
                  className="text-[11px] text-pink-400 hover:text-pink-300 underline inline-flex items-center gap-1"
                >
                  <span>Open directly in Figma</span>
                  <ExternalLink size={10} />
                </Link>
              </div>
            </div>
            <Button
              isIconOnly
              size="sm"
              variant="flat"
              onPress={onClose}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white min-w-unit-8 w-8 h-8 cursor-pointer"
            >
              <X size={16} />
            </Button>
          </div>
          <div className="flex-1 bg-black/50 p-2">
            <iframe
              src={`https://www.figma.com/embed?embed_host=share&url=${encodeURIComponent(figmaUrl)}`}
              className="w-full h-full border-0 rounded-xl"
              allowFullScreen
            />
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
});

FigmaPreviewModal.displayName = 'FigmaPreviewModal';
