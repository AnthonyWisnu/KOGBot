import 'dotenv/config';

import pino from 'pino';
import { z } from 'zod';

const envSchema = z.object({
  BOT_NAME: z.string().min(1).default('MinjiBot'),
  BOT_PREFIX: z.string().min(1).default('.'),
  OWNER_NUMBER: z.string().regex(/^\d+$/, 'OWNER_NUMBER hanya boleh berisi angka'),
  DATABASE_URL: z.string().min(1),
  SESSION_DIR: z.string().min(1).default('./sessions'),
  TEMP_DIR: z.string().min(1).default('./temp'),
  MAX_DOWNLOAD_MB: z.coerce.number().int().positive().default(50),
  YTDLP_BINARY: z.string().min(1).default('yt-dlp'),
  YTDLP_COOKIES_FILE: z.string().min(1).optional(),
  HDAI_BINARY: z.string().min(1).default('real-esrgan-ncnn-vulkan'),
  HDAI_TIMEOUT_MS: z.coerce.number().int().positive().default(180_000),
  TIMEZONE: z.string().min(1).default('Asia/Jakarta'),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  const issues = parsedEnv.error.issues
    .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
    .join('; ');

  const bootstrapLogger = pino({
    level: 'error',
    timestamp: pino.stdTimeFunctions.isoTime,
  });

  bootstrapLogger.error(
    { issues },
    'Konfigurasi environment tidak valid',
  );

  throw new Error(`Konfigurasi environment tidak valid: ${issues}`);
}

export const env = parsedEnv.data;

export type Env = typeof env;
