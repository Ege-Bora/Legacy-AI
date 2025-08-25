import { z } from 'zod';

// Request/Response Types
export const MemoUploadSchema = z.object({
  durationMs: z.number(),
  locale: z.string().default('en'),
});

export const TranscribeRequestSchema = z.object({
  memoId: z.string(),
  provider: z.string().optional(),
  language: z.string().optional(),
});

export const ChapterDraftRequestSchema = z.object({
  memoIds: z.array(z.string()),
});

export const ExportRequestSchema = z.object({
  type: z.enum(['pdf', 'docx', 'epub']),
  chapterIds: z.array(z.string()),
});

// Response Types
export interface MemoUploadResponse {
  id: string;
  url: string;
  durationMs: number;
  locale: string;
}

export interface TranscribeResponse {
  id: string;
  transcript: string;
  confidence: number;
  language: string;
}

export interface TimelineItem {
  id: string;
  type: 'log' | 'chapter';
  title: string;
  snippet: string;
  date: string;
}

export interface ChapterDraftResponse {
  id: string;
  title: string;
  outline: string[];
  estimatedLength: number;
}

export interface ExportResponse {
  jobId: string;
}

// Job Data Types
export interface SttJobData {
  memoId: string;
  filePath: string;
  provider?: string;
  language?: string;
}

export interface ChapterDraftJobData {
  memoIds: string[];
  userId: string;
}

export interface ExportJobData {
  type: 'pdf' | 'docx' | 'epub';
  chapterIds: string[];
  userId: string;
}
