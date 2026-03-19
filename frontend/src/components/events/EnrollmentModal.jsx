import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, Plus, Trash2, CheckCircle, AlertCircle, Loader2, UserPlus } from 'lucide-react';
import useEnrollmentStore from '../../store/useEnrollmentStore';
import { toast } from 'react-hot-toast';

const EnrollmentModal = ({ isOpen, onClose, event }) => {
  const { enrollInEvent, loading, resetStatus } = useEnrollmentStore();
  const [teamName, setTeamName] = useState('');
  const [members, setMembers] = useState(['']); // Array of roll numbers for team members

  if (!isOpen || !event) return null;

  const isTeamEvent = event.type === 'Team';
  const maxAdditionalMembers = event.maxParticipants - 1; // Excluding the creator

  const handleAddMember = () => {
    if (members.length < maxAdditionalMembers) {
      setMembers([...members, '']);
    } else {
      toast.error(`Maximum ${event.maxParticipants} members allowed per team.`);
    }
  };

  const handleRemoveMember = (index) => {
    const newMembers = members.filter((_, i) => i !== index);
    setMembers(newMembers);
  };

  const handleMemberChange = (index, value) => {
    const newMembers = [...members];
    newMembers[index] = value;
    setMembers(newMembers);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isTeamEvent && !teamName.trim()) {
      toast.error('Team name is required');
      return;
    }

    // Filter out empty roll numbers if any
    const filteredMembers = members.filter(m => m.trim() !== '');

    const enrollmentData = {
      event: event._id,
      type: event.type,
      teamName: isTeamEvent ? teamName : undefined,
      members: isTeamEvent ? filteredMembers : undefined
    };

    try {
      await enrollInEvent(enrollmentData);
      toast.success('Successfully enrolled in the event!');
      onClose();
      // Reset state
      setTeamName('');
      setMembers(['']);
      resetStatus();
    } catch (error) {
      toast.error(error.message || 'Enrollment failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="w-full max-w-lg bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="relative p-6 border-b border-white/5 bg-linear-to-r from-indigo-500/10 to-violet-500/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-500/20 rounded-xl text-indigo-400">
                {isTeamEvent ? <Users size={20} /> : <UserPlus size={20} />}
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Event Enrollment</h2>
                <p className="text-xs text-slate-400 mt-0.5">{event.title}</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-full transition-all"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
          {isTeamEvent ? (
            <>
              {/* Team Name */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300 ml-1">Team Name</label>
                <input
                  type="text"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="Enter a catchy name..."
                  className="w-full bg-slate-800/50 border border-slate-700/50 rounded-2xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                  required
                />
              </div>

              {/* Team Members */}
              <div className="space-y-3">
                <div className="flex items-center justify-between ml-1">
                  <label className="text-sm font-medium text-slate-300">Team Members (Roll Numbers)</label>
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                    {members.length + 1} / {event.maxParticipants}
                  </span>
                </div>
                
                <div className="p-3 bg-slate-800/30 rounded-2xl border border-slate-700/30 space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-indigo-600/10 border border-indigo-500/20 rounded-xl">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400 text-xs font-bold">
                      YOU
                    </div>
                    <span className="text-sm text-indigo-200">Team Leader</span>
                  </div>

                  <AnimatePresence>
                    {members.map((member, index) => (
                      <motion.div 
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        className="flex gap-2"
                      >
                        <input
                          type="text"
                          value={member}
                          onChange={(e) => handleMemberChange(index, e.target.value)}
                          placeholder={`Member #${index + 2} Roll No`}
                          className="flex-1 bg-slate-800/80 border border-slate-700/50 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveMember(index)}
                          className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {members.length < maxAdditionalMembers && (
                    <button
                      type="button"
                      onClick={handleAddMember}
                      className="w-full py-2.5 flex items-center justify-center gap-2 text-xs font-semibold text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/5 border border-dashed border-indigo-500/30 rounded-xl transition-all group"
                    >
                      <Plus size={14} className="group-hover:rotate-90 transition-transform" />
                      Add Member
                    </button>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="py-8 text-center space-y-4">
              <div className="w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto border border-indigo-500/20">
                <CheckCircle size={40} className="text-indigo-400" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white">Ready to join?</h3>
                <p className="text-sm text-slate-400 max-w-[280px] mx-auto">
                  You are about to enroll in <span className="text-indigo-300 font-medium">"{event.title}"</span> as an individual participant.
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-slate-800/50 hover:bg-slate-800 text-slate-300 rounded-2xl font-semibold transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-2 px-6 py-3 bg-linear-to-r from-indigo-600 to-violet-600 text-white rounded-2xl font-bold shadow-xl shadow-indigo-500/20 hover:shadow-indigo-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 disabled:translate-y-0 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Processing...
                </>
              ) : (
                'Confirm Enrollment'
              )}
            </button>
          </div>
        </form>

        {/* Footer info */}
        <div className="p-4 bg-slate-950/50 border-t border-white/5 text-center">
          <p className="text-[10px] text-slate-500 uppercase tracking-widest flex items-center justify-center gap-2">
            <AlertCircle size={10} /> Limited slots available per event
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default EnrollmentModal;
