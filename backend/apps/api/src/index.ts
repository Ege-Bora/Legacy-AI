import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import { Queue } from 'bullmq';
import Redis from 'ioredis';
import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import { authRoutes } from './routes/auth';
import type {
  MemoUploadSchema,
  TranscribeRequestSchema,
  ChapterDraftRequestSchema,
  ExportRequestSchema,
  MemoUploadResponse,
  TranscribeResponse,
  TimelineItem,
  ChapterDraftResponse,
  ExportResponse,
  SttJobData,
  ChapterDraftJobData,
  ExportJobData
} from '@life/shared';

dotenv.config({ path: path.join(__dirname, '../../../.env') });

const PORT = parseInt(process.env.PORT || '8080');
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

const app = Fastify({
  logger: {
    level: 'info',
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
      },
    },
  },
});

// Redis connection for queues
const redis = new Redis(REDIS_URL, { maxRetriesPerRequest: null });

// Job queues
const sttQueue = new Queue<SttJobData>('stt', { connection: redis });
const chapterQueue = new Queue<ChapterDraftJobData>('chapterDraft', { connection: redis });
const exportQueue = new Queue<ExportJobData>('export', { connection: redis });

// Register plugins
app.register(cors, { origin: true });
app.register(multipart);

// Register auth routes
app.register(authRoutes);

// Health endpoint
app.get('/health', async (request, reply) => {
  return {
    ok: true,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  };
});

// Memo upload endpoint
app.post('/memos/upload', async (request, reply) => {
  try {
    const data = await request.file();
    if (!data) {
      return reply.status(400).send({ error: 'No file uploaded' });
    }

    const fields = data.fields as any;
    const durationMs = parseInt(fields.durationMs?.value || '0');
    const locale = fields.locale?.value || 'en';

    // Save file to /tmp
    const memoId = uuidv4();
    const filename = `${memoId}.${data.filename?.split('.').pop() || 'audio'}`;
    const filePath = path.join('/tmp', filename);
    
    // Stream file to disk
    const writeStream = require('fs').createWriteStream(filePath);
    await new Promise((resolve, reject) => {
      data.file.pipe(writeStream);
      data.file.on('end', resolve);
      data.file.on('error', reject);
    });

    const response: MemoUploadResponse = {
      id: memoId,
      url: filePath,
      durationMs,
      locale,
    };

    return response;
  } catch (error) {
    app.log.error(error);
    return reply.status(500).send({ error: 'Upload failed' });
  }
});

// Transcribe endpoint
app.post('/memos/transcribe', async (request, reply) => {
  try {
    const body = request.body as any;
    const { memoId, provider, language } = body;

    if (!memoId) {
      return reply.status(400).send({ error: 'memoId is required' });
    }

    // Check if we have real provider credentials
    const hasAquaKey = !!process.env.AQUA_API_KEY;
    
    if (hasAquaKey) {
      // Enqueue real STT job
      await sttQueue.add('transcribe', {
        memoId,
        filePath: `/tmp/${memoId}`,
        provider,
        language,
      });
    }

    // Return mocked response for now
    const response: TranscribeResponse = {
      id: uuidv4(),
      transcript: hasAquaKey 
        ? 'Processing with real STT provider...' 
        : 'This is a mocked transcript. The audio would be processed here with real STT credentials.',
      confidence: 0.95,
      language: language || 'en',
    };

    return response;
  } catch (error) {
    app.log.error(error);
    return reply.status(500).send({ error: 'Transcription failed' });
  }
});

// Timeline endpoint
app.get('/timeline', async (request, reply) => {
  const mockTimeline: TimelineItem[] = [
    {
      id: '1',
      type: 'log',
      title: 'Morning reflection',
      snippet: 'Started the day with thoughts about childhood memories...',
      date: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: '2',
      type: 'chapter',
      title: 'Chapter 1: Early Years',
      snippet: 'A comprehensive look at my formative years and the experiences that shaped me...',
      date: new Date(Date.now() - 172800000).toISOString(),
    },
    {
      id: '3',
      type: 'log',
      title: 'Family dinner story',
      snippet: 'Remembered the Sunday dinners at grandmother\'s house...',
      date: new Date(Date.now() - 259200000).toISOString(),
    },
  ];

  return mockTimeline;
});

// Chapter draft endpoint
app.post('/chapters/draft', async (request, reply) => {
  try {
    const body = request.body as any;
    const { memoIds } = body;

    if (!memoIds || !Array.isArray(memoIds)) {
      return reply.status(400).send({ error: 'memoIds array is required' });
    }

    // Check if we have OpenAI credentials
    const hasOpenAI = !!process.env.OPENAI_API_KEY;

    if (hasOpenAI) {
      // Enqueue real chapter draft job
      await chapterQueue.add('draft', {
        memoIds,
        userId: 'default-user', // In real app, get from auth
      });
    }

    const response: ChapterDraftResponse = {
      id: uuidv4(),
      title: hasOpenAI ? 'AI-Generated Chapter' : 'Mock Chapter: Life Reflections',
      outline: [
        'Introduction and setting the scene',
        'Key memories and experiences',
        'Lessons learned and personal growth',
        'Connections to present day',
        'Conclusion and reflection',
      ],
      estimatedLength: 2500,
    };

    return response;
  } catch (error) {
    app.log.error(error);
    return reply.status(500).send({ error: 'Chapter draft failed' });
  }
});

// Export endpoint
app.post('/export', async (request, reply) => {
  try {
    const body = request.body as any;
    const { type, chapterIds } = body;

    if (!type || !chapterIds || !Array.isArray(chapterIds)) {
      return reply.status(400).send({ error: 'type and chapterIds array are required' });
    }

    if (!['pdf', 'docx', 'epub'].includes(type)) {
      return reply.status(400).send({ error: 'type must be pdf, docx, or epub' });
    }

    const jobId = uuidv4();

    // Enqueue export job
    await exportQueue.add('export', {
      type,
      chapterIds,
      userId: 'default-user', // In real app, get from auth
    });

    const response: ExportResponse = {
      jobId,
    };

    return response;
  } catch (error) {
    app.log.error(error);
    return reply.status(500).send({ error: 'Export failed' });
  }
});

// Start server
const start = async () => {
  try {
    await app.listen({ port: PORT, host: '0.0.0.0' });
    app.log.info(`API server running on port ${PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  app.log.info('SIGTERM received, shutting down gracefully');
  await app.close();
  await redis.quit();
  process.exit(0);
});

start();
