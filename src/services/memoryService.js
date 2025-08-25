// Memory Service - Handles all memory-related API calls

const API_BASE_URL = 'http://192.168.1.155:8080';

// Mock memory data for development - this will be replaced with real API calls
const MOCK_MEMORIES = [
  {
    id: '1',
    type: 'interview',
    title: 'Childhood Memories',
    content: 'I remember growing up in a small town where everyone knew each other...',
    category: 'childhood',
    createdAt: new Date('2024-01-15').toISOString(),
    duration: 45, // minutes for interview
    questionCount: 8,
    status: 'completed'
  },
  {
    id: '2', 
    type: 'freeform',
    title: 'My Wedding Day',
    content: 'The most beautiful day of my life was when I married my soulmate...',
    category: 'family',
    createdAt: new Date('2024-01-20').toISOString(),
    audioPath: '/path/to/audio/wedding.m4a',
    status: 'completed'
  },
  {
    id: '3',
    type: 'interview', 
    title: 'Career Journey',
    content: 'Starting my first job was both exciting and terrifying...',
    category: 'career',
    createdAt: new Date('2024-01-25').toISOString(),
    duration: 32,
    questionCount: 6,
    status: 'completed'
  },
  {
    id: '4',
    type: 'freeform',
    title: 'Sunday Family Dinners',
    content: 'Every Sunday, our whole family would gather at grandmas house...',
    category: 'family',
    createdAt: new Date('2024-02-01').toISOString(),
    status: 'completed'
  }
];

export const memoryService = {
  // Get all user memories
  async getAllMemories() {
    try {
      // TODO: Replace with real API call when backend is ready
      // const response = await fetch(`${API_BASE_URL}/memories`, {
      //   method: 'GET',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${userToken}` // When auth is implemented
      //   },
      // });
      
      // if (!response.ok) {
      //   throw new Error(`HTTP error! status: ${response.status}`);
      // }
      
      // const data = await response.json();
      // console.log('[API] Memories retrieved:', data);
      // return data;

      // Mock implementation
      console.log('[MOCK] Getting all memories');
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
      return {
        memories: MOCK_MEMORIES.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      };
    } catch (error) {
      console.error('[API] Failed to get memories:', error);
      throw error;
    }
  },

  // Get memory by ID
  async getMemoryById(memoryId) {
    try {
      // TODO: Replace with real API call
      // const response = await fetch(`${API_BASE_URL}/memories/${memoryId}`, {
      //   method: 'GET',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${userToken}`
      //   },
      // });
      
      console.log('[MOCK] Getting memory by ID:', memoryId);
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const memory = MOCK_MEMORIES.find(m => m.id === memoryId);
      if (!memory) {
        throw new Error('Memory not found');
      }
      
      return memory;
    } catch (error) {
      console.error('[API] Failed to get memory:', error);
      throw error;
    }
  },

  // Save a new freeform memory
  async saveFreeformMemory(memoryData) {
    try {
      // TODO: Replace with real API call
      // const response = await fetch(`${API_BASE_URL}/memories`, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${userToken}`
      //   },
      //   body: JSON.stringify(memoryData),
      // });
      
      console.log('[MOCK] Saving freeform memory:', memoryData);
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const newMemory = {
        id: Date.now().toString(),
        type: 'freeform',
        title: memoryData.title || 'Untitled Memory',
        content: memoryData.content,
        audioPath: memoryData.audioPath,
        category: memoryData.category || 'general',
        createdAt: new Date().toISOString(),
        status: 'completed'
      };
      
      // Add to mock data (in real app this would be handled by backend)
      MOCK_MEMORIES.push(newMemory);
      
      return newMemory;
    } catch (error) {
      console.error('[API] Failed to save memory:', error);
      throw error;
    }
  },

  // Get memories by category
  async getMemoriesByCategory(category) {
    try {
      console.log('[MOCK] Getting memories by category:', category);
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const filteredMemories = MOCK_MEMORIES.filter(m => m.category === category);
      return {
        memories: filteredMemories.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      };
    } catch (error) {
      console.error('[API] Failed to get memories by category:', error);
      throw error;
    }
  },

  // Get memory statistics
  async getMemoryStats() {
    try {
      console.log('[MOCK] Getting memory statistics');
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const totalMemories = MOCK_MEMORIES.length;
      const interviews = MOCK_MEMORIES.filter(m => m.type === 'interview').length;
      const freeform = MOCK_MEMORIES.filter(m => m.type === 'freeform').length;
      const categories = [...new Set(MOCK_MEMORIES.map(m => m.category))];
      
      return {
        total: totalMemories,
        interviews,
        freeform,
        categories: categories.length,
        recentActivity: MOCK_MEMORIES
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 5)
      };
    } catch (error) {
      console.error('[API] Failed to get memory stats:', error);
      throw error;
    }
  },

  // Search memories
  async searchMemories(query) {
    try {
      console.log('[MOCK] Searching memories:', query);
      await new Promise(resolve => setTimeout(resolve, 400));
      
      const searchResults = MOCK_MEMORIES.filter(memory => 
        memory.title.toLowerCase().includes(query.toLowerCase()) ||
        memory.content.toLowerCase().includes(query.toLowerCase()) ||
        memory.category.toLowerCase().includes(query.toLowerCase())
      );
      
      return {
        memories: searchResults.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
        query
      };
    } catch (error) {
      console.error('[API] Failed to search memories:', error);
      throw error;
    }
  },

  // Delete memory
  async deleteMemory(memoryId) {
    try {
      // TODO: Replace with real API call
      console.log('[MOCK] Deleting memory:', memoryId);
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const index = MOCK_MEMORIES.findIndex(m => m.id === memoryId);
      if (index === -1) {
        throw new Error('Memory not found');
      }
      
      MOCK_MEMORIES.splice(index, 1);
      return { success: true };
    } catch (error) {
      console.error('[API] Failed to delete memory:', error);
      throw error;
    }
  },

  // Update memory
  async updateMemory(memoryId, updates) {
    try {
      console.log('[MOCK] Updating memory:', memoryId, updates);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const memoryIndex = MOCK_MEMORIES.findIndex(m => m.id === memoryId);
      if (memoryIndex === -1) {
        throw new Error('Memory not found');
      }
      
      MOCK_MEMORIES[memoryIndex] = {
        ...MOCK_MEMORIES[memoryIndex],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      
      return MOCK_MEMORIES[memoryIndex];
    } catch (error) {
      console.error('[API] Failed to update memory:', error);
      throw error;
    }
  }
};