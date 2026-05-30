import { spawn } from 'node:child_process';
import { stat } from 'node:fs/promises';

import { env } from '../config/env.js';
import {
  createTempFilePath,
  removeTempFile,
} from '../utils/tempFile.js';
import {
  assertInstagramReelUrl,
  assertTikTokUrl,
} from '../utils/downloaderValidation.js';
import { logger } from '../utils/logger.js';

const bytesPerMb = 1024 * 1024;

type DownloadedVideo = {
  filePath: string;
  title?: string;
};

export async function downloadTikTokVideo(url: string): Promise<DownloadedVideo> {
  try {
    assertTikTokUrl(url);

    return await downloadWithYtDlp(url);
  } catch (error) {
    logger.error({ error, url }, 'Gagal download video TikTok');
    throw error;
  }
}

export async function downloadInstagramReelVideo(url: string): Promise<DownloadedVideo> {
  try {
    assertInstagramReelUrl(url);

    return await downloadWithYtDlp(url);
  } catch (error) {
    logger.error({ error, url }, 'Gagal download video Instagram');
    throw error;
  }
}

async function downloadWithYtDlp(url: string): Promise<DownloadedVideo> {
  let filePath: string | undefined;

  try {
    filePath = await createTempFilePath('.mp4');
    const title = await runYtDlp({
      url,
      outputPath: filePath,
    });

    const fileStats = await stat(filePath);

    if (fileStats.size > env.MAX_DOWNLOAD_MB * bytesPerMb) {
      throw new Error('File terlalu besar');
    }

    return {
      filePath,
      title,
    };
  } catch (error) {
    if (filePath) {
      await removeTempFile(filePath);
    }

    throw error;
  }
}

function runYtDlp(params: {
  url: string;
  outputPath: string;
}): Promise<string | undefined> {
  return new Promise((resolve, reject) => {
    const args = [
      '--no-playlist',
      '--no-warnings',
      '--max-filesize',
      `${env.MAX_DOWNLOAD_MB}M`,
      '--merge-output-format',
      'mp4',
      '-f',
      'bv*[ext=mp4]+ba[ext=m4a]/b[ext=mp4]/best',
      '--print',
      'title',
      '-o',
      params.outputPath,
    ];

    if (env.YTDLP_COOKIES_FILE) {
      args.push('--cookies', env.YTDLP_COOKIES_FILE);
    }

    args.push(params.url);

    const child = spawn(env.YTDLP_BINARY, args, {
      windowsHide: true,
    });
    const stdoutChunks: Buffer[] = [];
    const stderrChunks: Buffer[] = [];

    child.stdout.on('data', (chunk: Buffer) => {
      stdoutChunks.push(chunk);
    });
    child.stderr.on('data', (chunk: Buffer) => {
      stderrChunks.push(chunk);
    });
    child.on('error', (error) => {
      reject(normalizeYtDlpError(error));
    });
    child.on('close', (code) => {
      const stdout = Buffer.concat(stdoutChunks).toString('utf8').trim();
      const stderr = Buffer.concat(stderrChunks).toString('utf8').trim();

      if (code === 0) {
        resolve(stdout ? stdout.split('\n')[0] : undefined);
        return;
      }

      reject(createYtDlpExitError(stderr, code));
    });
  });
}

function normalizeYtDlpError(error: Error): Error {
  if ('code' in error && error.code === 'ENOENT') {
    return new Error('yt-dlp belum terinstall');
  }

  return error;
}

function createYtDlpExitError(stderr: string, code: number | null): Error {
  const lowerMessage = stderr.toLowerCase();

  if (lowerMessage.includes('larger than max-filesize') || lowerMessage.includes('file is larger')) {
    return new Error('File terlalu besar');
  }

  if (lowerMessage.includes('private') || lowerMessage.includes('login required')) {
    return new Error('Video tidak publik');
  }

  return new Error(stderr || `yt-dlp gagal dengan exit code ${code ?? 'unknown'}`);
}
