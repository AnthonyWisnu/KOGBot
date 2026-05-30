import { GameType } from '@prisma/client';

import {
  answerWordScramble,
  startWordScramble,
  surrenderWordScramble,
} from '../services/wordScramble.service.js';
import {
  recordActiveGameMessage,
  replyActiveGameStillRunning,
} from '../services/activeGameMessage.service.js';
import type { CommandContext } from '../types/command.js';
import { formatMention } from '../utils/format.js';
import { logger } from '../utils/logger.js';
import {
  formatWordScrambleAnswer,
  formatWordScrambleQuestion,
} from '../utils/wordScrambleFormat.js';

export async function handleWordScrambleCommand(context: CommandContext): Promise<void> {
  try {
    if (!context.isGroup) {
      await context.reply('Command ini hanya bisa digunakan di grup.');
      return;
    }

    const startedGame = await startWordScramble({
      groupJid: context.chatJid,
      startedBy: context.senderJid,
    });

    if (!startedGame) {
      await replyActiveGameStillRunning({
        context,
        type: GameType.WORD_SCRAMBLE,
        message: 'Tebak Kata masih aktif.\nReply pesan ini dengan "nyerah" kalau ingin menghentikan game ini.',
      });
      return;
    }

    const sentMessage = await context.reply(formatWordScrambleQuestion(startedGame.payload));

    await recordActiveGameMessage({
      groupJid: context.chatJid,
      type: GameType.WORD_SCRAMBLE,
      messageId: sentMessage?.key.id,
    });
  } catch (error) {
    logger.error({ error, chatJid: context.chatJid }, 'Gagal menjalankan command Tebak Kata');
    throw error;
  }
}

export async function handleWordScrambleSurrender(context: CommandContext): Promise<void> {
  try {
    if (!context.isGroup) {
      await context.reply('Command ini hanya bisa digunakan di grup.');
      return;
    }

    await replyWordScrambleSurrenderResult(context);
  } catch (error) {
    logger.error({ error, chatJid: context.chatJid }, 'Gagal menjalankan command nyerah Tebak Kata');
    throw error;
  }
}

export async function replyWordScrambleSurrenderResult(context: CommandContext): Promise<void> {
  try {
    const payload = await surrenderWordScramble(context.chatJid);

    if (!payload) {
      await context.reply('Tidak ada Tebak Kata yang sedang aktif.');
      return;
    }

    await context.reply(
      [
        'Game Tebak Kata dihentikan.',
        `Jawaban benar: ${formatWordScrambleAnswer(payload)}`,
      ].join('\n'),
    );
  } catch (error) {
    logger.error({ error, chatJid: context.chatJid }, 'Gagal mengirim hasil surrender Tebak Kata');
    throw error;
  }
}

export async function handleWordScrambleAnswer(context: CommandContext): Promise<boolean> {
  try {
    if (!context.isGroup) {
      return false;
    }

    const result = await answerWordScramble({
      groupJid: context.chatJid,
      userJid: context.senderJid,
      answer: context.text,
    });

    if (result.status !== 'correct') {
      return result.status !== 'no_active_game';
    }

    await context.socket.sendMessage(
      context.chatJid,
      {
        text: [
          `Benar, ${formatMention(context.senderJid)}!`,
          `Jawaban: ${formatWordScrambleAnswer(result.payload)}`,
          `+${result.points} poin`,
        ].join('\n'),
        mentions: [context.senderJid],
      },
      { quoted: context.message },
    );

    return true;
  } catch (error) {
    logger.error({ error, chatJid: context.chatJid }, 'Gagal memproses jawaban Tebak Kata');
    throw error;
  }
}
