import { env } from '../config/env.js';
import {
  downloadInstagramReelVideo,
  downloadTikTokVideo,
} from '../services/downloader.service.js';
import {
  refundReservedDownloadLimit,
  reserveDownloadLimit,
} from '../services/downloadLimit.service.js';
import type { CommandContext } from '../types/command.js';
import {
  isInstagramReelUrl,
  isTikTokUrl,
} from '../utils/downloaderValidation.js';
import { logger } from '../utils/logger.js';
import { removeTempFile } from '../utils/tempFile.js';

export async function handleTikTokDownloadCommand(context: CommandContext): Promise<void> {
  let filePath: string | undefined;
  let reservedLimit = false;

  try {
    const url = context.command.args[0];

    if (!url) {
      await context.reply('Gunakan .tt <link> untuk download video TikTok publik.');
      return;
    }

    if (!isTikTokUrl(url)) {
      await context.reply('Gagal download. Pastikan link publik dan coba lagi.');
      return;
    }

    reservedLimit = await reserveDownloadLimit({
      userJid: context.senderJid,
      groupJid: context.chatJid,
    });

    if (!reservedLimit) {
      await context.reply('Limit download kamu habis.\nKumpulkan poin dari game, lalu beli limit dengan .belilimit.');
      return;
    }

    await context.reply('Sedang memproses video TikTok. Mohon tunggu sebentar.');

    const result = await downloadTikTokVideo(url);
    filePath = result.filePath;

    await context.socket.sendMessage(
      context.chatJid,
      {
        video: {
          url: result.filePath,
        },
        caption: result.title ? `TikTok: ${result.title}` : undefined,
      },
      { quoted: context.message },
    );
  } catch (error) {
    logger.error({
      error,
      errorMessage: getErrorMessage(error),
      chatJid: context.chatJid,
    }, 'Gagal menjalankan command TikTok downloader');

    await refundReservedDownloadLimit({
      userJid: context.senderJid,
      groupJid: context.chatJid,
      reserved: reservedLimit,
    });

    if (isFileTooLargeError(error)) {
      await context.reply(`File terlalu besar. Maksimal ukuran video adalah ${env.MAX_DOWNLOAD_MB} MB.`);
      return;
    }

    if (isYtDlpMissingError(error)) {
      await context.reply('Downloader belum siap. yt-dlp belum terinstall di server.');
      return;
    }

    if (isNotPublicVideoError(error)) {
      await context.reply('Gagal download. Video tidak publik atau butuh login.');
      return;
    }

    await context.reply('Gagal download. Pastikan link publik dan coba lagi.');
  } finally {
    if (filePath) {
      await removeTempFile(filePath);
    }
  }
}

export async function handleInstagramDownloadCommand(context: CommandContext): Promise<void> {
  let filePath: string | undefined;
  let reservedLimit = false;

  try {
    const url = context.command.args[0];

    if (!url) {
      await context.reply('Gunakan .ig <link> untuk download Instagram Reels publik.');
      return;
    }

    if (!isInstagramReelUrl(url)) {
      await context.reply('Gagal download. Pastikan link publik dan coba lagi.');
      return;
    }

    reservedLimit = await reserveDownloadLimit({
      userJid: context.senderJid,
      groupJid: context.chatJid,
    });

    if (!reservedLimit) {
      await context.reply('Limit download kamu habis.\nKumpulkan poin dari game, lalu beli limit dengan .belilimit.');
      return;
    }

    await context.reply('Sedang memproses Instagram Reels. Mohon tunggu sebentar.');

    const result = await downloadInstagramReelVideo(url);
    filePath = result.filePath;

    await context.socket.sendMessage(
      context.chatJid,
      {
        video: {
          url: result.filePath,
        },
        caption: result.title ? `Instagram: ${result.title}` : undefined,
      },
      { quoted: context.message },
    );
  } catch (error) {
    logger.error({
      error,
      errorMessage: getErrorMessage(error),
      chatJid: context.chatJid,
    }, 'Gagal menjalankan command Instagram downloader');

    await refundReservedDownloadLimit({
      userJid: context.senderJid,
      groupJid: context.chatJid,
      reserved: reservedLimit,
    });

    if (isFileTooLargeError(error)) {
      await context.reply(`File terlalu besar. Maksimal ukuran video adalah ${env.MAX_DOWNLOAD_MB} MB.`);
      return;
    }

    if (isYtDlpMissingError(error)) {
      await context.reply('Downloader belum siap. yt-dlp belum terinstall di server.');
      return;
    }

    if (isNotPublicVideoError(error)) {
      await context.reply('Gagal download. Video tidak publik atau butuh login.');
      return;
    }

    await context.reply('Gagal download. Pastikan link publik dan coba lagi.');
  } finally {
    if (filePath) {
      await removeTempFile(filePath);
    }
  }
}

function isFileTooLargeError(error: unknown): boolean {
  return error instanceof Error && error.message === 'File terlalu besar';
}

function isYtDlpMissingError(error: unknown): boolean {
  return error instanceof Error && error.message === 'yt-dlp belum terinstall';
}

function isNotPublicVideoError(error: unknown): boolean {
  return error instanceof Error && error.message === 'Video tidak publik';
}

function getErrorMessage(error: unknown): string | undefined {
  return error instanceof Error ? error.message : undefined;
}
