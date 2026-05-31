import { env } from '../config/env.js';
import { getUserProfile } from '../services/profile.service.js';
import type { CommandContext } from '../types/command.js';
import { resolveFirstMentionedJid } from '../utils/mentions.js';
import { isSameUserJid } from '../utils/jid.js';
import { logger } from '../utils/logger.js';
import { resolveGroupUserDisplay } from '../utils/userDisplay.js';

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
    const targetDisplay = await resolveGroupUserDisplay({
      socket: context.socket,
      groupJid: context.chatJid,
      userJid: targetJid,
      pushName: isSameUserJid(targetJid, context.senderJid)
        ? context.message.pushName ?? undefined
        : undefined,
    });
    const profile = await getUserProfile({
      userJid: targetDisplay.userJid,
      groupJid: context.chatJid,
      pushName: targetDisplay.name,
    });
    const rankText = profile.rank ?? '-';

    await context.socket.sendMessage(
      context.chatJid,
      {
        text: [
          '*Profile MinjiBot*',
          '',
          `User: ${targetDisplay.label}`,
          `Poin: ${profile.points}`,
          `Limit: ${profile.limit}`,
          `Rank: ${rankText}`,
          `Menang game: ${profile.gamesWon}`,
          '',
          `_Gunakan ${env.BOT_PREFIX}profile @user untuk cek member lain._`,
        ].join('\n'),
        mentions: [profile.userJid],
      },
      { quoted: context.message },
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
