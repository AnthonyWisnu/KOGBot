import { env } from '../config/env.js';
import { configureAntiLink } from '../services/antiLink.service.js';
import type { CommandContext } from '../types/command.js';
import { logger } from '../utils/logger.js';

export async function handleAntiLinkCommand(context: CommandContext): Promise<void> {
  try {
    if (!context.isGroup) {
      await context.reply('Anti link hanya bisa digunakan di grup.');
      return;
    }

    const action = context.command.args[0]?.toLowerCase();

    if (action !== 'on' && action !== 'off') {
      await context.reply(
        `Gunakan ${env.BOT_PREFIX}antilink on atau ${env.BOT_PREFIX}antilink off.`,
      );
      return;
    }

    const result = await configureAntiLink({
      socket: context.socket,
      groupJid: context.chatJid,
      groupName: context.groupName,
      actorJid: context.senderJid,
      enabled: action === 'on',
    });

    if (result.status === 'actor_not_allowed') {
      await context.reply('Command ini hanya bisa digunakan oleh admin grup atau owner bot.');
      return;
    }

    if (result.status === 'bot_not_admin') {
      await context.reply('Bot harus menjadi admin grup untuk mengaktifkan anti link.');
      return;
    }

    await context.reply(
      result.enabled
        ? 'Anti link grup WhatsApp berhasil diaktifkan.'
        : 'Anti link grup WhatsApp berhasil dimatikan.',
    );
  } catch (error) {
    logger.error(
      {
        error,
        chatJid: context.chatJid,
        senderJid: context.senderJid,
      },
      'Gagal menjalankan command anti link',
    );
    throw error;
  }
}
