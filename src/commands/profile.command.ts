import { env } from '../config/env.js';
import { getUserProfile } from '../services/profile.service.js';
import type { CommandContext } from '../types/command.js';
import { formatMention } from '../utils/format.js';
import { resolveFirstMentionedJid } from '../utils/mentions.js';
import { logger } from '../utils/logger.js';

export async function handleProfileCommand(context: CommandContext): Promise<void> {
  try {
    if (!context.isGroup) {
      await context.reply('Profile hanya tersedia di grup.');
      return;
    }

    const targetJid = await resolveFirstMentionedJid({
      socket: context.socket,
      groupJid: context.chatJid,
      message: context.message.message,
    }) ?? context.senderJid;
    const profile = await getUserProfile({
      userJid: targetJid,
      groupJid: context.chatJid,
    });
    const rankText = profile.rank ?? '-';

    await context.reply(
      [
        '*Profile MinjiBot*',
        '',
        `User: ${formatMention(profile.userJid)}`,
        `Poin: ${profile.points}`,
        `Limit: ${profile.limit}`,
        `Rank: ${rankText}`,
        `Menang game: ${profile.gamesWon}`,
        '',
        `_Gunakan ${env.BOT_PREFIX}profile @user untuk cek member lain._`,
      ].join('\n'),
    );
  } catch (error) {
    logger.error(
      {
        error,
        chatJid: context.chatJid,
        senderJid: context.senderJid,
      },
      'Gagal menjalankan command profile',
    );
    throw error;
  }
}
