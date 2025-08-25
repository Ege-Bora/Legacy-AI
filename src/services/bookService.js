// Book Service - Handles book generation, chapter creation, and PDF export
import { pdfService } from './pdfService';

const API_BASE_URL = 'http://192.168.1.155:8080';

// Mock book data for development
const MOCK_BOOKS = [
  {
    id: '1',
    title: 'My Life Story',
    subtitle: 'A Journey Through Time',
    author: 'John Doe',
    status: 'in_progress',
    progress: 0.65, // 65% complete
    coverImage: null,
    chapters: [
      {
        id: 'ch1',
        title: 'Early Years',
        content: 'I remember growing up in a small town where everyone knew each other. The streets were lined with oak trees that would turn golden in the fall, creating a magical canopy over our neighborhood...',
        memoryIds: ['1'], // References to source memories
        wordCount: 1250,
        status: 'completed',
        order: 1,
        createdAt: '2024-01-15T10:00:00Z'
      },
      {
        id: 'ch2', 
        title: 'Family Bonds',
        content: 'The most beautiful day of my life was when I married my soulmate. The ceremony was small but filled with love, surrounded by our closest family and friends...',
        memoryIds: ['2'],
        wordCount: 890,
        status: 'completed', 
        order: 2,
        createdAt: '2024-01-20T14:30:00Z'
      },
      {
        id: 'ch3',
        title: 'Career Journey', 
        content: 'Starting my first job was both exciting and terrifying. I walked into that office building with sweaty palms and a heart full of dreams...',
        memoryIds: ['3'],
        wordCount: 1100,
        status: 'completed',
        order: 3,
        createdAt: '2024-01-25T09:15:00Z'
      },
      {
        id: 'ch4',
        title: 'Family Traditions',
        content: 'Every Sunday, our whole family would gather at grandmas house for dinner. The smell of her famous pot roast would fill the entire house...',
        memoryIds: ['4'],
        wordCount: 750,
        status: 'draft',
        order: 4,
        createdAt: '2024-02-01T16:45:00Z'
      }
    ],
    metadata: {
      totalWords: 3990,
      estimatedPages: 16,
      completedChapters: 3,
      draftChapters: 1,
      targetChapters: 12,
      genre: 'memoir',
      language: 'en'
    },
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-02-01T16:45:00Z'
  }
];

