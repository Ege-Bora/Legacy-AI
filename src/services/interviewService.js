// Interview Service - Handles interview session API calls

const API_BASE_URL = 'http://192.168.1.155:8080';
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

// Helper function for API requests with retry logic
const apiRequest = async (url, options = {}, retries = MAX_RETRIES) => {
  try {
    const response = await fetch(url, {
      timeout: 10000, // 10 second timeout
      ...options,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`[API] Request failed (${retries} retries left):`, error.message);
    
    if (retries > 0 && (error.name === 'TypeError' || error.message.includes('fetch'))) {
      // Retry on network errors
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return apiRequest(url, options, retries - 1);
    }
    
    throw new Error(`API request failed: ${error.message}`);
  }
};

export const interviewService = {
  // Create a new interview session
  async createSession(sessionData) {
    try {
      console.log('[API] Creating interview session:', sessionData);
      
      const data = await apiRequest(`${API_BASE_URL}/interviews/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sessionData),
      });
      
      console.log('[API] Interview session created:', data);
      return data;
    } catch (error) {
      console.error('[API] Failed to create interview session:', error);
      throw new Error(`Failed to create session: ${error.message}`);
    }
  },

  // Get interview session by ID
  async getSession(sessionId) {
    try {
      const response = await fetch(`${API_BASE_URL}/interviews/sessions/${sessionId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('[API] Interview session retrieved:', data);
      return data;
    } catch (error) {
      console.error('[API] Failed to get interview session:', error);
      throw error;
    }
  },

  // Generate interview questions for a session
  async generateQuestions(sessionId) {
    try {
      console.log('[API] Generating questions for session:', sessionId);
      
      const data = await apiRequest(`${API_BASE_URL}/interviews/sessions/${sessionId}/questions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });
      
      console.log('[API] Questions generated:', data);
      return data;
    } catch (error) {
      console.error('[API] Failed to generate questions:', error);
      // Return mock questions as fallback
      return {
        questions: [
          "Tell me about your childhood and where you grew up.",
          "What are your most cherished memories with family?",
          "What life lessons would you want to pass down?"
        ]
      };
    }
  },

  // Add an answer to the interview session
  async addAnswer(sessionId, answerData) {
    try {
      const response = await fetch(`${API_BASE_URL}/interviews/sessions/${sessionId}/answers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(answerData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('[API] Answer added:', data);
      return data;
    } catch (error) {
      console.error('[API] Failed to add answer:', error);
      throw error;
    }
  },
};