import type { NumberGuessPayload } from '../types/numberGuess.js';

export function createNumberGuessPayload(startedBy: string): NumberGuessPayload {
  return {
    targetNumber: 1 + Math.floor(Math.random() * 100),
    startedBy,
  };
}

export function parseNumberGuessPayload(payload: string): NumberGuessPayload {
  const parsedPayload: unknown = JSON.parse(payload);

  if (!isNumberGuessPayload(parsedPayload)) {
    throw new Error('Payload Tebak Angka tidak valid');
  }

  return parsedPayload;
}

function isNumberGuessPayload(value: unknown): value is NumberGuessPayload {
  if (!isRecord(value)) {
    return false;
  }

  return (
    Number.isInteger(value.targetNumber) &&
    typeof value.startedBy === 'string'
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
