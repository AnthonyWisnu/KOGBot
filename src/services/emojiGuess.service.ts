import { GameType, type ActiveGame, type EmojiGuessQuestion } from '@prisma/client';

import { prisma } from '../database/prisma.js';
import type { EmojiGuessPayload } from '../types/emojiGuess.js';
import { logger } from '../utils/logger.js';
import { normalizeText } from '../utils/normalize.js';
import { addWeeklyScore } from './score.service.js';
import {
  createEmojiGuessPayload,
  parseEmojiGuessPayload,
} from './emojiGuessPayload.js';

const emojiGuessPoint = 10;

export type StartedEmojiGuess = {
  game: ActiveGame;
  payload: EmojiGuessPayload;
};

export type EmojiGuessAnswerResult =
  | {
      status: 'no_active_game';
    }
  | {
      status: 'wrong';
    }
  | {
      status: 'correct';
      payload: EmojiGuessPayload;
      points: number;
    };

export async function startEmojiGuess(params: {
  groupJid: string;
  startedBy: string;
}): Promise<StartedEmojiGuess | undefined> {
  try {
    const activeGame = await prisma.activeGame.findUnique({
      where: {
        groupJid_type: {
          groupJid: params.groupJid,
          type: GameType.EMOJI_GUESS,
        },
      },
    });

    if (activeGame) {
      return undefined;
    }

    const question = await pickRandomEmojiGuessQuestion();
    const payload = createEmojiGuessPayload(question);
    const game = await prisma.activeGame.create({
      data: {
        groupJid: params.groupJid,
        type: GameType.EMOJI_GUESS,
        payload: JSON.stringify(payload),
        startedBy: params.startedBy,
      },
    });

    return {
      game,
      payload,
    };
  } catch (error) {
    logger.error({ error, params }, 'Gagal memulai Tebak Emoji');
    throw error;
  }
}

export async function answerEmojiGuess(params: {
  groupJid: string;
  userJid: string;
  answer: string;
}): Promise<EmojiGuessAnswerResult> {
  try {
    const activeGame = await prisma.activeGame.findUnique({
      where: {
        groupJid_type: {
          groupJid: params.groupJid,
          type: GameType.EMOJI_GUESS,
        },
      },
    });

    if (!activeGame) {
      return {
        status: 'no_active_game',
      };
    }

    const payload = parseEmojiGuessPayload(activeGame.payload);

    if (normalizeText(params.answer) !== payload.normalizedAnswer) {
      return {
        status: 'wrong',
      };
    }

    await prisma.activeGame.delete({
      where: {
        groupJid_type: {
          groupJid: params.groupJid,
          type: GameType.EMOJI_GUESS,
        },
      },
    });

    await addWeeklyScore({
      userJid: params.userJid,
      groupJid: params.groupJid,
      points: emojiGuessPoint,
    });

    return {
      status: 'correct',
      payload,
      points: emojiGuessPoint,
    };
  } catch (error) {
    logger.error({ error, params }, 'Gagal memproses jawaban Tebak Emoji');
    throw error;
  }
}

export async function surrenderEmojiGuess(groupJid: string): Promise<EmojiGuessPayload | undefined> {
  try {
    const activeGame = await prisma.activeGame.findUnique({
      where: {
        groupJid_type: {
          groupJid,
          type: GameType.EMOJI_GUESS,
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
          type: GameType.EMOJI_GUESS,
        },
      },
    });

    return parseEmojiGuessPayload(activeGame.payload);
  } catch (error) {
    logger.error({ error, groupJid }, 'Gagal menyerah dari Tebak Emoji');
    throw error;
  }
}

async function pickRandomEmojiGuessQuestion(): Promise<EmojiGuessQuestion> {
  try {
    const totalQuestions = await prisma.emojiGuessQuestion.count();

    if (totalQuestions === 0) {
      throw new Error('Seed Tebak Emoji belum tersedia');
    }

    const question = await prisma.emojiGuessQuestion.findFirst({
      skip: Math.floor(Math.random() * totalQuestions),
    });

    if (!question) {
      throw new Error('Gagal memilih soal Tebak Emoji');
    }

    return question;
  } catch (error) {
    logger.error({ error }, 'Gagal mengambil soal Tebak Emoji acak');
    throw error;
  }
}
