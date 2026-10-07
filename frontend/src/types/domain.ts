export interface IDomain {
  _id: string;
  name: string;
  description: string;
  coverImageUrl: string;
  totalLevels?: number;
  completedLevelsCount?: number;
  progressPercentage?: number;
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

export interface ILevel {
  _id: string;
  domainId: string;
  levelNumber: number;
  title: string;
  youtubeVideoId: string;
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
  isCompleted?: boolean;
  isUnlocked?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface IStudentProgress {
  completedLevels: string[];
  unlockedAssessments: string[];
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
  unlockedAssessmentId?: string | null;
  nextLevelId?: string | null;
  feedback?: IQuestFeedback[];
  message: string;
}
