import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { api } from '../services/api';
import { Memo, CreateTimelineItemPayload } from '../types';

export type MemoStatus = 'idle' | 'recording' | 'stopping' | 'uploading' | 'transcribing' | 'saved' | 'failed';

export interface PendingMemo {
  id: string;
  uri: string;
  duration: number;
  size: number;
  createdAt: string;
  status: MemoStatus;
  transcript?: string;
  error?: string;
  retryCount: number;
}

export interface SavedMemo {
  id: string;
  memoId: string;
  transcript: string;
  duration: number;
  audioUrl: string;
  confidence: number;
  createdAt: string;
  timelineId?: string;
}

interface MemoState {
  // Current recording state
  currentStatus: MemoStatus;
  recordingDuration: number;
  recordingLevel: number;
  
  // Memo queues
  pendingMemos: PendingMemo[];
  savedMemos: SavedMemo[];
  
  // UI state
  showFirstTimeHint: boolean;
  isOnline: boolean;
  
  // Actions
  setRecordingState: (status: MemoStatus, duration?: number, level?: number) => void;
  addPendingMemo: (memo: Omit<PendingMemo, 'id' | 'createdAt' | 'status' | 'retryCount'>) => void;
  updateMemoStatus: (id: string, status: MemoStatus, error?: string) => void;
  addSavedMemo: (memo: SavedMemo) => void;
  removePendingMemo: (id: string) => void;
  retryFailedMemos: () => Promise<void>;
  setOnlineStatus: (isOnline: boolean) => void;
  dismissFirstTimeHint: () => void;
  
  // Processing
  processPendingMemo: (memo: PendingMemo) => Promise<void>;
}

export const useMemoStore = create<MemoState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentStatus: 'idle',
      recordingDuration: 0,
      recordingLevel: 0,
      pendingMemos: [],
      savedMemos: [],
      showFirstTimeHint: true,
      isOnline: true,

      // Actions
      setRecordingState: (status, duration = 0, level = 0) => {
        set({ 
          currentStatus: status, 
          recordingDuration: duration, 
          recordingLevel: level 
        });
      },

      addPendingMemo: (memoData) => {
        const memo: PendingMemo = {
          ...memoData,
          id: `pending_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date().toISOString(),
          status: 'uploading',
          retryCount: 0,
        };

        set(state => ({
          pendingMemos: [...state.pendingMemos, memo]
        }));

        // Start processing immediately
        get().processPendingMemo(memo);
      },

      updateMemoStatus: (id, status, error) => {
        set(state => ({
          pendingMemos: state.pendingMemos.map(memo =>
            memo.id === id 
              ? { ...memo, status, error, retryCount: error ? memo.retryCount + 1 : memo.retryCount }
              : memo
          )
        }));
      },

      addSavedMemo: (memo) => {
        set(state => ({
          savedMemos: [memo, ...state.savedMemos]
        }));
      },

      removePendingMemo: (id) => {
        set(state => ({
          pendingMemos: state.pendingMemos.filter(memo => memo.id !== id)
        }));
      },

      setOnlineStatus: (isOnline) => {
        set({ isOnline });
        
        // Retry failed memos when coming back online
        if (isOnline) {
          get().retryFailedMemos();
        }
      },

      dismissFirstTimeHint: () => {
        set({ showFirstTimeHint: false });
      },

      retryFailedMemos: async () => {
        const { pendingMemos } = get();
        const failedMemos = pendingMemos.filter(memo => 
          memo.status === 'failed' && memo.retryCount < 3
        );

        for (const memo of failedMemos) {
          await get().processPendingMemo(memo);
        }
      },

      processPendingMemo: async (memo) => {
        const { updateMemoStatus, addSavedMemo, removePendingMemo } = get();

        try {
          // Update status to uploading
          updateMemoStatus(memo.id, 'uploading');

          // Upload audio
          const uploadResult = await api.uploadAudio(memo.uri, {
            durationMs: memo.duration * 1000
          });

          // Transcribe memo
          updateMemoStatus(memo.id, 'transcribing');
          const transcribeResult = await api.transcribeMemo(uploadResult.memoId, 'whisper', 'en');

          // Create timeline item
          const timelineResult = await api.createTimelineItem({
            type: 'log',
            transcript: transcribeResult.transcript,
            audioUrl: uploadResult.audioUrl,
            memoId: uploadResult.memoId
          });

          // Create saved memo
          const savedMemo: SavedMemo = {
            id: memo.id,
            memoId: uploadResult.memoId,
            transcript: transcribeResult.transcript,
            duration: memo.duration,
            audioUrl: uploadResult.audioUrl,
            confidence: transcribeResult.confidence || 0.9,
            createdAt: memo.createdAt,
            timelineId: timelineResult.id,
          };

          // Update status to saved before removing
          updateMemoStatus(memo.id, 'saved');
          
          // Add to saved memos and remove from pending
          addSavedMemo(savedMemo);
          removePendingMemo(memo.id);
          
          console.log('[MemoStore] Memo processed successfully:', memo.id);
          
          // Reset recording state to idle
          set({ currentStatus: 'idle', recordingDuration: 0, recordingLevel: 0 });

        } catch (error) {
          console.error('Failed to process memo:', error);
          updateMemoStatus(memo.id, 'failed', error instanceof Error ? error.message : 'Unknown error');
          
          // Reset recording state to idle even on failure
          set({ currentStatus: 'idle', recordingDuration: 0, recordingLevel: 0 });
        }
      },
    }),
    {
      name: 'memo-storage',
      storage: {
        getItem: async (name) => {
          try {
            const value = await AsyncStorage.getItem(name);
            return value ? JSON.parse(value) : null;
          } catch (error) {
            console.warn('[MemoStore] Storage getItem failed:', error);
            return null;
          }
        },
        setItem: async (name, value) => {
          try {
            await AsyncStorage.setItem(name, JSON.stringify(value));
          } catch (error) {
            console.warn('[MemoStore] Storage setItem failed:', error);
          }
        },
        removeItem: async (name) => {
          try {
            await AsyncStorage.removeItem(name);
          } catch (error) {
            console.warn('[MemoStore] Storage removeItem failed:', error);
          }
        },
      },
      // Only persist certain fields (no functions!)
      partialize: (state) => ({
        savedMemos: state.savedMemos,
        showFirstTimeHint: state.showFirstTimeHint,
        pendingMemos: state.pendingMemos.filter(memo => memo.status === 'failed'), // Only persist failed memos for retry
      }),
    }
  )
);

// Initialize network monitoring
NetInfo.addEventListener(state => {
  useMemoStore.getState().setOnlineStatus(state.isConnected ?? false);
});
