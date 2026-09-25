/**
 * Blueprint.ai — Standalone Background Worker
 *
 * Runs independently of the Next.js web server as a separate Node.js process.
 * Connects to Redis, dequeues jobs from `blueprint:queue` via BRPOP (blocking
 * pop, FIFO order), and dispatches each job to the same QueueService.runJob
 * logic used by the in-process queue loop.
 *
 * Run locally:  npm run worker:start          (uses tsx, no compilation needed)
 * Watch mode:   npm run worker:dev
 * In Docker:    npx tsx src/worker.ts         (see docker-compose.yml worker service)
 *
 * Required env vars for full functionality:
 *   REDIS_URL                      — Redis connection string (e.g. redis://localhost:6379)
 *   GOOGLE_GENERATIVE_AI_API_KEY   — For BLUEPRINT_GENERATION / CODE_REVIEW jobs
 *   GITHUB_TOKEN                   — For REPOSITORY_ANALYSIS / EMBEDDING_GENERATION jobs
 *   SUPABASE_SERVICE_ROLE_KEY      — For EMBEDDING_GENERATION jobs (vector storage)
 *   NODE_ENV                       — 'production' | 'development'
 *
 * If REDIS_URL is not set the worker still starts but operates on an in-memory
 * queue that is not shared with the web server. A prominent warning is emitted.
 */

import { initRedis, closeRedisClient } from '@/lib/redis/redisClient';
import { JobStore } from '@/lib/redis/redisJobStore';
import { QueueService } from '@/services/queueService';

// ── Constants ─────────────────────────────────────────────────────────────────
const TAG = '[worker]';
/** How long BRPOP waits before timing out and looping again. */
const BLOCKING_TIMEOUT_SEC = 5;

// ── State ─────────────────────────────────────────────────────────────────────
let isRunning = true;

// ── Graceful shutdown ─────────────────────────────────────────────────────────
async function shutdown(signal: string): Promise<void> {
  console.log(`${TAG} Received ${signal}. Shutting down gracefully...`);
  isRunning = false;
  try {
    await closeRedisClient();
  } catch {
    // ignore close errors during shutdown
  }
  process.exit(0);
}

process.on('SIGTERM', () => { shutdown('SIGTERM').catch(console.error); });
process.on('SIGINT',  () => { shutdown('SIGINT').catch(console.error); });

process.on('uncaughtException', (err: Error) => {
  console.error(`${TAG} Uncaught exception (worker continues):`, err.message);
});
process.on('unhandledRejection', (reason: unknown) => {
  console.error(`${TAG} Unhandled rejection (worker continues):`, reason);
});

// ── Startup ───────────────────────────────────────────────────────────────────
async function main(): Promise<void> {
  console.log(`${TAG} Blueprint.ai background worker starting...`);
  console.log(`${TAG} NODE_ENV  = ${process.env.NODE_ENV ?? 'not set'}`);
  console.log(`${TAG} REDIS_URL = ${process.env.REDIS_URL ? 'set' : 'NOT SET — in-memory fallback active'}`);

  const redis = await initRedis();
  if (redis) {
    // Wait for Redis to be ready before entering the loop
    await new Promise<void>((resolve, reject) => {
      redis.once('ready', resolve);
      redis.once('error', reject);
      // If already connected, 'ready' may have fired — check status
      if ((redis as any).status === 'ready') resolve();
    });
    console.log(`${TAG} Redis ready. Listening on blueprint:queue ...`);
  } else {
    console.warn(
      `${TAG} WARNING: No Redis connection. The worker will dequeue from the ` +
      'shared in-memory store, but jobs enqueued by the web server live in a ' +
      'SEPARATE in-memory store. This mode is only useful for local debugging.'
    );
  }

  // ── Main BRPOP / dequeue loop ──────────────────────────────────────────────
  while (isRunning) {
    try {
      const jobId = await JobStore.blockingDequeue(BLOCKING_TIMEOUT_SEC);

      if (!jobId) {
        // BRPOP timed out — loop back and wait again
        continue;
      }

      const job = await JobStore.get(jobId);
      if (!job) {
        console.warn(`${TAG} Dequeued jobId "${jobId}" but no job record found — skipping.`);
        continue;
      }

      console.log(
        `${TAG} ▶ Starting job ${jobId} [${job.type}]` +
        ` attempt=${job.attemptsMade + 1}/${job.maxRetries}`
      );

      await QueueService.runJob(jobId, {});

      const updated = await JobStore.get(jobId);
      if (updated) {
        const icon = updated.state === 'COMPLETED' ? '✓' : updated.state === 'FAILED' ? '✗' : '↺';
        console.log(
          `${TAG} ${icon} Job ${jobId} → state=${updated.state} progress=${updated.progress}%`
        );
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`${TAG} Error in dequeue loop: ${msg}`);
      // Brief back-off to avoid spin-looping on persistent Redis errors
      await sleep(1000);
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

main().catch((err: unknown) => {
  console.error(`${TAG} Fatal startup error:`, err);
  process.exit(1);
});
