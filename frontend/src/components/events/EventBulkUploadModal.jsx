import ResponsiveModal from '../ui/ResponsiveModal';
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
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
  RefreshCw,
  Search,
  XCircle,
  Info,
  UserPlus,
  GraduationCap,
  Building2,
  Mail,
  Check,
  Sparkles,
  Plus,
} from 'lucide-react';
import { Button, Spinner } from '@heroui/react';
import toast from 'react-hot-toast';
import useEnrollmentStore from '../../store/useEnrollmentStore';
import api from '../../lib/axios';
import { useDebounce } from '../../hooks/useDebounce';

export const EventBulkUploadModal = ({
  isOpen,
  onClose,
  event,
  onSuccess,
  initialTab = 'bulk',
}) => {
  const { bulkUploadParticipants, downloadParticipantsTemplate, addSingleParticipant } = useEnrollmentStore();

  const [activeMode, setActiveMode] = useState(initialTab || 'bulk');

  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [parsedPreview, setParsedPreview] = useState([]);
  const [markAttendance, setMarkAttendance] = useState(false);
  const [loading, setLoading] = useState(false);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);
  const [exportingResults, setExportingResults] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [resultFilter, setResultFilter] = useState('all');
  const [resultSearch, setResultSearch] = useState('');

  // Single student addition state
  const [singleStudentQuery, setSingleStudentQuery] = useState('');
  const debouncedSingleQuery = useDebounce(singleStudentQuery, 300);
  const [singleSearchResults, setSingleSearchResults] = useState([]);
  const [isSearchingStudents, setIsSearchingStudents] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [manualRollNo, setManualRollNo] = useState('');
  const [manualEmail, setManualEmail] = useState('');
  const [singleAttendanceStatus, setSingleAttendanceStatus] = useState(false);
  const [singleType, setSingleType] = useState('Individual');
  const [singleTeamName, setSingleTeamName] = useState('');
  const [singlePartnerRollNo, setSinglePartnerRollNo] = useState('');
  const [isAddingSingle, setIsAddingSingle] = useState(false);
  const [singleSuccessResult, setSingleSuccessResult] = useState(null);

  // Existing enrollments mapping for quick lookup in search
  const [existingEnrolledUserIds, setExistingEnrolledUserIds] = useState(new Set());
  const [existingEnrollmentMap, setExistingEnrollmentMap] = useState(new Map());

  // Extract all uploaded student records from result (Unconditionally at top-level)
  const allResultStudents = useMemo(() => {
    if (!uploadResult) return [];

    const dataObj = uploadResult.data || uploadResult;

    // 1. Primary arrays provided by backend
    if (Array.isArray(dataObj.details?.allStudents) && dataObj.details.allStudents.length > 0) {
      return dataObj.details.allStudents;
    }
    if (Array.isArray(dataObj.summary?.students) && dataObj.summary.students.length > 0) {
      return dataObj.summary.students;
    }
    if (Array.isArray(dataObj.students) && dataObj.students.length > 0) {
      return dataObj.students;
    }
    if (Array.isArray(uploadResult.details?.allStudents) && uploadResult.details.allStudents.length > 0) {
      return uploadResult.details.allStudents;
    }
    if (Array.isArray(uploadResult.summary?.students) && uploadResult.summary.students.length > 0) {
      return uploadResult.summary.students;
    }
    if (Array.isArray(uploadResult.students) && uploadResult.students.length > 0) {
      return uploadResult.students;
    }

    // 2. Synthesize from categorized details if available
    const details = dataObj.details || uploadResult.details;
    if (details && (details.enrolled || details.alreadyEnrolled || details.notFound || details.duplicates || details.attendanceUpdated)) {
      const combined = [
        ...(Array.isArray(details.enrolled) ? details.enrolled : []),
        ...(Array.isArray(details.alreadyEnrolled) ? details.alreadyEnrolled : []),
        ...(Array.isArray(details.attendanceUpdated) ? details.attendanceUpdated : []),
        ...(Array.isArray(details.duplicates) ? details.duplicates : []),
        ...(Array.isArray(details.notFound) ? details.notFound : []),
      ];
      if (combined.length > 0) {
        return combined.sort((a, b) => (Number(a.row) || 0) - (Number(b.row) || 0));
      }
    }

    // 3. Fallback: build from summary notFound list if legacy format
    const legacy = [];
    const notFoundList = dataObj.summary?.notFound || uploadResult.summary?.notFound || [];
    if (Array.isArray(notFoundList) && notFoundList.length > 0) {
      notFoundList.forEach((n, idx) => {
        legacy.push({
          row: n.row || idx + 1,
          rollNo: n.rollNo || 'N/A',
          name: n.name || 'N/A',
          email: n.email || 'N/A',
          department: n.department || '—',
          status: 'Not Found',
          reason: n.reason || 'Student not registered on Code Circle (account required)',
        });
      });
    }
    return legacy;
  }, [uploadResult]);

  // Compute status counts for filter tabs (Unconditionally at top-level)
  const statusCounts = useMemo(() => {
    const summary = uploadResult?.data?.summary || uploadResult?.summary || {};
    const counts = {
      all: allResultStudents.length,
      enrolled: 0,
      already: 0,
      attended: 0,
      duplicate: 0,
      notFound: 0,
    };

    allResultStudents.forEach((s) => {
      const st = String(s.status || '').toLowerCase();
      if (st.includes('not found')) counts.notFound++;
      else if (st.includes('duplicate')) counts.duplicate++;
      else if (st.includes('attendance verified') || st.includes('verified')) counts.attended++;
      else if (st.includes('already')) counts.already++;
      else if (st.includes('enrolled')) counts.enrolled++;
      else counts.enrolled++;
    });

    if (summary.newlyEnrolledCount != null && counts.enrolled === 0) {
      counts.enrolled = summary.newlyEnrolledCount;
    }
    if (summary.alreadyEnrolledCount != null && counts.already === 0) {
      counts.already = summary.alreadyEnrolledCount;
    }
    if (summary.attendanceUpdatedCount != null && counts.attended === 0) {
      counts.attended = summary.attendanceUpdatedCount;
    }
    if (summary.duplicatesCount != null && counts.duplicate === 0) {
      counts.duplicate = summary.duplicatesCount;
    }
    if (summary.notFoundCount != null && counts.notFound === 0) {
      counts.notFound = summary.notFoundCount;
    }

    return counts;
  }, [allResultStudents, uploadResult]);

  // Filter students based on selected tab and search query (Unconditionally at top-level)
  const filteredResultStudents = useMemo(() => {
    return allResultStudents.filter((s) => {
      const st = String(s.status || '').toLowerCase();
      if (resultFilter === 'enrolled' && (!st.includes('enrolled') || st.includes('already'))) return false;
      if (resultFilter === 'already' && !st.includes('already')) return false;
      if (resultFilter === 'attended' && !st.includes('verified')) return false;
      if (resultFilter === 'duplicate' && !st.includes('duplicate')) return false;
      if (resultFilter === 'not_found' && !st.includes('not found')) return false;

      if (resultSearch.trim()) {
        const q = resultSearch.toLowerCase().trim();
        const matchRoll = s.rollNo?.toLowerCase().includes(q);
        const matchName = s.name?.toLowerCase().includes(q);
        const matchEmail = s.email?.toLowerCase().includes(q);
        const matchReason = s.reason?.toLowerCase().includes(q);
        const matchDept = s.department?.toLowerCase().includes(q);
        return Boolean(matchRoll || matchName || matchEmail || matchReason || matchDept);
      }
      return true;
    });
  }, [allResultStudents, resultFilter, resultSearch]);

  const handleDownloadTemplate = async () => {
    if (!event?._id) return;
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
        XLSX.writeFile(wb, `${(event?.title || 'event').replace(/[^a-zA-Z0-9]/g, '_')}_participants_sample_template.xlsx`);
        toast.success('Sample template generated!');
      } catch (err) {
        toast.error('Failed to download template: ' + (err.message || 'Error'));
      }
    } finally {
      setDownloadingTemplate(false);
    }
  };

  const handleExportResults = async () => {
    if (!uploadResult) return;
    if (allResultStudents.length === 0) {
      toast.error('No student records to export');
      return;
    }

    setExportingResults(true);
    try {
      const exportData = allResultStudents.map((s, idx) => ({
        '#': idx + 1,
        'Original Row': s.row || idx + 2,
        'Register No / Roll No': s.rollNo || '',
        'Student Name': s.name || '',
        'Email': s.email || '',
        'Department': s.department || '',
        'Upload Status': s.status || '',
        'Reason': s.reason || '',
      }));

      const XLSX = await import('xlsx');
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Upload Results');
      XLSX.writeFile(
        wb,
        `${(event?.title || 'event').replace(/[^a-zA-Z0-9]/g, '_')}_upload_results_${new Date().toISOString().slice(0, 10)}.xlsx`
      );
      toast.success('Upload results report exported successfully!');
    } catch (err) {
      toast.error('Failed to export results: ' + (err.message || 'Error'));
    } finally {
      setExportingResults(false);
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
    if (!event?._id) return;

    setLoading(true);
    try {
      const res = await bulkUploadParticipants(event._id, file, { markAttendance });
      setUploadResult(res);
      setResultFilter('all');
      setResultSearch('');
      toast.success(res.message || 'Participants uploaded and enrollments updated!');

      if (onSuccess) {
        onSuccess(res);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to upload participants list');
    } finally {
      setLoading(false);
    }
  };

  // Sync activeMode on modal open or initialTab change
  useEffect(() => {
    if (isOpen) {
      setActiveMode(initialTab || 'bulk');
    }
  }, [isOpen, initialTab]);

  // Fetch existing enrollments for quick lookup in search
  useEffect(() => {
    if (!isOpen || !event?._id) return;
    const fetchExisting = async () => {
      try {
        const res = await api.get(`/enrollments/event/${event._id}`);
        const list = res.data?.data || res.data || [];
        const ids = new Set();
        const map = new Map();
        list.forEach((enr) => {
          if (enr.enrolledBy?._id) {
            ids.add(enr.enrolledBy._id);
            map.set(enr.enrolledBy._id, enr);
          }
          if (Array.isArray(enr.members)) {
            enr.members.forEach((m) => {
              if (m?._id) {
                ids.add(m._id);
                map.set(m._id, enr);
              }
            });
          }
        });
        setExistingEnrolledUserIds(ids);
        setExistingEnrollmentMap(map);
      } catch {
        // Safe fallback
      }
    };
    fetchExisting();
  }, [isOpen, event?._id]);

  // Debounced search query for single student
  useEffect(() => {
    if (!isOpen || activeMode !== 'single') return;
    if (!debouncedSingleQuery.trim()) {
      setSingleSearchResults([]);
      setIsSearchingStudents(false);
      return;
    }

    const search = async () => {
      setIsSearchingStudents(true);
      try {
        const res = await api.get(`/users?search=${encodeURIComponent(debouncedSingleQuery.trim())}&limit=10`);
        const list = res.data?.data?.users || res.data?.users || [];
        setSingleSearchResults(list);
      } catch (err) {
        console.error('Error searching students:', err);
        setSingleSearchResults([]);
      } finally {
        setIsSearchingStudents(false);
      }
    };
    search();
  }, [isOpen, activeMode, debouncedSingleQuery]);

  const handleSelectStudent = (student) => {
    setSelectedStudent(student);
    setManualRollNo(student.rollNo || '');
    setManualEmail(student.email || '');
    setSingleStudentQuery(student.name ? `${student.name} (${student.rollNo || student.email})` : student.rollNo || student.email);
    setSingleSearchResults([]);
  };

  const handleResetSingle = () => {
    setSelectedStudent(null);
    setSingleStudentQuery('');
    setManualRollNo('');
    setManualEmail('');
    setSingleSearchResults([]);
    setSingleSuccessResult(null);
    setSingleTeamName('');
    setSinglePartnerRollNo('');
  };

  const handleAddSingleStudent = async (e) => {
    if (e) e.preventDefault();
    if (!event?._id) return;

    const studentIdentifier = selectedStudent?._id || manualRollNo.trim() || manualEmail.trim() || singleStudentQuery.trim();
    if (!studentIdentifier) {
      toast.error('Please search and select a student, or enter a Roll Number / Email');
      return;
    }

    setIsAddingSingle(true);
    setSingleSuccessResult(null);
    try {
      const payload = {
        studentId: selectedStudent?._id,
        rollNo: manualRollNo.trim() || undefined,
        email: manualEmail.trim() || undefined,
        identifier: !selectedStudent?._id ? studentIdentifier : undefined,
        attendanceStatus: singleAttendanceStatus,
        type: singleType,
        teamName: (singleType === 'Team' || singleType === 'Duo') ? singleTeamName : undefined,
        members: singleType === 'Duo' && singlePartnerRollNo ? [singlePartnerRollNo.trim()] : [],
      };

      const res = await addSingleParticipant(event._id, payload);
      toast.success(res.message || 'Student added to event successfully!');
      setSingleSuccessResult(res);

      if (res.student?._id) {
        setExistingEnrolledUserIds((prev) => new Set(prev).add(res.student._id));
        setExistingEnrollmentMap((prev) => new Map(prev).set(res.student._id, res.enrollment || { attendanceStatus: singleAttendanceStatus }));
      }

      if (onSuccess) {
        onSuccess(res);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to add student to event');
    } finally {
      setIsAddingSingle(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setFileName('');
    setParsedPreview([]);
    setUploadResult(null);
    setResultFilter('all');
    setResultSearch('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    handleResetSingle();
  };

  const handleModalClose = () => {
    handleReset();
    if (onClose) onClose();
  };

  // Reset modal state when closed from parent
  useEffect(() => {
    if (!isOpen) {
      handleReset();
    }
  }, [isOpen]);

  const getStatusBadge = (status) => {
    const st = String(status || '').toLowerCase();
    if (st.includes('not found')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/25 whitespace-nowrap">
          <XCircle size={11} className="text-rose-500 shrink-0" />
          <span>Not Found</span>
        </span>
      );
    }
    if (st.includes('duplicate')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25 whitespace-nowrap">
          <AlertCircle size={11} className="text-amber-500 shrink-0" />
          <span>Duplicate</span>
        </span>
      );
    }
    if (st.includes('attendance verified') || st.includes('verified')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/25 whitespace-nowrap">
          <UserCheck size={11} className="text-purple-500 shrink-0" />
          <span>Attendance Verified</span>
        </span>
      );
    }
    if (st.includes('already')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/25 whitespace-nowrap">
          <Users size={11} className="text-blue-500 shrink-0" />
          <span>Already Enrolled</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 whitespace-nowrap">
        <CheckCircle2 size={11} className="text-emerald-500 shrink-0" />
        <span>{status || 'Enrolled'}</span>
      </span>
    );
  };

  const getReasonPill = (status, reason) => {
    const st = String(status || '').toLowerCase();
    const isError = st.includes('not found');
    const isDup = st.includes('duplicate');
    const isAttended = st.includes('verified');
    const isSuccess = st.includes('enrolled') && !st.includes('already');

    const colorClass = isError
      ? 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20'
      : isDup
      ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20'
      : isAttended
      ? 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20'
      : isSuccess
      ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20'
      : 'bg-surface text-label-secondary border-separator';

    return (
      <span className={`inline-flex items-start gap-1.5 px-2.5 py-1 rounded-xl text-[11px] leading-tight border font-medium ${colorClass}`}>
        <Info size={12} className="shrink-0 mt-0.5 opacity-80" />
        <span className="break-words">{reason || 'Processed'}</span>
      </span>
    );
  };

  // Safe Guard: Do NOT early-return before hooks! Return null only here after all hooks have executed.
  if (!isOpen || !event) return null;

  return (
    <ResponsiveModal
      open={isOpen && Boolean(event)}
      onOpenChange={(open) => {
        if (!open) handleModalClose();
      }}
      onClose={handleModalClose}
      title={
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
            uploadResult
              ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
              : activeMode === 'single'
              ? 'bg-blue-500/10 text-blue-500'
              : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
          }`}>
            {uploadResult ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : activeMode === 'single' ? (
              <UserPlus className="w-4 h-4" />
            ) : (
              <FileSpreadsheet className="w-4 h-4" />
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span>
              {uploadResult
                ? 'Participant Upload Report'
                : activeMode === 'single'
                ? 'Add Event Participant'
                : 'Upload Event Participants'}
            </span>
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
              event?.registrationType === 'admin_upload'
                ? 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                : 'bg-accent/10 text-accent border-accent/30'
            }`}>
              {event?.registrationType === 'admin_upload' ? 'Admin Upload' : 'Open Registration'}
            </span>
          </div>
        </div>
      }
      description={
        uploadResult
          ? `Detailed review of students uploaded for ${event?.title || 'event'}`
          : activeMode === 'single'
          ? `Enroll an individual student directly into ${event?.title || 'event'}`
          : `Import official student enrollment list for ${event?.title || 'event'}`
      }
      dialogClassName={`p-6 transition-all duration-300 ${uploadResult ? 'sm:max-w-4xl max-h-[92vh]' : 'sm:max-w-2xl'}`}
    >
      <div className="space-y-4 pt-2">
        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto custom-scrollbar flex-1 max-h-[72vh]">
          {/* Mode Switcher Tabs (Bulk Upload vs Add Single Student) */}
          {!uploadResult && (
            <div className="flex items-center p-1 rounded-2xl bg-canvas border border-separator">
              <button
                type="button"
                onClick={() => {
                  setActiveMode('bulk');
                  setSingleSuccessResult(null);
                }}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                  activeMode === 'bulk'
                    ? 'bg-surface text-label-primary shadow-xs'
                    : 'text-label-tertiary hover:text-label-primary'
                }`}
              >
                <FileSpreadsheet size={14} className={activeMode === 'bulk' ? 'text-emerald-500' : ''} />
                <span>Bulk Upload (Excel / CSV)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveMode('single');
                  setSingleSuccessResult(null);
                }}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                  activeMode === 'single'
                    ? 'bg-surface text-label-primary shadow-xs'
                    : 'text-label-tertiary hover:text-label-primary'
                }`}
              >
                <UserPlus size={14} className={activeMode === 'single' ? 'text-blue-500' : ''} />
                <span>Add Single Student</span>
              </button>
            </div>
          )}

          {/* Target Event Context Pill */}
          <div className="p-3.5 rounded-2xl bg-canvas border border-separator flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <Calendar size={15} className="text-accent shrink-0" />
              <span className="font-semibold text-label-primary truncate">{event?.title}</span>
              <span className="text-label-tertiary hidden sm:inline">•</span>
              <span className="text-label-secondary hidden sm:inline font-mono">
                {event?.enrolledCount || 0} registered • {event?.participantsCount || 0} attended
              </span>
            </div>

            {!uploadResult && activeMode === 'bulk' && (
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
            )}
          </div>

          {/* VIEW MODE 1: BULK FILE SELECTION & CONFIGURATION (Before upload) */}
          {!uploadResult && activeMode === 'bulk' && (
            <>
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
            </>
          )}

          {/* VIEW MODE 2: ADD SINGLE STUDENT FORM (Before upload) */}
          {!uploadResult && activeMode === 'single' && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* If student successfully added, show rich confirmation card with option to add another */}
              {singleSuccessResult ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                      <CheckCircle2 size={22} />
                    </div>
                    <div className="space-y-1 flex-1">
                      <h4 className="text-sm font-bold text-label-primary">
                        Student Successfully Enrolled!
                      </h4>
                      <p className="text-xs text-emerald-300">
                        {singleSuccessResult.message || `Student has been enrolled into ${event?.title}.`}
                      </p>
                    </div>
                  </div>

                  {/* Student details card */}
                  {singleSuccessResult.student && (
                    <div className="p-3.5 rounded-xl bg-surface/80 border border-separator space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-label-primary text-sm">
                          {singleSuccessResult.student.name}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          {singleSuccessResult.enrollment?.attendanceStatus ? 'Attended & Verified' : 'Registered Attendee'}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-label-secondary font-mono text-[11px]">
                        <div>Roll No: <span className="text-label-primary font-semibold">{singleSuccessResult.student.rollNo || 'N/A'}</span></div>
                        <div>Dept: <span className="text-label-primary font-semibold">{singleSuccessResult.student.department || '—'}</span></div>
                        <div className="col-span-2 truncate">Email: <span className="text-label-primary">{singleSuccessResult.student.email}</span></div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-2">
                    <Button
                      size="sm"
                      color="primary"
                      variant="solid"
                      onPress={handleResetSingle}
                      className="text-xs font-bold rounded-xl"
                      startContent={<Plus size={14} />}
                    >
                      Add Another Student
                    </Button>
                    <Button
                      size="sm"
                      variant="flat"
                      onPress={handleModalClose}
                      className="text-xs font-semibold rounded-xl"
                    >
                      Done
                    </Button>
                  </div>
                </motion.div>
              ) : (
                <>
                  {/* Step 1: Student Search / Selection */}
                  <div className="space-y-2 p-4 rounded-2xl bg-surface-raised/70 border border-separator">
                    <label className="text-xs font-bold uppercase tracking-wider text-label-primary flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Search size={14} className="text-accent" /> Find & Select Student
                      </span>
                      {selectedStudent && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedStudent(null);
                            setSingleStudentQuery('');
                          }}
                          className="text-[11px] font-medium text-rose-400 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <X size={12} /> Clear Selection
                        </button>
                      )}
                    </label>

                    {/* If a student is already selected */}
                    {selectedStudent ? (
                      <div className="p-3.5 rounded-xl bg-accent/10 border border-accent/25 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-accent/20 text-accent font-bold flex items-center justify-center text-sm shrink-0">
                            {selectedStudent.name?.charAt(0)?.toUpperCase() || 'S'}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-label-primary truncate">{selectedStudent.name}</span>
                              <span className="px-2 py-0.2 rounded-md font-mono text-[10px] bg-surface text-label-secondary border border-separator">
                                {selectedStudent.rollNo}
                              </span>
                            </div>
                            <div className="text-[11px] text-label-secondary truncate flex items-center gap-2 mt-0.5">
                              <span>{selectedStudent.email}</span>
                              {selectedStudent.department && (
                                <>
                                  <span>•</span>
                                  <span>{selectedStudent.department}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="shrink-0 flex items-center gap-2">
                          {existingEnrolledUserIds.has(selectedStudent._id) ? (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                              Already Enrolled
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                              <Check size={11} /> Ready to Add
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      /* Search input box */
                      <div className="relative">
                        <div className="relative flex items-center">
                          <Search size={15} className="absolute left-3.5 text-label-tertiary pointer-events-none" />
                          <input
                            type="text"
                            value={singleStudentQuery}
                            onChange={(e) => {
                              setSingleStudentQuery(e.target.value);
                              setManualRollNo(e.target.value);
                            }}
                            placeholder="Search by Roll Number (e.g. 7376221CS101), Email, or Name..."
                            className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-canvas border border-separator text-xs text-label-primary placeholder:text-label-tertiary focus:outline-hidden focus:border-accent transition font-mono"
                          />
                          {isSearchingStudents ? (
                            <Spinner size="sm" className="absolute right-3.5" />
                          ) : singleStudentQuery ? (
                            <button
                              type="button"
                              onClick={() => {
                                setSingleStudentQuery('');
                                setSingleSearchResults([]);
                              }}
                              className="absolute right-3.5 text-label-tertiary hover:text-label-primary"
                            >
                              <X size={14} />
                            </button>
                          ) : null}
                        </div>

                        {/* Live search results dropdown */}
                        {singleSearchResults.length > 0 && (
                          <div className="absolute top-full left-0 right-0 mt-1 max-h-56 overflow-y-auto custom-scrollbar rounded-xl bg-surface border border-separator shadow-2xl z-50 divide-y divide-separator">
                            {singleSearchResults.map((student) => {
                              const isEnrolledAlready = existingEnrolledUserIds.has(student._id);
                              const existingRecord = existingEnrollmentMap.get(student._id);
                              return (
                                <button
                                  key={student._id}
                                  type="button"
                                  onClick={() => handleSelectStudent(student)}
                                  className="w-full p-3 text-left hover:bg-surface-secondary/70 transition flex items-center justify-between gap-3 cursor-pointer group"
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="w-8 h-8 rounded-lg bg-purple-500/15 text-purple-400 font-bold flex items-center justify-center text-xs shrink-0">
                                      {student.name?.charAt(0)?.toUpperCase() || 'S'}
                                    </div>
                                    <div className="min-w-0">
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className="font-bold text-xs text-label-primary group-hover:text-accent transition-colors truncate">
                                          {student.name}
                                        </span>
                                        {student.rollNo && (
                                          <span className="font-mono text-[10px] text-label-secondary px-1.5 py-0.2 rounded bg-canvas border border-separator">
                                            {student.rollNo}
                                          </span>
                                        )}
                                      </div>
                                      <div className="text-[11px] text-label-tertiary truncate">
                                        {student.email} {student.department ? `• ${student.department}` : ''}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="shrink-0">
                                    {isEnrolledAlready ? (
                                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/25">
                                        {existingRecord?.attendanceStatus ? 'Attended' : 'Registered'}
                                      </span>
                                    ) : (
                                      <span className="text-[11px] font-semibold text-accent opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                        Select <Check size={12} />
                                      </span>
                                    )}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {/* No match helper */}
                        {!isSearchingStudents && debouncedSingleQuery.trim().length >= 3 && singleSearchResults.length === 0 && !selectedStudent && (
                          <div className="p-3 mt-1 rounded-xl bg-canvas border border-separator text-xs text-label-secondary flex items-center justify-between">
                            <span>No student profile matched. You can still proceed by entering Roll No / Email directly below.</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Manual inputs fallback / override */}
                    {!selectedStudent && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                        <div>
                          <label className="text-[11px] font-medium text-label-secondary block mb-1">
                            Roll Number (Optional if searching by name)
                          </label>
                          <input
                            type="text"
                            value={manualRollNo}
                            onChange={(e) => setManualRollNo(e.target.value.toUpperCase())}
                            placeholder="e.g. 7376221CS101"
                            className="w-full px-3 py-2 rounded-xl bg-canvas border border-separator text-xs text-label-primary font-mono placeholder:text-label-tertiary focus:outline-hidden focus:border-accent"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-medium text-label-secondary block mb-1">
                            Email Address (Optional if searching by roll no)
                          </label>
                          <input
                            type="email"
                            value={manualEmail}
                            onChange={(e) => setManualEmail(e.target.value.toLowerCase())}
                            placeholder="e.g. student@bitsathy.ac.in"
                            className="w-full px-3 py-2 rounded-xl bg-canvas border border-separator text-xs text-label-primary placeholder:text-label-tertiary focus:outline-hidden focus:border-accent"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Step 2: Attendance & Participation Target */}
                  <div className="space-y-2 p-4 rounded-2xl bg-surface-raised/70 border border-separator">
                    <label className="text-xs font-bold uppercase tracking-wider text-label-primary flex items-center gap-1.5">
                      <UserCheck size={14} className="text-accent" /> Participation & Attendance Status
                    </label>
                    <p className="text-[11.5px] text-label-secondary leading-relaxed">
                      Choose whether the student is being pre-registered or marked verified present:
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <button
                        type="button"
                        onClick={() => setSingleAttendanceStatus(false)}
                        className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between gap-1.5 ${
                          !singleAttendanceStatus
                            ? 'bg-blue-500/10 border-blue-500 text-label-primary ring-1 ring-blue-500/30'
                            : 'bg-surface border-separator text-label-secondary hover:border-separator-opaque'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <Users size={15} className={!singleAttendanceStatus ? 'text-blue-500' : 'text-label-tertiary'} />
                            <span className="text-xs font-bold text-label-primary">Pre-Registered Attendee</span>
                          </div>
                          {!singleAttendanceStatus && <CheckCircle2 size={14} className="text-blue-500" />}
                        </div>
                        <p className="text-[11px] text-label-secondary leading-snug">
                          Enrolls student into the event as registered (attendance pending).
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSingleAttendanceStatus(true)}
                        className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between gap-1.5 ${
                          singleAttendanceStatus
                            ? 'bg-emerald-500/10 border-emerald-500 text-label-primary ring-1 ring-emerald-500/30'
                            : 'bg-surface border-separator text-label-secondary hover:border-separator-opaque'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <UserCheck size={15} className={singleAttendanceStatus ? 'text-emerald-500' : 'text-label-tertiary'} />
                            <span className="text-xs font-bold text-label-primary">Attended Participant (Present)</span>
                          </div>
                          {singleAttendanceStatus && <CheckCircle2 size={14} className="text-emerald-500" />}
                        </div>
                        <p className="text-[11px] text-label-secondary leading-snug">
                          Marks verified attendance directly for points and certificate eligibility.
                        </p>
                      </button>
                    </div>
                  </div>

                  {/* Step 3: Event Format Details (if Duo or Team) */}
                  {(event.format === 'Duo' || event.format === 'Team' || event.type === 'Team') && (
                    <div className="space-y-3 p-4 rounded-2xl bg-surface-raised/70 border border-separator">
                      <label className="text-xs font-bold uppercase tracking-wider text-label-primary flex items-center gap-1.5">
                        <Users size={14} className="text-accent" /> {event.format === 'Duo' ? 'Duo Pair Configuration' : 'Team Configuration'}
                      </label>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] font-medium text-label-secondary block mb-1">
                            {event.format === 'Duo' ? 'Duo Pair Name' : 'Team Name'}
                          </label>
                          <input
                            type="text"
                            value={singleTeamName}
                            onChange={(e) => setSingleTeamName(e.target.value)}
                            placeholder={event.format === 'Duo' ? 'e.g. Code Warriors Duo' : 'e.g. Alpha Squad'}
                            className="w-full px-3 py-2 rounded-xl bg-canvas border border-separator text-xs text-label-primary placeholder:text-label-tertiary focus:outline-hidden focus:border-accent"
                          />
                        </div>

                        {event.format === 'Duo' && (
                          <div>
                            <label className="text-[11px] font-medium text-label-secondary block mb-1">
                              Partner Roll Number
                            </label>
                            <input
                              type="text"
                              value={singlePartnerRollNo}
                              onChange={(e) => setSinglePartnerRollNo(e.target.value.toUpperCase())}
                              placeholder="e.g. 7376221CS102"
                              className="w-full px-3 py-2 rounded-xl bg-canvas border border-separator text-xs text-label-primary font-mono placeholder:text-label-tertiary focus:outline-hidden focus:border-accent"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          )}

          {/* VIEW MODE 2: DETAILED STUDENTS LIST WITH REASONS (After upload) */}
          {uploadResult && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* Top Banner with Upload Message */}
              <div className="p-4 rounded-2xl bg-surface-raised border border-separator space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-label-primary">
                        Upload Processing Complete
                      </h4>
                      <p className="text-[11.5px] text-label-secondary mt-0.5">
                        {uploadResult.message || 'Participants uploaded and enrollments updated successfully.'}
                      </p>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant="bordered"
                    onPress={handleExportResults}
                    isLoading={exportingResults}
                    isDisabled={exportingResults || allResultStudents.length === 0}
                    startContent={!exportingResults ? <Download size={13} /> : undefined}
                    className="shrink-0 text-xs font-semibold rounded-xl border-separator hover:bg-surface-secondary"
                    title="Export complete upload report with reasons to Excel"
                  >
                    Export Report (.xlsx)
                  </Button>
                </div>

                {/* 5-Card Metric Breakdown */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs pt-1">
                  <button
                    type="button"
                    onClick={() => setResultFilter('enrolled')}
                    className={`p-2.5 rounded-xl border transition text-center cursor-pointer ${
                      resultFilter === 'enrolled'
                        ? 'bg-emerald-500/15 border-emerald-500 ring-1 ring-emerald-500/30'
                        : 'bg-canvas border-separator hover:border-separator-opaque'
                    }`}
                  >
                    <p className="text-[10px] text-label-tertiary font-bold uppercase tracking-wider">Newly Enrolled</p>
                    <p className="text-lg font-black text-emerald-500 font-mono mt-0.5">
                      +{statusCounts.enrolled}
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setResultFilter('already')}
                    className={`p-2.5 rounded-xl border transition text-center cursor-pointer ${
                      resultFilter === 'already'
                        ? 'bg-blue-500/15 border-blue-500 ring-1 ring-blue-500/30'
                        : 'bg-canvas border-separator hover:border-separator-opaque'
                    }`}
                  >
                    <p className="text-[10px] text-label-tertiary font-bold uppercase tracking-wider">Already Enrolled</p>
                    <p className="text-lg font-black text-blue-500 font-mono mt-0.5">
                      {statusCounts.already}
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setResultFilter('attended')}
                    className={`p-2.5 rounded-xl border transition text-center cursor-pointer ${
                      resultFilter === 'attended'
                        ? 'bg-purple-500/15 border-purple-500 ring-1 ring-purple-500/30'
                        : 'bg-canvas border-separator hover:border-separator-opaque'
                    }`}
                  >
                    <p className="text-[10px] text-label-tertiary font-bold uppercase tracking-wider">Attendance Verified</p>
                    <p className="text-lg font-black text-purple-500 font-mono mt-0.5">
                      {statusCounts.attended}
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setResultFilter('duplicate')}
                    className={`p-2.5 rounded-xl border transition text-center cursor-pointer ${
                      resultFilter === 'duplicate'
                        ? 'bg-amber-500/15 border-amber-500 ring-1 ring-amber-500/30'
                        : 'bg-canvas border-separator hover:border-separator-opaque'
                    }`}
                  >
                    <p className="text-[10px] text-label-tertiary font-bold uppercase tracking-wider">Duplicates</p>
                    <p className="text-lg font-black text-amber-500 font-mono mt-0.5">
                      {statusCounts.duplicate}
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setResultFilter('not_found')}
                    className={`p-2.5 rounded-xl border transition text-center cursor-pointer col-span-2 sm:col-span-1 ${
                      resultFilter === 'not_found'
                        ? 'bg-rose-500/15 border-rose-500 ring-1 ring-rose-500/30'
                        : 'bg-canvas border-separator hover:border-separator-opaque'
                    }`}
                  >
                    <p className="text-[10px] text-label-tertiary font-bold uppercase tracking-wider">Not Found</p>
                    <p className="text-lg font-black text-rose-500 font-mono mt-0.5">
                      {statusCounts.notFound}
                    </p>
                  </button>
                </div>
              </div>

              {/* Search & Filter Toolbar */}
              <div className="flex flex-col overflow-auto sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-1">
                {/* Search Bar */}
                <div className="relative flex-1 shrink-0">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-label-tertiary" />
                  <input
                    type="text"
                    value={resultSearch}
                    onChange={(e) => setResultSearch(e.target.value)}
                    placeholder="Search students by roll number, name, department, or reason..."
                    className="w-36! shrink-0 pl-9 pr-8 py-2 rounded-xl bg-canvas border border-separator text-xs text-label-primary placeholder-label-tertiary focus:outline-none focus:border-accent/60 transition"
                  />
                  {resultSearch && (
                    <button
                      type="button"
                      onClick={() => setResultSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-label-tertiary hover:text-label-primary p-0.5 rounded cursor-pointer"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>

                {/* Filter Chips */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 shrink-0 text-xs">
                  {[
                    { id: 'all', label: 'All', count: statusCounts.all },
                    { id: 'enrolled', label: 'Enrolled', count: statusCounts.enrolled },
                    { id: 'already', label: 'Already Enrolled', count: statusCounts.already },
                    { id: 'attended', label: 'Attendance Verified', count: statusCounts.attended },
                    { id: 'duplicate', label: 'Duplicates', count: statusCounts.duplicate },
                    { id: 'not_found', label: 'Not Found', count: statusCounts.notFound },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setResultFilter(tab.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                        resultFilter === tab.id
                          ? 'bg-accent text-white shadow-xs'
                          : 'bg-surface border border-separator text-label-secondary hover:text-label-primary hover:bg-surface-secondary'
                      }`}
                    >
                      <span>{tab.label}</span>
                      <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                        resultFilter === tab.id ? 'bg-white/20 text-white' : 'bg-surface-raised text-label-tertiary'
                      }`}>
                        {tab.count}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Detailed Student Roster Table with Status & Reason */}
              <div className="rounded-2xl border border-separator bg-canvas/60 overflow-hidden shadow-xs">
                <div className="max-h-80 overflow-y-auto overflow-x-auto custom-scrollbar">
                  {filteredResultStudents.length === 0 ? (
                    <div className="p-8 text-center space-y-2">
                      <Users size={28} className="mx-auto text-label-tertiary/40" />
                      <p className="text-xs font-bold text-label-primary">No students match this filter</p>
                      <p className="text-[11px] text-label-secondary">
                        Try resetting your search query or switching to "All" view.
                      </p>
                    </div>
                  ) : (
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="sticky top-0 z-10 bg-surface-secondary/95 backdrop-blur-md border-b border-separator text-label-secondary font-bold text-[11px] uppercase tracking-wider">
                        <tr>
                          <th className="py-2.5 px-3 w-12 text-center">Row</th>
                          <th className="py-2.5 px-3 min-w-[160px]">Student Details</th>
                          <th className="py-2.5 px-3 min-w-[90px]">Department</th>
                          <th className="py-2.5 px-3 min-w-[130px]">Upload Status</th>
                          <th className="py-2.5 px-3 min-w-[260px]">Reason & Outcome</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-separator/40 font-sans">
                        {filteredResultStudents.map((student, idx) => (
                          <tr
                            key={idx}
                            className={`hover:bg-surface-secondary/40 transition-colors ${
                              String(student.status || '').toLowerCase().includes('not found')
                                ? 'bg-rose-500/[0.02]'
                                : String(student.status || '').toLowerCase().includes('duplicate')
                                ? 'bg-amber-500/[0.02]'
                                : ''
                            }`}
                          >
                            <td className="py-2.5 px-3 text-center text-label-tertiary font-mono text-[11px]">
                              {student.row || idx + 1}
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="space-y-0.5">
                                <p className="font-mono font-bold text-accent text-xs">
                                  {student.rollNo}
                                </p>
                                <p className="font-semibold text-label-primary text-[11.5px] leading-tight">
                                  {student.name && student.name !== 'N/A' ? student.name : '—'}
                                </p>
                                {student.email && student.email !== 'N/A' && (
                                  <p className="text-[10.5px] text-label-tertiary truncate max-w-[220px]">
                                    {student.email}
                                  </p>
                                )}
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-label-secondary text-[11px]">
                              {student.department || '—'}
                            </td>
                            <td className="py-2.5 px-3">
                              {getStatusBadge(student.status)}
                            </td>
                            <td className="py-2.5 px-3">
                              {getReasonPill(student.status, student.reason)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* Table Footer with Count Summary */}
                <div className="p-2.5 bg-surface-secondary/60 border-t border-separator/60 flex items-center justify-between text-[11px] text-label-secondary px-4">
                  <span>
                    Showing <strong className="text-label-primary">{filteredResultStudents.length}</strong> of{' '}
                    <strong className="text-label-primary">{allResultStudents.length}</strong> student records
                  </span>
                  {(uploadResult.summary?.totalRowsInFile || uploadResult.data?.summary?.totalRowsInFile) && (
                    <span className="text-label-tertiary">
                      Total spreadsheet rows: {uploadResult.summary?.totalRowsInFile || uploadResult.data?.summary?.totalRowsInFile}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-separator flex items-center justify-between gap-3 shrink-0">
          <Button
            type="button"
            variant="secondary"
            onPress={handleModalClose}
            className="px-4 py-2 rounded-full text-xs font-medium cursor-pointer"
          >
            {uploadResult || singleSuccessResult ? 'Done / Close' : 'Cancel'}
          </Button>

          <div className="flex items-center gap-2">
            {uploadResult ? (
              <>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onPress={handleReset}
                  className="rounded-full text-xs font-medium flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw size={13} />
                  <span>Upload Another Spreadsheet</span>
                </Button>

                <Button
                  type="button"
                  variant="primary"
                  color="primary"
                  onPress={handleModalClose}
                  className="px-5 py-2 rounded-full text-xs font-semibold shadow cursor-pointer"
                >
                  Finished Reviewing
                </Button>
              </>
            ) : activeMode === 'single' ? (
              singleSuccessResult ? (
                <Button
                  type="button"
                  variant="primary"
                  color="primary"
                  onPress={handleResetSingle}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow cursor-pointer"
                >
                  <Plus size={14} />
                  <span>Add Another Student</span>
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="primary"
                  color="primary"
                  onClick={handleAddSingleStudent}
                  isLoading={isAddingSingle}
                  isDisabled={isAddingSingle || (!selectedStudent && !manualRollNo.trim() && !manualEmail.trim() && !singleStudentQuery.trim())}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow cursor-pointer"
                >
                  {!isAddingSingle && <UserPlus size={14} />}
                  <span>Enroll Student</span>
                </Button>
              )
            ) : (
              <Button
                type="button"
                variant="primary"
                color="success"
                onPress={handleUploadSubmit}
                isLoading={loading}
                isDisabled={!file || loading}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow cursor-pointer"
              >
                {!loading && <Upload size={14} />}
                <span>Upload & Enroll Students</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </ResponsiveModal>
  );
};

export default EventBulkUploadModal;
