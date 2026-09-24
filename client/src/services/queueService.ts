import { logger } from '@/lib/logger/logger';
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

const jobStore: Record<string, JobStatus> = {};
const pendingQueue: string[] = [];
let isProcessingQueue = false;

function createJobId(): string {
  return `job-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export class QueueService {
  /**
   * Enqueues a new background job and returns immediately (non-blocking HTTP 202).
   */
  static enqueueJob(input: CreateJobInput): JobStatus {
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

    jobStore[id] = job;
    pendingQueue.push(id);

    logger.info(`Queued background job ${id} [${input.type}]`, 'queueService');

    // Trigger async processing loop in background
    setImmediate(() => QueueService.processQueue(input.payload));

    return job;
  }

  /**
   * Updates job progress, state, or log entry.
   */
  static updateProgress(id: string, progress: number, message: string, state?: JobState) {
    const job = jobStore[id];
    if (!job) return;

    job.progress = Math.min(100, Math.max(0, progress));
    if (state) job.state = state;
    job.logs.push({
      timestamp: new Date().toISOString(),
      progress: job.progress,
      message,
    });

    logger.info(`[Job ${id}] ${job.progress}% - ${message}`, 'queueService');
  }

  /**
   * Background Queue Worker Loop.
   */
  private static async processQueue(payload: Record<string, unknown>) {
    if (isProcessingQueue) return;
    isProcessingQueue = true;

    while (pendingQueue.length > 0) {
      const jobId = pendingQueue.shift();
      if (!jobId) continue;

      const job = jobStore[jobId];
      if (!job) continue;

      job.state = 'PROCESSING';
      job.startedAt = new Date().toISOString();
      job.attemptsMade += 1;
      QueueService.updateProgress(jobId, 5, `Attempt ${job.attemptsMade}/${job.maxRetries} started.`);

      try {
        const result = await QueueService.executeWorker(job.type, payload, (p, msg) => {
          QueueService.updateProgress(jobId, p, msg);
        });

        job.state = 'COMPLETED';
        job.progress = 100;
        job.result = result;
        job.completedAt = new Date().toISOString();
        QueueService.updateProgress(jobId, 100, `Job ${jobId} completed successfully.`, 'COMPLETED');
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : 'Unknown execution failure';
        logger.error(`Job ${jobId} failed on attempt ${job.attemptsMade}: ${errMsg}`, 'queueService');

        if (job.attemptsMade < job.maxRetries) {
          job.state = 'QUEUED';
          QueueService.updateProgress(jobId, job.progress, `Attempt ${job.attemptsMade} failed: ${errMsg}. Retrying...`, 'QUEUED');
          // Re-queue with exponential backoff
          await new Promise((r) => setTimeout(r, Math.pow(2, job.attemptsMade) * 1000));
          pendingQueue.push(jobId);
        } else {
          job.state = 'FAILED';
          job.error = errMsg;
          job.completedAt = new Date().toISOString();
          QueueService.updateProgress(jobId, job.progress, `Job failed permanently after ${job.attemptsMade} attempts: ${errMsg}`, 'FAILED');
        }
      }
    }

    isProcessingQueue = false;
  }

  /**
   * Worker Execution Router for expensive operations.
   */
  private static async executeWorker(
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

        // Poll until analysis service completes
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
        const blueprint = AIService.generateProject(prompt);
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

  /**
   * Retrieves job status and logs.
   */
  static getJob(id: string): JobStatus | null {
    return jobStore[id] ?? null;
  }

  /**
   * Lists jobs optionally filtered by project or state.
   */
  static listJobs(projectId?: string, state?: JobState): JobStatus[] {
    let all = Object.values(jobStore).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    if (projectId) all = all.filter((j) => j.projectId === projectId);
    if (state) all = all.filter((j) => j.state === state);

    return all;
  }
}
