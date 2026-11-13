import React, { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Layers,
  Plus,
  Settings,
  HelpCircle,
  Code2,
  Palette,
  Users,
  Award,
  ShieldAlert,
  Play,
} from 'lucide-react';
import { Button } from '@heroui/react';
import { ArenaAssessment } from '../../../../store/useEventArenaStore';

export type AssessmentAdminTab = 'settings' | 'mcq' | 'coding' | 'design' | 'teams' | 'submissions' | 'blocked';

interface AssessmentHeaderProps {
  eventId: string;
  assessments: ArenaAssessment[];
  selectedAssessment: ArenaAssessment | null;
  isCreatingNew: boolean;
  activeTab: AssessmentAdminTab;
  blockedCount: number;
  mcqCount: number;
  codingCount: number;
  teamsCount: number;
  submissionsCount: number;
  canManageSelected: boolean;
  onSelectAssessment: (asm: ArenaAssessment) => void;
  onStartCreateNew: () => void;
  onChangeTab: (tab: AssessmentAdminTab) => void;
  onCloseModal: () => void;
}

export const AssessmentHeader: React.FC<AssessmentHeaderProps> = memo(({
  eventId,
  assessments,
  selectedAssessment,
  isCreatingNew,
  activeTab,
  blockedCount,
  mcqCount,
  codingCount,
  teamsCount,
  submissionsCount,
  canManageSelected,
  onSelectAssessment,
  onStartCreateNew,
  onChangeTab,
  onCloseModal,
}) => {
  const navigate = useNavigate();

  return (
    <div className="space-y-3">
      {/* Assessment Switcher Bar */}
      <div className="px-3 sm:px-6 py-2.5 border-b border-separator bg-surface-secondary/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shrink-0 rounded-2xl">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 -mx-1 px-1 sm:mx-0 sm:px-0">
          <span className="text-[11px] font-bold text-label-tertiary uppercase tracking-wider shrink-0 flex items-center gap-1 mr-1">
            <Layers size={13} className="text-purple-500" />
            <span className="hidden sm:inline">Rounds:</span>
          </span>

          {assessments.map((asm) => {
            const isSelected = !isCreatingNew && selectedAssessment?._id === asm._id;
            return (
              <Button
                key={asm._id}
                size="sm"
                variant={isSelected ? 'solid' : 'bordered'}
                color={isSelected ? 'secondary' : 'default'}
                onPress={() => onSelectAssessment(asm)}
                className={`min-h-[36px] rounded-xl text-xs font-semibold shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-purple-600 text-white shadow-sm shadow-purple-600/30'
                    : 'bg-surface hover:bg-surface-secondary text-label-secondary hover:text-label-primary border-separator'
                }`}
                endContent={
                  <span
                    className={`px-1.5 py-0.5 rounded text-[9px] uppercase font-mono font-bold ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-surface-secondary text-label-tertiary'
                    }`}
                  >
                    {asm.type}
                  </span>
                }
              >
                <span className="truncate max-w-[120px] sm:max-w-[150px]">{asm.title}</span>
              </Button>
            );
          })}
        </div>

        <Button
          size="sm"
          variant={isCreatingNew ? 'solid' : 'flat'}
          color="success"
          onPress={onStartCreateNew}
          startContent={<Plus size={14} />}
          className={`min-h-[36px] px-3.5 rounded-full text-xs font-semibold shrink-0 cursor-pointer ${
            isCreatingNew
              ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
              : 'border border-emerald-500/30'
          }`}
        >
          Create Assessment
        </Button>
      </div>

      {/* Selected Assessment Sub-Navigation */}
      {!isCreatingNew && selectedAssessment && (
        <div className="border-b border-separator bg-surface-secondary/30 shrink-0 space-y-2 py-2 px-1 sm:px-4 rounded-xl">
          {/* Row 1: Horizontally Scrollable Tabs with touch momentum */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar px-1 py-0.5">
            <Button
              size="sm"
              variant={activeTab === 'settings' ? 'solid' : 'bordered'}
              color={activeTab === 'settings' ? 'primary' : 'default'}
              onPress={() => onChangeTab('settings')}
              startContent={<Settings size={13} />}
              className={`min-h-[36px] rounded-xl text-xs font-semibold shrink-0 cursor-pointer whitespace-nowrap ${
                activeTab === 'settings'
                  ? 'bg-accent text-white shadow-xs'
                  : 'bg-surface text-label-secondary hover:text-label-primary border-separator'
              }`}
            >
              Config & Admins
            </Button>

            {(selectedAssessment.type === 'MCQ' || selectedAssessment.type === 'HYBRID') && (
              <Button
                size="sm"
                variant={activeTab === 'mcq' ? 'solid' : 'bordered'}
                color={activeTab === 'mcq' ? 'secondary' : 'default'}
                onPress={() => onChangeTab('mcq')}
                startContent={<HelpCircle size={13} />}
                className={`min-h-[36px] rounded-xl text-xs font-semibold shrink-0 cursor-pointer whitespace-nowrap ${
                  activeTab === 'mcq'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-surface text-label-secondary hover:text-label-primary border-separator'
                }`}
              >
                MCQs ({mcqCount})
              </Button>
            )}

            {(selectedAssessment.type === 'CODING' || selectedAssessment.type === 'HYBRID') && (
              <Button
                size="sm"
                variant={activeTab === 'coding' ? 'solid' : 'bordered'}
                color={activeTab === 'coding' ? 'primary' : 'default'}
                onPress={() => onChangeTab('coding')}
                startContent={<Code2 size={13} />}
                className={`min-h-[36px] rounded-xl text-xs font-semibold shrink-0 cursor-pointer whitespace-nowrap ${
                  activeTab === 'coding'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-surface text-label-secondary hover:text-label-primary border-separator'
                }`}
              >
                Coding ({codingCount})
              </Button>
            )}

            {selectedAssessment.type === 'UI_UX' && (
              <Button
                size="sm"
                variant={activeTab === 'design' ? 'solid' : 'bordered'}
                color={activeTab === 'design' ? 'secondary' : 'default'}
                onPress={() => onChangeTab('design')}
                startContent={<Palette size={13} className={activeTab === 'design' ? 'text-white' : 'text-pink-400'} />}
                className={`min-h-[36px] rounded-xl text-xs font-semibold shrink-0 cursor-pointer whitespace-nowrap ${
                  activeTab === 'design'
                    ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-xs'
                    : 'bg-surface text-label-secondary hover:text-label-primary border-separator'
                }`}
              >
                UI/UX Design
              </Button>
            )}

            <Button
              size="sm"
              variant={activeTab === 'teams' ? 'solid' : 'bordered'}
              color={activeTab === 'teams' ? 'primary' : 'default'}
              onPress={() => onChangeTab('teams')}
              startContent={<Users size={13} />}
              className={`min-h-[36px] rounded-xl text-xs font-semibold shrink-0 cursor-pointer whitespace-nowrap ${
                activeTab === 'teams'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-surface text-label-secondary hover:text-label-primary border-separator'
              }`}
            >
              Teams ({teamsCount})
            </Button>

            <Button
              size="sm"
              variant={activeTab === 'submissions' ? 'solid' : 'bordered'}
              color={activeTab === 'submissions' ? 'primary' : 'default'}
              onPress={() => onChangeTab('submissions')}
              startContent={<Award size={13} />}
              className={`min-h-[36px] rounded-xl text-xs font-semibold shrink-0 cursor-pointer whitespace-nowrap ${
                activeTab === 'submissions'
                  ? 'bg-accent text-white shadow-xs'
                  : 'bg-surface text-label-secondary hover:text-label-primary border-separator'
              }`}
            >
              Submissions ({submissionsCount})
            </Button>

            <Button
              size="sm"
              variant={activeTab === 'blocked' ? 'solid' : 'bordered'}
              color={activeTab === 'blocked' ? 'danger' : 'default'}
              onPress={() => onChangeTab('blocked')}
              startContent={<ShieldAlert size={13} className={activeTab === 'blocked' ? 'text-white' : 'text-rose-400'} />}
              className={`min-h-[36px] rounded-xl text-xs font-semibold shrink-0 cursor-pointer whitespace-nowrap ${
                activeTab === 'blocked'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-surface text-label-secondary hover:text-label-primary border-separator'
              }`}
            >
              Blocked Students
              {blockedCount > 0 && (
                <span className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                  activeTab === 'blocked' ? 'bg-black/30 text-white' : 'bg-rose-500/20 text-rose-400'
                }`}>
                  {blockedCount}
                </span>
              )}
            </Button>
          </div>

          {/* Row 2: Status & Quick Meta bar */}
          <div className="flex items-center justify-between px-2 pt-1 border-t border-separator/40 text-xs">
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                selectedAssessment.status === 'LIVE'
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25'
                  : selectedAssessment.status === 'UPCOMING'
                  ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/25'
                  : 'bg-surface-secondary text-label-secondary border border-separator'
              }`}>
                {selectedAssessment.status}
              </span>
              <span className="text-[11px] text-label-tertiary font-mono">
                {selectedAssessment.durationMinutes}m • {selectedAssessment.totalPoints} pts
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                size="sm"
                variant="flat"
                color="secondary"
                startContent={<Play size={12} className="text-purple-400 fill-purple-400" />}
                onPress={() => {
                  onCloseModal();
                  navigate(`/events/${eventId}/arena?assessmentId=${selectedAssessment._id}&preview=true`);
                }}
                className="h-7 px-2.5 rounded-lg text-[11px] font-bold text-purple-300 bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 cursor-pointer shadow-xs"
                title="Enter assessment workspace in Admin Preview Mode"
              >
                Preview Test
              </Button>
              <div className="flex -space-x-1.5 overflow-hidden">
                {(selectedAssessment.assignedAdmins || []).slice(0, 3).map((adm: any) => (
                  <img
                    key={adm._id || adm}
                    title={adm.name || 'Assigned Admin'}
                    src={
                      adm.profilePicUrl ||
                      `https://ui-avatars.com/api/?name=${adm.name || 'Admin'}&background=7C3AED&color=fff&size=60`
                    }
                    className="w-5 h-5 rounded-full border border-separator object-cover"
                  />
                ))}
              </div>
              {canManageSelected ? (
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                  Editor
                </span>
              ) : (
                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                  View
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

AssessmentHeader.displayName = 'AssessmentHeader';
