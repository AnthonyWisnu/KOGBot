import type { CommandContext } from '../types/command.js';
import {
  demoteGroupParticipant,
  kickGroupParticipant,
  promoteGroupParticipant,
  type ModerationResult,
} from '../services/moderation.service.js';
import { getFirstMentionedJid } from '../utils/mentions.js';
import { logger } from '../utils/logger.js';
import { resolveGroupUserDisplay } from '../utils/userDisplay.js';

export async function handleKickCommand(context: CommandContext): Promise<void> {
  await handleModerationCommand(context, 'kick');
}

export async function handlePromoteCommand(context: CommandContext): Promise<void> {
  await handleModerationCommand(context, 'promote');
}

export async function handleDemoteCommand(context: CommandContext): Promise<void> {
  await handleModerationCommand(context, 'demote');
}

async function handleModerationCommand(
  context: CommandContext,
  action: 'kick' | 'promote' | 'demote',
): Promise<void> {
  try {
    if (!context.isGroup) {
      await context.reply('Command moderasi hanya bisa digunakan di grup.');
      return;
    }

    const targetJid = getFirstMentionedJid(context.message.message);

    if (!targetJid) {
      await context.reply(`Gunakan format:\n.${action} @user`);
      return;
    }

    const targetDisplay = await resolveGroupUserDisplay({
      socket: context.socket,
      groupJid: context.chatJid,
      userJid: targetJid,
    });
    const result = await runModerationCommand(context, action, targetJid);

    if (result.status !== 'success') {
      await context.reply(getFailureMessage(action, result.status));
      return;
    }

    const successMessage = action === 'kick'
      ? `${targetDisplay.label} berhasil dikeluarkan dari grup.`
      : action === 'promote'
        ? `${targetDisplay.label} berhasil dijadikan admin grup.`
        : `${targetDisplay.label} berhasil diturunkan dari admin grup.`;

    await context.socket.sendMessage(
      context.chatJid,
      {
        text: successMessage,
        mentions: [targetDisplay.userJid],
      },
      { quoted: context.message },
    );
  } catch (error) {
    logger.error(
      {
        error,
        action,
        chatJid: context.chatJid,
        senderJid: context.senderJid,
      },
      'Gagal menjalankan command moderasi',
    );
    throw error;
  }
}

async function runModerationCommand(
  context: CommandContext,
  action: 'kick' | 'promote' | 'demote',
  targetJid: string,
): Promise<ModerationResult> {
  const params = {
    socket: context.socket,
    groupJid: context.chatJid,
    actorJid: context.senderJid,
    targetJid,
  };

  if (action === 'kick') {
    return await kickGroupParticipant(params);
  }

  if (action === 'promote') {
    return await promoteGroupParticipant(params);
  }

  return await demoteGroupParticipant(params);
}

function getFailureMessage(
  action: 'kick' | 'promote' | 'demote',
  status: Exclude<ModerationResult['status'], 'success'>,
): string {
  switch (status) {
    case 'bot_not_admin':
      return `Bot harus menjadi admin grup untuk menggunakan fitur ${action}.`;
    case 'actor_not_allowed':
      return 'Command ini hanya bisa digunakan oleh admin grup atau owner bot.';
    case 'owner_only':
      return 'Hanya owner bot yang dapat menurunkan admin grup.';
    case 'target_not_found':
      return 'User tersebut tidak ditemukan di grup.';
    case 'target_owner':
      return action === 'kick'
        ? 'Owner bot tidak dapat dikeluarkan.'
        : action === 'demote'
          ? 'Owner bot tidak dapat diturunkan dari admin grup.'
          : 'Owner bot tidak perlu dijadikan admin grup.';
    case 'target_bot':
      return action === 'kick'
        ? 'Bot tidak dapat mengeluarkan dirinya sendiri.'
        : 'Bot tidak dapat mengubah role dirinya sendiri.';
    case 'target_self':
      return action === 'kick'
        ? 'Kamu tidak dapat mengeluarkan dirimu sendiri.'
        : 'Kamu tidak dapat mengubah role dirimu sendiri.';
    case 'target_admin':
      return action === 'kick'
        ? 'Admin grup tidak dapat mengeluarkan admin grup lain.\nHanya owner bot yang memiliki izin tersebut.'
        : 'User tersebut sudah menjadi admin grup.';
    case 'target_not_admin':
      return 'User tersebut bukan admin grup.';
  }
}
