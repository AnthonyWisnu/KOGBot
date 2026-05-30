import { env } from '../config/env.js';
import type { WASocket } from '@whiskeysockets/baileys';

import { logger } from '../utils/logger.js';
import { getNumberFromJid } from '../utils/jid.js';

export function isOwner(senderJid: string): boolean {
  const senderNumber = getNumberFromJid(senderJid);

  return senderNumber === env.OWNER_NUMBER;
}

export function isGroupJid(jid: string): boolean {
  return jid.endsWith('@g.us');
}

export async function isGroupAdmin(params: {
  socket: WASocket;
  groupJid: string;
  senderJid: string;
}): Promise<boolean> {
  try {
    if (isOwner(params.senderJid)) {
      return true;
    }

    const metadata = await params.socket.groupMetadata(params.groupJid);
    const senderNumber = getNumberFromJid(params.senderJid);
    const participant = metadata.participants.find((item) => {
      const itemJid = item.id;

      return itemJid === params.senderJid || getNumberFromJid(itemJid) === senderNumber;
    });

    return participant?.admin === 'admin' || participant?.admin === 'superadmin';
  } catch (error) {
    logger.error(
      {
        error,
        groupJid: params.groupJid,
        senderJid: params.senderJid,
      },
      'Gagal memeriksa admin grup',
    );
    return false;
  }
}
