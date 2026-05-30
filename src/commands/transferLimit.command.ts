import { transferDownloadLimit } from '../services/transferLimit.service.js';
import type { CommandContext } from '../types/command.js';
import { formatMention } from '../utils/format.js';
import { getFirstMentionedJid } from '../utils/mentions.js';
import { logger } from '../utils/logger.js';

export async function handleTransferLimitCommand(context: CommandContext): Promise<void> {
  try {
    if (!context.isGroup) {
      await context.reply('Transfer limit hanya bisa digunakan di grup.');
      return;
    }

    const recipientJid = getFirstMentionedJid(context.message.message);

    if (!recipientJid) {
      await context.reply('Gunakan .transferlimit @user <jumlah>. Contoh: .transferlimit @user 1');
      return;
    }

    const amount = parsePositiveInteger(context.command.args.at(-1));

    if (!amount) {
      await context.reply('Jumlah limit harus angka minimal 1. Contoh: .transferlimit @user 1');
      return;
    }

    const result = await transferDownloadLimit({
      senderJid: context.senderJid,
      recipientJid,
      groupJid: context.chatJid,
      amount,
    });

    if (result.status === 'same_user') {
      await context.reply('Tidak bisa transfer limit ke diri sendiri.');
      return;
    }

    if (result.status === 'insufficient_limit') {
      await context.reply(
        [
          'Limit kamu belum cukup.',
          `Limit kamu sekarang: ${result.currentLimit}`,
        ].join('\n'),
      );
      return;
    }

    await context.reply(
      [
        `Berhasil transfer ${result.transferred} limit ke ${formatMention(recipientJid)}.`,
        `Limit kamu sekarang: ${result.senderLimit}`,
        `Limit penerima sekarang: ${result.recipientLimit}`,
      ].join('\n'),
    );
  } catch (error) {
    logger.error(
      {
        error,
        chatJid: context.chatJid,
        senderJid: context.senderJid,
      },
      'Gagal menjalankan command transferlimit',
    );
    throw error;
  }
}

function parsePositiveInteger(value: string | undefined): number | undefined {
  if (!value || !/^\d+$/.test(value)) {
    return undefined;
  }

  const amount = Number(value);

  if (!Number.isSafeInteger(amount) || amount <= 0) {
    return undefined;
  }

  return amount;
}
