import type { Family100Payload } from '../types/family100.js';

export function formatFamily100Question(payload: Family100Payload): string {
  return [
    'Family 100',
    '',
    payload.question,
    '',
    'Jawaban ditemukan:',
    ...formatFamily100Progress(payload),
  ].join('\n');
}

export function formatFamily100Answers(payload: Family100Payload): string[] {
  return payload.answers.map((answer, index) => {
    return `${index + 1}. ${answer.answer} - ${answer.points} poin`;
  });
}

export function formatFamily100Surrender(payload: Family100Payload, awardedPoints: number): string {
  const settlementLine = awardedPoints > 0
    ? `Poin jawaban yang sudah ditemukan ditambahkan: +${awardedPoints} poin.`
    : 'Poin jawaban yang sudah ditemukan sudah tercatat.';

  return [
    'Family 100 dihentikan.',
    settlementLine,
    '',
    'Jawaban:',
    ...formatFamily100Answers(payload),
  ].join('\n');
}

export function formatFamily100Progress(payload: Family100Payload): string[] {
  return payload.answers.map((answer, index) => {
    const found = payload.foundAnswers.some((item) => item.answerId === answer.id);

    return `${index + 1}. ${found ? answer.answer : createAnswerMask(answer.answer)}`;
  });
}

function createAnswerMask(answer: string): string {
  return answer
    .split('')
    .map((character) => (character === ' ' ? ' ' : '_'))
    .join('');
}
