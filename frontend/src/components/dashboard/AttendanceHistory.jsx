import React, { useState, useEffect } from 'react';
import { CheckCircle2, Calendar, Clock, ArrowRight, ShieldCheck, Loader2 } from 'lucide-react';
import useAttendanceStore from '../../store/useAttendanceStore';
import { format } from 'date-fns';

const AttendanceHistory = () => {
  const { history = [], markAttendance, fetchUserHistory, loading } = useAttendanceStore();
  const [otp, setOtp] = useState('');
  const [isMarking, setIsMarking] = useState(false);

  useEffect(() => {
    if (typeof fetchUserHistory === 'function') {
      fetchUserHistory();
    }
  }, [fetchUserHistory]);

  const handleMarkAttendance = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) return;
    
    setIsMarking(true);
    const success = await markAttendance(otp);
    if (success) {
      setOtp('');
      if (typeof fetchUserHistory === 'function') {
        fetchUserHistory();
      }
    }
    setIsMarking(false);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto py-4">
      {/* OTP Input Section */}
      <div className="surface rounded-[18px] p-6 sm:p-8 border border-separator shadow-card">
        <div className="max-w-md space-y-2 mb-6">
          <h2 className="text-xl font-bold text-text-primary tracking-tight">Mark Attendance</h2>
          <p className="text-xs text-text-muted leading-relaxed">
            Enter the 6-digit session OTP provided during your event or lecture to verify your presence.
          </p>
        </div>
        
        <form onSubmit={handleMarkAttendance} className="flex flex-col sm:flex-row gap-3 max-w-md">
          <div className="flex-1 relative">
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              maxLength={6}
              className="input-field text-lg font-mono tracking-[0.3em] text-center"
            />
            {otp.length === 6 && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-accent">
                <CheckCircle2 size={18} />
              </div>
            )}
          </div>
          <button
            type="submit"
            disabled={otp.length !== 6 || isMarking}
            className="btn-primary py-2.5 px-6 text-xs font-semibold flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {isMarking ? <Loader2 className="animate-spin" size={15} /> : <ArrowRight size={15} />}
            <span>Verify</span>
          </button>
        </form>
      </div>

      {/* History Table */}
      <div className="surface rounded-[18px] border border-separator shadow-card overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-separator flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-surface-elevated border border-separator text-text-secondary flex items-center justify-center">
              <Clock size={16} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-text-primary">Attendance History</h3>
              <p className="text-xs text-text-muted">Your verified session presence</p>
            </div>
          </div>
          <span className="text-xs font-mono text-text-muted">
            {history.length} session{history.length === 1 ? '' : 's'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-separator text-[11px] font-medium text-text-muted bg-canvas">
                <th className="px-6 py-3.5">Event & Session</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Date & Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-separator">
              {history.map((record) => (
                <tr key={record._id} className="hover:bg-surface-elevated transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-surface-elevated border border-separator overflow-hidden shrink-0 flex items-center justify-center text-text-muted">
                        {record.session?.event?.thumbnail ? (
                          <img src={record.session.event.thumbnail} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Calendar size={16} />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-text-primary truncate">
                          {record.session?.event?.title || 'Event Session'}
                        </div>
                        <div className="text-[11px] text-text-muted truncate">
                          {record.session?.sessionName || 'General Session'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-full text-[10px] font-semibold uppercase">
                      Verified Present
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="text-xs font-medium text-text-primary">
                      {record.timestamp ? format(new Date(record.timestamp), 'MMM dd, yyyy') : '—'}
                    </div>
                    <div className="text-[10px] text-text-muted font-mono">
                      {record.timestamp ? format(new Date(record.timestamp), 'hh:mm a') : ''}
                    </div>
                  </td>
                </tr>
              ))}
              {history.length === 0 && !loading && (
                <tr>
                  <td colSpan="3" className="px-6 py-14 text-center">
                    <div className="max-w-xs mx-auto space-y-2">
                      <div className="w-10 h-10 bg-surface-elevated rounded-xl border border-separator flex items-center justify-center mx-auto text-text-muted">
                        <ShieldCheck size={20} />
                      </div>
                      <p className="text-text-primary text-xs font-medium">No attendance records yet</p>
                      <p className="text-text-muted text-[11px]">
                        Enter a valid 6-digit session OTP above to verify your attendance.
                      </p>
                    </div>
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

export default AttendanceHistory;

