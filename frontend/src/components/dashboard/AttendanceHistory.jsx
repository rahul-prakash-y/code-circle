import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Search, Calendar, Clock, ArrowRight, ShieldCheck, Loader2 } from 'lucide-react';
import useAttendanceStore from '../../store/useAttendanceStore';
import { format } from 'date-fns';

const AttendanceHistory = () => {
  const { history, markAttendance, fetchUserHistory, loading } = useAttendanceStore();
  const [otp, setOtp] = useState('');
  const [isMarking, setIsMarking] = useState(false);

  useEffect(() => {
    fetchUserHistory();
  }, [fetchUserHistory]);

  const handleMarkAttendance = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) return;
    
    setIsMarking(true);
    const success = await markAttendance(otp);
    if (success) {
      setOtp('');
      fetchUserHistory();
    }
    setIsMarking(false);
  };

  return (
    <div className="space-y-8">
      {/* OTP Input Section */}
      <section className="glass p-8 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
          <ShieldCheck size={120} />
        </div>
        
        <div className="relative z-10 max-w-lg">
          <h2 className="text-2xl font-black text-text-primary mb-2">Mark Attendance</h2>
          <p className="text-text-muted text-sm mb-6 leading-relaxed">
            Enter the 6-digit OTP provided during the session to verify your presence.
          </p>
          
          <form onSubmit={handleMarkAttendance} className="flex gap-4">
            <div className="flex-1 relative">
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="Ex: 123456"
                className="w-full bg-surface-elevated border border-border rounded-2xl px-6 py-4 text-xl font-mono tracking-[0.5em] focus:outline-none focus:border-accent/50 transition-all placeholder:tracking-normal placeholder:text-sm placeholder:font-sans"
              />
              {otp.length === 6 && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-accent-muted animate-pulse">
                  <CheckCircle2 size={24} />
                </div>
              )}
            </div>
            <button
              type="submit"
              disabled={otp.length !== 6 || isMarking}
              className="btn-primary px-8 disabled:opacity-50 disabled:grayscale transition-all flex items-center gap-3"
            >
              {isMarking ? <Loader2 className="animate-spin" size={20} /> : <ArrowRight size={20} />}
              <span className="font-black uppercase tracking-widest text-xs">Verify</span>
            </button>
          </form>
        </div>
      </section>

      {/* History Table */}
      <section className="glass overflow-hidden">
        <div className="p-6 border-b border-border bg-surface-elevated flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-accent/10 text-accent-muted rounded-xl flex items-center justify-center">
              <Clock size={20} />
            </div>
            <div>
              <h3 className="text-lg font-black text-text-primary">Attendance History</h3>
              <p className="text-xs text-text-muted uppercase tracking-widest font-bold">Your verified presence</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-2xl font-black text-text-primary">{history.length}</span>
            <p className="text-[10px] text-text-muted uppercase font-black">Sessions</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border text-[10px] font-black uppercase tracking-widest text-text-muted">
                <th className="px-8 py-4">Event & Session</th>
                <th className="px-8 py-4">Status</th>
                <th className="px-8 py-4">Date & Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {history.map((record) => (
                <tr key={record._id} className="group hover:bg-white/[0.02] transition-colors">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-surface-elevated border border-border overflow-hidden">
                        {record.session.event.thumbnail ? (
                          <img src={record.session.event.thumbnail} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-accent-muted bg-blue-500/5">
                            <Calendar size={20} />
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-slate-200 group-hover:text-text-primary transition-colors">
                          {record.session.event.title}
                        </div>
                        <div className="text-xs text-text-muted font-medium">
                          {record.session.sessionName}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[10px] font-black uppercase tracking-widest">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Verified Present
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="text-xs font-bold text-text-muted">
                      {format(new Date(record.timestamp), 'MMM dd, yyyy')}
                    </div>
                    <div className="text-[10px] text-text-muted font-bold uppercase tracking-tighter">
                      {format(new Date(record.timestamp), 'hh:mm a')}
                    </div>
                  </td>
                </tr>
              ))}
              {history.length === 0 && !loading && (
                <tr>
                  <td colSpan="3" className="px-8 py-20 text-center">
                    <div className="max-w-xs mx-auto space-y-4">
                      <div className="w-16 h-16 bg-surface-elevated rounded-full flex items-center justify-center mx-auto text-text-muted">
                        <ShieldCheck size={32} />
                      </div>
                      <p className="text-text-muted text-sm font-medium">
                        No attendance records found yet. Use an OTP to mark your first presence.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default AttendanceHistory;
