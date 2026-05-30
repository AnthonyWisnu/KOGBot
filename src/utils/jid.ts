export function getNumberFromJid(jid: string): string {
  const localPart = jid.split('@')[0] ?? '';

  return localPart.split(':')[0] ?? localPart;
}

export function isSameUserJid(firstJid: string, secondJid: string): boolean {
  return firstJid === secondJid || getNumberFromJid(firstJid) === getNumberFromJid(secondJid);
}
