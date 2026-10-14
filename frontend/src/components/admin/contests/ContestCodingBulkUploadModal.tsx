import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  X,
  FileCode,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Code2,
  Layers,
  Trash2,
  Check,
  Eye,
  EyeOff,
  Sparkles,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
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

  if (!isOpen) return null;

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
      toast.error('Please select an Excel sheet (.xlsx, .xls) or JSON file (.json)');
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
        }
        toast.success(`Parsed ${res.data.length} coding challenges successfully!`);
      } else {
        toast.error(res.error || 'Failed to parse challenges from file');
        if (res.errors) setParseErrors(res.errors);
      }
    } catch (err: any) {
      toast.error(err.message || 'File parsing failed');
    } finally {
      setIsParsing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      processFile(selected);
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
      processFile(dropped);
    }
  };

  const handleReset = () => {
    setFile(null);
    setParsedProblems([]);
    setParseErrors([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleConfirmImport = () => {
    if (parsedProblems.length === 0) {
      toast.error('No coding challenges parsed to import');
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
    <div className="fixed inset-0 z-[60] bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="bg-surface dark:bg-[#121214] rounded-3xl border border-separator dark:border-white/10 max-w-3xl w-full p-5 sm:p-6 space-y-4 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] my-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-separator dark:border-white/10 pb-3.5 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <FileCode size={20} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-label-primary dark:text-[#F5F5F7] tracking-tight font-heading">
                Bulk Upload Coding Challenges
              </h3>
              <p className="text-xs text-label-secondary dark:text-[#86868B]">
                Import algorithmic problems with hidden test cases and starter codes via Excel or JSON.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-surface-secondary dark:hover:bg-white/10 rounded-xl text-label-secondary hover:text-label-primary transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar">
          {/* Action Row: Download Template */}
          <div className="flex items-center justify-between p-3.5 bg-emerald-500/10 dark:bg-emerald-500/15 rounded-2xl border border-emerald-500/20">
            <div className="flex items-center gap-2.5">
              <Download size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div>
                <span className="text-xs font-bold text-label-primary dark:text-[#F5F5F7] block">
                  Need the Excel Format?
                </span>
                <span className="text-[11px] text-label-secondary dark:text-[#86868B]">
                  Download our coding challenge template with test case columns & sample problems.
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleDownloadTemplate}
              disabled={isDownloading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors shrink-0 cursor-pointer disabled:opacity-50"
            >
              {isDownloading ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
              <span>Download Template</span>
            </button>
          </div>

          {/* Dropzone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-emerald-500 bg-emerald-500/10'
                : 'border-separator dark:border-white/10 hover:border-emerald-500/50 hover:bg-surface-secondary dark:hover:bg-white/5'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.json"
              onChange={handleFileChange}
              className="hidden"
            />
            {isParsing ? (
              <div className="flex flex-col items-center justify-center py-4 space-y-2">
                <Loader2 size={28} className="animate-spin text-emerald-500" />
                <span className="text-xs font-bold text-label-primary dark:text-[#F5F5F7]">
                  Extracting problem statements & test cases...
                </span>
              </div>
            ) : file ? (
              <div className="flex items-center justify-between p-3 bg-surface-secondary dark:bg-[#1C1C1E] rounded-xl border border-separator dark:border-white/10 text-left">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <FileCode size={18} />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-label-primary dark:text-[#F5F5F7] block">
                      {file.name}
                    </span>
                    <span className="text-[10px] text-label-secondary dark:text-[#86868B]">
                      {(file.size / 1024).toFixed(1)} KB • {parsedProblems.length} challenge(s) parsed
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleReset();
                  }}
                  className="p-1.5 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                  title="Remove file"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-2 space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-surface-secondary dark:bg-white/5 flex items-center justify-center text-label-secondary">
                  <Upload size={22} />
                </div>
                <div>
                  <span className="text-xs font-bold text-label-primary dark:text-[#F5F5F7] block">
                    Click to browse or drag & drop challenges file
                  </span>
                  <span className="text-[11px] text-label-secondary dark:text-[#86868B]">
                    Supports Microsoft Excel (.xlsx, .xls) and JSON (.json)
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Import Strategy */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-label-secondary dark:text-[#86868B] flex items-center gap-1.5">
              <Layers size={13} className="text-emerald-500" />
              <span>Import Strategy</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setImportMode('append')}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  importMode === 'append'
                    ? 'bg-emerald-500/10 dark:bg-emerald-500/15 border-emerald-500/40 shadow-xs'
                    : 'bg-surface-secondary dark:bg-[#1C1C1E] border-separator dark:border-white/10 opacity-75 hover:opacity-100'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-label-primary dark:text-[#F5F5F7]">
                    Append to Current
                  </span>
                  {importMode === 'append' && <Check size={14} className="text-emerald-500" />}
                </div>
                <span className="text-[11px] text-label-secondary dark:text-[#86868B]">
                  Keep existing {currentProblemsCount} problem(s) and append new challenges to the contest.
                </span>
              </button>

              <button
                type="button"
                onClick={() => setImportMode('replace')}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  importMode === 'replace'
                    ? 'bg-emerald-500/10 dark:bg-emerald-500/15 border-emerald-500/40 shadow-xs'
                    : 'bg-surface-secondary dark:bg-[#1C1C1E] border-separator dark:border-white/10 opacity-75 hover:opacity-100'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-label-primary dark:text-[#F5F5F7]">
                    Replace All Challenges
                  </span>
                  {importMode === 'replace' && <Check size={14} className="text-emerald-500" />}
                </div>
                <span className="text-[11px] text-label-secondary dark:text-[#86868B]">
                  Clear existing challenges and replace entirely with parsed challenges from this file.
                </span>
              </button>
            </div>
          </div>

          {/* Validation Warnings */}
          {parseErrors.length > 0 && (
            <div className="p-3 bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 rounded-2xl space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400">
                <AlertCircle size={14} />
                <span>Notice / Warnings ({parseErrors.length})</span>
              </div>
              <ul className="text-[11px] text-amber-700 dark:text-amber-300 list-disc list-inside space-y-0.5">
                {parseErrors.slice(0, 5).map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
                {parseErrors.length > 5 && <li>...and {parseErrors.length - 5} more</li>}
              </ul>
            </div>
          )}

          {/* Parsed Preview Section */}
          {parsedProblems.length > 0 && (
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-label-primary dark:text-[#F5F5F7]">
                    Challenges Preview ({parsedProblems.length})
                  </span>
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg">
                    +{totalPoints} Total Pts
                  </span>
                </div>
                <span className="text-[11px] text-label-secondary dark:text-[#86868B]">
                  {importMode === 'append'
                    ? `Result: ${currentProblemsCount + parsedProblems.length} total challenges`
                    : `Result: ${parsedProblems.length} total challenges`}
                </span>
              </div>

              <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
                {parsedProblems.map((p, idx) => {
                  const tcs = p.testCases || [];
                  const publicCount = tcs.filter((t: any) => !t.isHidden).length;
                  const hiddenCount = tcs.filter((t: any) => t.isHidden).length;

                  return (
                    <div
                      key={idx}
                      className="p-3 bg-surface-secondary dark:bg-[#1C1C1E] rounded-xl border border-separator dark:border-white/10 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-[10px] font-bold text-emerald-500 font-mono">#{idx + 1}</span>
                          <span className="text-xs font-bold text-label-primary dark:text-[#F5F5F7] truncate">
                            {p.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${getDifficultyColor(
                              p.difficulty
                            )}`}
                          >
                            {p.difficulty}
                          </span>
                          <span className="text-[10px] font-bold bg-surface dark:bg-[#121214] px-2 py-0.5 rounded-md text-label-secondary">
                            {p.points || 30} pts
                          </span>
                        </div>
                      </div>

                      <p className="text-[11px] text-label-secondary dark:text-[#86868B] line-clamp-2">
                        {p.description}
                      </p>

                      <div className="flex items-center justify-between pt-1 text-[10px] text-label-secondary dark:text-[#86868B] border-t border-separator/40 dark:border-white/5">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                            <Eye size={12} /> {publicCount} public
                          </span>
                          <span className="flex items-center gap-1 text-purple-600 dark:text-purple-400 font-medium">
                            <EyeOff size={12} /> {hiddenCount} hidden
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          {(p.allowedLanguages || []).slice(0, 3).map((lang: string, lIdx: number) => (
                            <span
                              key={lIdx}
                              className="px-1.5 py-0.5 bg-surface dark:bg-[#121214] rounded text-[9px] uppercase font-mono"
                            >
                              {lang}
                            </span>
                          ))}
                          {(p.allowedLanguages || []).length > 3 && (
                            <span className="text-[9px]">+{p.allowedLanguages.length - 3}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 border-t border-separator dark:border-white/10 pt-3.5 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-label-secondary hover:text-label-primary hover:bg-surface-secondary dark:hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirmImport}
            disabled={parsedProblems.length === 0}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <CheckCircle2 size={14} />
            <span>
              Import {parsedProblems.length > 0 ? `${parsedProblems.length} Challenges` : 'Challenges'}
            </span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default ContestCodingBulkUploadModal;
