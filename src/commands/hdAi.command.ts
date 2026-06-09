import { canUseHdAi } from '../services/hd/hdAccess.service.js';
import {
  isHdAiDependencyError,
  upscalePhotoWithAi,
} from '../services/hd/imageAiUpscale.service.js';
import {
  enqueueHdAiJob,
  getHdAiQueueStatus,
} from '../services/hd/hdQueue.service.js';
import { checkUserCooldown } from '../services/hd/cooldown.service.js';
import {
  getDownloadLimitScope,
  refundReservedDownloadLimit,
  reserveDownloadLimit,
} from '../services/downloadLimit.service.js';
import type { CommandContext } from '../types/command.js';
import { logger } from '../utils/logger.js';
import { getPhotoMediaTarget } from '../utils/mediaTarget.js';

const hdAiCooldownMs = 3 * 60 * 1000;
const maxHdAiPendingJobs = 5;

export async function handleHdAiCommand(context: CommandContext): Promise<void> {
  let reservedLimit = false;
  const limitScope = getDownloadLimitScope(context);

  try {
    const sendAsDocument = shouldSendAsDocument(context.command.args);
    const mediaTarget = await getPhotoMediaTarget(context.message.message);

    if (mediaTarget.status === 'not_found') {
      await context.reply(
        [
          'Gunakan command ini dengan cara:',
          '',
          'reply foto lalu ketik .hdai',
          'kirim foto dengan caption .hdai',
        ].join('\n'),
      );
      return;
    }

    if (mediaTarget.status === 'not_image') {
      await context.reply('Command ini hanya bisa digunakan untuk foto.');
      return;
    }

    if (mediaTarget.status === 'too_large') {
      await context.reply('Ukuran foto terlalu besar. Maksimal 7 MB.');
      return;
    }

    const cooldown = checkUserCooldown({
      keyPrefix: 'hdai',
      userJid: context.senderJid,
      durationMs: hdAiCooldownMs,
    });

    if (!cooldown.allowed) {
      await context.reply(`Tunggu ${Math.ceil(cooldown.remainingMs / 1000)} detik sebelum memakai .hdai lagi.`);
      return;
    }

    if (!await canUseHdAi(context)) {
      await context.reply('Kamu belum bisa memakai fitur HD AI.');
      return;
    }

    const queueStatus = getHdAiQueueStatus();
    if (queueStatus.pending >= maxHdAiPendingJobs) {
      await context.reply('Antrean HD AI sedang penuh. Coba lagi nanti.');
      return;
    }

    reservedLimit = await reserveDownloadLimit({
      userJid: context.senderJid,
      groupJid: limitScope,
    });

    if (!reservedLimit) {
      await context.reply('Limit fitur kamu habis.\nKumpulkan poin dari game, lalu beli limit dengan .belilimit.');
      return;
    }

    const queued = enqueueHdAiJob(() => upscalePhotoWithAi(mediaTarget.media.buffer));

    if (queued.status === 'full') {
      await refundReservedDownloadLimit({
        userJid: context.senderJid,
        groupJid: limitScope,
        reserved: reservedLimit,
      });
      reservedLimit = false;
      await context.reply('Antrean HD AI sedang penuh. Coba lagi nanti.');
      return;
    }

    if (queued.position > 1) {
      await context.reply(
        [
          'Permintaan HD AI sedang antre.',
          `Posisi antrean kamu: ${queued.position}`,
        ].join('\n'),
      );
    } else {
      await context.reply('Sedang memproses foto HD AI. Proses ini bisa memakan waktu lebih lama.');
    }

    const result = await queued.result;

    if (sendAsDocument) {
      await context.socket.sendMessage(
        context.chatJid,
        {
          document: result.buffer,
          fileName: result.filename,
          mimetype: result.mimeType,
        },
        { quoted: context.message },
      );
      return;
    }

    await context.socket.sendMessage(
      context.chatJid,
      {
        image: result.buffer,
        mimetype: result.mimeType,
        caption: 'Foto HD AI berhasil diproses.',
      },
      { quoted: context.message },
    );
  } catch (error) {
    logger.error(
      {
        error,
        chatJid: context.chatJid,
        senderJid: context.senderJid,
      },
      'Gagal menjalankan command HD AI',
    );

    await refundReservedDownloadLimit({
      userJid: context.senderJid,
      groupJid: limitScope,
      reserved: reservedLimit,
    });

    if (isHdAiDependencyError(error)) {
      await context.reply('Fitur HD AI belum siap di server.');
      return;
    }

    if (isHdAiTimeoutError(error)) {
      await context.reply('Proses HD AI terlalu lama. Limit kamu sudah dikembalikan.');
      return;
    }

    await context.reply('Gagal memproses foto HD AI. Limit kamu sudah dikembalikan.');
  }
}

function shouldSendAsDocument(args: string[]): boolean {
  return args.some((arg) => arg.toLowerCase() === 'doc');
}

function isHdAiTimeoutError(error: unknown): boolean {
  return error instanceof Error && error.message === 'Proses HD AI terlalu lama.';
}
