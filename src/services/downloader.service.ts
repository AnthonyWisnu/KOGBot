import { spawn } from 'node:child_process';
import path from 'node:path';
import { createWriteStream } from 'node:fs';
import { access, readdir, stat } from 'node:fs/promises';
import { Transform, type TransformCallback } from 'node:stream';
import { pipeline } from 'node:stream/promises';

import { env } from '../config/env.js';
import {
  createTempFilePath,
  removeTempFile,
} from '../utils/tempFile.js';
import {
  assertInstagramReelUrl,
  assertInstagramStoryUrl,
  assertTikTokUrl,
} from '../utils/downloaderValidation.js';
import { logger } from '../utils/logger.js';

const bytesPerMb = 1024 * 1024;
const requestTimeoutMs = 30000;

type DownloadedVideo = {
  filePath: string;
  title?: string;
};

export type DownloadedInstagramStory = DownloadedVideo & {
  mediaType: 'image' | 'video';
};

type TikwmResponse = {
  code?: number;
  msg?: string;
  data?: {
    title?: string;
    play?: string;
    wmplay?: string;
    hdplay?: string;
  };
};

export async function downloadTikTokVideo(url: string): Promise<DownloadedVideo> {
  try {
    assertTikTokUrl(url);

    const tikwmResult = await downloadTikTokWithTikwm(url).catch((error: unknown) => {
      logger.warn({ error, url }, 'TikWM gagal, mencoba yt-dlp untuk TikTok');
      return undefined;
    });

    if (tikwmResult) {
      return tikwmResult;
    }

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

export async function downloadInstagramStoryMedia(url: string): Promise<DownloadedInstagramStory> {
  try {
    assertInstagramStoryUrl(url);
    await assertInstagramCookiesAvailable();

    const result = await downloadWithYtDlp(url);

    return {
      ...result,
      mediaType: isImageFile(result.filePath) ? 'image' : 'video',
    };
  } catch (error) {
    logger.error({ error, url }, 'Gagal download Instagram Story');
    throw error;
  }
}

async function downloadTikTokWithTikwm(url: string): Promise<DownloadedVideo> {
  const apiUrl = new URL('https://www.tikwm.com/api/');
  apiUrl.searchParams.set('url', url);
  const response = await fetch(apiUrl, {
    signal: AbortSignal.timeout(requestTimeoutMs),
  });

  if (!response.ok) {
    throw new Error(`TikWM HTTP ${response.status}`);
  }

  const body = await response.json() as TikwmResponse;
  const videoUrl = body.data?.play ?? body.data?.hdplay ?? body.data?.wmplay;

  if (body.code !== 0 || !videoUrl) {
    throw new Error(body.msg ?? 'TikWM tidak mengembalikan video');
  }

  return {
    filePath: await downloadRemoteVideo(videoUrl),
    title: body.data?.title,
  };
}

async function downloadRemoteVideo(url: string): Promise<string> {
  let filePath: string | undefined;

  try {
    const maxBytes = env.MAX_DOWNLOAD_MB * bytesPerMb;
    filePath = await createTempFilePath('.mp4');
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
      },
      signal: AbortSignal.timeout(requestTimeoutMs),
    });

    if (!response.ok || !response.body) {
      throw new Error(`Download HTTP ${response.status}`);
    }

    const contentLength = Number(response.headers.get('content-length'));

    if (Number.isFinite(contentLength) && contentLength > maxBytes) {
      throw new Error('File terlalu besar');
    }

    await pipeline(
      response.body,
      new SizeLimitTransform(maxBytes),
      createWriteStream(filePath),
    );

    return filePath;
  } catch (error) {
    if (filePath) {
      await removeTempFile(filePath);
    }

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

class SizeLimitTransform extends Transform {
  private totalBytes = 0;

  public constructor(private readonly maxBytes: number) {
    super();
  }

  public override _transform(
    chunk: Buffer,
    _encoding: BufferEncoding,
    callback: TransformCallback,
  ): void {
    this.totalBytes += chunk.length;

    if (this.totalBytes > this.maxBytes) {
      callback(new Error('File terlalu besar'));
      return;
    }

    callback(null, chunk);
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
    return /\.(mp4|mkv|webm|mov|jpe?g|png|webp)$/i.test(line);
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

async function assertInstagramCookiesAvailable(): Promise<void> {
  if (!env.YTDLP_COOKIES_FILE) {
    throw new Error('Cookie Instagram belum dikonfigurasi');
  }

  try {
    await access(env.YTDLP_COOKIES_FILE);
  } catch {
    throw new Error('Cookie Instagram tidak ditemukan');
  }
}

function isImageFile(filePath: string): boolean {
  return /\.(jpe?g|png|webp)$/i.test(filePath);
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
