import { spawn } from 'node:child_process';
import { stat } from 'node:fs/promises';

import { createTempFilePath, removeTempFile } from '../utils/tempFile.js';
import { logger } from '../utils/logger.js';

const stderrLimit = 500;

type ProbeStream = {
  codec_type?: string;
  codec_name?: string;
  pix_fmt?: string;
  width?: number;
  height?: number;
};

type ProbeFormat = {
  format_name?: string;
};

type VideoProbe = {
  streams?: ProbeStream[];
  format?: ProbeFormat;
};

type VideoMetadata = {
  formatName?: string;
  videoCodec?: string;
  audioCodec?: string;
  pixelFormat?: string;
  width?: number;
  height?: number;
};

export async function normalizeVideoForWhatsApp(inputPath: string): Promise<string> {
  let outputPath: string | undefined;

  try {
    const metadata = await probeVideo(inputPath).catch((error: unknown) => {
      if (isMissingFfmpegError(error)) {
        throw error;
      }

      logger.warn({ error, inputPath }, 'ffprobe gagal membaca metadata video, fallback transcode');
      return undefined;
    });
    const iosSafe = metadata ? isWhatsAppIosSafe(metadata) : false;

    outputPath = iosSafe
      ? await remuxVideo(inputPath, metadata)
      : await transcodeVideo(inputPath, metadata);

    await stat(outputPath);

    return outputPath;
  } catch (error) {
    if (outputPath) {
      await removeTempFile(outputPath);
    }

    throw error;
  }
}

export async function probeVideo(inputPath: string): Promise<VideoMetadata> {
  const stdout = await runFfprobe([
    '-v',
    'error',
    '-print_format',
    'json',
    '-show_streams',
    '-show_format',
    inputPath,
  ]);
  const parsed = JSON.parse(stdout) as VideoProbe;
  const videoStream = parsed.streams?.find((stream) => stream.codec_type === 'video');
  const audioStream = parsed.streams?.find((stream) => stream.codec_type === 'audio');

  return {
    formatName: parsed.format?.format_name,
    videoCodec: videoStream?.codec_name,
    audioCodec: audioStream?.codec_name,
    pixelFormat: videoStream?.pix_fmt,
    width: videoStream?.width,
    height: videoStream?.height,
  };
}

export function isWhatsAppIosSafe(metadata: VideoMetadata): boolean {
  const formatName = metadata.formatName?.toLowerCase() ?? '';
  const videoCodec = metadata.videoCodec?.toLowerCase();
  const pixelFormat = metadata.pixelFormat?.toLowerCase();
  const audioCodec = metadata.audioCodec?.toLowerCase();
  const width = metadata.width;
  const height = metadata.height;

  return (
    /\b(mp4|mov|m4v)\b/.test(formatName) &&
    videoCodec === 'h264' &&
    pixelFormat === 'yuv420p' &&
    typeof width === 'number' &&
    width % 2 === 0 &&
    typeof height === 'number' &&
    height % 2 === 0 &&
    (!audioCodec || audioCodec === 'aac')
  );
}

async function remuxVideo(
  inputPath: string,
  metadata: VideoMetadata | undefined,
): Promise<string> {
  let outputPath: string | undefined;

  try {
    outputPath = await createTempFilePath('.mp4');
    await runFfmpeg([
      '-y',
      '-i',
      inputPath,
      '-c',
      'copy',
      '-movflags',
      '+faststart',
      outputPath,
    ]);

    await logNormalizeResult({
      inputPath,
      outputPath,
      metadata,
      normalizeMode: 'remux',
    });

    return outputPath;
  } catch (error) {
    if (outputPath) {
      await removeTempFile(outputPath);
    }

    logger.warn({ error, inputPath }, 'Remux video gagal, fallback transcode');

    return await transcodeVideo(inputPath, metadata);
  }
}

async function transcodeVideo(
  inputPath: string,
  metadata: VideoMetadata | undefined,
): Promise<string> {
  const outputPath = await createTempFilePath('.mp4');

  try {
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

    await logNormalizeResult({
      inputPath,
      outputPath,
      metadata,
      normalizeMode: 'transcode',
    });

    return outputPath;
  } catch (error) {
    await removeTempFile(outputPath);
    throw error;
  }
}

async function logNormalizeResult(params: {
  inputPath: string;
  outputPath: string;
  metadata: VideoMetadata | undefined;
  normalizeMode: 'remux' | 'transcode';
}): Promise<void> {
  const outputStats = await stat(params.outputPath);

  logger.info(
    {
      normalizeMode: params.normalizeMode,
      inputPath: params.inputPath,
      outputPath: params.outputPath,
      inputVideoCodec: params.metadata?.videoCodec,
      inputAudioCodec: params.metadata?.audioCodec,
      inputPixelFormat: params.metadata?.pixelFormat,
      inputWidth: params.metadata?.width,
      inputHeight: params.metadata?.height,
      outputSize: outputStats.size,
    },
    'Video berhasil diproses untuk WhatsApp',
  );
}

function runFfprobe(args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn('ffprobe', args, {
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
      reject(normalizeFfmpegError(error));
    });
    child.on('close', (code) => {
      const stdout = Buffer.concat(stdoutChunks).toString('utf8').trim();

      if (code === 0) {
        resolve(stdout);
        return;
      }

      const stderr = Buffer.concat(stderrChunks).toString('utf8').trim();

      reject(new Error(`ffprobe gagal: ${stderr.slice(0, stderrLimit) || `exit code ${code ?? 'unknown'}`}`));
    });
  });
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

function isMissingFfmpegError(error: unknown): boolean {
  return error instanceof Error && error.message === 'ffmpeg belum terinstall';
}

function normalizeFfmpegError(error: Error): Error {
  if ('code' in error && error.code === 'ENOENT') {
    return new Error('ffmpeg belum terinstall');
  }

  return error;
}
