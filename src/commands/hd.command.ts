import { enhancePhoto } from '../services/hd/imageEnhance.service.js';
import { checkUserCooldown } from '../services/hd/cooldown.service.js';
import type { CommandContext } from '../types/command.js';
import { getPhotoMediaTarget } from '../utils/mediaTarget.js';
import { logger } from '../utils/logger.js';

const hdCooldownMs = 20 * 1000;

export async function handleHdCommand(context: CommandContext): Promise<void> {
  try {
    const sendAsDocument = shouldSendAsDocument(context.command.args);
    const mediaTarget = await getPhotoMediaTarget(context.message.message);

    if (mediaTarget.status === 'not_found') {
      await context.reply(
        [
          'Gunakan command ini dengan cara:',
          '',
          'reply foto lalu ketik .hd',
          'kirim foto dengan caption .hd',
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
      keyPrefix: 'hd',
      userJid: context.senderJid,
      durationMs: hdCooldownMs,
    });

    if (!cooldown.allowed) {
      await context.reply(`Tunggu ${Math.ceil(cooldown.remainingMs / 1000)} detik sebelum memakai .hd lagi.`);
      return;
    }

    await context.reply('Sedang memproses foto HD. Mohon tunggu sebentar.');

    const result = await enhancePhoto(mediaTarget.media.buffer);

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
        caption: 'Foto HD berhasil diproses.',
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
      'Gagal menjalankan command HD foto',
    );

    await context.reply('Gagal memproses foto. Coba lagi nanti.');
  }
}

function shouldSendAsDocument(args: string[]): boolean {
  return args.some((arg) => arg.toLowerCase() === 'doc');
}
