import { GameType, type ActiveGame } from '@prisma/client';

import { prisma } from '../database/prisma.js';
import type {
  TicTacToeCell,
  TicTacToeMark,
  TicTacToePayload,
} from '../types/ticTacToe.js';
import { isSameUserJid } from '../utils/jid.js';
import { logger } from '../utils/logger.js';
import { addWeeklyScore } from './score.service.js';
import { incrementGamesWon } from './userStats.service.js';
import {
  createTicTacToePayload,
  parseTicTacToePayload,
} from './ticTacToePayload.js';

const winPoint = 20;
const drawPoint = 5;
const winLines = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
] as const;

export type StartedTicTacToe = {
  game: ActiveGame;
  payload: TicTacToePayload;
};

export type TicTacToeMoveResult =
  | {
      status: 'no_active_game';
    }
  | {
      status: 'not_player';
    }
  | {
      status: 'not_turn';
      payload: TicTacToePayload;
    }
  | {
      status: 'invalid_position';
    }
  | {
      status: 'occupied';
      payload: TicTacToePayload;
    }
  | {
      status: 'moved';
      payload: TicTacToePayload;
    }
  | {
      status: 'win';
      payload: TicTacToePayload;
      winnerJid: string;
      points: number;
    }
  | {
      status: 'draw';
      payload: TicTacToePayload;
      points: number;
    };

export type TicTacToeSurrenderResult =
  | {
      status: 'no_active_game';
    }
  | {
      status: 'stopped';
      payload: TicTacToePayload;
    }
  | {
      status: 'win';
      payload: TicTacToePayload;
      winnerJid: string;
      points: number;
    };

export async function startTicTacToe(params: {
  groupJid: string;
  playerX: string;
  playerO: string;
}): Promise<StartedTicTacToe | undefined> {
  try {
    const activeGame = await prisma.activeGame.findUnique({
      where: {
        groupJid_type: {
          groupJid: params.groupJid,
          type: GameType.TICTACTOE,
        },
      },
    });

    if (activeGame) {
      return undefined;
    }

    const payload = createTicTacToePayload({
      playerX: params.playerX,
      playerO: params.playerO,
    });
    const game = await prisma.activeGame.create({
      data: {
        groupJid: params.groupJid,
        type: GameType.TICTACTOE,
        payload: JSON.stringify(payload),
        startedBy: params.playerX,
      },
    });

    return {
      game,
      payload,
    };
  } catch (error) {
    logger.error({ error, params }, 'Gagal memulai Tic Tac Toe');
    throw error;
  }
}

export async function playTicTacToeMove(params: {
  groupJid: string;
  userJid: string;
  input: string;
}): Promise<TicTacToeMoveResult> {
  try {
    const activeGame = await prisma.activeGame.findUnique({
      where: {
        groupJid_type: {
          groupJid: params.groupJid,
          type: GameType.TICTACTOE,
        },
      },
    });

    if (!activeGame) {
      return {
        status: 'no_active_game',
      };
    }

    const position = parseMovePosition(params.input);

    if (position === undefined) {
      return {
        status: 'invalid_position',
      };
    }

    const payload = parseTicTacToePayload(activeGame.payload);
    const mark = getPlayerMark(payload, params.userJid);

    if (!mark) {
      return {
        status: 'not_player',
      };
    }

    if (!isSameUserJid(payload.turn, params.userJid)) {
      return {
        status: 'not_turn',
        payload,
      };
    }

    if (payload.board[position] !== '') {
      return {
        status: 'occupied',
        payload,
      };
    }

    const nextPayload = applyMove(payload, position, mark);
    const winner = getWinner(nextPayload.board);

    if (winner) {
      const winnerJid = getPlayerJid(nextPayload, winner);
      await endTicTacToe(params.groupJid);
      await addWeeklyScore({
        userJid: winnerJid,
        groupJid: params.groupJid,
        points: winPoint,
      });
      await incrementGamesWon({
        userJid: winnerJid,
        groupJid: params.groupJid,
      });

      return {
        status: 'win',
        payload: nextPayload,
        winnerJid,
        points: winPoint,
      };
    }

    if (nextPayload.board.every((cell) => cell !== '')) {
      await endTicTacToe(params.groupJid);
      await Promise.all([
        addWeeklyScore({
          userJid: nextPayload.playerX,
          groupJid: params.groupJid,
          points: drawPoint,
        }),
        addWeeklyScore({
          userJid: nextPayload.playerO,
          groupJid: params.groupJid,
          points: drawPoint,
        }),
      ]);

      return {
        status: 'draw',
        payload: nextPayload,
        points: drawPoint,
      };
    }

    await prisma.activeGame.update({
      where: {
        groupJid_type: {
          groupJid: params.groupJid,
          type: GameType.TICTACTOE,
        },
      },
      data: {
        payload: JSON.stringify(nextPayload),
      },
    });

    return {
      status: 'moved',
      payload: nextPayload,
    };
  } catch (error) {
    logger.error({ error, params }, 'Gagal memproses langkah Tic Tac Toe');
    throw error;
  }
}

