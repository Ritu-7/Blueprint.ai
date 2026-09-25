/**
 * Singleton ioredis client.
 *
 * Returns `null` when REDIS_URL is not set so the application can fall back to
 * in-memory state for local development without requiring Redis.
 *
 * Import this everywhere you need Redis — do NOT create additional clients.
 */

import type { Redis as RedisType } from 'ioredis';

let _client: RedisType | null = null;
let _warned = false;

export async function getRedisClientAsync(): Promise<RedisType | null> {
  const url = process.env.REDIS_URL;

  if (!url) {
    if (!_warned) {
      console.warn(
        '[redis] REDIS_URL is not set — falling back to in-memory store. ' +
          'Jobs will not survive restarts and cannot be shared across processes.'
      );
      _warned = true;
    }
    return null;
  }

  if (_client) return _client;

  const { default: Ioredis } = await import('ioredis');

  _client = new Ioredis(url, {
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    lazyConnect: false,
    // Reconnect with exponential back-off, cap at 10 s
    retryStrategy: (times: number) => Math.min(times * 200, 10_000),
  });

  _client.on('error', (err: Error) => {
    console.error('[redis] Connection error:', err.message);
  });

  _client.on('ready', () => {
    console.log('[redis] Connected successfully.');
  });

  return _client;
}

/**
 * Synchronous accessor — returns null if client hasn't been initialised yet.
 * Callers that need to initialise should use getRedisClientAsync() once at
 * startup, then getRedisClient() for subsequent reads.
 */
export function getRedisClient(): RedisType | null {
  const url = process.env.REDIS_URL;
  if (!url) {
    if (!_warned) {
      console.warn(
        '[redis] REDIS_URL is not set — falling back to in-memory store. ' +
          'Jobs will not survive restarts and cannot be shared across processes.'
      );
      _warned = true;
    }
    return null;
  }
  return _client;
}

/** Gracefully close the connection — call from worker shutdown handler. */
export async function closeRedisClient(): Promise<void> {
  if (_client) {
    await _client.quit();
    _client = null;
  }
}

/**
 * Ensures Redis is connected and returns the client.
 * Call once at worker/server startup. Returns null if REDIS_URL is unset.
 */
export async function initRedis(): Promise<RedisType | null> {
  return getRedisClientAsync();
}
