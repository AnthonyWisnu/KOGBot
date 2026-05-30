import { resetGroupScores } from './score.service.js';
import { logger } from '../utils/logger.js';

const resetConfirmationTtlMs = 30_000;

type PendingResetPoint = {
  groupJid: string;
  requestedBy: string;
  expiresAt: number;
};

const pendingResetPoints = new Map<string, PendingResetPoint>();

export type ConfirmResetPointResult =
  | {
      status: 'confirmed';
      deletedCount: number;
    }
  | {
      status: 'not_found';
    }
  | {
      status: 'expired';
    };

export function requestResetPoint(params: {
  groupJid: string;
  requestedBy: string;
  now?: Date;
}): Date {
  const nowMs = params.now?.getTime() ?? Date.now();
  const expiresAt = nowMs + resetConfirmationTtlMs;

  pendingResetPoints.set(createPendingKey(params.groupJid, params.requestedBy), {
    groupJid: params.groupJid,
    requestedBy: params.requestedBy,
    expiresAt,
  });

  return new Date(expiresAt);
}

export async function confirmResetPoint(params: {
  groupJid: string;
  requestedBy: string;
  now?: Date;
}): Promise<ConfirmResetPointResult> {
  try {
    const key = createPendingKey(params.groupJid, params.requestedBy);
    const pending = pendingResetPoints.get(key);

    if (!pending) {
      return {
        status: 'not_found',
      };
    }

    const nowMs = params.now?.getTime() ?? Date.now();

    if (pending.expiresAt < nowMs) {
      pendingResetPoints.delete(key);

      return {
        status: 'expired',
      };
    }

    pendingResetPoints.delete(key);

    return {
      status: 'confirmed',
      deletedCount: await resetGroupScores(params.groupJid),
    };
  } catch (error) {
    logger.error({ error, params }, 'Gagal konfirmasi reset poin');
    throw error;
  }
}

function createPendingKey(groupJid: string, requestedBy: string): string {
  return `${groupJid}:${requestedBy}`;
}
