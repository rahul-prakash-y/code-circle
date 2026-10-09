import React, { useState, useEffect, useRef } from 'react';
import ResponsiveModal from '../../ui/ResponsiveModal';
import api from '../../../lib/axios';
import toast from 'react-hot-toast';
import {
  FileSpreadsheet,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Layers,
  FolderPlus,
  BookOpen,
  X,
  FileText,
  Sparkles,
} from 'lucide-react';

interface CodingBulkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialDomainId?: string;
  initialLevelId?: string;
}

interface DomainOption {
  _id: string;
  name: string;
}

interface LevelOption {
  _id: string;
  levelNumber: number;
  title: string;
}

export const CodingBulkUploadModal: React.FC<CodingBulkUploadModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialDomainId,
  initialLevelId,
}) => {
  const [destination, setDestination] = useState<'course' | 'standalone'>(
    initialLevelId ? 'course' : 'course'
  );
  const [domains, setDomains] = useState<DomainOption[]>([]);
  const [selectedDomainId, setSelectedDomainId] = useState<string>(initialDomainId || '');
  const [levels, setLevels] = useState<LevelOption[]>([]);
  const [selectedLevelId, setSelectedLevelId] = useState<string>(initialLevelId || '');
  const [loadingDomains, setLoadingDomains] = useState<boolean>(false);
  const [loadingLevels, setLoadingLevels] = useState<boolean>(false);

  // File state
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadResult, setUploadResult] = useState<{
    count: number;
    errors?: string[];
    message?: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load domains
  useEffect(() => {
    if (isOpen) {
      setLoadingDomains(true);
      api
        .get('/domains')
        .then((res) => {
          const list = res.data?.data || [];
          setDomains(list);
          if (!selectedDomainId && list.length > 0) {
            setSelectedDomainId(initialDomainId || list[0]._id);
          }
        })
        .catch((err) => {
          console.error('Failed to load courses', err);
        })
        .finally(() => setLoadingDomains(false));
    }
  }, [isOpen, initialDomainId]);

  // Load levels for selected domain
  useEffect(() => {
    if (selectedDomainId && destination === 'course') {
      setLoadingLevels(true);
      api
        .get(`/domains/${selectedDomainId}`)
        .then((res) => {
          const fetchedLevels = res.data?.data?.levels || [];
          setLevels(fetchedLevels);
          if (fetchedLevels.length > 0) {
            if (initialLevelId && fetchedLevels.some((l: any) => l._id === initialLevelId)) {
              setSelectedLevelId(initialLevelId);
            } else {
              setSelectedLevelId(fetchedLevels[0]._id);
            }
          } else {
            setSelectedLevelId('');
          }
        })
        .catch((err) => {
          console.error('Failed to load levels', err);
          setLevels([]);
          setSelectedLevelId('');
        })
        .finally(() => setLoadingLevels(false));
    }
  }, [selectedDomainId, destination, initialLevelId]);

  const handleDownloadTemplate = async () => {
    try {
      setIsDownloadingTemplate(true);
      const res = await api.get('/assessments/code/admin/template', {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(
        new Blob([res.data], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        })
      );
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'coding_questions_sample_template.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Sample Excel template downloaded');
    } catch (err: any) {
      console.error('Download template error:', err);
      toast.error('Failed to download Excel template');
    } finally {
      setIsDownloadingTemplate(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      validateAndSetFile(selected);
    }
  };

  const validateAndSetFile = (f: File) => {
    const name = f.name.toLowerCase();
    if (!name.endsWith('.xlsx') && !name.endsWith('.xls')) {
      toast.error('Please select an Excel file (.xlsx or .xls)');
      return;
    }
    setFile(f);
    setUploadResult(null);
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
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      validateAndSetFile(droppedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select an Excel file to upload');
      return;
    }

    if (destination === 'course' && !selectedLevelId) {
      toast.error('Please select a course level to upload questions to');
      return;
    }

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      if (destination === 'course') {
        formData.append('levelId', selectedLevelId);
        formData.append('domainId', selectedDomainId);
      }

      const res = await api.post('/assessments/code/admin/bulk-upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const { count, errors, message } = res.data;
      setUploadResult({ count, errors, message });
      toast.success(`Successfully uploaded ${count} coding questions!`);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error('Upload error:', err);
      toast.error(err.response?.data?.error || err.message || 'Failed to upload coding questions');
    } finally {
      setIsUploading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setUploadResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <ResponsiveModal
      isOpen={isOpen}
      onClose={onClose}
      title="Bulk Upload Coding Questions"
      description="Upload multiple coding challenges via Excel to populate course level question pools or standalone assessments."
      maxWidth="max-w-2xl"
    >
      <div className="space-y-5 py-1">
        {/* Destination Mode Segmented Pill */}
        <div className="flex items-center p-1 rounded-2xl bg-surface-secondary border border-separator shadow-sm">
          <button
            type="button"
            onClick={() => setDestination('course')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
              destination === 'course'
                ? 'bg-surface text-label-primary shadow-sm ring-1 ring-separator'
                : 'text-label-secondary hover:text-label-primary'
            }`}
          >
            <BookOpen className="w-4 h-4 text-accent" />
            <span>Course Level (Question Pool)</span>
          </button>
          <button
            type="button"
            onClick={() => setDestination('standalone')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
              destination === 'standalone'
                ? 'bg-surface text-label-primary shadow-sm ring-1 ring-separator'
                : 'text-label-secondary hover:text-label-primary'
            }`}
          >
            <Layers className="w-4 h-4 text-purple-500" />
            <span>Assessments Tab (Standalone)</span>
          </button>
        </div>

        {/* Course and Level Selectors (Only if Course Level destination) */}
        {destination === 'course' && (
          <div className="p-4 rounded-2xl bg-surface-secondary/70 border border-separator space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Domain / Course Selector */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-label-secondary uppercase tracking-wider">
                  Target Course
                </label>
                <select
                  value={selectedDomainId}
                  onChange={(e) => setSelectedDomainId(e.target.value)}
                  disabled={loadingDomains}
                  className="w-full px-3 py-2 rounded-xl bg-surface border border-separator text-xs text-label-primary focus:outline-none focus:ring-2 focus:ring-accent/20 cursor-pointer disabled:opacity-50"
                >
                  {domains.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Level Selector */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-label-secondary uppercase tracking-wider">
                  Target Level
                </label>
                <select
                  value={selectedLevelId}
                  onChange={(e) => setSelectedLevelId(e.target.value)}
                  disabled={loadingLevels || levels.length === 0}
                  className="w-full px-3 py-2 rounded-xl bg-surface border border-separator text-xs text-label-primary focus:outline-none focus:ring-2 focus:ring-accent/20 cursor-pointer disabled:opacity-50"
                >
                  {levels.length === 0 ? (
                    <option value="">No levels found</option>
                  ) : (
                    levels.map((lvl) => (
                      <option key={lvl._id} value={lvl._id}>
                        Level {lvl.levelNumber}: {lvl.title}
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>

            <p className="text-[11px] text-label-secondary leading-relaxed flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-accent shrink-0" />
              <span>
                Questions uploaded here will be added to this level&apos;s coding pool. When students start the 1-hour assessment, <strong>2 random questions</strong> are automatically assigned.
              </span>
            </p>
          </div>
        )}

        {/* Download Template Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-accent/5 border border-accent/20">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-accent/10 text-accent shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-label-primary">Excel Template Guide</h4>
              <p className="text-[11px] text-label-secondary">
                Pre-formatted workbook with 3 working problem examples, test cases, and starter codes.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDownloadTemplate}
            disabled={isDownloadingTemplate}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-surface border border-separator text-label-primary hover:border-accent hover:text-accent shadow-sm transition cursor-pointer shrink-0 disabled:opacity-50"
          >
            {isDownloadingTemplate ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-accent" />
            ) : (
              <Download className="w-3.5 h-3.5 text-accent" />
            )}
            <span>Download Template (.xlsx)</span>
          </button>
        </div>

        {/* Drag and Drop Zone */}
        <div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".xlsx,.xls"
            className="hidden"
          />

          {!file ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center gap-3 ${
                isDragging
                  ? 'border-accent bg-accent/5 scale-[1.01]'
                  : 'border-separator hover:border-label-tertiary bg-surface-secondary/40'
              }`}
            >
              <div className="w-12 h-12 rounded-2xl bg-surface border border-separator flex items-center justify-center text-label-secondary shadow-sm">
                <Upload className="w-6 h-6 text-accent" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-label-primary">
                  Click to browse or drag and drop your Excel file here
                </p>
                <p className="text-[11px] text-label-secondary">
                  Supports Microsoft Excel (.xlsx, .xls) up to 10MB
                </p>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-surface-secondary border border-separator flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500 shrink-0">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div className="truncate">
                  <p className="text-xs font-semibold text-label-primary truncate">{file.name}</p>
                  <p className="text-[11px] text-label-tertiary">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleReset}
                className="p-1.5 rounded-lg text-label-tertiary hover:text-label-primary hover:bg-surface transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Upload Success Report */}
        {uploadResult && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 space-y-2">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
              <CheckCircle2 className="w-4 h-4" />
              <span>{uploadResult.message || `Imported ${uploadResult.count} coding questions`}</span>
            </div>
            {uploadResult.errors && uploadResult.errors.length > 0 && (
              <div className="text-[11px] text-amber-600 dark:text-amber-400 space-y-1 pt-1 border-t border-emerald-500/20">
                <p className="font-semibold">Notes / Warnings:</p>
                <ul className="list-disc pl-4 space-y-0.5">
                  {uploadResult.errors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-separator">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-label-secondary hover:text-label-primary transition cursor-pointer"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handleUpload}
            disabled={!file || isUploading}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-semibold bg-accent hover:bg-accent-hover text-white shadow-md shadow-accent/20 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Importing Questions...</span>
              </>
            ) : (
              <>
                <Upload className="w-3.5 h-3.5" />
                <span>Upload & Import Questions</span>
              </>
            )}
          </button>
        </div>
      </div>
    </ResponsiveModal>
  );
};

export default CodingBulkUploadModal;