export async function surrenderTicTacToe(params: {
  groupJid: string;
  userJid: string;
}): Promise<TicTacToeSurrenderResult> {
  try {
    const activeGame = await prisma.activeGame.findUnique({
      where: {
        groupJid_type: {
          groupJid: params.groupJid,
          type: GameType.TICTACTOE,
        },
      },
    });

    if (!activeGame) {
      return {
        status: 'no_active_game',
      };
    }

    const payload = parseTicTacToePayload(activeGame.payload);
    const surrenderMark = getPlayerMark(payload, params.userJid);
    await endTicTacToe(params.groupJid);

    if (!surrenderMark) {
      return {
        status: 'stopped',
        payload,
      };
    }

    const winnerJid = surrenderMark === 'X' ? payload.playerO : payload.playerX;
    await addWeeklyScore({
      userJid: winnerJid,
      groupJid: params.groupJid,
      points: winPoint,
    });
    await incrementGamesWon({
      userJid: winnerJid,
      groupJid: params.groupJid,
    });

    return {
      status: 'win',
      payload,
      winnerJid,
      points: winPoint,
    };
  } catch (error) {
    logger.error({ error, params }, 'Gagal menyerah dari Tic Tac Toe');
    throw error;
  }
}

function parseMovePosition(input: string): number | undefined {
  if (!/^[1-9]$/.test(input.trim())) {
    return undefined;
  }

  return Number(input.trim()) - 1;
}

function getPlayerMark(payload: TicTacToePayload, userJid: string): TicTacToeMark | undefined {
  if (isSameUserJid(payload.playerX, userJid)) {
    return 'X';
  }

  if (isSameUserJid(payload.playerO, userJid)) {
    return 'O';
  }

  return undefined;
}

function getPlayerJid(payload: TicTacToePayload, mark: TicTacToeMark): string {
  return mark === 'X' ? payload.playerX : payload.playerO;
}

function applyMove(
  payload: TicTacToePayload,
  position: number,
  mark: TicTacToeMark,
): TicTacToePayload {
  const board = payload.board.map((cell, index): TicTacToeCell => {
    return index === position ? mark : cell;
  });

  return {
    ...payload,
    board,
    turn: mark === 'X' ? payload.playerO : payload.playerX,
  };
}

function getWinner(board: TicTacToeCell[]): TicTacToeMark | undefined {
  for (const [first, second, third] of winLines) {
    const firstCell = board[first];

    if (firstCell && firstCell === board[second] && firstCell === board[third]) {
      return firstCell;
    }
  }

  return undefined;
}

async function endTicTacToe(groupJid: string): Promise<void> {
  await prisma.activeGame.delete({
    where: {
      groupJid_type: {
        groupJid,
        type: GameType.TICTACTOE,
      },
    },
  });
}
