import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import useDomainStore from '../store/useDomainStore';
import useAuthStore from '../store/useAuthStore';
import useProfileStore from '../store/useProfileStore';
import useCertificateStore from '../store/useCertificateStore';
import { IDomain, ILevel } from '../types/domain';
import LevelPathView from '../components/domains/LevelPathView';
import VideoQuestView from '../components/domains/VideoQuestView';
import QuestModal from '../components/domains/QuestModal';
import DomainEditorModal from '../components/domains/DomainEditorModal';
import LevelEditorModal from '../components/domains/LevelEditorModal';
import RegisteredStudentsModal from '../components/domains/RegisteredStudentsModal';
import StudentCourseAccessModal from '../components/domains/StudentCourseAccessModal';
import CoursesComingSoonView from '../components/domains/CoursesComingSoonView';
import CourseBulkUploadModal from '../components/domains/CourseBulkUploadModal';
import TutorialButton from '../components/common/TutorialButton';
import RestrictionBanner from '../components/common/RestrictionBanner';
import {
  Compass,
  ArrowRight,
  ArrowLeft,
  Search,
  Sparkles,
  CheckCircle2,
  Award,
  Layers,
  GraduationCap,
  PlayCircle,
  Clock,
  ChevronRight,
  Plus,
  Edit3,
  Trash2,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Lock,
  Unlock,
  BookOpen,
  Users,
  Check,
  Loader2,
  Crown,
  Eye,
  EyeOff,
  Globe,
  UserCheck,
  FileSpreadsheet,
} from 'lucide-react';

