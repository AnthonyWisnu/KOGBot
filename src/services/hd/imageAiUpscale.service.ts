import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';

import sharp from 'sharp';

import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';
import {
  createTempFilePath,
  removeTempFile,
} from '../../utils/tempFile.js';

const hdAiScaleFactor = '4';
const hdAiOutputFormat = 'png';
const hdAiDependencyMessage = 'Fitur HD AI belum siap di server.';

export type AiUpscaledImage = {
  buffer: Buffer;
  filename: string;
  mimeType: string;
};

export function isHdAiDependencyError(error: unknown): boolean {
  return error instanceof Error && error.message === hdAiDependencyMessage;
}

export async function upscalePhotoWithAi(input: Buffer): Promise<AiUpscaledImage> {
  let inputPath: string | undefined;
  let outputPath: string | undefined;

  try {
    inputPath = await createTempFilePath('.png');
    outputPath = await createTempFilePath('.png');

    await sharp(input, { failOn: 'none' })
      .rotate()
      .png()
      .toFile(inputPath);

    await runHdAiUpscaler([
      '-i',
      inputPath,
      '-o',
      outputPath,
      '-s',
      hdAiScaleFactor,
      '-f',
      hdAiOutputFormat,
    ]);

    const buffer = await readFile(outputPath);

    logger.info(
      {
        outputSize: buffer.byteLength,
        scale: hdAiScaleFactor,
      },
      'HD AI upscale berhasil',
    );

    return {
      buffer,
      filename: 'hdai-photo.png',
      mimeType: 'image/png',
    };
  } catch (error) {
    logger.error({ error }, 'Gagal menjalankan HD AI upscale');
    throw error;
  } finally {
    if (inputPath) {
      await removeTempFile(inputPath);
    }

    if (outputPath) {
      await removeTempFile(outputPath);
    }
  }
}

function runHdAiUpscaler(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(env.HDAI_BINARY, args, {
      windowsHide: true,
    });
    const stderrChunks: Buffer[] = [];
    let settled = false;

    const timeout = setTimeout(() => {
      if (settled) return;

      settled = true;
      child.kill('SIGTERM');
      reject(new Error('Proses HD AI terlalu lama.'));
    }, env.HDAI_TIMEOUT_MS);

    child.stderr.on('data', (chunk: Buffer) => {
      stderrChunks.push(chunk);
    });

    child.on('error', (error: NodeJS.ErrnoException) => {
      if (settled) return;

      settled = true;
      clearTimeout(timeout);

      if (error.code === 'ENOENT') {
        reject(new Error(hdAiDependencyMessage));
        return;
      }

      reject(error);
    });

    child.on('close', (code) => {
      if (settled) return;

      settled = true;
      clearTimeout(timeout);

      if (code === 0) {
        resolve();
        return;
      }

      const stderr = Buffer.concat(stderrChunks).toString('utf8').trim();
      logger.warn(
        {
          exitCode: code,
          stderr: stderr.slice(0, 800),
        },
        'HD AI CLI keluar dengan status gagal',
      );
      reject(new Error(stderr || `HD AI gagal dengan exit code ${code ?? 'unknown'}`));
    });
  });
}
