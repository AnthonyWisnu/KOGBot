import type { Prisma, UserDownloadLimit } from '@prisma/client';

import { prisma } from '../database/prisma.js';
import { isOwner } from '../bot/permissions.js';
import { normalizeJid } from '../utils/jid.js';
import { logger } from '../utils/logger.js';
import {
  getDisplayWeeklyScore,
  getTotalWeeklyScore,
  getWeekStartJakarta,
  getWeeklyScore,
} from './score.service.js';

const defaultDownloadLimit = 1;
const pointsPerDownloadLimit = 100;
const ownerDisplayLimit = 999;
export const privateDownloadLimitScope = 'PRIVATE';

export type DownloadLimitStatus = {
  limit: number;
  points: number;
};

export type BuyDownloadLimitResult =
  | {
      status: 'owner_unlimited';
    }
  | {
      status: 'success';
      boughtLimit: number;
      spentPoints: number;
      remainingPoints: number;
      currentLimit: number;
    }
  | {
      status: 'insufficient_points';
      requiredPoints: number;
      currentPoints: number;
    };

export function getDownloadLimitScope(params: {
  chatJid: string;
  isGroup: boolean;
}): string {
  return params.isGroup ? params.chatJid : privateDownloadLimitScope;
}

export function isPrivateDownloadLimitScope(groupJid: string): boolean {
  return groupJid === privateDownloadLimitScope;
}

export async function getDownloadLimitStatus(params: {
  userJid: string;
  groupJid: string;
}): Promise<DownloadLimitStatus> {
  try {
    const userJid = normalizeJid(params.userJid);
    const normalizedParams = { ...params, userJid };

    if (isOwner(userJid)) {
      return {
        limit: ownerDisplayLimit,
        points: await getDisplayWeeklyScore(normalizedParams),
      };
    }

    const [limit, points] = await Promise.all([
      getOrCreateDownloadLimit(normalizedParams),
      isPrivateDownloadLimitScope(params.groupJid)
        ? getTotalWeeklyScore({
            userJid,
            excludeGroupJids: [privateDownloadLimitScope],
          })
        : getWeeklyScore(normalizedParams),
    ]);

    return {
      limit: limit.limit,
      points,
    };
  } catch (error) {
    logger.error({ error, params }, 'Gagal mengambil limit download');
    throw error;
  }
}

export async function buyDownloadLimit(params: {
  userJid: string;
  groupJid: string;
  amount: number;
}): Promise<BuyDownloadLimitResult> {
  try {
    const userJid = normalizeJid(params.userJid);
    const normalizedParams = { ...params, userJid };

    if (isOwner(userJid)) {
      return {
        status: 'owner_unlimited',
      };
    }

    const requiredPoints = params.amount * pointsPerDownloadLimit;
    const currentPoints = isPrivateDownloadLimitScope(params.groupJid)
      ? await getTotalWeeklyScore({
          userJid,
          excludeGroupJids: [privateDownloadLimitScope],
        })
      : await getWeeklyScore(normalizedParams);

    if (currentPoints < requiredPoints) {
      return {
        status: 'insufficient_points',
        requiredPoints,
        currentPoints,
      };
    }

    const weekStart = getWeekStartJakarta(new Date());
    const currentLimit = await prisma.$transaction(async (transaction) => {
      const spent = isPrivateDownloadLimitScope(params.groupJid)
        ? await spendPrivateWeeklyScores({
            transaction,
            userJid,
            weekStart,
            points: requiredPoints,
          })
        : await transaction.weeklyScore.updateMany({
            where: {
              userJid,
              groupJid: params.groupJid,
              weekStart,
              score: {
                gte: requiredPoints,
              },
            },
            data: {
              score: {
                decrement: requiredPoints,
              },
            },
          });

      if (spent.count === 0) {
        return undefined;
      }

      const limit = await transaction.userDownloadLimit.upsert({
        where: {
          userJid_groupJid: {
            userJid,
            groupJid: params.groupJid,
          },
        },
        create: {
          userJid,
          groupJid: params.groupJid,
          limit: defaultDownloadLimit + params.amount,
        },
        update: {
          limit: {
            increment: params.amount,
          },
        },
      });

      return limit.limit;
    });

    if (currentLimit === undefined) {
      const latestCurrentPoints = isPrivateDownloadLimitScope(params.groupJid)
        ? await getTotalWeeklyScore({
            userJid,
            excludeGroupJids: [privateDownloadLimitScope],
          })
        : await getWeeklyScore(normalizedParams);

      return {
        status: 'insufficient_points',
        requiredPoints,
        currentPoints: latestCurrentPoints,
      };
    }

    const remainingPoints = isPrivateDownloadLimitScope(params.groupJid)
      ? await getTotalWeeklyScore({
          userJid,
          excludeGroupJids: [privateDownloadLimitScope],
        })
      : await getWeeklyScore(normalizedParams);

    return {
      status: 'success',
      boughtLimit: params.amount,
      spentPoints: requiredPoints,
      remainingPoints,
      currentLimit,
    };
  } catch (error) {
    logger.error({ error, params }, 'Gagal membeli limit download');
    throw error;
  }
}

