import type { NumberGuessPayload } from '../types/numberGuess.js';

export function formatNumberGuessQuestion(): string {
  return [
    'Tebak Angka',
    '',
    'Aku menyimpan angka dari 1 sampai 100.',
    'Coba tebak angkanya!',
  ].join('\n');
}

export function formatNumberGuessAnswer(payload: NumberGuessPayload): string {
  return `${payload.targetNumber}`;
}
