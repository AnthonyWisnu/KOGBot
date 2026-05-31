import type { WASocket } from '@whiskeysockets/baileys';

import { resolveGroupUserJid } from '../services/userIdentity.service.js';
import {
  findBotParticipant,
  findGroupParticipant,
  isSameGroupParticipant,
} from './groupMetadata.js';
import { formatMention } from './format.js';
import { getNumberFromJid } from './jid.js';
import { logger } from './logger.js';

export type GroupUserDisplay = {
  userJid: string;
  name?: string;
  label: string;
};

export async function resolveGroupUserDisplay(params: {
  socket: WASocket;
  groupJid: string;
  userJid: string;
  pushName?: string;
}): Promise<GroupUserDisplay> {
  const userJid = await resolveGroupUserJid(params);

  try {
    const metadata = await params.socket.groupMetadata(params.groupJid);
    const participant = findGroupParticipant(metadata, userJid);
    const bot = findBotParticipant(metadata, params.socket);
    const participantName = isSameGroupParticipant(participant, bot)
      ? getFirstName(participant?.verifiedName, participant?.notify, participant?.name)
      : getFirstName(participant?.notify, participant?.name, participant?.verifiedName);
    const name = getFirstName(params.pushName, participantName);

    return {
      userJid,
      name,
      label: name ?? formatMention(userJid),
    };
  } catch (error) {
    logger.warn(
      {
        error,
        groupJid: params.groupJid,
        userJid,
      },
      'Gagal mengambil metadata nama user grup',
    );

    return {
      userJid,
      label: formatMention(userJid),
    };
  }
}

export function getUserNumberLabel(userJid: string): string {
  return getNumberFromJid(userJid) || 'user';
}

function getFirstName(...names: Array<string | null | undefined>): string | undefined {
  return names
    .map((name) => name?.trim())
    .find((name): name is string => Boolean(name));
}
