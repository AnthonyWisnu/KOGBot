import { env } from '../config/env.js';
import { getUserProfile } from '../services/profile.service.js';
import type { CommandContext } from '../types/command.js';
import { resolveFirstMentionedJid } from '../utils/mentions.js';
import {
  findGroupParticipant,
  getParticipantDisplayName,
} from '../utils/groupMetadata.js';
import { isSameUserJid } from '../utils/jid.js';
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
    const participantName = await getProfileParticipantName(context, targetJid);
    const profile = await getUserProfile({
      userJid: targetJid,
      groupJid: context.chatJid,
      pushName: isSameUserJid(targetJid, context.senderJid)
        ? context.message.pushName ?? undefined
        : undefined,
      participantName,
    });
    const rankText = profile.rank ?? '-';

    await context.socket.sendMessage(
      context.chatJid,
      {
        text: [
          '*Profile MinjiBot*',
          '',
          `User: ${profile.displayName}`,
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

async function getProfileParticipantName(
  context: CommandContext,
  targetJid: string,
): Promise<string | undefined> {
  try {
    const metadata = await context.socket.groupMetadata(context.chatJid);

    return getParticipantDisplayName(findGroupParticipant(metadata, targetJid));
  } catch (error) {
    logger.warn(
      {
        error,
        chatJid: context.chatJid,
        targetJid,
      },
      'Gagal mengambil nama participant untuk profile',
    );
    return undefined;
  }
}
