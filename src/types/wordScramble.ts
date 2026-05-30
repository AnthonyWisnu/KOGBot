export type WordScramblePayload = {
  questionId: string;
  category: string;
  answer: string;
  normalizedAnswer: string;
  scrambledLetters: string[];
};
