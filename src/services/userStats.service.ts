import type { UserStats } from '@prisma/client';

import { prisma } from '../database/prisma.js';
import { logger } from '../utils/logger.js';

export async function getOrCreateUserStats(params: {
  userJid: string;
  groupJid: string;
}): Promise<UserStats> {
  try {
    return await prisma.userStats.upsert({
      where: {
        userJid_groupJid: {
          userJid: params.userJid,
          groupJid: params.groupJid,
        },
      },
      create: {
        userJid: params.userJid,
        groupJid: params.groupJid,
      },
      update: {},
    });
  } catch (error) {
    logger.error({ error, params }, 'Gagal mengambil atau membuat user stats');
    throw error;
  }
}

export async function incrementGamesWon(params: {
  userJid: string;
  groupJid: string;
  amount?: number;
}): Promise<UserStats> {
  try {
    return await prisma.userStats.upsert({
      where: {
        userJid_groupJid: {
          userJid: params.userJid,
          groupJid: params.groupJid,
        },
      },
      create: {
        userJid: params.userJid,
        groupJid: params.groupJid,
        gamesWon: params.amount ?? 1,
      },
      update: {
        gamesWon: {
          increment: params.amount ?? 1,
        },
      },
    });
  } catch (error) {
    logger.error({ error, params }, 'Gagal menambah jumlah kemenangan user');
    throw error;
  }
}
