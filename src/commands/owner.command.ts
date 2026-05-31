import { isOwner } from '../bot/permissions.js';
import { env } from '../config/env.js';
import type { CommandContext } from '../types/command.js';
import { addWeeklyScore } from '../services/score.service.js';
import {
  addDownloadLimit,
  resetDownloadLimit,
} from '../services/downloadLimit.service.js';
import { resolveFirstMentionedJid } from '../utils/mentions.js';
import { logger } from '../utils/logger.js';
import { resolveGroupUserDisplay } from '../utils/userDisplay.js';
import {
  handleConfirmResetPointCommand,
  handleResetPointCommand,
} from './resetPoint.command.js';
import {
  approveGroup,
  listApprovedGroups,
  removeGroup,
} from '../services/group.service.js';

export const ownerCommandNames = new Set([
  'approvegroup',
  'approvegrup',
  'removegroup',
  'removegrup',
  'listgroup',
  'listgrup',
  'resetpoin',
  'confirmresetpoin',
  'givepoin',
  'givelimit',
  'resetlimit',
  'ownermenu',
]);

export async function handleOwnerCommand(context: CommandContext): Promise<void> {
  try {
    if (!isOwner(context.senderJid)) {
      await context.reply('Hanya owner bot yang bisa menggunakan command ini.');
      return;
    }

    switch (context.command.name) {
      case 'approvegroup':
      case 'approvegrup':
        await handleApproveGroup(context);
        return;
      case 'removegroup':
      case 'removegrup':
        await handleRemoveGroup(context);
        return;
      case 'listgroup':
      case 'listgrup':
        await handleListGroup(context);
        return;
      case 'ownermenu':
        await handleOwnerMenu(context);
        return;
      case 'resetpoin':
        await handleResetPointCommand(context);
        return;
      case 'confirmresetpoin':
        await handleConfirmResetPointCommand(context);
        return;
      case 'givepoin':
        await handleGivePoint(context);
        return;
      case 'givelimit':
        await handleGiveLimit(context);
        return;
      case 'resetlimit':
        await handleResetLimit(context);
        return;
      default:
        await context.reply(`Command owner tidak dikenal. Ketik ${env.BOT_PREFIX}ownermenu.`);
    }
  } catch (error) {
    logger.error(
      {
        error,
        command: context.command.name,
        chatJid: context.chatJid,
        senderJid: context.senderJid,
      },
      'Gagal menjalankan command owner',
    );
    throw error;
  }
}

async function handleApproveGroup(context: CommandContext): Promise<void> {
  try {
    if (!context.isGroup) {
      await context.reply('Command ini hanya bisa digunakan di grup.');
      return;
    }

    const group = await approveGroup(context.chatJid, context.groupName);

    await context.reply(
      [
        `Grup ini sudah diizinkan menggunakan ${env.BOT_NAME}.`,
        `Nama grup: ${group.name ?? '-'}`,
      ].join('\n'),
    );
  } catch (error) {
    logger.error({ error, chatJid: context.chatJid }, 'Gagal approve grup dari command');
    throw error;
  }
}

async function handleRemoveGroup(context: CommandContext): Promise<void> {
  try {
    if (!context.isGroup) {
      await context.reply('Command ini hanya bisa digunakan di grup.');
      return;
    }

    await removeGroup(context.chatJid, context.groupName);
    await context.reply(`Grup ini sudah dinonaktifkan dari whitelist ${env.BOT_NAME}.`);
  } catch (error) {
    logger.error({ error, chatJid: context.chatJid }, 'Gagal remove grup dari command');
    throw error;
  }
}

async function handleListGroup(context: CommandContext): Promise<void> {
  try {
    const groups = await listApprovedGroups();

    if (groups.length === 0) {
      await context.reply('Belum ada grup yang diizinkan.');
      return;
    }

    const lines = groups.map((group, index) => {
      const name = group.name ?? group.jid;

      return `${index + 1}. ${name}`;
    });

    await context.reply(['Daftar Grup Approved', '', ...lines].join('\n'));
  } catch (error) {
    logger.error({ error }, 'Gagal menampilkan daftar grup approved');
    throw error;
  }
}

