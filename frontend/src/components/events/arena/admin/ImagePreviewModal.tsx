import React, { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '@heroui/react';

interface ImagePreviewModalProps {
  imageUrl: string | null;
  onClose: () => void;
}

export const ImagePreviewModal: React.FC<ImagePreviewModalProps> = memo(({
  imageUrl,
  onClose,
}) => {
  if (!imageUrl) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative max-w-5xl max-h-[90vh] w-full flex flex-col items-center"
        >
          <div className="w-full flex justify-between items-center pb-3 text-label-primary ">
            <span className="text-xs font-bold text-label-secondary">Reference Design Mockup</span>
            <Button
              isIconOnly
              size="sm"
              variant="flat"
              onPress={onClose}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white min-w-unit-8 w-8 h-8 cursor-pointer"
            >
              <X size={18} />
            </Button>
          </div>
          <div className="overflow-auto max-h-[82vh] rounded-2xl border border-separator bg-black/60 p-2">
            <img
              src={imageUrl}
              alt="Design Reference Full"
              className="max-h-[80vh] w-auto object-contain mx-auto rounded-xl shadow-2xl"
            />
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
});

ImagePreviewModal.displayName = 'ImagePreviewModal';
