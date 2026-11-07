import React, { useState, useRef } from 'react';
import ResponsiveModal from '../../ui/ResponsiveModal';
import {
  FileSpreadsheet,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { Button, Spinner } from '@heroui/react';
import { toast } from 'react-hot-toast';
import useContestStore, { MCQQuestion } from '../../../store/useContestStore';

interface ContestMcqBulkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (questions: MCQQuestion[], mode: 'append' | 'replace') => void;
  currentQuestionsCount: number;
}

export const ContestMcqBulkUploadModal: React.FC<ContestMcqBulkUploadModalProps> = ({
  isOpen,
  onClose,
  onImport,
  currentQuestionsCount,
}) => {
  const { downloadContestMcqTemplate, parseContestMcqUpload } = useContestStore();

  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [importMode, setImportMode] = useState<'append' | 'replace'>('append');
  const [parsedQuestions, setParsedQuestions] = useState<any[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadTemplate = async () => {
    try {
      setIsDownloading(true);
      await downloadContestMcqTemplate();
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
    setParsedQuestions([]);

    try {
      const res = await parseContestMcqUpload(selectedFile);
      if (res.success && res.data && res.data.length > 0) {
        setParsedQuestions(res.data);
        if (res.errors && res.errors.length > 0) {
          setParseErrors(res.errors);
          toast.success(
            `Parsed ${res.data.length} question(s) with ${res.errors.length} non-fatal warning(s)`
          );
        } else {
          toast.success(`Successfully parsed ${res.data.length} MCQ questions!`);
        }
      } else {
        const errorMsg = (res as any).message || res.error || 'No valid MCQ questions found in the uploaded file.';
        setParseErrors([errorMsg]);
        toast.error(errorMsg);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to parse file';
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

  const handleRemoveParsedQuestion = (index: number) => {
    const updated = parsedQuestions.filter((_, idx) => idx !== index);
    setParsedQuestions(updated);
    toast.success('Question removed from staging');
  };

  const handleResetFile = () => {
    setFile(null);
    setParsedQuestions([]);
    setParseErrors([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleConfirmImport = () => {
    if (parsedQuestions.length === 0) {
      toast.error('No valid questions to import');
      return;
    }

    onImport(parsedQuestions, importMode);
    toast.success(
      `Successfully ${importMode === 'append' ? 'appended' : 'imported'} ${parsedQuestions.length} MCQ(s)!`
    );
    onClose();
  };

  const totalPoints = parsedQuestions.reduce((sum, q) => sum + (Number(q.points) || 10), 0);

  return (
    <ResponsiveModal
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <FileSpreadsheet className="w-4 h-4" />
          </div>
          <span>Bulk Upload Contest MCQs</span>
        </div>
      }
      description="Import dozens of multiple-choice questions via Excel spreadsheet or JSON."
      dialogClassName="sm:max-w-3xl p-6"
    >
      <div className="space-y-4 pt-2">
        {/* Action Row: Download Template */}
        <div className="flex items-center justify-between p-3.5 bg-purple-500/10 dark:bg-purple-500/15 rounded-2xl border border-purple-500/20">
          <div className="flex items-center gap-2.5">
            <Download size={18} className="text-purple-600 dark:text-purple-400 shrink-0" />
            <div>
              <span className="text-xs font-bold text-label-primary block">
                Need the Excel Format?
              </span>
              <span className="text-[11px] text-label-secondary">
                Download our standardized template with column headers and sample questions.
              </span>
            </div>
          </div>
          <Button
            type="button"
            variant="primary"
            onPress={handleDownloadTemplate}
            isDisabled={isDownloading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-xs shrink-0 cursor-pointer"
          >
            {isDownloading ? <Spinner size="sm" color="default" /> : <Download size={13} />}
            <span>Download Template</span>
          </Button>
        </div>

        {/* Dropzone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-purple-500 bg-purple-500/10'
              : 'border-separator dark:border-white/10 hover:border-purple-500/50 hover:bg-surface-secondary dark:hover:bg-white/5'
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
              <Spinner size="md" color="secondary" />
              <span className="text-xs font-bold text-label-primary">
                Parsing spreadsheet records...
              </span>
            </div>
          ) : file ? (
            <div className="flex items-center justify-between p-3 bg-surface-secondary rounded-xl border border-separator dark:border-white/10 text-left">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <FileSpreadsheet size={18} />
                </div>
                <div>
                  <span className="text-xs font-bold text-label-primary block">
                    {file.name}
                  </span>
                  <span className="text-[10px] text-label-secondary">
                    {(file.size / 1024).toFixed(1)} KB • {parsedQuestions.length} item(s) parsed
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
          ) : (
            <div className="flex flex-col items-center justify-center py-4 space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-1">
                <Upload size={22} />
              </div>
              <span className="text-xs font-bold text-label-primary">
                Drag & drop your question sheet here, or <span className="text-purple-500 underline">browse</span>
              </span>
              <span className="text-[11px] text-label-secondary">
                Supports Microsoft Excel (.xlsx, .xls) and structured JSON files
              </span>
            </div>
          )}
        </div>

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
        {parsedQuestions.length > 0 && (
          <div className="space-y-3 pt-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-surface-secondary rounded-2xl border border-separator dark:border-white/10">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-purple-500" />
                <span className="text-xs font-bold text-label-primary">
                  Parsed: {parsedQuestions.length} Questions ({totalPoints} total pts)
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
                    name="importMode"
                    value="append"
                    checked={importMode === 'append'}
                    onChange={() => setImportMode('append')}
                    className="accent-purple-600"
                  />
                  <span>Append to existing ({currentQuestionsCount})</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer font-medium text-label-primary">
                  <input
                    type="radio"
                    name="importMode"
                    value="replace"
                    checked={importMode === 'replace'}
                    onChange={() => setImportMode('replace')}
                    className="accent-purple-600"
                  />
                  <span className="text-rose-500 font-bold">Replace All</span>
                </label>
              </div>
            </div>

            {/* Preview Staged List */}
            <div className="max-h-56 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {parsedQuestions.map((q, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-surface rounded-xl border border-separator dark:border-white/10 flex items-start justify-between gap-3 text-xs"
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold font-mono text-[10px] text-label-secondary">
                        #{idx + 1}
                      </span>
                      <span className="font-bold text-label-primary truncate">
                        {q.question}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-surface-secondary dark:bg-white/10 text-label-secondary">
                        {q.points || 10} pts
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 pt-1">
                      {q.options?.map((opt: string, optIdx: number) => (
                        <span
                          key={optIdx}
                          className={`px-2 py-0.5 rounded-lg text-[10px] truncate ${
                            optIdx === q.correctOptionIndex
                              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20'
                              : 'bg-surface-secondary text-label-secondary'
                          }`}
                        >
                          {String.fromCharCode(65 + optIdx)}. {opt}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveParsedQuestion(idx)}
                    className="p-1.5 hover:bg-rose-500/10 text-label-secondary hover:text-rose-500 rounded-lg transition-colors cursor-pointer shrink-0"
                    title="Remove this question"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-4 border-t border-separator flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="secondary"
            onPress={onClose}
            className="px-4 py-2 rounded-full text-xs font-medium cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            onPress={handleConfirmImport}
            isDisabled={parsedQuestions.length === 0}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white shadow cursor-pointer"
          >
            <CheckCircle2 size={14} />
            <span>
              Import {parsedQuestions.length > 0 ? `${parsedQuestions.length} Questions` : 'Questions'}
            </span>
          </Button>
        </div>
      </div>
    </ResponsiveModal>
  );
};

export default ContestMcqBulkUploadModal;

