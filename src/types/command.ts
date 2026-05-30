import type { WAMessage, WASocket } from '@whiskeysockets/baileys';

export type ParsedCommand = {
  name: string;
  args: string[];
  rawArgs: string;
};

export type CommandContext = {
  socket: WASocket;
  message: WAMessage;
  chatJid: string;
  senderJid: string;
  isGroup: boolean;
  groupName?: string;
  text: string;
  command: ParsedCommand;
  reply: (text: string) => Promise<WAMessage | undefined>;
  replyToMessageId: (text: string, messageId: string) => Promise<WAMessage | undefined>;
};

export type CommandHandler = (context: CommandContext) => Promise<void>;
