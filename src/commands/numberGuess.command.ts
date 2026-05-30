import { GameType } from '@prisma/client';

import {
  answerNumberGuess,
  startNumberGuess,
  surrenderNumberGuess,
} from '../services/numberGuess.service.js';
import {
  recordActiveGameMessage,
  replyActiveGameStillRunning,
} from '../services/activeGameMessage.service.js';
import type { CommandContext } from '../types/command.js';
import { formatMention } from '../utils/format.js';
import { logger } from '../utils/logger.js';
import {
  formatNumberGuessAnswer,
  formatNumberGuessQuestion,
} from '../utils/numberGuessFormat.js';

export async function handleNumberGuessCommand(context: CommandContext): Promise<void> {
  try {
    if (!context.isGroup) {
      await context.reply('Command ini hanya bisa digunakan di grup.');
      return;
    }

    const startedGame = await startNumberGuess({
      groupJid: context.chatJid,
      startedBy: context.senderJid,
    });

    if (!startedGame) {
      await replyActiveGameStillRunning({
        context,
        type: GameType.NUMBER_GUESS,
        message: 'Tebak Angka masih aktif.\nReply pesan ini dengan "nyerah" kalau ingin menghentikan game ini.',
      });
      return;
    }

    const sentMessage = await context.reply(formatNumberGuessQuestion());

    await recordActiveGameMessage({
      groupJid: context.chatJid,
      type: GameType.NUMBER_GUESS,
      messageId: sentMessage?.key.id,
    });
  } catch (error) {
    logger.error({ error, chatJid: context.chatJid }, 'Gagal menjalankan command Tebak Angka');
    throw error;
  }
}

export async function handleNumberGuessSurrender(context: CommandContext): Promise<void> {
  try {
    if (!context.isGroup) {
      await context.reply('Command ini hanya bisa digunakan di grup.');
      return;
    }

    await replyNumberGuessSurrenderResult(context);
  } catch (error) {
    logger.error({ error, chatJid: context.chatJid }, 'Gagal menjalankan command nyerah Tebak Angka');
    throw error;
  }
}

export async function replyNumberGuessSurrenderResult(context: CommandContext): Promise<void> {
  try {
    const payload = await surrenderNumberGuess(context.chatJid);

    if (!payload) {
      await context.reply('Tidak ada Tebak Angka yang sedang aktif.');
      return;
    }

    await context.reply(
      [
        'Game Tebak Angka dihentikan.',
        `Angka yang benar: ${formatNumberGuessAnswer(payload)}`,
      ].join('\n'),
    );
  } catch (error) {
    logger.error({ error, chatJid: context.chatJid }, 'Gagal mengirim hasil surrender Tebak Angka');
    throw error;
  }
}

export async function handleNumberGuessAnswer(context: CommandContext): Promise<boolean> {
  try {
    if (!context.isGroup) {
      return false;
    }

    const result = await answerNumberGuess({
      groupJid: context.chatJid,
      userJid: context.senderJid,
      answer: context.text,
    });

    switch (result.status) {
      case 'no_active_game':
      case 'not_number':
        return false;
      case 'too_low':
        await context.reply('Terlalu kecil.');
        return true;
      case 'too_high':
        await context.reply('Terlalu besar.');
        return true;
      case 'correct':
        await context.socket.sendMessage(
          context.chatJid,
          {
            text: [
              `Benar, ${formatMention(context.senderJid)}!`,
              `Angkanya adalah ${formatNumberGuessAnswer(result.payload)}.`,
              `+${result.points} poin`,
            ].join('\n'),
            mentions: [context.senderJid],
          },
          { quoted: context.message },
        );
        return true;
    }
  } catch (error) {
    logger.error({ error, chatJid: context.chatJid }, 'Gagal memproses jawaban Tebak Angka');
    throw error;
  }
}
