import React, { useState, useEffect, useMemo, memo } from 'react';
import { Crown, Search, Check, Trash2, CheckCircle2, Clock, Sparkles, Calendar } from 'lucide-react';
import { Button } from '@heroui/react';
import HeroUISelect from '../../../ui/HeroUISelect';
import { HeroDateTimePicker } from '@/components/ui/hero/HeroDateTimePicker';
import { formatDateToISTInput, parseISTInputToISO, formatISTDateTime } from '../../../../lib/dateUtils';
import { ArenaAssessment, ArenaAdminCandidate } from '../../../../store/useEventArenaStore';

export interface SaveAssessmentConfigPayload {
  title: string;
  description: string;
  type: 'CODING' | 'MCQ' | 'HYBRID' | 'UI_UX';
  status: 'DRAFT' | 'UPCOMING' | 'LIVE' | 'ENDED';
  durationMinutes: number;
  totalPoints?: number;
  startTime?: string;
  endTime?: string;
  passingPercentage: number;
  qualificationCutoffRank: number;
  isTeamMode: boolean;
  teamSize: number;
  assignedAdmins?: string[];
}

interface AssessmentSettingsTabProps {
  selectedAssessment: ArenaAssessment;
  adminCandidates: ArenaAdminCandidate[];
  isSuperAdmin: boolean;
  canManageSelected: boolean;
  actionLoading: boolean;
  isDeletingAssessment: boolean;
  onSave: (payload: SaveAssessmentConfigPayload) => Promise<void>;
  onDelete: () => Promise<void>;
}

