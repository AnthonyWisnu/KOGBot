import type { EmojiGuessQuestion } from '@prisma/client';

import type { EmojiGuessPayload } from '../types/emojiGuess.js';

export function createEmojiGuessPayload(question: EmojiGuessQuestion): EmojiGuessPayload {
  return {
    questionId: question.id,
    emoji: question.emoji,
    answer: question.answer,
    normalizedAnswer: question.normalizedAnswer,
  };
}

export function parseEmojiGuessPayload(payload: string): EmojiGuessPayload {
  const parsedPayload: unknown = JSON.parse(payload);

  if (!isEmojiGuessPayload(parsedPayload)) {
    throw new Error('Payload Tebak Emoji tidak valid');
  }

  return parsedPayload;
}

function isEmojiGuessPayload(value: unknown): value is EmojiGuessPayload {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.questionId === 'string' &&
    typeof value.emoji === 'string' &&
    typeof value.answer === 'string' &&
    typeof value.normalizedAnswer === 'string'
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
