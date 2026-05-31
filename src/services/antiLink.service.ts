import type {
  WAMessage,
  WASocket,
} from '@whiskeysockets/baileys';

import { isOwner } from '../bot/permissions.js';
import {
  isAntiLinkEnabled,
  setAntiLinkEnabled,
} from './group.service.js';
import {
  findBotParticipant,
  findGroupParticipant,
  getParticipantActionJid,
  getParticipantIdentityJid,
  isGroupParticipantAdmin,
} from '../utils/groupMetadata.js';
import { formatMention } from '../utils/format.js';
import { logger } from '../utils/logger.js';

const whatsAppGroupInvitePattern =
  /(?:https?:\/\/)?(?:www\.)?chat\.whatsapp\.com\/[a-z0-9_-]+/i;

export type ConfigureAntiLinkResult =
  | { status: 'success'; enabled: boolean }
  | { status: 'actor_not_allowed' }
  | { status: 'bot_not_admin' };

export type EnforceAntiLinkResult =
  | { status: 'ignored' }
  | { status: 'bot_not_admin' }
  | { status: 'enforced'; targetJid: string };

export function containsWhatsAppGroupInvite(text: string): boolean {
  return whatsAppGroupInvitePattern.test(text);
}

export async function configureAntiLink(params: {
  socket: WASocket;
  groupJid: string;
  groupName?: string;
  actorJid: string;
  enabled: boolean;
}): Promise<ConfigureAntiLinkResult> {
  const metadata = await params.socket.groupMetadata(params.groupJid);
  const actor = findGroupParticipant(metadata, params.actorJid);
  const actorIdentityJid = actor
    ? getParticipantIdentityJid(actor)
    : params.actorJid;

  if (!isOwner(actorIdentityJid) && !isGroupParticipantAdmin(actor)) {
    return { status: 'actor_not_allowed' };
  }

  if (params.enabled && !isGroupParticipantAdmin(findBotParticipant(metadata, params.socket))) {
    return { status: 'bot_not_admin' };
  }

  await setAntiLinkEnabled(params.groupJid, params.enabled, params.groupName);

  return {
    status: 'success',
    enabled: params.enabled,
  };
}

export async function enforceAntiLink(params: {
  socket: WASocket;
  message: WAMessage;
  groupJid: string;
  senderJid: string;
  text: string;
}): Promise<EnforceAntiLinkResult> {
  if (!containsWhatsAppGroupInvite(params.text)) {
    return { status: 'ignored' };
  }

  if (!await isAntiLinkEnabled(params.groupJid)) {
    return { status: 'ignored' };
  }

  const metadata = await params.socket.groupMetadata(params.groupJid);
  const sender = findGroupParticipant(metadata, params.senderJid);
  const senderIdentityJid = sender
    ? getParticipantIdentityJid(sender)
    : params.senderJid;

  if (isOwner(senderIdentityJid) || isGroupParticipantAdmin(sender)) {
    return { status: 'ignored' };
  }

  if (!isGroupParticipantAdmin(findBotParticipant(metadata, params.socket))) {
    return { status: 'bot_not_admin' };
  }

  if (!sender) {
    return { status: 'ignored' };
  }

  try {
    await params.socket.sendMessage(params.groupJid, {
      delete: params.message.key,
    });
  } catch (error) {
    logger.warn(
      {
        error,
        groupJid: params.groupJid,
        messageId: params.message.key.id,
      },
      'Gagal menghapus pesan pelanggaran anti link',
    );
  }

  const targetJid = getParticipantActionJid(sender);

  await params.socket.groupParticipantsUpdate(
    params.groupJid,
    [targetJid],
    'remove',
  );

  await params.socket.sendMessage(params.groupJid, {
    text: `${formatMention(senderIdentityJid)} dikeluarkan karena mengirim link undangan grup WhatsApp.`,
    mentions: [senderIdentityJid],
  });

  return {
    status: 'enforced',
    targetJid,
  };
}
