import React, { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface ExportReportButtonProps {
  className?: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

/**
 * ExportReportButton
 * Apple-style minimal ghost button for streaming CSV export of student tracking data.
 * Executes stream download to Blob and triggers instant browser download with zero UI freezes.
 */
export const ExportReportButton: React.FC<ExportReportButtonProps> = ({
  className = '',
  onSuccess,
  onError,
}) => {
  const [isExporting, setIsExporting] = useState(false);

  const handleDownload = async () => {
    if (isExporting) return;
    setIsExporting(true);

    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
      const exportUrl = `${baseUrl}/admin/tracking/export`;
      const token = localStorage.getItem('token');

      const response = await fetch(exportUrl, {
        method: 'GET',
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
          Accept: 'text/csv',
        },
      });

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('SuperAdmin clearance required to export progress reports');
        }
        throw new Error(`Export failed with HTTP status ${response.status}`);
      }

      // Convert streamed response to Blob
      const blob = await response.blob();

      // Create a temporary object URL and trigger programmatic click
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `student_progress_report_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();

      // Clean up DOM and URL object to prevent memory leaks
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      toast.success('Student tracking report downloaded successfully');
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error('Failed to export student tracking CSV:', err);
      toast.error(err.message || 'Failed to export CSV report');
      if (onError) onError(err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={isExporting}
      aria-label="Export Student Tracking CSV Report"
      className={`group inline-flex items-center gap-2 bg-transparent hover:bg-black/5 dark:hover:bg-white/5 text-blue-500 rounded-full px-4 py-2 text-sm font-medium transition-colors disabled:opacity-60 disabled:pointer-events-none ${className}`}
    >
      {isExporting ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
          <span>Exporting...</span>
        </>
      ) : (
        <>
          <Download className="w-4 h-4 text-blue-500 transition-transform group-hover:-translate-y-0.5" />
          <span>Export Report</span>
        </>
      )}
    </button>
  );
};

export default ExportReportButton;
