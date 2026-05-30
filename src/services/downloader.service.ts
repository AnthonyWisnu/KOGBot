import { spawn } from 'node:child_process';
import path from 'node:path';
import { access, readdir, stat } from 'node:fs/promises';

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
    const tempBasePath = await createTempFilePath('.download');
    const outputTemplate = `${tempBasePath.slice(0, -'.download'.length)}.%(ext)s`;
    const result = await runYtDlp({
      url,
      outputTemplate,
    });
    filePath = result.filePath ?? await findDownloadedFile(outputTemplate);

    const fileStats = await stat(filePath);

    if (fileStats.size > env.MAX_DOWNLOAD_MB * bytesPerMb) {
      throw new Error('File terlalu besar');
    }

    return {
      filePath,
      title: result.title,
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
  outputTemplate: string;
}): Promise<{ filePath?: string; title?: string }> {
  return new Promise((resolve, reject) => {
    const args = [
      '--no-playlist',
      '--no-warnings',
      '--force-ipv4',
      '--max-filesize',
      `${env.MAX_DOWNLOAD_MB}M`,
      '--merge-output-format',
      'mp4',
      '--recode-video',
      'mp4',
      '-f',
      'bv*+ba/best',
      '--user-agent',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36',
      '--print',
      'title',
      '--print',
      'after_move:filepath',
      '-o',
      params.outputTemplate,
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
        resolve(parseYtDlpOutput(stdout));
        return;
      }

      reject(createYtDlpExitError(stderr, code));
    });
  });
}

function parseYtDlpOutput(stdout: string): { filePath?: string; title?: string } {
  const lines = stdout
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  const filePath = [...lines].reverse().find((line) => {
    return /\.(mp4|mkv|webm|mov)$/i.test(line);
  });
  const title = lines.find((line) => line !== filePath);

  return {
    filePath,
    title,
  };
}

async function findDownloadedFile(outputTemplate: string): Promise<string> {
  const directory = path.dirname(outputTemplate);
  const prefix = path.basename(outputTemplate).replace('.%(ext)s', '.');
  const files = await readdir(directory);
  const matchedFile = files.find((file) => file.startsWith(prefix));

  if (!matchedFile) {
    throw new Error('yt-dlp tidak menghasilkan file video');
  }

  const filePath = path.join(directory, matchedFile);
  await access(filePath);

  return filePath;
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

  const message = stderr || `yt-dlp gagal dengan exit code ${code ?? 'unknown'}`;

  return new Error(`yt-dlp gagal: ${message.slice(0, 500)}`);
}
