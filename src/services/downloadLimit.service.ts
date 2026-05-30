import type { UserDownloadLimit } from '@prisma/client';

import { prisma } from '../database/prisma.js';
import { isOwner } from '../bot/permissions.js';
import { logger } from '../utils/logger.js';
import {
  getDisplayWeeklyScore,
  getWeekStartJakarta,
  getWeeklyScore,
} from './score.service.js';

const defaultDownloadLimit = 3;
const pointsPerDownloadLimit = 10;
const ownerDisplayLimit = 999;

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

export async function getDownloadLimitStatus(params: {
  userJid: string;
  groupJid: string;
}): Promise<DownloadLimitStatus> {
  try {
    if (isOwner(params.userJid)) {
      return {
        limit: ownerDisplayLimit,
        points: await getDisplayWeeklyScore(params),
      };
    }

    const [limit, points] = await Promise.all([
      getOrCreateDownloadLimit(params),
      getWeeklyScore(params),
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
    if (isOwner(params.userJid)) {
      return {
        status: 'owner_unlimited',
      };
    }

    const requiredPoints = params.amount * pointsPerDownloadLimit;
    const currentPoints = await getWeeklyScore(params);

    if (currentPoints < requiredPoints) {
      return {
        status: 'insufficient_points',
        requiredPoints,
        currentPoints,
      };
    }

    const weekStart = getWeekStartJakarta(new Date());
    const currentLimit = await prisma.$transaction(async (transaction) => {
      const spent = await transaction.weeklyScore.updateMany({
        where: {
          userJid: params.userJid,
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
            userJid: params.userJid,
            groupJid: params.groupJid,
          },
        },
        create: {
          userJid: params.userJid,
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
      return {
        status: 'insufficient_points',
        requiredPoints,
        currentPoints: await getWeeklyScore(params),
      };
    }

    const remainingPoints = await getWeeklyScore(params);

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
    if (isOwner(params.userJid)) {
      return true;
    }

    await getOrCreateDownloadLimit(params);
    const result = await prisma.userDownloadLimit.updateMany({
      where: {
        userJid: params.userJid,
        groupJid: params.groupJid,
        limit: {
          gt: 0,
        },
      },
      data: {
        limit: {
          decrement: 1,
        },
      },
    });

    return result.count > 0;
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
    if (isOwner(params.userJid)) {
      return;
    }

    await addDownloadLimit({
      userJid: params.userJid,
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

async function getOrCreateDownloadLimit(params: {
  userJid: string;
  groupJid: string;
}): Promise<UserDownloadLimit> {
  return await prisma.userDownloadLimit.upsert({
    where: {
      userJid_groupJid: {
        userJid: params.userJid,
        groupJid: params.groupJid,
      },
    },
    create: {
      userJid: params.userJid,
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
  if (isOwner(params.userJid)) {
    return ownerDisplayLimit;
  }

  const limit = await prisma.userDownloadLimit.upsert({
    where: {
      userJid_groupJid: {
        userJid: params.userJid,
        groupJid: params.groupJid,
      },
    },
    create: {
      userJid: params.userJid,
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
  if (isOwner(params.userJid)) {
    return ownerDisplayLimit;
  }

  const limit = await prisma.userDownloadLimit.upsert({
    where: {
      userJid_groupJid: {
        userJid: params.userJid,
        groupJid: params.groupJid,
      },
    },
    create: {
      userJid: params.userJid,
      groupJid: params.groupJid,
      limit: defaultDownloadLimit,
    },
    update: {
      limit: defaultDownloadLimit,
    },
  });

  return limit.limit;
}
