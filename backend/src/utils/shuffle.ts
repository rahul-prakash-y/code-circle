import crypto from 'crypto';

/**
 * Cryptographically secure Fisher-Yates array shuffling utility.
 * Uses Node.js crypto.randomInt to guarantee uniform randomness and prevent PRNG predictability.
 *
 * @param array The array to shuffle
 * @returns A new array with elements in random order (does not mutate original array)
 */
export function secureShuffle<T>(array: T[]): T[] {
  if (!Array.isArray(array) || array.length <= 1) {
    return Array.isArray(array) ? [...array] : [];
  }

  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    // Generate secure random index in range [0, i]
    const j = crypto.randomInt(0, i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}

export interface ShuffledOption {
  optionId: string;
  text: string;
}

export interface ShuffledMCQQuestion {
  _id: any;
  questionText: string;
  options: ShuffledOption[];
  points: number;
}

/**
 * Securely shuffles both the question sequence and the options within each question.
 * Assigns a deterministic optionId (e.g., 'opt_0', 'opt_1') corresponding to the original index
 * so the backend evaluation engine can score without relying on screen display order.
 */
export function shuffleQuestionsAndOptions(questions: any[]): ShuffledMCQQuestion[] {
  if (!Array.isArray(questions)) return [];

  // 1. Process questions and shuffle options inside each question
  const preparedQuestions = questions.map((q) => {
    const rawOptions: string[] = Array.isArray(q.options) ? q.options : [];
    
    // Attach stable identifier to each option based on original position
    const optionsWithIds: ShuffledOption[] = rawOptions.map((text, origIndex) => ({
      optionId: `opt_${origIndex}`,
      text: typeof text === 'string' ? text : String(text),
    }));

    // Securely shuffle the options array (A/B/C/D order randomized)
    const shuffledOptions = secureShuffle(optionsWithIds);

    return {
      _id: q._id,
      questionText: q.questionText,
      options: shuffledOptions,
      points: q.points || 1,
    };
  });

  // 2. Securely shuffle the questions array (question order randomized)
  return secureShuffle(preparedQuestions);
}

export default {
  secureShuffle,
  shuffleQuestionsAndOptions,
};