export async function reserveDownloadLimit(params: {
  userJid: string;
  groupJid: string;
}): Promise<boolean> {
  try {
    const userJid = normalizeJid(params.userJid);

    if (isOwner(userJid)) {
      return true;
    }

    const result = await prisma.$transaction(async (transaction) => {
      const current = await transaction.userDownloadLimit.upsert({
        where: {
          userJid_groupJid: {
            userJid,
            groupJid: params.groupJid,
          },
        },
        create: {
          userJid,
          groupJid: params.groupJid,
          limit: defaultDownloadLimit,
        },
        update: {},
        select: {
          limit: true,
        },
      });

      if (current.limit <= 0) {
        return {
          reserved: false,
          currentLimit: current.limit,
        };
      }

      const updated = await transaction.userDownloadLimit.update({
        where: {
          userJid_groupJid: {
            userJid,
            groupJid: params.groupJid,
          },
        },
        data: {
          limit: {
            decrement: 1,
          },
        },
        select: {
          limit: true,
        },
      });

      return {
        reserved: true,
        currentLimit: updated.limit,
      };
    });

    if (!result.reserved) {
      logger.warn(
        {
          userJid,
          groupJid: params.groupJid,
          currentLimit: result.currentLimit,
        },
        'Reserve limit download ditolak karena limit terbaca habis',
      );
    }

    return result.reserved;
  } catch (error) {
    logger.error({ error, params }, 'Gagal memakai limit download');
    throw error;
  }
}

export async function refundDownloadLimit(params: {
  userJid: string;
  groupJid: string;
}): Promise<void> {
  try {
    const userJid = normalizeJid(params.userJid);

    if (isOwner(userJid)) {
      return;
    }

    await addDownloadLimit({
      userJid,
      groupJid: params.groupJid,
      amount: 1,
    });
  } catch (error) {
    logger.error({ error, params }, 'Gagal mengembalikan limit download');
    throw error;
  }
}

export async function refundReservedDownloadLimit(params: {
  userJid: string;
  groupJid: string;
  reserved: boolean;
}): Promise<void> {
  if (!params.reserved) {
    return;
  }

  try {
    await refundDownloadLimit(params);
  } catch (error) {
    logger.error({ error, params }, 'Gagal refund limit download yang sudah direserve');
  }
}

async function spendPrivateWeeklyScores(params: {
  transaction: Prisma.TransactionClient;
  userJid: string;
  weekStart: Date;
  points: number;
}): Promise<{ count: number }> {
  const scores = await params.transaction.weeklyScore.findMany({
    where: {
      userJid: params.userJid,
      weekStart: params.weekStart,
      groupJid: {
        not: privateDownloadLimitScope,
      },
      score: {
        gt: 0,
      },
    },
    orderBy: [
      {
        updatedAt: 'asc',
      },
    ],
    select: {
      id: true,
      score: true,
    },
  });
  const totalScore = scores.reduce((total, score) => total + score.score, 0);

  if (totalScore < params.points) {
    return { count: 0 };
  }

  let remainingPoints = params.points;

  for (const score of scores) {
    if (remainingPoints <= 0) {
      break;
    }

    const pointsToSpend = Math.min(score.score, remainingPoints);

    await params.transaction.weeklyScore.update({
      where: {
        id: score.id,
      },
      data: {
        score: {
          decrement: pointsToSpend,
        },
      },
    });

    remainingPoints -= pointsToSpend;
  }

  return { count: 1 };
}

async function getOrCreateDownloadLimit(params: {
  userJid: string;
  groupJid: string;
}): Promise<UserDownloadLimit> {
  const userJid = normalizeJid(params.userJid);

  return await prisma.userDownloadLimit.upsert({
    where: {
      userJid_groupJid: {
        userJid,
        groupJid: params.groupJid,
      },
    },
    create: {
      userJid,
      groupJid: params.groupJid,
      limit: defaultDownloadLimit,
    },
    update: {},
  });
}

export async function addDownloadLimit(params: {
  userJid: string;
  groupJid: string;
  amount: number;
}): Promise<number> {
  const userJid = normalizeJid(params.userJid);

  if (isOwner(userJid)) {
    return ownerDisplayLimit;
  }

  const limit = await prisma.userDownloadLimit.upsert({
    where: {
      userJid_groupJid: {
        userJid,
        groupJid: params.groupJid,
      },
    },
    create: {
      userJid,
      groupJid: params.groupJid,
      limit: defaultDownloadLimit + params.amount,
    },
    update: {
      limit: {
        increment: params.amount,
      },
    },
  });

  return limit.limit;
}

export async function resetDownloadLimit(params: {
  userJid: string;
  groupJid: string;
}): Promise<number> {
  const userJid = normalizeJid(params.userJid);

  if (isOwner(userJid)) {
    return ownerDisplayLimit;
  }

  const limit = await prisma.userDownloadLimit.upsert({
    where: {
      userJid_groupJid: {
        userJid,
        groupJid: params.groupJid,
      },
    },
    create: {
      userJid,
      groupJid: params.groupJid,
      limit: defaultDownloadLimit,
    },
    update: {
      limit: defaultDownloadLimit,
    },
  });

  return limit.limit;
}
