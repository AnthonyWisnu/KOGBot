import type { WASocket } from '@whiskeysockets/baileys';

import { isOwner } from '../bot/permissions.js';
import {
  findBotParticipant,
  findGroupParticipant,
  getParticipantIdentityJid,
  isGroupParticipantAdmin,
} from '../utils/groupMetadata.js';
import { logger } from '../utils/logger.js';
import type { QuotedMessageReference } from '../utils/quotedMessage.js';

export type DeleteMessageResult =
  | { status: 'success' }
  | {
    status:
      | 'actor_not_allowed'
      | 'bot_not_admin'
      | 'target_not_found'
      | 'target_owner';
  };

export async function deleteGroupMessage(params: {
  socket: WASocket;
  groupJid: string;
  actorJid: string;
  quotedMessage: QuotedMessageReference;
}): Promise<DeleteMessageResult> {
  try {
    const metadata = await params.socket.groupMetadata(params.groupJid);
    const actor = findGroupParticipant(metadata, params.actorJid);
    const target = findGroupParticipant(
      metadata,
      params.quotedMessage.participantJid,
    );
    const actorIdentityJid = actor
      ? getParticipantIdentityJid(actor)
      : params.actorJid;
    const actorIsOwner = isOwner(actorIdentityJid);

    if (!actorIsOwner && !isGroupParticipantAdmin(actor)) {
      return { status: 'actor_not_allowed' };
    }

    if (!isGroupParticipantAdmin(findBotParticipant(metadata, params.socket))) {
      return { status: 'bot_not_admin' };
    }

    if (!target) {
      return { status: 'target_not_found' };
    }

    if (!actorIsOwner && isOwner(getParticipantIdentityJid(target))) {
      return { status: 'target_owner' };
    }

    await params.socket.sendMessage(params.groupJid, {
      delete: {
        remoteJid: params.groupJid,
        id: params.quotedMessage.messageId,
        participant: params.quotedMessage.participantJid,
        fromMe: false,
      },
    });

    return { status: 'success' };
  } catch (error) {
    logger.error(
      {
        error,
        groupJid: params.groupJid,
        actorJid: params.actorJid,
        messageId: params.quotedMessage.messageId,
      },
      'Gagal menghapus pesan grup',
    );
    throw error;
  }
}
