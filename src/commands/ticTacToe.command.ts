import { GameType } from '@prisma/client';
import type { WAMessage, WAMessageContent } from '@whiskeysockets/baileys';

import {
  playTicTacToeMove,
  startTicTacToe,
  surrenderTicTacToe,
} from '../services/ticTacToe.service.js';
import {
  recordActiveGameMessage,
  replyActiveGameStillRunning,
} from '../services/activeGameMessage.service.js';
import type { CommandContext } from '../types/command.js';
import type { TicTacToePayload } from '../types/ticTacToe.js';
import { formatMention } from '../utils/format.js';
import { isSameUserJid } from '../utils/jid.js';
import { logger } from '../utils/logger.js';
import {
  formatTicTacToeQuestion,
  formatTicTacToeResult,
} from '../utils/ticTacToeFormat.js';

export async function handleTicTacToeCommand(context: CommandContext): Promise<void> {
  try {
    if (!context.isGroup) {
      await context.reply('Command ini hanya bisa digunakan di grup.');
      return;
    }

    const opponentJid = getMentionedJids(context.message.message)[0];

    if (!opponentJid) {
      await context.reply('Gunakan .tictactoe @user untuk mulai duel.');
      return;
    }

    if (isSameUserJid(context.senderJid, opponentJid)) {
      await context.reply('Lawan Tic Tac Toe harus user lain.');
      return;
    }

    const startedGame = await startTicTacToe({
      groupJid: context.chatJid,
      playerX: context.senderJid,
      playerO: opponentJid,
    });

    if (!startedGame) {
      await replyActiveGameStillRunning({
        context,
        type: GameType.TICTACTOE,
        message: 'Tic Tac Toe masih aktif.\nReply pesan ini dengan "nyerah" kalau ingin menghentikan game ini.',
      });
      return;
    }

    await sendBoard(context, startedGame.payload);
  } catch (error) {
    logger.error({ error, chatJid: context.chatJid }, 'Gagal menjalankan command Tic Tac Toe');
    throw error;
  }
}

export async function handleTicTacToeSurrender(context: CommandContext): Promise<void> {
  try {
    if (!context.isGroup) {
      await context.reply('Command ini hanya bisa digunakan di grup.');
      return;
    }

    await replyTicTacToeSurrenderResult(context);
  } catch (error) {
    logger.error({ error, chatJid: context.chatJid }, 'Gagal menjalankan command nyerah Tic Tac Toe');
    throw error;
  }
}

export async function replyTicTacToeSurrenderResult(context: CommandContext): Promise<void> {
  const result = await surrenderTicTacToe({
    groupJid: context.chatJid,
    userJid: context.senderJid,
  });

  switch (result.status) {
    case 'no_active_game':
      await context.reply('Tidak ada Tic Tac Toe yang sedang aktif.');
      return;
    case 'stopped':
      await context.reply('Game Tic Tac Toe dihentikan.');
      return;
    case 'win':
      await context.socket.sendMessage(
        context.chatJid,
        {
          text: `${formatMention(result.winnerJid)} menang Tic Tac Toe!\n+${result.points} poin`,
          mentions: [result.winnerJid],
        },
        { quoted: context.message },
      );
      return;
  }
}

export async function handleTicTacToeAnswer(context: CommandContext): Promise<boolean> {
  try {
    if (!context.isGroup) {
      return false;
    }

    const result = await playTicTacToeMove({
      groupJid: context.chatJid,
      userJid: context.senderJid,
      input: context.text,
    });

    switch (result.status) {
      case 'no_active_game':
      case 'invalid_position':
        return false;
      case 'not_player':
        await context.reply('Kamu bukan pemain Tic Tac Toe ini.');
        return true;
      case 'not_turn':
        await replyWithMention(context, `Belum giliran kamu.\nGiliran: ${formatMention(result.payload.turn)}`, [result.payload.turn]);
        return true;
      case 'occupied':
        await context.reply('Posisi itu sudah terisi.');
        return true;
      case 'moved':
        await sendBoard(context, result.payload);
        return true;
      case 'win':
        await sendResultBoard(context, result.payload, `${formatMention(result.winnerJid)} menang Tic Tac Toe!\n+${result.points} poin`, [
          result.winnerJid,
        ]);
        return true;
      case 'draw':
        await sendResultBoard(context, result.payload, `Tic Tac Toe seri.\nMasing-masing pemain mendapat +${result.points} poin.`, [
          result.payload.playerX,
          result.payload.playerO,
        ]);
        return true;
    }
  } catch (error) {
    logger.error({ error, chatJid: context.chatJid }, 'Gagal memproses jawaban Tic Tac Toe');
    throw error;
  }
}

async function sendBoard(
  context: CommandContext,
  payload: TicTacToePayload,
  suffix?: string,
  extraMentions: string[] = [],
): Promise<WAMessage | undefined> {
  const mentions = Array.from(new Set([payload.playerX, payload.playerO, payload.turn, ...extraMentions]));
  const sentMessage = await replyWithMention(
    context,
    suffix ? `${formatTicTacToeQuestion(payload)}\n\n${suffix}` : formatTicTacToeQuestion(payload),
    mentions,
  );

  await recordActiveGameMessage({
    groupJid: context.chatJid,
    type: GameType.TICTACTOE,
    messageId: sentMessage?.key.id,
    asLastPrompt: true,
  });

  return sentMessage;
}

async function sendResultBoard(
  context: CommandContext,
  payload: TicTacToePayload,
  suffix: string,
  extraMentions: string[],
): Promise<WAMessage | undefined> {
  const mentions = Array.from(new Set([payload.playerX, payload.playerO, ...extraMentions]));

  return await replyWithMention(
    context,
    `${formatTicTacToeResult(payload)}\n\n${suffix}`,
    mentions,
  );
}

async function replyWithMention(
  context: CommandContext,
  text: string,
  mentions: string[],
): Promise<WAMessage | undefined> {
  return await context.socket.sendMessage(
    context.chatJid,
    { text, mentions },
    { quoted: context.message },
  );
}

function getMentionedJids(message: WAMessageContent | null | undefined): string[] {
  const content = unwrapMessage(message);

  return (
    content?.extendedTextMessage?.contextInfo?.mentionedJid ??
    content?.imageMessage?.contextInfo?.mentionedJid ??
    content?.videoMessage?.contextInfo?.mentionedJid ??
    content?.documentMessage?.contextInfo?.mentionedJid ??
    []
  );
}

function unwrapMessage(message: WAMessageContent | null | undefined): WAMessageContent | undefined {
  if (!message) {
    return undefined;
  }

  return message.ephemeralMessage?.message ?? message.viewOnceMessage?.message ?? message.viewOnceMessageV2?.message ?? message;
}
