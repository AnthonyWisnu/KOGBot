import type { Group } from '@prisma/client';

import { prisma } from '../database/prisma.js';
import { isGroupApproved } from './group.service.js';
import { formatMention } from '../utils/format.js';
import { logger } from '../utils/logger.js';

const defaultWelcomeMessage =
  '\u2554\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2557\n   *Selamat Datang!* \u{1F389}\n\u255A\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u255D\n\nHalo {nama}, welcome to *{namaGrup}*! \u{1F44B}\n\nSenang kamu bergabung di sini.\nJangan lupa kenalan sama yang lain ya \u{1F60A}\nJangan ragu buat ngobrol dan ikutan game bot!\n\nKetik *.menu* untuk lihat fitur bot \u{1F916}\n_Selamat bergabung, semoga betah!_ \u{1F3E0}';

const defaultGoodbyeMessage =
  '\u256D\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u256E\n  *See You, {nama}* \u{1F44B}\n\u2570\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u256F\n\n*{nama}* sudah meninggalkan kita di *{namaGrup}*.\n\nTerima kasih sudah meramaikan grup ini!\nSemoga sukses selalu di luar sana ya \u{1F64F}\n_Sampai ketemu lagi di lain waktu._';

export async function setWelcomeEnabled(params: {
  groupJid: string;
  enabled: boolean;
  groupName?: string;
}): Promise<Group> {
  try {
    return await prisma.group.upsert({
      where: {
        jid: params.groupJid,
      },
      create: {
        jid: params.groupJid,
        name: params.groupName,
        welcomeEnabled: params.enabled,
      },
      update: {
        ...(params.groupName ? { name: params.groupName } : {}),
        welcomeEnabled: params.enabled,
      },
    });
  } catch (error) {
    logger.error({ error, params }, 'Gagal mengubah status welcome');
    throw error;
  }
}

export async function setWelcomeMessage(params: {
  groupJid: string;
  message: string;
  groupName?: string;
}): Promise<Group> {
  try {
    return await prisma.group.upsert({
      where: {
        jid: params.groupJid,
      },
      create: {
        jid: params.groupJid,
        name: params.groupName,
        welcomeMessage: params.message,
      },
      update: {
        ...(params.groupName ? { name: params.groupName } : {}),
        welcomeMessage: params.message,
      },
    });
  } catch (error) {
    logger.error({ error, params }, 'Gagal mengubah pesan welcome');
    throw error;
  }
}

export async function buildWelcomeMessages(params: {
  groupJid: string;
  groupName: string;
  participants: string[];
}): Promise<Array<{ text: string; mentions: string[] }>> {
  try {
    const approved = await isGroupApproved(params.groupJid);

    if (!approved) {
      return [];
    }

    const group = await prisma.group.findUnique({
      where: {
        jid: params.groupJid,
      },
      select: {
        welcomeEnabled: true,
        welcomeMessage: true,
      },
    });

    if (!group?.welcomeEnabled) {
      return [];
    }

    const template = group.welcomeMessage ?? defaultWelcomeMessage;

    return params.participants.map((participant) => ({
      text: renderWelcomeMessage({
        template,
        userJid: participant,
        groupName: params.groupName,
      }),
      mentions: [participant],
    }));
  } catch (error) {
    logger.error({ error, params }, 'Gagal membuat pesan welcome');
    throw error;
  }
}

export async function buildGoodbyeMessages(params: {
  groupJid: string;
  groupName: string;
  participants: string[];
}): Promise<Array<{ text: string; mentions: string[] }>> {
  try {
    const approved = await isGroupApproved(params.groupJid);

    if (!approved) {
      return [];
    }

    const group = await prisma.group.findUnique({
      where: {
        jid: params.groupJid,
      },
      select: {
        welcomeEnabled: true,
      },
    });

    if (!group?.welcomeEnabled) {
      return [];
    }

    return params.participants.map((participant) => ({
      text: renderParticipantMessage({
        template: defaultGoodbyeMessage,
        userJid: participant,
        groupName: params.groupName,
      }),
      mentions: [participant],
    }));
  } catch (error) {
    logger.error({ error, params }, 'Gagal membuat pesan perpisahan');
    throw error;
  }
}

function renderWelcomeMessage(params: {
  template: string;
  userJid: string;
  groupName: string;
}): string {
  return renderParticipantMessage(params);
}

function renderParticipantMessage(params: {
  template: string;
  userJid: string;
  groupName: string;
}): string {
  return params.template
    .replaceAll('{nama}', formatMention(params.userJid))
    .replaceAll('{namaGrup}', params.groupName)
    .replaceAll('@user', formatMention(params.userJid))
    .replaceAll('@group', params.groupName);
}
