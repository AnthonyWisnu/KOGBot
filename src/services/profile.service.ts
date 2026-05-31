import { env } from '../config/env.js';
import { prisma } from '../database/prisma.js';
import { isOwner } from '../bot/permissions.js';
import { getDownloadLimitStatus } from './downloadLimit.service.js';
import { getDisplayWeeklyScore, getWeekStartJakarta } from './score.service.js';
import { getOrCreateUserStats } from './userStats.service.js';
import { normalizeJid } from '../utils/jid.js';
import { logger } from '../utils/logger.js';
import { getUserNumberLabel } from '../utils/userDisplay.js';

export type UserProfile = {
  userJid: string;
  displayName: string;
  points: number;
  limit: number;
  rank: number | 'Owner' | undefined;
  gamesWon: number;
};

export async function getUserProfile(params: {
  userJid: string;
  groupJid: string;
  now?: Date;
  pushName?: string;
  participantName?: string;
}): Promise<UserProfile> {
  try {
    const userJid = normalizeJid(params.userJid);
    const normalizedParams = { ...params, userJid };
    const preferredName = getPreferredName(params.pushName, params.participantName);
    const user = await prisma.user.upsert({
      where: {
        jid: userJid,
      },
      create: {
        jid: userJid,
        name: preferredName,
      },
      update: preferredName
        ? {
            name: preferredName,
          }
        : {},
    });
    const [points, limitStatus, stats] = await Promise.all([
      getDisplayWeeklyScore(normalizedParams),
      getDownloadLimitStatus(normalizedParams),
      getOrCreateUserStats(normalizedParams),
    ]);
    const owner = isOwner(userJid);

    return {
      userJid,
      displayName: preferredName ?? user.name ?? getUserNumberLabel(userJid),
      points,
      limit: limitStatus.limit,
      rank: owner ? 'Owner' : await getUserRank(normalizedParams, points),
      gamesWon: owner ? 999 : stats.gamesWon,
    };
  } catch (error) {
    logger.error({ error, params }, 'Gagal mengambil profil user');
    throw error;
  }
}

function getPreferredName(
  pushName: string | undefined,
  participantName: string | undefined,
): string | undefined {
  return [pushName, participantName]
    .map((name) => name?.trim())
    .find((name): name is string => Boolean(name));
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
