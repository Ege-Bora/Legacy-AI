import { Worker } from 'bullmq';
import Redis from 'ioredis';
import pino from 'pino';
import dotenv from 'dotenv';
import path from 'path';
import type { SttJobData, ChapterDraftJobData, ExportJobData } from '@life/shared';

dotenv.config({ path: path.join(__dirname, '../../../.env') });

const logger = pino({
  level: 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
    },
  },
});

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

const connection = new Redis(REDIS_URL, {
  maxRetriesPerRequest: null,
});

// STT Processor
async function sttProcessor(job: any) {
  const data: SttJobData = job.data;
  logger.info(`Processing STT job ${job.id} for memo ${data.memoId}`);
  
  try {
    // Mock processing - in real implementation, call Aqua API
    if (process.env.AQUA_API_KEY) {
      logger.info('Using real Aqua STT service');
      // TODO: Implement real Aqua API call
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
    } else {
      logger.info('Using mock STT service');
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate processing
    }
    
    return {
      transcript: 'Processed transcript text would appear here',
      confidence: 0.95,
      language: data.language || 'en',
    };
  } catch (error) {
    logger.error(`STT job ${job.id} failed:`, error);
    throw error;
  }
}

// Chapter Draft Processor
async function chapterDraftProcessor(job: any) {
  const data: ChapterDraftJobData = job.data;
  logger.info(`Processing chapter draft job ${job.id} for memos ${data.memoIds.join(', ')}`);
  
  try {
    if (process.env.OPENAI_API_KEY) {
      logger.info('Using real OpenAI service');
      // TODO: Implement real OpenAI API call
      await new Promise(resolve => setTimeout(resolve, 3000)); // Simulate API call
    } else {
      logger.info('Using mock chapter drafting');
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate processing
    }
    
    return {
      chapterId: `chapter-${Date.now()}`,
      title: 'Generated Chapter Title',
      content: 'This would be the AI-generated chapter content based on the provided memos.',
    };
  } catch (error) {
    logger.error(`Chapter draft job ${job.id} failed:`, error);
    throw error;
  }
}

// Export Processor
async function exportProcessor(job: any) {
  const data: ExportJobData = job.data;
  logger.info(`Processing export job ${job.id} for ${data.type} with chapters ${data.chapterIds.join(', ')}`);
  
  try {
    // Mock export processing
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate export generation
    
    const exportPath = `/tmp/export-${job.id}.${data.type}`;
    logger.info(`Export completed: ${exportPath}`);
    
    return {
      exportPath,
      downloadUrl: `http://localhost:8080/downloads/${job.id}.${data.type}`,
    };
  } catch (error) {
    logger.error(`Export job ${job.id} failed:`, error);
    throw error;
  }
}

// Create workers
const sttWorker = new Worker('stt', sttProcessor, {
  connection,
  concurrency: 2,
});

const chapterWorker = new Worker('chapterDraft', chapterDraftProcessor, {
  connection,
  concurrency: 1,
});

const exportWorker = new Worker('export', exportProcessor, {
  connection,
  concurrency: 1,
});

// Error handlers
sttWorker.on('failed', (job, err) => {
  logger.error(`STT job ${job?.id} failed:`, err.message);
});

chapterWorker.on('failed', (job, err) => {
  logger.error(`Chapter job ${job?.id} failed:`, err.message);
});

exportWorker.on('failed', (job, err) => {
  logger.error(`Export job ${job?.id} failed:`, err.message);
});

// Success handlers
sttWorker.on('completed', (job) => {
  logger.info(`STT job ${job.id} completed successfully`);
});

chapterWorker.on('completed', (job) => {
  logger.info(`Chapter job ${job.id} completed successfully`);
});

exportWorker.on('completed', (job) => {
  logger.info(`Export job ${job.id} completed successfully`);
});

// Graceful shutdown
const signals = ['SIGINT', 'SIGTERM'];
signals.forEach((signal) => {
  process.on(signal, async () => {
    logger.info(`Received ${signal}, shutting down gracefully...`);
    await Promise.all([
      sttWorker.close(),
      chapterWorker.close(),
      exportWorker.close(),
    ]);
    await connection.quit();
    process.exit(0);
  });
});

logger.info('Worker started successfully with processors: stt, chapterDraft, export');
