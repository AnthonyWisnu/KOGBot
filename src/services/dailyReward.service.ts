import { prisma } from '../database/prisma.js';
import { normalizeJid } from '../utils/jid.js';
import { logger } from '../utils/logger.js';
import { addDownloadLimit } from './downloadLimit.service.js';
import { addWeeklyScore } from './score.service.js';

const claimCooldownMs = 24 * 60 * 60 * 1000;

type DailyReward =
  | {
      type: 'points';
      amount: number;
    }
  | {
      type: 'limit';
      amount: number;
    };

export type DailyRewardResult =
  | {
      status: 'claimed';
      reward: DailyReward;
    }
  | {
      status: 'cooldown';
      remainingMs: number;
    };

const rewards: DailyReward[] = [
  { type: 'points', amount: 5 },
  { type: 'points', amount: 10 },
  { type: 'points', amount: 15 },
  { type: 'limit', amount: 1 },
  { type: 'limit', amount: 2 },
];

export async function claimDailyReward(params: {
  userJid: string;
  groupJid: string;
  now?: Date;
}): Promise<DailyRewardResult> {
  try {
    const userJid = normalizeJid(params.userJid);
    const now = params.now ?? new Date();
    const stats = await prisma.userStats.upsert({
      where: {
        userJid_groupJid: {
          userJid,
          groupJid: params.groupJid,
        },
      },
      create: {
        userJid,
        groupJid: params.groupJid,
      },
      update: {},
    });

    if (stats.lastDailyClaim) {
      const nextClaimTime = stats.lastDailyClaim.getTime() + claimCooldownMs;

      if (now.getTime() < nextClaimTime) {
        return {
          status: 'cooldown',
          remainingMs: nextClaimTime - now.getTime(),
        };
      }
    }

    const reward = pickDailyReward();

    await prisma.userStats.update({
      where: {
        userJid_groupJid: {
          userJid,
          groupJid: params.groupJid,
        },
      },
      data: {
        lastDailyClaim: now,
      },
    });

    if (reward.type === 'points') {
      await addWeeklyScore({
        userJid,
        groupJid: params.groupJid,
        points: reward.amount,
        now,
      });
    } else {
      await addDownloadLimit({
        userJid,
        groupJid: params.groupJid,
        amount: reward.amount,
      });
    }

    return {
      status: 'claimed',
      reward,
    };
  } catch (error) {
    logger.error({ error, params }, 'Gagal claim daily reward');
    throw error;
  }
}

export function formatRemainingDailyTime(remainingMs: number): string {
  const totalMinutes = Math.ceil(remainingMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours <= 0) {
    return `${minutes} menit`;
  }

  if (minutes <= 0) {
    return `${hours} jam`;
  }

  return `${hours} jam ${minutes} menit`;
}

function pickDailyReward(): DailyReward {
  const fallbackReward = rewards[0];

  if (!fallbackReward) {
    throw new Error('Daily reward belum dikonfigurasi');
  }

  return rewards[Math.floor(Math.random() * rewards.length)] ?? fallbackReward;
}
