import { GameType, type ActiveGame } from '@prisma/client';

import { prisma } from '../database/prisma.js';
import { logger } from '../utils/logger.js';

export async function getActiveGame(params: {
  groupJid: string;
  type: GameType;
}): Promise<ActiveGame | undefined> {
  try {
    const activeGame = await prisma.activeGame.findUnique({
      where: {
        groupJid_type: {
          groupJid: params.groupJid,
          type: params.type,
        },
      },
    });

    return activeGame ?? undefined;
  } catch (error) {
    logger.error({ error, params }, 'Gagal mengambil game aktif');
    throw error;
  }
}

export async function updateActiveGameMessageId(params: {
  groupJid: string;
  type: GameType;
  messageId: string;
  asLastPrompt?: boolean;
}): Promise<void> {
  try {
    await prisma.activeGame.update({
      where: {
        groupJid_type: {
          groupJid: params.groupJid,
          type: params.type,
        },
      },
      data: params.asLastPrompt
        ? {
            lastPromptMessageId: params.messageId,
          }
        : {
            messageId: params.messageId,
            lastPromptMessageId: params.messageId,
          },
    });
  } catch (error) {
    logger.error({ error, params }, 'Gagal menyimpan message id game aktif');
    throw error;
  }
}

export async function findActiveGameByMessageId(params: {
  groupJid: string;
  messageId: string;
}): Promise<ActiveGame | undefined> {
  try {
    const activeGame = await prisma.activeGame.findFirst({
      where: {
        groupJid: params.groupJid,
        OR: [
          {
            messageId: params.messageId,
          },
          {
            lastPromptMessageId: params.messageId,
          },
        ],
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return activeGame ?? undefined;
  } catch (error) {
    logger.error({ error, params }, 'Gagal mencari game aktif dari quoted message');
    throw error;
  }
}
