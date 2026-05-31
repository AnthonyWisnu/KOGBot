import type {
  GroupMetadata,
  GroupParticipant,
  WASocket,
} from '@whiskeysockets/baileys';

import { getNumberFromJid, isSameUserJid } from './jid.js';

export function findGroupParticipant(
  metadata: GroupMetadata,
  jid: string,
): GroupParticipant | undefined {
  return metadata.participants.find((participant) => {
    return getParticipantJids(participant).some((participantJid) => {
      return isMatchingJid(participantJid, jid);
    });
  });
}

export function findBotParticipant(
  metadata: GroupMetadata,
  socket: WASocket,
): GroupParticipant | undefined {
  const botJids = [
    socket.user?.id,
    socket.user?.jid,
    socket.user?.lid,
  ].filter((jid): jid is string => Boolean(jid));

  return metadata.participants.find((participant) => {
    return getParticipantJids(participant).some((participantJid) => {
      return botJids.some((botJid) => isMatchingJid(participantJid, botJid));
    });
  });
}

export function isGroupParticipantAdmin(
  participant: GroupParticipant | undefined,
): boolean {
  return participant?.admin === 'admin' || participant?.admin === 'superadmin';
}

export function getParticipantActionJid(participant: GroupParticipant): string {
  return participant.id;
}

export function getParticipantIdentityJid(participant: GroupParticipant): string {
  return participant.jid ?? participant.id;
}

export function isSameGroupParticipant(
  first: GroupParticipant | undefined,
  second: GroupParticipant | undefined,
): boolean {
  if (!first || !second) {
    return false;
  }

  return getParticipantJids(first).some((firstJid) => {
    return getParticipantJids(second).some((secondJid) => {
      return isMatchingJid(firstJid, secondJid);
    });
  });
}

function getParticipantJids(participant: GroupParticipant): string[] {
  return [
    participant.id,
    participant.jid,
    participant.lid,
  ].filter((jid): jid is string => Boolean(jid));
}

function isMatchingJid(firstJid: string, secondJid: string): boolean {
  return (
    isSameUserJid(firstJid, secondJid) ||
    getNumberFromJid(firstJid) === getNumberFromJid(secondJid)
  );
}
