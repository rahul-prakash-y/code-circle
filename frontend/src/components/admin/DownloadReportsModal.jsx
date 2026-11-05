import ResponsiveModal from '../ui/ResponsiveModal';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Download, FileText, Table, Users, Calendar, CheckSquare, BarChart3, Loader2, Sparkles } from 'lucide-react';
import useMetricsStore from '../../store/useMetricsStore';
import toast from 'react-hot-toast';

const DownloadReportsModal = ({ isOpen, onClose }) => {
  const { downloadReport, exporting } = useMetricsStore();
  const [selectedType, setSelectedType] = useState('summary');
  const [selectedFormat, setSelectedFormat] = useState('pdf');

  if (!isOpen) return null;

  const reportTypes = [
    {
      id: 'summary',
      title: 'Executive Club Metrics Summary',
      description: 'Aggregated analytics covering total users, active/total events, assessment levels, and health rates.',
      icon: BarChart3,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    },
    {
      id: 'users',
      title: 'Users & Members Directory',
      description: 'Complete roster of registered students, faculty, and committee members with roles and departments.',
      icon: Users,
      color: 'text-accent-muted bg-accent/10 border-accent/20',
    },
    {
      id: 'events',
      title: 'Events & Participation Catalog',
      description: 'Historical and upcoming event listings, registration caps, venue links, and schedules.',
      icon: Calendar,
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    },
    {
      id: 'attendance',
      title: 'Attendance Session Records',
      description: 'Log of verified attendee check-ins, student roll numbers, and session timestamps.',
      icon: CheckSquare,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    },
  ];

  const handleDownload = async () => {
    try {
      const res = await downloadReport(selectedType, selectedFormat);
      toast.success(`Exported ${res.filename} successfully!`);
      onClose();
    } catch {
      toast.error('Failed to export report. Please try again.');
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
            <Download className="w-4 h-4" />
          </div>
          <span>Export & Download Reports</span>
        </div>
      }
      description="Generate formatted CSV or high-res PDF intelligence documents."
      dialogClassName="sm:max-w-xl p-6"
    >
      <div className="space-y-4 pt-2">

        {/* Report Selection Grid */}
        <div className="space-y-4 mb-6 relative z-10">
          <label className="input-label">1. Choose Report Type</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {reportTypes.map((type) => {
              const Icon = type.icon;
              const isSelected = selectedType === type.id;
              return (
                <div
                  key={type.id}
                  onClick={() => setSelectedType(type.id)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all duration-300 relative overflow-hidden ${
                    isSelected
                      ? 'bg-surface-elevated border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.2)]'
                      : 'bg-surface-elevated border-border hover:border-white/15'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`p-2 rounded-xl border ${type.color}`}>
                      <Icon size={16} />
                    </div>
                    <span className="text-xs font-bold text-text-primary leading-tight">{type.title}</span>
                  </div>
                  <p className="text-[11px] text-text-muted leading-relaxed line-clamp-2">{type.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Format Selector */}
        <div className="mb-6 relative z-10">
          <label className="input-label">2. Select Export Format</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setSelectedFormat('csv')}
              className={`p-4 rounded-2xl border flex items-center justify-center gap-3 transition-all ${
                selectedFormat === 'csv'
                  ? 'bg-accent text-text-primary border-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.3)]'
                  : 'bg-surface-elevated text-text-secondary border-border hover:bg-surface-elevated'
              }`}
            >
              <Table size={18} />
              <div className="text-left">
                <span className="text-xs font-black block">CSV Spreadsheet</span>
                <span className="text-[10px] opacity-70">Excel, Sheets raw data</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setSelectedFormat('pdf')}
              className={`p-4 rounded-2xl border flex items-center justify-center gap-3 transition-all ${
                selectedFormat === 'pdf'
                  ? 'bg-emerald-600 text-text-primary border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                  : 'bg-surface-elevated text-text-secondary border-border hover:bg-surface-elevated'
              }`}
            >
              <FileText size={18} />
              <div className="text-left">
                <span className="text-xs font-black block">PDF Document</span>
                <span className="text-[10px] opacity-70">Styled executive document</span>
              </div>
            </button>
          </div>
        </div>

        {/* Download Action */}
        <div className="pt-4 border-t border-separator flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-full text-xs font-medium border border-separator text-label-secondary hover:text-label-primary cursor-pointer transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDownload}
            disabled={exporting}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow transition cursor-pointer disabled:opacity-50"
          >
            {exporting ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Generating & Downloading...</span>
              </>
            ) : (
              <>
                <Download size={14} />
                <span>Download {selectedFormat.toUpperCase()} Report</span>
              </>
            )}
          </button>
        </div>
      </div>
    </ResponsiveModal>
  );
};

export default DownloadReportsModal;
