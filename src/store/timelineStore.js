// Timeline Store - Optimistic UI state management for Life Legacy
import AsyncStorage from '@react-native-async-storage/async-storage';

class TimelineStore {
  constructor() {
    this.items = [];
    this.listeners = [];
    this.retryQueue = [];
    this.isInitialized = false;
    
    this.init();
  }

  async init() {
    try {
      const storedItems = await AsyncStorage.getItem('@timeline_items');
      const storedQueue = await AsyncStorage.getItem('@retry_queue');
      
      if (storedItems) {
        this.items = JSON.parse(storedItems);
      }
      if (storedQueue) {
        this.retryQueue = JSON.parse(storedQueue);
      }
      
      this.isInitialized = true;
      this.notifyListeners();
      
      // Process retry queue on init
      this.processRetryQueue();
    } catch (error) {
      console.error('[Timeline] Failed to initialize:', error);
      this.isInitialized = true;
    }
  }

  // Subscribe to state changes
  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notifyListeners() {
    this.listeners.forEach(listener => {
      try {
        listener(this.getState());
      } catch (error) {
        console.error('[Timeline] Listener error:', error);
      }
    });
  }

  getState() {
    return {
      items: [...this.items].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
      retryQueue: [...this.retryQueue],
      isInitialized: this.isInitialized
    };
  }

  // Add optimistic item (shows immediately)
  async addPendingItem(itemData) {
    try {
      const item = {
        id: `temp_${Date.now()}_${Math.random()}`,
        ...itemData,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        retryCount: 0
      };

      this.items.push(item);
      await this.persistItems();
      this.notifyListeners();

      // Start upload process
      this.uploadItem(item);
      
      return item;
    } catch (error) {
      console.error('[Timeline] Failed to add pending item:', error);
      throw error;
    }
  }

  // Upload item to backend
  async uploadItem(item) {
    try {
      this.updateItemStatus(item.id, 'uploading');
      
      let apiResult;
      
      if (item.type === 'text') {
        apiResult = await this.uploadTextMemo(item);
      } else if (item.type === 'voice') {
        apiResult = await this.uploadVoiceMemo(item);
      } else if (item.type === 'interview_answer') {
        apiResult = await this.uploadInterviewAnswer(item);
      } else {
        throw new Error(`Unknown item type: ${item.type}`);
      }

      // Success - finalize the item
      await this.finalizeItem(item.id, apiResult);
      
    } catch (error) {
      console.error('[Timeline] Upload failed for item:', item.id, error);
      await this.handleUploadFailure(item, error);
    }
  }

  // Update item status
  async updateItemStatus(itemId, status, extraData = {}) {
    const itemIndex = this.items.findIndex(item => item.id === itemId);
    if (itemIndex === -1) return;

    this.items[itemIndex] = {
      ...this.items[itemIndex],
      status,
      updatedAt: new Date().toISOString(),
      ...extraData
    };

    await this.persistItems();
    this.notifyListeners();
  }

  // Finalize item after successful upload
  async finalizeItem(tempId, serverData) {
    const itemIndex = this.items.findIndex(item => item.id === tempId);
    if (itemIndex === -1) return;

    // Replace temp item with server data
    this.items[itemIndex] = {
      ...this.items[itemIndex],
      ...serverData,
      id: serverData.id || tempId,
      status: serverData.status || 'done',
      serverSynced: true,
      updatedAt: new Date().toISOString()
    };

    await this.persistItems();
    this.notifyListeners();
    
    console.log('[Timeline] Item finalized:', serverData.id || tempId);
  }

  // Handle upload failures
  async handleUploadFailure(item, error) {
    const shouldRetry = item.retryCount < 3 && this.isRetryableError(error);
    
    if (shouldRetry) {
      // Add to retry queue
      const retryItem = {
        ...item,
        retryCount: (item.retryCount || 0) + 1,
        lastError: error.message,
        nextRetryAt: new Date(Date.now() + (Math.pow(2, item.retryCount || 0) * 5000)).toISOString()
      };
      
      this.retryQueue.push(retryItem);
      await this.persistRetryQueue();
      
      // Update main item status
      await this.updateItemStatus(item.id, 'error', {
        error: error.message,
        willRetry: true,
        retryCount: retryItem.retryCount
      });
    } else {
      // Permanent failure
      await this.updateItemStatus(item.id, 'error', {
        error: error.message,
        willRetry: false,
        retryCount: item.retryCount || 0
      });
    }
  }

  // Check if error is retryable
  isRetryableError(error) {
    // Network errors, temporary server errors
    return error.message.includes('Network') || 
           error.message.includes('timeout') ||
           error.message.includes('5') && error.message.includes('0'); // 5xx errors
  }

  // Process retry queue
  async processRetryQueue() {
    const now = new Date();
    const itemsToRetry = this.retryQueue.filter(item => 
      new Date(item.nextRetryAt) <= now
    );

    for (const item of itemsToRetry) {
      // Remove from retry queue
      this.retryQueue = this.retryQueue.filter(r => r.id !== item.id);
      await this.persistRetryQueue();
      
      // Update main item
      const mainItemIndex = this.items.findIndex(i => i.id === item.id);
      if (mainItemIndex !== -1) {
        this.items[mainItemIndex] = item;
        await this.persistItems();
        this.notifyListeners();
      }
      
      // Retry upload
      this.uploadItem(item);
    }

    // Schedule next retry check
    setTimeout(() => this.processRetryQueue(), 30000); // Check every 30s
  }

