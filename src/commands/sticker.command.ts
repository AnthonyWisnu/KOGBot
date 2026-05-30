import type { CommandContext } from '../types/command.js';
import {
  convertImageToSticker,
  convertStickerToImage,
} from '../services/mediaConvert.service.js';
import { logger } from '../utils/logger.js';
import { downloadQuotedMedia } from '../utils/quotedMedia.js';
import { removeTempFile } from '../utils/tempFile.js';

export async function handleStickerCommand(context: CommandContext): Promise<void> {
  let stickerPath: string | undefined;

  try {
    const media = await downloadQuotedMedia(context.message.message);

    if (!media || media.type !== 'image') {
      await context.reply('Reply gambar dengan .s untuk membuat sticker.');
      return;
    }

    const result = await convertImageToSticker(media.buffer);
    stickerPath = result.filePath;

    await context.socket.sendMessage(
      context.chatJid,
      {
        sticker: {
          url: stickerPath,
        },
      },
      { quoted: context.message },
    );
  } catch (error) {
    logger.error({ error, chatJid: context.chatJid }, 'Gagal menjalankan command sticker');
    await context.reply('Gagal membuat sticker. Coba pakai gambar lain.');
  } finally {
    if (stickerPath) {
      await removeTempFile(stickerPath);
    }
  }
}

export async function handleStickerToImageCommand(context: CommandContext): Promise<void> {
  let imagePath: string | undefined;

  try {
    const media = await downloadQuotedMedia(context.message.message);

    if (!media || media.type !== 'sticker') {
      await context.reply('Reply sticker dengan .gambar untuk mengubahnya jadi gambar.');
      return;
    }

    const result = await convertStickerToImage(media.buffer);
    imagePath = result.filePath;

    await context.socket.sendMessage(
      context.chatJid,
      {
        image: {
          url: imagePath,
        },
      },
      { quoted: context.message },
    );
  } catch (error) {
    logger.error({ error, chatJid: context.chatJid }, 'Gagal menjalankan command sticker ke gambar');
    await context.reply('Gagal mengubah sticker jadi gambar. Coba sticker lain.');
  } finally {
    if (imagePath) {
      await removeTempFile(imagePath);
    }
  }
}
