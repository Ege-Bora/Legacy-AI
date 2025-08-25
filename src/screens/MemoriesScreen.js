import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
  TextInput,
  ActivityIndicator,
  SafeAreaView,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { memoryService } from '../services/memoryService';

export default function MemoriesScreen({ navigation, onMemoryPress }) {
  const [memories, setMemories] = useState([]);
  const [filteredMemories, setFilteredMemories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [stats, setStats] = useState({});

  const categories = [
    { key: 'all', label: 'All', icon: 'list' },
    { key: 'childhood', label: 'Childhood', icon: 'happy' },
    { key: 'family', label: 'Family', icon: 'people' },
    { key: 'career', label: 'Career', icon: 'briefcase' },
    { key: 'general', label: 'General', icon: 'bookmark' }
  ];

  useEffect(() => {
    loadMemories();
    loadStats();
  }, []);

  useEffect(() => {
    filterMemories();
  }, [memories, searchQuery, selectedCategory]);

  const loadMemories = async () => {
    try {
      setIsLoading(true);
      const response = await memoryService.getAllMemories();
      setMemories(response.memories);
    } catch (error) {
      Alert.alert('Error', 'Failed to load memories');
      console.error('Load memories error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await memoryService.getMemoryStats();
      setStats(statsData);
    } catch (error) {
      console.error('Load stats error:', error);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadMemories();
    await loadStats();
    setIsRefreshing(false);
  };

  const filterMemories = () => {
    let filtered = memories;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(memory => memory.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(memory =>
        memory.title.toLowerCase().includes(query) ||
        memory.content.toLowerCase().includes(query)
      );
    }

    setFilteredMemories(filtered);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getMemoryTypeIcon = (type) => {
    return type === 'interview' ? 'chatbubbles' : 'create';
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

  const handleMemoryPress = (memory) => {
    if (onMemoryPress) {
      onMemoryPress(memory);
    }
  };

  const renderMemoryItem = ({ item }) => (
    <TouchableOpacity
      style={styles.memoryCard}
      onPress={() => handleMemoryPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.memoryHeader}>
        <View style={styles.memoryTypeIndicator}>
          <Ionicons
            name={getMemoryTypeIcon(item.type)}
            size={20}
            color={getMemoryTypeColor(item.type)}
          />
        </View>
        <View style={styles.memoryInfo}>
          <Text style={styles.memoryTitle}>{item.title}</Text>
          <View style={styles.memoryMeta}>
            <Ionicons
              name={getCategoryIcon(item.category)}
              size={14}
              color="#666"
            />
            <Text style={styles.memoryCategory}>{item.category}</Text>
            <Text style={styles.memorySeparator}>•</Text>
            <Text style={styles.memoryDate}>{formatDate(item.createdAt)}</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#999" />
      </View>

      <Text style={styles.memoryPreview} numberOfLines={2}>
        {item.content}
      </Text>

      {item.type === 'interview' && (
        <View style={styles.interviewStats}>
          <View style={styles.statItem}>
            <Ionicons name="help-circle" size={16} color="#666" />
            <Text style={styles.statText}>{item.questionCount} questions</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="time" size={16} color="#666" />
            <Text style={styles.statText}>{item.duration}min</Text>
          </View>
        </View>
      )}

      {item.audioPath && (
        <View style={styles.audioIndicator}>
          <Ionicons name="volume-high" size={16} color="#007AFF" />
          <Text style={styles.audioText}>Audio recording</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      {/* Stats Overview */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.total || 0}</Text>
          <Text style={styles.statLabel}>Total Memories</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.interviews || 0}</Text>
          <Text style={styles.statLabel}>Interviews</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.freeform || 0}</Text>
          <Text style={styles.statLabel}>Free Form</Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#999" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search memories..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999"
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Category Filters */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.categoryContainer}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category.key}
            style={[
              styles.categoryButton,
              selectedCategory === category.key && styles.categoryButtonActive
            ]}
            onPress={() => setSelectedCategory(category.key)}
          >
            <Ionicons
              name={category.icon}
              size={18}
              color={selectedCategory === category.key ? '#fff' : '#666'}
            />
            <Text style={[
              styles.categoryText,
              selectedCategory === category.key && styles.categoryTextActive
            ]}>
              {category.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Results Header */}
      <View style={styles.resultsHeader}>
        <Text style={styles.resultsText}>
          {filteredMemories.length} {filteredMemories.length === 1 ? 'memory' : 'memories'}
          {searchQuery && ` for "${searchQuery}"`}
        </Text>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading memories...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={filteredMemories}
        keyExtractor={(item) => item.id}
        renderItem={renderMemoryItem}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor="#007AFF"
          />
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <Ionicons name="folder-open-outline" size={64} color="#ccc" />
            <Text style={styles.emptyTitle}>
              {searchQuery || selectedCategory !== 'all' 
                ? 'No memories found' 
                : 'No memories yet'
              }
            </Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery || selectedCategory !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Start capturing your life stories!'
              }
            </Text>
          </View>
        )}
      />
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
  listContainer: {
    paddingBottom: 20,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    marginBottom: 24,
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
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  searchContainer: {
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  categoryContainer: {
    marginBottom: 16,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    gap: 6,
  },
  categoryButtonActive: {
    backgroundColor: '#007AFF',
  },
  categoryText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  categoryTextActive: {
    color: '#fff',
  },
  resultsHeader: {
    marginBottom: 8,
  },
  resultsText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  memoryCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  memoryHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  memoryTypeIndicator: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  memoryInfo: {
    flex: 1,
  },
  memoryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  memoryMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  memoryCategory: {
    fontSize: 14,
    color: '#666',
    textTransform: 'capitalize',
  },
  memorySeparator: {
    fontSize: 14,
    color: '#ccc',
  },
  memoryDate: {
    fontSize: 14,
    color: '#666',
  },
  memoryPreview: {
    fontSize: 16,
    color: '#555',
    lineHeight: 22,
    marginBottom: 12,
  },
  interviewStats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 14,
    color: '#666',
  },
  audioIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  audioText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    lineHeight: 22,
  },
});