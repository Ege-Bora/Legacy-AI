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
  Share,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { memoryService } from '../services/memoryService';

export default function MemoryDetailScreen({ memoryId, navigation, onClose }) {
  const [memory, setMemory] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (memoryId) {
      loadMemory();
    }
  }, [memoryId]);

  const loadMemory = async () => {
    try {
      setIsLoading(true);
      const memoryData = await memoryService.getMemoryById(memoryId);
      setMemory(memoryData);
    } catch (error) {
      Alert.alert('Error', 'Failed to load memory details');
      console.error('Load memory error:', error);
      if (onClose) onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleShare = async () => {
    try {
      const content = `${memory.title}\n\n${memory.content}\n\nCaptured on ${formatDate(memory.createdAt)}`;
      await Share.share({
        message: content,
        title: memory.title
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Memory',
      'Are you sure you want to delete this memory? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: confirmDelete
        }
      ]
    );
  };

  const confirmDelete = async () => {
    try {
      setIsDeleting(true);
      await memoryService.deleteMemory(memoryId);
      Alert.alert(
        'Memory Deleted',
        'Your memory has been successfully deleted.',
        [{ text: 'OK', onPress: onClose }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to delete memory');
      console.error('Delete memory error:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const getMemoryTypeLabel = (type) => {
    return type === 'interview' ? 'AI Interview' : 'Freeform Memory';
  };

  const getMemoryTypeColor = (type) => {
    return type === 'interview' ? '#007AFF' : '#00A86B';
  };

  const getCategoryIcon = (category) => {
    const categoryMap = {
      childhood: 'happy',
      family: 'people',
      career: 'briefcase',
      general: 'bookmark'
    };
    return categoryMap[category] || 'bookmark';
  };

  if (isLoading) {
    return (
      <Modal visible={true} animationType="slide">
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Loading...</Text>
            <View style={{ width: 24 }} />
          </View>
          
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Loading memory details...</Text>
          </View>
        </SafeAreaView>
      </Modal>
    );
  }

  if (!memory) {
    return (
      <Modal visible={true} animationType="slide">
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Error</Text>
            <View style={{ width: 24 }} />
          </View>
          
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={64} color="#FF3B30" />
            <Text style={styles.errorTitle}>Memory not found</Text>
            <Text style={styles.errorSubtitle}>This memory may have been deleted</Text>
          </View>
        </SafeAreaView>
      </Modal>
    );
  }

  return (
    <Modal visible={true} animationType="slide">
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Memory Details</Text>
          <TouchableOpacity onPress={handleShare}>
            <Ionicons name="share-outline" size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Memory Header */}
          <View style={styles.memoryHeader}>
            <View style={styles.titleSection}>
              <Text style={styles.memoryTitle}>{memory.title}</Text>
              <Text style={styles.memoryDate}>{formatDate(memory.createdAt)}</Text>
            </View>
            
            <View style={styles.metaSection}>
              <View style={styles.typeTag}>
                <Text style={[styles.typeTagText, { color: getMemoryTypeColor(memory.type) }]}>
                  {getMemoryTypeLabel(memory.type)}
                </Text>
              </View>
              
              <View style={styles.categoryTag}>
                <Ionicons 
                  name={getCategoryIcon(memory.category)} 
                  size={16} 
                  color="#666" 
                />
                <Text style={styles.categoryTagText}>{memory.category}</Text>
              </View>
            </View>
          </View>

          {/* Memory Content */}
          <View style={styles.contentSection}>
            <Text style={styles.contentLabel}>Content</Text>
            <Text style={styles.contentText}>{memory.content}</Text>
          </View>

          {/* Interview Stats */}
          {memory.type === 'interview' && (
            <View style={styles.statsSection}>
              <Text style={styles.sectionTitle}>Interview Details</Text>
              <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                  <Ionicons name="help-circle" size={24} color="#007AFF" />
                  <Text style={styles.statNumber}>{memory.questionCount || 0}</Text>
                  <Text style={styles.statLabel}>Questions</Text>
                </View>
                <View style={styles.statCard}>
                  <Ionicons name="time" size={24} color="#007AFF" />
                  <Text style={styles.statNumber}>{memory.duration || 0}</Text>
                  <Text style={styles.statLabel}>Minutes</Text>
                </View>
                <View style={styles.statCard}>
                  <Ionicons name="checkmark-circle" size={24} color="#00A86B" />
                  <Text style={styles.statNumber}>{memory.status === 'completed' ? 'Yes' : 'No'}</Text>
                  <Text style={styles.statLabel}>Completed</Text>
                </View>
              </View>
            </View>
          )}

          {/* Audio Section */}
          {memory.audioPath && (
            <View style={styles.audioSection}>
              <Text style={styles.sectionTitle}>Audio Recording</Text>
              <View style={styles.audioCard}>
                <Ionicons name="volume-high" size={32} color="#007AFF" />
                <View style={styles.audioInfo}>
                  <Text style={styles.audioTitle}>Voice Recording</Text>
                  <Text style={styles.audioSubtitle}>Tap to play audio</Text>
                </View>
                <TouchableOpacity style={styles.playButton}>
                  <Ionicons name="play" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Actions Section */}
          <View style={styles.actionsSection}>
            <TouchableOpacity style={styles.editButton} onPress={() => {}}>
              <Ionicons name="create" size={20} color="#007AFF" />
              <Text style={styles.editButtonText}>Edit Memory</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.deleteButton, isDeleting && styles.deleteButtonDisabled]} 
              onPress={handleDelete}
              disabled={isDeleting}
            >
              <Ionicons 
                name="trash" 
                size={20} 
                color={isDeleting ? "#999" : "#FF3B30"} 
              />
              <Text style={[styles.deleteButtonText, isDeleting && styles.deleteButtonTextDisabled]}>
                {isDeleting ? 'Deleting...' : 'Delete Memory'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E7',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  errorSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  memoryHeader: {
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  titleSection: {
    marginBottom: 16,
  },
  memoryTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    lineHeight: 32,
  },
  memoryDate: {
    fontSize: 16,
    color: '#666',
  },
  metaSection: {
    flexDirection: 'row',
    gap: 12,
  },
  typeTag: {
    backgroundColor: '#E8F4FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  typeTagText: {
    fontSize: 14,
    fontWeight: '600',
  },
  categoryTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  categoryTagText: {
    fontSize: 14,
    color: '#666',
    textTransform: 'capitalize',
    fontWeight: '500',
  },
  contentSection: {
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  contentLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  contentText: {
    fontSize: 16,
    color: '#555',
    lineHeight: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  statsSection: {
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginVertical: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  audioSection: {
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  audioCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
  },
  audioInfo: {
    flex: 1,
    marginLeft: 16,
  },
  audioTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  audioSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionsSection: {
    paddingVertical: 24,
    gap: 12,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F8FF',
    padding: 16,
    borderRadius: 12,
    justifyContent: 'center',
    gap: 8,
  },
  editButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0F0',
    padding: 16,
    borderRadius: 12,
    justifyContent: 'center',
    gap: 8,
  },
  deleteButtonDisabled: {
    backgroundColor: '#F5F5F5',
  },
  deleteButtonText: {
    fontSize: 16,
    color: '#FF3B30',
    fontWeight: '600',
  },
  deleteButtonTextDisabled: {
    color: '#999',
  },
});