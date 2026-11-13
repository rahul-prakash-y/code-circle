import React, { useRef, useState, useId, useCallback } from 'react';
import { Button } from '@heroui/react';
import { Upload, X, FileText, AlertCircle, CheckCircle2, Image as ImageIcon } from 'lucide-react';
import { HeroChip } from './HeroChip';
import { EmilCard } from '../emil-ui';

export interface HeroFileInputProps {
  /** Accepted MIME types or extensions (e.g. '.xlsx,.csv' or 'image/*') */
  accept?: string;
  /** Allow multiple file selection */
  multiple?: boolean;
  /** Maximum file size in bytes */
  maxSizeBytes?: number;
  /** Maximum number of files */
  maxCount?: number;
  /** Callback when valid files are selected */
  onFilesSelected: (files: File[]) => void;
  /** Optional callback when a file is removed */
  onFileRemove?: (index: number) => void;
  /** Upload progress percentage (0 - 100) */
  uploadProgress?: number;
  /** Loading state */
  isLoading?: boolean;
  /** Disabled state */
  isDisabled?: boolean;
  /** Invalid / error state */
  isInvalid?: boolean;
  /** Error message displayed inline */
  errorMessage?: string;
  /** Visual presentation variant */
  variant?: 'button' | 'dropzone' | 'compact';
  /** Main button / trigger label */
  buttonText?: string;
  /** Help or description text */
  description?: string;
  /** Display selected file chips */
  showChips?: boolean;
  /** Currently selected files to display */
  selectedFiles?: File[] | { name: string; size?: number }[];
  /** Start content icon */
  startContent?: React.ReactNode;
  /** Trigger button color */
  color?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  /** Custom className */
  className?: string;
  /** Accessible label */
  'aria-label'?: string;
}

