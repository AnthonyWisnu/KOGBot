import type { Family100Answer, Family100Question } from '@prisma/client';

import type {
  Family100AnswerPayload,
  Family100Payload,
  FoundAnswerPayload,
} from '../types/family100.js';

type FamilyQuestionWithAnswers = Family100Question & {
  answers: Family100Answer[];
};

export function createFamily100Payload(question: FamilyQuestionWithAnswers): Family100Payload {
  return {
    questionId: question.id,
    question: question.question,
    answers: question.answers.map((answer) => ({
      id: answer.id,
      answer: answer.answer,
      normalizedAnswer: answer.normalizedAnswer,
      points: answer.points,
    })),
    foundAnswers: [],
  };
}

export function parseFamily100Payload(payload: string): Family100Payload {
  const parsedPayload: unknown = JSON.parse(payload);

  if (!isFamily100Payload(parsedPayload)) {
    throw new Error('Payload Family 100 tidak valid');
  }

  return parsedPayload;
}

function isFamily100Payload(value: unknown): value is Family100Payload {
  if (!isRecord(value) || !Array.isArray(value.answers) || !Array.isArray(value.foundAnswers)) {
    return false;
  }

  return (
    typeof value.questionId === 'string' &&
    typeof value.question === 'string' &&
    value.answers.every(isFamily100AnswerPayload) &&
    value.foundAnswers.every(isFoundAnswerPayload)
  );
}

function isFamily100AnswerPayload(value: unknown): value is Family100AnswerPayload {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === 'string' &&
    typeof value.answer === 'string' &&
    typeof value.normalizedAnswer === 'string' &&
    typeof value.points === 'number'
  );
}

function isFoundAnswerPayload(value: unknown): value is FoundAnswerPayload {
  if (!isRecord(value)) {
    return false;
  }

  return typeof value.answerId === 'string' && typeof value.foundBy === 'string';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
