import { GameType, type ActiveGame, type QuizQuestion } from '@prisma/client';

import { prisma } from '../database/prisma.js';
import { addWeeklyScore } from './score.service.js';
import { incrementGamesWon } from './userStats.service.js';
import { normalizeText } from '../utils/normalize.js';
import { logger } from '../utils/logger.js';

const quizPoint = 10;

type QuizPayload = {
  questionId: string;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: string;
  correctAnswer: string;
};

export type StartedQuiz = {
  game: ActiveGame;
  payload: QuizPayload;
};

export type QuizAnswerResult =
  | {
      status: 'no_active_game';
    }
  | {
      status: 'wrong';
    }
  | {
      status: 'correct';
      payload: QuizPayload;
      points: number;
    };

export async function startMathQuiz(params: {
  groupJid: string;
  startedBy: string;
}): Promise<StartedQuiz | undefined> {
  try {
    const activeGame = await prisma.activeGame.findUnique({
      where: {
        groupJid_type: {
          groupJid: params.groupJid,
          type: GameType.QUIZ_MTK,
        },
      },
    });

    if (activeGame) {
      return undefined;
    }

    const question = await pickRandomMathQuestion();
    const payload = createQuizPayload(question);
    const game = await prisma.activeGame.create({
      data: {
        groupJid: params.groupJid,
        type: GameType.QUIZ_MTK,
        payload: JSON.stringify(payload),
        startedBy: params.startedBy,
      },
    });

    return {
      game,
      payload,
    };
  } catch (error) {
    logger.error({ error, params }, 'Gagal memulai kuis MTK');
    throw error;
  }
}

export async function answerMathQuiz(params: {
  groupJid: string;
  userJid: string;
  answer: string;
}): Promise<QuizAnswerResult> {
  try {
    const activeGame = await prisma.activeGame.findUnique({
      where: {
        groupJid_type: {
          groupJid: params.groupJid,
          type: GameType.QUIZ_MTK,
        },
      },
    });

    if (!activeGame) {
      return {
        status: 'no_active_game',
      };
    }

    const payload = parseQuizPayload(activeGame.payload);

    if (!isCorrectAnswer(params.answer, payload)) {
      return {
        status: 'wrong',
      };
    }

    await prisma.activeGame.delete({
      where: {
        groupJid_type: {
          groupJid: params.groupJid,
          type: GameType.QUIZ_MTK,
        },
      },
    });

    await addWeeklyScore({
      userJid: params.userJid,
      groupJid: params.groupJid,
      points: quizPoint,
    });
    await incrementGamesWon({
      userJid: params.userJid,
      groupJid: params.groupJid,
    });

    return {
      status: 'correct',
      payload,
      points: quizPoint,
    };
  } catch (error) {
    logger.error({ error, params }, 'Gagal memproses jawaban kuis MTK');
    throw error;
  }
}

export async function surrenderMathQuiz(groupJid: string): Promise<QuizPayload | undefined> {
  try {
    const activeGame = await prisma.activeGame.findUnique({
      where: {
        groupJid_type: {
          groupJid,
          type: GameType.QUIZ_MTK,
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
          type: GameType.QUIZ_MTK,
        },
      },
    });

    return parseQuizPayload(activeGame.payload);
  } catch (error) {
    logger.error({ error, groupJid }, 'Gagal menyerah dari kuis MTK');
    throw error;
  }
}

export function formatQuizQuestion(payload: QuizPayload): string {
  return [
    'Kuis MTK',
    '',
    payload.question,
    '',
    `A. ${payload.optionA}`,
    `B. ${payload.optionB}`,
    `C. ${payload.optionC}`,
    `D. ${payload.optionD}`,
    '',
    'Jawab dengan A, B, C, atau D.',
  ].join('\n');
}

export function formatQuizCorrectAnswer(payload: QuizPayload): string {
  return `${payload.correctOption}. ${payload.correctAnswer}`;
}

function createQuizPayload(question: QuizQuestion): QuizPayload {
  const correctAnswer = getCorrectAnswer(question);

  return {
    questionId: question.id,
    question: question.question,
    optionA: question.optionA,
    optionB: question.optionB,
    optionC: question.optionC,
    optionD: question.optionD,
    correctOption: question.correctOption,
    correctAnswer,
  };
}

function getCorrectAnswer(question: QuizQuestion): string {
  switch (question.correctOption) {
    case 'A':
      return question.optionA;
    case 'B':
      return question.optionB;
    case 'C':
      return question.optionC;
    case 'D':
      return question.optionD;
    default:
      throw new Error(`Opsi jawaban kuis tidak valid: ${question.correctOption}`);
  }
}

async function pickRandomMathQuestion(): Promise<QuizQuestion> {
  try {
    const totalQuestions = await prisma.quizQuestion.count({
      where: {
        category: 'MTK',
      },
    });

    if (totalQuestions === 0) {
      throw new Error('Seed soal MTK belum tersedia');
    }

    const skip = Math.floor(Math.random() * totalQuestions);
    const question = await prisma.quizQuestion.findFirst({
      where: {
        category: 'MTK',
      },
      skip,
    });

    if (!question) {
      throw new Error('Gagal memilih soal MTK');
    }

    return question;
  } catch (error) {
    logger.error({ error }, 'Gagal mengambil soal MTK acak');
    throw error;
  }
}

function isCorrectAnswer(answer: string, payload: QuizPayload): boolean {
  const normalizedAnswer = normalizeText(answer);
  const normalizedOption = normalizeText(payload.correctOption);
  const normalizedCorrectAnswer = normalizeText(payload.correctAnswer);

  return normalizedAnswer === normalizedOption || normalizedAnswer === normalizedCorrectAnswer;
}

function parseQuizPayload(payload: string): QuizPayload {
  const parsedPayload: unknown = JSON.parse(payload);

  if (!isQuizPayload(parsedPayload)) {
    throw new Error('Payload kuis MTK tidak valid');
  }

  return parsedPayload;
}

function isQuizPayload(value: unknown): value is QuizPayload {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.questionId === 'string' &&
    typeof value.question === 'string' &&
    typeof value.optionA === 'string' &&
    typeof value.optionB === 'string' &&
    typeof value.optionC === 'string' &&
    typeof value.optionD === 'string' &&
    typeof value.correctOption === 'string' &&
    typeof value.correctAnswer === 'string'
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
