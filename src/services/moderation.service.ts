import type { WASocket } from '@whiskeysockets/baileys';

import { isOwner } from '../bot/permissions.js';
import {
  findBotParticipant,
  findGroupParticipant,
  getParticipantActionJid,
  getParticipantIdentityJid,
  isGroupParticipantAdmin,
  isSameGroupParticipant,
} from '../utils/groupMetadata.js';

type ModerationAction = 'kick' | 'promote' | 'demote';

export type ModerationResult =
  | { status: 'success'; targetJid: string }
  | {
    status:
      | 'actor_not_allowed'
      | 'bot_not_admin'
      | 'target_not_found'
      | 'target_owner'
      | 'target_bot'
      | 'target_self'
      | 'target_admin'
      | 'target_not_admin'
      | 'owner_only';
  };

export async function kickGroupParticipant(params: {
  socket: WASocket;
  groupJid: string;
  actorJid: string;
  targetJid: string;
}): Promise<ModerationResult> {
  return await runModerationAction({ ...params, action: 'kick' });
}

export async function promoteGroupParticipant(params: {
  socket: WASocket;
  groupJid: string;
  actorJid: string;
  targetJid: string;
}): Promise<ModerationResult> {
  return await runModerationAction({ ...params, action: 'promote' });
}

export async function demoteGroupParticipant(params: {
  socket: WASocket;
  groupJid: string;
  actorJid: string;
  targetJid: string;
}): Promise<ModerationResult> {
  return await runModerationAction({ ...params, action: 'demote' });
}

async function runModerationAction(params: {
  socket: WASocket;
  groupJid: string;
  actorJid: string;
  targetJid: string;
  action: ModerationAction;
}): Promise<ModerationResult> {
  const metadata = await params.socket.groupMetadata(params.groupJid);
  const actor = findGroupParticipant(metadata, params.actorJid);
  const target = findGroupParticipant(metadata, params.targetJid);
  const bot = findBotParticipant(metadata, params.socket);
  const actorIsOwner = isOwner(actor ? getParticipantIdentityJid(actor) : params.actorJid);
  const actorIsAdmin = isGroupParticipantAdmin(actor);

  if (!isGroupParticipantAdmin(bot)) {
    return { status: 'bot_not_admin' };
  }

  if (!actorIsOwner && !actorIsAdmin) {
    return { status: 'actor_not_allowed' };
  }

  if (params.action === 'demote' && !actorIsOwner) {
    return { status: 'owner_only' };
  }

  if (!target) {
    return { status: 'target_not_found' };
  }

  const targetIsOwner = isOwner(getParticipantIdentityJid(target));
  const targetIsAdmin = isGroupParticipantAdmin(target);

  if (targetIsOwner) {
    return { status: 'target_owner' };
  }

  if (isSameGroupParticipant(target, bot)) {
    return { status: 'target_bot' };
  }

  if (isSameGroupParticipant(target, actor)) {
    return { status: 'target_self' };
  }

  if (params.action === 'kick' && !actorIsOwner && targetIsAdmin) {
    return { status: 'target_admin' };
  }

  if (params.action === 'promote' && targetIsAdmin) {
    return { status: 'target_admin' };
  }

  if (params.action === 'demote' && !targetIsAdmin) {
    return { status: 'target_not_admin' };
  }

  const targetActionJid = getParticipantActionJid(target);
  const baileysAction = params.action === 'kick' ? 'remove' : params.action;

  await params.socket.groupParticipantsUpdate(
    params.groupJid,
    [targetActionJid],
    baileysAction,
  );

  return {
    status: 'success',
    targetJid: targetActionJid,
  };
}
