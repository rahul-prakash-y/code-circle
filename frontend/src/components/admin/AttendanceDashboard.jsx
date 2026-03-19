import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, UserCheck, ShieldCheck, Loader2, Download, Award } from 'lucide-react';
import useEnrollmentStore from '../../store/useEnrollmentStore';
import toast from 'react-hot-toast';

const AttendanceDashboard = ({ isOpen, onClose, event }) => {
  const { fetchEventEnrollments, updateAttendance, generateCertificates, loading } = useEnrollmentStore();
  const [enrollments, setEnrollments] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const loadEnrollments = async () => {
      try {
        const data = await fetchEventEnrollments(event._id);
        setEnrollments(data);
        // Auto-select those already present
        const initialSelected = new Set(data.filter(e => e.attendanceStatus).map(e => e._id));
        setSelectedIds(initialSelected);
      } catch {
        toast.error('Failed to load enrollments');
      }
    };

    if (isOpen && event?._id) {
      loadEnrollments();
    }
  }, [isOpen, event?._id, fetchEventEnrollments]);

  const toggleAttendance = (id) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleMarkAllPresent = () => {
    const allIds = enrollments.map(e => e._id);
    setSelectedIds(new Set(allIds));
  };

  const saveAttendance = async () => {
    try {
      await updateAttendance(event._id, Array.from(selectedIds));
      toast.success('Attendance updated successfully');
      // No need to reload, the state is already current
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleGenerateCertificates = async () => {
    setIsGenerating(true);
    try {
      const result = await generateCertificates(event._id);
      toast.success(result.message);
      // Reload to show certificate check icons
      const data = await fetchEventEnrollments(event._id);
      setEnrollments(data);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-500/10 text-indigo-400 rounded-2xl flex items-center justify-center">
              <UserCheck size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Attendance Panel</h2>
              <p className="text-sm text-slate-400">{event?.title}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-xl transition-colors text-slate-400 hover:text-white"
          >
            <X size={24} />
          </button>
        </div>

        {/* Actions Bar */}
        <div className="p-4 bg-white/5 border-b border-white/5 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={handleMarkAllPresent}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-bold transition-all"
            >
              Mark All Present
            </button>
            <button
              onClick={saveAttendance}
              disabled={loading}
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
              Save Changes
            </button>
          </div>

          <button
            onClick={handleGenerateCertificates}
            disabled={isGenerating || loading}
            className="px-6 py-2 bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {isGenerating ? <Loader2 className="animate-spin" size={16} /> : <Award size={16} />}
            Generate Certificates (Auto)
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-0">
          <table className="w-full text-left">
            <thead className="sticky top-0 bg-slate-900 z-10">
              <tr className="border-b border-white/5 bg-slate-800/50">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Student Info</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Roll Number</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Team</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-center">Present</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-center">Certificate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {enrollments.map((enrollment) => (
                <tr key={enrollment._id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center text-xs font-bold">
                        {enrollment.enrolledBy.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-slate-200">{enrollment.enrolledBy.name}</div>
                        <div className="text-xs text-slate-500">{enrollment.enrolledBy.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-300 font-mono">{enrollment.enrolledBy.rollNo}</span>
                  </td>
                  <td className="px-6 py-4">
                    {enrollment.type === 'Team' ? (
                      <span className="text-xs bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-full border border-indigo-500/20">
                        {enrollment.teamName}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-500">Individual</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => toggleAttendance(enrollment._id)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                        selectedIds.has(enrollment._id) ? 'bg-emerald-500' : 'bg-slate-700'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          selectedIds.has(enrollment._id) ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {enrollment.certificateUrl ? (
                      <a 
                        href={enrollment.certificateUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        className="p-1.5 text-emerald-400 hover:bg-emerald-400/10 rounded-lg transition-all inline-block"
                        title="View Certificate"
                      >
                        <ShieldCheck size={20} />
                      </a>
                    ) : (
                      <span className="text-xs text-slate-600">—</span>
                    )}
                  </td>
                </tr>
              ))}
              {enrollments.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                    No enrollments found for this event.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AttendanceDashboard;
