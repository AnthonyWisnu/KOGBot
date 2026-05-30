import {
  answerMathQuiz,
  formatQuizCorrectAnswer,
  formatQuizQuestion,
  startMathQuiz,
  surrenderMathQuiz,
} from '../services/quiz.service.js';
import { GameType } from '@prisma/client';

import {
  recordActiveGameMessage,
  replyActiveGameStillRunning,
} from '../services/activeGameMessage.service.js';
import type { CommandContext } from '../types/command.js';
import { formatMention } from '../utils/format.js';
import { logger } from '../utils/logger.js';

export async function handleQuizCommand(context: CommandContext): Promise<void> {
  try {
    if (!context.isGroup) {
      await context.reply('Command ini hanya bisa digunakan di grup.');
      return;
    }

    if (context.command.rawArgs.toLowerCase() !== 'mtk') {
      await context.reply('Gunakan .kuis mtk untuk memulai kuis matematika.');
      return;
    }

    const startedQuiz = await startMathQuiz({
      groupJid: context.chatJid,
      startedBy: context.senderJid,
    });

    if (!startedQuiz) {
      await replyActiveGameStillRunning({
        context,
        type: GameType.QUIZ_MTK,
        message: 'Kuis MTK masih aktif.\nReply pesan ini dengan "nyerah" kalau ingin menghentikan game ini.',
      });
      return;
    }

    const sentMessage = await context.reply(formatQuizQuestion(startedQuiz.payload));

    await recordActiveGameMessage({
      groupJid: context.chatJid,
      type: GameType.QUIZ_MTK,
      messageId: sentMessage?.key.id,
    });
  } catch (error) {
    logger.error({ error, chatJid: context.chatJid }, 'Gagal menjalankan command kuis');
    throw error;
  }
}

export async function handleQuizSurrender(context: CommandContext): Promise<void> {
  try {
    if (!context.isGroup) {
      await context.reply('Command ini hanya bisa digunakan di grup.');
      return;
    }

    if (context.command.rawArgs.toLowerCase() !== 'kuis') {
      await context.reply('Command menyerah harus spesifik. Gunakan .nyerah kuis.');
      return;
    }

    await replyQuizSurrenderResult(context);
  } catch (error) {
    logger.error({ error, chatJid: context.chatJid }, 'Gagal menjalankan command nyerah kuis');
    throw error;
  }
}

export async function replyQuizSurrenderResult(context: CommandContext): Promise<void> {
  try {
    const payload = await surrenderMathQuiz(context.chatJid);

    if (!payload) {
      await context.reply('Tidak ada kuis MTK yang sedang aktif.');
      return;
    }

    await context.reply(
      [
        'Game kuis MTK dihentikan.',
        `Jawaban benar: ${formatQuizCorrectAnswer(payload)}`,
      ].join('\n'),
    );
  } catch (error) {
    logger.error({ error, chatJid: context.chatJid }, 'Gagal mengirim hasil surrender kuis MTK');
    throw error;
  }
}

export async function handleQuizAnswer(context: CommandContext): Promise<boolean> {
  try {
    if (!context.isGroup) {
      return false;
    }

    const result = await answerMathQuiz({
      groupJid: context.chatJid,
      userJid: context.senderJid,
      answer: context.text,
    });

    if (result.status === 'no_active_game') {
      return false;
    }

    if (result.status === 'wrong') {
      const sentMessage = await context.reply('Salah. Coba lagi.');

      await recordActiveGameMessage({
        groupJid: context.chatJid,
        type: GameType.QUIZ_MTK,
        messageId: sentMessage?.key.id,
        asLastPrompt: true,
      });

      return true;
    }

    await context.socket.sendMessage(
      context.chatJid,
      {
        text: [
          `Benar, ${formatMention(context.senderJid)}!`,
          `Jawaban: ${formatQuizCorrectAnswer(result.payload)}`,
          `+${result.points} poin`,
        ].join('\n'),
        mentions: [context.senderJid],
      },
      { quoted: context.message },
    );

    return true;
  } catch (error) {
    logger.error({ error, chatJid: context.chatJid }, 'Gagal memproses jawaban kuis MTK');
    throw error;
  }
}
