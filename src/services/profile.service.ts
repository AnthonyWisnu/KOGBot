import { env } from '../config/env.js';
import { prisma } from '../database/prisma.js';
import { isOwner } from '../bot/permissions.js';
import { getDownloadLimitStatus } from './downloadLimit.service.js';
import { getDisplayWeeklyScore, getWeekStartJakarta } from './score.service.js';
import { getOrCreateUserStats } from './userStats.service.js';
import { logger } from '../utils/logger.js';

export type UserProfile = {
  userJid: string;
  points: number;
  limit: number;
  rank: number | 'Owner' | undefined;
  gamesWon: number;
};

export async function getUserProfile(params: {
  userJid: string;
  groupJid: string;
  now?: Date;
}): Promise<UserProfile> {
  try {
    const [points, limitStatus, stats] = await Promise.all([
      getDisplayWeeklyScore(params),
      getDownloadLimitStatus(params),
      getOrCreateUserStats(params),
    ]);

    return {
      userJid: params.userJid,
      points,
      limit: limitStatus.limit,
      rank: isOwner(params.userJid) ? 'Owner' : await getUserRank(params, points),
      gamesWon: stats.gamesWon,
    };
  } catch (error) {
    logger.error({ error, params }, 'Gagal mengambil profil user');
    throw error;
  }
}

async function getUserRank(
  params: {
    userJid: string;
    groupJid: string;
    now?: Date;
  },
  points: number,
): Promise<number | undefined> {
  if (points <= 0) {
    return undefined;
  }

  const ownerJid = `${env.OWNER_NUMBER}@s.whatsapp.net`;
  const weekStart = getWeekStartJakarta(params.now ?? new Date());
  const usersAbove = await prisma.weeklyScore.count({
    where: {
      groupJid: params.groupJid,
      weekStart,
      score: {
        gt: points,
      },
      NOT: {
        userJid: ownerJid,
      },
    },
  });

  return usersAbove + 2;
}
