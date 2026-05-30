import { GameType } from '@prisma/client';

import type { CommandContext } from '../types/command.js';
import {
  getActiveGame,
  updateActiveGameMessageId,
} from './activeGame.service.js';

export async function recordActiveGameMessage(params: {
  groupJid: string;
  type: GameType;
  messageId: string | null | undefined;
  asLastPrompt?: boolean;
}): Promise<void> {
  if (!params.messageId) {
    return;
  }

  await updateActiveGameMessageId({
    groupJid: params.groupJid,
    type: params.type,
    messageId: params.messageId,
    asLastPrompt: params.asLastPrompt,
  });
}

export async function replyActiveGameStillRunning(params: {
  context: CommandContext;
  type: GameType;
  message: string;
}): Promise<void> {
  const activeGame = await getActiveGame({
    groupJid: params.context.chatJid,
    type: params.type,
  });
  const messageId = activeGame?.lastPromptMessageId ?? activeGame?.messageId;

  if (!messageId) {
    await params.context.reply(params.message);
    return;
  }

  const sentMessage = await params.context.replyToMessageId(params.message, messageId);

  await recordActiveGameMessage({
    groupJid: params.context.chatJid,
    type: params.type,
    messageId: sentMessage?.key.id,
    asLastPrompt: true,
  });
}
