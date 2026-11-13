import React, { useState, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileSpreadsheet, X, Upload } from 'lucide-react';
import { Button } from '@heroui/react';
import { HeroFileInput } from '@/components/ui/hero/HeroFileInput';

interface BulkQuestionUploadModalProps {
  isOpen: boolean;
  bulkModalType: 'mcq' | 'coding' | null;
  assessmentTitle?: string;
  actionLoading: boolean;
  onClose: () => void;
  onUpload: (file: File) => Promise<void>;
}

export const BulkQuestionUploadModal: React.FC<BulkQuestionUploadModalProps> = memo(({
  isOpen,
  bulkModalType,
  assessmentTitle,
  actionLoading,
  onClose,
  onUpload,
}) => {
  const [bulkFile, setBulkFile] = useState<File | null>(null);

  if (!isOpen || !bulkModalType) return null;

  const handleClose = () => {
    setBulkFile(null);
    onClose();
  };

  const handleSubmit = async () => {
    if (!bulkFile) return;
    await onUpload(bulkFile);
    setBulkFile(null);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl bg-surface border border-separator p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-label-primary flex items-center gap-2">
              <FileSpreadsheet size={16} className="text-purple-400" />
              <span>Upload {bulkModalType.toUpperCase()} Questions</span>
            </h3>
            <Button
              isIconOnly
              size="sm"
              variant="light"
              onPress={handleClose}
              className="text-text-muted hover:text-label-primary min-w-unit-8 w-8 h-8 rounded-lg cursor-pointer"
            >
              <X size={16} />
            </Button>
          </div>

          <p className="text-xs text-text-muted">
            Upload an Excel (.xlsx) or JSON file formatted according to the sample template.
            {bulkModalType === 'coding' && (
              <span>
                {' '}You can restrict coding challenges to specific programming languages using the{' '}
                <span className="font-semibold text-purple-300">Allowed Languages</span> column (e.g. "python, java" or "c, cpp").
              </span>
            )}
            {' '}Questions will be added directly to{' '}
            <span className="font-semibold text-label-primary ">"{assessmentTitle || 'Selected Assessment'}"</span>.
          </p>

          <HeroFileInput
            variant="dropzone"
            accept=".xlsx,.xls,.json"
            buttonText="Browse file from device or drag and drop"
            description="Supports Excel (.xlsx, .xls) and JSON"
            onFilesSelected={(files) => {
              setBulkFile(files[0] || null);
            }}
            color="secondary"
            showChips={true}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button
              size="sm"
              variant="light"
              onPress={handleClose}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-text-muted hover:text-label-primary cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant="solid"
              color="secondary"
              isDisabled={!bulkFile || actionLoading}
              isLoading={actionLoading}
              startContent={!actionLoading ? <Upload size={13} /> : undefined}
              onPress={handleSubmit}
              className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md shadow-purple-600/30 cursor-pointer"
            >
              Upload Now
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
});

BulkQuestionUploadModal.displayName = 'BulkQuestionUploadModal';
