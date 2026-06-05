import type { WeeklyScore } from '@prisma/client';

import { prisma } from '../database/prisma.js';
import { env } from '../config/env.js';
import { isOwner } from '../bot/permissions.js';
import { normalizeJid } from '../utils/jid.js';
import { logger } from '../utils/logger.js';

const jakartaOffsetMs = 7 * 60 * 60 * 1000;
const ownerDisplayScore = 999;

export type LeaderboardEntry = {
  userJid: string;
  score: number;
};

export async function addWeeklyScore(params: {
  userJid: string;
  groupJid: string;
  points: number;
  now?: Date;
}): Promise<WeeklyScore> {
  try {
    const userJid = normalizeJid(params.userJid);
    const weekStart = getWeekStartJakarta(params.now ?? new Date());

    return await prisma.weeklyScore.upsert({
      where: {
        userJid_groupJid_weekStart: {
          userJid,
          groupJid: params.groupJid,
          weekStart,
        },
      },
      create: {
        userJid,
        groupJid: params.groupJid,
        score: params.points,
        weekStart,
      },
      update: {
        score: {
          increment: params.points,
        },
      },
    });
  } catch (error) {
    logger.error({ error, params }, 'Gagal menambah poin mingguan');
    throw error;
  }
}

export async function getWeeklyScore(params: {
  userJid: string;
  groupJid: string;
  now?: Date;
}): Promise<number> {
  try {
    const userJid = normalizeJid(params.userJid);
    const weekStart = getWeekStartJakarta(params.now ?? new Date());
    const score = await prisma.weeklyScore.findUnique({
      where: {
        userJid_groupJid_weekStart: {
          userJid,
          groupJid: params.groupJid,
          weekStart,
        },
      },
      select: {
        score: true,
      },
    });

    return score?.score ?? 0;
  } catch (error) {
    logger.error({ error, params }, 'Gagal mengambil poin mingguan');
    throw error;
  }
}

export async function getTotalWeeklyScore(params: {
  userJid: string;
  now?: Date;
  excludeGroupJids?: string[];
}): Promise<number> {
  try {
    const userJid = normalizeJid(params.userJid);
    const weekStart = getWeekStartJakarta(params.now ?? new Date());
    const result = await prisma.weeklyScore.aggregate({
      where: {
        userJid,
        weekStart,
        groupJid: params.excludeGroupJids?.length
          ? {
              notIn: params.excludeGroupJids,
            }
          : undefined,
      },
      _sum: {
        score: true,
      },
    });

    return result._sum.score ?? 0;
  } catch (error) {
    logger.error({ error, params }, 'Gagal mengambil total poin mingguan');
    throw error;
  }
}

export async function getDisplayWeeklyScore(params: {
  userJid: string;
  groupJid: string;
  now?: Date;
}): Promise<number> {
  const userJid = normalizeJid(params.userJid);

  if (isOwner(userJid)) {
    return ownerDisplayScore;
  }

  return await getWeeklyScore({ ...params, userJid });
}

export async function spendWeeklyScore(params: {
  userJid: string;
  groupJid: string;
  points: number;
  now?: Date;
}): Promise<boolean> {
  try {
    const userJid = normalizeJid(params.userJid);
    const weekStart = getWeekStartJakarta(params.now ?? new Date());
    const result = await prisma.weeklyScore.updateMany({
      where: {
        userJid,
        groupJid: params.groupJid,
        weekStart,
        score: {
          gte: params.points,
        },
      },
      data: {
        score: {
          decrement: params.points,
        },
      },
    });

    return result.count > 0;
  } catch (error) {
    logger.error({ error, params }, 'Gagal memakai poin mingguan');
    throw error;
  }
}

export async function getWeeklyLeaderboard(params: {
  groupJid: string;
  limit?: number;
  now?: Date;
}): Promise<LeaderboardEntry[]> {
  try {
    const weekStart = getWeekStartJakarta(params.now ?? new Date());
    const scores = await prisma.weeklyScore.findMany({
      where: {
        groupJid: params.groupJid,
        weekStart,
        score: {
          gt: 0,
        },
      },
      orderBy: [
        {
          score: 'desc',
        },
        {
          updatedAt: 'asc',
        },
      ],
      take: params.limit ?? 10,
      select: {
        userJid: true,
        score: true,
      },
    });

    return scores;
  } catch (error) {
    logger.error({ error, params }, 'Gagal mengambil leaderboard mingguan');
    throw error;
  }
}

export async function getDisplayWeeklyLeaderboard(params: {
  groupJid: string;
  limit?: number;
  now?: Date;
}): Promise<LeaderboardEntry[]> {
  const ownerJid = `${env.OWNER_NUMBER}@s.whatsapp.net`;
  const leaderboard = await getWeeklyLeaderboard({
    ...params,
    limit: params.limit ? params.limit + 1 : 11,
  });
  const withoutOwner = leaderboard.filter((entry) => !isOwner(entry.userJid));
  const entries = [
    {
      userJid: ownerJid,
      score: ownerDisplayScore,
    },
    ...withoutOwner,
  ];

  return entries.slice(0, params.limit ?? 10);
}

export async function resetGroupScores(groupJid: string): Promise<number> {
  try {
    const result = await prisma.weeklyScore.deleteMany({
      where: {
        groupJid,
      },
    });

    return result.count;
  } catch (error) {
    logger.error({ error, groupJid }, 'Gagal reset poin grup');
    throw error;
  }
}

export function getWeekStartJakarta(date: Date): Date {
  const jakartaTime = new Date(date.getTime() + jakartaOffsetMs);
  const day = jakartaTime.getUTCDay();
  const daysSinceMonday = day === 0 ? 6 : day - 1;
  const mondayJakartaMs = Date.UTC(
    jakartaTime.getUTCFullYear(),
    jakartaTime.getUTCMonth(),
    jakartaTime.getUTCDate() - daysSinceMonday,
    0,
    0,
    0,
    0,
  );

  return new Date(mondayJakartaMs - jakartaOffsetMs);
}
