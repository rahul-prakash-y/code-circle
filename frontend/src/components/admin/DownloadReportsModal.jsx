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
      color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
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
    } catch (err) {
      toast.error('Failed to export report. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-xl stellar-glass border border-white/10 p-8 relative overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.8)]"
      >
        {/* Glow ambient light */}
        <div className="absolute top-0 right-0 w-64 h-64 -mr-20 -mt-20 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex justify-between items-center mb-6 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Download size={20} />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">Export & Download Reports</h2>
              <p className="text-xs text-slate-400">Generate formatted CSV or high-res PDF intelligence documents</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/5 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Report Selection Grid */}
        <div className="space-y-4 mb-6 relative z-10">
          <label className="stellar-label">1. Choose Report Type</label>
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
                      ? 'bg-white/10 border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.2)]'
                      : 'bg-white/5 border-white/5 hover:border-white/15'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`p-2 rounded-xl border ${type.color}`}>
                      <Icon size={16} />
                    </div>
                    <span className="text-xs font-bold text-white leading-tight">{type.title}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2">{type.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Format Selector */}
        <div className="mb-6 relative z-10">
          <label className="stellar-label">2. Select Export Format</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setSelectedFormat('csv')}
              className={`p-4 rounded-2xl border flex items-center justify-center gap-3 transition-all ${
                selectedFormat === 'csv'
                  ? 'bg-blue-600 text-white border-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.3)]'
                  : 'bg-white/5 text-slate-300 border-white/5 hover:bg-white/10'
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
                  ? 'bg-emerald-600 text-white border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                  : 'bg-white/5 text-slate-300 border-white/5 hover:bg-white/10'
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
        <div className="pt-2 relative z-10 flex gap-3">
          <button
            onClick={handleDownload}
            disabled={exporting}
            className="flex-1 stellar-btn flex items-center justify-center gap-2"
          >
            {exporting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Generating & Downloading...
              </>
            ) : (
              <>
                <Download size={18} />
                Download {selectedFormat.toUpperCase()} Report
              </>
            )}
          </button>

          <button
            onClick={onClose}
            className="stellar-btn-outline px-6 text-xs"
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default DownloadReportsModal;
