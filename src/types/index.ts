export interface Memo {
  id: string;
  audioUrl: string;
  durationMs: number;
  createdAt: string;
  transcript?: string;
  confidence?: number;
  locale?: string;
}

export interface TimelineItem {
  id: string;
  type: 'log' | 'chapter';
  title?: string;
  snippet?: string;
  transcriptPreview?: string;
  audioUrl?: string;
  createdAt: string;
  media?: MediaItem[];
  memoId?: string;
  content?: string;
}

export interface MediaItem {
  kind: 'audio' | 'image' | 'video';
  url: string;
  thumbnailUrl?: string;
  durationMs?: number;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
  createdAt: string;
  subscription?: {
    status: 'free' | 'premium' | 'pro';
    expiresAt?: string;
  };
}

export interface Session {
  user: User;
  accessToken: string;
  refreshToken?: string;
  expiresAt: string;
}

export interface UploadAudioResponse {
  memoId: string;
  audioUrl: string;
}

export interface TranscribeMemoResponse {
  transcript: string;
  confidence?: number;
}

export interface CreateTimelineItemPayload {
  type: 'log' | 'chapter';
  memoId?: string;
  transcript?: string;
  audioUrl?: string;
  title?: string;
  content?: string;
}

export interface CreateTimelineItemResponse {
  id: string;
}

export interface GetTimelineParams {
  cursor?: string;
  limit?: number;
}

export interface GetTimelineResponse {
  items: TimelineItem[];
  nextCursor?: string;
}

export interface GenerateBookResponse {
  jobId: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
}
