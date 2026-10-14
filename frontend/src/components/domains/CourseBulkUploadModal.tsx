import React, { useState, useEffect, useRef } from 'react';
import ResponsiveModal from '../ui/ResponsiveModal';
import toast from 'react-hot-toast';
import {
  FileSpreadsheet,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Sparkles,
  Layers,
  Award,
  HelpCircle,
  BookOpen,
  ArrowRight,
  Info,
} from 'lucide-react';
import useDomainStore from '../../store/useDomainStore';
import TutorialButton from '../common/TutorialButton';
import { IDomain } from '../../types/domain';

interface CourseBulkUploadModalProps {
  isOpen?: boolean;
  open?: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  targetDomainId?: string;
  targetDomainName?: string;
}

export const CourseBulkUploadModal: React.FC<CourseBulkUploadModalProps> = ({
  isOpen: propIsOpen,
  open: propOpen,
  onClose,
  onSuccess,
  targetDomainId,
  targetDomainName,
}) => {
  const isModalOpen = propOpen !== undefined ? propOpen : Boolean(propIsOpen);
  const { domains, downloadSampleTemplate, bulkUploadCoursesAndLevels, fetchDomains } = useDomainStore();

  const [destination, setDestination] = useState<'all' | 'specific'>(
    targetDomainId ? 'specific' : 'all'
  );
  const [selectedDomainId, setSelectedDomainId] = useState<string>(targetDomainId || '');

  // File state
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [showGuide, setShowGuide] = useState<boolean>(false);
  const [uploadResult, setUploadResult] = useState<{
    coursesCreated?: number;
    coursesUpdated?: number;
    levelsCreated?: number;
    levelsUpdated?: number;
    errors?: string[];
    message?: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isModalOpen) {
      if (targetDomainId) {
        setSelectedDomainId(targetDomainId);
        setDestination('specific');
      } else {
        setDestination('all');
        if (domains.length > 0 && !selectedDomainId) {
          setSelectedDomainId(domains[0]._id);
        }
      }
      setFile(null);
      setUploadResult(null);
    }
  }, [isModalOpen, targetDomainId, domains]);

  const handleDownloadTemplate = async () => {
    try {
      setIsDownloadingTemplate(true);
      await downloadSampleTemplate();
    } finally {
      setIsDownloadingTemplate(false);
    }
  };

  const validateAndSetFile = (f: File) => {
    const name = f.name.toLowerCase();
    if (!name.endsWith('.xlsx') && !name.endsWith('.xls')) {
      toast.error('Please select an Excel spreadsheet (.xlsx or .xls)');
      return;
    }
    setFile(f);
    setUploadResult(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      validateAndSetFile(selected);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) {
      validateAndSetFile(dropped);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select an Excel file to upload');
      return;
    }

    if (destination === 'specific' && !selectedDomainId) {
      toast.error('Please select a target course to import levels into');
      return;
    }

    try {
      setIsUploading(true);
      const res = await bulkUploadCoursesAndLevels(
        file,
        destination === 'specific' ? selectedDomainId : undefined
      );

      if (res.success) {
        setUploadResult({
          coursesCreated: res.coursesCreated,
          coursesUpdated: res.coursesUpdated,
          levelsCreated: res.levelsCreated,
          levelsUpdated: res.levelsUpdated,
          errors: res.errors,
          message: res.message,
        });

        toast.success(res.message || 'Courses and levels imported successfully!');
        if (onSuccess) {
          onSuccess();
        }
      } else {
        toast.error(res.error || 'Failed to bulk upload courses and levels');
        if (res.errors && res.errors.length > 0) {
          setUploadResult({
            errors: res.errors,
            message: res.error,
          });
        }
      }
    } catch (err: any) {
      toast.error(err.message || 'An unexpected upload error occurred');
    } finally {
      setIsUploading(false);
    }
  };

  const currentCourse = domains.find((d) => d._id === selectedDomainId);

  return (
    <ResponsiveModal
      isOpen={isModalOpen}
      onClose={onClose}
      dialogClassName="sm:max-w-2xl bg-surface-raised border border-separator shadow-2xl rounded-3xl"
      title={
        <div className="flex items-center justify-between w-full pr-6 gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-label-primary">
                Bulk Upload Courses & Levels
              </h2>
              <p className="text-xs text-label-secondary">
                Import entire course curricula, video lectures, and custom points via Excel
              </p>
            </div>
          </div>
          <TutorialButton tutorialId="course-bulk-upload" variant="icon" />
        </div>
      }
    >
      <div className="space-y-6 pt-2 pb-4">
        {/* Destination Target Selector */}
        {!targetDomainId && (
          <div className="p-4 rounded-2xl bg-surface-secondary border border-separator/80 space-y-3">
            <label className="text-xs font-bold text-label-primary uppercase tracking-wider block">
              1. Destination Track Mode
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setDestination('all')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  destination === 'all'
                    ? 'bg-accent/10 border-accent text-label-primary shadow-xs'
                    : 'bg-surface border-separator text-label-secondary hover:text-label-primary hover:border-separator/80'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold">All Courses & Levels</span>
                  {destination === 'all' && (
                    <CheckCircle2 className="w-4 h-4 text-accent" />
                  )}
                </div>
                <p className="text-[11px] opacity-80 leading-snug">
                  Create or update multiple courses and their levels as defined in the Excel sheet.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setDestination('specific')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  destination === 'specific'
                    ? 'bg-accent/10 border-accent text-label-primary shadow-xs'
                    : 'bg-surface border-separator text-label-secondary hover:text-label-primary hover:border-separator/80'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold">Import into Specific Course</span>
                  {destination === 'specific' && (
                    <CheckCircle2 className="w-4 h-4 text-accent" />
                  )}
                </div>
                <p className="text-[11px] opacity-80 leading-snug">
                  Directly append or update levels into an existing course track.
                </p>
              </button>
            </div>

            {destination === 'specific' && (
              <div className="pt-2">
                <label className="text-[11px] font-semibold text-label-secondary mb-1 block">
                  Select Target Course Track:
                </label>
                <select
                  value={selectedDomainId}
                  onChange={(e) => setSelectedDomainId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-surface border border-separator text-xs text-label-primary focus:outline-none focus:ring-2 focus:ring-accent/40"
                >
                  {domains.map((dom) => (
                    <option key={dom._id} value={dom._id}>
                      {dom.name} ({dom.totalLevels || 0} levels)
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        {targetDomainId && (
          <div className="p-3.5 rounded-2xl bg-accent/10 border border-accent/25 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <Layers className="w-4 h-4 text-accent shrink-0" />
              <div>
                <span className="font-bold text-label-primary">Target Course: </span>
                <span className="text-accent font-semibold">{targetDomainName || currentCourse?.name}</span>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-surface text-[10px] font-bold text-label-secondary border border-separator">
              Current Course
            </span>
          </div>
        )}

        {/* Template Download Card */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/25 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-label-primary">
                Official Excel (.xlsx) Template
              </div>
              <p className="text-[11px] text-label-secondary mt-0.5 leading-snug">
                Download the structured multi-sheet spreadsheet with sample Courses, Levels, Quest questions, and Custom Points.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDownloadTemplate}
            disabled={isDownloadingTemplate}
            className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-500 active:scale-98 transition shadow-sm cursor-pointer disabled:opacity-50"
          >
            {isDownloadingTemplate ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            <span>Download Template</span>
          </button>
        </div>

        {/* Drag and drop upload zone */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-label-primary uppercase tracking-wider block">
            2. Upload Spreadsheet File
          </label>

          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center transition-all cursor-pointer ${
              isDragging
                ? 'border-accent bg-accent/10 scale-[0.99]'
                : file
                ? 'border-emerald-500/50 bg-emerald-500/5'
                : 'border-separator hover:border-separator-hover bg-surface-secondary/40 hover:bg-surface-secondary'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              className="hidden"
            />

            {file ? (
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-xs">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div className="text-sm font-bold text-label-primary">{file.name}</div>
                <div className="text-xs text-label-secondary">
                  {(file.size / 1024).toFixed(1)} KB • Ready for processing
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                    setUploadResult(null);
                  }}
                  className="mt-2 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 transition cursor-pointer"
                >
                  <X className="w-3 h-3" /> Remove File
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-2xl bg-surface border border-separator text-label-secondary flex items-center justify-center shadow-xs">
                  <Upload className="w-6 h-6" />
                </div>
                <div className="text-sm font-semibold text-label-primary">
                  Click to browse or drag and drop Excel sheet here
                </div>
                <p className="text-xs text-label-secondary">
                  Supports .xlsx and .xls formats with Courses and Levels worksheets
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Column Quick Guide Accordion */}
        <div className="border border-separator rounded-2xl overflow-hidden bg-surface">
          <button
            type="button"
            onClick={() => setShowGuide(!showGuide)}
            className="w-full p-3.5 flex items-center justify-between text-xs font-bold text-label-primary hover:bg-surface-secondary transition cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-accent" />
              <span>Format Guide: Custom Points, Videos & Verification Quests</span>
            </div>
            <span className="text-[11px] text-accent font-semibold">
              {showGuide ? 'Hide Guide' : 'Show Guide'}
            </span>
          </button>

          {showGuide && (
            <div className="p-4 pt-2 border-t border-separator text-xs text-label-secondary space-y-3 bg-surface-secondary/40">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-surface border border-separator/80 space-y-1">
                  <div className="font-bold text-label-primary text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-accent" /> Courses Sheet
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    Columns: <code className="text-accent font-mono">CourseName</code> (required), <code className="text-accent font-mono">Description</code>, <code className="text-accent font-mono">CoverImageUrl</code>, <code className="text-accent font-mono">IsLocked</code>.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-surface border border-separator/80 space-y-1">
                  <div className="font-bold text-label-primary text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-amber-500" /> Levels Sheet & Custom Points
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    Columns: <code className="text-accent font-mono">CourseName</code>, <code className="text-accent font-mono">LevelNumber</code>, <code className="text-accent font-mono">Title</code>, <code className="text-accent font-mono">YouTubeVideo</code>, <code className="text-amber-500 font-bold font-mono">Points</code> (custom completion points awarded to student!), <code className="text-accent font-mono">QuestQuestion</code>, <code className="text-accent font-mono">OptionA</code>..<code className="text-accent font-mono">OptionD</code>, <code className="text-accent font-mono">CorrectOption</code>.
                  </p>
                </div>
              </div>
              <p className="text-[11px] italic opacity-85">
                Tip: Multiple rows sharing the same <code className="font-mono">CourseName</code> and <code className="font-mono">LevelNumber</code> will automatically group their verification quest questions together into that level.
              </p>
            </div>
          )}
        </div>

        {/* Upload Result Feedback */}
        {uploadResult && (
          <div
            className={`p-4 rounded-2xl border space-y-3 ${
              (uploadResult.coursesCreated || 0) + (uploadResult.levelsCreated || 0) > 0 ||
              (uploadResult.coursesUpdated || 0) + (uploadResult.levelsUpdated || 0) > 0
                ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-950 dark:text-emerald-200'
                : 'bg-rose-500/10 border-rose-500/25 text-rose-950 dark:text-rose-200'
            }`}
          >
            <div className="flex items-center gap-2 font-bold text-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>{uploadResult.message || 'Bulk upload complete!'}</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-surface/80 border border-separator/60">
                <div className="text-[10px] font-semibold text-label-secondary uppercase">
                  Courses Created
                </div>
                <div className="text-base font-bold text-label-primary">
                  {uploadResult.coursesCreated || 0}
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-surface/80 border border-separator/60">
                <div className="text-[10px] font-semibold text-label-secondary uppercase">
                  Courses Updated
                </div>
                <div className="text-base font-bold text-label-primary">
                  {uploadResult.coursesUpdated || 0}
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-surface/80 border border-separator/60">
                <div className="text-[10px] font-semibold text-label-secondary uppercase">
                  Levels Created
                </div>
                <div className="text-base font-bold text-label-primary">
                  {uploadResult.levelsCreated || 0}
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-surface/80 border border-separator/60">
                <div className="text-[10px] font-semibold text-label-secondary uppercase">
                  Levels Updated
                </div>
                <div className="text-base font-bold text-label-primary">
                  {uploadResult.levelsUpdated || 0}
                </div>
              </div>
            </div>

            {uploadResult.errors && uploadResult.errors.length > 0 && (
              <div className="pt-2 border-t border-separator/60 space-y-1">
                <div className="text-[11px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Validation Warnings ({uploadResult.errors.length})</span>
                </div>
                <ul className="text-[11px] list-disc list-inside space-y-0.5 max-h-32 overflow-y-auto text-label-secondary">
                  {uploadResult.errors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-separator">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-surface border border-separator text-label-secondary hover:text-label-primary hover:bg-surface-secondary transition cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleUpload}
            disabled={!file || isUploading}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-accent text-white hover:bg-accent-hover active:scale-98 transition shadow-md shadow-accent/25 cursor-pointer disabled:opacity-50"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing Excel...</span>
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                <span>Upload & Build Courses</span>
              </>
            )}
          </button>
        </div>
      </div>
    </ResponsiveModal>
  );
};

export default CourseBulkUploadModal;
