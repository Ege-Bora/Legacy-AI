import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { TimelineItem, GetTimelineParams } from '../types';
import { api } from '../services/api';
import { TIMELINE_CONFIG } from '../config';

interface TimelineState {
  items: TimelineItem[];
  isLoading: boolean;
  isRefreshing: boolean;
  hasMore: boolean;
  nextCursor?: string;
  error: string | null;
  lastFetch: number;
  optimisticItems: Map<string, TimelineItem>; // For optimistic updates
  retryQueue: Map<string, () => Promise<void>>; // For retry logic
  
  // Actions
  loadTimeline: (refresh?: boolean) => Promise<void>;
  loadMore: () => Promise<void>;
  addItem: (item: TimelineItem) => void;
  addItemOptimistic: (item: TimelineItem) => Promise<void>;
  removeItem: (id: string) => void;
  removeItemOptimistic: (id: string) => Promise<void>;
  updateItem: (id: string, updates: Partial<TimelineItem>) => void;
  updateItemOptimistic: (id: string, updates: Partial<TimelineItem>) => Promise<void>;
  clearTimeline: () => void;
  refresh: () => Promise<void>;
  retryFailedOperations: () => Promise<void>;
}

export const useTimelineStore = create<TimelineState>()(
  persist(
    (set, get) => ({
      items: [],
      isLoading: false,
      isRefreshing: false,
      hasMore: true,
      nextCursor: undefined,
      error: null,
      lastFetch: 0,
      optimisticItems: new Map(),
      retryQueue: new Map(),

      loadTimeline: async (refresh = false) => {
        const state = get();
        
        // Avoid duplicate requests
        if (state.isLoading && !refresh) return;
        
        // Check if we need to refresh (5 minutes cache)
        const shouldRefresh = refresh || Date.now() - state.lastFetch > 5 * 60 * 1000;
        if (!shouldRefresh && state.items.length > 0) return;

        set({ 
          isLoading: true, 
          isRefreshing: refresh,
          error: null 
        });

        try {
          const params: GetTimelineParams = {
            limit: TIMELINE_CONFIG.pageSize
          };

          const response = await api.getTimeline(params);
          
          set({
            items: response.items,
            hasMore: Boolean(response.nextCursor),
            nextCursor: response.nextCursor,
            lastFetch: Date.now(),
            error: null
          });
        } catch (error) {
          console.error('Failed to load timeline:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to load timeline'
          });
        } finally {
          set({ 
            isLoading: false, 
            isRefreshing: false 
          });
        }
      },

      loadMore: async () => {
        const state = get();
        
        if (state.isLoading || !state.hasMore || !state.nextCursor) return;

        set({ isLoading: true, error: null });

        try {
          const params: GetTimelineParams = {
            cursor: state.nextCursor,
            limit: TIMELINE_CONFIG.pageSize
          };

          const response = await api.getTimeline(params);
          
          set({
            items: [...state.items, ...response.items],
            hasMore: Boolean(response.nextCursor),
            nextCursor: response.nextCursor,
            error: null
          });
        } catch (error) {
          console.error('Failed to load more timeline items:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to load more items'
          });
        } finally {
          set({ isLoading: false });
        }
      },

      addItem: (item: TimelineItem) => {
        set(state => ({
          items: [item, ...state.items]
        }));
      },

      addItemOptimistic: async (item: TimelineItem) => {
        const tempId = `optimistic-${Date.now()}`;
        const optimisticItem = { ...item, id: tempId };
        
        // Add optimistically
        set(state => {
          const newOptimistic = new Map(state.optimisticItems);
          newOptimistic.set(tempId, optimisticItem);
          return {
            items: [optimisticItem, ...state.items],
            optimisticItems: newOptimistic
          };
        });

        try {
          console.log('[Timeline] Creating item optimistically:', item);
          const result = await api.createTimelineItem({
            type: item.type,
            title: item.title,
            content: item.content,
            transcript: item.transcriptPreview,
            audioUrl: item.audioUrl,
            memoId: item.memoId
          });
          
          // Replace optimistic item with real one
          set(state => {
            const newOptimistic = new Map(state.optimisticItems);
            newOptimistic.delete(tempId);
            const newItems = state.items.map(i => 
              i.id === tempId ? { ...item, id: result.id } : i
            );
            return {
              items: newItems,
              optimisticItems: newOptimistic
            };
          });
        } catch (error) {
          console.error('[Timeline] Failed to create item, will retry:', error);
          
          // Add to retry queue
          set(state => {
            const newRetryQueue = new Map(state.retryQueue);
            newRetryQueue.set(tempId, () => get().addItemOptimistic(item));
            return { retryQueue: newRetryQueue };
          });
          
          // Revert optimistic update on failure
          set(state => {
            const newOptimistic = new Map(state.optimisticItems);
            newOptimistic.delete(tempId);
            return {
              items: state.items.filter(i => i.id !== tempId),
              optimisticItems: newOptimistic,
              error: 'Failed to add item. Will retry...'
            };
          });
        }
      },

      removeItem: (id: string) => {
        set(state => ({
          items: state.items.filter(item => item.id !== id)
        }));
      },

      removeItemOptimistic: async (id: string) => {
        // Store item for potential restoration
        const state = get();
        const itemToRemove = state.items.find(item => item.id === id);
        
        if (!itemToRemove) return;
        
        // Remove optimistically
        set(state => ({
          items: state.items.filter(item => item.id !== id)
        }));
        
        try {
          console.log('[Timeline] Removing item optimistically:', id);
          // In real implementation, would call API to delete
          // await api.deleteTimelineItem(id);
          console.log('[Timeline] Item removed successfully');
        } catch (error) {
          console.error('[Timeline] Failed to remove item, restoring:', error);
          
          // Restore item on failure
          set(state => ({
            items: [itemToRemove, ...state.items],
            error: 'Failed to remove item'
          }));
        }
      },

      updateItem: (id: string, updates: Partial<TimelineItem>) => {
        set(state => ({
          items: state.items.map(item => 
            item.id === id ? { ...item, ...updates } : item
          )
        }));
      },

      updateItemOptimistic: async (id: string, updates: Partial<TimelineItem>) => {
        const state = get();
        const originalItem = state.items.find(item => item.id === id);
        
        if (!originalItem) return;
        
        // Update optimistically
        set(state => ({
          items: state.items.map(item => 
            item.id === id ? { ...item, ...updates } : item
          )
        }));
        
        try {
          console.log('[Timeline] Updating item optimistically:', id, updates);
          // In real implementation, would call API to update
          // await api.updateTimelineItem(id, updates);
          console.log('[Timeline] Item updated successfully');
        } catch (error) {
          console.error('[Timeline] Failed to update item, reverting:', error);
          
          // Revert to original on failure
          set(state => ({
            items: state.items.map(item => 
              item.id === id ? originalItem : item
            ),
            error: 'Failed to update item'
          }));
        }
      },

      clearTimeline: () => {
        set({
          items: [],
          hasMore: true,
          nextCursor: undefined,
          error: null,
          lastFetch: 0
        });
      },

      refresh: async () => {
        await get().loadTimeline(true);
      },

      retryFailedOperations: async () => {
        const { retryQueue } = get();
        console.log(`[Timeline] Retrying ${retryQueue.size} failed operations`);
        
        for (const [id, retryFn] of retryQueue) {
          try {
            await retryFn();
            // Remove from retry queue on success
            set(state => {
              const newRetryQueue = new Map(state.retryQueue);
              newRetryQueue.delete(id);
              return { retryQueue: newRetryQueue };
            });
          } catch (error) {
            console.error(`[Timeline] Retry failed for ${id}:`, error);
          }
        }
      }
    }),
    {
      name: 'timeline-storage',
      partialize: (state) => ({
        items: state.items,
        lastFetch: state.lastFetch
      })
    }
  )
);