  // Manual retry for failed items
  async retryItem(itemId) {
    const item = this.items.find(i => i.id === itemId);
    if (!item || item.status !== 'error') return;

    const retryItem = {
      ...item,
      retryCount: (item.retryCount || 0) + 1
    };
    
    this.uploadItem(retryItem);
  }

  // Delete item
  async deleteItem(itemId) {
    this.items = this.items.filter(item => item.id !== itemId);
    this.retryQueue = this.retryQueue.filter(item => item.id !== itemId);
    
    await this.persistItems();
    await this.persistRetryQueue();
    this.notifyListeners();
  }

  // API calls
  async uploadTextMemo(item) {
    const response = await fetch('http://192.168.1.155:8080/memos/text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: item.content,
        title: item.title,
        addToBook: item.addToBook || false,
        source: item.source || 'quick_memory'
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  }

  async uploadVoiceMemo(item) {
    const formData = new FormData();
    formData.append('audio', {
      uri: item.audioPath,
      type: 'audio/wav',
      name: 'recording.wav'
    });
    formData.append('title', item.title || 'Voice Memory');
    formData.append('addToBook', String(item.addToBook || false));
    formData.append('source', item.source || 'quick_memory');

    const response = await fetch('http://192.168.1.155:8080/memos/upload', {
      method: 'POST',
      body: formData,
      headers: { 'Content-Type': 'multipart/form-data' }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    
    // For voice items, start transcription status
    if (result.id) {
      this.updateItemStatus(item.id, 'transcribing', {
        serverId: result.id,
        audioUrl: result.audioUrl
      });
      
      // Poll for transcription completion
      this.pollTranscription(item.id, result.id);
    }

    return result;
  }

  async uploadInterviewAnswer(item) {
    const endpoint = item.answerType === 'text' ? '/interviews/answer' : '/interviews/answer';
    const response = await fetch(`http://192.168.1.155:8080${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: item.sessionId,
        questionId: item.questionId,
        answer: item.content,
        answerType: item.answerType,
        audioPath: item.audioPath
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  }

  // Poll transcription status
  async pollTranscription(itemId, serverId) {
    try {
      const response = await fetch(`http://192.168.1.155:8080/memos/${serverId}/status`);
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.transcriptionStatus === 'completed') {
          await this.updateItemStatus(itemId, 'done', {
            transcript: data.transcript,
            transcriptionComplete: true
          });
        } else if (data.transcriptionStatus === 'failed') {
          await this.updateItemStatus(itemId, 'error', {
            error: 'Transcription failed'
          });
        } else {
          // Still processing, poll again
          setTimeout(() => this.pollTranscription(itemId, serverId), 3000);
        }
      }
    } catch (error) {
      console.error('[Timeline] Transcription polling error:', error);
      // Continue polling - could be temporary
      setTimeout(() => this.pollTranscription(itemId, serverId), 5000);
    }
  }

  // Persistence
  async persistItems() {
    try {
      await AsyncStorage.setItem('@timeline_items', JSON.stringify(this.items));
    } catch (error) {
      console.error('[Timeline] Failed to persist items:', error);
    }
  }

  async persistRetryQueue() {
    try {
      await AsyncStorage.setItem('@retry_queue', JSON.stringify(this.retryQueue));
    } catch (error) {
      console.error('[Timeline] Failed to persist retry queue:', error);
    }
  }

  // Get items with filters
  getItems(filter = {}) {
    let filtered = [...this.items];
    
    if (filter.type) {
      filtered = filtered.filter(item => item.type === filter.type);
    }
    
    if (filter.status) {
      filtered = filtered.filter(item => item.status === filter.status);
    }
    
    if (filter.addToBook !== undefined) {
      filtered = filtered.filter(item => item.addToBook === filter.addToBook);
    }

    return filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  // Stats
  getStats() {
    const total = this.items.length;
    const pending = this.items.filter(i => i.status === 'pending').length;
    const uploading = this.items.filter(i => i.status === 'uploading').length;
    const transcribing = this.items.filter(i => i.status === 'transcribing').length;
    const done = this.items.filter(i => i.status === 'done').length;
    const errors = this.items.filter(i => i.status === 'error').length;
    const inBook = this.items.filter(i => i.addToBook).length;

    return {
      total,
      pending,
      uploading,
      transcribing,
      done,
      errors,
      inBook,
      retryQueueSize: this.retryQueue.length
    };
  }
}

// Create singleton instance
export const timelineStore = new TimelineStore();

// React hook for using timeline store
export const useTimeline = () => {
  const [state, setState] = React.useState(timelineStore.getState());

  React.useEffect(() => {
    return timelineStore.subscribe(setState);
  }, []);

  const actions = {
    addPendingItem: timelineStore.addPendingItem.bind(timelineStore),
    retryItem: timelineStore.retryItem.bind(timelineStore),
    deleteItem: timelineStore.deleteItem.bind(timelineStore),
    getItems: timelineStore.getItems.bind(timelineStore),
    getStats: timelineStore.getStats.bind(timelineStore)
  };

  return {
    ...state,
    ...actions
  };
};