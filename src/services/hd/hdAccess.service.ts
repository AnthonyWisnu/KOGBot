import { isOwner } from '../../bot/permissions.js';
import type { CommandContext } from '../../types/command.js';

export async function canUseHdAi(context: CommandContext): Promise<boolean> {
  if (isOwner(context.senderJid)) {
    return true;
  }

  // TODO: Hubungkan ke sistem premium jika fitur premium sudah ditentukan.
  return true;
}
