import { logger } from '../../utils/logger.js';

const maxPendingJobs = 5;

type QueueItem = {
  job: () => Promise<unknown>;
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
};

export type HdAiQueueResult<T> =
  | {
      status: 'queued';
      position: number;
      result: Promise<T>;
    }
  | {
      status: 'full';
    };

const queue: QueueItem[] = [];
let isRunning = false;

export function enqueueHdAiJob<T>(job: () => Promise<T>): HdAiQueueResult<T> {
  if (queue.length >= maxPendingJobs) {
    return {
      status: 'full',
    };
  }

  const position = queue.length + (isRunning ? 2 : 1);
  const result = new Promise<T>((resolve, reject) => {
    queue.push({
      job,
      resolve: (value) => resolve(value as T),
      reject,
    });
  });

  void processQueue();

  return {
    status: 'queued',
    position,
    result,
  };
}

export function getHdAiQueueStatus(): { running: boolean; pending: number } {
  return {
    running: isRunning,
    pending: queue.length,
  };
}

export function clearHdAiQueueForTests(): void {
  queue.splice(0, queue.length);
  isRunning = false;
}

async function processQueue(): Promise<void> {
  if (isRunning) return;

  const item = queue.shift();
  if (!item) return;

  isRunning = true;

  try {
    const value = await item.job();
    item.resolve(value);
  } catch (error) {
    item.reject(error);
  } finally {
    isRunning = false;

    logger.debug(
      {
        pending: queue.length,
      },
      'HD AI queue memproses job berikutnya',
    );

    void processQueue();
  }
}
