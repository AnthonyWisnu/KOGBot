import { env } from '../config/env.js';
import { downloadInstagramStoryMedia } from '../services/downloader.service.js';
import {
  getDownloadLimitScope,
  refundReservedDownloadLimit,
  reserveDownloadLimit,
} from '../services/downloadLimit.service.js';
import type { CommandContext } from '../types/command.js';
import { isInstagramStoryUrl } from '../utils/downloaderValidation.js';
import { logger } from '../utils/logger.js';
import { removeTempFile } from '../utils/tempFile.js';

export async function handleInstagramStoryDownloadCommand(context: CommandContext): Promise<void> {
  let filePath: string | undefined;
  let reservedLimit = false;
  const limitScope = getDownloadLimitScope(context);

  try {
    const url = context.command.args[0];

    if (!url) {
      await context.reply('Gunakan .igstory <link> untuk download satu Instagram Story.');
      return;
    }

    if (!isInstagramStoryUrl(url)) {
      await context.reply('Link Instagram Story tidak valid. Gunakan link story spesifik.');
      return;
    }

    reservedLimit = await reserveDownloadLimit({
      userJid: context.senderJid,
      groupJid: limitScope,
    });

    if (!reservedLimit) {
      await context.reply('Limit download kamu habis.\nKumpulkan poin dari game, lalu beli limit dengan .belilimit.');
      return;
    }

    await context.reply('Sedang memproses Instagram Story. Mohon tunggu sebentar.');

    const result = await downloadInstagramStoryMedia(url);
    filePath = result.filePath;
    const content = result.mediaType === 'image'
      ? {
          image: { url: result.filePath },
          caption: result.title ? `Instagram Story: ${result.title}` : undefined,
        }
      : {
          video: { url: result.filePath },
          caption: result.title ? `Instagram Story: ${result.title}` : undefined,
        };

    await context.socket.sendMessage(
      context.chatJid,
      content,
      { quoted: context.message },
    );
  } catch (error) {
    logger.error({
      error,
      errorMessage: getErrorMessage(error),
      chatJid: context.chatJid,
    }, 'Gagal menjalankan command Instagram Story downloader');

    await refundReservedDownloadLimit({
      userJid: context.senderJid,
      groupJid: limitScope,
      reserved: reservedLimit,
    });

    if (isInstagramCookieError(error)) {
      await context.reply('Downloader Instagram Story belum siap. Cookie Instagram belum dikonfigurasi atau tidak ditemukan.');
      return;
    }

    if (isFileTooLargeError(error)) {
      await context.reply(`File terlalu besar. Maksimal ukuran media adalah ${env.MAX_DOWNLOAD_MB} MB.`);
      return;
    }

    if (isYtDlpMissingError(error)) {
      await context.reply('Downloader belum siap. yt-dlp belum terinstall di server.');
      return;
    }

    await context.reply('Gagal download Instagram Story. Story mungkin sudah expired atau tidak dapat diakses akun cookie.');
  } finally {
    if (filePath) {
      await removeTempFile(filePath);
    }
  }
}

function isInstagramCookieError(error: unknown): boolean {
  return error instanceof Error && (
    error.message === 'Cookie Instagram belum dikonfigurasi' ||
    error.message === 'Cookie Instagram tidak ditemukan'
  );
}

function isFileTooLargeError(error: unknown): boolean {
  return error instanceof Error && error.message === 'File terlalu besar';
}

function isYtDlpMissingError(error: unknown): boolean {
  return error instanceof Error && error.message === 'yt-dlp belum terinstall';
}

function getErrorMessage(error: unknown): string | undefined {
  return error instanceof Error ? error.message : undefined;
}
