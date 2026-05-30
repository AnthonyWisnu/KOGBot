import { isOwner } from '../bot/permissions.js';
import { env } from '../config/env.js';
import type { CommandContext } from '../types/command.js';
import { logger } from '../utils/logger.js';
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
      ].join('\n'),
    );
  } catch (error) {
    logger.error({ error }, 'Gagal mengirim owner menu');
    throw error;
  }
}
