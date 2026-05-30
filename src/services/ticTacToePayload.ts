import type {
  TicTacToeCell,
  TicTacToePayload,
} from '../types/ticTacToe.js';

export function createTicTacToePayload(params: {
  playerX: string;
  playerO: string;
}): TicTacToePayload {
  return {
    playerX: params.playerX,
    playerO: params.playerO,
    turn: params.playerX,
    board: ['', '', '', '', '', '', '', '', ''],
  };
}

export function parseTicTacToePayload(payload: string): TicTacToePayload {
  const parsedPayload: unknown = JSON.parse(payload);

  if (!isTicTacToePayload(parsedPayload)) {
    throw new Error('Payload Tic Tac Toe tidak valid');
  }

  return parsedPayload;
}

function isTicTacToePayload(value: unknown): value is TicTacToePayload {
  if (!isRecord(value) || !Array.isArray(value.board)) {
    return false;
  }

  return (
    typeof value.playerX === 'string' &&
    typeof value.playerO === 'string' &&
    typeof value.turn === 'string' &&
    value.board.length === 9 &&
    value.board.every(isTicTacToeCell)
  );
}

function isTicTacToeCell(value: unknown): value is TicTacToeCell {
  return value === '' || value === 'X' || value === 'O';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
