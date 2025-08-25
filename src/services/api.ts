// Mock API service for memo functionality
// This implements placeholder endpoints that will be replaced with real backend calls

import { 
  UploadAudioResponse, 
  TranscribeMemoResponse, 
  CreateTimelineItemPayload,
  CreateTimelineItemResponse,
  GetTimelineParams,
  GetTimelineResponse,
  GenerateBookResponse,
  TimelineItem,
  ApiError 
} from '../types';
import { API_BASE_URL, AQUA_PROVIDER, DEV_CONFIG, TIMELINE_CONFIG } from '../config';

// Mock data for development
const MOCK_TIMELINE_ITEMS: TimelineItem[] = [
  {
    id: 'item-1',
    type: 'log',
    title: 'Morning Coffee Thoughts',
    snippet: 'Had some interesting reflections about life while having my morning coffee...',
    transcriptPreview: 'I was sitting there with my coffee, watching the sunrise, and I started thinking about...',
    audioUrl: 'https://example.com/audio/item-1.m4a',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    media: [
      { kind: 'audio', url: 'https://example.com/audio/item-1.m4a' }
    ]
  },
  {
    id: 'item-2',
    type: 'chapter',
    title: 'Childhood Summers',
    snippet: 'Memories of those endless summer days when I was eight years old...',
    content: 'The summer I turned eight was magical. Every day felt like an adventure waiting to happen...',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    media: [
      { kind: 'image', url: 'https://example.com/images/summer.jpg' }
    ]
  }
];

export class APIService {
  private baseUrl: string;
  private mockDelay: number = 1000;

  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  async getTimelineItems(params?: GetTimelineParams): Promise<GetTimelineResponse> {
    return this.getTimeline(params);
  }

  private async mockApiCall<T>(data: T, delay: number = this.mockDelay): Promise<T> {
    await new Promise(resolve => setTimeout(resolve, delay));
    
    // Simulate occasional failures in development
    if (DEV_CONFIG.mockServices && Math.random() < 0.1) {
      throw new Error('Mock API failure for testing');
    }
    
    return data;
  }

