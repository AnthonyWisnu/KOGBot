import {
  downloadContentFromMessage,
  type WAMessageContent,
  type proto,
} from '@whiskeysockets/baileys';

const maxHdPhotoInputBytes = 7 * 1024 * 1024;

export type PhotoMediaTarget = {
  sourceType: 'quoted' | 'current';
  mimeType: string;
  fileLength?: number;
  buffer: Buffer;
};

export type PhotoMediaTargetResult =
  | {
      status: 'success';
      media: PhotoMediaTarget;
    }
  | {
      status: 'not_found';
    }
  | {
      status: 'not_image';
    }
  | {
      status: 'too_large';
      maxBytes: number;
    };

export async function getPhotoMediaTarget(
  message: WAMessageContent | null | undefined,
): Promise<PhotoMediaTargetResult> {
  const content = unwrapMessage(message);
  const quotedMessage = getQuotedMessage(content);
  const quotedImage = quotedMessage?.imageMessage;

  if (quotedImage) {
    return await buildPhotoMediaTarget(quotedImage, 'quoted');
  }

  if (quotedMessage && !quotedImage) {
    return {
      status: 'not_image',
    };
  }

  if (content?.imageMessage) {
    return await buildPhotoMediaTarget(content.imageMessage, 'current');
  }

  if (hasUnsupportedMedia(content)) {
    return {
      status: 'not_image',
    };
  }

  return {
    status: 'not_found',
  };
}

export function getMaxHdPhotoInputBytes(): number {
  return maxHdPhotoInputBytes;
}

async function buildPhotoMediaTarget(
  imageMessage: proto.Message.IImageMessage,
  sourceType: 'quoted' | 'current',
): Promise<PhotoMediaTargetResult> {
  const fileLength = normalizeFileLength(imageMessage.fileLength);

  if (typeof fileLength === 'number' && fileLength > maxHdPhotoInputBytes) {
    return {
      status: 'too_large',
      maxBytes: maxHdPhotoInputBytes,
    };
  }

  const buffer = await streamToBuffer(await downloadContentFromMessage(imageMessage, 'image'));

  if (buffer.length > maxHdPhotoInputBytes) {
    return {
      status: 'too_large',
      maxBytes: maxHdPhotoInputBytes,
    };
  }

  return {
    status: 'success',
    media: {
      sourceType,
      mimeType: imageMessage.mimetype ?? 'image/jpeg',
      fileLength,
      buffer,
    },
  };
}

function getQuotedMessage(
  message: WAMessageContent | undefined,
): WAMessageContent | undefined {
  return (
    message?.extendedTextMessage?.contextInfo?.quotedMessage ??
    message?.imageMessage?.contextInfo?.quotedMessage ??
    message?.videoMessage?.contextInfo?.quotedMessage ??
    message?.documentMessage?.contextInfo?.quotedMessage ??
    undefined
  );
}

function hasUnsupportedMedia(message: WAMessageContent | undefined): boolean {
  return Boolean(
    message?.videoMessage ??
      message?.stickerMessage ??
      message?.documentMessage ??
      message?.audioMessage,
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

function normalizeFileLength(
  fileLength: number | { toNumber: () => number } | null | undefined,
): number | undefined {
  if (fileLength === null || fileLength === undefined) {
    return undefined;
  }

  if (typeof fileLength === 'number') {
    return fileLength;
  }

  return fileLength.toNumber();
}

async function streamToBuffer(stream: AsyncIterable<Buffer>): Promise<Buffer> {
  const chunks: Buffer[] = [];

  for await (const chunk of stream) {
    chunks.push(chunk);
  }

  return Buffer.concat(chunks);
}
