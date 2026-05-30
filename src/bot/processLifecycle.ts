import { disconnectPrisma } from '../database/prisma.js';
import { logger } from '../utils/logger.js';

let shuttingDown = false;

export function registerProcessLifecycleHandlers(): void {
  process.on('unhandledRejection', (reason) => {
    logger.error({ reason }, 'Unhandled promise rejection');
  });

  process.on('uncaughtException', (error) => {
    logger.fatal({ error }, 'Uncaught exception');
    void shutdown(1);
  });

  process.on('SIGINT', () => {
    logger.info('Menerima SIGINT, bot akan berhenti');
    void shutdown(0);
  });

  process.on('SIGTERM', () => {
    logger.info('Menerima SIGTERM, bot akan berhenti');
    void shutdown(0);
  });
}

async function shutdown(exitCode: number): Promise<void> {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;

  try {
    await disconnectPrisma();
  } catch (error) {
    logger.error({ error }, 'Shutdown gagal menutup resource');
    process.exit(exitCode === 0 ? 1 : exitCode);
    return;
  }

  process.exit(exitCode);
}
