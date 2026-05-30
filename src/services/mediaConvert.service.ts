import { spawn } from 'node:child_process';
import { writeFile } from 'node:fs/promises';

import {
  createTempFilePath,
  removeTempFile,
} from '../utils/tempFile.js';
import { logger } from '../utils/logger.js';

export type ConvertedMedia = {
  filePath: string;
};

export async function convertImageToSticker(input: Buffer): Promise<ConvertedMedia> {
  let inputPath: string | undefined;
  let outputPath: string | undefined;

  try {
    inputPath = await createTempFilePath('.jpg');
    outputPath = await createTempFilePath('.webp');
    await writeFile(inputPath, input);
    await runFfmpeg([
      '-y',
      '-i',
      inputPath,
      '-vf',
      'scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=0x00000000',
      '-vcodec',
      'libwebp',
      '-lossless',
      '0',
      '-q:v',
      '80',
      '-preset',
      'picture',
      '-an',
      '-vsync',
      '0',
      outputPath,
    ]);

    return {
      filePath: outputPath,
    };
  } catch (error) {
    logger.error({ error }, 'Gagal mengubah gambar menjadi sticker');

    if (outputPath) {
      await removeTempFile(outputPath);
    }

    throw error;
  } finally {
    if (inputPath) {
      await removeTempFile(inputPath);
    }
  }
}

export async function convertStickerToImage(input: Buffer): Promise<ConvertedMedia> {
  let inputPath: string | undefined;
  let outputPath: string | undefined;

  try {
    inputPath = await createTempFilePath('.webp');
    outputPath = await createTempFilePath('.png');
    await writeFile(inputPath, input);
    await runFfmpeg([
      '-y',
      '-i',
      inputPath,
      outputPath,
    ]);

    return {
      filePath: outputPath,
    };
  } catch (error) {
    logger.error({ error }, 'Gagal mengubah sticker menjadi gambar');

    if (outputPath) {
      await removeTempFile(outputPath);
    }

    throw error;
  } finally {
    if (inputPath) {
      await removeTempFile(inputPath);
    }
  }
}

function runFfmpeg(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn('ffmpeg', args, {
      windowsHide: true,
    });
    const stderrChunks: Buffer[] = [];

    child.stderr.on('data', (chunk: Buffer) => {
      stderrChunks.push(chunk);
    });
    child.on('error', (error) => {
      if ('code' in error && error.code === 'ENOENT') {
        reject(new Error('ffmpeg belum terinstall'));
        return;
      }

      reject(error);
    });
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      const stderr = Buffer.concat(stderrChunks).toString('utf8').trim();
      reject(new Error(stderr || `ffmpeg gagal dengan exit code ${code ?? 'unknown'}`));
    });
  });
}
