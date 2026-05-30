import type {
  WAMessageContent,
  WASocket,
} from '@whiskeysockets/baileys';

import { getNumberFromJid } from './jid.js';

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

export async function resolveGroupParticipantJid(params: {
  socket: WASocket;
  groupJid: string;
  participantJid: string;
}): Promise<string> {
  const metadata = await params.socket.groupMetadata(params.groupJid);
  const participantNumber = getNumberFromJid(params.participantJid);
  const participant = metadata.participants.find((item) => {
    return (
      item.id === params.participantJid ||
      item.jid === params.participantJid ||
      item.lid === params.participantJid ||
      getNumberFromJid(item.id) === participantNumber ||
      (item.jid ? getNumberFromJid(item.jid) === participantNumber : false) ||
      (item.lid ? getNumberFromJid(item.lid) === participantNumber : false)
    );
  });

  return participant?.jid ?? participant?.id ?? params.participantJid;
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
