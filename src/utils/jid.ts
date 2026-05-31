const lidToPhoneJid = new Map<string, string>();

export function getNumberFromJid(jid: string): string {
  const localPart = jid.split('@')[0] ?? '';

  return localPart.split(':')[0] ?? localPart;
}

export function isSameUserJid(firstJid: string, secondJid: string): boolean {
  try {
    return normalizeJid(firstJid) === normalizeJid(secondJid);
  } catch {
    return firstJid === secondJid || getNumberFromJid(firstJid) === getNumberFromJid(secondJid);
  }
}

export function normalizeJid(jid: string): string {
  const trimmedJid = jid.trim();

  if (trimmedJid.endsWith('@lid')) {
    const resolvedJid = lidToPhoneJid.get(trimmedJid) ?? lidToPhoneJid.get(getNumberFromJid(trimmedJid));

    if (!resolvedJid) {
      throw new Error(`JID LID belum dapat di-resolve ke nomor asli: ${trimmedJid}`);
    }

    return resolvedJid;
  }

  const number = getNumberFromJid(trimmedJid).replace(/\D/g, '');

  if (!number) {
    throw new Error(`JID user tidak valid: ${jid}`);
  }

  return `${number}@s.whatsapp.net`;
}

export function registerLidMapping(lidJid: string, phoneJid: string): void {
  if (!lidJid.endsWith('@lid')) {
    return;
  }

  const normalizedPhoneJid = normalizeJid(phoneJid);

  lidToPhoneJid.set(lidJid, normalizedPhoneJid);
  lidToPhoneJid.set(getNumberFromJid(lidJid), normalizedPhoneJid);
}
