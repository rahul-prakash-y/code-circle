import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, UserCheck, ShieldCheck, Loader2, Award, Plus, Calendar, Clock, Key, Users } from 'lucide-react';
import useEnrollmentStore from '../../store/useEnrollmentStore';
import useAttendanceStore from '../../store/useAttendanceStore';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

const AttendanceDashboard = ({ isOpen, onClose, event }) => {
  const { fetchEventEnrollments, updateAttendance, loading: enrollmentLoading } = useEnrollmentStore();
  const { sessions, sessionAttendance, fetchEventSessions, createSession, fetchSessionAttendance, loading: attendanceLoading } = useAttendanceStore();
  
  const [activeTab, setActiveTab] = useState('manual'); // 'manual', 'sessions'
  const [enrollments, setEnrollments] = useState([]);
  const [selectedEnrollmentIds, setSelectedEnrollmentIds] = useState(new Set());
  
  const [showCreateSession, setShowCreateSession] = useState(false);
  const [newSessionName, setNewSessionName] = useState('');
  const [selectedSession, setSelectedSession] = useState(null);

  useEffect(() => {
    if (isOpen && event?._id) {
      if (activeTab === 'manual') {
        const loadEnrollments = async () => {
          try {
            const data = await fetchEventEnrollments(event._id);
            setEnrollments(data);
            const initialSelected = new Set(data.filter(e => e.attendanceStatus).map(e => e._id));
            setSelectedEnrollmentIds(initialSelected);
          } catch {
            toast.error('Failed to load enrollments');
          }
        };
        loadEnrollments();
      } else {
        fetchEventSessions(event._id);
      }
    }
  }, [isOpen, event?._id, activeTab, fetchEventEnrollments, fetchEventSessions]);

  const handleCreateSession = async (e) => {
    e.preventDefault();
    if (!newSessionName) return;
    const session = await createSession({ event: event._id, sessionName: newSessionName });
    if (session) {
      setNewSessionName('');
      setShowCreateSession(false);
      fetchEventSessions(event._id);
    }
  };

  const handleViewSession = async (session) => {
    setSelectedSession(session);
    await fetchSessionAttendance(session._id);
  };

  const toggleManualAttendance = (id) => {
    const newSelected = new Set(selectedEnrollmentIds);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedEnrollmentIds(newSelected);
  };

  const saveManualAttendance = async () => {
    try {
      await updateAttendance(event._id, Array.from(selectedEnrollmentIds));
      toast.success('Manual attendance updated');
    } catch (error) {
      toast.error(error.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-5xl h-[85vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-500/10 text-indigo-400 rounded-2xl flex items-center justify-center">
              <UserCheck size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white">Attendance Intelligence</h2>
              <p className="text-sm text-slate-400 font-bold uppercase tracking-widest leading-none mt-1">{event?.title}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl transition-colors text-slate-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex px-6 border-b border-white/5 bg-white/[0.02]">
          {[
            { id: 'manual', label: 'Manual Registry', icon: UserCheck },
            { id: 'sessions', label: 'OTP Sessions', icon: Key }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-8 py-4 text-xs font-black uppercase tracking-widest transition-all relative ${
                activeTab === tab.id ? 'text-blue-400' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
              )}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden flex">
          {activeTab === 'manual' ? (
            <div className="flex-1 flex flex-col">
              <div className="p-4 bg-white/5 border-b border-white/5 flex justify-between items-center">
                 <div className="flex gap-2">
                    <button onClick={() => setSelectedEnrollmentIds(new Set(enrollments.map(e => e._id)))} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-black uppercase tracking-widest text-white rounded-xl transition-all">All Present</button>
                    <button onClick={saveManualAttendance} disabled={enrollmentLoading} className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-xs font-black uppercase tracking-widest text-white rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2">
                      {enrollmentLoading ? <Loader2 className="animate-spin" size={14} /> : <CheckCircle2 size={14} />}
                      Sync Registry
                    </button>
                 </div>
                 <button disabled className="px-6 py-2 bg-emerald-600/20 text-emerald-400 border border-emerald-500/20 rounded-xl text-xs font-black uppercase tracking-widest opacity-50 cursor-not-allowed">Auto-Certs</button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <table className="w-full text-left">
                  <thead className="sticky top-0 bg-slate-900 border-b border-white/5 z-10">
                    <tr className="text-[10px] font-black uppercase tracking-widest text-slate-500 bg-slate-900">
                      <th className="px-8 py-4">Student Info</th>
                      <th className="px-8 py-4">ID</th>
                      <th className="px-8 py-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {enrollments.map(e => (
                      <tr key={e._id} className="hover:bg-white/5 group transition-colors">
                        <td className="px-8 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center text-xs font-bold">{e.enrolledBy.name.charAt(0)}</div>
                            <div>
                              <div className="font-bold text-slate-200">{e.enrolledBy.name}</div>
                              <div className="text-[10px] text-slate-500 font-bold uppercase">{e.type}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-4 font-mono text-sm text-slate-400">{e.enrolledBy.rollNo}</td>
                        <td className="px-8 py-4 text-center">
                          <button onClick={() => toggleManualAttendance(e._id)} className={`relative h-5 w-10 rounded-full transition-colors ${selectedEnrollmentIds.has(e._id) ? 'bg-emerald-500' : 'bg-slate-700'}`}>
                            <div className={`absolute top-1 left-1 h-3 w-3 bg-white rounded-full transition-transform ${selectedEnrollmentIds.has(e._id) ? 'translate-x-5' : ''}`} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex overflow-hidden">
              {/* Sessions Sidebar */}
              <div className="w-80 border-r border-white/5 flex flex-col bg-white/[0.01]">
                <div className="p-4 border-b border-white/5">
                  <button onClick={() => setShowCreateSession(true)} className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all">
                    <Plus size={16} /> New Session
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                  {sessions.map(s => (
                    <button
                      key={s._id}
                      onClick={() => handleViewSession(s)}
                      className={`w-full p-4 rounded-2xl text-left transition-all border ${
                        selectedSession?._id === s._id ? 'bg-blue-500/10 border-blue-500/30' : 'hover:bg-white/5 border-transparent'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-1">
                         <h4 className="font-bold text-white text-sm">{s.sessionName}</h4>
                         <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${s.isActive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                           {s.isActive ? 'Live' : 'Closed'}
                         </span>
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-slate-500 font-bold uppercase tracking-tighter">
                        <span className="flex items-center gap-1"><Clock size={12} /> {format(new Date(s.createdAt), 'hh:mm a')}</span>
                        <span className="flex items-center gap-1"><Key size={12} /> {s.otp}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Session Detail */}
              <div className="flex-1 flex flex-col relative">
                {selectedSession ? (
                  <>
                    <div className="p-6 bg-white/5 border-b border-white/5 flex justify-between items-center">
                      <div>
                        <h3 className="text-xl font-black text-white">{selectedSession.sessionName}</h3>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-0.5">OTP: {selectedSession.otp} — Expiry: {format(new Date(selectedSession.otpExpiry), 'hh:mm a')}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-black text-blue-400">{sessionAttendance.length}</span>
                        <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Verified Students</p>
                      </div>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                      <table className="w-full text-left">
                        <thead className="sticky top-0 bg-slate-900 border-b border-white/5 z-10">
                          <tr className="text-[10px] font-black uppercase tracking-widest text-slate-500 bg-slate-900">
                            <th className="px-8 py-4">Student</th>
                            <th className="px-8 py-4">Verified Time</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {sessionAttendance.map(r => (
                            <tr key={r._id} className="hover:bg-white/5 transition-colors">
                              <td className="px-8 py-4 font-bold text-slate-200">{r.user.name} <span className="text-slate-500 font-mono ml-2 text-xs">({r.user.rollNo})</span></td>
                              <td className="px-8 py-4 text-xs font-bold text-slate-500 uppercase tracking-tighter">{format(new Date(r.timestamp), 'MMM dd, hh:mm:ss a')}</td>
                            </tr>
                          ))}
                          {sessionAttendance.length === 0 && !attendanceLoading && (
                             <tr><td colSpan="2" className="px-8 py-20 text-center text-slate-500 font-bold">No students have marked attendance via OTP yet.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-slate-500 font-bold uppercase tracking-widest text-xs">Select a session to view details</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Create Session Modal Overlay */}
        {showCreateSession && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="stellar-glass p-8 w-full max-w-md border-blue-500/20">
              <h3 className="text-2xl font-black text-white mb-6">Create Attendance Session</h3>
              <form onSubmit={handleCreateSession} className="space-y-6">
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block ml-1">Session Name / Day</label>
                  <input
                    autoFocus
                    type="text"
                    value={newSessionName}
                    onChange={(e) => setNewSessionName(e.target.value)}
                    placeholder="e.g. Day 1 - Main Keynote"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-blue-500/50 transition-all font-bold placeholder:font-bold placeholder:text-slate-600"
                  />
                </div>
                <div className="flex gap-4">
                  <button type="button" onClick={() => setShowCreateSession(false)} className="flex-1 py-4 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors">Cancel</button>
                  <button type="submit" className="flex-1 stellar-btn py-4 text-xs font-black uppercase tracking-widest">Generate OTP</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceDashboard;
