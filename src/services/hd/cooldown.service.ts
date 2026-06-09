import { isOwner } from '../../bot/permissions.js';

const cooldownByKey = new Map<string, number>();

export type CooldownResult =
  | {
      allowed: true;
    }
  | {
      allowed: false;
      remainingMs: number;
    };

export function checkUserCooldown(params: {
  keyPrefix: string;
  userJid: string;
  durationMs: number;
  now?: Date;
}): CooldownResult {
  if (isOwner(params.userJid)) {
    return {
      allowed: true,
    };
  }

  const nowMs = params.now?.getTime() ?? Date.now();
  const key = `${params.keyPrefix}:${params.userJid}`;
  const availableAt = cooldownByKey.get(key) ?? 0;

  if (availableAt > nowMs) {
    return {
      allowed: false,
      remainingMs: availableAt - nowMs,
    };
  }

  cooldownByKey.set(key, nowMs + params.durationMs);

  return {
    allowed: true,
  };
}

export function clearCooldowns(): void {
  cooldownByKey.clear();
}
