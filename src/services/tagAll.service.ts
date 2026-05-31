import type {
  WAMessage,
  WASocket,
} from '@whiskeysockets/baileys';

import { isOwner } from '../bot/permissions.js';
import { formatMention } from '../utils/format.js';
import {
  findBotParticipant,
  findGroupParticipant,
  getParticipantIdentityJid,
  isGroupParticipantAdmin,
  isSameGroupParticipant,
} from '../utils/groupMetadata.js';

const tagAllCooldownMs = 10 * 60 * 1000;
const maximumMentions = 100;
const tagAllCooldowns = new Map<string, number>();

export type TagAllResult =
  | { status: 'success'; mentionCount: number }
  | { status: 'actor_not_allowed' }
  | { status: 'cooldown'; remainingMs: number };

export async function sendTagAllAnnouncement(params: {
  socket: WASocket;
  groupJid: string;
  actorJid: string;
  message: string;
  quoted?: WAMessage;
  now?: Date;
}): Promise<TagAllResult> {
  const now = params.now ?? new Date();
  const remainingMs = getTagAllRemainingCooldown(params.groupJid, now);

  if (remainingMs > 0) {
    return {
      status: 'cooldown',
      remainingMs,
    };
  }

  const metadata = await params.socket.groupMetadata(params.groupJid);
  const actor = findGroupParticipant(metadata, params.actorJid);
  const actorIdentityJid = actor
    ? getParticipantIdentityJid(actor)
    : params.actorJid;
  const actorIsOwner = isOwner(actorIdentityJid);

  if (!actorIsOwner && !isGroupParticipantAdmin(actor)) {
    return { status: 'actor_not_allowed' };
  }

  const bot = findBotParticipant(metadata, params.socket);
  const participantJids = metadata.participants
    .filter((participant) => !isSameGroupParticipant(participant, bot))
    .map(getParticipantIdentityJid);
  const mentions = buildUniqueMentions(actorIdentityJid, participantJids);

  await params.socket.sendMessage(
    params.groupJid,
    {
      text: [
        '\u{1F4E2} *Pengumuman Grup*',
        '',
        params.message,
        '',
        `Dikirim oleh ${formatMention(actorIdentityJid)}`,
      ].join('\n'),
      mentions,
    },
    params.quoted ? { quoted: params.quoted } : undefined,
  );

  tagAllCooldowns.set(params.groupJid, now.getTime() + tagAllCooldownMs);

  return {
    status: 'success',
    mentionCount: mentions.length,
  };
}

export function formatTagAllRemainingMinutes(remainingMs: number): number {
  return Math.max(1, Math.ceil(remainingMs / (60 * 1000)));
}

export function clearTagAllCooldowns(): void {
  tagAllCooldowns.clear();
}

function getTagAllRemainingCooldown(groupJid: string, now: Date): number {
  const cooldownUntil = tagAllCooldowns.get(groupJid);

  if (!cooldownUntil) {
    return 0;
  }

  return Math.max(0, cooldownUntil - now.getTime());
}

function buildUniqueMentions(actorJid: string, participantJids: string[]): string[] {
  return [...new Set([actorJid, ...participantJids])].slice(0, maximumMentions);
}
