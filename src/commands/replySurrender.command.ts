import { GameType } from '@prisma/client';

import { findActiveGameByMessageId } from '../services/activeGame.service.js';
import type { CommandContext } from '../types/command.js';
import { normalizeText } from '../utils/normalize.js';
import { logger } from '../utils/logger.js';
import { replyEmojiGuessSurrenderResult } from './emojiGuess.command.js';
import { replyFamily100SurrenderResult } from './family100.command.js';
import { replyNumberGuessSurrenderResult } from './numberGuess.command.js';
import { replyQuizSurrenderResult } from './quiz.command.js';
import { replyTicTacToeSurrenderResult } from './ticTacToe.command.js';
import { replyWordScrambleSurrenderResult } from './wordScramble.command.js';

export async function handleReplySurrender(
  context: CommandContext,
  quotedMessageId: string | undefined,
): Promise<boolean> {
  try {
    if (!context.isGroup || !quotedMessageId || normalizeText(context.text) !== 'nyerah') {
      return false;
    }

    const activeGame = await findActiveGameByMessageId({
      groupJid: context.chatJid,
      messageId: quotedMessageId,
    });

    if (!activeGame) {
      return false;
    }

    switch (activeGame.type) {
      case GameType.QUIZ_MTK:
        await replyQuizSurrenderResult(context);
        return true;
      case GameType.FAMILY100:
        await replyFamily100SurrenderResult(context);
        return true;
      case GameType.WORD_SCRAMBLE:
        await replyWordScrambleSurrenderResult(context);
        return true;
      case GameType.EMOJI_GUESS:
        await replyEmojiGuessSurrenderResult(context);
        return true;
      case GameType.NUMBER_GUESS:
        await replyNumberGuessSurrenderResult(context);
        return true;
      case GameType.TICTACTOE:
        await replyTicTacToeSurrenderResult(context);
        return true;
      default:
        return false;
    }
  } catch (error) {
    logger.error({ error, chatJid: context.chatJid, quotedMessageId }, 'Gagal memproses reply nyerah');
    throw error;
  }
}
