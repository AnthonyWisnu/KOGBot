import type { TicTacToePayload } from '../types/ticTacToe.js';
import { formatMention } from './format.js';

export function formatTicTacToeBoard(payload: TicTacToePayload): string {
  const cells = payload.board.map((cell, index) => cell || String(index + 1));

  return [
    `${cells[0]} | ${cells[1]} | ${cells[2]}`,
    `${cells[3]} | ${cells[4]} | ${cells[5]}`,
    `${cells[6]} | ${cells[7]} | ${cells[8]}`,
  ].join('\n');
}

export function formatTicTacToeQuestion(payload: TicTacToePayload): string {
  return [
    'Tic Tac Toe',
    '',
    `X: ${formatMention(payload.playerX)}`,
    `O: ${formatMention(payload.playerO)}`,
    '',
    formatTicTacToeBoard(payload),
    '',
    `Giliran: ${formatMention(payload.turn)}`,
    'Ketik angka 1-9 untuk bermain.',
  ].join('\n');
}

export function formatTicTacToeResult(payload: TicTacToePayload): string {
  return [
    'Tic Tac Toe',
    '',
    `X: ${formatMention(payload.playerX)}`,
    `O: ${formatMention(payload.playerO)}`,
    '',
    formatTicTacToeBoard(payload),
  ].join('\n');
}