export const DomainsPage: React.FC = () => {
  const { domainId } = useParams<{ domainId?: string }>();
  const navigate = useNavigate();

  const {
    domains,
    currentDomain,
    levels,
    activeLevel,
    isQuestModalOpen,
    loading,
    setCurrentDomain,
    fetchDomains,
    fetchDomainLevels,
    setActiveLevel,
    closeQuestModal,
    deleteDomain,
    toggleDomainLock,
    registerForDomain,
    courseAccessConfig,
    isComingSoon,
    hasCourseAccess,
    isEarlyAccess,
    toggleCourseVisibility,
    fetchCourseAccessConfig,
  } = useDomainStore();

  const { user } = useAuthStore();
  const { profile } = useProfileStore();

  const isAdmin =
    profile?.role === 'Admin' ||
    profile?.role === 'SuperAdmin' ||
    profile?.role === 'Faculty' ||
    profile?.role === 'Committee' ||
    user?.role === 'Admin' ||
    user?.role === 'SuperAdmin';

  const isSuperAdmin =
    profile?.role === 'SuperAdmin' ||
    user?.role === 'SuperAdmin';

  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'in_progress' | 'completed'>('all');

  // Modal management states
  const [isDomainModalOpen, setIsDomainModalOpen] = useState(false);
  const [domainToEdit, setDomainToEdit] = useState<IDomain | null>(null);
  const [isLevelModalOpen, setIsLevelModalOpen] = useState(false);
  const [levelToEdit, setLevelToEdit] = useState<ILevel | null>(null);
  const [isStudentsModalOpen, setIsStudentsModalOpen] = useState(false);
  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [bulkUploadTargetDomain, setBulkUploadTargetDomain] = useState<{ id?: string; name?: string } | null>(null);
  const [selectedDomainForStudents, setSelectedDomainForStudents] = useState<IDomain | null>(null);
  const [registeringDomainId, setRegisteringDomainId] = useState<string | null>(null);
  const [claimingCert, setClaimingCert] = useState(false);
  const { claimCourseCertificate } = useCertificateStore();

  const isAllLevelsCompleted = levels.length > 0 && levels.every((lvl) => Boolean(lvl.isCompleted));

  const handleClaimCourseCertificate = async () => {
    if (!currentDomain?._id) return;
    setClaimingCert(true);
    try {
      const res = await claimCourseCertificate(currentDomain._id);
      if (res.success) {
        navigate('/certificates');
      }
    } finally {
      setClaimingCert(false);
    }
  };

  // Initial fetch of all domains and access config
  useEffect(() => {
    if (!domainId || domains.length === 0) {
      fetchDomains();
    }
    fetchCourseAccessConfig();
  }, [domainId, domains.length, fetchDomains, fetchCourseAccessConfig]);

  // Fetch domain levels if domainId route param is present
  useEffect(() => {
    if (domainId) {
      fetchDomainLevels(domainId);
    } else if (currentDomain) {
      setCurrentDomain(null);
    }
  }, [domainId, fetchDomainLevels, setCurrentDomain]);

  const filteredDomains = domains.filter((d) => {
    const matchesSearch =
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.description?.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (filterMode === 'completed') return (d.progressPercentage || 0) === 100;
    if (filterMode === 'in_progress') return (d.progressPercentage || 0) > 0 && (d.progressPercentage || 0) < 100;
    return true;
  });

  const totalTracks = domains.length;
  const totalLevels = domains.reduce((acc, d) => acc + (d.totalLevels || 0), 0);
  const totalCompletedLevels = domains.reduce((acc, d) => acc + (d.completedLevelsCount || 0), 0);

  const handleEditDomain = (e: React.MouseEvent, domain: IDomain) => {
    e.stopPropagation();
    setDomainToEdit(domain);
    setIsDomainModalOpen(true);
  };

  const handleDeleteDomain = async (e: React.MouseEvent, domain: IDomain) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete the course "${domain.name}" and all its levels?`)) {
      await deleteDomain(domain._id);
    }
  };

  const handleRegisterCourse = async (e: React.MouseEvent, domain: IDomain) => {
    e.stopPropagation();
    setRegisteringDomainId(domain._id);
    try {
      await registerForDomain(domain._id);
    } finally {
      setRegisteringDomainId(null);
    }
  };

  // --- ACCESS CONTROL GATE: When Courses are in "Coming Soon" Mode ---
  // If not admin, courses are in coming soon mode, and student does NOT have early access clearance:
  if (!isAdmin && isComingSoon && !hasCourseAccess) {
    return <CoursesComingSoonView />;
  }

  // --- LEVEL PATH VIEW (If domainId is selected in route) ---
  if (domainId) {
    const activeCourse = currentDomain || domains.find((d) => d._id === domainId);

    if (!activeCourse) {
      return (
        <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto py-2 sm:py-6 pb-16">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setCurrentDomain(null);
                navigate('/courses');
              }}
              className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-full bg-surface border border-separator flex items-center justify-center text-label-secondary hover:text-label-primary hover:bg-surface-secondary transition cursor-pointer"
              aria-label="Back to courses"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="space-y-1.5">
              <div className="h-3 w-20 bg-surface-secondary rounded animate-pulse" />
              <div className="h-6 w-44 bg-surface-secondary rounded-md animate-pulse" />
            </div>
          </div>
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Loader2 className="w-8 h-8 text-accent animate-spin" />
            <p className="text-xs text-label-secondary font-medium">Loading course track and curriculum...</p>
          </div>
        </div>
      );
    }

    const completedLevelsCount = levels.filter((l) => l.isCompleted).length;
    const questsPassedCount = levels.filter((l) => l.isQuestCompleted).length;
    const progressPercentage = levels.length > 0 ? Math.round((completedLevelsCount / levels.length) * 100) : 0;
    const totalDomainPoints = levels.reduce(
      (sum, l) => sum + (typeof l.points === 'number' && l.points >= 0 ? l.points : (l.levelNumber === 3 ? 250 : 150)),
      0
    );

    return (
      <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto py-2 sm:py-6 pb-16">
        {/* Executive Hero Banner Card */}
        <div className="p-5 sm:p-8 rounded-[28px] bg-gradient-to-br from-surface via-surface to-surface-secondary/80 border border-separator/80 shadow-[0_8px_30px_rgba(0,0,0,0.04)] space-y-6">
          {/* Top Row: Back Navigation, Breadcrumbs & Level Badge */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-separator/60">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setCurrentDomain(null);
                  navigate('/courses');
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 min-h-[36px] rounded-full text-xs font-semibold bg-surface border border-separator text-label-secondary hover:text-label-primary hover:bg-surface-secondary transition cursor-pointer shadow-2xs"
                aria-label="Back to courses"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>All Courses</span>
              </button>

              <div className="flex items-center gap-2 text-xs font-semibold text-accent uppercase tracking-wider">
                <span>/</span>
                <span className="truncate max-w-[180px] sm:max-w-none">{activeCourse.name}</span>
              </div>
            </div>

            {activeLevel && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-accent/10 text-accent border border-accent/20">
                <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                <span className="truncate max-w-[200px] sm:max-w-none">Active: Level {activeLevel.levelNumber} - {activeLevel.title}</span>
              </span>
            )}
          </div>

          {/* Middle Row: Course Title, Overview & Registration / Actions */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-label-primary">
                  {activeCourse.name}
                </h1>
                {activeCourse.category && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-surface-secondary border border-separator text-label-secondary">
                    {activeCourse.category}
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-label-secondary leading-relaxed">
                {activeCourse.description ||
                  'Watch focused video lectures, study technical concepts, clear mastery verification quests, and solve hands-on coding challenges to earn verified certification.'}
              </p>
            </div>

            {/* Quick Stats & Action Widget */}
            <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end gap-3 shrink-0">
              {/* Progress Summary Card */}
              <div className="p-3.5 px-4 rounded-2xl bg-surface-secondary/70 border border-separator/80 space-y-2 w-full sm:w-auto min-w-[240px]">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-label-secondary">Course Progress</span>
                  <span className="font-bold text-accent">{progressPercentage}%</span>
                </div>
                {/* Visual Progress Bar */}
                <div className="w-full bg-separator/60 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-accent to-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-label-tertiary">
                  <span>{completedLevelsCount} of {levels.length} Levels</span>
                  <span>+{totalDomainPoints} Total XP</span>
                </div>
              </div>

              {/* Enrollment / Status Button */}
              {!isAdmin && (
                activeCourse.isEnrolled ? (
                  <div className="inline-flex items-center gap-2 px-4 py-2 min-h-[38px] rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shadow-2xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>Enrolled Student</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => handleRegisterCourse(e, activeCourse)}
                    disabled={registeringDomainId === activeCourse._id}
                    className="inline-flex items-center gap-2 px-5 py-2.5 min-h-[42px] rounded-full text-xs font-bold bg-accent text-white hover:bg-accent-hover active:scale-98 transition shadow-md shadow-accent/25 cursor-pointer disabled:opacity-50"
                  >
                    {registeringDomainId === activeCourse._id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                    <span>Register for Course</span>
                  </button>
                )
              )}
            </div>
          </div>

          {/* Admin Toolbar (Neat Segmented Control) */}
          {isAdmin && (
            <div className="pt-3 border-t border-separator/60 flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-label-tertiary mr-1">
                Admin Controls:
              </span>
              <button
                type="button"
                onClick={() => {
                  setSelectedDomainForStudents(activeCourse);
                  setIsStudentsModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[36px] rounded-xl text-xs font-semibold bg-surface border border-separator text-label-primary hover:bg-surface-secondary transition cursor-pointer shadow-2xs"
                title="View registered student roster"
              >
                <Users className="w-3.5 h-3.5 text-accent" />
                <span>Students ({activeCourse.enrolledStudentsCount || 0})</span>
              </button>
              <button
                type="button"
                onClick={() => toggleDomainLock(activeCourse._id)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[36px] rounded-xl text-xs font-semibold border transition cursor-pointer shadow-2xs ${
                  activeCourse.isLocked
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20'
                    : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20'
                }`}
                title={activeCourse.isLocked ? 'Approve & Unlock course for students' : 'Lock course for students'}
              >
                {activeCourse.isLocked ? (
                  <>
                    <Lock className="w-3.5 h-3.5 text-amber-500" />
                    <span>Unlock for Students</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Course Approved</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setBulkUploadTargetDomain({ id: activeCourse._id, name: activeCourse.name });
                  setIsBulkUploadOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[36px] rounded-xl text-xs font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition cursor-pointer shadow-2xs"
                title="Bulk Upload Levels from Excel"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
                <span>Bulk Upload</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setLevelToEdit(null);
                  setIsLevelModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[36px] rounded-xl text-xs font-semibold bg-accent text-white hover:bg-accent-hover transition shadow-sm cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Level</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setDomainToEdit(activeCourse);
                  setIsDomainModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[36px] rounded-xl text-xs font-semibold bg-surface border border-separator text-label-primary hover:bg-surface-secondary transition cursor-pointer shadow-2xs"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Course</span>
              </button>
              <button
                type="button"
                onClick={() => navigate('/certificates')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[36px] rounded-xl text-xs font-semibold bg-accent/10 border border-accent/25 text-accent hover:bg-accent hover:text-white transition shadow-2xs cursor-pointer"
                title="Issue Course Completion Certificates"
              >
                <Award className="w-3.5 h-3.5" />
                <span>Certificates</span>
              </button>
            </div>
          )}
        </div>

        {/* Horizontal Level Milestone Stepper */}
        {levels.length > 0 && (
          <div className="p-2 sm:p-2.5 rounded-2xl bg-surface border border-separator/80 shadow-xs flex items-center gap-2 overflow-x-auto custom-scrollbar no-scrollbar touch-pan-x">
            <div className="flex items-center gap-1.5 shrink-0 px-2 text-xs font-bold uppercase tracking-wider text-label-secondary">
              <Compass className="w-4 h-4 text-accent" />
              <span>Curriculum:</span>
            </div>
            {levels.map((lvl) => {
              const isLvlActive = lvl._id === activeLevel?._id;
              const isLvlDone = Boolean(lvl.isCompleted);
              const isLvlUnlocked = Boolean(lvl.isUnlocked);
              const lvlPts =
                typeof lvl.points === 'number' && lvl.points >= 0
                  ? lvl.points
                  : (lvl.levelNumber === 3 ? 250 : 150);

              return (
                <button
                  key={lvl._id}
                  type="button"
                  onClick={() => isLvlUnlocked && setActiveLevel(lvl)}
                  className={`shrink-0 inline-flex items-center gap-2 px-3.5 py-2 min-h-[36px] rounded-xl text-xs font-semibold transition cursor-pointer border ${
                    isLvlActive
                      ? 'bg-accent text-white border-accent shadow-xs font-bold'
                      : isLvlDone
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20'
                      : isLvlUnlocked
                      ? 'bg-surface border-separator text-label-primary hover:bg-surface-secondary'
                      : 'bg-surface-secondary/40 border-separator/40 text-label-tertiary cursor-not-allowed opacity-60'
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                      isLvlActive
                        ? 'bg-white/20 text-white'
                        : isLvlDone
                        ? 'bg-emerald-500 text-white'
                        : 'bg-surface-secondary text-label-secondary'
                    }`}
                  >
                    {isLvlDone ? <Check className="w-3 h-3 stroke-[3]" /> : lvl.levelNumber}
                  </span>
                  <span className="truncate max-w-[160px] sm:max-w-[240px] font-medium">{lvl.title}</span>
                  <span className="text-[10px] opacity-75 font-mono">+{lvlPts}XP</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Course Completed Certificate Banner */}
        {isAllLevelsCompleted && !isAdmin && (
          <div className="p-5 rounded-[24px] bg-gradient-to-r from-amber-500/15 via-primary/10 to-emerald-500/15 border border-amber-500/30 text-label-primary flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-md shadow-amber-500/5">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-white flex items-center justify-center shrink-0 shadow-md">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-extrabold text-label-primary">
                    Course Curriculum Cleared! 🎉
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                    Certified
                  </span>
                </div>
                <p className="text-xs text-label-secondary mt-0.5 max-w-xl">
                  You have mastered all {levels.length} levels in {activeCourse.name}! Your institutional certificate backed by Code Circle and faculty is ready.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleClaimCourseCertificate}
              disabled={claimingCert}
              className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 min-h-[42px] rounded-full text-xs font-bold bg-gradient-to-r from-amber-500 to-primary text-white hover:brightness-110 active:scale-98 transition shadow-md shadow-primary/25 cursor-pointer disabled:opacity-50"
            >
              {claimingCert ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 text-amber-200" />
              )}
              <span>Claim & View Certificate</span>
            </button>
          </div>
        )}

        {/* Course Registration Hero Banner for Unregistered Students */}
        {!isAdmin && !activeCourse.isEnrolled && (
          <div className="p-5 rounded-[24px] bg-accent/10 border border-accent/20 text-label-primary flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-accent text-white flex items-center justify-center shrink-0 shadow-sm">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <div className="text-sm font-bold text-label-primary">
                  Course Registration Required
                </div>
                <p className="text-xs text-label-secondary mt-0.5 max-w-xl">
                  Register for this course to unlock video lectures, verification quests, and hands-on coding assessments.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={(e) => handleRegisterCourse(e, activeCourse)}
              disabled={registeringDomainId === activeCourse._id}
              className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 min-h-[42px] rounded-full text-xs font-bold bg-accent text-white hover:bg-accent-hover active:scale-98 transition shadow-md shadow-accent/20 cursor-pointer disabled:opacity-50"
            >
              {registeringDomainId === activeCourse._id ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              <span>Register for Course</span>
            </button>
          </div>
        )}

        {/* Locked Status Banner for Students & Faculty */}
        {activeCourse.isLocked && (
          <div className="p-5 rounded-[24px] bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-wider">
                  Course Locked • Pending Administrator Approval
                </div>
                <p className="text-xs opacity-90 mt-0.5 max-w-xl">
                  {activeCourse.isLockedForStudent
                    ? 'This course is currently locked by administrators. Video quests and assessment certifications will be accessible once approved.'
                    : 'This course is currently locked for students. As an administrator, you have full preview and testing privileges.'}
                </p>
              </div>
            </div>

            {isAdmin && (
              <button
                type="button"
                onClick={() => toggleDomainLock(activeCourse._id)}
                className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 min-h-[40px] rounded-full text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-500 transition shadow cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Approve & Unlock Course Now</span>
              </button>
            )}
          </div>
        )}

        {/* Course Content: Video/Quest Left, Progression Path Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 xl:gap-8 items-start">
          {/* Main Video & Quest View */}
          <div className="lg:col-span-7 xl:col-span-7 2xl:col-span-8 space-y-6">
            {activeLevel ? (
              <VideoQuestView
                level={activeLevel}
                onEditLevel={() => {
                  setLevelToEdit(activeLevel);
                  setIsLevelModalOpen(true);
                }}
              />
            ) : (
              <div className="p-10 sm:p-16 rounded-[28px] bg-surface text-center text-label-secondary border border-separator/80 shadow-xs space-y-3">
                <PlayCircle className="w-14 h-14 mx-auto stroke-1 opacity-40 text-accent" />
                <h3 className="text-base font-bold text-label-primary">No Level Selected</h3>
                <p className="text-xs max-w-md mx-auto">
                  Select a level from the progression path on the right or the curriculum bar above to begin studying.
                </p>
              </div>
            )}
          </div>

          {/* Level Timeline Progression Path Sidebar */}
          <div className="lg:col-span-5 xl:col-span-5 2xl:col-span-4 sticky top-20 space-y-4">
            <div className="p-5 sm:p-6 rounded-[26px] bg-surface/90 backdrop-blur-md border border-separator/80 shadow-[0_8px_30px_rgba(0,0,0,0.03)] space-y-4">
              <div className="flex items-center justify-between pb-3.5 border-b border-separator/70">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-accent/10 text-accent flex items-center justify-center shrink-0">
                    <Compass className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-label-primary">
                      Progression Path
                    </h3>
                    <p className="text-[11px] text-label-secondary">
                      {completedLevelsCount} of {levels.length} Cleared • {totalDomainPoints} XP
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-accent/10 text-accent border border-accent/20">
                  {progressPercentage}%
                </span>
              </div>

              <LevelPathView
                levels={levels}
                activeLevelId={activeLevel?._id}
                onSelectLevel={(level) => setActiveLevel(level)}
              />
            </div>
          </div>
        </div>

        {/* Responsive Quest Modal */}
        <QuestModal isOpen={isQuestModalOpen} onClose={closeQuestModal} />

        {/* Admin Modals */}
        {isLevelModalOpen && (
          <LevelEditorModal
            isOpen={isLevelModalOpen}
            domainId={activeCourse._id}
            levelToEdit={levelToEdit}
            onClose={() => setIsLevelModalOpen(false)}
          />
        )}
        {isDomainModalOpen && (
          <DomainEditorModal
            isOpen={isDomainModalOpen}
            domainToEdit={domainToEdit}
            onClose={() => setIsDomainModalOpen(false)}
          />
        )}
        {isStudentsModalOpen && (
          <RegisteredStudentsModal
            isOpen={isStudentsModalOpen}
            domain={selectedDomainForStudents || activeCourse}
            onClose={() => {
              setIsStudentsModalOpen(false);
              setSelectedDomainForStudents(null);
            }}
          />
        )}
        {isAccessModalOpen && (
          <StudentCourseAccessModal
            isOpen={isAccessModalOpen}
            onClose={() => setIsAccessModalOpen(false)}
          />
        )}
        {isBulkUploadOpen && (
          <CourseBulkUploadModal
            isOpen={isBulkUploadOpen}
            targetDomainId={bulkUploadTargetDomain?.id}
            targetDomainName={bulkUploadTargetDomain?.name}
            onClose={() => {
              setIsBulkUploadOpen(false);
              setBulkUploadTargetDomain(null);
            }}
            onSuccess={() => {
              fetchDomains();
              if (domainId) fetchDomainLevels(domainId);
            }}
          />
        )}
      </div>
    );
  }

  // --- GRID VIEW: Apple Spatial UI ---
  return (
    <div className="space-y-6 sm:space-y-8 mx-auto py-2 sm:py-6 pb-16">
      {/* Account Restriction Notice */}
      <RestrictionBanner feature="courses" />

      {/* Editorial Header */}
      <div className="pb-4 border-b border-separator flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <p className="meta-editorial text-label-secondary">Curated Course Curriculum</p>
            {isAdmin && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400">
                Admin Management Active
              </span>
            )}
          </div>
          <h1 className="display-headline text-label-primary">Courses</h1>
          <p className="text-[14px] text-label-secondary mt-1 max-w-2xl">
            Watch focused video tutorials, study key concepts, pass mastery verification quests, and solve hands-on coding assessments.
          </p>
        </div>

        {/* Action & Metric Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          {/* SuperAdmin Course Visibility & Access Control */}
          {isSuperAdmin && (
            <>
              {/* Show Courses / Coming Soon Button */}
              <button
                type="button"
                onClick={() => toggleCourseVisibility(!courseAccessConfig?.coursesVisibleToAll)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 min-h-[40px] rounded-full text-xs font-semibold transition shadow-sm cursor-pointer ${
                  courseAccessConfig?.coursesVisibleToAll
                    ? 'bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-600/20 active:scale-98'
                }`}
                title={
                  courseAccessConfig?.coursesVisibleToAll
                    ? 'Switch courses to Coming Soon mode'
                    : 'Make courses visible to all students'
                }
              >
                {courseAccessConfig?.coursesVisibleToAll ? (
                  <>
                    <EyeOff className="w-3.5 h-3.5" />
                    <span>Hide Courses (Coming Soon)</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-3.5 h-3.5" />
                    <span>Show Courses</span>
                  </>
                )}
              </button>

              {/* Selective Student Access Manager */}
              <button
                type="button"
                onClick={() => setIsAccessModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[40px] rounded-full text-xs font-semibold bg-surface border border-separator text-label-primary hover:bg-surface-secondary active:scale-98 transition shadow-xs cursor-pointer"
                title="Manage selective student permissions for courses"
              >
                <Crown className="w-3.5 h-3.5 text-amber-500" />
                <span>Allow Students ({courseAccessConfig?.allowedStudentsCount || 0})</span>
              </button>
            </>
          )}

          {isAdmin && (
            <>
              <button
                type="button"
                onClick={() => {
                  setBulkUploadTargetDomain(null);
                  setIsBulkUploadOpen(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[40px] rounded-full text-xs font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 active:scale-98 transition shadow-xs cursor-pointer"
                title="Bulk Upload Courses & Levels from Excel"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                <span>Bulk Upload (Excel)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setDomainToEdit(null);
                  setIsDomainModalOpen(true);
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 min-h-[40px] rounded-full text-xs font-semibold bg-accent text-white hover:bg-accent-hover active:scale-98 transition shadow-md shadow-accent/20 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create Course</span>
              </button>
            </>
          )}

          <TutorialButton tutorialId="courses" label="Course Guide" />

          <div className="px-4 py-2 rounded-2xl bg-surface border border-separator/60 shadow-sm flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-accent/10 text-accent flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-label-secondary uppercase tracking-wider">
                Courses
              </div>
              <div className="text-base font-bold text-label-primary">{totalTracks} Available</div>
            </div>
          </div>

          <div className="px-4 py-2 rounded-2xl bg-surface border border-separator/60 shadow-sm flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-label-secondary uppercase tracking-wider">
                Completed
              </div>
              <div className="text-base font-bold text-label-primary">
                {totalCompletedLevels} / {totalLevels} Levels
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SuperAdmin / Admin Banner when Courses are in Coming Soon Mode */}
      {isAdmin && courseAccessConfig && !courseAccessConfig.coursesVisibleToAll && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-800 dark:text-amber-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider">
                Courses Currently in "Coming Soon" Mode
              </div>
              <p className="text-xs opacity-90 mt-0.5">
                General students cannot view or register for courses. Early access is granted to {courseAccessConfig.allowedStudentsCount || 0} approved student(s).
              </p>
            </div>
          </div>
          {isSuperAdmin && (
            <button
              type="button"
              onClick={() => toggleCourseVisibility(true)}
              className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 min-h-[38px] rounded-full text-xs font-bold bg-amber-500 text-white hover:bg-amber-600 transition shadow-xs cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Show Courses Now</span>
            </button>
          )}
        </div>
      )}

      {/* Early Access Banner for Student */}
      {!isAdmin && isEarlyAccess && (
        <div className="p-4 rounded-2xl bg-accent/10 border border-accent/25 text-label-primary flex items-center gap-3 shadow-xs">
          <div className="w-9 h-9 rounded-xl bg-accent text-white flex items-center justify-center shrink-0 shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-accent uppercase tracking-wider">
              Exclusive Early Access Clearance
            </div>
            <p className="text-xs text-label-secondary mt-0.5">
              You have been granted early testing access to the course catalog by a SuperAdmin while public release is in preparation.
            </p>
          </div>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 text-label-tertiary absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search courses, topics, or technologies..."
            className="w-full pl-10 pr-4 py-2.5 min-h-[44px] rounded-full bg-surface border border-separator/80 text-sm text-label-primary placeholder:text-label-tertiary focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition shadow-sm"
          />
        </div>

        {/* Filter Badges */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-surface border border-separator shadow-sm text-xs font-medium overflow-x-auto custom-scrollbar no-scrollbar touch-pan-x flex-nowrap max-w-full">
          <button
            type="button"
            onClick={() => setFilterMode('all')}
            className={`px-3.5 py-1.5 min-h-[36px] whitespace-nowrap rounded-xl transition cursor-pointer ${
              filterMode === 'all'
                ? 'bg-accent text-white font-semibold shadow-xs'
                : 'text-label-secondary hover:text-label-primary'
            }`}
          >
            All Courses ({domains.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('in_progress')}
            className={`px-3.5 py-1.5 min-h-[36px] whitespace-nowrap rounded-xl transition cursor-pointer ${
              filterMode === 'in_progress'
                ? 'bg-accent text-white font-semibold shadow-xs'
                : 'text-label-secondary hover:text-label-primary'
            }`}
          >
            In Progress
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('completed')}
            className={`px-3.5 py-1.5 min-h-[36px] whitespace-nowrap rounded-xl transition cursor-pointer ${
              filterMode === 'completed'
                ? 'bg-accent text-white font-semibold shadow-xs'
                : 'text-label-secondary hover:text-label-primary'
            }`}
          >
            Mastered
          </button>
        </div>
      </div>

      {/* Grid of Course Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 3xl:grid-cols-4 gap-6 sm:gap-8">
        {filteredDomains.map((domain, index) => {
          const totalLvl = domain.totalLevels || 0;
          const completedLvl = domain.completedLevelsCount || 0;
          const pct = domain.progressPercentage || 0;

          return (
            <motion.div
              key={domain._id}
              whileHover={{ scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
              onClick={() => {
                setCurrentDomain(domain);
                navigate(`/courses/${domain._id}`);
              }}
              className="group cursor-pointer rounded-[28px] overflow-hidden bg-surface shadow-[0_8px_30px_rgb(0,0,0,0.04)] border-0 flex flex-col transition-all duration-300 relative"
            >
              {/* Cover Image Container */}
              <div className="relative w-full h-52 sm:h-56 overflow-hidden bg-surface-secondary">
                <img
                  src={domain.coverImageUrl}
                  alt={domain.name}
                  className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                  loading="lazy"
                />
                {/* Soft gradient wash */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                {/* Badges on image */}
                <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-md bg-black/40 text-white/90 border border-white/10">
                      {totalLvl} {totalLvl === 1 ? 'Level' : 'Levels'}
                    </span>
                    <span
                      className="px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-md bg-black/40 text-white/90 border border-white/10 flex items-center gap-1"
                      title={`${domain.enrolledStudentsCount || 0} registered students`}
                    >
                      <Users className="w-3 h-3 text-accent" /> {domain.enrolledStudentsCount || 0}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Lock Status Pill / Admin Quick-Toggle */}
                    {domain.isLocked ? (
                      isAdmin ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleDomainLock(domain._id);
                          }}
                          className="px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-md bg-amber-500/90 text-white border border-amber-400/30 flex items-center gap-1 hover:bg-amber-600 transition shadow cursor-pointer min-h-[30px]"
                          title="Course is locked for students. Click to approve & unlock."
                        >
                          <Lock className="w-3 h-3" /> Locked
                        </button>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-md bg-amber-500/90 text-white border border-amber-400/30 flex items-center gap-1 min-h-[30px]">
                          <Lock className="w-3 h-3" /> Locked
                        </span>
                      )
                    ) : (
                      isAdmin && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleDomainLock(domain._id);
                          }}
                          className="px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-md bg-emerald-500/85 text-white border border-emerald-400/30 flex items-center gap-1 hover:bg-emerald-600 transition shadow cursor-pointer min-h-[30px]"
                          title="Course is approved for students. Click to lock."
                        >
                          <ShieldCheck className="w-3 h-3" /> Approved
                        </button>
                      )
                    )}

                    {pct === 100 && (
                      <span className="px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-md bg-emerald-500/80 text-white border border-emerald-400/30 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Mastered
                      </span>
                    )}

                    {/* Admin inline action pills */}
                    {isAdmin && (
                      <div className="flex items-center gap-1 bg-black/50 backdrop-blur-md p-1 rounded-full border border-white/10">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDomainForStudents(domain);
                            setIsStudentsModalOpen(true);
                          }}
                          className="w-7 h-7 min-w-[28px] min-h-[28px] flex items-center justify-center rounded-full text-white/80 hover:text-white hover:bg-white/20 transition cursor-pointer"
                          title="View Registered Students"
                        >
                          <Users className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleEditDomain(e, domain)}
                          className="w-7 h-7 min-w-[28px] min-h-[28px] flex items-center justify-center rounded-full text-white/80 hover:text-white hover:bg-white/20 transition cursor-pointer"
                          title="Edit Course"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteDomain(e, domain)}
                          className="w-7 h-7 min-w-[28px] min-h-[28px] flex items-center justify-center rounded-full text-rose-300 hover:text-rose-100 hover:bg-rose-500/30 transition cursor-pointer"
                          title="Delete Course"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Floating title above gradient bottom */}
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <h3 className="text-xl sm:text-[22px] font-bold tracking-tight text-white drop-shadow-sm leading-snug">
                    {domain.name}
                  </h3>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-5">
                <p className="text-sm text-label-secondary line-clamp-2 leading-relaxed">
                  {domain.description}
                </p>

                <div className="space-y-3 pt-2">
                  {/* Progress Bar & Label */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-medium text-label-secondary">
                      <span>Progress</span>
                      <span className="text-label-primary font-semibold">
                        {completedLvl} / {totalLvl} Completed ({pct}%)
                      </span>
                    </div>

                    <div className="w-full h-2 rounded-full bg-surface-secondary overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut', delay: index * 0.1 }}
                        className={`h-full rounded-full transition-all ${
                          pct === 100
                            ? 'bg-emerald-500'
                            : 'bg-gradient-to-r from-accent to-accent-hover'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Card Action Link or Registration Button */}
                  {domain.isLockedForStudent ? (
                    <div className="pt-2 flex items-center justify-between text-xs font-semibold text-amber-600 dark:text-amber-400 group-hover:text-amber-500">
                      <span className="flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5" /> Awaiting Admin Approval
                      </span>
                      <div className="w-7 h-7 rounded-full bg-amber-500/10 flex items-center justify-center transition-transform group-hover:translate-x-1">
                        <ArrowRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  ) : !isAdmin && !domain.isEnrolled ? (
                    <div className="pt-2 flex items-center justify-between">
                      <span className="text-xs font-semibold text-label-secondary flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-accent" /> Open Registration
                      </span>
                      <button
                        type="button"
                        onClick={(e) => handleRegisterCourse(e, domain)}
                        disabled={registeringDomainId === domain._id}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 min-h-[34px] rounded-full text-xs font-semibold bg-accent text-white hover:bg-accent-hover active:scale-98 transition shadow cursor-pointer disabled:opacity-50"
                      >
                        {registeringDomainId === domain._id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Check className="w-3.5 h-3.5" />
                        )}
                        <span>Register</span>
                      </button>
                    </div>
                  ) : (
                    <div className="pt-2 flex items-center justify-between text-xs font-semibold text-accent group-hover:text-accent-hover">
                      <span>Explore Course & Quests</span>
                      <div className="w-7 h-7 rounded-full bg-accent/10 flex items-center justify-center transition-transform group-hover:translate-x-1">
                        <ArrowRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {filteredDomains.length === 0 && !loading && (
        <div className="text-center py-16 p-8 rounded-3xl bg-surface border border-separator/60">
          <Compass className="w-12 h-12 mx-auto stroke-1 text-label-tertiary mb-3" />
          <h3 className="text-base font-bold text-label-primary">No courses found</h3>
          <p className="text-xs text-label-secondary mt-1">
            Try adjusting your search query or create a new course using the button above.
          </p>
        </div>
      )}

      {/* Admin Domain Editor Modal */}
      {isDomainModalOpen && (
        <DomainEditorModal
          isOpen={isDomainModalOpen}
          domainToEdit={domainToEdit}
          onClose={() => setIsDomainModalOpen(false)}
        />
      )}

      {/* Admin Registered Students Modal */}
      {isStudentsModalOpen && (
        <RegisteredStudentsModal
          isOpen={isStudentsModalOpen}
          domain={selectedDomainForStudents || currentDomain!}
          onClose={() => {
            setIsStudentsModalOpen(false);
            setSelectedDomainForStudents(null);
          }}
        />
      )}

      {/* SuperAdmin Course Access Control Modal */}
      {isAccessModalOpen && (
        <StudentCourseAccessModal
          isOpen={isAccessModalOpen}
          onClose={() => setIsAccessModalOpen(false)}
        />
      )}

      {/* Admin Bulk Upload Modal */}
      {isBulkUploadOpen && (
        <CourseBulkUploadModal
          isOpen={isBulkUploadOpen}
          targetDomainId={bulkUploadTargetDomain?.id}
          targetDomainName={bulkUploadTargetDomain?.name}
          onClose={() => {
            setIsBulkUploadOpen(false);
            setBulkUploadTargetDomain(null);
          }}
          onSuccess={() => {
            fetchDomains();
            if (domainId) fetchDomainLevels(domainId);
          }}
        />
      )}
    </div>
  );
};

export default DomainsPage;
