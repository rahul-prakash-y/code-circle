/**
 * Code Circle Multi-Track Curriculum TypeScript Definitions
 * Strict database and RCE compatible types for 9 Tracks x 10 Levels.
 */

export type SupportedLanguage = 'c' | 'cpp' | 'java' | 'javascript' | 'python';

export type TrackCategory = 
  | 'Core Programming' 
  | 'Web Development' 
  | 'Artificial Intelligence' 
  | 'Cybersecurity & Systems';

export type LevelDifficulty =
  | 'Beginner (Foundations)'
  | 'Elementary (Core Syntax)'
  | 'Intermediate (Control & Logic)'
  | 'Upper-Intermediate (Data Structures & Tools)'
  | 'Advanced (Modular & Core Systems)'
  | 'Professional (Architecture & Deployment)'
  | 'Capstone (Production Engineering)';

export interface ITestCase {
  input: string;
  expectedOutput: string;
  isHidden: boolean;
  explanation?: string;
}

export interface ICodingChallengeSpec {
  id: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  problemStatement: string;
  inputFormat: string;
  outputFormat: string;
  constraints: string;
  sampleInput: string;
  sampleOutput: string;
  allowedLanguages: SupportedLanguage[];
  starterCode: Partial<Record<SupportedLanguage, string>>;
  solutionCode?: Partial<Record<SupportedLanguage, string>>;
  expectedBehavior: string;
  skillsTested: string[];
  testCases: ITestCase[];
}

export interface IMCQQuestion {
  id: string;
  question: string;
  options: string[];
  correctOption: number;
  explanation: string;
  points: number;
}

export interface IDebuggingExercise {
  id: string;
  title: string;
  language: SupportedLanguage;
  buggyCode: string;
  bugDescription: string;
  fixedCode: string;
  explanation: string;
}

export interface ILesson {
  id: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  learningObjectives: string[];
  conceptExplanation: string;
  syntaxReference?: string;
  simpleExample: {
    language: SupportedLanguage;
    code: string;
    explanation: string;
  };
  realWorldExample: {
    context: string;
    code: string;
    explanation: string;
  };
  commonMistakes: string[];
  debuggingExample: IDebuggingExercise;
  practiceQuestions: string[];
  codingExercise: {
    prompt: string;
    language: SupportedLanguage;
    starterCode: string;
    expectedOutput: string;
    hints: string[];
  };
  quiz: IMCQQuestion[];
  keyTakeaways: string[];
}

export interface IModule {
  id: string;
  moduleNumber: number;
  title: string;
  description: string;
  lessons: ILesson[];
}

export interface IMiniProject {
  id: string;
  title: string;
  tier: 'Level 1-2 Utility' | 'Level 3-4 Logic/Data' | 'Level 5-6 Structured App' | 'Level 7-8 Real-World App' | 'Level 9-10 Production/Capstone';
  description: string;
  realWorldScenario: string;
  specifications: string[];
  deliverables: string[];
  architectureOverview?: string;
  evaluationRubric: Array<{
    criteria: string;
    maxPoints: number;
  }>;
}

export interface ILevelAssessment {
  id: string;
  title: string;
  timeLimitMinutes: number;
  passingScorePercentage: number; // e.g. 70% threshold
  allowedLanguages: SupportedLanguage[];
  questRequiredScorePercentage: number; // e.g. 70% to unlock coding challenges
  rubricSummary: string;
}

export interface ILevel {
  levelNumber: number;
  title: string;
  difficulty: LevelDifficulty;
  description: string;
  estimatedHours: number;
  prerequisites: string[];
  skillsUnlocked: string[];
  modules: IModule[];
  questMCQs: IMCQQuestion[];
  codingChallenges: ICodingChallengeSpec[];
  miniProject: IMiniProject;
  assessment: ILevelAssessment;
}

export interface IPlacementInterviewQuestion {
  id: string;
  companyTarget?: string[];
  type: 'Aptitude/Logic' | 'Output Prediction' | 'Core DSA' | 'System Architecture' | 'Interview Scenario';
  question: string;
  codeSnippet?: string;
  expectedAnswer: string;
  explanation: string;
}

export interface ITrackGamification {
  totalXP: number;
  badgeName: string;
  badgeIcon: string;
  milestones: Array<{
    levelRequired: number;
    title: string;
    rewardXP: number;
  }>;
}

export interface ITrack {
  id: string;
  trackNumber: number;
  name: string;
  slug: string;
  category: TrackCategory;
  tagline: string;
  description: string;
  primaryLanguage: SupportedLanguage;
  coverImageUrl: string;
  levels: ILevel[];
  placementPrep: {
    interviewQuestions: IPlacementInterviewQuestion[];
    dsaFocusAreas: string[];
    topCompanyPatterns: string[];
  };
  gamification: ITrackGamification;
}
