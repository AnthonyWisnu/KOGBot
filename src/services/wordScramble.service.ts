import { GameType, type ActiveGame, type WordScrambleQuestion } from '@prisma/client';

import { prisma } from '../database/prisma.js';
import type { WordScramblePayload } from '../types/wordScramble.js';
import { logger } from '../utils/logger.js';
import { normalizeText } from '../utils/normalize.js';
import { addWeeklyScore } from './score.service.js';
import {
  createWordScramblePayload,
  parseWordScramblePayload,
} from './wordScramblePayload.js';

const wordScramblePoint = 10;

export type StartedWordScramble = {
  game: ActiveGame;
  payload: WordScramblePayload;
};

export type WordScrambleAnswerResult =
  | {
      status: 'no_active_game';
    }
  | {
      status: 'wrong';
    }
  | {
      status: 'correct';
      payload: WordScramblePayload;
      points: number;
    };

export async function startWordScramble(params: {
  groupJid: string;
  startedBy: string;
}): Promise<StartedWordScramble | undefined> {
  try {
    const activeGame = await prisma.activeGame.findUnique({
      where: {
        groupJid_type: {
          groupJid: params.groupJid,
          type: GameType.WORD_SCRAMBLE,
        },
      },
    });

    if (activeGame) {
      return undefined;
    }

    const question = await pickRandomWordScrambleQuestion();
    const payload = createWordScramblePayload(question);
    const game = await prisma.activeGame.create({
      data: {
        groupJid: params.groupJid,
        type: GameType.WORD_SCRAMBLE,
        payload: JSON.stringify(payload),
        startedBy: params.startedBy,
      },
    });

    return {
      game,
      payload,
    };
  } catch (error) {
    logger.error({ error, params }, 'Gagal memulai Tebak Kata');
    throw error;
  }
}

export async function answerWordScramble(params: {
  groupJid: string;
  userJid: string;
  answer: string;
}): Promise<WordScrambleAnswerResult> {
  try {
    const activeGame = await prisma.activeGame.findUnique({
      where: {
        groupJid_type: {
          groupJid: params.groupJid,
          type: GameType.WORD_SCRAMBLE,
        },
      },
    });

    if (!activeGame) {
      return {
        status: 'no_active_game',
      };
    }

    const payload = parseWordScramblePayload(activeGame.payload);

    if (normalizeText(params.answer) !== payload.normalizedAnswer) {
      return {
        status: 'wrong',
      };
    }

    await prisma.activeGame.delete({
      where: {
        groupJid_type: {
          groupJid: params.groupJid,
          type: GameType.WORD_SCRAMBLE,
        },
      },
    });

    await addWeeklyScore({
      userJid: params.userJid,
      groupJid: params.groupJid,
      points: wordScramblePoint,
    });

    return {
      status: 'correct',
      payload,
      points: wordScramblePoint,
    };
  } catch (error) {
    logger.error({ error, params }, 'Gagal memproses jawaban Tebak Kata');
    throw error;
  }
}

export async function surrenderWordScramble(groupJid: string): Promise<WordScramblePayload | undefined> {
  try {
    const activeGame = await prisma.activeGame.findUnique({
      where: {
        groupJid_type: {
          groupJid,
          type: GameType.WORD_SCRAMBLE,
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
          type: GameType.WORD_SCRAMBLE,
        },
      },
    });

    return parseWordScramblePayload(activeGame.payload);
  } catch (error) {
    logger.error({ error, groupJid }, 'Gagal menyerah dari Tebak Kata');
    throw error;
  }
}

async function pickRandomWordScrambleQuestion(): Promise<WordScrambleQuestion> {
  try {
    const totalQuestions = await prisma.wordScrambleQuestion.count();

    if (totalQuestions === 0) {
      throw new Error('Seed Tebak Kata belum tersedia');
    }

    const question = await prisma.wordScrambleQuestion.findFirst({
      skip: Math.floor(Math.random() * totalQuestions),
    });

    if (!question) {
      throw new Error('Gagal memilih soal Tebak Kata');
    }

    return question;
  } catch (error) {
    logger.error({ error }, 'Gagal mengambil soal Tebak Kata acak');
    throw error;
  }
}