export const bookService = {
  // Get all user books
  async getAllBooks() {
    try {
      console.log('[MOCK] Getting all books');
      await new Promise(resolve => setTimeout(resolve, 500));
      return {
        books: MOCK_BOOKS.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      };
    } catch (error) {
      console.error('[API] Failed to get books:', error);
      throw error;
    }
  },

  // Get book by ID
  async getBookById(bookId) {
    try {
      console.log('[MOCK] Getting book by ID:', bookId);
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const book = MOCK_BOOKS.find(b => b.id === bookId);
      if (!book) {
        throw new Error('Book not found');
      }
      
      return book;
    } catch (error) {
      console.error('[API] Failed to get book:', error);
      throw error;
    }
  },

  // Create new book
  async createBook(bookData) {
    try {
      console.log('[MOCK] Creating new book:', bookData);
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const newBook = {
        id: Date.now().toString(),
        title: bookData.title || 'My Life Story',
        subtitle: bookData.subtitle || '',
        author: bookData.author || 'Life Legacy User',
        status: 'draft',
        progress: 0,
        coverImage: null,
        chapters: [],
        metadata: {
          totalWords: 0,
          estimatedPages: 0,
          completedChapters: 0,
          draftChapters: 0,
          targetChapters: bookData.targetChapters || 10,
          genre: bookData.genre || 'memoir',
          language: bookData.language || 'en'
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      MOCK_BOOKS.push(newBook);
      return newBook;
    } catch (error) {
      console.error('[API] Failed to create book:', error);
      throw error;
    }
  },

  // Generate chapter from interview session
  async generateChapterFromInterview(interviewSessionId, bookId) {
    try {
      console.log('[MOCK] Generating chapter from interview:', interviewSessionId);
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate AI processing
      
      // Mock AI-generated chapter content
      const chapterContent = `
This chapter captures the essence of memories shared during an interview session. The stories flow naturally, weaving together moments that shaped a life worth remembering.

Each conversation revealed new layers of experience, from childhood adventures to life-changing decisions. The memories paint a vivid picture of resilience, love, and growth through the years.

The narrative unfolds with genuine emotion, bringing readers into intimate moments that define what it means to be human. These aren't just memories - they're the building blocks of a legacy.

Through laughter and tears, triumphs and challenges, this chapter honors the journey of a life well-lived. Every word carries the weight of experience and the hope of inspiration for future generations.

The stories continue to unfold, each one adding depth to the tapestry of a remarkable life story that deserves to be preserved and shared.
      `.trim();

      const newChapter = {
        id: `ch_${Date.now()}`,
        title: 'Life Reflections',
        content: chapterContent,
        memoryIds: [interviewSessionId],
        wordCount: chapterContent.split(' ').length,
        status: 'completed',
        order: MOCK_BOOKS[0].chapters.length + 1,
        createdAt: new Date().toISOString()
      };

      // Add chapter to book
      if (MOCK_BOOKS[0]) {
        MOCK_BOOKS[0].chapters.push(newChapter);
        MOCK_BOOKS[0].metadata.completedChapters++;
        MOCK_BOOKS[0].metadata.totalWords += newChapter.wordCount;
        MOCK_BOOKS[0].metadata.estimatedPages = Math.ceil(MOCK_BOOKS[0].metadata.totalWords / 250);
        MOCK_BOOKS[0].progress = MOCK_BOOKS[0].metadata.completedChapters / MOCK_BOOKS[0].metadata.targetChapters;
        MOCK_BOOKS[0].updatedAt = new Date().toISOString();
      }

      return newChapter;
    } catch (error) {
      console.error('[API] Failed to generate chapter:', error);
      throw error;
    }
  },

  // Generate chapter from memory collection
  async generateChapterFromMemories(memoryIds, chapterTitle, bookId) {
    try {
      console.log('[MOCK] Generating chapter from memories:', memoryIds);
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const chapterContent = `
This chapter weaves together cherished memories into a cohesive narrative that captures the heart of lived experience.

The memories flow seamlessly from one to another, creating a rich tapestry of moments that define this period of life. Each recollection adds depth and meaning to the overall story.

From quiet moments of reflection to significant life events, these memories combine to tell a powerful story of growth, love, and discovery. The details emerge with clarity, bringing the past vividly into the present.

The narrative captures not just what happened, but how it felt - the emotions, the thoughts, the impact that shaped the journey forward. These memories become more than individual moments; they transform into a meaningful chapter of a life story.

Together, these recollections form a beautiful segment of a larger journey, one that deserves to be preserved and shared with those who matter most.
      `.trim();

      const newChapter = {
        id: `ch_${Date.now()}`,
        title: chapterTitle || 'Cherished Memories',
        content: chapterContent,
        memoryIds: memoryIds,
        wordCount: chapterContent.split(' ').length,
        status: 'completed',
        order: MOCK_BOOKS[0].chapters.length + 1,
        createdAt: new Date().toISOString()
      };

      // Add to book
      if (MOCK_BOOKS[0]) {
        MOCK_BOOKS[0].chapters.push(newChapter);
        MOCK_BOOKS[0].metadata.completedChapters++;
        MOCK_BOOKS[0].metadata.totalWords += newChapter.wordCount;
        MOCK_BOOKS[0].metadata.estimatedPages = Math.ceil(MOCK_BOOKS[0].metadata.totalWords / 250);
        MOCK_BOOKS[0].progress = MOCK_BOOKS[0].metadata.completedChapters / MOCK_BOOKS[0].metadata.targetChapters;
        MOCK_BOOKS[0].updatedAt = new Date().toISOString();
      }

      return newChapter;
    } catch (error) {
      console.error('[API] Failed to generate chapter from memories:', error);
      throw error;
    }
  },

  // Get book statistics
  async getBookStats(bookId) {
    try {
      console.log('[MOCK] Getting book statistics:', bookId);
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const book = MOCK_BOOKS.find(b => b.id === bookId);
      if (!book) {
        throw new Error('Book not found');
      }

      return {
        totalWords: book.metadata.totalWords,
        estimatedPages: book.metadata.estimatedPages,
        completedChapters: book.metadata.completedChapters,
        draftChapters: book.metadata.draftChapters,
        progress: book.progress,
        lastUpdated: book.updatedAt
      };
    } catch (error) {
      console.error('[API] Failed to get book stats:', error);
      throw error;
    }
  },

  // Export book as PDF
  async exportBookAsPDF(bookId, options = {}) {
    try {
      console.log('[REAL PDF] Exporting book as PDF:', bookId, options);
      
      const book = MOCK_BOOKS.find(b => b.id === bookId);
      if (!book) {
        throw new Error('Book not found');
      }

      // Use real PDF service to generate PDF
      const result = await pdfService.generateBookPDF(book, options);
      
      return {
        success: result.success,
        uri: result.uri,
        filename: result.filename,
        fileSize: result.fileSize,
        pageCount: result.pageCount,
        exportedAt: result.createdAt
      };
    } catch (error) {
      console.error('[API] Failed to export book as PDF:', error);
      throw error;
    }
  },

  // Share exported PDF
  async sharePDF(pdfUri, filename) {
    try {
      console.log('[REAL PDF] Sharing PDF:', filename);
      return await pdfService.sharePDF(pdfUri, filename);
    } catch (error) {
      console.error('[API] Failed to share PDF:', error);
      throw error;
    }
  },

  // Update chapter
  async updateChapter(bookId, chapterId, updates) {
    try {
      console.log('[MOCK] Updating chapter:', chapterId, updates);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const book = MOCK_BOOKS.find(b => b.id === bookId);
      if (!book) {
        throw new Error('Book not found');
      }

      const chapterIndex = book.chapters.findIndex(ch => ch.id === chapterId);
      if (chapterIndex === -1) {
        throw new Error('Chapter not found');
      }

      // Update chapter
      book.chapters[chapterIndex] = {
        ...book.chapters[chapterIndex],
        ...updates,
        wordCount: updates.content ? updates.content.split(' ').length : book.chapters[chapterIndex].wordCount,
        updatedAt: new Date().toISOString()
      };

      // Recalculate book metadata
      book.metadata.totalWords = book.chapters.reduce((sum, ch) => sum + ch.wordCount, 0);
      book.metadata.estimatedPages = Math.ceil(book.metadata.totalWords / 250);
      book.updatedAt = new Date().toISOString();

      return book.chapters[chapterIndex];
    } catch (error) {
      console.error('[API] Failed to update chapter:', error);
      throw error;
    }
  },

  // Delete chapter
  async deleteChapter(bookId, chapterId) {
    try {
      console.log('[MOCK] Deleting chapter:', chapterId);
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const book = MOCK_BOOKS.find(b => b.id === bookId);
      if (!book) {
        throw new Error('Book not found');
      }

      const chapterIndex = book.chapters.findIndex(ch => ch.id === chapterId);
      if (chapterIndex === -1) {
        throw new Error('Chapter not found');
      }

      book.chapters.splice(chapterIndex, 1);
      
      // Recalculate metadata
      book.metadata.completedChapters = book.chapters.filter(ch => ch.status === 'completed').length;
      book.metadata.draftChapters = book.chapters.filter(ch => ch.status === 'draft').length;
      book.metadata.totalWords = book.chapters.reduce((sum, ch) => sum + ch.wordCount, 0);
      book.metadata.estimatedPages = Math.ceil(book.metadata.totalWords / 250);
      book.progress = book.metadata.completedChapters / book.metadata.targetChapters;
      book.updatedAt = new Date().toISOString();

      return { success: true };
    } catch (error) {
      console.error('[API] Failed to delete chapter:', error);
      throw error;
    }
  },

  // Get chapter suggestions based on existing memories
  async getChapterSuggestions() {
    try {
      console.log('[MOCK] Getting chapter suggestions');
      await new Promise(resolve => setTimeout(resolve, 400));
      
      return {
        suggestions: [
          {
            title: 'Childhood Adventures',
            description: 'Stories from your early years and formative experiences',
            memoryCount: 3,
            estimatedWords: 1200,
            priority: 'high'
          },
          {
            title: 'Family Milestones', 
            description: 'Important family events and celebrations',
            memoryCount: 2,
            estimatedWords: 800,
            priority: 'medium'
          },
          {
            title: 'Career Highlights',
            description: 'Professional achievements and work experiences',
            memoryCount: 2,
            estimatedWords: 1000,
            priority: 'medium'
          },
          {
            title: 'Life Lessons',
            description: 'Wisdom gained through experiences and challenges',
            memoryCount: 1,
            estimatedWords: 600,
            priority: 'low'
          }
        ]
      };
    } catch (error) {
      console.error('[API] Failed to get chapter suggestions:', error);
      throw error;
    }
  }
};