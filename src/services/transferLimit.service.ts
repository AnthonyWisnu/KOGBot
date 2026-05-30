import { prisma } from '../database/prisma.js';
import { isOwner } from '../bot/permissions.js';
import { isSameUserJid } from '../utils/jid.js';
import { logger } from '../utils/logger.js';
import { addDownloadLimit } from './downloadLimit.service.js';

const defaultDownloadLimit = 3;

export type TransferLimitResult =
  | {
      status: 'success';
      transferred: number;
      senderLimit: number | 'unlimited';
      recipientLimit: number;
    }
  | {
      status: 'same_user';
    }
  | {
      status: 'insufficient_limit';
      currentLimit: number;
    };

export async function transferDownloadLimit(params: {
  senderJid: string;
  recipientJid: string;
  groupJid: string;
  amount: number;
}): Promise<TransferLimitResult> {
  try {
    if (isSameUserJid(params.senderJid, params.recipientJid)) {
      return {
        status: 'same_user',
      };
    }

    if (isOwner(params.senderJid)) {
      const recipientLimit = await addDownloadLimit({
        userJid: params.recipientJid,
        groupJid: params.groupJid,
        amount: params.amount,
      });

      return {
        status: 'success',
        transferred: params.amount,
        senderLimit: 'unlimited',
        recipientLimit,
      };
    }

    const result = await prisma.$transaction(async (transaction) => {
      await transaction.userDownloadLimit.upsert({
        where: {
          userJid_groupJid: {
            userJid: params.senderJid,
            groupJid: params.groupJid,
          },
        },
        create: {
          userJid: params.senderJid,
          groupJid: params.groupJid,
          limit: defaultDownloadLimit,
        },
        update: {},
      });

      const debited = await transaction.userDownloadLimit.updateMany({
        where: {
          userJid: params.senderJid,
          groupJid: params.groupJid,
          limit: {
            gte: params.amount,
          },
        },
        data: {
          limit: {
            decrement: params.amount,
          },
        },
      });

      if (debited.count === 0) {
        const senderLimit = await transaction.userDownloadLimit.findUnique({
          where: {
            userJid_groupJid: {
              userJid: params.senderJid,
              groupJid: params.groupJid,
            },
          },
          select: {
            limit: true,
          },
        });

        return {
          status: 'insufficient_limit' as const,
          currentLimit: senderLimit?.limit ?? 0,
        };
      }

      const [senderLimit, recipientLimit] = await Promise.all([
        transaction.userDownloadLimit.findUniqueOrThrow({
          where: {
            userJid_groupJid: {
              userJid: params.senderJid,
              groupJid: params.groupJid,
            },
          },
          select: {
            limit: true,
          },
        }),
        transaction.userDownloadLimit.upsert({
          where: {
            userJid_groupJid: {
              userJid: params.recipientJid,
              groupJid: params.groupJid,
            },
          },
          create: {
            userJid: params.recipientJid,
            groupJid: params.groupJid,
            limit: defaultDownloadLimit + params.amount,
          },
          update: {
            limit: {
              increment: params.amount,
            },
          },
          select: {
            limit: true,
          },
        }),
      ]);

      return {
        status: 'success' as const,
        transferred: params.amount,
        senderLimit: senderLimit.limit,
        recipientLimit: recipientLimit.limit,
      };
    });

    return result;
  } catch (error) {
    logger.error({ error, params }, 'Gagal transfer limit download');
    throw error;
  }
}
