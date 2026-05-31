import { env } from '../config/env.js';
import {
  formatTagAllRemainingMinutes,
  sendTagAllAnnouncement,
} from '../services/tagAll.service.js';
import type { CommandContext } from '../types/command.js';
import { logger } from '../utils/logger.js';

export async function handleTagAllCommand(context: CommandContext): Promise<void> {
  try {
    if (!context.isGroup) {
      await context.reply('Tagall hanya bisa digunakan di grup.');
      return;
    }

    const message = context.command.rawArgs.trim();

    if (!message) {
      await context.reply(`Gunakan format:\n${env.BOT_PREFIX}tagall <pesan>`);
      return;
    }

    const result = await sendTagAllAnnouncement({
      socket: context.socket,
      groupJid: context.chatJid,
      actorJid: context.senderJid,
      message,
      quoted: context.message,
    });

    if (result.status === 'actor_not_allowed') {
      await context.reply('Command ini hanya bisa digunakan oleh admin grup atau owner bot.');
      return;
    }

    if (result.status === 'cooldown') {
      const minutes = formatTagAllRemainingMinutes(result.remainingMs);
      await context.reply(`Tagall masih cooldown. Coba lagi dalam ${minutes} menit.`);
    }
  } catch (error) {
    logger.error(
      {
        error,
        chatJid: context.chatJid,
        senderJid: context.senderJid,
      },
      'Gagal menjalankan command tagall',
    );
    throw error;
  }
}
