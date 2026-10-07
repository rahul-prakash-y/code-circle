import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  KeyRound,
  Copy,
  Check,
  Clock,
  Calendar,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Award,
  Sparkles,
  Layers,
  CheckSquare,
} from 'lucide-react';
import useEventStore from '../../store/useEventStore';
import api from '../../lib/axios';
import toast from 'react-hot-toast';

const COLLEGE_HOURS = [1, 2, 3, 4, 5, 6, 7];

const GenerateOtpModal = ({ isOpen, onClose }) => {
  const { events, fetchEvents } = useEventStore();
  const [selectedEventId, setSelectedEventId] = useState('');
  const [sessionName, setSessionName] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [selectedClassHours, setSelectedClassHours] = useState([1]);
  const [hourlyPoints, setHourlyPoints] = useState(50);
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
      setSelectedClassHours([1]);
    }
  }, [isOpen, fetchEvents]);

  // Pre-select first event if available
  useEffect(() => {
    if (events && events.length > 0 && !selectedEventId) {
      setSelectedEventId(events[0]._id);
    }
  }, [events, selectedEventId]);

  // Synchronize default hourly points from event
  useEffect(() => {
    if (events && selectedEventId) {
      const ev = events.find((e) => e._id === selectedEventId);
      if (ev && ev.hourlyPoints !== undefined && !isNaN(Number(ev.hourlyPoints))) {
        setHourlyPoints(Number(ev.hourlyPoints));
      } else {
        setHourlyPoints(50);
      }
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

  const toggleClassHour = (hour) => {
    setSelectedClassHours((prev) => {
      if (prev.includes(hour)) {
        if (prev.length === 1) {
          toast.error('Session must map at least 1 class hour');
          return prev;
        }
        return prev.filter((h) => h !== hour).sort((a, b) => a - b);
      } else {
        return [...prev, hour].sort((a, b) => a - b);
      }
    });
  };

  const setHourPreset = (presetHours) => {
    setSelectedClassHours(presetHours);
  };

  const calculatedTotalPoints = (Number(hourlyPoints) || 0) * selectedClassHours.length;

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!selectedEventId) {
      toast.error('Please select an event');
      return;
    }

    if (selectedClassHours.length === 0) {
      toast.error('Please map at least one class hour for this session');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/attendance/sessions', {
        event: selectedEventId,
        sessionName: sessionName.trim() || 'Attendance Session',
        durationMinutes: Number(durationMinutes) || 60,
        classHours: selectedClassHours,
        hourlyPoints: Math.max(0, Number(hourlyPoints) || 0),
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
        className="w-full max-w-xl glass border border-border p-6 sm:p-8 relative overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.8)] max-h-[90vh] overflow-y-auto"
      >
        {/* Glow ambient light */}
        <div className="absolute top-0 right-0 w-64 h-64 -mr-20 -mt-20 rounded-full bg-blue-500/15 blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex justify-between items-center mb-6 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
              <KeyRound size={20} />
            </div>
            <div>
              <h2 className="text-xl font-black text-text-primary">Generate Attendance OTP</h2>
              <p className="text-xs text-text-muted">Map class periods & award leaderboard points</p>
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
                <Calendar size={14} className="text-accent" />
                Target Event
              </label>
              {events && events.length > 0 ? (
                <select
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                  className="input-field bg-[#0f172a] text-text-primary border-border cursor-pointer text-xs py-2.5"
                  required
                >
                  {events.map((ev) => (
                    <option key={ev._id} value={ev._id} className="bg-surface-elevated text-text-primary">
                      {ev.title} ({ev.startDate ? new Date(ev.startDate).toLocaleDateString() : new Date(ev.date).toLocaleDateString()}) • {ev.hourlyPoints || 50} pts/hr
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
                placeholder="e.g. Technical Workshop - Forenoon Session"
                className="input-field text-xs py-2.5"
                required
              />
            </div>

            {/* Seven College Class Hours Mapping */}
            <div className="p-4 rounded-2xl bg-surface-elevated/70 border border-border space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
                  <Layers size={14} className="text-accent" /> Mapped Class Hours (7 College Periods)
                </label>
                <div className="flex items-center gap-1.5 text-[11px]">
                  <span className="text-text-muted">Presets:</span>
                  <button
                    type="button"
                    onClick={() => setHourPreset([1, 2, 3, 4])}
                    className="px-2 py-0.5 rounded-lg bg-surface border border-border hover:border-accent text-text-secondary text-[10px] font-bold transition-all"
                  >
                    1 - 4
                  </button>
                  <button
                    type="button"
                    onClick={() => setHourPreset([5, 6, 7])}
                    className="px-2 py-0.5 rounded-lg bg-surface border border-border hover:border-accent text-text-secondary text-[10px] font-bold transition-all"
                  >
                    5 - 7
                  </button>
                  <button
                    type="button"
                    onClick={() => setHourPreset([1, 2, 3, 4, 5, 6, 7])}
                    className="px-2 py-0.5 rounded-lg bg-surface border border-border hover:border-accent text-text-secondary text-[10px] font-bold transition-all"
                  >
                    All 7
                  </button>
                </div>
              </div>

              {/* 7 Class Hours Toggle Buttons */}
              <div className="grid grid-cols-7 gap-1.5">
                {COLLEGE_HOURS.map((hr) => {
                  const isSelected = selectedClassHours.includes(hr);
                  return (
                    <button
                      key={hr}
                      type="button"
                      onClick={() => toggleClassHour(hr)}
                      className={`flex flex-col items-center justify-center py-2.5 px-1 rounded-xl font-bold transition-all border cursor-pointer ${
                        isSelected
                          ? 'bg-accent text-white border-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.4)] scale-102'
                          : 'bg-surface text-text-muted border-border hover:bg-surface-elevated hover:text-text-primary'
                      }`}
                    >
                      <span className="text-[10px] uppercase tracking-wider opacity-80">Hr</span>
                      <span className="text-base font-black font-mono">{hr}</span>
                    </button>
                  );
                })}
              </div>

              {/* Selected summary */}
              <div className="flex items-center justify-between text-[11px] pt-1 text-text-muted">
                <span>
                  Selected: <strong className="text-text-primary font-mono">{selectedClassHours.map(h => `Hour ${h}`).join(', ')}</strong> ({selectedClassHours.length} hr{selectedClassHours.length > 1 ? 's' : ''})
                </span>
                <span className="text-accent font-semibold">
                  Tap to toggle periods
                </span>
              </div>
            </div>

            {/* Hourly Points & Leaderboard Calculation Live Preview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
                  <Award size={14} className="text-amber-400" /> Hourly Rate (Points/Hour)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    value={hourlyPoints}
                    onChange={(e) => setHourlyPoints(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="input-field text-xs py-2.5 font-mono pr-12"
                    required
                  />
                  <span className="absolute right-3 top-2.5 text-[11px] font-bold text-text-muted uppercase">
                    pts/hr
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
                  <Clock size={14} className="text-purple-400" /> Validity
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[15, 30, 60].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setDurationMinutes(mins)}
                      className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                        durationMinutes === mins
                          ? 'bg-purple-600 text-white border-purple-400 shadow-sm'
                          : 'bg-surface-elevated text-text-muted border-border hover:bg-surface'
                      }`}
                    >
                      {mins}m
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Dynamic Points Awarded Live Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-orange-500/10 border border-amber-500/30 flex items-center justify-between gap-3 shadow-inner">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                  <Sparkles size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-text-primary">Leaderboard Award</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {selectedClassHours.length} {selectedClassHours.length === 1 ? 'Period' : 'Periods'}
                    </span>
                  </div>
                  <p className="text-[11px] text-text-muted mt-0.5 font-mono">
                    {selectedClassHours.length} hr{selectedClassHours.length > 1 ? 's' : ''} × {hourlyPoints} pts/hr = {calculatedTotalPoints} pts
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-2xl font-black text-amber-400 font-mono tracking-tight">
                  +{calculatedTotalPoints}
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400/80">
                  Per Student
                </span>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading || events.length === 0}
                className="w-full btn-primary flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold shadow-lg"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Generating Session OTP...
                  </>
                ) : (
                  <>
                    <ShieldCheck size={18} />
                    Generate Attendance OTP ({calculatedTotalPoints} pts)
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          /* Active OTP Display view */
          <div className="space-y-6 text-center relative z-10">
            <div className="p-6 rounded-3xl bg-linear-to-b from-blue-500/10 to-indigo-500/5 border border-accent/30">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-accent block mb-2">
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

            <div className="text-left bg-surface-elevated p-4 rounded-2xl border border-border space-y-2 text-xs text-text-muted">
              <div className="flex items-center justify-between pb-2 border-b border-border/50">
                <span className="text-text-primary font-bold text-sm">{generatedSession.sessionName}</span>
                <span className="px-3 py-1 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 font-mono font-bold text-xs">
                  +{generatedSession.totalPoints || ((generatedSession.hourlyPoints || 50) * (generatedSession.classHours?.length || 1))} Leaderboard Pts
                </span>
              </div>
              <p>
                <span className="text-text-primary font-semibold">Mapped Class Hours: </span>
                <span className="text-text-secondary font-mono">
                  {generatedSession.classHours && generatedSession.classHours.length > 0
                    ? `Hours ${generatedSession.classHours.join(', ')} (${generatedSession.classHours.length} period${generatedSession.classHours.length > 1 ? 's' : ''})`
                    : 'Hour 1 (1 period)'}
                </span>
              </p>
              <p>
                <span className="text-text-primary font-semibold">Instruction: </span>
                Instruct students to enter this 6-digit code in their dashboard. Verified students instantly receive {generatedSession.totalPoints || ((generatedSession.hourlyPoints || 50) * (generatedSession.classHours?.length || 1))} points for their profile & leaderboard ranking.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={copyToClipboard}
                className="flex-1 btn-primary flex items-center justify-center gap-2 py-3 rounded-xl font-bold"
              >
                {copied ? <Check size={18} className="text-emerald-500" /> : <Copy size={18} />}
                {copied ? 'Copied Code!' : 'Copy Code'}
              </button>

              <button
                onClick={() => setGeneratedSession(null)}
                className="btn-secondary px-6 text-xs font-bold rounded-xl"
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
