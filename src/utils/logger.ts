import pino from 'pino';

import { env } from '../config/env.js';

type SerializableError = Error & {
  cause?: unknown;
  code?: string;
  response?: {
    data?: unknown;
    status?: number;
  };
  status?: number;
};

function serializeUnknownError(value: unknown): unknown {
  if (value instanceof Error) {
    const error = value as SerializableError;

    return {
      type: error.name,
      message: error.message,
      stack: error.stack,
      code: error.code,
      status: error.status ?? error.response?.status,
      responseData: error.response?.data,
      cause: error.cause instanceof Error ? serializeUnknownError(error.cause) : error.cause,
    };
  }

  return value;
}

export const logger = pino({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  base: {
    service: env.BOT_NAME,
  },
  serializers: {
    err: serializeUnknownError,
    error: serializeUnknownError,
    reason: serializeUnknownError,
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});
