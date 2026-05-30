import { GameType } from '@prisma/client';

import {
  answerEmojiGuess,
  startEmojiGuess,
  surrenderEmojiGuess,
} from '../services/emojiGuess.service.js';
import {
  recordActiveGameMessage,
  replyActiveGameStillRunning,
} from '../services/activeGameMessage.service.js';
import type { CommandContext } from '../types/command.js';
import {
  formatEmojiGuessAnswer,
  formatEmojiGuessQuestion,
} from '../utils/emojiGuessFormat.js';
import { formatMention } from '../utils/format.js';
import { logger } from '../utils/logger.js';

export async function handleEmojiGuessCommand(context: CommandContext): Promise<void> {
  try {
    if (!context.isGroup) {
      await context.reply('Command ini hanya bisa digunakan di grup.');
      return;
    }

    const startedGame = await startEmojiGuess({
      groupJid: context.chatJid,
      startedBy: context.senderJid,
    });

    if (!startedGame) {
      await replyActiveGameStillRunning({
        context,
        type: GameType.EMOJI_GUESS,
        message: 'Tebak Emoji masih aktif.\nReply pesan ini dengan "nyerah" kalau ingin menghentikan game ini.',
      });
      return;
    }

    const sentMessage = await context.reply(formatEmojiGuessQuestion(startedGame.payload));

    await recordActiveGameMessage({
      groupJid: context.chatJid,
      type: GameType.EMOJI_GUESS,
      messageId: sentMessage?.key.id,
    });
  } catch (error) {
    logger.error({ error, chatJid: context.chatJid }, 'Gagal menjalankan command Tebak Emoji');
    throw error;
  }
}

export async function handleEmojiGuessSurrender(context: CommandContext): Promise<void> {
  try {
    if (!context.isGroup) {
      await context.reply('Command ini hanya bisa digunakan di grup.');
      return;
    }

    await replyEmojiGuessSurrenderResult(context);
  } catch (error) {
    logger.error({ error, chatJid: context.chatJid }, 'Gagal menjalankan command nyerah Tebak Emoji');
    throw error;
  }
}

export async function replyEmojiGuessSurrenderResult(context: CommandContext): Promise<void> {
  try {
    const payload = await surrenderEmojiGuess(context.chatJid);

    if (!payload) {
      await context.reply('Tidak ada Tebak Emoji yang sedang aktif.');
      return;
    }

    await context.reply(
      [
        'Game Tebak Emoji dihentikan.',
        `Jawaban benar: ${formatEmojiGuessAnswer(payload)}`,
      ].join('\n'),
    );
  } catch (error) {
    logger.error({ error, chatJid: context.chatJid }, 'Gagal mengirim hasil surrender Tebak Emoji');
    throw error;
  }
}

export async function handleEmojiGuessAnswer(context: CommandContext): Promise<boolean> {
  try {
    if (!context.isGroup) {
      return false;
    }

    const result = await answerEmojiGuess({
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
          `Jawaban: ${formatEmojiGuessAnswer(result.payload)}`,
          `+${result.points} poin`,
        ].join('\n'),
        mentions: [context.senderJid],
      },
      { quoted: context.message },
    );

    return true;
  } catch (error) {
    logger.error({ error, chatJid: context.chatJid }, 'Gagal memproses jawaban Tebak Emoji');
    throw error;
  }
}
