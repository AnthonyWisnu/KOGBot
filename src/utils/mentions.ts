import type {
  WAMessageContent,
  WASocket,
} from '@whiskeysockets/baileys';

import { resolveGroupUserJid } from '../services/userIdentity.service.js';
import { findGroupParticipant } from './groupMetadata.js';
import { normalizeJid } from './jid.js';

export function getFirstMentionedJid(
  message: WAMessageContent | null | undefined,
): string | undefined {
  return getMentionedJids(message)[0];
}

export function getMentionedJids(
  message: WAMessageContent | null | undefined,
): string[] {
  const content = unwrapMessage(message);

  return (
    content?.extendedTextMessage?.contextInfo?.mentionedJid ??
    content?.imageMessage?.contextInfo?.mentionedJid ??
    content?.videoMessage?.contextInfo?.mentionedJid ??
    content?.documentMessage?.contextInfo?.mentionedJid ??
    []
  );
}

export async function resolveFirstMentionedJid(params: {
  socket: WASocket;
  groupJid: string;
  message: WAMessageContent | null | undefined;
}): Promise<string | undefined> {
  const mentionedJid = getFirstMentionedJid(params.message);

  if (!mentionedJid) {
    return undefined;
  }

  return await resolveGroupParticipantJid({
    socket: params.socket,
    groupJid: params.groupJid,
    participantJid: mentionedJid,
  });
}

export function getMentionLabelFromText(text: string): string | undefined {
  const mentionStart = text.indexOf('@');

  if (mentionStart < 0) {
    return undefined;
  }

  return text.slice(mentionStart).trim().replace(/\s+\d+$/, '').trim();
}

export async function resolveGroupParticipantJid(params: {
  socket: WASocket;
  groupJid: string;
  participantJid: string;
}): Promise<string> {
  if (!params.participantJid.endsWith('@lid')) {
    return normalizeJid(params.participantJid);
  }

  const metadata = await params.socket.groupMetadata(params.groupJid);
  const participant = findGroupParticipant(metadata, params.participantJid);

  return await resolveGroupUserJid({
    socket: params.socket,
    groupJid: params.groupJid,
    userJid: participant?.jid ?? participant?.id ?? params.participantJid,
  });
}

function unwrapMessage(
  message: WAMessageContent | null | undefined,
): WAMessageContent | undefined {
  if (!message) {
    return undefined;
  }

  if (message.ephemeralMessage?.message) {
    return unwrapMessage(message.ephemeralMessage.message);
  }

  if (message.viewOnceMessage?.message) {
    return unwrapMessage(message.viewOnceMessage.message);
  }

  if (message.viewOnceMessageV2?.message) {
    return unwrapMessage(message.viewOnceMessageV2.message);
  }

  if (message.documentWithCaptionMessage?.message) {
    return unwrapMessage(message.documentWithCaptionMessage.message);
  }

  return message;
}
