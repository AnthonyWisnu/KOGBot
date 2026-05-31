import {
  Browsers,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  makeWASocket,
  useMultiFileAuthState,
  type BaileysEventMap,
  type WASocket,
} from '@whiskeysockets/baileys';
import { mkdir } from 'node:fs/promises';
import qrcodeTerminal from 'qrcode-terminal';

import { env } from '../config/env.js';
import { reconcileAllGroupUserIdentities } from '../services/userIdentity.service.js';
import { logger } from '../utils/logger.js';
import { handleMessagesUpsert } from './messageHandler.js';
import { handleGroupParticipantsUpdate } from './welcomeHandler.js';

const reconnectDelayMs = 5000;

type SaveCredentials = () => Promise<void>;

export async function startWhatsAppConnection(): Promise<WASocket> {
  try {
    await mkdir(env.SESSION_DIR, { recursive: true });

    const { state, saveCreds } = await useMultiFileAuthState(env.SESSION_DIR);
    const { version, isLatest } = await fetchLatestBaileysVersion();

    logger.info({ version, isLatest }, 'Versi Baileys berhasil dimuat');

    const socket = makeWASocket({
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, logger),
      },
      browser: Browsers.ubuntu(env.BOT_NAME),
      logger: logger.child({ module: 'baileys' }),
      markOnlineOnConnect: false,
      syncFullHistory: false,
      version,
    });

    bindConnectionEvents(socket, saveCreds);

    return socket;
  } catch (error) {
    logger.error({ error }, 'Gagal memulai koneksi WhatsApp');
    throw error;
  }
}

function bindConnectionEvents(socket: WASocket, saveCreds: SaveCredentials): void {
  socket.ev.on('creds.update', () => {
    void persistCredentials(saveCreds);
  });

  socket.ev.on('connection.update', (update) => {
    handleConnectionUpdate(socket, update);
  });

  socket.ev.on('messages.upsert', (event) => {
    void handleMessagesUpsert(socket, event);
  });

  socket.ev.on('group-participants.update', (event) => {
    void handleGroupParticipantsUpdate(socket, event);
  });
}

async function persistCredentials(saveCreds: SaveCredentials): Promise<void> {
  try {
    await saveCreds();
  } catch (error) {
    logger.error({ error }, 'Gagal menyimpan session WhatsApp');
  }
}

function handleConnectionUpdate(
  socket: WASocket,
  update: BaileysEventMap['connection.update'],
): void {
  try {
    if (update.qr) {
      logger.info(`Pindai QR WhatsApp berikut untuk login ${env.BOT_NAME}`);
      qrcodeTerminal.generate(update.qr, { small: true });
    }

    if (update.connection === 'open') {
      logger.info('Koneksi WhatsApp berhasil dibuka');
      void reconcileAllGroupUserIdentities(socket);
      return;
    }

    if (update.connection !== 'close') {
      return;
    }

    const statusCode = getDisconnectStatusCode(update.lastDisconnect?.error);
    const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

    logger.warn(
      {
        statusCode,
        shouldReconnect,
      },
      'Koneksi WhatsApp terputus',
    );

    if (!shouldReconnect) {
      logger.error('Session WhatsApp logout, hapus folder session lalu login ulang');
      return;
    }

    setTimeout(() => {
      void startWhatsAppConnection();
    }, reconnectDelayMs);
  } catch (error) {
    logger.error({ error }, 'Gagal menangani update koneksi WhatsApp');
  }
}

function getDisconnectStatusCode(error: unknown): number | undefined {
  if (!isRecord(error)) {
    return undefined;
  }

  const output = error.output;

  if (!isRecord(output)) {
    return undefined;
  }

  const statusCode = output.statusCode;

  return typeof statusCode === 'number' ? statusCode : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
