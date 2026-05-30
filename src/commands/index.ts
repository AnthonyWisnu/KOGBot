import type { CommandContext, CommandHandler } from '../types/command.js';
import { env } from '../config/env.js';
import { handleMenuCommand } from './menu.command.js';
import {
  handleOwnerCommand,
  ownerCommandNames,
} from './owner.command.js';
import {
  handlePointCommand,
  handleRankCommand,
} from './score.command.js';
import {
  handleQuizCommand,
  handleQuizSurrender,
} from './quiz.command.js';
import {
  handleFamily100Command,
  handleFamily100Surrender,
} from './family100.command.js';
import {
  handleEmojiGuessCommand,
  handleEmojiGuessSurrender,
} from './emojiGuess.command.js';
import {
  handleNumberGuessCommand,
  handleNumberGuessSurrender,
} from './numberGuess.command.js';
import {
  handleTicTacToeCommand,
  handleTicTacToeSurrender,
} from './ticTacToe.command.js';
import {
  handleWordScrambleCommand,
  handleWordScrambleSurrender,
} from './wordScramble.command.js';
import {
  handleSetWelcomeCommand,
  handleWelcomeCommand,
} from './welcome.command.js';
import {
  handleInstagramDownloadCommand,
  handleTikTokDownloadCommand,
} from './downloader.command.js';
import {
  handleStickerCommand,
  handleStickerToImageCommand,
} from './sticker.command.js';
import {
  handleBuyLimitCommand,
  handleLimitCommand,
} from './downloadLimit.command.js';
import { logger } from '../utils/logger.js';

const unknownCommandMessage = `Command tidak dikenal. Ketik ${env.BOT_PREFIX}menu untuk melihat daftar fitur.`;

const commandHandlers = new Map<string, CommandHandler>([
  ['menu', handleMenuCommand],
  ['poin', handlePointCommand],
  ['rank', handleRankCommand],
  ['limit', handleLimitCommand],
  ['belilimit', handleBuyLimitCommand],
  ['kuis', handleQuizCommand],
  ['family100', handleFamily100Command],
  ['tebakkata', handleWordScrambleCommand],
  ['tebakemoji', handleEmojiGuessCommand],
  ['tebakangka', handleNumberGuessCommand],
  ['tictactoe', handleTicTacToeCommand],
  ['nyerah', handleSurrenderCommand],
  ['welcome', handleWelcomeCommand],
  ['setwelcome', handleSetWelcomeCommand],
  ['tt', handleTikTokDownloadCommand],
  ['ig', handleInstagramDownloadCommand],
  ['s', handleStickerCommand],
  ['gambar', handleStickerToImageCommand],
]);

export async function routeCommand(context: CommandContext): Promise<void> {
  try {
    if (ownerCommandNames.has(context.command.name)) {
      await handleOwnerCommand(context);
      return;
    }

    const handler = commandHandlers.get(context.command.name);

    if (!handler) {
      await context.reply(unknownCommandMessage);
      return;
    }

    await handler(context);
  } catch (error) {
    logger.error(
      {
        error,
        command: context.command.name,
        chatJid: context.chatJid,
        senderJid: context.senderJid,
      },
      'Gagal menjalankan command',
    );

    await context.reply('Terjadi kesalahan saat menjalankan command. Coba lagi nanti.');
  }
}

async function handleSurrenderCommand(context: CommandContext): Promise<void> {
  try {
    switch (context.command.rawArgs.toLowerCase()) {
      case 'kuis':
        await handleQuizSurrender(context);
        return;
      case 'family100':
        await handleFamily100Surrender(context);
        return;
      case 'tebakkata':
        await handleWordScrambleSurrender(context);
        return;
      case 'tebakemoji':
        await handleEmojiGuessSurrender(context);
        return;
      case 'tebakangka':
        await handleNumberGuessSurrender(context);
        return;
      case 'tictactoe':
        await handleTicTacToeSurrender(context);
        return;
      default:
        await context.reply('Command menyerah harus spesifik. Gunakan .nyerah kuis, .nyerah family100, .nyerah tebakkata, .nyerah tebakemoji, .nyerah tebakangka, atau .nyerah tictactoe.');
    }
  } catch (error) {
    logger.error({ error, chatJid: context.chatJid }, 'Gagal menjalankan command nyerah');
    throw error;
  }
}
