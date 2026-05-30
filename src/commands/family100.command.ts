import {
  answerFamily100,
  startFamily100,
  surrenderFamily100,
} from '../services/family100.service.js';
import { GameType } from '@prisma/client';

import {
  recordActiveGameMessage,
  replyActiveGameStillRunning,
} from '../services/activeGameMessage.service.js';
import type { CommandContext } from '../types/command.js';
import {
  formatFamily100Answers,
  formatFamily100Progress,
  formatFamily100Question,
  formatFamily100Surrender,
} from '../utils/family100Format.js';
import { formatMention } from '../utils/format.js';
import { logger } from '../utils/logger.js';

export async function handleFamily100Command(context: CommandContext): Promise<void> {
  try {
    if (!context.isGroup) {
      await context.reply('Command ini hanya bisa digunakan di grup.');
      return;
    }

    const startedGame = await startFamily100({
      groupJid: context.chatJid,
      startedBy: context.senderJid,
    });

    if (!startedGame) {
      await replyActiveGameStillRunning({
        context,
        type: GameType.FAMILY100,
        message: 'Family 100 masih aktif.\nReply pesan ini dengan "nyerah" kalau ingin menghentikan game ini.',
      });
      return;
    }

    const sentMessage = await context.reply(formatFamily100Question(startedGame.payload));

    await recordActiveGameMessage({
      groupJid: context.chatJid,
      type: GameType.FAMILY100,
      messageId: sentMessage?.key.id,
    });
  } catch (error) {
    logger.error({ error, chatJid: context.chatJid }, 'Gagal menjalankan command Family 100');
    throw error;
  }
}

export async function handleFamily100Surrender(context: CommandContext): Promise<void> {
  try {
    if (!context.isGroup) {
      await context.reply('Command ini hanya bisa digunakan di grup.');
      return;
    }

    await replyFamily100SurrenderResult(context);
  } catch (error) {
    logger.error({ error, chatJid: context.chatJid }, 'Gagal menjalankan command nyerah Family 100');
    throw error;
  }
}

export async function replyFamily100SurrenderResult(context: CommandContext): Promise<void> {
  try {
    const result = await surrenderFamily100(context.chatJid);

    if (!result) {
      await context.reply('Tidak ada Family 100 yang sedang aktif.');
      return;
    }

    await context.reply(formatFamily100Surrender(result.payload, result.awardedPoints));
  } catch (error) {
    logger.error({ error, chatJid: context.chatJid }, 'Gagal mengirim hasil surrender Family 100');
    throw error;
  }
}

export async function handleFamily100Answer(context: CommandContext): Promise<boolean> {
  try {
    if (!context.isGroup) {
      return false;
    }

    const result = await answerFamily100({
      groupJid: context.chatJid,
      userJid: context.senderJid,
      answer: context.text,
    });

    if (result.status === 'no_active_game') {
      return false;
    }

    if (result.status === 'wrong') {
      return false;
    }

    if (result.status === 'duplicate') {
      await context.reply('Jawaban itu sudah ditemukan.');
      return true;
    }

    const lines = [
      `Benar, ${formatMention(context.senderJid)}!`,
      `Jawaban: ${result.answer.answer}`,
      `+${result.points} poin`,
    ];

    if (result.completed) {
      lines.push('', 'Family 100 selesai!', '', 'Jawaban:', ...formatFamily100Answers(result.payload));
    } else {
      lines.push('', 'Jawaban ditemukan:', ...formatFamily100Progress(result.payload));
    }

    const sentMessage = await context.socket.sendMessage(
      context.chatJid,
      {
        text: lines.join('\n'),
        mentions: [context.senderJid],
      },
      { quoted: context.message },
    );

    if (!result.completed) {
      await recordActiveGameMessage({
        groupJid: context.chatJid,
        type: GameType.FAMILY100,
        messageId: sentMessage?.key.id,
        asLastPrompt: true,
      });
    }

    return true;
  } catch (error) {
    logger.error({ error, chatJid: context.chatJid }, 'Gagal memproses jawaban Family 100');
    throw error;
  }
}
