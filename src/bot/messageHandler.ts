import type {
  BaileysEventMap,
  GroupMetadata,
  WAMessage,
  WAMessageContent,
  WASocket,
} from '@whiskeysockets/baileys';

import { isGroupJid } from './permissions.js';
import { handleEmojiGuessAnswer } from '../commands/emojiGuess.command.js';
import { handleFamily100Answer } from '../commands/family100.command.js';
import { handleNumberGuessAnswer } from '../commands/numberGuess.command.js';
import { ownerCommandNames } from '../commands/owner.command.js';
import { handleQuizAnswer } from '../commands/quiz.command.js';
import { handleReplySurrender } from '../commands/replySurrender.command.js';
import { routeCommand } from '../commands/index.js';
import { handleTicTacToeAnswer } from '../commands/ticTacToe.command.js';
import { handleWordScrambleAnswer } from '../commands/wordScramble.command.js';
import { env } from '../config/env.js';
import {
  ensureGroup,
  isGroupApproved,
} from '../services/group.service.js';
import { enforceAntiLink } from '../services/antiLink.service.js';
import type { CommandContext, ParsedCommand } from '../types/command.js';
import { logger } from '../utils/logger.js';

const groupNotApprovedMessage =
  `Grup ini belum diizinkan menggunakan ${env.BOT_NAME}. Owner bot perlu menjalankan ${env.BOT_PREFIX}approvegroup terlebih dahulu.`;

export async function handleMessagesUpsert(
  socket: WASocket,
  event: BaileysEventMap['messages.upsert'],
): Promise<void> {
  try {
    if (event.type !== 'notify') {
      return;
    }

    for (const message of event.messages) {
      await handleIncomingMessage(socket, message);
    }
  } catch (error) {
    logger.error({ error }, 'Gagal memproses kumpulan pesan masuk');
  }
}

async function handleIncomingMessage(
  socket: WASocket,
  message: WAMessage,
): Promise<void> {
  try {
    const chatJid = message.key.remoteJid;

    if (!chatJid || chatJid === 'status@broadcast' || message.key.fromMe) {
      return;
    }

    const text = getMessageText(message.message);

    if (!text) {
      return;
    }

    const senderJid = getSenderJid(message);

    if (!senderJid) {
      logger.warn({ chatJid }, 'Pesan masuk tidak memiliki sender JID');
      return;
    }

    const command = parseCommand(text, env.BOT_PREFIX);
    const isGroup = isGroupJid(chatJid);
    const groupName = isGroup ? await getGroupName(socket, chatJid) : undefined;

    const context = createCommandContext({
      socket,
      message,
      chatJid,
      senderJid,
      isGroup,
      groupName,
      text,
      command: command ?? createPlainMessageCommand(),
    });

    if (isGroup && command) {
      const canContinue = await guardApprovedGroup(context);

      if (!canContinue) {
        return;
      }
    }

    if (!command) {
      if (isGroup) {
        const canProcess = await canProcessPlainGroupMessage(context);

        if (!canProcess) {
          return;
        }
      }

      if (isGroup && await handleAntiLinkMessage(context)) {
        return;
      }

      await handlePlainMessage(context);
      return;
    }

    if (isGroup && await handleAntiLinkMessage(context)) {
      return;
    }

    await routeCommand(context);
  } catch (error) {
    logger.error(
      {
        error,
        messageId: message.key.id,
        chatJid: message.key.remoteJid,
      },
      'Gagal memproses pesan masuk',
    );
  }
}

async function handleAntiLinkMessage(context: CommandContext): Promise<boolean> {
  try {
    const result = await enforceAntiLink({
      socket: context.socket,
      message: context.message,
      groupJid: context.chatJid,
      senderJid: context.senderJid,
      text: context.text,
    });

    if (result.status === 'bot_not_admin') {
      await context.reply('Anti link aktif, tetapi bot harus menjadi admin grup untuk menindak pelanggaran.');
      return true;
    }

    return result.status === 'enforced';
  } catch (error) {
    logger.error(
      {
        error,
        chatJid: context.chatJid,
        senderJid: context.senderJid,
      },
      'Gagal menjalankan anti link',
    );
    return false;
  }
}

async function handlePlainMessage(context: CommandContext): Promise<void> {
  try {
    const surrenderHandled = await handleReplySurrender(
      context,
      getQuotedMessageId(context.message.message),
    );

    if (surrenderHandled) {
      return;
    }

    const handled = await handleQuizAnswer(context);

    if (handled) {
      return;
    }

    const family100Handled = await handleFamily100Answer(context);

    if (family100Handled) {
      return;
    }

    const wordScrambleHandled = await handleWordScrambleAnswer(context);

    if (wordScrambleHandled) {
      return;
    }

    const emojiGuessHandled = await handleEmojiGuessAnswer(context);

    if (emojiGuessHandled) {
      return;
    }

    const ticTacToeHandled = await handleTicTacToeAnswer(context);

    if (ticTacToeHandled) {
      return;
    }

    await handleNumberGuessAnswer(context);
  } catch (error) {
    logger.error(
      {
        error,
        chatJid: context.chatJid,
        senderJid: context.senderJid,
      },
      'Gagal memproses pesan biasa',
    );
  }
}

function createPlainMessageCommand(): ParsedCommand {
  return {
    name: '',
    args: [],
    rawArgs: '',
  };
}

