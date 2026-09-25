/**
 * QueueService — background job queue.
 *
 * Public API is identical to the previous in-memory implementation so no
 * callers need to change. Internally the job state is backed by Redis (via
 * JobStore) when REDIS_URL is present, or by the in-memory fallback when it
 * is not.
 *
 * The in-process loop (processQueue) runs as before for the Next.js web
 * server (handles BLUEPRINT_GENERATION / quick jobs). Long-running jobs
 * (REPOSITORY_ANALYSIS, EMBEDDING_GENERATION, CODE_REVIEW) are dequeued and
 * executed by the standalone worker process (client/worker.ts) when running
 * in a multi-container deployment.
 */

import { logger } from '@/lib/logger/logger';
import { JobStore } from '@/lib/redis/redisJobStore';
import { CodebaseAnalysisService } from '@/services/codebaseAnalysisService';
import { RagService } from '@/services/ragService';
import { CodeReviewService } from '@/services/codeReviewService';
import { AIService } from '@/services/aiService';
import type {
  CreateJobInput,
  JobStatus,
  JobState,
  JobType,
} from '@/validators/queue';

function createJobId(): string {
  return `job-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

// Track whether the in-process queue loop is running so we don't start it twice.
let isProcessingQueue = false;

export class QueueService {
  /**
   * Enqueues a new background job and returns immediately (non-blocking HTTP 202).
   * The job is stored in Redis (or in-memory) and the in-process loop is kicked
   * off via setImmediate so the HTTP response is not blocked.
   */
  static async enqueueJob(input: CreateJobInput): Promise<JobStatus> {
    const id = createJobId();
    const job: JobStatus = {
      id,
      projectId: input.projectId,
      type: input.type,
      state: 'QUEUED',
      progress: 0,
      attemptsMade: 0,
      maxRetries: input.maxRetries ?? 3,
      createdAt: new Date().toISOString(),
      logs: [
        {
          timestamp: new Date().toISOString(),
          progress: 0,
          message: `Job ${id} (${input.type}) queued.`,
        },
      ],
    };

    await JobStore.set(job);
    await JobStore.enqueue(id);

    logger.info(`Queued background job ${id} [${input.type}]`, 'queueService');

    // Kick off the in-process loop in a microtask so the awaited enqueueJob
    // returns before any work starts (preserving the non-blocking HTTP 202 contract).
    setImmediate(() => {
      QueueService.processQueue(input.payload).catch((err) => {
        logger.error(`processQueue error: ${err instanceof Error ? err.message : err}`, 'queueService');
      });
    });

    return job;
  }

  /**
   * Updates job progress, state, or log entry.
   * Fire-and-forget — callers do not need to await.
   */
  static updateProgress(id: string, progress: number, message: string, state?: JobState): void {
    // Run async update without blocking callers
    JobStore.get(id).then(async (job) => {
      if (!job) return;
      const clampedProgress = Math.min(100, Math.max(0, progress));
      await JobStore.update(id, {
        progress: clampedProgress,
        state: state ?? job.state,
        logs: [
          ...job.logs,
          {
            timestamp: new Date().toISOString(),
            progress: clampedProgress,
            message,
          },
        ],
      });
      logger.info(`[Job ${id}] ${clampedProgress}% - ${message}`, 'queueService');
    }).catch((err) => {
      logger.error(`updateProgress error for ${id}: ${err instanceof Error ? err.message : err}`, 'queueService');
    });
  }

  /**
   * Background Queue Worker Loop (in-process).
   * Processes jobs from the queue until it is empty, then exits.
   * The standalone worker process runs its own equivalent loop.
   */
  static async processQueue(payload: Record<string, unknown>): Promise<void> {
    if (isProcessingQueue) return;
    isProcessingQueue = true;

    try {
      let jobId = await JobStore.dequeueOne();
      while (jobId) {
        await QueueService.runJob(jobId, payload);
        jobId = await JobStore.dequeueOne();
      }
    } finally {
      isProcessingQueue = false;
    }
  }

  /**
   * Executes a single job with retry logic.
   * Shared between the in-process loop and the standalone worker.
   */
  static async runJob(jobId: string, payload: Record<string, unknown>): Promise<void> {
    const job = await JobStore.get(jobId);
    if (!job) return;

    await JobStore.update(jobId, {
      state: 'PROCESSING',
      startedAt: new Date().toISOString(),
      attemptsMade: job.attemptsMade + 1,
    });

    const attempt = job.attemptsMade + 1;
    QueueService.updateProgress(jobId, 5, `Attempt ${attempt}/${job.maxRetries} started.`);

    try {
      const result = await QueueService.executeWorker(job.type, payload, (p, msg) => {
        QueueService.updateProgress(jobId, p, msg);
      });

      await JobStore.update(jobId, {
        state: 'COMPLETED',
        progress: 100,
        result,
        completedAt: new Date().toISOString(),
      });
      QueueService.updateProgress(jobId, 100, `Job ${jobId} completed successfully.`, 'COMPLETED');
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Unknown execution failure';
      logger.error(`Job ${jobId} failed on attempt ${attempt}: ${errMsg}`, 'queueService');

      const refreshed = await JobStore.get(jobId);
      const attemptsMade = refreshed?.attemptsMade ?? attempt;
      const maxRetries = refreshed?.maxRetries ?? job.maxRetries;

      if (attemptsMade < maxRetries) {
        await JobStore.update(jobId, { state: 'QUEUED' });
        QueueService.updateProgress(
          jobId,
          refreshed?.progress ?? 5,
          `Attempt ${attemptsMade} failed: ${errMsg}. Retrying...`,
          'QUEUED'
        );
        // Exponential back-off before re-queuing
        await new Promise((r) => setTimeout(r, Math.pow(2, attemptsMade) * 1000));
        await JobStore.enqueue(jobId);
      } else {
        await JobStore.update(jobId, {
          state: 'FAILED',
          error: errMsg,
          completedAt: new Date().toISOString(),
        });
        QueueService.updateProgress(
          jobId,
          refreshed?.progress ?? 5,
          `Job failed permanently after ${attemptsMade} attempts: ${errMsg}`,
          'FAILED'
        );
      }
    }
  }

  /**
   * Worker Execution Router for expensive operations.
   * Also exported so the standalone worker.ts can call it directly.
   */
  static async executeWorker(
    type: JobType,
    payload: Record<string, unknown>,
    progressCallback: (progress: number, message: string) => void
  ): Promise<unknown> {
    switch (type) {
      case 'REPOSITORY_ANALYSIS': {
        progressCallback(10, 'Fetching repository tree...');
        const owner = String(payload.owner || '');
        const repo = String(payload.repo || '');
        const branch = String(payload.branch || 'main');
        const projectId = payload.projectId ? String(payload.projectId) : undefined;

        const analysisJobId = CodebaseAnalysisService.startAnalysis({ owner, repo, branch, projectId });
        progressCallback(50, 'AI analyzing code structure...');

        let attempts = 0;
        while (attempts < 60) {
          await new Promise((r) => setTimeout(r, 2000));
          const subJob = CodebaseAnalysisService.getJob(analysisJobId);
          if (subJob?.status === 'complete') return subJob.result;
          if (subJob?.status === 'failed') throw new Error(subJob.error || 'Repository analysis failed');
          if (subJob) progressCallback(subJob.progress, subJob.progressMessage);
          attempts++;
        }
        throw new Error('Repository analysis timed out');
      }

      case 'EMBEDDING_GENERATION': {
        progressCallback(10, 'Parsing code files into chunks...');
        const owner = String(payload.owner || '');
        const repo = String(payload.repo || '');
        const branch = String(payload.branch || 'main');
        const projectId = String(payload.projectId || '00000000-0000-0000-0000-000000000000');

        progressCallback(40, 'Generating vector embeddings...');
        const result = await RagService.indexRepository({ projectId, owner, repo, branch });
        progressCallback(90, `Indexed ${result.filesProcessed} files into ${result.chunksStored} vectors.`);
        return result;
      }

      case 'BLUEPRINT_GENERATION': {
        progressCallback(20, 'Analyzing product requirements...');
        const prompt = String(payload.prompt || 'Full-stack application');
        const blueprint = await AIService.generateProject(prompt);
        progressCallback(80, 'Validating structured 12-section model against Zod schema...');
        return blueprint;
      }

      case 'CODE_REVIEW': {
        progressCallback(15, 'Fetching diff and security rules...');
        const owner = String(payload.owner || '');
        const repo = String(payload.repo || '');
        const branch = String(payload.branch || 'main');
        const targetType = (payload.targetType as any) || 'repository';

        const reviewJobId = CodeReviewService.startReview({
          owner,
          repo,
          branch,
          targetType,
          projectId: payload.projectId ? String(payload.projectId) : undefined,
        });

        let attempts = 0;
        while (attempts < 60) {
          await new Promise((r) => setTimeout(r, 2000));
          const subJob = CodeReviewService.getJob(reviewJobId);
          if (subJob?.status === 'complete') return subJob.result;
          if (subJob?.status === 'failed') throw new Error(subJob.error || 'Code review failed');
          if (subJob) progressCallback(subJob.progress, subJob.progressMessage);
          attempts++;
        }
        throw new Error('Code review timed out');
      }

      default:
        throw new Error(`Unsupported worker job type: ${type}`);
    }
  }

  /** Retrieves job status and logs. */
  static async getJob(id: string): Promise<JobStatus | null> {
    return JobStore.get(id);
  }

  /** Lists jobs optionally filtered by project or state. */
  static async listJobs(projectId?: string, state?: JobState): Promise<JobStatus[]> {
    return JobStore.list(projectId, state);
  }
}
