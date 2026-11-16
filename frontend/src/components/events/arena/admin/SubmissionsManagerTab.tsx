import React, { useState, useMemo, memo } from 'react';
import {
  Trophy,
  Award,
  Download,
  Plus,
  FileSpreadsheet,
  FileText,
  Clock,
  Search,
  X,
  CheckCircle2,
  CheckCircle,
  Eye,
  RotateCcw,
  ShieldCheck,
  Trash2,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { Button, Link } from '@heroui/react';
import { toast } from 'react-hot-toast';
import { useDebounce } from '../../../../hooks/useDebounce';
import { ArenaAssessment } from '../../../../store/useEventArenaStore';

interface SubmissionsManagerTabProps {
  event: any;
  selectedAssessment: ArenaAssessment;
  assessments: ArenaAssessment[];
  selectedAssessmentIndex: number;
  nextAssessment: ArenaAssessment | null;
  effectiveCutoffRank: number;
  adminSubmissions: any[];
  sortedAdminSubmissions: any[];
  submissionRankMap: Map<string, number>;
  overallLeaderboard: any[];
  overallLeaderboardAssessments: any[];
  fetchAdminOverallLeaderboard: (eventId: string) => Promise<any>;
  canManageSelected: boolean;
  actionInProgressId: string | null;
  onUpdateCutoffRank: (val: number) => Promise<void>;
  onQuickUnblock: (query: string) => Promise<void>;
  onOpenManualModal: () => void;
  onOpenBulkPaperModal: () => void;
  onEditPaperScore?: (sub: any) => void;
  isGraceTimeAllGranted?: boolean;
  onOpenGraceAllModal: () => void;
  onOpenGraceModal: (sub: any) => void;
  onInspectSubmission: (sub: any) => void;
  onEvaluateSubmission: (sub: any) => void;
  onResetSubmission: (sub: any) => void;
  onUnblockStudent: (studentId: string, studentName?: string) => void;
  onDeleteSubmission: (sub: any) => void;
}

export const SubmissionsManagerTab: React.FC<SubmissionsManagerTabProps> = memo(({
  event,
  selectedAssessment,
  assessments,
  selectedAssessmentIndex,
  nextAssessment,
  effectiveCutoffRank,
  adminSubmissions,
  sortedAdminSubmissions,
  submissionRankMap,
  overallLeaderboard,
  overallLeaderboardAssessments,
  fetchAdminOverallLeaderboard,
  canManageSelected,
  actionInProgressId,
  onUpdateCutoffRank,
  onQuickUnblock,
  onOpenManualModal,
  onOpenBulkPaperModal,
  onEditPaperScore,
  isGraceTimeAllGranted,
  onOpenGraceAllModal,
  onOpenGraceModal,
  onInspectSubmission,
  onEvaluateSubmission,
  onResetSubmission,
  onUnblockStudent,
  onDeleteSubmission,
}) => {
  const [submissionsSubTab, setSubmissionsSubTab] = useState<'round' | 'leaderboard'>('round');
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
  const [submissionSearch, setSubmissionSearch] = useState('');
  const debouncedSearch = useDebounce(submissionSearch, 250);
  const [isExportingSubmissions, setIsExportingSubmissions] = useState(false);
  const [quickUnblockQuery, setQuickUnblockQuery] = useState('');
  const [isQuickUnblocking, setIsQuickUnblocking] = useState(false);
  const [visibleCount, setVisibleCount] = useState(50);

  // Filtered submissions based on debounced search input
  const filteredSubmissions = useMemo(() => {
    if (!debouncedSearch.trim()) return sortedAdminSubmissions;
    const q = debouncedSearch.trim().toLowerCase();
    return sortedAdminSubmissions.filter((sub: any) => {
      const name = (sub.userId?.name || '').toLowerCase();
      const roll = (sub.userId?.rollNo || '').toLowerCase();
      const email = (sub.userId?.email || '').toLowerCase();
      const dept = (sub.userId?.department || '').toLowerCase();
      const year = String(sub.userId?.year || '').toLowerCase();
      const college = (sub.userId?.college || '').toLowerCase();
      const residence = (sub.userId?.residenceType || '').toLowerCase();
      const team = (sub.teamName || sub.teamId?.name || '').toLowerCase();
      const isManual = sub.isManualSubmission ? 'paper manual offline' : 'online';
      const subRank = submissionRankMap.get(sub._id?.toString() || sub.id) || 0;
      const isShortlisted = effectiveCutoffRank > 0 ? (subRank > 0 && subRank <= effectiveCutoffRank) : true;
      const shortlistStr = isShortlisted ? 'shortlisted qualified next round' : 'not shortlisted disqualified';
      const result = sub.isPassed ? 'passed pass' : 'failed fail';
      const notes = (sub.manualNotes || '').toLowerCase();
      return (
        name.includes(q) ||
        roll.includes(q) ||
        email.includes(q) ||
        dept.includes(q) ||
        year.includes(q) ||
        college.includes(q) ||
        residence.includes(q) ||
        team.includes(q) ||
        isManual.includes(q) ||
        shortlistStr.includes(q) ||
        result.includes(q) ||
        notes.includes(q)
      );
    });
  }, [sortedAdminSubmissions, debouncedSearch, submissionRankMap, effectiveCutoffRank]);

  const visibleFilteredSubmissions = useMemo(() => {
    return filteredSubmissions.slice(0, visibleCount);
  }, [filteredSubmissions, visibleCount]);

  const handleQuickUnblockSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = quickUnblockQuery.trim();
    if (!query) return;
    setIsQuickUnblocking(true);
    try {
      await onQuickUnblock(query);
      setQuickUnblockQuery('');
    } finally {
      setIsQuickUnblocking(false);
    }
  };

  const handleExportTournamentLeaderboard = async () => {
    if (!overallLeaderboard || overallLeaderboard.length === 0) {
      return toast.error('No leaderboard data to export');
    }
    const assessmentsList = overallLeaderboardAssessments || assessments || [];
    const rows = overallLeaderboard.map((entry: any) => {
      const row: Record<string, any> = {
        'Rank': entry.rank,
        'Student Name': entry.student?.name || 'N/A',
        'Roll No': entry.student?.rollNo || 'N/A',
        'Email': entry.student?.email || 'N/A',
        'Department': entry.student?.department || 'N/A',
        'Year': entry.student?.year || 'N/A',
        'Residence': entry.student?.residenceType || 'N/A',
        'Team': entry.teamName || 'Individual',
      };

      assessmentsList.forEach((asm: any, idx: number) => {
        const round = entry.roundScores?.[asm._id];
        const roundTitle = `Round ${idx + 1} (${asm.title})`;
        row[roundTitle] = round?.score !== undefined ? `${round.score} / ${round.maxScore || asm.totalPoints || 100}` : 'Not Attempted';
      });

      row['Total Points'] = entry.totalScore || 0;
      row['Rounds Completed'] = `${entry.roundsCompleted || 0} / ${assessmentsList.length}`;
      row['Total Time (Mins)'] = Math.floor((entry.totalTimeTakenSeconds || 0) / 60);

      return row;
    });

    const XLSX = await import('xlsx');
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Tournament Leaderboard');
    XLSX.writeFile(workbook, `${event.title.replace(/[^a-zA-Z0-9]/g, '_')}_Tournament_Leaderboard.xlsx`);
    toast.success('Tournament leaderboard exported to Excel successfully!');
  };

  const handleExportSubmissions = async () => {
    const listToExport = debouncedSearch.trim()
      ? filteredSubmissions
      : sortedAdminSubmissions;

    if (listToExport.length === 0) {
      toast.error(
        debouncedSearch.trim()
          ? 'No submissions match your search query'
          : 'No submissions available to export'
      );
      return;
    }

    setIsExportingSubmissions(true);
    try {
      const rows = listToExport.map((sub: any, idx: number) => {
        const subRank = submissionRankMap.get(sub._id?.toString() || sub.id) || (idx + 1);
        const isShortlisted = effectiveCutoffRank > 0 ? subRank <= effectiveCutoffRank : true;
        return {
          'Rank': subRank,
          'Shortlisted for Next Round': effectiveCutoffRank > 0
            ? (isShortlisted ? `Yes (Top ${effectiveCutoffRank})` : 'No')
            : 'Yes (All Qualified)',
          'Next Round Eligibility': isShortlisted ? 'Shortlisted' : 'Not Shortlisted',
          'Roll Number': sub.userId?.rollNo || 'N/A',
          'Student Name': sub.userId?.name || 'N/A',
          'Email': sub.userId?.email || 'N/A',
          'Department': sub.userId?.department || 'N/A',
          'Year': sub.userId?.year || 'N/A',
          'College': sub.userId?.college || 'N/A',
          'Residence Type': sub.userId?.residenceType || 'N/A',
          'Team Name': sub.teamName || sub.teamId?.name || 'Individual',
          'Score': sub.totalScore ?? 0,
          'Max Score': sub.maxPossibleScore || selectedAssessment?.totalPoints || 100,
          'Percentage (%)': sub.scorePercentage ?? 0,
          'Pass % Result': sub.isPassed ? 'Passed' : 'Failed',
          'Status': sub.status || 'SUBMITTED',
          'Submission Type': sub.isManualSubmission ? 'Paper / Manual' : 'Online Arena',
          'MCQ Score': sub.mcqScore ?? 0,
          'Coding Score': sub.codingScore ?? 0,
          'Design Score': sub.designScore ?? 0,
          'Tab Switch Count': sub.tabSwitchCount ?? 0,
          'Time Taken (Mins)': Math.floor((sub.timeTakenSeconds || 0) / 60),
          'Submitted At': sub.submittedAt ? new Date(sub.submittedAt).toLocaleString() : 'In Progress',
          'Integrity Blocked': sub.isBlocked ? 'Yes' : 'No',
          'Manual Notes': sub.manualNotes || '',
        };
      });

      const XLSX = await import('xlsx');
      const worksheet = XLSX.utils.json_to_sheet(rows);

      worksheet['!cols'] = [
        { wch: 6 },
        { wch: 26 },
        { wch: 22 },
        { wch: 14 },
        { wch: 24 },
        { wch: 32 },
        { wch: 14 },
        { wch: 8 },
        { wch: 20 },
        { wch: 14 },
        { wch: 16 },
        { wch: 8 },
        { wch: 10 },
        { wch: 14 },
        { wch: 14 },
        { wch: 14 },
        { wch: 16 },
        { wch: 12 },
        { wch: 12 },
        { wch: 12 },
        { wch: 16 },
        { wch: 18 },
        { wch: 22 },
        { wch: 16 },
        { wch: 30 },
      ];

      const workbook = XLSX.utils.book_new();
      const safeSheetName = 'Submissions';
      XLSX.utils.book_append_sheet(workbook, worksheet, safeSheetName);

      const safeEventTitle = (event?.title || 'Event').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 30);
      const safeRoundTitle = (selectedAssessment?.title || 'Round').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 25);
      const timestamp = new Date().toISOString().slice(0, 10);
      const fileName = `${safeEventTitle}_${safeRoundTitle}_Submissions_${timestamp}.xlsx`;

      try {
        XLSX.writeFile(workbook, fileName);
      } catch (writeErr) {
        console.warn('XLSX.writeFile fallback to manual Blob trigger:', writeErr);
        const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }

      toast.success('Submissions list exported to Excel successfully!');
    } catch (err: any) {
      console.error('Failed to export submissions list:', err);
      toast.error(err?.message || 'Failed to export submissions list');
    } finally {
      setIsExportingSubmissions(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* View Switcher: Current Round Submissions vs Overall Tournament Leaderboard */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-separator">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-surface-secondary border border-separator">
          <Button
            size="sm"
            variant={submissionsSubTab === 'round' ? 'solid' : 'light'}
            color={submissionsSubTab === 'round' ? 'primary' : 'default'}
            onPress={() => setSubmissionsSubTab('round')}
            className={`px-3 py-1.5 h-8 rounded-lg text-xs font-bold cursor-pointer ${
              submissionsSubTab === 'round'
                ? 'bg-primary text-white shadow-xs'
                : 'text-label-secondary hover:text-label-primary'
            }`}
          >
            Round Submissions ({adminSubmissions.length})
          </Button>
          <Button
            size="sm"
            variant={submissionsSubTab === 'leaderboard' ? 'solid' : 'light'}
            color={submissionsSubTab === 'leaderboard' ? 'primary' : 'default'}
            startContent={<Trophy size={13} />}
            onPress={() => {
              setSubmissionsSubTab('leaderboard');
              setLoadingLeaderboard(true);
              fetchAdminOverallLeaderboard(event._id).finally(() => setLoadingLeaderboard(false));
            }}
            className={`px-3 py-1.5 h-8 rounded-lg text-xs font-bold cursor-pointer ${
              submissionsSubTab === 'leaderboard'
                ? 'bg-primary text-white shadow-xs'
                : 'text-label-secondary hover:text-label-primary'
            }`}
          >
            Tournament Leaderboard (All Rounds)
          </Button>
        </div>

        {submissionsSubTab === 'leaderboard' && overallLeaderboard?.length > 0 && (
          <Button
            size="sm"
            variant="bordered"
            startContent={<Download size={13} />}
            onPress={handleExportTournamentLeaderboard}
            className="px-3 py-1.5 h-8 rounded-xl text-xs font-bold border-separator bg-surface hover:bg-surface-secondary text-label-primary cursor-pointer"
          >
            Export Excel
          </Button>
        )}
      </div>

      {submissionsSubTab === 'leaderboard' ? (
        /* OVERALL TOURNAMENT LEADERBOARD VIEW */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-label-primary flex items-center gap-2">
                <Trophy size={16} className="text-amber-400" />
                <span>Official Tournament Leaderboard</span>
              </h4>
              <p className="text-xs text-label-secondary">
                Scores tracked per round separately and aggregated total points across all {assessments.length} rounds.
              </p>
            </div>
          </div>

          {loadingLeaderboard ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-2">
              <Loader2 size={28} className="animate-spin text-primary" />
              <p className="text-xs text-label-secondary">Calculating tournament standings...</p>
            </div>
          ) : !overallLeaderboard || overallLeaderboard.length === 0 ? (
            <div className="p-8 rounded-2xl bg-surface-secondary border border-separator text-center space-y-2">
              <Trophy size={28} className="mx-auto text-label-tertiary" />
              <h4 className="text-sm font-bold text-label-primary">No Tournament Results Yet</h4>
              <p className="text-xs text-label-secondary">
                Student scores will appear here across all rounds once participants begin submitting.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-separator overflow-x-auto bg-surface-secondary/20">
              <table className="w-full text-left text-xs min-w-[700px]">
                <thead className="bg-surface-secondary border-b border-separator text-label-secondary uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Rank & Student</th>
                    <th className="p-3">Team</th>
                    {(overallLeaderboardAssessments || assessments || []).map((asm: any, aIdx: number) => (
                      <th key={asm._id || aIdx} className="p-3 text-center">
                        Round {aIdx + 1} ({asm.type})
                      </th>
                    ))}
                    <th className="p-3 text-center font-bold text-primary">Total Points</th>
                    <th className="p-3 text-center">Rounds Done</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-separator/40">
                  {overallLeaderboard.map((entry: any, eIdx: number) => (
                    <tr key={eIdx} className="hover:bg-surface-secondary/40 transition-colors">
                      <td className="p-3">
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`font-mono font-bold w-5 ${
                              entry.rank === 1
                                ? 'text-amber-400 font-extrabold'
                                : entry.rank === 2
                                ? 'text-slate-300 font-bold'
                                : entry.rank === 3
                                ? 'text-amber-600 font-bold'
                                : 'text-label-tertiary'
                            }`}
                          >
                            #{entry.rank}
                          </span>
                          <div className="w-7 h-7 rounded-full overflow-hidden bg-surface border border-separator shrink-0">
                            <img
                              src={
                                entry.student?.profilePicUrl ||
                                `https://ui-avatars.com/api/?name=${entry.student?.name}&size=60`
                              }
                              alt={entry.student?.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-xs text-label-primary truncate">
                              {entry.student?.name}
                            </p>
                            <p className="text-[10px] text-label-tertiary truncate">
                              {entry.student?.rollNo || entry.student?.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-label-secondary">
                        {entry.teamName || <span className="text-label-tertiary italic">Individual</span>}
                      </td>
                      {(overallLeaderboardAssessments || assessments || []).map((asm: any) => {
                        const roundData = entry.roundScores?.[asm._id];
                        return (
                          <td key={asm._id} className="p-3 text-center">
                            {roundData?.score !== undefined ? (
                              <div className="space-y-0.5">
                                <span className="font-mono font-bold text-xs text-label-primary">
                                  {roundData.score}
                                </span>
                                <span className="text-[10px] text-label-tertiary block font-mono">
                                  /{roundData.maxScore || asm.totalPoints || 100}
                                </span>
                              </div>
                            ) : (
                              <span className="text-label-tertiary">—</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="p-3 text-center">
                        <span className="px-2.5 whitespace-nowrap py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 font-mono font-bold text-xs">
                          {entry.totalScore || 0} pts
                        </span>
                      </td>
                      <td className="p-3 text-center text-label-secondary font-mono text-[11px]">
                        {entry.roundsCompleted || 0} / {(overallLeaderboardAssessments || assessments || []).length}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* CURRENT ROUND SUBMISSIONS */
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-sm font-bold text-label-primary">Round Submissions</h4>
              <p className="text-xs text-label-secondary">
                Total {adminSubmissions.length} submissions for "{selectedAssessment.title}"
              </p>
            </div>
            {canManageSelected && (
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  variant="flat"
                  color="secondary"
                  onPress={onOpenManualModal}
                  startContent={<Plus size={13} />}
                  className="h-8 px-3 rounded-xl text-xs font-bold bg-purple-500/15 border border-purple-500/30 text-purple-400 hover:bg-purple-500/25 cursor-pointer"
                  title="Enter Single Student Paper Test Score"
                >
                  + Paper Score
                </Button>
                <Button
                  size="sm"
                  variant="flat"
                  color="secondary"
                  onPress={onOpenBulkPaperModal}
                  startContent={<FileSpreadsheet size={13} />}
                  className="h-8 px-3 rounded-xl text-xs font-bold bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/25 cursor-pointer"
                  title="Bulk Upload Paper / Offline Test Scores via Excel/CSV"
                >
                  Bulk Paper Scores
                </Button>
                <Button
                  size="sm"
                  variant="bordered"
                  onPress={handleExportSubmissions}
                  isDisabled={adminSubmissions.length === 0 || isExportingSubmissions}
                  isLoading={isExportingSubmissions}
                  startContent={!isExportingSubmissions ? <Download size={13} /> : undefined}
                  className="h-8 px-3 rounded-xl text-xs font-bold bg-surface border-separator text-label-secondary hover:text-label-primary hover:bg-surface-secondary cursor-pointer"
                  title="Download Submissions List (.xlsx)"
                >
                  {isExportingSubmissions ? 'Exporting...' : 'Download List'}
                </Button>
                <Button
                  size="sm"
                  variant={isGraceTimeAllGranted ? "bordered" : "flat"}
                  color={isGraceTimeAllGranted ? "default" : "warning"}
                  onPress={onOpenGraceAllModal}
                  isDisabled={isGraceTimeAllGranted}
                  startContent={<Clock size={13} />}
                  className={`h-8 px-3 rounded-xl text-xs font-bold ${
                    isGraceTimeAllGranted
                      ? 'opacity-60 cursor-not-allowed bg-surface border-separator text-label-secondary'
                      : 'bg-amber-500/15 border border-amber-500/30 text-amber-500 hover:bg-amber-500/25 cursor-pointer'
                  }`}
                  title={
                    isGraceTimeAllGranted
                      ? 'Grace time for all candidates has already been granted once for this round. Additional grace time must be granted individually to candidates.'
                      : 'Extend round duration and countdown for all candidates in this assessment'
                  }
                >
                  {isGraceTimeAllGranted ? 'Grace for All Granted (1x Limit)' : 'Extend Time for All (+Grace)'}
                </Button>
                <form onSubmit={handleQuickUnblockSubmit} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={quickUnblockQuery}
                    onChange={(e) => setQuickUnblockQuery(e.target.value)}
                    placeholder="Unblock Roll No / Email..."
                    className="px-3 py-1.5 rounded-xl bg-surface border border-separator text-xs text-label-primary placeholder-label-tertiary outline-none focus:border-purple-500 w-44 sm:w-56"
                  />
                  <Button
                    type="submit"
                    size="sm"
                    color="success"
                    variant="solid"
                    isLoading={isQuickUnblocking}
                    isDisabled={!quickUnblockQuery.trim() || isQuickUnblocking}
                    className="h-8 px-3 rounded-xl text-xs font-bold bg-emerald-600 text-white cursor-pointer shrink-0"
                  >
                    Unblock
                  </Button>
                </form>
              </div>
            )}
          </div>

          {/* Grace Time Notice Banner if Batch Grace Time Already Granted */}
          {isGraceTimeAllGranted && (
            <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs">
              <Clock size={15} className="shrink-0 text-amber-400" />
              <div className="flex-1">
                <span className="font-bold text-amber-400">Batch Grace Time Limit Reached (1x Granted):</span>{' '}
                <span className="text-amber-300/90">
                  Grace time for all candidates has already been applied (+{selectedAssessment?.graceMinutes || 0}m). Any additional grace time for candidates must now be given individually using the clock icon on each candidate&apos;s row below.
                </span>
              </div>
            </div>
          )}

          {/* Top Rank Cutoff (Next Round) Rule Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/20">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-500/20 flex items-center justify-center shrink-0 border border-purple-500/30">
                <Trophy size={16} className="text-amber-400" />
              </div>
              <div>
                <p className="text-xs font-bold text-label-primary flex items-center gap-1.5 flex-wrap">
                  <span>Next Round Shortlist Rule:</span>
                  <span className="text-purple-400 font-mono font-bold">
                    {effectiveCutoffRank > 0
                      ? `Top ${effectiveCutoffRank} Candidates Qualify`
                      : 'All Candidates Qualify (No Cutoff Set)'}
                  </span>
                  {nextAssessment && (
                    <span className="text-[11px] text-label-tertiary">
                      for Round {selectedAssessmentIndex + 2} ("{nextAssessment.title}")
                    </span>
                  )}
                </p>
                <p className="text-[11px] text-label-secondary">
                  Shortlisting is strictly based on score (highest first). When candidates have the same score, qualification rank is determined alphabetically by student name (A-Z).
                </p>
              </div>
            </div>

            {canManageSelected && (
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                <label className="text-[11px] font-bold text-label-secondary whitespace-nowrap">
                  Cutoff Rank:
                </label>
                <input
                  type="number"
                  min={0}
                  value={selectedAssessment?.qualificationCutoffRank ?? 0}
                  onChange={async (e) => {
                    const val = Math.max(0, parseInt(e.target.value) || 0);
                    await onUpdateCutoffRank(val);
                  }}
                  className="w-20 px-2.5 py-1 rounded-xl bg-surface border border-purple-500/40 text-xs font-mono font-bold text-center text-label-primary outline-none focus:border-purple-400"
                  title="Set Top Rank Cutoff for Next Round"
                />
              </div>
            )}
          </div>

          {/* Submissions Search & Filter Field */}
          {adminSubmissions.length > 0 && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 p-2.5 rounded-2xl bg-surface-secondary/40 border border-separator">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-label-tertiary" />
                <input
                  type="text"
                  value={submissionSearch}
                  onChange={(e) => setSubmissionSearch(e.target.value)}
                  placeholder="Search submissions by student name, roll number, email, department, or 'paper'..."
                  className="w-full pl-9 pr-8 py-1.5 rounded-xl bg-surface border border-separator text-xs text-label-primary placeholder-label-tertiary outline-none focus:border-purple-500 transition-colors"
                />
                {submissionSearch && (
                  <button
                    type="button"
                    onClick={() => setSubmissionSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-label-tertiary hover:text-label-primary p-0.5 rounded cursor-pointer"
                    title="Clear search"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
              <div className="flex items-center justify-between sm:justify-end gap-2 text-xs text-label-secondary shrink-0 px-1">
                <span>
                  Showing <strong className="text-label-primary font-mono">{filteredSubmissions.length}</strong> of{' '}
                  <span className="font-mono">{adminSubmissions.length}</span>
                </span>
                {submissionSearch && (
                  <button
                    type="button"
                    onClick={() => setSubmissionSearch('')}
                    className="text-[11px] font-bold text-accent hover:underline cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          )}

          {adminSubmissions.length === 0 ? (
            <div className="p-8 rounded-2xl bg-surface-secondary border border-separator text-center space-y-2">
              <Award size={28} className="mx-auto text-label-tertiary" />
              <h4 className="text-sm font-bold text-label-primary">No Submissions Yet</h4>
              <p className="text-xs text-label-secondary">
                Submissions from students who complete this assessment will appear here with complete details.
              </p>
            </div>
          ) : filteredSubmissions.length === 0 ? (
            <div className="p-8 rounded-2xl bg-surface-secondary border border-separator text-center space-y-2">
              <Search size={28} className="mx-auto text-label-tertiary" />
              <h4 className="text-sm font-bold text-label-primary">No Submissions Found</h4>
              <p className="text-xs text-label-secondary">
                No submissions matched your search "{submissionSearch}". Try searching with a different name, roll no, or email.
              </p>
              <Button
                size="sm"
                variant="light"
                onPress={() => setSubmissionSearch('')}
                className="text-accent text-xs font-bold cursor-pointer"
              >
                Clear Search
              </Button>
            </div>
          ) : (
            <>
              {/* Mobile Card List (< md viewports) */}
              <div className="block md:hidden space-y-3">
                {visibleFilteredSubmissions.map((sub, idx) => {
                  const subRank = submissionRankMap.get(sub._id?.toString() || sub.id) || (idx + 1);
                  const isShortlisted = effectiveCutoffRank > 0 ? subRank <= effectiveCutoffRank : true;
                  return (
                    <div
                      key={sub._id || idx}
                      className="p-3.5 rounded-2xl bg-surface-secondary border border-separator space-y-3 shadow-2xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className={`w-6 h-6 rounded-full font-mono font-bold text-xs flex items-center justify-center shrink-0 ${
                              subRank === 1
                                ? 'bg-amber-400/20 text-amber-400 border border-amber-400/30'
                                : subRank === 2
                                ? 'bg-slate-300/20 text-slate-300 border border-slate-300/30'
                                : subRank === 3
                                ? 'bg-amber-600/20 text-amber-600 border border-amber-600/30'
                                : 'bg-accent/10 text-accent'
                            }`}
                          >
                            #{subRank}
                          </span>
                          <div className="w-8 h-8 rounded-full overflow-hidden bg-surface border border-separator shrink-0">
                            <img
                              src={
                                sub.userId?.profilePicUrl ||
                                `https://ui-avatars.com/api/?name=${sub.userId?.name}&background=1D1D1F&color=fff&size=60`
                              }
                              alt={sub.userId?.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="font-semibold text-xs text-label-primary truncate">
                                {sub.userId?.name || 'Student'}
                              </p>
                              {sub.isManualSubmission && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-500/15 text-purple-400 border border-purple-500/30 shrink-0">
                                  Paper
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-label-tertiary truncate">
                              {sub.userId?.rollNo || sub.userId?.email}
                            </p>
                          </div>
                        </div>
                        {effectiveCutoffRank > 0 ? (
                          isShortlisted ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                              <CheckCircle2 size={10} />
                              <span>Shortlisted</span>
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center gap-1">
                              <X size={10} />
                              <span>Not Shortlisted</span>
                            </span>
                          )
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 bg-blue-500/15 text-blue-400 border border-blue-500/30">
                            Qualified
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-3 gap-2 p-2 bg-surface rounded-xl border border-separator/60 text-center">
                        <div>
                          <span className="text-[9px] text-label-tertiary uppercase font-bold block">Score</span>
                          <span className="font-mono text-xs font-bold text-label-primary">
                            {sub.totalScore}/{sub.maxPossibleScore}
                          </span>
                        </div>
                        <div>
                          <span className="text-[9px] text-label-tertiary uppercase font-bold block">Percentage</span>
                          <span className="font-mono text-xs font-bold text-label-primary">{sub.scorePercentage}%</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-label-tertiary uppercase font-bold block">Residence</span>
                          <span className="text-[10px] font-semibold text-accent truncate block mt-0.5">
                            {sub.userId?.residenceType || '—'}
                          </span>
                        </div>
                      </div>

                      {/* Figma / Work status */}
                      {sub.designSubmission?.figmaLink && (
                        <div className="p-2.5 rounded-xl bg-pink-500/5 border border-pink-500/20 space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <Link
                              target="_blank"
                              rel="noopener noreferrer"
                              href={sub.designSubmission.figmaLink}
                              className="text-pink-400 hover:text-pink-300 font-mono text-[11px] underline inline-flex items-center gap-1"
                            >
                              <span>Open Figma File</span>
                              <ExternalLink size={10} />
                            </Link>
                            {sub.designSubmission?.isEvaluated ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                Graded: {sub.designSubmission.pointsEarned} pts
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                                Needs Review
                              </span>
                            )}
                          </div>
                          {canManageSelected && (
                            <Button
                              size="sm"
                              variant="flat"
                              color="secondary"
                              onPress={() => onEvaluateSubmission(sub)}
                              className="w-full h-7 rounded-lg text-xs font-bold bg-pink-500/20 text-pink-300 hover:bg-pink-500/30 cursor-pointer"
                            >
                              {sub.designSubmission?.isEvaluated ? 'Update Evaluation' : 'Grade Figma'}
                            </Button>
                          )}
                        </div>
                      )}

                      {/* Card Footer Actions */}
                      <div className="flex items-center justify-between gap-1.5 pt-1 border-t border-separator/40">
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="light"
                            startContent={<Eye size={12} />}
                            onPress={() => onInspectSubmission(sub)}
                            className="h-7 px-2.5 text-xs text-accent font-semibold cursor-pointer"
                          >
                            Review All
                          </Button>
                          {canManageSelected && onEditPaperScore && (
                            <Button
                              size="sm"
                              variant="light"
                              color="secondary"
                              startContent={<FileText size={12} />}
                              onPress={() => onEditPaperScore(sub)}
                              className="h-7 px-2 text-xs text-purple-400 font-semibold hover:bg-purple-500/10 cursor-pointer"
                            >
                              Edit / Paper Marks
                            </Button>
                          )}
                        </div>

                        {canManageSelected && (
                          <div className="flex items-center gap-1">
                            <Button
                              isIconOnly
                              size="sm"
                              variant="light"
                              color="warning"
                              title="Extend extra time"
                              onPress={() => onOpenGraceModal(sub)}
                              className="h-7 w-7 min-w-7 rounded-lg text-amber-500 hover:bg-amber-500/10 cursor-pointer"
                            >
                              <Clock size={12} />
                            </Button>
                            {sub.isBlocked && (
                              <Button
                                isIconOnly
                                size="sm"
                                variant="light"
                                color="success"
                                title="Unblock Student"
                                isDisabled={actionInProgressId === (sub.userId?._id || sub.userId?.id || sub.userId)}
                                isLoading={actionInProgressId === (sub.userId?._id || sub.userId?.id || sub.userId)}
                                onPress={() => onUnblockStudent(sub.userId?._id || sub.userId?.id || sub.userId, sub.userId?.name)}
                                className="h-7 w-7 min-w-7 rounded-lg text-emerald-500 hover:bg-emerald-500/10 cursor-pointer"
                              >
                                <ShieldCheck size={12} />
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop Table View (>= md viewports) */}
              <div className="hidden md:block rounded-xl border border-separator overflow-x-auto bg-surface-secondary/20">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-secondary border-b border-separator text-label-secondary uppercase text-[10px]">
                    <tr>
                      <th className="p-3">Rank & Student</th>
                      <th className="p-3">Shortlist</th>
                      <th className="p-3">Department</th>
                      <th className="p-3">Team</th>
                      <th className="p-3 text-center">Score</th>
                      <th className="p-3 text-center">Percentage</th>
                      <th className="p-3 text-center">Figma / Work</th>
                      <th className="p-3 text-center">Integrity</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-separator/40">
                    {visibleFilteredSubmissions.map((sub, idx) => {
                      const subRank = submissionRankMap.get(sub._id?.toString() || sub.id) || (idx + 1);
                      const isShortlisted = effectiveCutoffRank > 0 ? subRank <= effectiveCutoffRank : true;
                      return (
                        <tr key={sub._id || idx} className="hover:bg-surface-secondary/40 transition-colors">
                          <td className="p-3">
                            <div className="flex items-center gap-2.5">
                              <span
                                className={`font-mono font-bold w-6 text-center ${
                                  subRank === 1
                                    ? 'text-amber-400 font-extrabold'
                                    : subRank === 2
                                    ? 'text-slate-300 font-bold'
                                    : subRank === 3
                                    ? 'text-amber-600 font-bold'
                                    : 'text-label-tertiary'
                                }`}
                              >
                                #{subRank}
                              </span>
                              <div className="w-8 h-8 rounded-full overflow-hidden bg-surface border border-separator shrink-0">
                                <img
                                  src={
                                    sub.userId?.profilePicUrl ||
                                    `https://ui-avatars.com/api/?name=${sub.userId?.name}&background=1D1D1F&color=fff&size=60`
                                  }
                                  alt={sub.userId?.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <p className="font-semibold text-xs text-label-primary truncate">
                                    {sub.userId?.name || 'Student'}
                                  </p>
                                  {sub.isManualSubmission && (
                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-500/15 text-purple-400 border border-purple-500/30">
                                      Paper
                                    </span>
                                  )}
                                </div>
                                <p className="text-[10px] text-label-tertiary truncate">
                                  {sub.userId?.rollNo || sub.userId?.email}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="p-3">
                            {effectiveCutoffRank > 0 ? (
                              isShortlisted ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 w-max">
                                  <CheckCircle2 size={10} />
                                  <span>Shortlisted (#{subRank})</span>
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center gap-1 w-max">
                                  <X size={10} />
                                  <span>Disqualified (#{subRank})</span>
                                </span>
                              )
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30 w-max block">
                                Qualified
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-label-secondary">
                            <div>
                              <p className="text-xs">{sub.userId?.department || '—'}</p>
                              <p className="text-[10px] text-label-tertiary">
                                {sub.userId?.year ? `Year ${sub.userId.year}` : ''} • {sub.userId?.residenceType || 'Day Scholar'}
                              </p>
                            </div>
                          </td>
                          <td className="p-3 text-label-secondary">
                            {sub.teamName || sub.teamId?.name || <span className="text-label-tertiary italic">Individual</span>}
                          </td>
                          <td className="p-3 text-center">
                            <span className="font-mono font-bold text-xs text-label-primary">
                              {sub.totalScore}/{sub.maxPossibleScore}
                            </span>
                            {(sub.mcqScore !== undefined || sub.codingScore !== undefined) && (
                              <div className="text-[10px] text-label-tertiary font-mono flex items-center justify-center gap-1.5 mt-0.5">
                                {sub.mcqScore !== undefined && <span title="Online MCQ Score">M: {sub.mcqScore}</span>}
                                {sub.codingScore !== undefined && (
                                  <span className="text-purple-400 font-semibold" title="Paper Coding Score">
                                    C: {sub.codingScore}
                                  </span>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="p-3 text-center">
                            <span className="font-mono font-bold text-xs text-accent">
                              {sub.scorePercentage}%
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            {sub.designSubmission?.figmaLink ? (
                              <div className="flex flex-col items-center gap-1">
                                <Link
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  href={sub.designSubmission.figmaLink}
                                  className="text-pink-400 hover:text-pink-300 font-mono text-[11px] underline inline-flex items-center gap-1"
                                >
                                  <span>Open Figma</span>
                                  <ExternalLink size={10} />
                                </Link>
                                {sub.designSubmission.isEvaluated ? (
                                  <span className="text-[10px] font-mono text-emerald-400 font-bold">
                                    {sub.designSubmission.pointsEarned} pts
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-mono text-amber-400">
                                    Unevaluated
                                  </span>
                                )}
                              </div>
                            ) : sub.isManualSubmission ? (
                              <span className="text-purple-400 text-[10px] font-bold">Paper Test</span>
                            ) : (
                              <span className="text-label-tertiary">—</span>
                            )}
                          </td>
                          <td className="p-3 text-center">
                            {sub.isBlocked ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                                Blocked
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                Active
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                size="sm"
                                variant="light"
                                startContent={<Eye size={12} />}
                                onPress={() => onInspectSubmission(sub)}
                                className="h-7 px-2 text-xs text-accent font-semibold cursor-pointer"
                              >
                                Review
                              </Button>
                              {canManageSelected && onEditPaperScore && (
                                <Button
                                  isIconOnly
                                  size="sm"
                                  variant="light"
                                  color="secondary"
                                  title="Update score / Enter paper marks"
                                  onPress={() => onEditPaperScore(sub)}
                                  className="h-7 w-7 min-w-7 rounded-lg text-purple-400 hover:bg-purple-500/10 cursor-pointer"
                                >
                                  <FileText size={12} />
                                </Button>
                              )}
                              {selectedAssessment.type === 'UI_UX' && sub.designSubmission?.figmaLink && canManageSelected && (
                                <Button
                                  size="sm"
                                  variant="flat"
                                  color="secondary"
                                  onPress={() => onEvaluateSubmission(sub)}
                                  className="h-7 px-2 text-xs font-bold bg-pink-500/15 text-pink-300 hover:bg-pink-500/25 cursor-pointer"
                                >
                                  Grade
                                </Button>
                              )}
                              {canManageSelected && (
                                <>
                                  <Button
                                    isIconOnly
                                    size="sm"
                                    variant="light"
                                    color="warning"
                                    title="Extend extra grace time"
                                    onPress={() => onOpenGraceModal(sub)}
                                    className="h-7 w-7 min-w-7 rounded-lg text-amber-500 hover:bg-amber-500/10 cursor-pointer"
                                  >
                                    <Clock size={12} />
                                  </Button>
                                  <Button
                                    isIconOnly
                                    size="sm"
                                    variant="light"
                                    color="warning"
                                    title="Reset student attempt (retake)"
                                    isDisabled={actionInProgressId === sub._id}
                                    isLoading={actionInProgressId === sub._id}
                                    onPress={() => onResetSubmission(sub)}
                                    className="h-7 w-7 min-w-7 rounded-lg text-amber-500 hover:bg-amber-500/10 cursor-pointer"
                                  >
                                    <RotateCcw size={12} />
                                  </Button>
                                  {sub.isBlocked && (
                                    <Button
                                      isIconOnly
                                      size="sm"
                                      variant="light"
                                      color="success"
                                      title="Unblock student directly"
                                      isDisabled={actionInProgressId === (sub.userId?._id || sub.userId?.id || sub.userId)}
                                      isLoading={actionInProgressId === (sub.userId?._id || sub.userId?.id || sub.userId)}
                                      onPress={() => onUnblockStudent(sub.userId?._id || sub.userId?.id || sub.userId, sub.userId?.name)}
                                      className="h-7 w-7 min-w-7 rounded-lg text-emerald-500 hover:bg-emerald-500/10 cursor-pointer"
                                    >
                                      <ShieldCheck size={12} />
                                    </Button>
                                  )}
                                  <Button
                                    isIconOnly
                                    size="sm"
                                    variant="light"
                                    color="danger"
                                    title="Delete submission"
                                    isDisabled={actionInProgressId === sub._id}
                                    isLoading={actionInProgressId === sub._id}
                                    onPress={() => onDeleteSubmission(sub)}
                                    className="h-7 w-7 min-w-7 rounded-lg text-destructive hover:bg-destructive/10 cursor-pointer"
                                  >
                                    <Trash2 size={12} />
                                  </Button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Show more button if list is long */}
              {filteredSubmissions.length > visibleCount && (
                <div className="flex justify-center pt-2">
                  <Button
                    size="sm"
                    variant="flat"
                    onPress={() => setVisibleCount((prev) => prev + 50)}
                    className="rounded-xl px-6 text-xs font-semibold bg-surface-secondary text-label-primary border border-separator hover:bg-surface cursor-pointer"
                  >
                    Load More Submissions ({filteredSubmissions.length - visibleCount} remaining)
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
});

SubmissionsManagerTab.displayName = 'SubmissionsManagerTab';
