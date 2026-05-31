import type { BaileysEventMap, WASocket } from '@whiskeysockets/baileys';

import { ensureGroup } from '../services/group.service.js';
import { reconcileGroupUserIdentities } from '../services/userIdentity.service.js';
import {
  buildGoodbyeMessages,
  buildWelcomeMessages,
} from '../services/welcome.service.js';
import { logger } from '../utils/logger.js';

export async function handleGroupParticipantsUpdate(
  socket: WASocket,
  event: BaileysEventMap['group-participants.update'],
): Promise<void> {
  try {
    if ((event.action !== 'add' && event.action !== 'remove') || event.participants.length === 0) {
      return;
    }

    const metadata = await socket.groupMetadata(event.id);
    await reconcileGroupUserIdentities(metadata);
    await ensureGroup(event.id, metadata.subject);

    const messages = event.action === 'add'
      ? await buildWelcomeMessages({
        groupJid: event.id,
        groupName: metadata.subject,
        participants: event.participants,
      })
      : await buildGoodbyeMessages({
        groupJid: event.id,
        groupName: metadata.subject,
        participants: event.participants,
      });

    for (const message of messages) {
      await socket.sendMessage(event.id, {
        text: message.text,
        mentions: message.mentions,
      });
    }
  } catch (error) {
    logger.error(
      {
        error,
        groupJid: event.id,
      },
      'Gagal memproses update member grup',
    );
  }
}
