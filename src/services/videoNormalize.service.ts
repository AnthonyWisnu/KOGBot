import { spawn } from 'node:child_process';
import { stat } from 'node:fs/promises';

import { createTempFilePath, removeTempFile } from '../utils/tempFile.js';

const stderrLimit = 500;

export async function normalizeVideoForWhatsApp(inputPath: string): Promise<string> {
  let outputPath: string | undefined;

  try {
    outputPath = await createTempFilePath('.mp4');

    await runFfmpeg([
      '-y',
      '-i',
      inputPath,
      '-map',
      '0:v:0',
      '-map',
      '0:a?',
      '-c:v',
      'libx264',
      '-preset',
      'veryfast',
      '-profile:v',
      'baseline',
      '-level',
      '3.1',
      '-pix_fmt',
      'yuv420p',
      '-c:a',
      'aac',
      '-b:a',
      '128k',
      '-movflags',
      '+faststart',
      '-vf',
      'scale=trunc(iw/2)*2:trunc(ih/2)*2',
      outputPath,
    ]);

    await stat(outputPath);

    return outputPath;
  } catch (error) {
    if (outputPath) {
      await removeTempFile(outputPath);
    }

    throw error;
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
      reject(normalizeFfmpegError(error));
    });
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      const stderr = Buffer.concat(stderrChunks).toString('utf8').trim();

      reject(new Error(`ffmpeg gagal: ${stderr.slice(0, stderrLimit) || `exit code ${code ?? 'unknown'}`}`));
    });
  });
}

function normalizeFfmpegError(error: Error): Error {
  if ('code' in error && error.code === 'ENOENT') {
    return new Error('ffmpeg belum terinstall');
  }

  return error;
}
