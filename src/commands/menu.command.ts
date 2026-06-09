import { env } from '../config/env.js';
import type { CommandContext } from '../types/command.js';
import { logger } from '../utils/logger.js';

export async function handleMenuCommand(context: CommandContext): Promise<void> {
  try {
    await context.reply(
      [
        '*MinjiBot Menu*',
        '',
        '\u{1F3AE} *GAME*',
        `*${env.BOT_PREFIX}kuis mtk* - Kuis matematika`,
        `*${env.BOT_PREFIX}family100* - Family 100`,
        `*${env.BOT_PREFIX}tebakkata* - Tebak kata acak`,
        `*${env.BOT_PREFIX}tebakemoji* - Tebak dari emoji`,
        `*${env.BOT_PREFIX}tebakangka* - Tebak angka 1-100`,
        `*${env.BOT_PREFIX}tictactoe @user* - Duel 1v1`,
        '',
        `_Nyerah game: *${env.BOT_PREFIX}nyerah [nama game]*_`,
        `_Contoh: *${env.BOT_PREFIX}nyerah kuis*_`,
        '',
        '\u{1F3C6} *POIN & LIMIT*',
        `*${env.BOT_PREFIX}poin* - Cek poin kamu`,
        `*${env.BOT_PREFIX}profile* / *@user* - Profil`,
        `*${env.BOT_PREFIX}rank* - Ranking grup`,
        `*${env.BOT_PREFIX}limit* - Cek limit fitur`,
        `*${env.BOT_PREFIX}belilimit <jumlah>* - Beli limit fitur (100 poin/limit)`,
        `*${env.BOT_PREFIX}transferlimit @user <jumlah>* - Kirim limit`,
        '',
        '\u{1F381} *REWARD*',
        `*${env.BOT_PREFIX}daily* - Klaim hadiah harian`,
        '',
        '\u{1F4AC} *QUOTE*',
        `*${env.BOT_PREFIX}quote* - Quote random`,
        `*${env.BOT_PREFIX}quote <kategori>* - Quote berdasarkan kategori`,
        '_Kategori: motivasi, lucu, islami, cinta, galau_',
        '',
        '\u{1F4E5} *DOWNLOADER*',
        `*${env.BOT_PREFIX}tt <link>* - Download TikTok`,
        `*${env.BOT_PREFIX}ig <link>* - Download Instagram Reels`,
        `*${env.BOT_PREFIX}igstory <link>* - Download Instagram Story`,
        '_Chat pribadi bot memakai limit private._',
        '',
        '\u{1F5BC} *MEDIA*',
        `*${env.BOT_PREFIX}s* - Reply gambar jadi sticker`,
        `*${env.BOT_PREFIX}gambar* - Reply sticker jadi gambar`,
        `*${env.BOT_PREFIX}hd* - Tingkatkan kualitas foto 2x`,
        `*${env.BOT_PREFIX}hd doc* - HD foto sebagai dokumen`,
        `*${env.BOT_PREFIX}hdai* - HD AI foto 4x`,
        `*${env.BOT_PREFIX}hdai doc* - HD AI foto sebagai dokumen`,
        '',
        '\u{1F44B} *ADMIN*',
        `*${env.BOT_PREFIX}welcome on/off* - Atur welcome`,
        `*${env.BOT_PREFIX}setwelcome <pesan>* - Ubah welcome`,
        '',
        '\u{1F6E1} *MODERASI*',
        `*${env.BOT_PREFIX}kick @user* - Keluarkan member`,
        `*${env.BOT_PREFIX}promote @user* - Jadikan admin`,
        `*${env.BOT_PREFIX}demote @user* - Turunkan admin`,
        `*${env.BOT_PREFIX}del* - Hapus pesan reply`,
        `*${env.BOT_PREFIX}tagall <pesan>* - Pengumuman grup`,
        `*${env.BOT_PREFIX}antilink on/off* - Anti link grup WhatsApp`,
        '',
        `_Prefix: ${env.BOT_PREFIX}_`,
        '_Limit fitur dipakai untuk download video dan HD AI._',
      ].join('\n'),
    );
  } catch (error) {
    logger.error({ error }, 'Gagal mengirim menu');
    throw error;
  }
}
