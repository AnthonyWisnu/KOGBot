import {
  claimDailyReward,
  formatRemainingDailyTime,
} from '../services/dailyReward.service.js';
import type { CommandContext } from '../types/command.js';
import { logger } from '../utils/logger.js';

export async function handleDailyCommand(context: CommandContext): Promise<void> {
  try {
    if (!context.isGroup) {
      await context.reply('Daily reward hanya bisa digunakan di grup.');
      return;
    }

    const result = await claimDailyReward({
      userJid: context.senderJid,
      groupJid: context.chatJid,
    });

    if (result.status === 'cooldown') {
      await context.reply(
        [
          'Kamu sudah claim hari ini.',
          `Coba lagi dalam ${formatRemainingDailyTime(result.remainingMs)}.`,
        ].join('\n'),
      );
      return;
    }

    const rewardText = result.reward.type === 'points'
      ? `${result.reward.amount} poin`
      : `${result.reward.amount} limit download`;

    await context.reply(`Daily reward berhasil diklaim: +${rewardText}.`);
  } catch (error) {
    logger.error(
      {
        error,
        chatJid: context.chatJid,
        senderJid: context.senderJid,
      },
      'Gagal menjalankan command daily',
    );
    throw error;
  }
}
