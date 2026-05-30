import {
  buyDownloadLimit,
  getDownloadLimitStatus,
} from '../services/downloadLimit.service.js';
import type { CommandContext } from '../types/command.js';
import { isOwner } from '../bot/permissions.js';
import { logger } from '../utils/logger.js';

export async function handleLimitCommand(context: CommandContext): Promise<void> {
  try {
    if (!context.isGroup) {
      await context.reply('Command ini hanya bisa digunakan di grup.');
      return;
    }

    const status = await getDownloadLimitStatus({
      userJid: context.senderJid,
      groupJid: context.chatJid,
    });

    await context.reply(
      [
        `Limit download kamu: ${status.limit}`,
        `Poin kamu: ${status.points}`,
      ].join('\n'),
    );
  } catch (error) {
    logger.error({ error, chatJid: context.chatJid }, 'Gagal menjalankan command limit');
    throw error;
  }
}

export async function handleBuyLimitCommand(context: CommandContext): Promise<void> {
  try {
    if (!context.isGroup) {
      await context.reply('Command ini hanya bisa digunakan di grup.');
      return;
    }

    if (isOwner(context.senderJid)) {
      await context.reply('Owner sudah memiliki limit unlimited.');
      return;
    }

    const amount = parseLimitAmount(context.command.args[0]);

    if (!amount) {
      await context.reply('Gunakan .belilimit <jumlah>. Contoh: .belilimit 3');
      return;
    }

    const result = await buyDownloadLimit({
      userJid: context.senderJid,
      groupJid: context.chatJid,
      amount,
    });

    if (result.status === 'owner_unlimited') {
      await context.reply('Owner sudah memiliki limit unlimited.');
      return;
    }

    if (result.status === 'insufficient_points') {
      await context.reply(
        [
          'Poin kamu belum cukup.',
          `Butuh ${result.requiredPoints} poin untuk membeli ${amount} limit.`,
          `Poin kamu sekarang: ${result.currentPoints}`,
        ].join('\n'),
      );
      return;
    }

    await context.reply(
      [
        `Berhasil membeli ${result.boughtLimit} limit download.`,
        `Poin terpakai: ${result.spentPoints}`,
        `Sisa poin: ${result.remainingPoints}`,
        `Limit sekarang: ${result.currentLimit}`,
      ].join('\n'),
    );
  } catch (error) {
    logger.error({ error, chatJid: context.chatJid }, 'Gagal menjalankan command belilimit');
    throw error;
  }
}

function parseLimitAmount(value: string | undefined): number | undefined {
  if (!value || !/^\d+$/.test(value)) {
    return undefined;
  }

  const amount = Number(value);

  if (!Number.isSafeInteger(amount) || amount <= 0) {
    return undefined;
  }

  return amount;
}
