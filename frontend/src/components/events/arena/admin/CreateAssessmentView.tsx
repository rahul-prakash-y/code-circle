import React, { useState, useMemo, memo } from 'react';
import { Plus, Clock, Sparkles, Calendar, Users, Search, Check } from 'lucide-react';
import { Button } from '@heroui/react';
import { toast } from 'react-hot-toast';
import HeroUISelect from '../../../ui/HeroUISelect';
import { HeroDateTimePicker } from '@/components/ui/hero/HeroDateTimePicker';
import { parseISTInputToISO, formatISTDateTime } from '../../../../lib/dateUtils';
import { ArenaAdminCandidate } from '../../../../store/useEventArenaStore';

export interface CreateAssessmentPayload {
  title: string;
  description: string;
  type: 'CODING' | 'MCQ' | 'HYBRID' | 'UI_UX';
  durationMinutes: number;
  startTime?: string;
  endTime?: string;
  passingPercentage: number;
  assignedAdmins: string[];
  qualificationCutoffRank: number;
  isTeamMode: boolean;
  teamSize: number;
}

interface CreateAssessmentViewProps {
  adminCandidates: ArenaAdminCandidate[];
  isSuperAdmin: boolean;
  actionLoading: boolean;
  onCreate: (payload: CreateAssessmentPayload) => Promise<void>;
  onCancel: () => void;
}

