import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  RefreshControl,
  Modal,
  TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { bookService } from '../services/bookService';

export default function BookPreviewScreen({ navigation, onChapterPress, onExportPress }) {
  const [books, setBooks] = useState([]);
  const [currentBook, setCurrentBook] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [suggestions, setSuggestions] = useState([]);

  // Create book form
  const [newBookTitle, setNewBookTitle] = useState('My Life Story');
  const [newBookSubtitle, setNewBookSubtitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    loadBooks();
    loadSuggestions();
  }, []);

  const loadBooks = async () => {
    try {
      setIsLoading(true);
      const response = await bookService.getAllBooks();
      setBooks(response.books);
      if (response.books.length > 0) {
        setCurrentBook(response.books[0]); // Show first book
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load books');
      console.error('Load books error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSuggestions = async () => {
    try {
      const response = await bookService.getChapterSuggestions();
      setSuggestions(response.suggestions);
    } catch (error) {
      console.error('Load suggestions error:', error);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadBooks();
    await loadSuggestions();
    setIsRefreshing(false);
  };

  const handleCreateBook = async () => {
    if (!newBookTitle.trim()) {
      Alert.alert('Error', 'Please enter a book title');
      return;
    }

    try {
      setIsCreating(true);
      const bookData = {
        title: newBookTitle.trim(),
        subtitle: newBookSubtitle.trim(),
        author: 'Life Legacy User',
        targetChapters: 10
      };

      const newBook = await bookService.createBook(bookData);
      setBooks(prev => [newBook, ...prev]);
      setCurrentBook(newBook);
      setShowCreateModal(false);
      setNewBookTitle('My Life Story');
      setNewBookSubtitle('');
      
      Alert.alert('Success', 'Your new book has been created!');
    } catch (error) {
      Alert.alert('Error', 'Failed to create book');
      console.error('Create book error:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleGenerateChapter = async (suggestion) => {
    try {
      setIsGenerating(true);
      
      Alert.alert(
        'Generate Chapter',
        `Create a new chapter: "${suggestion.title}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Generate',
            onPress: async () => {
              try {
                // Mock memory IDs based on suggestion
                const mockMemoryIds = ['1', '2'].slice(0, suggestion.memoryCount);
                const newChapter = await bookService.generateChapterFromMemories(
                  mockMemoryIds,
                  suggestion.title,
                  currentBook.id
                );

                // Refresh current book
                const updatedBook = await bookService.getBookById(currentBook.id);
                setCurrentBook(updatedBook);
                
                Alert.alert(
                  'Chapter Generated!',
                  `"${newChapter.title}" has been added to your book with ${newChapter.wordCount} words.`
                );
              } catch (error) {
                Alert.alert('Error', 'Failed to generate chapter');
                console.error('Generate chapter error:', error);
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Handle generate chapter error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExportBook = async () => {
    if (!currentBook) return;

    try {
      Alert.alert(
        'Export Book',
        `Export "${currentBook.title}" as PDF?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Export',
            onPress: async () => {
              try {
                setShowExportModal(true);
                const result = await bookService.exportBookAsPDF(currentBook.id);
                setShowExportModal(false);
                
                Alert.alert(
                  '📚 Export Complete!',
                  `Your book has been exported successfully!\n\nFile: ${result.filename}\nSize: ${result.fileSize}\nPages: ${result.pageCount}`,
                  [
                    { text: 'Done', style: 'cancel' },
                    { 
                      text: 'Share PDF', 
                      onPress: async () => {
                        try {
                          await bookService.sharePDF(result.uri, result.filename);
                        } catch (shareError) {
                          Alert.alert('Share Error', 'Failed to share PDF');
                          console.error('Share error:', shareError);
                        }
                      }
                    }
                  ]
                );
              } catch (error) {
                setShowExportModal(false);
                Alert.alert('Error', 'Failed to export book');
                console.error('Export error:', error);
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Handle export error:', error);
    }
  };

  const formatProgress = (progress) => {
    return Math.round(progress * 100);
  };

  const getChapterStatusColor = (status) => {
    return status === 'completed' ? '#00A86B' : '#FFA500';
  };

  const getChapterStatusIcon = (status) => {
    return status === 'completed' ? 'checkmark-circle' : 'create';
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading your book...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!currentBook) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView 
          contentContainerStyle={styles.emptyContainer}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
        >
          <View style={styles.emptyState}>
            <Ionicons name="book-outline" size={64} color="#ccc" />
            <Text style={styles.emptyTitle}>No books yet</Text>
            <Text style={styles.emptySubtitle}>
              Create your first book from your captured memories
            </Text>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => setShowCreateModal(true)}
            >
              <Ionicons name="add" size={20} color="#fff" />
              <Text style={styles.createButtonText}>Create Your First Book</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.content}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Book Header */}
        <View style={styles.bookHeader}>
          <View style={styles.bookCover}>
            <Ionicons name="book" size={32} color="#007AFF" />
          </View>
          
          <View style={styles.bookInfo}>
            <Text style={styles.bookTitle}>{currentBook.title}</Text>
            {currentBook.subtitle && (
              <Text style={styles.bookSubtitle}>{currentBook.subtitle}</Text>
            )}
            <Text style={styles.bookAuthor}>by {currentBook.author}</Text>
          </View>

          <TouchableOpacity
            style={styles.exportButton}
            onPress={handleExportBook}
          >
            <Ionicons name="download" size={20} color="#007AFF" />
          </TouchableOpacity>
        </View>

        {/* Progress Section */}
        <View style={styles.progressSection}>
          <Text style={styles.sectionTitle}>Progress</Text>
          <View style={styles.progressBar}>
            <View 
              style={[styles.progressFill, { width: `${formatProgress(currentBook.progress)}%` }]} 
            />
          </View>
          <Text style={styles.progressText}>
            {formatProgress(currentBook.progress)}% complete
          </Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{currentBook.metadata.completedChapters}</Text>
            <Text style={styles.statLabel}>Chapters</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{currentBook.metadata.totalWords.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Words</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{currentBook.metadata.estimatedPages}</Text>
            <Text style={styles.statLabel}>Pages</Text>
          </View>
        </View>

        {/* Chapters Section */}
        <View style={styles.chaptersSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Chapters</Text>
            <Text style={styles.chapterCount}>
              {currentBook.chapters.length} chapters
            </Text>
          </View>

          {currentBook.chapters.map((chapter, index) => (
            <TouchableOpacity
              key={chapter.id}
              style={styles.chapterCard}
              onPress={() => onChapterPress && onChapterPress(chapter)}
            >
              <View style={styles.chapterHeader}>
                <View style={styles.chapterNumber}>
                  <Text style={styles.chapterNumberText}>{chapter.order}</Text>
                </View>
                <View style={styles.chapterInfo}>
                  <Text style={styles.chapterTitle}>{chapter.title}</Text>
                  <View style={styles.chapterMeta}>
                    <Ionicons
                      name={getChapterStatusIcon(chapter.status)}
                      size={14}
                      color={getChapterStatusColor(chapter.status)}
                    />
                    <Text style={styles.chapterWords}>{chapter.wordCount} words</Text>
                    <Text style={styles.chapterSeparator}>•</Text>
                    <Text style={styles.chapterStatus}>{chapter.status}</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#999" />
              </View>
              
              <Text style={styles.chapterPreview} numberOfLines={2}>
                {chapter.content}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Chapter Suggestions */}
        <View style={styles.suggestionsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Suggested Chapters</Text>
            <Text style={styles.suggestionSubtitle}>Based on your memories</Text>
          </View>

          {suggestions.map((suggestion, index) => (
            <TouchableOpacity
              key={index}
              style={styles.suggestionCard}
              onPress={() => handleGenerateChapter(suggestion)}
              disabled={isGenerating}
            >
              <View style={styles.suggestionHeader}>
                <Ionicons name="bulb" size={20} color="#FFA500" />
                <View style={styles.suggestionInfo}>
                  <Text style={styles.suggestionTitle}>{suggestion.title}</Text>
                  <Text style={styles.suggestionDescription}>{suggestion.description}</Text>
                </View>
                <View style={styles.suggestionMeta}>
                  <Text style={styles.suggestionCount}>{suggestion.memoryCount} memories</Text>
                  <Text style={styles.suggestionWords}>{suggestion.estimatedWords} words</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Create Book Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowCreateModal(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Create New Book</Text>
            <TouchableOpacity
              onPress={handleCreateBook}
              disabled={isCreating || !newBookTitle.trim()}
            >
              <Text style={[
                styles.modalCreate,
                (!newBookTitle.trim() || isCreating) && styles.modalCreateDisabled
              ]}>
                {isCreating ? 'Creating...' : 'Create'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <Text style={styles.formLabel}>Book Title *</Text>
            <TextInput
              style={styles.formInput}
              value={newBookTitle}
              onChangeText={setNewBookTitle}
              placeholder="My Life Story"
              autoFocus
            />

            <Text style={styles.formLabel}>Subtitle (Optional)</Text>
            <TextInput
              style={styles.formInput}
              value={newBookSubtitle}
              onChangeText={setNewBookSubtitle}
              placeholder="A Journey Through Time"
            />

            <Text style={styles.formHint}>
              Your book will be created with space for 10 chapters. You can add more chapters as you continue capturing memories.
            </Text>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Export Modal */}
      <Modal
        visible={showExportModal}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.exportModalOverlay}>
          <View style={styles.exportModalContent}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.exportModalText}>Generating PDF...</Text>
            <Text style={styles.exportModalSubtext}>This may take a few moments</Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  bookHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F8F9FA',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 16,
    gap: 16,
  },
  bookCover: {
    width: 60,
    height: 80,
    backgroundColor: '#E8F4FF',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookInfo: {
    flex: 1,
  },
  bookTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  bookSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  bookAuthor: {
    fontSize: 14,
    color: '#999',
  },
  exportButton: {
    padding: 8,
  },
  progressSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E5E7',
    borderRadius: 4,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'right',
  },
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  chaptersSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 16,
  },
  chapterCount: {
    fontSize: 14,
    color: '#666',
  },
  chapterCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  chapterHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  chapterNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  chapterNumberText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  chapterInfo: {
    flex: 1,
  },
  chapterTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 6,
  },
  chapterMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chapterWords: {
    fontSize: 14,
    color: '#666',
  },
  chapterSeparator: {
    fontSize: 14,
    color: '#ccc',
  },
  chapterStatus: {
    fontSize: 14,
    color: '#666',
    textTransform: 'capitalize',
  },
  chapterPreview: {
    fontSize: 16,
    color: '#555',
    lineHeight: 22,
  },
  suggestionsSection: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  suggestionSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  suggestionCard: {
    backgroundColor: '#FFF8E1',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FFE0B2',
  },
  suggestionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  suggestionInfo: {
    flex: 1,
  },
  suggestionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  suggestionDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
  suggestionMeta: {
    alignItems: 'flex-end',
  },
  suggestionCount: {
    fontSize: 12,
    color: '#FF8F00',
    fontWeight: '600',
  },
  suggestionWords: {
    fontSize: 12,
    color: '#999',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E7',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalCancel: {
    fontSize: 16,
    color: '#007AFF',
  },
  modalCreate: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  modalCreateDisabled: {
    color: '#999',
  },
  modalContent: {
    padding: 20,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 16,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#E5E5E7',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  formHint: {
    fontSize: 14,
    color: '#666',
    marginTop: 16,
    lineHeight: 20,
  },
  exportModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  exportModalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    minWidth: 200,
  },
  exportModalText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  exportModalSubtext: {
    fontSize: 14,
    color: '#666',
  },
});