export const HeroFileInput: React.FC<HeroFileInputProps> = ({
  accept,
  multiple = false,
  maxSizeBytes = 25 * 1024 * 1024, // 25 MB default
  maxCount = 10,
  onFilesSelected,
  onFileRemove,
  uploadProgress,
  isLoading = false,
  isDisabled = false,
  isInvalid = false,
  errorMessage,
  variant = 'button',
  buttonText = 'Choose File',
  description,
  showChips = true,
  selectedFiles = [],
  startContent,
  color = 'primary',
  className = '',
  'aria-label': ariaLabel,
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [internalError, setInternalError] = useState<string | null>(null);
  const inputId = useId();

  const activeError = errorMessage || internalError;
  const isErrorState = isInvalid || Boolean(activeError);

  const formatFileSize = (bytes?: number) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const validateAndDispatchFiles = useCallback(
    (fileList: FileList | File[]) => {
      setInternalError(null);
      const incoming = Array.from(fileList);
      if (incoming.length === 0) return;

      if (!multiple && incoming.length > 1) {
        setInternalError('Please select only a single file.');
        return;
      }

      if (multiple && incoming.length > maxCount) {
        setInternalError(`You can upload at most ${maxCount} files at once.`);
        return;
      }

      const validFiles: File[] = [];
      for (const file of incoming) {
        if (maxSizeBytes && file.size > maxSizeBytes) {
          setInternalError(
            `File "${file.name}" exceeds the maximum size limit of ${formatFileSize(maxSizeBytes)}.`
          );
          return;
        }

        // Validate extension / MIME if accept is specified
        if (accept) {
          const acceptedParts = accept.split(',').map((p) => p.trim().toLowerCase());
          const ext = `.${file.name.split('.').pop()?.toLowerCase()}`;
          const mime = file.type.toLowerCase();

          const matches = acceptedParts.some((part) => {
            if (part.startsWith('.')) return ext === part;
            if (part.endsWith('/*')) {
              const prefix = part.slice(0, -1);
              return mime.startsWith(prefix);
            }
            return mime === part;
          });

          if (!matches) {
            setInternalError(`File "${file.name}" does not match accepted format (${accept}).`);
            return;
          }
        }

        validFiles.push(file);
      }

      if (validFiles.length > 0) {
        onFilesSelected(validFiles);
      }
    },
    [accept, maxSizeBytes, maxCount, multiple, onFilesSelected]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      validateAndDispatchFiles(e.target.files);
    }
    // Reset input value so re-selecting the exact same file fires onChange cleanly
    e.target.value = '';
  };

  const handleTriggerClick = () => {
    if (isDisabled || isLoading) return;
    inputRef.current?.click();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (isDisabled || isLoading) return;
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (isDisabled || isLoading) return;
    if (e.dataTransfer.files) {
      validateAndDispatchFiles(e.dataTransfer.files);
    }
  };

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {/* Hidden native accessible input */}
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={isDisabled || isLoading}
        onChange={handleInputChange}
        className="sr-only"
        tabIndex={-1}
        aria-label={ariaLabel || buttonText}
      />

      {/* Visual Variant 1: Dropzone Card */}
      {variant === 'dropzone' ? (
        <EmilCard
          onClick={handleTriggerClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          role="button"
          tabIndex={!isDisabled && !isLoading ? 0 : -1}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleTriggerClick();
            }
          }}
          className={`border-2 border-dashed transition-all cursor-pointer p-6 sm:p-8 rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-accent ${
            isDragging
              ? 'border-accent bg-accent/10 scale-[1.01]'
              : isErrorState
              ? 'border-destructive bg-destructive/5 hover:border-destructive'
              : 'border-separator hover:border-accent/60 bg-surface-secondary/40'
          }`}
        >
          <div className="flex flex-col items-center justify-center text-center gap-3 p-0">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${
                isDragging
                  ? 'bg-accent/20 text-accent'
                  : isErrorState
                  ? 'bg-destructive/15 text-destructive'
                  : 'bg-surface-secondary text-label-secondary'
              }`}
            >
              {accept?.includes('image') ? <ImageIcon size={24} /> : <Upload size={24} />}
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-label-primary">
                {isDragging ? 'Drop file to upload' : buttonText}
              </p>
              <p className="text-xs text-label-tertiary">
                {description ||
                  `Drag & drop or browse from device ${accept ? `(${accept})` : ''} • Max ${formatFileSize(maxSizeBytes)}`}
              </p>
            </div>
          </div>
        </EmilCard>
      ) : variant === 'compact' ? (
        /* Visual Variant 2: Compact Inline Trigger */
        <div className="flex items-center gap-2.5">
          <Button
            size="sm"
            color={color}
            variant="flat"
            isLoading={isLoading}
            isDisabled={isDisabled}
            onPress={handleTriggerClick}
            startContent={startContent || <Upload size={14} />}
            className="rounded-xl font-medium text-xs shadow-xs"
          >
            {buttonText}
          </Button>
          {description && <span className="text-xs text-label-tertiary">{description}</span>}
        </div>
      ) : (
        /* Visual Variant 3: Standard Button Trigger */
        <div className="flex flex-col gap-1.5">
          <Button
            color={color}
            variant="solid"
            isLoading={isLoading}
            isDisabled={isDisabled}
            onPress={handleTriggerClick}
            startContent={startContent || <Upload size={16} />}
            className="rounded-xl font-semibold shadow-sm w-fit"
          >
            {buttonText}
          </Button>
          {description && <p className="text-xs text-label-tertiary">{description}</p>}
        </div>
      )}

      {/* Upload Progress Bar */}
      {uploadProgress !== undefined && uploadProgress >= 0 && (
        <div className="w-full space-y-1">
          <div className="flex items-center justify-between text-xs text-label-secondary">
            <span>Uploading...</span>
            <span className="font-mono">{Math.round(uploadProgress)}%</span>
          </div>
          <div className="w-full h-1.5 bg-surface-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-accent transition-all duration-300 rounded-full"
              style={{ width: `${Math.min(100, Math.max(0, uploadProgress))}%` }}
            />
          </div>
        </div>
      )}

      {/* Selected File Chips with Remove Button */}
      {showChips && selectedFiles && selectedFiles.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {selectedFiles.map((file, idx) => (
            <HeroChip
              key={idx}
              variant="flat"
              color="primary"
              size="sm"
              startContent={<FileText size={12} className="text-accent" />}
              onClose={
                onFileRemove && !isDisabled && !isLoading
                  ? () => onFileRemove(idx)
                  : undefined
              }
              className="font-medium text-xs py-1"
            >
              <span className="max-w-[180px] truncate" title={file.name}>
                {file.name}
              </span>
              {'size' in file && file.size ? (
                <span className="text-[10px] opacity-75 font-mono ml-1">
                  ({formatFileSize(file.size)})
                </span>
              ) : null}
            </HeroChip>
          ))}
        </div>
      )}

      {/* Inline Validation Error */}
      {isErrorState && (
        <div className="flex items-center gap-1.5 text-xs text-destructive pt-0.5">
          <AlertCircle size={13} className="shrink-0" />
          <span>{activeError}</span>
        </div>
      )}
    </div>
  );
};

export default HeroFileInput;
