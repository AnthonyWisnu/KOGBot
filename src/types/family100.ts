export type Family100AnswerPayload = {
  id: string;
  answer: string;
  normalizedAnswer: string;
  points: number;
};

export type FoundAnswerPayload = {
  answerId: string;
  foundBy: string;
  pointsAwarded?: boolean;
};

export type Family100Payload = {
  questionId: string;
  question: string;
  answers: Family100AnswerPayload[];
  foundAnswers: FoundAnswerPayload[];
};
