import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Crown,
  Building2,
  Mail,
  GraduationCap,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Users,
  ChevronDown,
  ChevronUp,
  Trash2,
  XCircle,
  Sliders,
} from 'lucide-react';
import { HeroChip as Chip } from '../ui/HeroUIComponents';
import { format } from 'date-fns';
import { getStudentCollege, getStudentYear, getStudentDepartment } from '../../utils/studentUtils';

export interface ParticipantCardProps {
  enrollment: any;
  index: number;
  isExpanded: boolean;
  isParticipantsTab: boolean;
  event: any;
  onToggleExpand: (id: string) => void;
  onDelete: (enrollment: any) => void;
}

export const ParticipantCard: React.FC<ParticipantCardProps> = ({
  enrollment: e,
  index: _idx,
  isExpanded,
  isParticipantsTab,
  event,
  onToggleExpand: toggleExpand,
  onDelete: setConfirmDeleteEnrollment,
}) => {
  const isGroup = e.type === 'Team' || e.type === 'Duo';
  const hasMembers = e.members && e.members.length > 0;
  const memberTotal = (e.members?.length || 0) + 1;
  const isPresent = Boolean(e.attendanceStatus);

  return (
                <div
                  
                  className="p-4 sm:p-5 rounded-2xl bg-surface border border-separator dark:border-white/10 hover:border-blue-500/35 dark:hover:border-blue-500/35 transition-all shadow-xs space-y-3"
                >
                  {/* Primary Row Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                      {/* Monogram Avatar */}
                      <div
                        className={`w-10 h-10 rounded-xl font-semibold text-sm flex items-center justify-center shrink-0 border shadow-xs ${
                          isPresent
                            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/25'
                            : 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/25'
                        }`}
                      >
                        {e.enrolledBy?.name ? e.enrolledBy.name.charAt(0).toUpperCase() : '?'}
                      </div>

                      {/* Student and Team Info */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm sm:text-base text-label-primary tracking-tight">
                            {e.enrolledBy?.name || 'Unknown Student'}
                          </span>

                          {isGroup && e.teamName && (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/25 flex items-center gap-1">
                              <Crown size={12} className="text-purple-500" />
                              {e.teamName}
                            </span>
                          )}

                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium tabular-nums ${
                              e.type === 'Duo'
                                ? 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20'
                                : e.type === 'Team'
                                ? 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-500/20'
                                : 'bg-separator dark:bg-white/10 text-label-secondary'
                            }`}
                          >
                            {e.type === 'Duo'
                              ? 'Duo (2 members)'
                              : e.type === 'Team'
                              ? `Squad (${memberTotal} members)`
                              : 'Solo'}
                          </span>
                        </div>

                        {/* Detail Badges */}
                        <div className="flex items-center gap-2 text-xs text-label-secondary mt-1.5 flex-wrap font-normal">
                          <span className="font-mono px-2 py-0.5 rounded-md bg-surface-secondary border border-separator text-label-primary text-xs font-medium tabular-nums">
                            {e.enrolledBy?.rollNo || 'No roll number'}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-700 dark:text-blue-300 font-medium text-xs border border-blue-500/20 flex items-center gap-1">
                            <Building2 size={12} />
                            {getStudentCollege(e.enrolledBy)}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-surface-secondary text-label-secondary font-medium text-xs border border-separator">
                            {getStudentYear(e.enrolledBy)}
                          </span>
                          <span className="flex items-center gap-1 text-label-secondary">
                            <Mail size={12} className="text-label-tertiary" />
                            {e.enrolledBy?.email || 'No email'}
                          </span>
                          <span className="flex items-center gap-1 text-label-secondary">
                            <GraduationCap size={13} className="text-label-tertiary" />
                            {getStudentDepartment(e.enrolledBy)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right Status Badges & Teammate Drawer Toggle */}
                    <div className="flex items-center gap-2 sm:gap-2.5 self-end sm:self-auto flex-wrap">
                      {isParticipantsTab && (
                        <Chip
                          size="sm"
                          color={e.isWalkIn ? 'warning' : 'primary'}
                          variant="flat"
                        >
                          {e.isWalkIn ? 'Walk-in attendance' : 'Pre-registered'}
                        </Chip>
                      )}

                      <Chip
                        size="sm"
                        color={isPresent ? 'success' : 'default'}
                        variant="flat"
                        startContent={
                          isPresent ? (
                            <CheckCircle2 size={13} className="text-emerald-500" />
                          ) : (
                            <XCircle size={13} className="text-label-tertiary" />
                          )
                        }
                      >
                        {isPresent
                          ? isParticipantsTab
                            ? 'Verified participant'
                            : 'Attended'
                          : 'Awaiting attendance'}
                      </Chip>

                      {isGroup && hasMembers && (
                        <button
                          onClick={() => toggleExpand(e._id)}
                          className="py-1 px-2.5 rounded-xl bg-surface-secondary border border-separator text-label-secondary hover:text-label-primary hover:border-separator-opaque transition-all flex items-center gap-1.5 text-xs font-medium cursor-pointer shadow-xs tabular-nums"
                        >
                          <span>
                            {e.members.length} teammate{e.members.length > 1 ? 's' : ''}
                          </span>
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                      )}

                      {/* Delete Participant Button */}
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteEnrollment(e)}
                        title="Delete participant registration"
                        className="py-1 px-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/20 hover:border-red-500/40 transition-all flex items-center gap-1.5 text-xs font-medium cursor-pointer shadow-xs"
                      >
                        <Trash2 size={13} />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>

                  {/* Custom Questionnaire Responses */}
                  {e.customResponses && Object.keys(e.customResponses).length > 0 && (
                    <div className="pt-2.5 border-t border-separator/60 dark:border-white/10 flex flex-wrap items-center gap-2">
                      <span className="text-[10px] uppercase font-medium text-label-tertiary flex items-center gap-1">
                        <Sliders size={11} className="text-blue-500" /> Questionnaire:
                      </span>
                      {Object.entries(e.customResponses).map(([key, val]) => {
                        const matchedField = event?.customFields?.find(
                          (cf: any) => cf.id === key || cf.label === key
                        );
                        const displayKey = matchedField?.label || key;
                        const displayVal =
                          typeof val === 'boolean' ? (val ? 'Yes' : 'No') : String(val || 'N/A');
                        return (
                          <span
                            key={key}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-canvas border border-separator dark:border-white/10 text-xs font-normal text-label-secondary"
                          >
                            <strong className="text-label-primary font-medium">{displayKey}:</strong>
                            <span>{displayVal}</span>
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {/* Expandable Team Roster Drawer */}
                  {isGroup && hasMembers && isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-3 pt-3 border-t border-separator/80 dark:border-white/10 space-y-2.5"
                    >
                      <p className="text-[11px] uppercase font-semibold text-label-tertiary tracking-wider tabular-nums">
                        Full team roster ({memberTotal} members)
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {/* Leader card */}
                        <div className="p-3 rounded-2xl bg-canvas border border-separator dark:border-white/10 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 font-medium text-xs flex items-center justify-center shrink-0 border border-purple-500/20">
                            <Crown size={14} />
                          </div>
                          <div className="min-w-0 text-xs space-y-0.5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-semibold text-label-primary truncate">
                                {e.enrolledBy?.name}
                              </span>
                              <span className="text-[10px] font-medium text-purple-600 dark:text-purple-400">
                                (Leader)
                              </span>
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20">
                                {getStudentCollege(e.enrolledBy)}
                              </span>
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-surface text-label-secondary border border-separator dark:border-white/10">
                                {getStudentYear(e.enrolledBy)}
                              </span>
                            </div>
                            <p className="font-mono text-label-secondary text-[11px] tabular-nums">
                              {e.enrolledBy?.rollNo || 'No roll number'}
                            </p>
                            <p className="text-label-tertiary text-[11px] truncate">
                              {e.enrolledBy?.email || 'No email'}
                            </p>
                            <p className="text-[10px] text-label-tertiary truncate">
                              {getStudentDepartment(e.enrolledBy)}
                            </p>
                          </div>
                        </div>

                        {/* Member cards */}
                        {e.members.map((m: any, mIdx: number) => (
                          <div
                            key={m?._id || mIdx}
                            className="p-3 rounded-2xl bg-canvas border border-separator dark:border-white/10 flex items-center gap-3"
                          >
                            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium text-xs flex items-center justify-center shrink-0 border border-blue-500/20">
                              {m?.name ? m.name.charAt(0).toUpperCase() : 'M'}
                            </div>
                            <div className="min-w-0 text-xs space-y-0.5">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-semibold text-label-primary truncate block">
                                  {m?.name || 'Unknown member'}
                                </span>
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20">
                                  {getStudentCollege(m)}
                                </span>
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-surface text-label-secondary border border-separator dark:border-white/10">
                                  {getStudentYear(m)}
                                </span>
                              </div>
                              <p className="font-mono text-label-secondary text-[11px] tabular-nums">
                                {m?.rollNo || 'No roll number'}
                              </p>
                              <p className="text-label-tertiary text-[11px] truncate">
                                {m?.email || 'No email'}
                              </p>
                              <p className="text-[10px] text-label-tertiary truncate">{getStudentDepartment(m)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </div>
  );
};

export default React.memo(ParticipantCard);
