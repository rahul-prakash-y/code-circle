import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Users, Award, CheckCircle2, XCircle, Search, Clock, Calendar } from 'lucide-react';
import useAssessmentStore from '../../store/useAssessmentStore';

const AssessmentSubmissionsModal = ({ assessmentId, isOpen, onClose }) => {
  const { assessmentSubmissions, fetchAssessmentSubmissions, loading } = useAssessmentStore();
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (isOpen && assessmentId) {
      fetchAssessmentSubmissions(assessmentId);
    }
  }, [isOpen, assessmentId, fetchAssessmentSubmissions]);

  if (!isOpen) return null;

  const filteredSubmissions = assessmentSubmissions.filter((sub) => {
    const student = sub.user || {};
    const query = search.toLowerCase().trim();
    return (
      (student.name || '').toLowerCase().includes(query) ||
      (student.rollNo || '').toLowerCase().includes(query) ||
      (student.email || '').toLowerCase().includes(query)
    );
  });

  const formatSeconds = (sec) => {
    const mins = Math.floor((sec || 0) / 60);
    const s = (sec || 0) % 60;
    return `${mins}m ${s}s`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-4xl my-auto stellar-glass border border-white/10 p-6 sm:p-8 relative overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.8)] max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex justify-between items-center pb-6 border-b border-white/10 relative z-10 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Users size={22} />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">
                Assessment Submissions Roster
              </h2>
              <p className="text-xs text-slate-400">
                Review student completion scores, percentages, and assessment performance
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all border border-white/5"
          >
            <X size={18} />
          </button>
        </div>

        {/* Filter Bar */}
        <div className="pt-5 pb-4 flex items-center justify-between gap-4 flex-shrink-0 relative z-10">
          <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-2xl focus-within:border-purple-500/40 transition-all flex-1 max-w-sm">
            <Search size={16} className="text-slate-500" />
            <input
              type="text"
              placeholder="Search by student name or roll no..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent border-none text-xs sm:text-sm text-white focus:outline-none placeholder-slate-600 w-full"
            />
          </div>

          <span className="text-xs font-bold text-slate-400">
            Total Submissions: <span className="text-white font-black">{filteredSubmissions.length}</span>
          </span>
        </div>

        {/* Table / List */}
        <div className="overflow-y-auto custom-scrollbar flex-1 relative z-10">
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400 font-bold">
              Loading student submissions...
            </div>
          ) : filteredSubmissions.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              No submissions recorded for this assessment yet.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredSubmissions.map((sub) => {
                const student = sub.user || {};
                return (
                  <div
                    key={sub._id}
                    className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-purple-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all"
                  >
                    {/* Student Info */}
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center font-black text-purple-400 text-xs flex-shrink-0">
                        {student.name ? student.name.charAt(0).toUpperCase() : 'S'}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white leading-none">
                          {student.name || 'Unknown Student'}
                        </h4>
                        <p className="text-[11px] text-slate-400 font-mono mt-1">
                          {student.rollNo || 'NO ROLL'} • {student.department || 'Student'}
                        </p>
                      </div>
                    </div>

                    {/* Score, Percentage & Pass Status */}
                    <div className="flex items-center gap-4 text-right">
                      <div className="text-center sm:text-right">
                        <p className="text-sm font-black text-white">
                          {sub.score} / {sub.totalPoints} pts
                        </p>
                        <p className="text-[10px] text-slate-500 font-bold">
                          {formatSeconds(sub.timeSpentSeconds)}
                        </p>
                      </div>

                      <div
                        className={`px-3 py-1 rounded-full text-xs font-black flex items-center gap-1.5 border ${
                          sub.passed
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                            : 'bg-red-500/10 border-red-500/30 text-red-400'
                        }`}
                      >
                        {sub.passed ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                        {sub.percentage}%
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default AssessmentSubmissionsModal;
