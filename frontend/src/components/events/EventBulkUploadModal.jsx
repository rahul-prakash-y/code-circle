import ResponsiveModal from '../ui/ResponsiveModal';
import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Upload,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertCircle,
  Users,
  UserCheck,
  Calendar,
  Sparkles,
  ArrowRight,
  RefreshCw,
  FileText,
} from 'lucide-react';
import { Button, Spinner } from '@heroui/react';
import toast from 'react-hot-toast';
import useEnrollmentStore from '../../store/useEnrollmentStore';
import useEventStore from '../../store/useEventStore';

export const EventBulkUploadModal = ({
  isOpen,
  onClose,
  event,
  onSuccess,
}) => {
  const { bulkUploadParticipants, downloadParticipantsTemplate } = useEnrollmentStore();
  const { fetchEvents } = useEventStore();

  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [parsedPreview, setParsedPreview] = useState([]);
  const [markAttendance, setMarkAttendance] = useState(false);
  const [loading, setLoading] = useState(false);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);

  if (!isOpen || !event) return null;

  const handleDownloadTemplate = async () => {
    setDownloadingTemplate(true);
    try {
      await downloadParticipantsTemplate(event._id);
      toast.success('Sample template downloaded successfully!');
    } catch {
      // Client-side fallback generation
      try {
        const sampleData = [
          {
            'Reg No': '7376221CS101',
            'Student Name': 'Aditya Kumar',
            'Student Official Email ID': 'aditya.cs22@bitsathy.ac.in',
            'Department': 'CSE',
            'Attendance Status (Optional)': 'Present',
          },
          {
            'Reg No': '7376221CS102',
            'Student Name': 'Bhavana S',
            'Student Official Email ID': 'bhavana.cs22@bitsathy.ac.in',
            'Department': 'AI & DS',
            'Attendance Status (Optional)': 'Present',
          },
          {
            'Reg No': '7376221EC105',
            'Student Name': 'Chandran R',
            'Student Official Email ID': 'chandran.ec22@bitsathy.ac.in',
            'Department': 'ECE',
            'Attendance Status (Optional)': 'Absent',
          },
        ];
        const XLSX = await import('xlsx');
        const ws = XLSX.utils.json_to_sheet(sampleData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Participants Roster');
        XLSX.writeFile(wb, `${(event.title || 'event').replace(/[^a-zA-Z0-9]/g, '_')}_participants_sample_template.xlsx`);
        toast.success('Sample template generated!');
      } catch (err) {
        toast.error('Failed to download template: ' + (err.message || 'Error'));
      }
    } finally {
      setDownloadingTemplate(false);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const lowerName = selectedFile.name.toLowerCase();
    if (!lowerName.endsWith('.xlsx') && !lowerName.endsWith('.xls') && !lowerName.endsWith('.csv')) {
      toast.error('Please upload an Excel spreadsheet (.xlsx, .xls) or CSV file');
      return;
    }

    setFile(selectedFile);
    setFileName(selectedFile.name);
    setUploadResult(null);

    // Read and parse client-side preview
    import('xlsx').then((XLSX) => {
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const bstr = evt.target?.result;
          const wb = XLSX.read(bstr, { type: 'binary' });
          const wsname = wb.SheetNames[0];
          const ws = wb.Sheets[wsname];
          const data = XLSX.utils.sheet_to_json(ws, { defval: '' });
          setParsedPreview(data.slice(0, 10)); // preview first 10 rows
        } catch {
          setParsedPreview([]);
        }
      };
      reader.readAsBinaryString(selectedFile);
    }).catch(() => setParsedPreview([]));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      const lowerName = droppedFile.name.toLowerCase();
      if (!lowerName.endsWith('.xlsx') && !lowerName.endsWith('.xls') && !lowerName.endsWith('.csv')) {
        toast.error('Please upload an Excel spreadsheet (.xlsx, .xls) or CSV file');
        return;
      }
      setFile(droppedFile);
      setFileName(droppedFile.name);
      setUploadResult(null);

      import('xlsx').then((XLSX) => {
        const reader = new FileReader();
        reader.onload = (evt) => {
          try {
            const bstr = evt.target?.result;
            const wb = XLSX.read(bstr, { type: 'binary' });
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];
            const data = XLSX.utils.sheet_to_json(ws, { defval: '' });
            setParsedPreview(data.slice(0, 10));
          } catch {
            setParsedPreview([]);
          }
        };
        reader.readAsBinaryString(droppedFile);
      }).catch(() => setParsedPreview([]));
    }
  };

  const handleUploadSubmit = async () => {
    if (!file) {
      toast.error('Please select an Excel or CSV file first');
      return;
    }

    setLoading(true);
    try {
      const res = await bulkUploadParticipants(event._id, file, { markAttendance });
      setUploadResult(res);
      toast.success(res.message || 'Participants uploaded and enrollments updated!');

      // Refresh event count in event store
      try {
        fetchEvents();
      } catch {
        // Safe fallback
      }

      if (onSuccess) {
        onSuccess(res);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to upload participants list');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setFileName('');
    setParsedPreview([]);
    setUploadResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <ResponsiveModal
      open={isOpen && Boolean(event)}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <FileSpreadsheet className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span>Upload Event Participants</span>
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
              event.registrationType === 'admin_upload'
                ? 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                : 'bg-accent/10 text-accent border-accent/30'
            }`}>
              {event.registrationType === 'admin_upload' ? 'Admin Upload' : 'Open Registration'}
            </span>
          </div>
        </div>
      }
      description={`Import official student enrollment list for ${event.title}`}
      dialogClassName="sm:max-w-2xl p-6"
    >
      <div className="space-y-4 pt-2">

          {/* Modal Body */}
          <div className="p-5 sm:p-6 space-y-5 overflow-y-auto custom-scrollbar flex-1">
            {/* Target Event Context Pill */}
            <div className="p-3.5 rounded-2xl bg-canvas border border-separator flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <Calendar size={15} className="text-accent shrink-0" />
                <span className="font-semibold text-label-primary truncate">{event.title}</span>
                <span className="text-label-tertiary hidden sm:inline">•</span>
                <span className="text-label-secondary hidden sm:inline font-mono">
                  {event.enrolledCount || 0} registered • {event.participantsCount || 0} attended
                </span>
              </div>

              <Button
                type="button"
                size="sm"
                variant="secondary"
                onPress={handleDownloadTemplate}
                isDisabled={downloadingTemplate}
                className="shrink-0 text-xs font-semibold shadow-2xs"
                title="Download standard Excel template with sample student records"
              >
                {downloadingTemplate ? (
                  <Spinner size="sm" color="default" />
                ) : (
                  <Download size={13} />
                )}
                <span>Download Sample Template (.xlsx)</span>
              </Button>
            </div>

            {/* Attendance Mode Selector */}
            <div className="space-y-2 p-4 rounded-2xl bg-surface-raised/70 border border-separator">
              <label className="text-xs font-bold uppercase tracking-wider text-label-primary flex items-center gap-1.5">
                <UserCheck size={14} className="text-accent" /> Enrollment & Attendance Target
              </label>
              <p className="text-[11.5px] text-label-secondary leading-relaxed">
                Choose how uploaded students should be registered for this event:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setMarkAttendance(false)}
                  className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between gap-1.5 ${
                    !markAttendance
                      ? 'bg-blue-500/10 border-blue-500 text-label-primary ring-1 ring-blue-500/30'
                      : 'bg-surface border-separator text-label-secondary hover:border-separator-opaque'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Users size={15} className={!markAttendance ? 'text-blue-500' : 'text-label-tertiary'} />
                      <span className="text-xs font-bold text-label-primary">Pre-Registered Students</span>
                    </div>
                    {!markAttendance && <CheckCircle2 size={14} className="text-blue-500" />}
                  </div>
                  <p className="text-[11px] text-label-secondary leading-snug">
                    Enrolls students as registered attendees (attendance pending check-in).
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setMarkAttendance(true)}
                  className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between gap-1.5 ${
                    markAttendance
                      ? 'bg-emerald-500/10 border-emerald-500 text-label-primary ring-1 ring-emerald-500/30'
                      : 'bg-surface border-separator text-label-secondary hover:border-separator-opaque'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <UserCheck size={15} className={markAttendance ? 'text-emerald-500' : 'text-label-tertiary'} />
                      <span className="text-xs font-bold text-label-primary">Attended Participants</span>
                    </div>
                    {markAttendance && <CheckCircle2 size={14} className="text-emerald-500" />}
                  </div>
                  <p className="text-[11px] text-label-secondary leading-snug">
                    Enrolls students and immediately marks attendance verified for certificates and points.
                  </p>
                </button>
              </div>
            </div>

            {/* Drag & Drop File Zone */}
            {!file ? (
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-separator hover:border-accent/60 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all bg-canvas/40 hover:bg-accent/5 group"
              >
                <div className="w-12 h-12 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent group-hover:scale-110 transition-transform">
                  <Upload size={22} />
                </div>
                <div className="text-center space-y-1">
                  <p className="text-xs font-bold text-label-primary">
                    Click to browse or drag and drop your spreadsheet
                  </p>
                  <p className="text-[11px] text-label-secondary">
                    Supports Microsoft Excel (.xlsx, .xls) and CSV (.csv)
                  </p>
                </div>
                <div className="flex items-center gap-2 pt-1 text-[10px] text-label-tertiary font-mono">
                  <span>Columns: Reg No / Roll No</span>
                  <span>•</span>
                  <span>Student Name</span>
                  <span>•</span>
                  <span>Email</span>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-canvas border border-separator space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center shrink-0">
                      <FileSpreadsheet size={18} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-label-primary truncate">{fileName}</p>
                      <p className="text-[11px] text-label-tertiary font-mono">
                        {(file.size / 1024).toFixed(1)} KB • {parsedPreview.length ? `${parsedPreview.length}+ rows detected` : 'Ready to upload'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleReset}
                    className="p-1.5 text-label-tertiary hover:text-destructive hover:bg-destructive/10 rounded-lg transition cursor-pointer"
                    title="Remove file"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Parsed Rows Preview */}
                {parsedPreview.length > 0 && (
                  <div className="space-y-1.5 pt-2 border-t border-separator/60">
                    <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-label-secondary">
                      <span>Roster Preview (First {parsedPreview.length} rows)</span>
                      <span className="font-mono text-[10px] text-accent">Auto-detected Columns</span>
                    </div>

                    <div className="max-h-36 overflow-x-auto overflow-y-auto rounded-xl border border-separator bg-surface text-[11px]">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-separator bg-surface-secondary/70 text-label-secondary font-semibold">
                            <th className="p-2">#</th>
                            <th className="p-2">Identifier / Roll No</th>
                            <th className="p-2">Name</th>
                            <th className="p-2">Email</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-separator/40 font-mono text-[11px]">
                          {parsedPreview.map((row, idx) => {
                            const roll = row['Reg No'] || row['Roll No'] || row['Roll Number'] || row['register_no'] || Object.values(row)[0] || '';
                            const name = row['Student Name'] || row['Name'] || Object.values(row)[1] || '';
                            const email = row['Student Official Email ID'] || row['Email'] || Object.values(row)[2] || '';

                            return (
                              <tr key={idx} className="hover:bg-canvas/50">
                                <td className="p-2 text-label-tertiary">{idx + 1}</td>
                                <td className="p-2 font-bold text-accent">{String(roll)}</td>
                                <td className="p-2 text-label-primary font-sans">{String(name) || '—'}</td>
                                <td className="p-2 text-label-secondary">{String(email) || '—'}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            <input
              type="file"
              ref={fileInputRef}
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="hidden"
            />

            {/* Results Breakdown Banner (After Submission) */}
            {uploadResult && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-2xl bg-surface-raised border border-separator space-y-3"
              >
                <div className="flex items-center gap-2 text-xs font-bold text-label-primary">
                  <CheckCircle2 size={16} className="text-emerald-500" />
                  <span>Upload Summary</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                  <div className="p-2 rounded-xl bg-canvas border border-separator">
                    <p className="text-[10px] text-label-tertiary font-bold uppercase">Enrolled</p>
                    <p className="text-base font-black text-emerald-500 font-mono">
                      +{uploadResult.summary?.newlyEnrolledCount || 0}
                    </p>
                  </div>
                  <div className="p-2 rounded-xl bg-canvas border border-separator">
                    <p className="text-[10px] text-label-tertiary font-bold uppercase">Already Enrolled</p>
                    <p className="text-base font-black text-blue-500 font-mono">
                      {uploadResult.summary?.alreadyEnrolledCount || 0}
                    </p>
                  </div>
                  <div className="p-2 rounded-xl bg-canvas border border-separator">
                    <p className="text-[10px] text-label-tertiary font-bold uppercase">Attended Verified</p>
                    <p className="text-base font-black text-purple-500 font-mono">
                      {uploadResult.summary?.attendanceUpdatedCount || 0}
                    </p>
                  </div>
                  <div className="p-2 rounded-xl bg-canvas border border-separator">
                    <p className="text-[10px] text-label-tertiary font-bold uppercase">Not Found</p>
                    <p className="text-base font-black text-amber-500 font-mono">
                      {uploadResult.summary?.notFoundCount || 0}
                    </p>
                  </div>
                </div>

                {uploadResult.summary?.notFound && uploadResult.summary.notFound.length > 0 && (
                  <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-300 space-y-1">
                    <p className="font-bold">Students not registered on Code Circle:</p>
                    <p className="text-[11px] leading-relaxed">
                      {uploadResult.summary.notFound.map(n => n.rollNo).join(', ')}
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-separator flex items-center justify-between gap-3 shrink-0">
            <Button
              type="button"
              variant="secondary"
              onPress={onClose}
              className="px-4 py-2 rounded-full text-xs font-medium"
            >
              Close
            </Button>

            <div className="flex items-center gap-2">
              {uploadResult && (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onPress={handleReset}
                  className="rounded-full text-xs font-medium flex items-center gap-1.5"
                >
                  <RefreshCw size={13} />
                  <span>Upload Another</span>
                </Button>
              )}

              <Button
                type="button"
                variant="primary"
                color="success"
                onPress={handleUploadSubmit}
                isDisabled={!file || loading}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <Spinner size="sm" color="default" />
                    <span>Processing...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Upload size={14} />
                    <span>Upload & Enroll Students</span>
                  </div>
                )}
              </Button>
            </div>
          </div>
        </div>
      </ResponsiveModal>
  );
};

export default EventBulkUploadModal;
