import React, { useState } from 'react';
import { Users, Plus, Trash2, X } from 'lucide-react';
import { Button } from '@heroui/react';
import { ArenaTeam } from '../../../../store/useEventArenaStore';

export interface ArenaTeamsTabProps {
  eventId: string;
  arenaTeams: ArenaTeam[];
  canManageSelected: boolean;
  actionLoading: boolean;
  createArenaTeam: (eventId: string, data: { name: string; memberUserIds: string[] }) => Promise<any>;
  deleteArenaTeam: (eventId: string, teamId: string) => Promise<any>;
  assignArenaTeamMembers: (eventId: string, teamId: string, data: { memberUserIds: string[] }) => Promise<any>;
}

export const ArenaTeamsTab: React.FC<ArenaTeamsTabProps> = ({
  eventId,
  arenaTeams,
  canManageSelected,
  actionLoading,
  createArenaTeam,
  deleteArenaTeam,
  assignArenaTeamMembers,
}) => {
  const [teamNameInput, setTeamNameInput] = useState('');
  const [deletingTeamId, setDeletingTeamId] = useState<string | null>(null);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 border border-blue-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
            <Users size={20} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-label-primary flex items-center gap-2">
              <span>Arena Teams & Manual Allocation</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-blue-500/20 text-blue-300 border border-blue-500/30">
                {arenaTeams.length} Teams
              </span>
            </h4>
            <p className="text-xs text-text-muted mt-0.5">
              Manually form teams and assign participants for team-mode arena rounds.
            </p>
          </div>
        </div>
      </div>

      {/* Create Team Form */}
      {canManageSelected && (
        <div className="p-5 rounded-2xl bg-white/[0.02] border border-separator space-y-4">
          <h4 className="text-xs font-bold text-label-primary flex items-center gap-2">
            <Plus size={14} className="text-blue-400" />
            <span>Create New Team</span>
          </h4>

          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={teamNameInput}
              onChange={(e) => setTeamNameInput(e.target.value)}
              placeholder="Enter team name (e.g. Code Phoenix, DevSquad)..."
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-surface-secondary border border-separator text-xs text-label-primary placeholder-label-tertiary outline-none focus:border-blue-500"
            />
            <Button
              type="button"
              size="sm"
              color="primary"
              variant="solid"
              isDisabled={actionLoading || !teamNameInput.trim()}
              isLoading={actionLoading}
              startContent={!actionLoading ? <Plus size={13} /> : undefined}
              onPress={async () => {
                if (!teamNameInput.trim()) return;
                await createArenaTeam(eventId, {
                  name: teamNameInput.trim(),
                  memberUserIds: [],
                });
                setTeamNameInput('');
              }}
              className="px-5 py-2.5 min-h-[40px] rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/30 cursor-pointer"
            >
              Create Team
            </Button>
          </div>
        </div>
      )}

      {/* Existing Teams List */}
      {arenaTeams.length === 0 ? (
        <div className="p-8 rounded-2xl bg-white/[0.02] border border-separator text-center space-y-2">
          <Users size={28} className="mx-auto text-label-primary /30" />
          <h4 className="text-sm font-bold text-label-primary ">No Teams Formed Yet</h4>
          <p className="text-xs text-text-muted max-w-sm mx-auto">
            Create teams above to assign participants. Students in team-mode rounds will share submissions and scoring.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {arenaTeams.map((team) => (
            <div
              key={team._id}
              className="p-4 rounded-2xl bg-white/[0.02] border border-separator space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-blue-500/15 text-blue-400 flex items-center justify-center">
                    <Users size={16} />
                  </span>
                  <div>
                    <h5 className="text-sm font-bold text-label-primary ">{team.name}</h5>
                    <p className="text-[10px] text-label-primary /50">{team.members.length} members</p>
                  </div>
                </div>

                {canManageSelected && (
                  <Button
                    isIconOnly
                    size="sm"
                    variant="light"
                    color="danger"
                    isLoading={deletingTeamId === team._id}
                    isDisabled={deletingTeamId === team._id}
                    onPress={async () => {
                      if (confirm(`Delete team "${team.name}"?`)) {
                        setDeletingTeamId(team._id);
                        try {
                          await deleteArenaTeam(eventId, team._id);
                        } finally {
                          setDeletingTeamId(null);
                        }
                      }
                    }}
                    className="min-w-unit-7 w-7 h-7 rounded-lg text-label-primary/40 hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                    title="Delete team"
                  >
                    <Trash2 size={14} />
                  </Button>
                )}
              </div>

              {/* Member List */}
              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {team.members.length === 0 ? (
                  <p className="text-[11px] text-label-primary /40 italic">No members assigned yet.</p>
                ) : (
                  team.members.map((mem) => (
                    <div
                      key={mem._id}
                      className="flex items-center justify-between p-2 rounded-xl bg-white/5 text-xs text-label-secondary"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-5 h-5 rounded-full overflow-hidden bg-white/10 shrink-0">
                          <img
                            src={mem.profilePicUrl || `https://ui-avatars.com/api/?name=${mem.name}&size=40`}
                            alt={mem.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <span className="truncate font-semibold text-[11px]">{mem.name}</span>
                        {mem.rollNo && (
                          <span className="text-[10px] text-label-primary /40 font-mono">({mem.rollNo})</span>
                        )}
                      </div>

                      {canManageSelected && (
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          color="danger"
                          onPress={() => {
                            const remaining = team.members
                              .filter((m) => m._id !== mem._id)
                              .map((m) => m._id);
                            assignArenaTeamMembers(eventId, team._id, {
                              memberUserIds: remaining,
                            });
                          }}
                          className="min-w-unit-6 w-5 h-5 rounded-md text-label-primary/40 hover:text-rose-400 p-0 cursor-pointer"
                          title="Remove member"
                        >
                          <X size={12} />
                        </Button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default React.memo(ArenaTeamsTab);
