import type { WordScrambleQuestion } from '@prisma/client';

import type { WordScramblePayload } from '../types/wordScramble.js';

export function createWordScramblePayload(
  question: WordScrambleQuestion,
): WordScramblePayload {
  return {
    questionId: question.id,
    category: question.category,
    answer: question.answer,
    normalizedAnswer: question.normalizedAnswer,
    scrambledLetters: scrambleWord(question.answer),
  };
}

export function parseWordScramblePayload(payload: string): WordScramblePayload {
  const parsedPayload: unknown = JSON.parse(payload);

  if (!isWordScramblePayload(parsedPayload)) {
    throw new Error('Payload Tebak Kata tidak valid');
  }

  return parsedPayload;
}

function scrambleWord(answer: string): string[] {
  const letters = answer
    .replace(/\s+/g, '')
    .toUpperCase()
    .split('');

  if (letters.length <= 1) {
    return letters;
  }

  const sortedLetters = [...letters].sort((first, second) => {
    return second.charCodeAt(0) - first.charCodeAt(0);
  });

  if (sortedLetters.join('') === letters.join('')) {
    return [...sortedLetters.slice(1), sortedLetters[0]].filter((letter): letter is string => {
      return Boolean(letter);
    });
  }

  return sortedLetters;
}

function isWordScramblePayload(value: unknown): value is WordScramblePayload {
  if (!isRecord(value) || !Array.isArray(value.scrambledLetters)) {
    return false;
  }

  return (
    typeof value.questionId === 'string' &&
    typeof value.category === 'string' &&
    typeof value.answer === 'string' &&
    typeof value.normalizedAnswer === 'string' &&
    value.scrambledLetters.every((letter) => typeof letter === 'string')
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
