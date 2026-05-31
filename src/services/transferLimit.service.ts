import { prisma } from '../database/prisma.js';
import { isOwner } from '../bot/permissions.js';
import { normalizeJid } from '../utils/jid.js';
import { logger } from '../utils/logger.js';
import { addDownloadLimit } from './downloadLimit.service.js';

const defaultDownloadLimit = 1;

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
    const senderJid = normalizeJid(params.senderJid);
    const recipientJid = normalizeJid(params.recipientJid);

    if (senderJid === recipientJid) {
      return {
        status: 'same_user',
      };
    }

    if (isOwner(senderJid)) {
      const recipientLimit = await addDownloadLimit({
        userJid: recipientJid,
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
            userJid: senderJid,
            groupJid: params.groupJid,
          },
        },
        create: {
          userJid: senderJid,
          groupJid: params.groupJid,
          limit: defaultDownloadLimit,
        },
        update: {},
      });

      const debited = await transaction.userDownloadLimit.updateMany({
        where: {
          userJid: senderJid,
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
              userJid: senderJid,
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
              userJid: senderJid,
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
              userJid: recipientJid,
              groupJid: params.groupJid,
            },
          },
          create: {
            userJid: recipientJid,
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