async function handleOwnerMenu(context: CommandContext): Promise<void> {
  try {
    await context.reply(
      [
        'Owner Menu',
        '',
        `${env.BOT_PREFIX}approvegroup   - Izinkan bot aktif di grup ini`,
        `${env.BOT_PREFIX}approvegrup    - Alias approve group`,
        `${env.BOT_PREFIX}removegroup    - Nonaktifkan bot dari grup ini`,
        `${env.BOT_PREFIX}removegrup     - Alias remove group`,
        `${env.BOT_PREFIX}listgroup      - Lihat daftar grup approved`,
        `${env.BOT_PREFIX}listgrup       - Alias list group`,
        `${env.BOT_PREFIX}resetpoin      - Reset poin grup dengan konfirmasi`,
        `${env.BOT_PREFIX}givepoin @user jumlah  - Tambah poin user`,
        `${env.BOT_PREFIX}givelimit @user jumlah - Tambah limit user`,
        `${env.BOT_PREFIX}resetlimit @user       - Reset limit user ke 3`,
      ].join('\n'),
    );
  } catch (error) {
    logger.error({ error }, 'Gagal mengirim owner menu');
    throw error;
  }
}

async function handleGivePoint(context: CommandContext): Promise<void> {
  try {
    const targetJid = await getOwnerTargetJid(context);

    if (!targetJid) {
      return;
    }

    const targetDisplay = await resolveGroupUserDisplay({
      socket: context.socket,
      groupJid: context.chatJid,
      userJid: targetJid,
    });
    const amount = parsePositiveInteger(context.command.args.at(-1));

    if (!amount) {
      await context.reply('Gunakan .givepoin @user <jumlah>. Contoh: .givepoin @user 10');
      return;
    }

    const score = isOwner(targetJid)
      ? undefined
      : await addWeeklyScore({
          userJid: targetJid,
          groupJid: context.chatJid,
          points: amount,
        });

    await replyWithMentions(
      context,
      [
        `Berhasil memberi ${amount} poin ke ${targetDisplay.label}.`,
        `Poin user sekarang: ${score?.score ?? 999}`,
      ].join('\n'),
      [targetDisplay.userJid],
    );
  } catch (error) {
    logger.error({ error, chatJid: context.chatJid }, 'Gagal menjalankan command givepoin');
    throw error;
  }
}

async function handleGiveLimit(context: CommandContext): Promise<void> {
  try {
    const targetJid = await getOwnerTargetJid(context);

    if (!targetJid) {
      return;
    }

    const targetDisplay = await resolveGroupUserDisplay({
      socket: context.socket,
      groupJid: context.chatJid,
      userJid: targetJid,
    });
    const amount = parsePositiveInteger(context.command.args.at(-1));

    if (!amount) {
      await context.reply('Gunakan .givelimit @user <jumlah>. Contoh: .givelimit @user 5');
      return;
    }

    const currentLimit = await addDownloadLimit({
      userJid: targetJid,
      groupJid: context.chatJid,
      amount,
    });

    await replyWithMentions(
      context,
      [
        `Berhasil memberi ${amount} limit ke ${targetDisplay.label}.`,
        `Limit user sekarang: ${currentLimit}`,
      ].join('\n'),
      [targetDisplay.userJid],
    );
  } catch (error) {
    logger.error({ error, chatJid: context.chatJid }, 'Gagal menjalankan command givelimit');
    throw error;
  }
}

async function handleResetLimit(context: CommandContext): Promise<void> {
  try {
    const targetJid = await getOwnerTargetJid(context);

    if (!targetJid) {
      return;
    }

    const currentLimit = await resetDownloadLimit({
      userJid: targetJid,
      groupJid: context.chatJid,
    });
    const targetDisplay = await resolveGroupUserDisplay({
      socket: context.socket,
      groupJid: context.chatJid,
      userJid: targetJid,
    });

    await replyWithMentions(
      context,
      [
        `Limit ${targetDisplay.label} sudah direset.`,
        `Limit user sekarang: ${currentLimit}`,
      ].join('\n'),
      [targetDisplay.userJid],
    );
  } catch (error) {
    logger.error({ error, chatJid: context.chatJid }, 'Gagal menjalankan command resetlimit');
    throw error;
  }
}

async function replyWithMentions(
  context: CommandContext,
  text: string,
  mentions: string[],
): Promise<void> {
  await context.socket.sendMessage(
    context.chatJid,
    {
      text,
      mentions,
    },
    { quoted: context.message },
  );
}

async function getOwnerTargetJid(context: CommandContext): Promise<string | undefined> {
  if (!context.isGroup) {
    await context.reply('Command ini hanya bisa digunakan di grup.');
    return undefined;
  }

  const targetJid = await resolveFirstMentionedJid({
    socket: context.socket,
    groupJid: context.chatJid,
    message: context.message.message,
  });

  if (!targetJid) {
    await context.reply('Target user wajib di-mention.');
    return undefined;
  }

  return targetJid;
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
