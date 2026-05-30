import { isOwner } from '../bot/permissions.js';
import {
  confirmResetPoint,
  requestResetPoint,
} from '../services/resetPoint.service.js';
import type { CommandContext } from '../types/command.js';
import { logger } from '../utils/logger.js';

export async function handleResetPointCommand(context: CommandContext): Promise<void> {
  try {
    if (!isOwner(context.senderJid)) {
      await context.reply('Command ini hanya bisa digunakan oleh owner bot.');
      return;
    }

    if (!context.isGroup) {
      await context.reply('Command ini hanya bisa digunakan di grup.');
      return;
    }

    requestResetPoint({
      groupJid: context.chatJid,
      requestedBy: context.senderJid,
    });

    await context.reply(
      [
        'Yakin ingin reset semua poin di grup ini?',
        'Ketik .confirmresetpoin dalam 30 detik untuk melanjutkan.',
      ].join('\n'),
    );
  } catch (error) {
    logger.error({ error, chatJid: context.chatJid }, 'Gagal menjalankan command resetpoin');
    throw error;
  }
}

export async function handleConfirmResetPointCommand(context: CommandContext): Promise<void> {
  try {
    if (!isOwner(context.senderJid)) {
      await context.reply('Command ini hanya bisa digunakan oleh owner bot.');
      return;
    }

    if (!context.isGroup) {
      await context.reply('Command ini hanya bisa digunakan di grup.');
      return;
    }

    const result = await confirmResetPoint({
      groupJid: context.chatJid,
      requestedBy: context.senderJid,
    });

    if (result.status === 'not_found') {
      await context.reply('Tidak ada permintaan reset poin yang menunggu konfirmasi.');
      return;
    }

    if (result.status === 'expired') {
      await context.reply('Konfirmasi reset poin sudah kedaluwarsa. Jalankan .resetpoin lagi.');
      return;
    }

    await context.reply('Semua poin di grup ini berhasil direset.');
  } catch (error) {
    logger.error({ error, chatJid: context.chatJid }, 'Gagal menjalankan command confirmresetpoin');
    throw error;
  }
}
