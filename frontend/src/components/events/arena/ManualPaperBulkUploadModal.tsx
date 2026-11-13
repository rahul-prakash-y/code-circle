import React, { useState, useRef, useMemo } from 'react';
import { exportToCsv, parseCsv } from '@/utils/csvUtils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  FileSpreadsheet,
  Download,
  X,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  FileText,
  Search,
  RefreshCw,
} from 'lucide-react';
import { Button, Spinner } from '@heroui/react';
import { toast } from 'react-hot-toast';
import api from '../../../lib/axios';

export interface ManualPaperBulkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  assessmentId: string;
  assessmentTitle?: string;
  maxScore: number;
  passingPercentage?: number;
  onSuccess: () => void;
}

interface ParsedRow {
  rowNumber: number;
  identifier: string;
  score: number | null;
  mcqScore?: number;
  codingScore?: number;
  maxScore?: number;
  notes?: string;
  isValid: boolean;
  validationError?: string;
}

export const ManualPaperBulkUploadModal: React.FC<ManualPaperBulkUploadModalProps> = React.memo(({
  isOpen,
  onClose,
  eventId,
  assessmentId,
  assessmentTitle = 'Assessment',
  maxScore,
  passingPercentage = 50,
  onSuccess,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{
    total: number;
    successCount: number;
    errorCount: number;
    errors: Array<{ row: number; identifier: string; error: string }>;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Reset state when closed or opened
  const handleReset = () => {
    setFile(null);
    setParsedRows([]);
    setSearchQuery('');
    setUploadResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  // Download official CSV template
  const handleDownloadTemplate = async () => {
    try {
      const sampleData = [
        {
          'Roll Number / Email': '7376221CS101',
          'Total Score': 85,
          'MCQ Score': 35,
          'Coding Score': 50,
          'Max Possible Score': maxScore || 100,
          'Notes': 'Physical answer sheet evaluation - Hall 3',
        },
        {
          'Roll Number / Email': '7376221IT102',
          'Total Score': 92,
          'MCQ Score': 42,
          'Coding Score': 50,
          'Max Possible Score': maxScore || 100,
          'Notes': 'Offline paper test score',
        },
        {
          'Roll Number / Email': 'student.ec26@bitsathy.ac.in',
          'Total Score': 78,
          'MCQ Score': 30,
          'Coding Score': 48,
          'Max Possible Score': maxScore || 100,
          'Notes': 'Manual evaluation',
        },
      ];

      exportToCsv(sampleData, `Paper_Scores_Template_${assessmentTitle.replace(/[^a-zA-Z0-9]/g, '_')}.csv`);
      toast.success('Sample template downloaded successfully!');
    } catch (err: any) {
      toast.error('Failed to generate sample template');
    }
  };

  // Parse Excel / CSV File
  const processFile = async (uploadedFile: File) => {
    if (!uploadedFile) return;
    const extension = uploadedFile.name.split('.').pop()?.toLowerCase();
    if (!['xlsx', 'xls', 'csv'].includes(extension || '')) {
      toast.error('Please upload an Excel (.xlsx, .xls) or CSV (.csv) file.');
      return;
    }

    setFile(uploadedFile);
    setUploadResult(null);

    try {
      let rawJson: any[] = [];
      if (extension === 'csv') {
        const text = await uploadedFile.text();
        rawJson = parseCsv(text);
      } else {
        const XLSX = await import('xlsx');
        const data = await uploadedFile.arrayBuffer();
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[firstSheetName];
        rawJson = XLSX.utils.sheet_to_json(sheet, { defval: '' });
      }

      if (rawJson.length === 0) {
        toast.error('The uploaded file is empty.');
        setParsedRows([]);
        return;
      }

      const rows: ParsedRow[] = rawJson.map((row, idx) => {
        const identifier = String(
          row['Roll Number / Email'] ||
          row['Roll Number'] ||
          row['RollNo'] ||
          row['rollNo'] ||
          row['Email'] ||
          row['email'] ||
          row['Student'] ||
          row['studentIdentifier'] ||
          ''
        ).trim();

        const rawScore =
          row['Total Score'] !== '' ? row['Total Score'] :
          row['Score'] !== '' ? row['Score'] :
          row['score'] !== '' ? row['score'] :
          row['totalScore'] !== '' ? row['totalScore'] :
          row['Marks'] !== '' ? row['Marks'] :
          row['marks'];

        const numScore = rawScore !== '' && rawScore !== null && rawScore !== undefined && !isNaN(Number(rawScore))
          ? Number(rawScore)
          : null;

        const mcqScore = row['MCQ Score'] !== '' && !isNaN(Number(row['MCQ Score'])) ? Number(row['MCQ Score']) : undefined;
        const codingScore = row['Coding Score'] !== '' && !isNaN(Number(row['Coding Score'])) ? Number(row['Coding Score']) : undefined;
        const rowMax = row['Max Possible Score'] !== '' && !isNaN(Number(row['Max Possible Score'])) ? Number(row['Max Possible Score']) : maxScore;
        const notes = String(row['Notes'] || row['Notes / Feedback'] || row['Feedback'] || row['notes'] || '').trim();

        let isValid = true;
        let validationError = '';

        if (!identifier) {
          isValid = false;
          validationError = 'Missing Roll Number or Email';
        } else if (numScore === null || isNaN(numScore)) {
          isValid = false;
          validationError = 'Invalid numerical score';
        } else if (numScore < 0) {
          isValid = false;
          validationError = 'Score cannot be negative';
        } else if (numScore > rowMax) {
          isValid = false;
          validationError = `Score exceeds max possible (${rowMax})`;
        }

        return {
          rowNumber: idx + 2, // Header is row 1
          identifier,
          score: numScore,
          mcqScore,
          codingScore,
          maxScore: rowMax,
          notes,
          isValid,
          validationError,
        };
      });

      setParsedRows(rows);
      const validCount = rows.filter((r) => r.isValid).length;
      toast.success(`Parsed ${rows.length} rows (${validCount} valid).`);
    } catch (err: any) {
      console.error('File parsing error:', err);
      toast.error('Failed to parse file. Please verify file format.');
      setParsedRows([]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const validRows = useMemo(() => parsedRows.filter((r) => r.isValid), [parsedRows]);
  const invalidRows = useMemo(() => parsedRows.filter((r) => !r.isValid), [parsedRows]);

  const filteredRows = useMemo(() => {
    if (!searchQuery.trim()) return parsedRows;
    const q = searchQuery.toLowerCase();
    return parsedRows.filter(
      (r) =>
        r.identifier.toLowerCase().includes(q) ||
        String(r.score).includes(q) ||
        (r.notes && r.notes.toLowerCase().includes(q))
    );
  }, [parsedRows, searchQuery]);

  // Submit bulk paper scores
  const handleUploadSubmit = async () => {
    if (validRows.length === 0) {
      toast.error('No valid rows found to upload.');
      return;
    }

    setIsUploading(true);
    try {
      const payloadRows = validRows.map((r) => ({
        studentIdentifier: r.identifier,
        score: r.score,
        mcqScore: r.mcqScore,
        codingScore: r.codingScore,
        maxScore: r.maxScore,
        notes: r.notes || 'Bulk paper score upload',
      }));

      const res = await api.post(
        `/events/${eventId}/arena/assessments/${assessmentId}/manual-submission/bulk-upload`,
        { rows: payloadRows }
      );

      if (res.data?.success) {
        toast.success(res.data.message || `Uploaded ${validRows.length} submissions successfully!`);
        setUploadResult(res.data.results);
        onSuccess();
      } else {
        toast.error(res.data?.error || 'Failed to upload paper submissions.');
      }
    } catch (err: any) {
      console.error('Bulk upload error:', err);
      toast.error(err.response?.data?.error || err.message || 'Failed to upload paper scores.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[75] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="w-full max-w-3xl rounded-3xl bg-surface border border-separator/80 p-5 sm:p-7 shadow-2xl space-y-5 my-6 max-h-[92vh] flex flex-col"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-separator/70 pb-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0 shadow-xs">
                  <FileSpreadsheet size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-label-primary tracking-tight">
                      Bulk Upload Paper / Manual Scores
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-500/15 text-purple-400 border border-purple-500/30">
                      {assessmentTitle}
                    </span>
                  </div>
                  <p className="text-xs text-label-secondary mt-0.5">
                    Upload an Excel or CSV file containing scores for students who took the test on paper
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="p-2 rounded-xl bg-canvas hover:bg-surface-secondary text-label-tertiary hover:text-label-primary transition-colors cursor-pointer border border-separator/60"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="space-y-4 overflow-y-auto custom-scrollbar flex-1 pr-1">
              {/* Template Download Banner */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-transparent border border-purple-500/20 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <FileText size={18} className="text-purple-400 shrink-0" />
                  <div className="text-xs">
                    <span className="font-semibold text-label-primary block">Need the standard spreadsheet template?</span>
                    <span className="text-label-tertiary text-[11px]">Columns: Roll Number / Email, Total Score, MCQ Score, Coding Score, Notes</span>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="bordered"
                  color="secondary"
                  onPress={handleDownloadTemplate}
                  startContent={<Download size={13} />}
                  className="rounded-xl text-xs font-bold shrink-0 cursor-pointer"
                >
                  Download Template (.xlsx)
                </Button>
              </div>

              {/* Drag & Drop File Zone */}
              {!uploadResult && (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all ${
                    isDragging
                      ? 'border-purple-500 bg-purple-500/10'
                      : file
                      ? 'border-emerald-500/40 bg-emerald-500/5'
                      : 'border-separator hover:border-purple-500/50 hover:bg-surface-secondary'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        processFile(e.target.files[0]);
                      }
                    }}
                  />
                  <div className="mx-auto w-12 h-12 rounded-2xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-3 shadow-xs">
                    <Upload size={22} />
                  </div>
                  <h4 className="text-xs sm:text-sm font-bold text-label-primary mb-1">
                    {file ? file.name : 'Click to select or drag and drop your spreadsheet here'}
                  </h4>
                  <p className="text-[11px] text-label-tertiary">
                    Supports .xlsx, .xls, and .csv files. Maximum 500 rows per batch.
                  </p>
                </div>
              )}

              {/* Upload Result Summary (if finished) */}
              {uploadResult && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-5 rounded-2xl bg-surface-secondary border border-separator space-y-3"
                >
                  <div className="flex items-center gap-2.5 text-emerald-400">
                    <CheckCircle2 size={20} />
                    <span className="font-bold text-sm text-label-primary">Batch Upload Completed</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2.5 text-center">
                    <div className="p-3 rounded-xl bg-canvas border border-separator">
                      <span className="text-[11px] text-label-tertiary block">Total Rows</span>
                      <strong className="text-base text-label-primary font-mono">{uploadResult.total}</strong>
                    </div>
                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25">
                      <span className="text-[11px] text-emerald-400 block font-semibold">Success</span>
                      <strong className="text-base text-emerald-400 font-mono">{uploadResult.successCount}</strong>
                    </div>
                    <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25">
                      <span className="text-[11px] text-rose-400 block font-semibold">Errors</span>
                      <strong className="text-base text-rose-400 font-mono">{uploadResult.errorCount}</strong>
                    </div>
                  </div>

                  {uploadResult.errors.length > 0 && (
                    <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 space-y-1 max-h-36 overflow-y-auto custom-scrollbar">
                      <span className="font-bold text-[11px] block uppercase tracking-wider">Failed Rows:</span>
                      {uploadResult.errors.map((err, i) => (
                        <div key={i} className="flex items-center justify-between text-[11px] font-mono">
                          <span>Row {err.row}: {err.identifier}</span>
                          <span className="text-rose-400">{err.error}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="pt-2 flex justify-end">
                    <Button
                      size="sm"
                      variant="solid"
                      color="secondary"
                      onPress={handleReset}
                      startContent={<RefreshCw size={13} />}
                      className="rounded-xl text-xs font-bold cursor-pointer"
                    >
                      Upload Another File
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Parsed Data Preview Table */}
              {!uploadResult && parsedRows.length > 0 && (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-label-primary">Preview Rows</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/15 text-emerald-400 font-bold border border-emerald-500/30">
                        {validRows.length} valid
                      </span>
                      {invalidRows.length > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-rose-500/15 text-rose-400 font-bold border border-rose-500/30">
                          {invalidRows.length} with issues
                        </span>
                      )}
                    </div>

                    <div className="relative w-full sm:w-60">
                      <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-label-tertiary" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Filter rows..."
                        className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-surface-secondary border border-separator text-xs text-label-primary outline-none focus:border-purple-500 placeholder:text-label-tertiary"
                      />
                    </div>
                  </div>

                  <div className="border border-separator rounded-2xl overflow-hidden max-h-60 overflow-y-auto custom-scrollbar bg-canvas">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-surface-secondary/80 sticky top-0 z-10 border-b border-separator text-[11px] text-label-tertiary font-mono uppercase">
                        <tr>
                          <th className="py-2.5 px-3">Row</th>
                          <th className="py-2.5 px-3">Student</th>
                          <th className="py-2.5 px-3 text-center">Score</th>
                          <th className="py-2.5 px-3 text-center">MCQ / Coding</th>
                          <th className="py-2.5 px-3">Notes</th>
                          <th className="py-2.5 px-3 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-separator/60 font-mono text-[11px]">
                        {filteredRows.slice(0, 100).map((row) => (
                          <tr
                            key={row.rowNumber}
                            className={`hover:bg-surface-secondary/40 transition ${
                              !row.isValid ? 'bg-rose-500/5' : ''
                            }`}
                          >
                            <td className="py-2 px-3 text-label-tertiary">{row.rowNumber}</td>
                            <td className="py-2 px-3 text-label-primary font-semibold truncate max-w-[140px]">
                              {row.identifier}
                            </td>
                            <td className="py-2 px-3 text-center">
                              {row.score !== null ? (
                                <span className="font-bold text-purple-300">
                                  {row.score} <span className="text-label-tertiary font-normal">/ {row.maxScore}</span>
                                </span>
                              ) : (
                                <span className="text-rose-400">Invalid</span>
                              )}
                            </td>
                            <td className="py-2 px-3 text-center text-label-secondary text-[10px]">
                              {row.mcqScore !== undefined ? `${row.mcqScore}m` : '-'} /{' '}
                              {row.codingScore !== undefined ? `${row.codingScore}c` : '-'}
                            </td>
                            <td className="py-2 px-3 text-label-tertiary truncate max-w-[140px]" title={row.notes}>
                              {row.notes || '-'}
                            </td>
                            <td className="py-2 px-3 text-right">
                              {row.isValid ? (
                                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/25">
                                  <CheckCircle2 size={10} /> Valid
                                </span>
                              ) : (
                                <span
                                  className="inline-flex items-center gap-1 text-[10px] text-rose-400 font-bold px-1.5 py-0.5 rounded bg-rose-500/10 border border-rose-500/25 cursor-help"
                                  title={row.validationError}
                                >
                                  <AlertCircle size={10} /> {row.validationError}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-separator/70 shrink-0">
              <div className="text-xs text-label-tertiary font-mono">
                {validRows.length > 0 && !uploadResult && (
                  <span>Ready to import: <strong className="text-emerald-400">{validRows.length}</strong> students</span>
                )}
              </div>
              <div className="flex items-center gap-2.5">
                <Button
                  size="sm"
                  variant="light"
                  onPress={handleClose}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-label-secondary hover:bg-white/10 cursor-pointer"
                >
                  {uploadResult ? 'Done' : 'Cancel'}
                </Button>
                {!uploadResult && (
                  <Button
                    size="sm"
                    variant="solid"
                    color="secondary"
                    isLoading={isUploading}
                    isDisabled={isUploading || validRows.length === 0}
                    onPress={handleUploadSubmit}
                    startContent={!isUploading ? <Upload size={13} /> : undefined}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-purple-600/25 transition cursor-pointer"
                  >
                    {isUploading ? 'Uploading...' : `Import ${validRows.length} Scores`}
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
});

ManualPaperBulkUploadModal.displayName = 'ManualPaperBulkUploadModal';

export default ManualPaperBulkUploadModal;
