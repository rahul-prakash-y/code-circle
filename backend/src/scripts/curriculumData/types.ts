export interface ISeedLevelData {
  levelNumber: number;
  title: string;
  points?: number;
  youtubeVideoId: string;
  youtubeVideoIds?: string[];
  videos?: Array<{ title?: string; youtubeVideoId: string }>;
  studyMaterials: Array<{
    title: string;
    type: 'article' | 'link' | 'code' | 'notes' | 'pdf';
    url?: string;
    content?: string;
  }>;
  questQuestions: Array<{
    question: string;
    options: string[];
    correctOption: number;
  }>;
  challenge: {
    title: string;
    description: string;
    inputFormat: string;
    outputFormat: string;
    constraints: string;
    sampleInput: string;
    sampleOutput: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    allowedLanguages: ('c' | 'cpp' | 'java' | 'javascript' | 'python')[];
    starterCode: Record<string, string>;
    testCases: Array<{
      input: string;
      expectedOutput: string;
      isHidden: boolean;
    }>;
  };
  assessmentQuestions: Array<{
    questionText: string;
    options: string[];
    correctOptionIndex: number;
    explanation: string;
    points: number;
  }>;
}

export interface ISeedTrackData {
  name: string;
  description: string;
  coverImageUrl: string;
  isLocked: boolean;
  levels: ISeedLevelData[];
}
