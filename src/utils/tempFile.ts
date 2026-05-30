import { mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

import { env } from '../config/env.js';
import { logger } from './logger.js';

export async function createTempFilePath(extension: string): Promise<string> {
  try {
    await mkdir(env.TEMP_DIR, { recursive: true });

    const normalizedExtension = extension.startsWith('.') ? extension : `.${extension}`;

    return path.join(env.TEMP_DIR, `${randomUUID()}${normalizedExtension}`);
  } catch (error) {
    logger.error({ error }, 'Gagal membuat path file sementara');
    throw error;
  }
}

export async function removeTempFile(filePath: string): Promise<void> {
  try {
    await rm(filePath, { force: true });
  } catch (error) {
    logger.warn({ error, filePath }, 'Gagal menghapus file sementara');
  }
}
