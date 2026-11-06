import ResponsiveModal from '../ui/ResponsiveModal';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, Plus, Trash2, CheckCircle, AlertCircle, UserPlus, Sliders } from 'lucide-react';
import { Button, Spinner } from '@heroui/react';
import useEnrollmentStore from '../../store/useEnrollmentStore';
import { toast } from 'react-hot-toast';

const EnrollmentModal = ({ isOpen, onClose, event }) => {
  const { enrollInEvent, loading, resetStatus } = useEnrollmentStore();
  const [teamName, setTeamName] = useState('');
  const [members, setMembers] = useState(['']); // Array of roll numbers for team members
  const [customResponses, setCustomResponses] = useState({});

  if (!isOpen || !event) return null;

  const isDuoEvent = event.format === 'Duo';
  const isSquadEvent = event.format === 'Team' || event.type === 'Team';
  const isTeamEvent = isDuoEvent || isSquadEvent;
  const maxTeamSize = isDuoEvent ? 2 : (event.maxTeamSize || 4);
  const maxAdditionalMembers = isDuoEvent ? 1 : Math.max(0, maxTeamSize - 1); // Excluding creator

  const remainingSpots =
    event.maxParticipants > 0
      ? Math.max(0, event.maxParticipants - (event.enrolledCount || 0))
      : null;
  const isFull = remainingSpots !== null && remainingSpots <= 0;

  const handleAddMember = () => {
    if (members.length < maxAdditionalMembers) {
      setMembers([...members, '']);
    } else {
      toast.error(
        isDuoEvent
          ? 'Duo format allows exactly 1 partner (2 members total).'
          : `Maximum ${maxTeamSize} members allowed per team.`
      );
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
    
    if (isFull) {
      toast.error('Registration full. This event has reached its maximum participation limit.');
      return;
    }

    if (isTeamEvent && !teamName.trim()) {
      toast.error(isDuoEvent ? 'Duo / Pair name is required' : 'Team name is required');
      return;
    }

    // Filter out empty roll numbers if any
    const filteredMembers = members.filter(m => m && m.trim() !== '');

    const incomingCount = isTeamEvent ? filteredMembers.length + 1 : 1;
    if (remainingSpots !== null && incomingCount > remainingSpots) {
      toast.error(
        remainingSpots === 0
          ? 'Event registration is full.'
          : `Only ${remainingSpots} spot(s) remaining for this event.`
      );
      return;
    }

    if (isDuoEvent && filteredMembers.length !== 1) {
      toast.error('Please provide your Duo partner\'s Roll Number');
      return;
    }

    // Validate required custom fields
    if (event.customFields && event.customFields.length > 0) {
      for (const cf of event.customFields) {
        if (cf.required) {
          const fieldKey = cf.id || cf.label;
          const val = customResponses[fieldKey];
          if (cf.type === 'checkbox') {
            if (!val) {
              toast.error(`Please check the required box: "${cf.label}"`);
              return;
            }
          } else if (val === undefined || val === null || String(val).trim() === '') {
            toast.error(`Please provide an answer for: "${cf.label}"`);
            return;
          }
        }
      }
    }

    const enrollmentData = {
      event: event._id,
      type: isDuoEvent ? 'Duo' : isSquadEvent ? 'Team' : 'Individual',
      teamName: isTeamEvent ? teamName.trim() : undefined,
      members: isTeamEvent ? filteredMembers : undefined,
      customResponses: customResponses,
    };

    try {
      await enrollInEvent(enrollmentData);
      toast.success(isDuoEvent ? 'Successfully enrolled with your Duo partner!' : 'Successfully enrolled in the event!');
      onClose();
      // Reset state
      setTeamName('');
      setMembers(['']);
      setCustomResponses({});
      resetStatus();
    } catch (error) {
      toast.error(error.message || 'Enrollment failed');
    }
  };

  return (
    <ResponsiveModal
      open={isOpen && Boolean(event)}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-accent/10 text-accent flex items-center justify-center">
            {isTeamEvent ? <Users className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
          </div>
          <span>Event Enrollment</span>
        </div>
      }
      description={event?.title || 'Register for event'}
      dialogClassName="sm:max-w-lg p-6"
    >
      <div className="space-y-4 pt-2">
        <form onSubmit={handleSubmit} className="space-y-4">
          {event.maxParticipants > 0 && (
            <div
              className={`p-3.5 rounded-2xl flex items-center justify-between text-xs border ${
                isFull
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                  : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-300'
              }`}
            >
              <span className="font-semibold flex items-center gap-1.5">
                <Users size={14} /> Student Registration Capacity:
              </span>
              <span className="font-mono font-bold">
                {isFull
                  ? 'Registration Full'
                  : `${remainingSpots} spot(s) remaining (${event.enrolledCount || 0}/${event.maxParticipants})`}
              </span>
            </div>
          )}

          {isTeamEvent ? (
            <>
              {/* Team Name */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-secondary ml-1">
                  {isDuoEvent ? 'Duo / Pair Name *' : 'Team Name *'}
                </label>
                <input
                  type="text"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder={isDuoEvent ? 'e.g. Dynamic Duo' : 'Enter a catchy name...'}
                  className="w-full bg-surface-elevated/50 border border-slate-700/50 rounded-2xl px-4 py-3 text-text-primary placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                  required
                />
              </div>

              {/* Team Members */}
              <div className="space-y-3">
                <div className="flex items-center justify-between ml-1">
                  <label className="text-sm font-medium text-text-secondary">
                    {isDuoEvent ? 'Partner Information (Roll Number)' : 'Team Members (Roll Numbers)'}
                  </label>
                  <span className="text-[10px] uppercase tracking-wider text-text-muted font-bold">
                    {members.length + 1} / {maxTeamSize}
                  </span>
                </div>
                
                <div className="p-3 bg-surface-elevated/30 rounded-2xl border border-slate-700/30 space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-indigo-600/10 border border-indigo-500/20 rounded-xl">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400 text-xs font-bold">
                      YOU
                    </div>
                    <span className="text-sm text-indigo-200">
                      {isDuoEvent ? 'Creator / Lead' : 'Team Leader'}
                    </span>
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
                          placeholder={isDuoEvent ? "Partner's Roll No (e.g. 21CS042)" : `Member #${index + 2} Roll No`}
                          className="flex-1 bg-surface-elevated/80 border border-slate-700/50 rounded-xl px-4 py-2 text-sm text-text-primary focus:outline-none focus:border-indigo-500 transition-all"
                          required
                        />
                        <Button
                          type="button"
                          variant="danger"
                          isIconOnly
                          size="sm"
                          onPress={() => handleRemoveMember(index)}
                          className="rounded-xl"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {members.length < maxAdditionalMembers && (
                    <Button
                      type="button"
                      variant="secondary"
                      onPress={handleAddMember}
                      className="w-full py-2.5 flex items-center justify-center gap-2 text-xs font-semibold border border-dashed rounded-xl group"
                    >
                      <Plus size={14} className="group-hover:rotate-90 transition-transform" />
                      Add Member
                    </Button>
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
                <h3 className="text-lg font-bold text-text-primary">Ready to join?</h3>
                <p className="text-sm text-text-muted max-w-[280px] mx-auto">
                  You are about to enroll in <span className="text-indigo-300 font-medium">"{event.title}"</span> as an individual participant.
                </p>
              </div>
            </div>
          )}

          {/* Custom Questions / Options Section */}
          {event.customFields && event.customFields.length > 0 && (
            <div className="space-y-3 pt-3 border-t border-border/80">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-indigo-500/15 text-indigo-400 flex items-center justify-center">
                  <Sliders size={13} />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-text-primary">
                    Required Information & Details
                  </h4>
                  <p className="text-[10px] text-text-muted">
                    Please provide the requested details for this event
                  </p>
                </div>
              </div>

              <div className="space-y-3 bg-surface/60 p-4 rounded-2xl border border-border/80">
                {event.customFields.map((field) => {
                  const fieldKey = field.id || field.label;
                  return (
                    <div key={fieldKey} className="space-y-1.5">
                      <label className="text-xs font-semibold text-text-secondary flex items-center justify-between">
                        <span>
                          {field.label} {field.required && <span className="text-rose-400">*</span>}
                        </span>
                        {field.required && (
                          <span className="text-[9px] text-rose-400 font-bold uppercase px-1.5 py-0.5 rounded bg-rose-500/10 border border-rose-500/20">
                            Required
                          </span>
                        )}
                      </label>

                      {field.type === 'select' ? (
                        <select
                          value={customResponses[fieldKey] || ''}
                          onChange={(e) => setCustomResponses(prev => ({ ...prev, [fieldKey]: e.target.value }))}
                          required={field.required}
                          className="w-full bg-surface-elevated/90 border border-slate-700/60 rounded-xl px-3.5 py-2.5 text-xs text-text-primary focus:outline-none focus:border-indigo-500 transition-all cursor-pointer"
                        >
                          <option value="">{field.placeholder || '-- Select an option --'}</option>
                          {(field.options || []).map((opt, i) => (
                            <option key={i} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      ) : field.type === 'textarea' ? (
                        <textarea
                          value={customResponses[fieldKey] || ''}
                          onChange={(e) => setCustomResponses(prev => ({ ...prev, [fieldKey]: e.target.value }))}
                          placeholder={field.placeholder || 'Type your response here...'}
                          required={field.required}
                          rows={2}
                          className="w-full bg-surface-elevated/90 border border-slate-700/60 rounded-xl px-3.5 py-2 text-xs text-text-primary placeholder-text-muted/60 focus:outline-none focus:border-indigo-500 transition-all resize-none"
                        />
                      ) : field.type === 'checkbox' ? (
                        <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-surface-elevated/50 border border-border/70 hover:border-border transition-colors cursor-pointer">
                          <input
                            type="checkbox"
                            checked={!!customResponses[fieldKey]}
                            onChange={(e) => setCustomResponses(prev => ({ ...prev, [fieldKey]: e.target.checked }))}
                            className="w-4 h-4 rounded text-indigo-500 bg-surface border-border focus:ring-0 cursor-pointer"
                          />
                          <span className="text-xs text-text-primary font-medium select-none">
                            {field.placeholder || 'I confirm / agree'}
                          </span>
                        </label>
                      ) : (
                        <input
                          type={field.type === 'number' ? 'number' : 'text'}
                          value={customResponses[fieldKey] || ''}
                          onChange={(e) => setCustomResponses(prev => ({ ...prev, [fieldKey]: e.target.value }))}
                          placeholder={field.placeholder || 'Enter your response...'}
                          required={field.required}
                          className="w-full bg-surface-elevated/90 border border-slate-700/60 rounded-xl px-3.5 py-2 text-xs text-text-primary placeholder-text-muted/60 focus:outline-none focus:border-indigo-500 transition-all"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-4 border-t border-separator flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onPress={onClose}
              className="px-4 py-2 rounded-full text-xs font-medium"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isDisabled={loading || isFull}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-xs font-semibold shadow"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <Spinner size="sm" color="default" />
                  <span>Processing...</span>
                </div>
              ) : isFull ? (
                'Registration Full'
              ) : (
                'Confirm Enrollment'
              )}
            </Button>
          </div>
        </form>
      </div>
    </ResponsiveModal>
  );
};

export default EnrollmentModal;
