import { env } from './config/env.js';
import { startWhatsAppConnection } from './bot/connection.js';
import { registerProcessLifecycleHandlers } from './bot/processLifecycle.js';
import { logger } from './utils/logger.js';

registerProcessLifecycleHandlers();

async function main(): Promise<void> {
  try {
    logger.info(
      {
        botName: env.BOT_NAME,
        prefix: env.BOT_PREFIX,
        sessionDir: env.SESSION_DIR,
        tempDir: env.TEMP_DIR,
        timezone: env.TIMEZONE,
      },
      `${env.BOT_NAME} berhasil memuat konfigurasi`,
    );

    await startWhatsAppConnection();
  } catch (error) {
    logger.error({ error }, `${env.BOT_NAME} gagal dijalankan`);
    process.exitCode = 1;
  }
}

void main();
