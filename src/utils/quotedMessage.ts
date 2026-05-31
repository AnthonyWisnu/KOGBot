import type {
  WAContextInfo,
  WAMessageContent,
} from '@whiskeysockets/baileys';

export type QuotedMessageReference = {
  messageId: string;
  participantJid: string;
};

export function getQuotedMessageReference(
  message: WAMessageContent | null | undefined,
): QuotedMessageReference | undefined {
  const contextInfo = getContextInfo(unwrapMessage(message));
  const messageId = contextInfo?.stanzaId ?? undefined;
  const participantJid = contextInfo?.participant ?? undefined;

  if (!messageId || !participantJid) {
    return undefined;
  }

  return {
    messageId,
    participantJid,
  };
}

function getContextInfo(
  content: WAMessageContent | undefined,
): WAContextInfo | null | undefined {
  return (
    content?.extendedTextMessage?.contextInfo ??
    content?.imageMessage?.contextInfo ??
    content?.videoMessage?.contextInfo ??
    content?.documentMessage?.contextInfo ??
    content?.audioMessage?.contextInfo ??
    content?.stickerMessage?.contextInfo
  );
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
