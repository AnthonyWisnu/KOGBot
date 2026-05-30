import {
  getDisplayWeeklyLeaderboard,
  getDisplayWeeklyScore,
} from '../services/score.service.js';
import type { CommandContext } from '../types/command.js';
import { formatMention } from '../utils/format.js';
import { logger } from '../utils/logger.js';

export async function handlePointCommand(context: CommandContext): Promise<void> {
  try {
    if (!context.isGroup) {
      await context.reply('Command ini hanya bisa digunakan di grup.');
      return;
    }

    const score = await getDisplayWeeklyScore({
      userJid: context.senderJid,
      groupJid: context.chatJid,
    });

    await context.reply(`Poin mingguan kamu: ${score} poin`);
  } catch (error) {
    logger.error({ error, senderJid: context.senderJid }, 'Gagal menjalankan command poin');
    throw error;
  }
}

export async function handleRankCommand(context: CommandContext): Promise<void> {
  try {
    if (!context.isGroup) {
      await context.reply('Command ini hanya bisa digunakan di grup.');
      return;
    }

    const leaderboard = await getDisplayWeeklyLeaderboard({
      groupJid: context.chatJid,
      limit: 10,
    });

    if (leaderboard.length === 0) {
      await context.reply('Leaderboard Mingguan\n\nBelum ada poin minggu ini.');
      return;
    }

    const lines = leaderboard.map((entry, index) => {
      return `${index + 1}. ${formatMention(entry.userJid)} - ${entry.score} poin`;
    });

    await context.socket.sendMessage(
      context.chatJid,
      {
        text: ['Leaderboard Mingguan', '', ...lines].join('\n'),
        mentions: leaderboard.map((entry) => entry.userJid),
      },
      { quoted: context.message },
    );
  } catch (error) {
    logger.error({ error, chatJid: context.chatJid }, 'Gagal menjalankan command rank');
    throw error;
  }
}