export const AssessmentSettingsTab: React.FC<AssessmentSettingsTabProps> = memo(({
  selectedAssessment,
  adminCandidates,
  isSuperAdmin,
  canManageSelected,
  actionLoading,
  isDeletingAssessment,
  onSave,
  onDelete,
}) => {
  const [editTitle, setEditTitle] = useState(selectedAssessment.title || '');
  const [editDesc, setEditDesc] = useState(selectedAssessment.description || '');
  const [editType, setEditType] = useState<'CODING' | 'MCQ' | 'HYBRID' | 'UI_UX'>(selectedAssessment.type || 'HYBRID');
  const [editStatus, setEditStatus] = useState<'DRAFT' | 'UPCOMING' | 'LIVE' | 'ENDED'>(selectedAssessment.status || 'LIVE');
  const [editDuration, setEditDuration] = useState(selectedAssessment.durationMinutes || 60);
  const [editTotalPoints, setEditTotalPoints] = useState<number>(selectedAssessment.totalPoints || 100);
  const [editStartTime, setEditStartTime] = useState(
    selectedAssessment.startTime ? formatDateToISTInput(selectedAssessment.startTime) : ''
  );
  const [editPassingScore, setEditPassingScore] = useState(selectedAssessment.passingPercentage || 50);
  const [editAssignedAdminIds, setEditAssignedAdminIds] = useState<string[]>([]);
  const [editCutoffRank, setEditCutoffRank] = useState(selectedAssessment.qualificationCutoffRank || 0);
  const [editIsTeamMode, setEditIsTeamMode] = useState(Boolean(selectedAssessment.isTeamMode));
  const [editTeamSize, setEditTeamSize] = useState(selectedAssessment.teamSize || 2);
  const [adminSearch, setAdminSearch] = useState('');

  const questionsSumPoints = useMemo(() => {
    const mcqPts = (selectedAssessment.questions?.mcqs || []).reduce((sum, q: any) => sum + (q.points || 10), 0);
    const codePts = (selectedAssessment.questions?.coding || []).reduce((sum, p: any) => sum + (p.points || 30), 0);
    return mcqPts + codePts;
  }, [selectedAssessment.questions]);

  // Sync state whenever selectedAssessment._id changes
  useEffect(() => {
    setEditTitle(selectedAssessment.title || '');
    setEditDesc(selectedAssessment.description || '');
    setEditType(selectedAssessment.type || 'HYBRID');
    setEditStatus(selectedAssessment.status || 'LIVE');
    setEditDuration(selectedAssessment.durationMinutes || 60);
    setEditTotalPoints(selectedAssessment.totalPoints || 100);
    setEditStartTime(selectedAssessment.startTime ? formatDateToISTInput(selectedAssessment.startTime) : '');
    setEditPassingScore(selectedAssessment.passingPercentage || 50);
    setEditCutoffRank(selectedAssessment.qualificationCutoffRank || 0);
    setEditIsTeamMode(Boolean(selectedAssessment.isTeamMode));
    setEditTeamSize(selectedAssessment.teamSize || 2);

    const assigned = (selectedAssessment.assignedAdmins || []).map((adm: any) =>
      adm?._id ? adm._id.toString() : adm.toString()
    );
    setEditAssignedAdminIds(assigned);
  }, [selectedAssessment._id, selectedAssessment.totalPoints]);

  const filteredCandidates = useMemo(() => {
    if (!adminSearch.trim()) return adminCandidates;
    const q = adminSearch.toLowerCase();
    return adminCandidates.filter((cand) =>
      cand.name.toLowerCase().includes(q) ||
      cand.email.toLowerCase().includes(q) ||
      (cand.rollNo && cand.rollNo.toLowerCase().includes(q))
    );
  }, [adminCandidates, adminSearch]);

  const toggleEditAdmin = (candId: string) => {
    if (!isSuperAdmin) return;
    setEditAssignedAdminIds((prev) =>
      prev.includes(candId) ? prev.filter((id) => id !== candId) : [...prev, candId]
    );
  };

  const handleSave = async () => {
    const startTimeISO = editStartTime ? parseISTInputToISO(editStartTime) : undefined;
    let endTimeISO: string | undefined = undefined;
    if (startTimeISO) {
      const sTime = new Date(startTimeISO).getTime();
      endTimeISO = new Date(sTime + Number(editDuration) * 60 * 1000).toISOString();
    }

    await onSave({
      title: editTitle.trim(),
      description: editDesc.trim(),
      type: editType,
      status: editStatus,
      durationMinutes: Number(editDuration),
      totalPoints: Number(editTotalPoints) || 100,
      startTime: startTimeISO,
      endTime: endTimeISO,
      passingPercentage: Number(editPassingScore),
      qualificationCutoffRank: Number(editCutoffRank) || 0,
      isTeamMode: editIsTeamMode,
      teamSize: Number(editTeamSize) || 2,
      assignedAdmins: isSuperAdmin ? editAssignedAdminIds : undefined,
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="p-5 rounded-2xl bg-white/[0.02] border border-separator space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-separator">
          <div>
            <h3 className="text-sm font-bold text-label-primary ">Assessment Information</h3>
            <p className="text-xs text-text-muted mt-0.5">
              Configure title, type, duration and passing criteria
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-full text-[11px] font-mono bg-purple-500/10 text-purple-400 border border-purple-500/20">
            {editTotalPoints || selectedAssessment.totalPoints || 100} Points Total Max
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-label-secondary mb-1.5">Assessment Title</label>
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              disabled={!canManageSelected}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-separator text-xs text-label-primary outline-none focus:border-purple-500 disabled:opacity-50"
            />
          </div>
          <div>
            <HeroUISelect
              label="Status"
              value={editStatus}
              onChange={(val) => setEditStatus(val as any)}
              disabled={!canManageSelected}
              color="purple"
              options={[
                { value: 'LIVE', label: 'Live (Open for students)', badge: 'Live' },
                { value: 'UPCOMING', label: 'Upcoming', badge: 'Upcoming' },
                { value: 'DRAFT', label: 'Draft', badge: 'Draft' },
                { value: 'ENDED', label: 'Ended', badge: 'Ended' },
              ]}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-label-secondary uppercase tracking-wider mb-1.5">Description</label>
          <textarea
            rows={2}
            value={editDesc}
            onChange={(e) => setEditDesc(e.target.value)}
            disabled={!canManageSelected}
            className="w-full px-3.5 py-2.5 rounded-2xl bg-surface-secondary border border-separator text-xs text-label-primary outline-none resize-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 disabled:opacity-50"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <HeroUISelect
              label="Type"
              value={editType}
              onChange={(val) => setEditType(val as any)}
              disabled={!canManageSelected}
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
            <label className="block text-xs font-semibold text-label-secondary uppercase tracking-wider mb-1.5">Duration (Mins)</label>
            <input
              type="number"
              min={5}
              value={editDuration}
              onChange={(e) => setEditDuration(Number(e.target.value))}
              disabled={!canManageSelected}
              className="w-full px-3.5 py-2.5 rounded-2xl bg-surface-secondary border border-separator text-xs text-label-primary outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 disabled:opacity-50"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-label-secondary uppercase tracking-wider">
                Total Max Score
              </label>
              {questionsSumPoints > 0 && questionsSumPoints !== editTotalPoints && (
                <button
                  type="button"
                  onClick={() => setEditTotalPoints(questionsSumPoints)}
                  className="text-[10px] text-purple-400 hover:text-purple-300 font-semibold cursor-pointer underline"
                  title={`Auto-fill from questions sum (${questionsSumPoints} pts)`}
                >
                  Use {questionsSumPoints} pts
                </button>
              )}
            </div>
            <div className="relative">
              <input
                type="number"
                min={1}
                value={editTotalPoints}
                onChange={(e) => setEditTotalPoints(Math.max(1, Number(e.target.value)))}
                disabled={!canManageSelected}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-surface-secondary border border-separator text-xs text-label-primary outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 disabled:opacity-50 font-mono"
                placeholder="100"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[11px] font-mono text-label-tertiary pointer-events-none">
                Pts
              </span>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-label-secondary uppercase tracking-wider mb-1.5">Passing %</label>
            <input
              type="number"
              min={0}
              max={100}
              value={editPassingScore}
              onChange={(e) => setEditPassingScore(Number(e.target.value))}
              disabled={!canManageSelected}
              className="w-full px-3.5 py-2.5 rounded-2xl bg-surface-secondary border border-separator text-xs text-label-primary outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 disabled:opacity-50"
            />
          </div>
        </div>

        {/* Schedule & Timing in Edit */}
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
            value={editStartTime}
            onChange={(val) => setEditStartTime(val)}
            disabled={!canManageSelected}
            placeholder="Select assessment start date and time..."
            variant="flat"
            className="w-full"
            description="Assessment automatically switches to LIVE 10 minutes prior to start time."
          />

          {editStartTime && (
            <div className="p-3 rounded-xl bg-purple-500/5 border border-purple-500/20 text-xs space-y-1.5 font-mono">
              <div className="flex items-center justify-between text-label-primary flex-wrap gap-1">
                <span className="text-purple-400 flex items-center gap-1">
                  <Sparkles size={12} /> Auto-Live Window:
                </span>
                <span className="font-semibold text-emerald-400">
                  {formatISTDateTime(new Date(new Date(parseISTInputToISO(editStartTime)).getTime() - 10 * 60 * 1000))} (10 mins prior)
                </span>
              </div>
              <div className="flex items-center justify-between text-label-primary flex-wrap gap-1">
                <span className="text-purple-400 flex items-center gap-1">
                  <Calendar size={12} /> Test Starts:
                </span>
                <span className="font-semibold">
                  {formatISTDateTime(parseISTInputToISO(editStartTime))}
                </span>
              </div>
              <div className="flex items-center justify-between text-label-primary flex-wrap gap-1">
                <span className="text-purple-400 flex items-center gap-1">
                  <Clock size={12} /> Test Cutoff (Ends):
                </span>
                <span className="font-semibold text-rose-400">
                  {formatISTDateTime(new Date(new Date(parseISTInputToISO(editStartTime)).getTime() + Number(editDuration) * 60 * 1000))}
                </span>
              </div>
              <p className="text-[10px] text-label-tertiary pt-1 border-t border-separator/60 font-sans">
                Students entering early or late will strictly count down to this cutoff deadline.
              </p>
            </div>
          )}
        </div>

        {/* Cutoff & Team Mode Configuration */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
          <div>
            <label className="block text-xs font-semibold text-label-secondary uppercase tracking-wider mb-1.5">
              Top Rank Cutoff (Next Round)
            </label>
            <input
              type="number"
              min={0}
              value={editCutoffRank}
              onChange={(e) => setEditCutoffRank(Number(e.target.value))}
              disabled={!canManageSelected}
              placeholder="e.g. 80 (0 for no limit)"
              className="w-full px-3.5 py-2.5 rounded-2xl bg-surface-secondary border border-separator text-xs text-label-primary placeholder-label-tertiary outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 disabled:opacity-50"
            />
            <p className="text-[10px] text-label-tertiary mt-1">
              Only top {editCutoffRank || 0} students from previous round attend.
            </p>
          </div>

          <div>
            <HeroUISelect
              label="Round Mode"
              value={editIsTeamMode ? 'team' : 'individual'}
              onChange={(val) => setEditIsTeamMode(val === 'team')}
              disabled={!canManageSelected}
              color="purple"
              options={[
                { value: 'individual', label: 'Individual Participation', badge: 'Solo' },
                { value: 'team', label: 'Team Mode (Manual Allocation)', badge: 'Team' },
              ]}
            />
          </div>

          {editIsTeamMode && (
            <div>
              <label className="block text-xs font-bold text-label-secondary mb-1.5">Team Size</label>
              <input
                type="number"
                min={2}
                max={10}
                value={editTeamSize}
                onChange={(e) => setEditTeamSize(Number(e.target.value))}
                disabled={!canManageSelected}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-separator text-xs text-label-primary outline-none disabled:opacity-50"
              />
            </div>
          )}
        </div>
      </div>

      {/* Assigned Admins for this Assessment */}
      <div className="p-5 rounded-2xl bg-white/[0.02] border border-separator space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-separator">
          <div>
            <h3 className="text-sm font-bold text-label-primary flex items-center gap-2">
              <Crown size={15} className="text-amber-400" />
              <span>Assigned Assessment Admins</span>
            </h3>
            <p className="text-xs text-text-muted mt-0.5">
              Admins selected here have exclusive permission to upload questions to this assessment.
            </p>
          </div>
          {isSuperAdmin && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
              SuperAdmin Assigning
            </span>
          )}
        </div>

        {isSuperAdmin ? (
          <div className="space-y-3">
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-label-primary /40"
              />
              <input
                type="text"
                value={adminSearch}
                onChange={(e) => setAdminSearch(e.target.value)}
                placeholder="Search admin name, email, roll number..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-surface-secondary border border-separator text-xs text-label-primary placeholder-label-tertiary outline-none focus:border-purple-500"
              />
            </div>

            <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
              {filteredCandidates.map((cand) => {
                const isAssigned = editAssignedAdminIds.includes(cand._id);
                return (
                  <button
                    type="button"
                    key={cand._id}
                    onClick={() => toggleEditAdmin(cand._id)}
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
          <div className="flex flex-wrap gap-2">
            {(selectedAssessment.assignedAdmins || []).length > 0 ? (
              (selectedAssessment.assignedAdmins || []).map((adm: any) => (
                <div
                  key={adm._id || adm}
                  className="px-3 py-1.5 rounded-xl bg-white/5 border border-separator flex items-center gap-2 text-xs"
                >
                  <div className="w-5 h-5 rounded-full overflow-hidden bg-purple-500/20 shrink-0">
                    <img
                      src={
                        adm.profilePicUrl ||
                        `https://ui-avatars.com/api/?name=${adm.name || 'Admin'}&background=7C3AED&color=fff&size=40`
                      }
                      alt={adm.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="font-semibold text-label-primary ">{adm.name || 'Admin'}</span>
                  <span className="text-[10px] text-text-muted">{adm.role}</span>
                </div>
              ))
            ) : (
              <p className="text-xs text-text-muted italic">No admins specifically assigned yet.</p>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-separator">
        {isSuperAdmin && (
          <Button
            size="sm"
            variant="flat"
            color="danger"
            onPress={onDelete}
            isLoading={isDeletingAssessment}
            isDisabled={isDeletingAssessment}
            startContent={!isDeletingAssessment ? <Trash2 size={13} /> : undefined}
            className="rounded-full text-xs font-semibold"
          >
            Delete Assessment
          </Button>
        )}

        {canManageSelected && (
          <Button
            size="sm"
            variant="solid"
            color="primary"
            isLoading={actionLoading}
            onPress={handleSave}
            startContent={<CheckCircle2 size={13} />}
            className="w-full sm:w-auto ml-auto px-6 rounded-full bg-accent hover:bg-accent-hover text-white text-xs font-semibold shadow-md"
          >
            Save Changes
          </Button>
        )}
      </div>
    </div>
  );
});

AssessmentSettingsTab.displayName = 'AssessmentSettingsTab';
