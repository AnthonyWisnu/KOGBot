import {
  GameType,
  type ActiveGame,
  type Family100Answer,
  type Family100Question,
} from '@prisma/client';

import { prisma } from '../database/prisma.js';
import type {
  Family100AnswerPayload,
  Family100Payload,
} from '../types/family100.js';
import { addWeeklyScore } from './score.service.js';
import { incrementGamesWon } from './userStats.service.js';
import {
  createFamily100Payload,
  parseFamily100Payload,
} from './family100Payload.js';
import { normalizeText } from '../utils/normalize.js';
import { logger } from '../utils/logger.js';

type FamilyQuestionWithAnswers = Family100Question & {
  answers: Family100Answer[];
};

export type StartedFamily100 = {
  game: ActiveGame;
  payload: Family100Payload;
};

export type Family100AnswerResult =
  | {
      status: 'no_active_game';
    }
  | {
      status: 'wrong';
    }
  | {
      status: 'duplicate';
    }
  | {
      status: 'correct';
      answer: Family100AnswerPayload;
      points: number;
      payload: Family100Payload;
      completed: boolean;
    };

export type SurrenderFamily100Result = {
  payload: Family100Payload;
  awardedPoints: number;
};

export async function startFamily100(params: {
  groupJid: string;
  startedBy: string;
}): Promise<StartedFamily100 | undefined> {
  try {
    const activeGame = await prisma.activeGame.findUnique({
      where: {
        groupJid_type: {
          groupJid: params.groupJid,
          type: GameType.FAMILY100,
        },
      },
    });

    if (activeGame) {
      return undefined;
    }

    const question = await pickRandomFamily100Question();
    const payload = createFamily100Payload(question);
    const game = await prisma.activeGame.create({
      data: {
        groupJid: params.groupJid,
        type: GameType.FAMILY100,
        payload: JSON.stringify(payload),
        startedBy: params.startedBy,
      },
    });

    return {
      game,
      payload,
    };
  } catch (error) {
    logger.error({ error, params }, 'Gagal memulai Family 100');
    throw error;
  }
}

export async function answerFamily100(params: {
  groupJid: string;
  userJid: string;
  answer: string;
}): Promise<Family100AnswerResult> {
  try {
    const activeGame = await prisma.activeGame.findUnique({
      where: {
        groupJid_type: {
          groupJid: params.groupJid,
          type: GameType.FAMILY100,
        },
      },
    });

    if (!activeGame) {
      return {
        status: 'no_active_game',
      };
    }

    const payload = parseFamily100Payload(activeGame.payload);
    const normalizedAnswer = normalizeText(params.answer);
    const answer = payload.answers.find((item) => {
      return item.normalizedAnswer === normalizedAnswer;
    });

    if (!answer) {
      return {
        status: 'wrong',
      };
    }

    const alreadyFound = payload.foundAnswers.some((item) => item.answerId === answer.id);

    if (alreadyFound) {
      return {
        status: 'duplicate',
      };
    }

    const pendingPayload: Family100Payload = {
      ...payload,
      foundAnswers: [
        ...payload.foundAnswers,
        {
          answerId: answer.id,
          foundBy: params.userJid,
          pointsAwarded: false,
        },
      ],
    };
    await addWeeklyScore({
      userJid: params.userJid,
      groupJid: params.groupJid,
      points: answer.points,
    });

    const nextPayload: Family100Payload = {
      ...pendingPayload,
      foundAnswers: pendingPayload.foundAnswers.map((foundAnswer) => {
        if (foundAnswer.answerId !== answer.id) {
          return foundAnswer;
        }

        return {
          ...foundAnswer,
          pointsAwarded: true,
        };
      }),
    };
    const completed = nextPayload.foundAnswers.length === nextPayload.answers.length;

    if (completed) {
      await prisma.activeGame.delete({
        where: {
          groupJid_type: {
            groupJid: params.groupJid,
            type: GameType.FAMILY100,
          },
        },
      });
      await incrementGamesWon({
        userJid: params.userJid,
        groupJid: params.groupJid,
      });
    } else {
      await prisma.activeGame.update({
        where: {
          groupJid_type: {
            groupJid: params.groupJid,
            type: GameType.FAMILY100,
          },
        },
        data: {
          payload: JSON.stringify(nextPayload),
        },
      });
    }

    return {
      status: 'correct',
      answer,
      points: answer.points,
      payload: nextPayload,
      completed,
    };
  } catch (error) {
    logger.error({ error, params }, 'Gagal memproses jawaban Family 100');
    throw error;
  }
}

export async function surrenderFamily100(groupJid: string): Promise<SurrenderFamily100Result | undefined> {
  try {
    const activeGame = await prisma.activeGame.findUnique({
      where: {
        groupJid_type: {
          groupJid,
          type: GameType.FAMILY100,
        },
      },
    });

    if (!activeGame) {
      return undefined;
    }

    const payload = parseFamily100Payload(activeGame.payload);
    const awardedPoints = await awardUnsettledFamily100Points({
      groupJid,
      payload,
    });

    await prisma.activeGame.delete({
      where: {
        groupJid_type: {
          groupJid,
          type: GameType.FAMILY100,
        },
      },
    });

    return {
      payload,
      awardedPoints,
    };
  } catch (error) {
    logger.error({ error, groupJid }, 'Gagal menyerah dari Family 100');
    throw error;
  }
}

async function awardUnsettledFamily100Points(params: {
  groupJid: string;
  payload: Family100Payload;
}): Promise<number> {
  let totalPoints = 0;

  for (const foundAnswer of params.payload.foundAnswers) {
    if (foundAnswer.pointsAwarded === true) {
      continue;
    }

    const answer = params.payload.answers.find((item) => item.id === foundAnswer.answerId);

    if (!answer) {
      continue;
    }

    await addWeeklyScore({
      userJid: foundAnswer.foundBy,
      groupJid: params.groupJid,
      points: answer.points,
    });
    foundAnswer.pointsAwarded = true;
    totalPoints += answer.points;
  }

  return totalPoints;
}

async function pickRandomFamily100Question(): Promise<FamilyQuestionWithAnswers> {
  try {
    const totalQuestions = await prisma.family100Question.count();

    if (totalQuestions === 0) {
      throw new Error('Seed Family 100 belum tersedia');
    }

    const skip = Math.floor(Math.random() * totalQuestions);
    const question = await prisma.family100Question.findFirst({
      skip,
      include: {
        answers: {
          orderBy: {
            points: 'desc',
          },
        },
      },
    });

    if (!question) {
      throw new Error('Gagal memilih soal Family 100');
    }

    return question;
  } catch (error) {
    logger.error({ error }, 'Gagal mengambil soal Family 100 acak');
    throw error;
  }
}