function createCommandContext(params: {
  socket: WASocket;
  message: WAMessage;
  chatJid: string;
  senderJid: string;
  isGroup: boolean;
  groupName?: string;
  text: string;
  command: ParsedCommand;
}): CommandContext {
  return {
    socket: params.socket,
    message: params.message,
    chatJid: params.chatJid,
    senderJid: params.senderJid,
    isGroup: params.isGroup,
    groupName: params.groupName,
    text: params.text,
    command: params.command,
    reply: async (text: string): Promise<WAMessage | undefined> => {
      try {
        return await params.socket.sendMessage(
          params.chatJid,
          { text },
          { quoted: params.message },
        );
      } catch (error) {
        logger.error(
          {
            error,
            chatJid: params.chatJid,
            messageId: params.message.key.id,
          },
          'Gagal mengirim balasan command',
        );
        return undefined;
      }
    },
    replyToMessageId: async (text: string, messageId: string): Promise<WAMessage | undefined> => {
      try {
        return await params.socket.sendMessage(
          params.chatJid,
          { text },
          {
            quoted: createQuotedBotMessage({
              chatJid: params.chatJid,
              messageId,
            }),
          },
        );
      } catch (error) {
        logger.error(
          {
            error,
            chatJid: params.chatJid,
            messageId,
          },
          'Gagal mengirim balasan ke pesan game aktif',
        );
        return undefined;
      }
    },
  };
}

function createQuotedBotMessage(params: {
  chatJid: string;
  messageId: string;
}): WAMessage {
  return {
    key: {
      remoteJid: params.chatJid,
      id: params.messageId,
      fromMe: true,
    },
    message: {
      conversation: '',
    },
  };
}

async function guardApprovedGroup(context: CommandContext): Promise<boolean> {
  try {
    await ensureGroup(context.chatJid, context.groupName);

    if (ownerCommandNames.has(context.command.name)) {
      return true;
    }

    const approved = await isGroupApproved(context.chatJid);

    if (approved) {
      return true;
    }

    await context.reply(groupNotApprovedMessage);
    return false;
  } catch (error) {
    logger.error(
      {
        error,
        chatJid: context.chatJid,
        command: context.command.name,
      },
      'Gagal menjalankan pengecekan whitelist grup',
    );

    await context.reply('Terjadi kesalahan saat memeriksa izin grup. Coba lagi nanti.');
    return false;
  }
}

async function canProcessPlainGroupMessage(context: CommandContext): Promise<boolean> {
  try {
    await ensureGroup(context.chatJid, context.groupName);

    return await isGroupApproved(context.chatJid);
  } catch (error) {
    logger.error(
      {
        error,
        chatJid: context.chatJid,
      },
      'Gagal memeriksa izin grup untuk pesan biasa',
    );
    return false;
  }
}

function getSenderJid(message: WAMessage): string | undefined {
  if (message.key.participantPn) {
    return message.key.participantPn;
  }

  if (message.key.participant) {
    return message.key.participant;
  }

  if (message.key.senderPn) {
    return message.key.senderPn;
  }

  return message.key.remoteJid ?? undefined;
}

async function getGroupName(
  socket: WASocket,
  groupJid: string,
): Promise<string | undefined> {
  try {
    const metadata: GroupMetadata = await socket.groupMetadata(groupJid);

    return metadata.subject;
  } catch (error) {
    logger.warn({ error, groupJid }, 'Gagal mengambil nama grup');
    return undefined;
  }
}

function parseCommand(text: string, prefix: string): ParsedCommand | undefined {
  const trimmedText = text.trim();

  if (!trimmedText.startsWith(prefix)) {
    return undefined;
  }

  const commandText = trimmedText.slice(prefix.length).trim();

  if (!commandText) {
    return undefined;
  }

  const parts = commandText.split(/\s+/);
  const commandName = parts[0];

  if (!commandName) {
    return undefined;
  }

  return {
    name: commandName.toLowerCase(),
    args: parts.slice(1),
    rawArgs: commandText.slice(commandName.length).trim(),
  };
}

function getMessageText(message: WAMessageContent | null | undefined): string | undefined {
  const content = unwrapMessage(message);

  if (!content) {
    return undefined;
  }

  return (
    content.conversation ??
    content.extendedTextMessage?.text ??
    content.imageMessage?.caption ??
    content.videoMessage?.caption ??
    content.documentMessage?.caption ??
    content.buttonsResponseMessage?.selectedButtonId ??
    content.listResponseMessage?.singleSelectReply?.selectedRowId ??
    undefined
  );
}

function getQuotedMessageId(message: WAMessageContent | null | undefined): string | undefined {
  const content = unwrapMessage(message);

  if (!content) {
    return undefined;
  }

  return (
    content.extendedTextMessage?.contextInfo?.stanzaId ??
    content.imageMessage?.contextInfo?.stanzaId ??
    content.videoMessage?.contextInfo?.stanzaId ??
    content.documentMessage?.contextInfo?.stanzaId ??
    undefined
  );
}

function unwrapMessage(
  message: WAMessageContent | null | undefined,
): WAMessageContent | undefined {
  if (!message) {
    return undefined;
  }

  if (message.ephemeralMessage?.message) {
    return unwrapMessage(message.ephemeralMessage.message);
  }

  if (message.viewOnceMessage?.message) {
    return unwrapMessage(message.viewOnceMessage.message);
  }

  if (message.viewOnceMessageV2?.message) {
    return unwrapMessage(message.viewOnceMessageV2.message);
  }

  if (message.documentWithCaptionMessage?.message) {
    return unwrapMessage(message.documentWithCaptionMessage.message);
  }

  return message;
}
