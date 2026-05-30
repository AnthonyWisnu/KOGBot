import { GameType, type ActiveGame } from '@prisma/client';

import { prisma } from '../database/prisma.js';
import type { NumberGuessPayload } from '../types/numberGuess.js';
import { logger } from '../utils/logger.js';
import { addWeeklyScore } from './score.service.js';
import { incrementGamesWon } from './userStats.service.js';
import {
  createNumberGuessPayload,
  parseNumberGuessPayload,
} from './numberGuessPayload.js';

const numberGuessPoint = 15;

export type StartedNumberGuess = {
  game: ActiveGame;
  payload: NumberGuessPayload;
};

export type NumberGuessAnswerResult =
  | {
      status: 'no_active_game';
    }
  | {
      status: 'not_number';
    }
  | {
      status: 'too_low';
    }
  | {
      status: 'too_high';
    }
  | {
      status: 'correct';
      payload: NumberGuessPayload;
      points: number;
    };

export async function startNumberGuess(params: {
  groupJid: string;
  startedBy: string;
}): Promise<StartedNumberGuess | undefined> {
  try {
    const activeGame = await prisma.activeGame.findUnique({
      where: {
        groupJid_type: {
          groupJid: params.groupJid,
          type: GameType.NUMBER_GUESS,
        },
      },
    });

    if (activeGame) {
      return undefined;
    }

    const payload = createNumberGuessPayload(params.startedBy);
    const game = await prisma.activeGame.create({
      data: {
        groupJid: params.groupJid,
        type: GameType.NUMBER_GUESS,
        payload: JSON.stringify(payload),
        startedBy: params.startedBy,
      },
    });

    return {
      game,
      payload,
    };
  } catch (error) {
    logger.error({ error, params }, 'Gagal memulai Tebak Angka');
    throw error;
  }
}

export async function answerNumberGuess(params: {
  groupJid: string;
  userJid: string;
  answer: string;
}): Promise<NumberGuessAnswerResult> {
  try {
    const activeGame = await prisma.activeGame.findUnique({
      where: {
        groupJid_type: {
          groupJid: params.groupJid,
          type: GameType.NUMBER_GUESS,
        },
      },
    });

    if (!activeGame) {
      return {
        status: 'no_active_game',
      };
    }

    if (!/^\d+$/.test(params.answer.trim())) {
      return {
        status: 'not_number',
      };
    }

    const payload = parseNumberGuessPayload(activeGame.payload);
    const guessedNumber = Number(params.answer.trim());

    if (guessedNumber < payload.targetNumber) {
      return {
        status: 'too_low',
      };
    }

    if (guessedNumber > payload.targetNumber) {
      return {
        status: 'too_high',
      };
    }

    await prisma.activeGame.delete({
      where: {
        groupJid_type: {
          groupJid: params.groupJid,
          type: GameType.NUMBER_GUESS,
        },
      },
    });

    await addWeeklyScore({
      userJid: params.userJid,
      groupJid: params.groupJid,
      points: numberGuessPoint,
    });
    await incrementGamesWon({
      userJid: params.userJid,
      groupJid: params.groupJid,
    });

    return {
      status: 'correct',
      payload,
      points: numberGuessPoint,
    };
  } catch (error) {
    logger.error({ error, params }, 'Gagal memproses jawaban Tebak Angka');
    throw error;
  }
}

export async function surrenderNumberGuess(groupJid: string): Promise<NumberGuessPayload | undefined> {
  try {
    const activeGame = await prisma.activeGame.findUnique({
      where: {
        groupJid_type: {
          groupJid,
          type: GameType.NUMBER_GUESS,
        },
      },
    });

    if (!activeGame) {
      return undefined;
    }

    await prisma.activeGame.delete({
      where: {
        groupJid_type: {
          groupJid,
          type: GameType.NUMBER_GUESS,
        },
      },
    });

    return parseNumberGuessPayload(activeGame.payload);
  } catch (error) {
    logger.error({ error, groupJid }, 'Gagal menyerah dari Tebak Angka');
    throw error;
  }
}
