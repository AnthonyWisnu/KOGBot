import { deleteGroupMessage } from '../services/deleteMessage.service.js';
import type { CommandContext } from '../types/command.js';
import { logger } from '../utils/logger.js';
import { getQuotedMessageReference } from '../utils/quotedMessage.js';

export async function handleDeleteMessageCommand(context: CommandContext): Promise<void> {
  try {
    if (!context.isGroup) {
      await context.reply('Hapus pesan hanya bisa digunakan di grup.');
      return;
    }

    const quotedMessage = getQuotedMessageReference(context.message.message);

    if (!quotedMessage) {
      await context.reply('Reply pesan yang ingin dihapus dengan command .del.');
      return;
    }

    const result = await deleteGroupMessage({
      socket: context.socket,
      groupJid: context.chatJid,
      actorJid: context.senderJid,
      quotedMessage,
    });

    if (result.status === 'actor_not_allowed') {
      await context.reply('Command ini hanya bisa digunakan oleh admin grup atau owner bot.');
      return;
    }

    if (result.status === 'bot_not_admin') {
      await context.reply('Bot harus menjadi admin grup untuk menghapus pesan.');
      return;
    }

    if (result.status === 'target_not_found') {
      await context.reply('Pengirim pesan tidak ditemukan di grup.');
      return;
    }

    if (result.status === 'target_owner') {
      await context.reply('Admin grup tidak dapat menghapus pesan owner bot.');
      return;
    }

    await context.reply('Pesan berhasil dihapus.');
  } catch (error) {
    logger.error(
      {
        error,
        chatJid: context.chatJid,
        senderJid: context.senderJid,
      },
      'Gagal menjalankan command hapus pesan',
    );
    await context.reply('Gagal menghapus pesan. Coba lagi nanti.');
  }
}
