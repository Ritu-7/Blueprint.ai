/**
 * Redis-backed job store with transparent in-memory fallback.
 *
 * Redis layout
 * ────────────
 *  Hash  blueprint:jobs:<jobId>   — all JobStatus fields (JSON-serialised `result`)
 *  List  blueprint:queue          — LPUSH to enqueue, BRPOP/RPOP to dequeue (FIFO)
 *
 * When Redis is not available the module falls back to plain in-memory maps so
 * local dev with no Redis still works — with a visible warning.
 */

import { initRedis } from './redisClient';
import type { JobStatus, JobState, JobLogEntry } from '@/validators/queue';

// ── Keys ──────────────────────────────────────────────────────────────────────
const JOB_KEY = (id: string) => `blueprint:jobs:${id}`;
const QUEUE_KEY = 'blueprint:queue';
/** Seconds before a completed/failed job is auto-expired from Redis. Default 24 h. */
const JOB_TTL_SECONDS = 24 * 60 * 60;

// ── In-memory fallback ────────────────────────────────────────────────────────
const memStore: Record<string, JobStatus> = {};
const memQueue: string[] = [];

// ── Serialisation helpers ─────────────────────────────────────────────────────

function serialise(job: JobStatus): Record<string, string> {
  return {
    id: job.id,
    projectId: job.projectId ?? '',
    type: job.type,
    state: job.state,
    progress: String(job.progress),
    attemptsMade: String(job.attemptsMade),
    maxRetries: String(job.maxRetries),
    error: job.error ?? '',
    result: job.result !== undefined ? JSON.stringify(job.result) : '',
    createdAt: job.createdAt,
    startedAt: job.startedAt ?? '',
    completedAt: job.completedAt ?? '',
    logs: JSON.stringify(job.logs),
  };
}

function deserialise(raw: Record<string, string>): JobStatus {
  return {
    id: raw.id,
    projectId: raw.projectId || undefined,
    type: raw.type as JobStatus['type'],
    state: raw.state as JobState,
    progress: Number(raw.progress),
    attemptsMade: Number(raw.attemptsMade),
    maxRetries: Number(raw.maxRetries),
    error: raw.error || undefined,
    result: raw.result ? (JSON.parse(raw.result) as unknown) : undefined,
    createdAt: raw.createdAt,
    startedAt: raw.startedAt || undefined,
    completedAt: raw.completedAt || undefined,
    logs: raw.logs ? (JSON.parse(raw.logs) as JobLogEntry[]) : [],
  };
}

// ── Public API ────────────────────────────────────────────────────────────────

export const JobStore = {
  /** Persist a new or updated job. */
  async set(job: JobStatus): Promise<void> {
    const redis = await initRedis();
    if (!redis) {
      memStore[job.id] = job;
      return;
    }
    const fields = serialise(job);
    const flatArgs: string[] = [];
    for (const [k, v] of Object.entries(fields)) {
      flatArgs.push(k, v);
    }
    await redis.hset(JOB_KEY(job.id), ...flatArgs);
    await redis.expire(JOB_KEY(job.id), JOB_TTL_SECONDS);
  },

  /** Retrieve a job by id. Returns null if not found. */
  async get(id: string): Promise<JobStatus | null> {
    const redis = await initRedis();
    if (!redis) return memStore[id] ?? null;

    const raw = await redis.hgetall(JOB_KEY(id));
    if (!raw || !raw.id) return null;
    return deserialise(raw as Record<string, string>);
  },

  /** Update a subset of fields on an existing job (reads, merges, writes). */
  async update(id: string, patch: Partial<JobStatus>): Promise<void> {
    const existing = await JobStore.get(id);
    if (!existing) return;
    const merged: JobStatus = { ...existing, ...patch };
    await JobStore.set(merged);
  },

  /** Append a log entry without a full re-read (appends to in-memory array then writes). */
  async appendLog(id: string, entry: JobLogEntry): Promise<void> {
    const redis = await initRedis();
    if (!redis) {
      const job = memStore[id];
      if (job) job.logs.push(entry);
      return;
    }
    const existing = await JobStore.get(id);
    if (!existing) return;
    existing.logs.push(entry);
    await JobStore.set(existing);
  },

  /** Push a jobId onto the work queue (FIFO). */
  async enqueue(jobId: string): Promise<void> {
    const redis = await initRedis();
    if (!redis) {
      memQueue.push(jobId);
      return;
    }
    await redis.lpush(QUEUE_KEY, jobId);
  },

  /**
   * Non-blocking dequeue — pops one jobId or returns null.
   * Used by the Next.js in-process loop.
   */
  async dequeueOne(): Promise<string | null> {
    const redis = await initRedis();
    if (!redis) return memQueue.shift() ?? null;
    const result = await redis.rpop(QUEUE_KEY);
    return result ?? null;
  },

  /**
   * Blocking dequeue — waits up to `timeoutSec` for a job.
   * Used by the standalone worker process.
   * Returns null on timeout.
   */
  async blockingDequeue(timeoutSec = 5): Promise<string | null> {
    const redis = await initRedis();
    if (!redis) {
      return memQueue.shift() ?? null;
    }
    const result = await redis.brpop(QUEUE_KEY, timeoutSec);
    return result ? result[1] : null;
  },

  /** List all jobs, optionally filtered. */
  async list(projectId?: string, state?: JobState): Promise<JobStatus[]> {
    const redis = await initRedis();

    let jobs: JobStatus[];

    if (!redis) {
      jobs = Object.values(memStore);
    } else {
      const keys: string[] = [];
      let cursor = '0';
      do {
        const [nextCursor, batch] = await redis.scan(
          cursor,
          'MATCH',
          'blueprint:jobs:*',
          'COUNT',
          200
        );
        cursor = nextCursor;
        keys.push(...batch);
      } while (cursor !== '0');

      jobs = (
        await Promise.all(
          keys.map(async (key) => {
            const raw = await redis.hgetall(key);
            if (!raw || !raw.id) return null;
            return deserialise(raw as Record<string, string>);
          })
        )
      ).filter((j): j is JobStatus => j !== null);
    }

    jobs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    if (projectId) jobs = jobs.filter((j) => j.projectId === projectId);
    if (state) jobs = jobs.filter((j) => j.state === state);
    return jobs;
  },

  /** Remove a job entirely (used by tests / cleanup). */
  async delete(id: string): Promise<void> {
    const redis = await initRedis();
    if (!redis) {
      delete memStore[id];
      return;
    }
    await redis.del(JOB_KEY(id));
  },

  /** How many items are currently in the queue (approximate). */
  async queueDepth(): Promise<number> {
    const redis = await initRedis();
    if (!redis) return memQueue.length;
    return redis.llen(QUEUE_KEY);
  },
};