export const CreateAssessmentView: React.FC<CreateAssessmentViewProps> = memo(({
  adminCandidates,
  isSuperAdmin,
  actionLoading,
  onCreate,
  onCancel,
}) => {
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newType, setNewType] = useState<'CODING' | 'MCQ' | 'HYBRID' | 'UI_UX'>('HYBRID');
  const [newDuration, setNewDuration] = useState(60);
  const [newStartTime, setNewStartTime] = useState('');
  const [newPassingScore, setNewPassingScore] = useState(50);
  const [newAssignedAdminIds, setNewAssignedAdminIds] = useState<string[]>([]);
  const [newCutoffRank, setNewCutoffRank] = useState(0);
  const [newIsTeamMode, setNewIsTeamMode] = useState(false);
  const [newTeamSize, setNewTeamSize] = useState(2);
  const [adminSearch, setAdminSearch] = useState('');

  const filteredCandidates = useMemo(() => {
    if (!adminSearch.trim()) return adminCandidates;
    const q = adminSearch.toLowerCase();
    return adminCandidates.filter((cand) =>
      cand.name.toLowerCase().includes(q) ||
      cand.email.toLowerCase().includes(q) ||
      (cand.rollNo && cand.rollNo.toLowerCase().includes(q))
    );
  }, [adminCandidates, adminSearch]);

  const toggleAdmin = (candId: string) => {
    if (!isSuperAdmin) return;
    setNewAssignedAdminIds((prev) =>
      prev.includes(candId) ? prev.filter((id) => id !== candId) : [...prev, candId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      return toast.error('Please enter an assessment title');
    }
    const startTimeISO = newStartTime ? parseISTInputToISO(newStartTime) : undefined;
    let endTimeISO: string | undefined = undefined;
    if (startTimeISO) {
      const sTime = new Date(startTimeISO).getTime();
      endTimeISO = new Date(sTime + Number(newDuration) * 60 * 1000).toISOString();
    }

    await onCreate({
      title: newTitle.trim(),
      description: newDesc.trim(),
      type: newType,
      durationMinutes: Number(newDuration),
      startTime: startTimeISO,
      endTime: endTimeISO,
      passingPercentage: Number(newPassingScore),
      assignedAdmins: newAssignedAdminIds,
      qualificationCutoffRank: Number(newCutoffRank) || 0,
      isTeamMode: newIsTeamMode,
      teamSize: Number(newTeamSize) || 2,
    });
  };

  return (
    <div className="flex-1 overflow-y-auto p-3.5 sm:p-6 space-y-5">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-separator">
          <div>
            <h3 className="text-base font-bold text-label-primary flex items-center gap-2">
              <Plus size={16} className="text-emerald-400" />
              <span>Create a New Arena Assessment</span>
            </h3>
            <p className="text-xs text-text-muted mt-0.5">
              Add another round or assessment (e.g. Round 1 MCQ, Round 2 Coding) and assign admins.
            </p>
          </div>
          <Button
            size="sm"
            variant="light"
            onPress={onCancel}
            className="text-xs text-text-muted hover:text-label-primary"
          >
            Cancel
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-label-secondary mb-1.5">
              Assessment Title <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g. Round 1: Screening Test or Coding Finale"
              className="w-full px-3.5 py-2.5 rounded-2xl bg-surface-secondary border border-separator text-xs text-label-primary placeholder-label-tertiary focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-label-secondary uppercase tracking-wider mb-1.5">
              Description
            </label>
            <textarea
              rows={2}
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Short description or guidelines for this assessment..."
              className="w-full px-3.5 py-2.5 rounded-2xl bg-surface-secondary border border-separator text-xs text-label-primary placeholder-label-tertiary focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <HeroUISelect
                label="Assessment Type"
                value={newType}
                onChange={(val) => setNewType(val as any)}
                color="purple"
                options={[
                  { value: 'HYBRID', label: 'Hybrid (MCQ + Coding)', badge: 'Hybrid' },
                  { value: 'MCQ', label: 'MCQ Questions Only', badge: 'MCQ' },
                  { value: 'CODING', label: 'Coding Challenges Only', badge: 'Code' },
                  { value: 'UI_UX', label: 'UI/UX Design (Figma)', badge: 'Design' },
                ]}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-label-secondary uppercase tracking-wider mb-1.5">
                Duration (Minutes)
              </label>
              <input
                type="number"
                min={5}
                value={newDuration}
                onChange={(e) => setNewDuration(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-surface-secondary border border-separator text-xs text-label-primary outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-label-secondary uppercase tracking-wider mb-1.5">
                Passing Score (%)
              </label>
              <input
                type="number"
                min={0}
                max={100}
                value={newPassingScore}
                onChange={(e) => setNewPassingScore(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-surface-secondary border border-separator text-xs text-label-primary outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
              />
            </div>
          </div>

          {/* Schedule & Start Time */}
          <div className="p-4 rounded-2xl bg-surface-secondary/60 border border-separator space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <label className="text-xs font-bold text-label-primary flex items-center gap-1.5">
                <Clock size={14} className="text-purple-400" />
                <span>Assessment Schedule & Auto-Live Trigger</span>
              </label>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                IST (Asia/Kolkata)
              </span>
            </div>

            <HeroDateTimePicker
              label="Test Start Time (IST)"
              value={newStartTime}
              onChange={(val) => setNewStartTime(val)}
              placeholder="Select assessment start date and time..."
              variant="flat"
              className="w-full"
              description="The assessment automatically switches to LIVE 10 minutes before this start time."
            />

            {newStartTime && (
              <div className="p-3 rounded-xl bg-purple-500/5 border border-purple-500/20 text-xs space-y-1.5 font-mono">
                <div className="flex items-center justify-between text-label-primary flex-wrap gap-1">
                  <span className="text-purple-400 flex items-center gap-1">
                    <Sparkles size={12} /> Auto-Live Window:
                  </span>
                  <span className="font-semibold text-emerald-400">
                    {formatISTDateTime(new Date(new Date(parseISTInputToISO(newStartTime)).getTime() - 10 * 60 * 1000))} (10 mins prior)
                  </span>
                </div>
                <div className="flex items-center justify-between text-label-primary flex-wrap gap-1">
                  <span className="text-purple-400 flex items-center gap-1">
                    <Calendar size={12} /> Test Starts:
                  </span>
                  <span className="font-semibold">
                    {formatISTDateTime(parseISTInputToISO(newStartTime))}
                  </span>
                </div>
                <div className="flex items-center justify-between text-label-primary flex-wrap gap-1">
                  <span className="text-purple-400 flex items-center gap-1">
                    <Clock size={12} /> Test Cutoff (Ends):
                  </span>
                  <span className="font-semibold text-rose-400">
                    {formatISTDateTime(new Date(new Date(parseISTInputToISO(newStartTime)).getTime() + Number(newDuration) * 60 * 1000))}
                  </span>
                </div>
                <p className="text-[10px] text-label-tertiary pt-1 border-t border-separator/60 font-sans">
                  Students entering early or late will strictly count down to this cutoff deadline.
                </p>
              </div>
            )}
          </div>

          {/* Qualification Cutoff & Team Mode */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
            <div>
              <label className="block text-xs font-semibold text-label-secondary uppercase tracking-wider mb-1.5">
                Qualify Top Students (Cutoff)
              </label>
              <input
                type="number"
                min={0}
                value={newCutoffRank}
                onChange={(e) => setNewCutoffRank(Number(e.target.value))}
                placeholder="e.g. 80 (0 for all)"
                className="w-full px-3.5 py-2.5 rounded-2xl bg-surface-secondary border border-separator text-xs text-label-primary placeholder-label-tertiary outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
              />
              <p className="text-[10px] text-label-tertiary mt-1">
                Top N from previous round allowed (0 = open to all enrolled).
              </p>
            </div>

            <div>
              <HeroUISelect
                label="Round Mode"
                value={newIsTeamMode ? 'team' : 'individual'}
                onChange={(val) => setNewIsTeamMode(val === 'team')}
                color="purple"
                options={[
                  { value: 'individual', label: 'Individual Participation', badge: 'Solo' },
                  { value: 'team', label: 'Team Mode (Manual Assignment)', badge: 'Team' },
                ]}
              />
            </div>

            {newIsTeamMode && (
              <div>
                <label className="block text-xs font-bold text-label-secondary mb-1.5">Team Size</label>
                <input
                  type="number"
                  min={2}
                  max={10}
                  value={newTeamSize}
                  onChange={(e) => setNewTeamSize(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-separator text-xs text-label-primary outline-none"
                />
              </div>
            )}
          </div>

          {/* Assigned Admins Selector */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-bold text-label-primary flex items-center gap-1.5">
                  <Users size={14} className="text-purple-400" />
                  <span>Assign Assessment Admins</span>
                </label>
                <p className="text-[11px] text-text-muted mt-0.5">
                  Selected admins will have exclusive authority to create and manage questions for this assessment.
                </p>
              </div>
              {isSuperAdmin && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                  SuperAdmin Control
                </span>
              )}
            </div>

            {isSuperAdmin ? (
              <div className="space-y-3 p-4 rounded-xl bg-white/[0.02] border border-separator">
                <div className="relative">
                  <Search
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-label-primary /40"
                  />
                  <input
                    type="text"
                    value={adminSearch}
                    onChange={(e) => setAdminSearch(e.target.value)}
                    placeholder="Search admins by name, email, roll number..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-surface-secondary border border-separator text-xs text-label-primary placeholder-label-tertiary outline-none focus:border-purple-500"
                  />
                </div>

                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                  {filteredCandidates.map((cand) => {
                    const isAssigned = newAssignedAdminIds.includes(cand._id);
                    return (
                      <button
                        type="button"
                        key={cand._id}
                        onClick={() => toggleAdmin(cand._id)}
                        className={`w-full p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 ${
                          isAssigned
                            ? 'bg-purple-500/15 border-purple-500/40 text-label-primary '
                            : 'bg-white/[0.02] border-white/5 hover:border-separator text-label-primary /70'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg overflow-hidden bg-white/10 shrink-0">
                            <img
                              src={
                                cand.profilePicUrl ||
                                `https://ui-avatars.com/api/?name=${cand.name}&background=1D1D1F&color=fff&size=80`
                              }
                              alt={cand.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="text-left">
                            <p className="text-xs font-bold">{cand.name}</p>
                            <p className="text-[10px] text-text-muted">
                              {cand.email} • {cand.role} {cand.department ? `(${cand.department})` : ''}
                            </p>
                          </div>
                        </div>
                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                            isAssigned
                              ? 'bg-purple-600 border-purple-500 text-label-primary '
                              : 'border-separator'
                          }`}
                        >
                          {isAssigned && <Check size={12} />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-white/5 border border-separator text-xs text-text-muted">
                Admin assignment is managed by SuperAdmin.
              </div>
            )}
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <Button
              size="sm"
              variant="flat"
              onPress={onCancel}
              className="rounded-xl text-xs font-bold text-label-secondary hover:text-label-primary"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              color="secondary"
              variant="solid"
              isLoading={actionLoading}
              startContent={<Plus size={14} />}
              className="rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-600/30"
            >
              Create Assessment
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
});

CreateAssessmentView.displayName = 'CreateAssessmentView';
