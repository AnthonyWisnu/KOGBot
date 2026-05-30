import type { WordScramblePayload } from '../types/wordScramble.js';

export function formatWordScrambleQuestion(payload: WordScramblePayload): string {
  return [
    'Tebak Kata',
    '',
    'Huruf acak:',
    payload.scrambledLetters.join(' '),
    '',
    'Petunjuk:',
    payload.category,
    '',
    'Jawab langsung di chat.',
  ].join('\n');
}

export function formatWordScrambleAnswer(payload: WordScramblePayload): string {
  return payload.answer.toUpperCase();
}
