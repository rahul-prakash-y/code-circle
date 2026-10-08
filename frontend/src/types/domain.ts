export interface IDomain {
  _id: string;
  name: string;
  description: string;
  coverImageUrl: string;
  isLocked?: boolean;
  isLockedForStudent?: boolean;
  approvedBy?: any;
  approvedAt?: string | null;
  totalLevels?: number;
  completedLevelsCount?: number;
  progressPercentage?: number;
  isEnrolled?: boolean;
  enrolledStudentsCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface IQuestQuestion {
  _id?: string;
  question: string;
  options: string[];
  correctOption?: number;
}

export interface IStudyMaterial {
  _id?: string;
  title: string;
  type: 'article' | 'link' | 'code' | 'notes' | 'pdf';
  url?: string;
  content?: string;
}

export interface ILevelVideo {
  _id?: string;
  title?: string;
  youtubeVideoId: string;
}

export interface ILevel {
  _id: string;
  domainId: string;
  levelNumber: number;
  title: string;
  points?: number;
  youtubeVideoId: string;
  youtubeVideoIds?: string[];
  videos?: ILevelVideo[];
  studyMaterials?: IStudyMaterial[];
  questQuestions: IQuestQuestion[];
  assessmentId?: {
    _id: string;
    title: string;
    description?: string;
    category?: string;
    passingScorePercentage?: number;
    timeLimitMinutes?: number;
  } | string | null;
  codingChallengeId?: {
    _id: string;
    title: string;
    description?: string;
    difficulty?: 'Easy' | 'Medium' | 'Hard';
    allowedLanguages?: string[];
    timeLimitMinutes?: number;
    isPublished?: boolean;
  } | string | null;
  isCompleted?: boolean;
  isUnlocked?: boolean;
  requiresRegistration?: boolean;
  isQuestCompleted?: boolean;
  isCodingChallengeUnlocked?: boolean;
  isCodingChallengeCompleted?: boolean;
  requiresPreviousLevel?: number | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface IEnrolledStudent {
  enrollmentId: string;
  user: {
    _id: string;
    name: string;
    rollNo: string;
    email: string;
    department?: string;
    year?: string;
    college?: string;
    profilePicUrl?: string;
    role?: string;
  };
  enrolledAt: string;
  status: 'enrolled' | 'in_progress' | 'completed';
  completedLevelsCount: number;
  totalLevels: number;
  progressPercentage: number;
}

export interface IStudentProgress {
  completedLevels: string[];
  unlockedAssessments: string[];
  completedQuests?: string[];
  unlockedCodingChallenges?: string[];
  completedCodingChallenges?: string[];
}

export interface IQuestFeedback {
  questionIndex: number;
  question: string;
  selectedOption: number;
  isCorrect: boolean;
  correctOption?: number;
}

export interface IQuestSubmitResult {
  passed: boolean;
  score: number;
  total: number;
  passRate: number;
  pointsAwarded?: number;
  unlockedAssessmentId?: string | null;
  unlockedCodingChallengeId?: string | null;
  nextLevelId?: string | null;
  requiresCodingAssessment?: boolean;
  feedback?: IQuestFeedback[];
  message: string;
}

export interface ICourseAccessConfig {
  coursesVisibleToAll: boolean;
  hasAccess: boolean;
  isEarlyAccess?: boolean;
  isComingSoon?: boolean;
  allowedStudentsCount?: number;
}

export interface IStudentAccessItem {
  _id: string;
  name: string;
  rollNo: string;
  email: string;
  department?: string;
  year?: string;
  college?: string;
  isAllowed: boolean;
}

export interface IStudentAccessPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  totalStudents?: number;
  totalAllowed?: number;
}