  async uploadAudio(
    localUri: string, 
    meta: { durationMs: number; locale?: string }
  ): Promise<UploadAudioResponse> {
    if (DEV_CONFIG.mockServices) {
      console.log('[API] uploadAudio (mocked)', { localUri, meta });
      
      return this.mockApiCall({
        memoId: `memo-${Date.now()}`,
        audioUrl: `https://cdn.lifelegacy.ai/audio/memo-${Date.now()}.m4a`
      });
    }

    // TODO: Implement real audio upload
    const formData = new FormData();
    formData.append('audio', {
      uri: localUri,
      type: 'audio/m4a',
      name: 'memo.m4a',
    } as any);
    formData.append('durationMs', meta.durationMs.toString());
    if (meta.locale) {
      formData.append('locale', meta.locale);
    }

    const response = await fetch(`${this.baseUrl}/memos/upload`, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    return response.json();
  }

  async transcribeMemo(
    memoId: string, 
    provider: string = AQUA_PROVIDER, 
    language?: string
  ): Promise<TranscribeMemoResponse> {
    if (DEV_CONFIG.mockServices) {
      console.log('[API] transcribeMemo (mocked)', { memoId, provider, language });
      
      return this.mockApiCall({
        transcript: "This is a mock transcription of the audio memo. The user was talking about their day and sharing some interesting thoughts about life and memories.",
        confidence: 0.95
      });
    }

    // TODO: Implement real transcription
    const response = await fetch(`${this.baseUrl}/memos/${memoId}/transcribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        provider,
        language,
      }),
    });

    if (!response.ok) {
      throw new Error(`Transcription failed: ${response.statusText}`);
    }

    return response.json();
  }

  async createTimelineItem(payload: CreateTimelineItemPayload): Promise<CreateTimelineItemResponse> {
    if (DEV_CONFIG.mockServices) {
      console.log('[API] createTimelineItem (mocked)', payload);
      
      const newItem: TimelineItem = {
        id: `timeline-${Date.now()}`,
        type: payload.type,
        title: payload.title || (payload.type === 'log' ? 'Quick Memory' : 'New Chapter'),
        snippet: payload.transcript?.substring(0, 100) + '...' || payload.content?.substring(0, 100) + '...',
        transcriptPreview: payload.transcript,
        audioUrl: payload.audioUrl,
        content: payload.content,
        memoId: payload.memoId,
        createdAt: new Date().toISOString(),
        media: payload.audioUrl ? [{ kind: 'audio', url: payload.audioUrl }] : undefined
      };
      
      // Add to mock data for timeline display
      MOCK_TIMELINE_ITEMS.unshift(newItem);
      
      return this.mockApiCall({
        id: newItem.id
      });
    }

    // TODO: Implement real timeline item creation
    const response = await fetch(`${this.baseUrl}/timeline/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Timeline item creation failed: ${response.statusText}`);
    }

    return response.json();
  }

  async getTimeline(params?: GetTimelineParams): Promise<GetTimelineResponse> {
    if (DEV_CONFIG.mockServices) {
      console.log('[API] getTimeline (mocked)', params);
      
      // Simulate pagination
      const startIndex = params?.cursor ? parseInt(params.cursor) : 0;
      const limit = params?.limit || TIMELINE_CONFIG.pageSize;
      const items = MOCK_TIMELINE_ITEMS.slice(startIndex, startIndex + limit);
      const hasMore = startIndex + limit < MOCK_TIMELINE_ITEMS.length;
      
      return this.mockApiCall({
        items,
        nextCursor: hasMore ? (startIndex + limit).toString() : undefined
      });
    }

    // TODO: Implement real timeline fetching
    const url = new URL(`${this.baseUrl}/timeline/items`);
    if (params?.cursor) {
      url.searchParams.set('cursor', params.cursor);
    }
    if (params?.limit) {
      url.searchParams.set('limit', params.limit.toString());
    }

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`Timeline fetch failed: ${response.statusText}`);
    }

    return response.json();
  }

  async generateBook(type: 'pdf' | 'epub' | 'doc'): Promise<GenerateBookResponse> {
    if (DEV_CONFIG.mockServices) {
      console.log('[API] generateBook (mocked)', { type });
      
      return this.mockApiCall({
        jobId: `job-${type}-${Date.now()}`
      }, 2000); // Longer delay for book generation
    }

    // TODO: Implement real book generation
    const response = await fetch(`${this.baseUrl}/books/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ type }),
    });

    if (!response.ok) {
      throw new Error(`Book generation failed: ${response.statusText}`);
    }

    return response.json();
  }

  // Utility methods for development
  async addMockTimelineItem(item: Partial<TimelineItem>): Promise<void> {
    if (DEV_CONFIG.mockServices) {
      const newItem: TimelineItem = {
        id: `mock-${Date.now()}`,
        type: 'log',
        createdAt: new Date().toISOString(),
        ...item,
      };
      MOCK_TIMELINE_ITEMS.unshift(newItem);
    }
  }

  async clearMockData(): Promise<void> {
    if (DEV_CONFIG.mockServices) {
      MOCK_TIMELINE_ITEMS.length = 0;
    }
  }
}

// Create API instance and export
export const api = new APIService() as APIService & typeof legacyApi;

// Additional mock methods for legacy support
export const legacyApi = {
  // Book Progress
  async getBookProgress() {
    console.log('[Mock API] Getting book progress...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      success: true,
      progress: {
        currentChapter: 3,
        totalChapters: 10,
        percentComplete: 30,
        lastUpdated: new Date().toISOString(),
        estimatedCompletion: '2 weeks'
      }
    };
  },

  // Update Chapter
  async updateChapter(id: string, updates: any) {
    console.log('[Mock API] Updating chapter:', id, updates);
    await new Promise(resolve => setTimeout(resolve, 800));
    
    return {
      success: true,
      chapter: {
        id,
        ...updates,
        updatedAt: new Date().toISOString()
      }
    };
  },

  // Get Timeline (legacy support)
  async getTimeline() {
    console.log('[Mock API] Getting timeline (legacy)...');
    return api.getTimeline();
  },

  // Add getTimelineItems to legacy API
  async getTimelineItems() {
    return api.getTimeline();
  }
};

// Merge legacy methods into main api export
Object.assign(api, legacyApi)
