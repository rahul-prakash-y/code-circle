import React, { useState, useEffect, useRef } from 'react';
import ResponsiveModal from '../ui/ResponsiveModal';
import api from '../../lib/axios';
import toast from 'react-hot-toast';
import {
  FileSpreadsheet,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  FileText,
  Sparkles,
  Layers,
  Award,
  HelpCircle,
  Plus,
} from 'lucide-react';
import useAssessmentStore, { Assessment } from '../../store/useAssessmentStore';
import TutorialButton from '../common/TutorialButton';

interface McqBulkUploadModalProps {
  isOpen?: boolean;
  open?: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  targetAssessmentId?: string;
  targetAssessmentTitle?: string;
}

export const McqBulkUploadModal: React.FC<McqBulkUploadModalProps> = ({
  isOpen: propIsOpen,
  open: propOpen,
  onClose,
  onSuccess,
  targetAssessmentId,
  targetAssessmentTitle,
}) => {
  const isModalOpen = propOpen !== undefined ? propOpen : Boolean(propIsOpen);
  const { assessments, downloadSampleTemplate, bulkUploadAssessments, fetchAssessments } =
    useAssessmentStore();

  const [destination, setDestination] = useState<'new' | 'existing'>(
    targetAssessmentId ? 'existing' : 'new'
  );
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string>(
    targetAssessmentId || ''
  );

  // File state
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadResult, setUploadResult] = useState<{
    count?: number;
    assessmentsCreated?: number;
    assessmentsUpdated?: number;
    errors?: string[];
    message?: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isModalOpen) {
      if (targetAssessmentId) {
        setSelectedAssessmentId(targetAssessmentId);
        setDestination('existing');
      } else {
        setDestination('new');
        if (assessments.length > 0 && !selectedAssessmentId) {
          setSelectedAssessmentId(assessments[0]._id);
        }
      }
      setFile(null);
      setUploadResult(null);
    }
  }, [isModalOpen, targetAssessmentId, assessments]);

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

    if (destination === 'existing' && !selectedAssessmentId) {
      toast.error('Please select a target assessment to append questions to');
      return;
    }

    try {
      setIsUploading(true);
      const res = await bulkUploadAssessments(
        file,
        destination === 'existing' ? selectedAssessmentId : undefined
      );

      if (res.success) {
        setUploadResult({
          count: res.count,
          assessmentsCreated: res.assessmentsCreated,
          assessmentsUpdated: res.assessmentsUpdated,
          errors: res.errors,
          message: res.message,
        });
        toast.success(res.message || `Successfully imported ${res.count} MCQ questions!`);
        if (onSuccess) onSuccess();
      } else {
        toast.error(res.error || 'Bulk upload failed');
        if (res.errors?.length) {
          setUploadResult({
            errors: res.errors,
            message: res.error,
          });
        }
      }
    } catch (err: any) {
      toast.error(err.message || 'Bulk upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleResetForm = () => {
    setFile(null);
    setUploadResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <ResponsiveModal
      isOpen={isModalOpen}
      open={isModalOpen}
      onClose={onClose}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={
        <div className="flex items-center justify-between w-full pr-6 gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/30 flex items-center justify-center shrink-0">
              <FileSpreadsheet size={20} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-label-primary dark:text-[#F5F5F7] tracking-tight font-heading">
                Bulk Upload MCQ Assessments
              </h3>
              <p className="text-xs text-label-secondary dark:text-[#86868B] font-normal">
                Import hundreds of multiple-choice questions via Excel spreadsheet (.xlsx / .xls)
              </p>
            </div>
          </div>
          <TutorialButton tutorialId="mcq-bulk-upload" variant="icon" />
        </div>
      }
      className="max-w-2xl"
    >
      <div className="space-y-5 p-1 text-xs">
        {/* Step 1: Destination Selection */}
        <div className="space-y-2">
          <label className="text-[11px] font-bold uppercase tracking-wider text-label-secondary dark:text-[#86868B] flex items-center gap-1.5">
            <Layers size={13} className="text-purple-500" />
            <span>1. Choose Destination Mode</span>
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setDestination('new')}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                destination === 'new'
                  ? 'bg-purple-500/10 dark:bg-purple-500/15 border-purple-500/40 shadow-sm'
                  : 'bg-surface dark:bg-[#161617] border-separator dark:border-white/10 hover:border-separator-opaque'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-extrabold text-xs text-label-primary dark:text-[#F5F5F7]">
                    Create New Assessment(s)
                  </span>
                  {destination === 'new' && (
                    <CheckCircle2 size={15} className="text-purple-600 dark:text-purple-400" />
                  )}
                </div>
                <p className="text-[11px] text-label-secondary dark:text-[#86868B] leading-relaxed">
                  Automatically creates one or multiple assessments grouped by the "AssessmentTitle"
                  column in the spreadsheet.
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setDestination('existing')}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                destination === 'existing'
                  ? 'bg-purple-500/10 dark:bg-purple-500/15 border-purple-500/40 shadow-sm'
                  : 'bg-surface dark:bg-[#161617] border-separator dark:border-white/10 hover:border-separator-opaque'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-extrabold text-xs text-label-primary dark:text-[#F5F5F7]">
                    Append to Existing Assessment
                  </span>
                  {destination === 'existing' && (
                    <CheckCircle2 size={15} className="text-purple-600 dark:text-purple-400" />
                  )}
                </div>
                <p className="text-[11px] text-label-secondary dark:text-[#86868B] leading-relaxed">
                  Imports all questions directly into a selected assessment, adding them to its existing
                  question pool.
                </p>
              </div>
            </button>
          </div>

          {/* Target Assessment Dropdown if existing selected */}
          {destination === 'existing' && (
            <div className="pt-2">
              {targetAssessmentTitle ? (
                <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs flex items-center justify-between">
                  <span className="text-label-secondary dark:text-[#86868B]">Target Assessment:</span>
                  <strong className="text-purple-700 dark:text-purple-300 font-bold">
                    {targetAssessmentTitle}
                  </strong>
                </div>
              ) : (
                <div>
                  <label className="text-[10px] font-bold text-label-secondary dark:text-[#86868B] uppercase tracking-wider block mb-1">
                    Select Target Assessment *
                  </label>
                  <select
                    value={selectedAssessmentId}
                    onChange={(e) => setSelectedAssessmentId(e.target.value)}
                    className="w-full text-xs py-2.5 px-3 rounded-xl bg-surface dark:bg-[#1C1C1E] border border-separator dark:border-white/10 text-label-primary dark:text-[#F5F5F7] focus:outline-none focus:border-purple-500 cursor-pointer font-medium"
                  >
                    {assessments.map((a) => (
                      <option key={a._id} value={a._id}>
                        {a.title} ({a.questions?.length || 0} questions) — {a.category}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Step 2: Download Sample Template */}
        <div className="p-4 rounded-2xl bg-canvas dark:bg-[#18181A] border border-separator dark:border-white/10 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Download size={15} className="text-emerald-500" />
              <span className="font-extrabold text-xs text-label-primary dark:text-[#F5F5F7]">
                2. Download Sample Excel Template
              </span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              Verified .XLSX
            </span>
          </div>

          <p className="text-[11px] text-label-secondary dark:text-[#86868B] leading-relaxed">
            The template contains sample questions covering multiple choices (Option A, B, C, D), correct
            answer mappings, points, and explanations, plus an instructions tab.
          </p>

          <button
            type="button"
            onClick={handleDownloadTemplate}
            disabled={isDownloadingTemplate}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-surface dark:bg-[#202024] border border-separator dark:border-white/10 hover:border-emerald-500/40 text-label-primary dark:text-[#F5F5F7] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
          >
            {isDownloadingTemplate ? (
              <Loader2 size={14} className="animate-spin text-emerald-500" />
            ) : (
              <FileSpreadsheet size={15} className="text-emerald-500" />
            )}
            <span>Download MCQ Template (.xlsx)</span>
          </button>
        </div>

        {/* Step 3: Drag & Drop Upload Zone */}
        <div className="space-y-2">
          <label className="text-[11px] font-bold uppercase tracking-wider text-label-secondary dark:text-[#86868B] flex items-center gap-1.5">
            <Upload size={13} className="text-purple-500" />
            <span>3. Upload Filled Excel File</span>
          </label>

          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx, .xls"
            onChange={handleFileChange}
            className="hidden"
          />

          {!file ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`p-6 sm:p-8 rounded-2xl border-2 border-dashed transition-all text-center cursor-pointer space-y-2 ${
                isDragging
                  ? 'border-purple-500 bg-purple-500/10'
                  : 'border-separator dark:border-white/10 hover:border-purple-500/40 bg-surface dark:bg-[#161617]'
              }`}
            >
              <div className="w-12 h-12 rounded-2xl bg-canvas dark:bg-[#202024] border border-separator dark:border-white/10 flex items-center justify-center mx-auto text-purple-600 dark:text-purple-400 shadow-sm">
                <Upload size={22} />
              </div>
              <p className="text-xs font-bold text-label-primary dark:text-[#F5F5F7]">
                Click to browse or drag and drop your spreadsheet here
              </p>
              <p className="text-[11px] text-label-secondary dark:text-[#86868B]">
                Supported formats: <strong className="text-label-primary dark:text-white">.xlsx</strong> or{' '}
                <strong className="text-label-primary dark:text-white">.xls</strong> (Up to 10 MB)
              </p>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-purple-500/5 dark:bg-purple-500/10 border border-purple-500/25 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                  <FileSpreadsheet size={20} />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-xs text-label-primary dark:text-[#F5F5F7] truncate">
                    {file.name}
                  </p>
                  <p className="text-[10px] text-label-secondary dark:text-[#86868B]">
                    {(file.size / 1024).toFixed(1)} KB • Ready for processing
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleResetForm}
                className="p-1.5 rounded-lg text-label-tertiary hover:text-label-primary hover:bg-canvas dark:hover:bg-white/10 transition-colors cursor-pointer"
                title="Remove file"
              >
                <X size={16} />
              </button>
            </div>
          )}
        </div>

        {/* Upload Results Summary Card */}
        {uploadResult && (
          <div
            className={`p-4 rounded-2xl border space-y-2 transition-all ${
              uploadResult.errors?.length && !uploadResult.count
                ? 'bg-red-500/10 border-red-500/25 text-red-600 dark:text-red-400'
                : 'bg-emerald-500/10 border-emerald-500/25 text-emerald-700 dark:text-emerald-400'
            }`}
          >
            <div className="flex items-center gap-2">
              {uploadResult.count ? (
                <CheckCircle2 size={16} className="text-emerald-500" />
              ) : (
                <AlertCircle size={16} className="text-red-500" />
              )}
              <span className="font-black text-xs">
                {uploadResult.message ||
                  (uploadResult.count
                    ? `Successfully processed ${uploadResult.count} MCQ questions!`
                    : 'Import completed with warnings')}
              </span>
            </div>

            {uploadResult.count !== undefined && (
              <div className="flex items-center gap-3 text-[11px] pt-1">
                <span>
                  Questions Imported: <strong>{uploadResult.count}</strong>
                </span>
                {uploadResult.assessmentsCreated !== undefined && (
                  <span>
                    • Assessments Created: <strong>{uploadResult.assessmentsCreated}</strong>
                  </span>
                )}
                {uploadResult.assessmentsUpdated !== undefined && (
                  <span>
                    • Assessments Updated: <strong>{uploadResult.assessmentsUpdated}</strong>
                  </span>
                )}
              </div>
            )}

            {uploadResult.errors && uploadResult.errors.length > 0 && (
              <div className="pt-2 border-t border-red-500/20 space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-red-600 dark:text-red-300">
                  Validation notices / skipped rows:
                </p>
                <ul className="list-disc list-inside text-[11px] space-y-0.5 max-h-32 overflow-y-auto">
                  {uploadResult.errors.map((err, errIdx) => (
                    <li key={errIdx}>{err}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-separator dark:border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold rounded-xl text-label-secondary hover:text-label-primary bg-surface dark:bg-[#1C1C1E] border border-separator dark:border-white/10 transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleUpload}
            disabled={!file || isUploading}
            className="btn-primary py-2 px-5 text-xs font-bold flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl shadow-md shadow-purple-500/20 disabled:opacity-50 cursor-pointer"
          >
            {isUploading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Processing & Importing...</span>
              </>
            ) : (
              <>
                <Upload size={14} />
                <span>Start Bulk Import</span>
              </>
            )}
          </button>
        </div>
      </div>
    </ResponsiveModal>
  );
};

export default McqBulkUploadModal;
