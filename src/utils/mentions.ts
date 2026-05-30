import type { WAMessageContent } from '@whiskeysockets/baileys';

export function getFirstMentionedJid(
  message: WAMessageContent | null | undefined,
): string | undefined {
  const content = unwrapMessage(message);

  return (
    content?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] ??
    content?.imageMessage?.contextInfo?.mentionedJid?.[0] ??
    content?.videoMessage?.contextInfo?.mentionedJid?.[0] ??
    content?.documentMessage?.contextInfo?.mentionedJid?.[0] ??
    undefined
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
