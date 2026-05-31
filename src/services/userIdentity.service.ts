import type {
  GroupMetadata,
  GroupParticipant,
  WASocket,
} from '@whiskeysockets/baileys';

import { prisma } from '../database/prisma.js';
import {
  normalizeJid,
  registerLidMapping,
} from '../utils/jid.js';
import { logger } from '../utils/logger.js';

const mergedLidJids = new Set<string>();

export async function resolveGroupUserJid(params: {
  socket: WASocket;
  groupJid: string;
  userJid: string;
}): Promise<string> {
  if (!params.userJid.endsWith('@lid')) {
    return normalizeJid(params.userJid);
  }

  const metadata = await params.socket.groupMetadata(params.groupJid);

  await reconcileGroupUserIdentities(metadata);

  return normalizeJid(params.userJid);
}

export async function reconcileGroupUserIdentities(metadata: GroupMetadata): Promise<void> {
  for (const participant of metadata.participants) {
    const mapping = getParticipantLidMapping(participant);

    if (!mapping) {
      continue;
    }

    registerLidMapping(mapping.lidJid, mapping.phoneJid);

    if (mergedLidJids.has(mapping.lidJid)) {
      continue;
    }

    await mergeLegacyLidUserRecords(mapping);
    mergedLidJids.add(mapping.lidJid);
  }
}

export async function reconcileAllGroupUserIdentities(socket: WASocket): Promise<void> {
  try {
    const groups = await socket.groupFetchAllParticipating();

    for (const metadata of Object.values(groups)) {
      await reconcileGroupUserIdentities(metadata);
    }
  } catch (error) {
    logger.warn({ error }, 'Gagal rekonsiliasi seluruh identitas user grup');
  }
}

export async function mergeLegacyLidUserRecords(params: {
  lidJid: string;
  phoneJid: string;
}): Promise<void> {
  const normalizedPhoneJid = normalizeJid(params.phoneJid);

  if (!params.lidJid.endsWith('@lid') || params.lidJid === normalizedPhoneJid) {
    return;
  }

  await prisma.$transaction(async (transaction) => {
    const legacyScores = await transaction.weeklyScore.findMany({
      where: {
        userJid: params.lidJid,
      },
    });

    for (const score of legacyScores) {
      await transaction.weeklyScore.upsert({
        where: {
          userJid_groupJid_weekStart: {
            userJid: normalizedPhoneJid,
            groupJid: score.groupJid,
            weekStart: score.weekStart,
          },
        },
        create: {
          userJid: normalizedPhoneJid,
          groupJid: score.groupJid,
          weekStart: score.weekStart,
          score: score.score,
        },
        update: {
          score: {
            increment: score.score,
          },
        },
      });
    }

    await transaction.weeklyScore.deleteMany({
      where: {
        userJid: params.lidJid,
      },
    });

    const legacyLimits = await transaction.userDownloadLimit.findMany({
      where: {
        userJid: params.lidJid,
      },
    });

    for (const limit of legacyLimits) {
      const currentLimit = await transaction.userDownloadLimit.findUnique({
        where: {
          userJid_groupJid: {
            userJid: normalizedPhoneJid,
            groupJid: limit.groupJid,
          },
        },
      });

      await transaction.userDownloadLimit.upsert({
        where: {
          userJid_groupJid: {
            userJid: normalizedPhoneJid,
            groupJid: limit.groupJid,
          },
        },
        create: {
          userJid: normalizedPhoneJid,
          groupJid: limit.groupJid,
          limit: limit.limit,
        },
        update: {
          limit: Math.max(currentLimit?.limit ?? 0, limit.limit),
        },
      });
    }

    await transaction.userDownloadLimit.deleteMany({
      where: {
        userJid: params.lidJid,
      },
    });

    const legacyStats = await transaction.userStats.findMany({
      where: {
        userJid: params.lidJid,
      },
    });

    for (const stats of legacyStats) {
      const currentStats = await transaction.userStats.findUnique({
        where: {
          userJid_groupJid: {
            userJid: normalizedPhoneJid,
            groupJid: stats.groupJid,
          },
        },
      });

      await transaction.userStats.upsert({
        where: {
          userJid_groupJid: {
            userJid: normalizedPhoneJid,
            groupJid: stats.groupJid,
          },
        },
        create: {
          userJid: normalizedPhoneJid,
          groupJid: stats.groupJid,
          gamesWon: stats.gamesWon,
          lastDailyClaim: stats.lastDailyClaim,
        },
        update: {
          gamesWon: (currentStats?.gamesWon ?? 0) + stats.gamesWon,
          lastDailyClaim: getLatestDate(currentStats?.lastDailyClaim, stats.lastDailyClaim),
        },
      });
    }

    await transaction.userStats.deleteMany({
      where: {
        userJid: params.lidJid,
      },
    });

    const legacyUser = await transaction.user.findUnique({
      where: {
        jid: params.lidJid,
      },
    });

    if (legacyUser) {
      await transaction.user.upsert({
        where: {
          jid: normalizedPhoneJid,
        },
        create: {
          jid: normalizedPhoneJid,
          name: legacyUser.name,
        },
        update: legacyUser.name
          ? {
              name: legacyUser.name,
            }
          : {},
      });

      await transaction.user.delete({
        where: {
          jid: params.lidJid,
        },
      });
    }

    await transaction.activeGame.updateMany({
      where: {
        startedBy: params.lidJid,
      },
      data: {
        startedBy: normalizedPhoneJid,
      },
    });
  });

  logger.info(
    {
      lidJid: params.lidJid,
      phoneJid: normalizedPhoneJid,
    },
    'Data user JID LID berhasil digabungkan',
  );
}

function getParticipantLidMapping(
  participant: GroupParticipant,
): { lidJid: string; phoneJid: string } | undefined {
  const lidJid = [
    participant.lid,
    participant.id,
  ].find((jid) => jid?.endsWith('@lid'));
  const phoneJid = [
    participant.jid,
    participant.id,
  ].find((jid) => jid?.endsWith('@s.whatsapp.net'));

  if (!lidJid || !phoneJid) {
    return undefined;
  }

  return {
    lidJid,
    phoneJid,
  };
}

function getLatestDate(
  firstDate: Date | null | undefined,
  secondDate: Date | null | undefined,
): Date | null {
  if (!firstDate) {
    return secondDate ?? null;
  }

  if (!secondDate) {
    return firstDate;
  }

  return firstDate > secondDate ? firstDate : secondDate;
}
