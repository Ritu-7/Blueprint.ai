import { NextRequest, NextResponse } from 'next/server';
import { apiError } from './response';
import { logger } from '../logger/logger';

// ── In-memory rate limiting bucket ──────────────────────────────────────────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

/**
 * Enforces rate limiting per client IP or user ID (default: max 60 requests per minute).
 */
export function checkRateLimit(req: NextRequest, maxRequests = 60, windowMs = 60_000): { allowed: boolean; remaining: number; resetMs: number } {
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'anonymous';
  const now = Date.now();

  const current = rateLimitMap.get(ip) ?? { count: 0, resetAt: now + windowMs };

  if (now > current.resetAt) {
    current.count = 1;
    current.resetAt = now + windowMs;
  } else {
    current.count += 1;
  }

  rateLimitMap.set(ip, current);

  const remaining = Math.max(0, maxRequests - current.count);
  const allowed = current.count <= maxRequests;
  const resetMs = Math.max(0, current.resetAt - now);

  if (!allowed) {
    logger.warn(`Rate limit exceeded for client ${ip} (${current.count}/${maxRequests})`, 'rateLimit');
  }

  return { allowed, remaining, resetMs };
}

/**
 * Creates a unique Request ID for API tracing.
 */
export function getOrCreateRequestId(req: NextRequest): string {
  const existing = req.headers.get('x-request-id');
  if (existing) return existing;
  return `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Wraps an API fetch call with an AbortController timeout (default: 25 seconds).
 */
export async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 25_000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return res;
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error(`API request timed out after ${timeoutMs / 1000}s: ${url}`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Retries an async function up to maxRetries times with exponential backoff.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  initialDelayMs = 500
): Promise<T> {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      return await fn();
    } catch (err: unknown) {
      attempt++;
      if (attempt >= maxRetries) throw err;
      const delay = initialDelayMs * Math.pow(2, attempt - 1);
      logger.warn(`Retry attempt ${attempt}/${maxRetries} after ${delay}ms`, 'retry');
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw new Error('Retries exhausted');
}
