import {
  downloadContentFromMessage,
  type WAMessageContent,
} from '@whiskeysockets/baileys';

type QuotedMediaType = 'image' | 'sticker';

type QuotedMedia = {
  buffer: Buffer;
  type: QuotedMediaType;
};

export async function downloadQuotedMedia(
  message: WAMessageContent | null | undefined,
): Promise<QuotedMedia | undefined> {
  const quotedMessage = getQuotedMessage(message);

  if (!quotedMessage) {
    return undefined;
  }

  if (quotedMessage.imageMessage) {
    return {
      buffer: await streamToBuffer(await downloadContentFromMessage(quotedMessage.imageMessage, 'image')),
      type: 'image',
    };
  }

  if (quotedMessage.stickerMessage) {
    return {
      buffer: await streamToBuffer(await downloadContentFromMessage(quotedMessage.stickerMessage, 'sticker')),
      type: 'sticker',
    };
  }

  return undefined;
}

function getQuotedMessage(
  message: WAMessageContent | null | undefined,
): WAMessageContent | undefined {
  const content = unwrapMessage(message);

  return (
    content?.extendedTextMessage?.contextInfo?.quotedMessage ??
    content?.imageMessage?.contextInfo?.quotedMessage ??
    content?.videoMessage?.contextInfo?.quotedMessage ??
    content?.documentMessage?.contextInfo?.quotedMessage ??
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

async function streamToBuffer(stream: AsyncIterable<Buffer>): Promise<Buffer> {
  const chunks: Buffer[] = [];

  for await (const chunk of stream) {
    chunks.push(chunk);
  }

  return Buffer.concat(chunks);
}
