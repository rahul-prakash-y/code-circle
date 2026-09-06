import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, KeyRound, Copy, Check, Clock, Calendar, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';
import useEventStore from '../../store/useEventStore';
import api from '../../lib/axios';
import toast from 'react-hot-toast';

const GenerateOtpModal = ({ isOpen, onClose }) => {
  const { events, fetchEvents } = useEventStore();
  const [selectedEventId, setSelectedEventId] = useState('');
  const [sessionName, setSessionName] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [loading, setLoading] = useState(false);
  const [generatedSession, setGeneratedSession] = useState(null);
  const [copied, setCopied] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(0);

  useEffect(() => {
    if (isOpen) {
      fetchEvents();
      setGeneratedSession(null);
      setCopied(false);
      setSessionName('General Session Attendance');
    }
  }, [isOpen, fetchEvents]);

  // Pre-select first event if available
  useEffect(() => {
    if (events && events.length > 0 && !selectedEventId) {
      setSelectedEventId(events[0]._id);
    }
  }, [events, selectedEventId]);

  // Countdown timer for active OTP
  useEffect(() => {
    if (!generatedSession || !generatedSession.otpExpiry) return;

    const expiryTime = new Date(generatedSession.otpExpiry).getTime();
    const updateCountdown = () => {
      const diff = Math.max(0, Math.floor((expiryTime - Date.now()) / 1000));
      setSecondsRemaining(diff);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [generatedSession]);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!selectedEventId) {
      toast.error('Please select an event');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/attendance/sessions', {
        event: selectedEventId,
        sessionName: sessionName.trim() || 'Attendance Session',
        durationMinutes: Number(durationMinutes) || 60,
      });

      setGeneratedSession(response.data);
      toast.success('Attendance OTP generated successfully!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to generate attendance OTP');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!generatedSession?.otp) return;
    navigator.clipboard.writeText(generatedSession.otp);
    setCopied(true);
    toast.success('OTP copied to clipboard!');
    setTimeout(() => setCopied(false), 2500);
  };

  const formatCountdown = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins}:${remainder < 10 ? '0' : ''}${remainder}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-lg glass border border-border p-8 relative overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.8)]"
      >
        {/* Glow ambient light */}
        <div className="absolute top-0 right-0 w-64 h-64 -mr-20 -mt-20 rounded-full bg-blue-500/15 blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex justify-between items-center mb-6 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent-muted">
              <KeyRound size={20} />
            </div>
            <div>
              <h2 className="text-xl font-black text-text-primary">Generate Attendance OTP</h2>
              <p className="text-xs text-text-muted">Create a secure, time-expiring attendance code</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-text-muted hover:text-text-primary rounded-xl hover:bg-surface-elevated transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {!generatedSession ? (
          /* Form view */
          <form onSubmit={handleGenerate} className="space-y-5 relative z-10">
            <div>
              <label className="input-label flex items-center gap-2">
                <Calendar size={14} className="text-accent-muted" />
                Target Event
              </label>
              {events && events.length > 0 ? (
                <select
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                  className="input-field bg-[#0f172a] text-text-primary border-border cursor-pointer"
                  required
                >
                  {events.map((ev) => (
                    <option key={ev._id} value={ev._id} className="bg-surface-elevated text-text-primary">
                      {ev.title} ({new Date(ev.date).toLocaleDateString()})
                    </option>
                  ))}
                </select>
              ) : (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center gap-3">
                  <AlertCircle size={18} />
                  <span>No events found. Please create an event before generating attendance.</span>
                </div>
              )}
            </div>

            <div>
              <label className="input-label">Session Name / Description</label>
              <input
                type="text"
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                placeholder="e.g. Workshop Session 1 - Morning Attendance"
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="input-label flex items-center gap-2">
                <Clock size={14} className="text-purple-400" />
                Validity Duration
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[15, 30, 60].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setDurationMinutes(mins)}
                    className={`py-3 rounded-xl text-xs font-bold transition-all border ${
                      durationMinutes === mins
                        ? 'bg-accent text-text-primary border-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.3)]'
                        : 'bg-surface-elevated text-text-muted border-border hover:bg-surface-elevated'
                    }`}
                  >
                    {mins} Minutes
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading || events.length === 0}
                className="w-full btn-primary flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Generating OTP...
                  </>
                ) : (
                  <>
                    <ShieldCheck size={18} />
                    Generate Attendance OTP
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          /* Active OTP Display view */
          <div className="space-y-6 text-center relative z-10">
            <div className="p-6 rounded-3xl bg-linear-to-b from-blue-500/10 to-indigo-500/5 border border-accent/30">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-accent-muted block mb-2">
                ACTIVE VERIFICATION CODE
              </span>

              {/* Huge glowing 6-digit OTP */}
              <div className="text-5xl md:text-6xl font-black font-mono tracking-[0.3em] text-text-primary my-4 drop-shadow-[0_0_25px_rgba(59,130,246,0.6)]">
                {generatedSession.otp}
              </div>

              <div className="flex items-center justify-center gap-2 text-xs font-bold text-text-muted">
                <Clock size={14} className="text-amber-400" />
                <span>
                  Expires in:{' '}
                  <span className="text-amber-400 font-mono text-sm">
                    {formatCountdown(secondsRemaining)}
                  </span>
                </span>
              </div>
            </div>

            <div className="text-left bg-surface-elevated p-4 rounded-2xl border border-border space-y-1 text-xs text-text-muted">
              <p>
                <span className="text-text-primary font-bold">Session:</span> {generatedSession.sessionName}
              </p>
              <p>
                <span className="text-text-primary font-bold">Instruction:</span> Instruct students to enter this code in the Attendance tab of their dashboard to verify presence.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={copyToClipboard}
                className="flex-1 btn-primary flex items-center justify-center gap-2"
              >
                {copied ? <Check size={18} className="text-emerald-500" /> : <Copy size={18} />}
                {copied ? 'Copied Code!' : 'Copy Code'}
              </button>

              <button
                onClick={() => setGeneratedSession(null)}
                className="btn-secondary px-6 text-xs font-bold"
              >
                Generate Another
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default GenerateOtpModal;
