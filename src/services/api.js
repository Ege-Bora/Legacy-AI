import { API_BASE_URL } from '../config';

// Backend API integration
const API_URL = 'http://192.168.1.155:8080'; // Use actual backend URL

// Mock data for development
const mockChapters = [
  {
    id: '1',
    title: 'Childhood Memories',
    content: 'Growing up in a small town, I remember the smell of fresh bread from the bakery down the street...',
    date: '2024-01-15',
    type: 'chapter',
    media: []
  },
  {
    id: '2',
    title: 'First Day of School',
    content: 'The nervousness I felt walking into that classroom for the first time...',
    date: '2024-01-20',
    type: 'chapter',
    media: ['photo1.jpg']
  },
  {
    id: '3',
    title: 'Quick Memory: Family Dinner',
    content: 'Had the most amazing dinner with family tonight. Mom made her famous lasagna.',
    date: '2024-01-25',
    type: 'log',
    media: []
  }
];

const mockInterviewQuestions = [
  "Tell me about your earliest childhood memory.",
  "What was your favorite place to visit as a child?",
  "Describe a moment that changed your perspective on life.",
  "What traditions did your family have when you were growing up?",
  "Tell me about a person who had a significant impact on your life."
];

// Simulated API delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const api = {
  // Authentication
  async loginWithGoogle() {
    await delay(1000);
    return {
      success: true,
      user: {
        id: 'google_123',
        name: 'John Doe',
        email: 'john@gmail.com',
        provider: 'google'
      }
    };
  },

  async loginWithApple() {
    await delay(1000);
    return {
      success: true,
      user: {
        id: 'apple_123',
        name: 'John Doe',
        email: 'john@icloud.com',
        provider: 'apple'
      }
    };
  },

  // Interview
  async startInterview() {
    try {
      const response = await fetch(`${API_URL}/interviews/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: 'demo-user'
        }),
      });

      if (response.ok) {
        const result = await response.json();
        return {
          success: true,
          sessionId: result.sessionId,
          questions: result.questions || mockInterviewQuestions
        };
      } else {
        throw new Error(`Interview start failed: ${response.statusText}`);
      }
    } catch (error) {
      console.warn('Interview API failed, using mock:', error);
      await delay(500);
      return {
        success: true,
        sessionId: 'interview_' + Date.now(),
        questions: mockInterviewQuestions
      };
    }
  },

  async saveInterviewResponse(sessionId, questionIndex, response, isVoice = false) {
    await delay(800);
    return {
      success: true,
      message: 'Response saved successfully',
      nextQuestion: questionIndex < mockInterviewQuestions.length - 1 ? 
        mockInterviewQuestions[questionIndex + 1] : null
    };
  },

  async generateChapterFromInterview(sessionId) {
    await delay(2000);
    return {
      success: true,
      chapter: {
        id: 'chapter_' + Date.now(),
        title: 'AI Generated Chapter',
        content: 'Based on your interview responses, here is your life story chapter...',
        date: new Date().toISOString().split('T')[0],
        type: 'chapter',
        media: []
      }
    };
  },

  // Quick Capture
  async saveQuickLog(content, isVoice = false) {
    await delay(500);
    return {
      success: true,
      log: {
        id: 'log_' + Date.now(),
        title: 'Quick Memory: ' + content.substring(0, 30) + '...',
        content: content,
        date: new Date().toISOString().split('T')[0],
        type: 'log',
        media: []
      }
    };
  },

  // Timeline
  async getTimeline() {
    await delay(800);
    return {
      success: true,
      items: mockChapters.sort((a, b) => new Date(b.date) - new Date(a.date))
    };
  },

  // Editor
  async updateChapter(chapterId, updates) {
    await delay(600);
    return {
      success: true,
      chapter: {
        ...mockChapters.find(c => c.id === chapterId),
        ...updates,
        updatedAt: new Date().toISOString()
      }
    };
  },

  async regenerateChapterWithAI(chapterId, prompt) {
    await delay(3000);
    return {
      success: true,
      content: 'Here is the AI-regenerated content based on your prompt: ' + prompt + '...'
    };
  },

  async uploadMedia(file, chapterId) {
    await delay(1500);
    return {
      success: true,
      mediaUrl: 'https://example.com/media/' + Date.now() + '_' + file.name,
      mediaId: 'media_' + Date.now()
    };
  },

  // Book Generation
  async getBookProgress() {
    await delay(500);
    return {
      success: true,
      progress: {
        totalChapters: mockChapters.filter(c => c.type === 'chapter').length,
        estimatedPages: 45,
        completionPercentage: 65,
        lastUpdated: new Date().toISOString()
      }
    };
  },

  async generateBook(format = 'pdf') {
    try {
      const response = await fetch(`${API_URL}/books/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: 'demo-user',
          format: format
        }),
      });

      if (response.ok) {
        const result = await response.json();
        return {
          success: true,
          jobId: result.jobId,
          format: format,
          generatedAt: new Date().toISOString()
        };
      } else {
        throw new Error(`Book generation failed: ${response.statusText}`);
      }
    } catch (error) {
      console.warn('Book generation API failed, using mock:', error);
      await delay(2000);
      return {
        success: true,
        jobId: 'mock-job-' + Date.now(),
        format: format,
        generatedAt: new Date().toISOString()
      };
    }
  },

  // Voice Recording and Memo Upload
  async uploadMemo(audioUri, fileName = 'voice-memo.m4a') {
    try {
      const formData = new FormData();
      formData.append('file', {
        uri: audioUri,
        type: 'audio/m4a',
        name: fileName
      });

      const response = await fetch(`${API_URL}/memos/upload`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.ok) {
        const result = await response.json();
        return {
          success: true,
          memoId: result.memoId,
          message: 'Memo uploaded successfully'
        };
      } else {
        throw new Error(`Upload failed: ${response.statusText}`);
      }
    } catch (error) {
      console.warn('Memo upload API failed, using mock:', error);
      await delay(1000);
      return {
        success: true,
        memoId: 'mock-memo-' + Date.now(),
        message: 'Mock memo created'
      };
    }
  },

  async transcribeMemo(memoId) {
    try {
      const response = await fetch(`${API_URL}/memos/${memoId}/transcribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      if (response.ok) {
        const result = await response.json();
        return {
          success: true,
          jobId: result.jobId,
          message: 'Transcription started'
        };
      } else {
        throw new Error(`Transcription failed: ${response.statusText}`);
      }
    } catch (error) {
      console.warn('Transcription API failed, using mock:', error);
      await delay(2000);
      return {
        success: true,
        jobId: 'mock-transcription-' + Date.now(),
        transcription: 'This is a mock transcription of your voice memo...'
      };
    }
  },

  async getJobStatus(jobId) {
    try {
      const response = await fetch(`${API_URL}/memos/jobs/${jobId}/status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        return {
          success: true,
          ...result
        };
      } else {
        throw new Error(`Job status check failed: ${response.statusText}`);
      }
    } catch (error) {
      console.warn('Job status API failed, using mock:', error);
      await delay(500);
      return {
        success: true,
        status: 'completed',
        data: {
          transcript: 'Mock transcription completed successfully.'
        }
      };
    }
  },

  async transcribeAudio(audioUri) {
    await delay(2000);
    return {
      success: true,
      transcription: 'This is a mock transcription of the audio recording...'
    };
  },

  // Notifications
  async scheduleReminder(type, time) {
    await delay(300);
    return {
      success: true,
      reminderId: 'reminder_' + Date.now(),
      message: 'Reminder scheduled successfully'
    };
  }
};
