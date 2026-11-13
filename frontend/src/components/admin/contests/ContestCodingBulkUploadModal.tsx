import React, { useState, useRef } from 'react';
import ResponsiveModal from '../../ui/ResponsiveModal';
import {
  FileCode,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Button } from '@heroui/react';
import { HeroFileInput } from '@/components/ui/hero/HeroFileInput';
import useContestStore, { CodingProblem } from '../../../store/useContestStore';

interface ContestCodingBulkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (problems: CodingProblem[], mode: 'append' | 'replace') => void;
  currentProblemsCount: number;
}

export const ContestCodingBulkUploadModal: React.FC<ContestCodingBulkUploadModalProps> = ({
  isOpen,
  onClose,
  onImport,
  currentProblemsCount,
}) => {
  const { downloadContestCodingTemplate, parseContestCodingUpload } = useContestStore();

  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [importMode, setImportMode] = useState<'append' | 'replace'>('append');
  const [parsedProblems, setParsedProblems] = useState<any[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadTemplate = async () => {
    try {
      setIsDownloading(true);
      await downloadContestCodingTemplate();
    } finally {
      setIsDownloading(false);
    }
  };

  const processFile = async (selectedFile: File) => {
    const name = selectedFile.name.toLowerCase();
    if (!name.endsWith('.xlsx') && !name.endsWith('.xls') && !name.endsWith('.json')) {
      toast.error('Please upload an Excel sheet (.xlsx, .xls) or JSON file (.json)');
      return;
    }

    setFile(selectedFile);
    setIsParsing(true);
    setParseErrors([]);
    setParsedProblems([]);

    try {
      const res = await parseContestCodingUpload(selectedFile);
      if (res.success && res.data && res.data.length > 0) {
        setParsedProblems(res.data);
        if (res.errors && res.errors.length > 0) {
          setParseErrors(res.errors);
          toast.success(
            `Parsed ${res.data.length} challenge(s) with ${res.errors.length} non-fatal warning(s)`
          );
        } else {
          toast.success(`Successfully extracted ${res.data.length} coding challenge(s)!`);
        }
      } else {
        const errorMsg = (res as any).message || res.error || 'No valid coding problems found in the uploaded file.';
        setParseErrors([errorMsg]);
        toast.error(errorMsg);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to process file';
      setParseErrors([msg]);
      toast.error(msg);
    } finally {
      setIsParsing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
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
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveParsedProblem = (index: number) => {
    const updated = parsedProblems.filter((_, idx) => idx !== index);
    setParsedProblems(updated);
    toast.success('Problem removed from staging');
  };

  const handleResetFile = () => {
    setFile(null);
    setParsedProblems([]);
    setParseErrors([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleConfirmImport = () => {
    if (parsedProblems.length === 0) {
      toast.error('No valid problems to import');
      return;
    }

    onImport(parsedProblems, importMode);
    toast.success(
      `Successfully ${importMode === 'append' ? 'appended' : 'imported'} ${parsedProblems.length} coding challenge(s)!`
    );
    onClose();
  };

  const totalPoints = parsedProblems.reduce((sum, p) => sum + (Number(p.points) || 30), 0);

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case 'Easy':
        return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
      case 'Hard':
        return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
      default:
        return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
    }
  };

  return (
    <ResponsiveModal
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <FileCode className="w-4 h-4" />
          </div>
          <span>Bulk Upload Coding Challenges</span>
        </div>
      }
      description="Import algorithmic problems with hidden test cases and starter codes via Excel or JSON."
      dialogClassName="sm:max-w-3xl p-6"
    >
      <div className="space-y-4 pt-2">
        {/* Action Row: Download Template */}
        <div className="flex items-center justify-between p-3.5 bg-emerald-500/10 dark:bg-emerald-500/15 rounded-2xl border border-emerald-500/20">
          <div className="flex items-center gap-2.5">
            <Download size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div>
              <span className="text-xs font-bold text-label-primary block">
                Need the Excel Format?
              </span>
              <span className="text-[11px] text-label-secondary">
                Download our coding challenge template with test case columns & sample problems.
              </span>
            </div>
          </div>
          <Button
            size="sm"
            color="success"
            variant="solid"
            onPress={handleDownloadTemplate}
            isLoading={isDownloading}
            startContent={<Download size={13} />}
            className="rounded-xl text-xs font-bold text-white shadow-xs shrink-0"
          >
            Download Template
          </Button>
        </div>

        {/* Dropzone */}
        {!file && !isParsing ? (
          <HeroFileInput
            variant="dropzone"
            accept=".xlsx,.xls,.json"
            buttonText="Click to browse or drag and drop your spreadsheet"
            description="Supports Microsoft Excel (.xlsx, .xls) and JSON"
            onFilesSelected={(files) => {
              if (files[0]) processFile(files[0]);
            }}
            color="success"
            showChips={false}
          />
        ) : isParsing ? (
          <div className="border-2 border-dashed border-separator rounded-2xl p-6 text-center">
            <div className="flex flex-col items-center justify-center py-4 space-y-2">
              <Loader2 size={26} className="animate-spin text-emerald-600 mx-auto" />
              <span className="text-xs font-bold text-label-primary">
                Extracting problem statements & test cases...
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between p-3 bg-surface-secondary rounded-xl border border-separator dark:border-white/10 text-left">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <FileCode size={18} />
              </div>
              <div>
                <span className="text-xs font-bold text-label-primary block">
                  {file?.name}
                </span>
                <span className="text-[10px] text-label-secondary">
                  {file ? (file.size / 1024).toFixed(1) : 0} KB • {parsedProblems.length} challenge(s) parsed
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleResetFile();
              }}
              className="p-1.5 hover:bg-surface dark:hover:bg-white/10 rounded-lg text-label-secondary hover:text-rose-500 transition-colors cursor-pointer"
              title="Choose a different file"
            >
              <Trash2 size={16} />
            </button>
          </div>
        )}

        {/* Parsing Error Alerts */}
        {parseErrors.length > 0 && (
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-2xl space-y-1.5">
            <div className="flex items-center gap-2 text-rose-500 font-bold text-xs">
              <AlertCircle size={15} />
              <span>Import Warnings & Validation Errors</span>
            </div>
            <ul className="text-[11px] text-rose-600 dark:text-rose-400 list-disc list-inside space-y-0.5 max-h-24 overflow-y-auto">
              {parseErrors.map((err, idx) => (
                <li key={idx}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Staging & Mode Controls */}
        {parsedProblems.length > 0 && (
          <div className="space-y-3 pt-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-surface-secondary rounded-2xl border border-separator dark:border-white/10">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-emerald-500" />
                <span className="text-xs font-bold text-label-primary">
                  Parsed: {parsedProblems.length} Challenges ({totalPoints} total pts)
                </span>
              </div>

              {/* Import Mode Radio */}
              <div className="flex items-center gap-2 text-xs">
                <span className="text-label-secondary text-[11px] font-semibold">
                  Target Mode:
                </span>
                <label className="flex items-center gap-1.5 cursor-pointer font-medium text-label-primary">
                  <input
                    type="radio"
                    name="codingImportMode"
                    value="append"
                    checked={importMode === 'append'}
                    onChange={() => setImportMode('append')}
                    className="accent-emerald-600"
                  />
                  <span>Append to existing ({currentProblemsCount})</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer font-medium text-label-primary">
                  <input
                    type="radio"
                    name="codingImportMode"
                    value="replace"
                    checked={importMode === 'replace'}
                    onChange={() => setImportMode('replace')}
                    className="accent-emerald-600"
                  />
                  <span className="text-rose-500 font-bold">Replace All</span>
                </label>
              </div>
            </div>

            {/* Preview Staged List */}
            <div className="max-h-56 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {parsedProblems.map((p, idx) => {
                const testCases = p.testCases || [];
                const hiddenCount = testCases.filter((tc: any) => tc.isHidden).length;
                const publicCount = testCases.length - hiddenCount;

                return (
                  <div
                    key={idx}
                    className="p-3 bg-surface rounded-xl border border-separator dark:border-white/10 flex items-start justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold font-mono text-[10px] text-label-secondary">
                          #{idx + 1}
                        </span>
                        <span className="font-bold text-label-primary truncate">
                          {p.title}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getDifficultyColor(
                            p.difficulty
                          )}`}
                        >
                          {p.difficulty}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-surface-secondary dark:bg-white/10 text-label-secondary">
                          {p.points || 30} pts
                        </span>
                      </div>
                      <p className="text-[11px] text-label-secondary line-clamp-1">
                        {p.description}
                      </p>
                      <div className="flex items-center gap-3 pt-0.5 text-[10px] text-label-secondary">
                        <span>
                          <strong>{testCases.length}</strong> test cases ({publicCount} public, {hiddenCount} hidden)
                        </span>
                        {p.allowedLanguages && p.allowedLanguages.length > 0 && (
                          <span>
                            Languages: {p.allowedLanguages.slice(0, 3).join(', ')}
                            {p.allowedLanguages.length > 3 && ` + ${p.allowedLanguages.length - 3}`}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveParsedProblem(idx)}
                      className="p-1.5 hover:bg-rose-500/10 text-label-secondary hover:text-rose-500 rounded-lg transition-colors cursor-pointer shrink-0"
                      title="Remove this problem"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-4 border-t border-separator flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-full text-xs font-semibold border border-separator text-label-secondary hover:text-label-primary bg-surface-secondary hover:bg-surface transition-colors duration-150 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirmImport}
            disabled={parsedProblems.length === 0}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-xs transition-colors duration-150 cursor-pointer"
          >
            <CheckCircle2 size={14} />
            <span>
              Import {parsedProblems.length > 0 ? `${parsedProblems.length} Challenges` : 'Challenges'}
            </span>
          </button>
        </div>
      </div>
    </ResponsiveModal>
  );
};

export default ContestCodingBulkUploadModal;

