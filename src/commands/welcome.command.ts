import { isGroupAdmin } from '../bot/permissions.js';
import {
  setWelcomeEnabled,
  setWelcomeMessage,
} from '../services/welcome.service.js';
import type { CommandContext } from '../types/command.js';
import { logger } from '../utils/logger.js';

export async function handleWelcomeCommand(context: CommandContext): Promise<void> {
  try {
    if (!context.isGroup) {
      await context.reply('Command ini hanya bisa digunakan di grup.');
      return;
    }

    const admin = await isGroupAdmin({
      socket: context.socket,
      groupJid: context.chatJid,
      senderJid: context.senderJid,
    });

    if (!admin) {
      await context.reply('Hanya admin grup yang bisa menggunakan command ini.');
      return;
    }

    const action = context.command.args[0]?.toLowerCase();

    if (action !== 'on' && action !== 'off') {
      await context.reply('Gunakan .welcome on atau .welcome off.');
      return;
    }

    await setWelcomeEnabled({
      groupJid: context.chatJid,
      enabled: action === 'on',
      groupName: context.groupName,
    });

    await context.reply(action === 'on' ? 'Welcome berhasil diaktifkan.' : 'Welcome berhasil dimatikan.');
  } catch (error) {
    logger.error({ error, chatJid: context.chatJid }, 'Gagal menjalankan command welcome');
    throw error;
  }
}

export async function handleSetWelcomeCommand(context: CommandContext): Promise<void> {
  try {
    if (!context.isGroup) {
      await context.reply('Command ini hanya bisa digunakan di grup.');
      return;
    }

    const admin = await isGroupAdmin({
      socket: context.socket,
      groupJid: context.chatJid,
      senderJid: context.senderJid,
    });

    if (!admin) {
      await context.reply('Hanya admin grup yang bisa menggunakan command ini.');
      return;
    }

    if (!context.command.rawArgs) {
      await context.reply('Gunakan .setwelcome <pesan>. Placeholder yang tersedia: {nama} dan {namaGrup}.');
      return;
    }

    await setWelcomeMessage({
      groupJid: context.chatJid,
      message: context.command.rawArgs,
      groupName: context.groupName,
    });

    await context.reply('Pesan welcome berhasil diubah.');
  } catch (error) {
    logger.error({ error, chatJid: context.chatJid }, 'Gagal menjalankan command setwelcome');
    throw error;
  }
}
