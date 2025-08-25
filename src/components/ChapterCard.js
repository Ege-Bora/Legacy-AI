import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { Card } from './ui/Card';

const DEFAULT_ITEM = { 
  id: 'tmp', 
  type: 'log', 
  title: '', 
  content: '', 
  date: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  media: []
};

export default function ChapterCard({ item = DEFAULT_ITEM, onPress }) {
  const theme = useTheme();
  
  // Return null if item is still undefined after default
  if (!item) return null;
  
  const safe = item ?? DEFAULT_ITEM;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const getTypeIcon = (type) => {
    return type === 'chapter' ? 'book-outline' : 'chatbubble-outline';
  };

  const getTypeColors = (type) => {
    switch (type) {
      case 'chapter':
        return {
          background: `${theme.colors.primary}15`,
          icon: theme.colors.primary
        };
      case 'log':
      default:
        return {
          background: `${theme.colors.success}15`,
          icon: theme.colors.success
        };
    }
  };

  const truncateContent = (content, maxLength = 120) => {
    if (!content || typeof content !== 'string') return '';
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  const type = safe.type ?? 'log';
  const typeColors = getTypeColors(type);
  const title = safe.title || (type === 'log' ? 'Quick memo' : 'Chapter');
  const dateText = safe.createdAt || safe.date ? formatDate(safe.createdAt || safe.date) : '';
  const content = safe.content || safe.snippet || safe.transcriptPreview || '';
  const preview = truncateContent(content);
  const media = Array.isArray(safe.media) ? safe.media : [];

  return (
    <Card onPress={onPress}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
        {/* Timeline dot */}
        <View style={{ 
          alignItems: 'center', 
          marginRight: theme.spacing.lg 
        }}>
          <View style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: typeColors.background,
          }}>
            <Ionicons 
              name={getTypeIcon(type)} 
              size={20} 
              color={typeColors.icon} 
            />
          </View>
        </View>

        {/* Content */}
        <View style={{ flex: 1 }}>
          {/* Header */}
          <View style={{ 
            flexDirection: 'row', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            marginBottom: theme.spacing.sm,
          }}>
            <Text style={{
              fontSize: theme.fontSizes.sm,
              color: theme.colors.textDim,
              fontWeight: theme.fontWeights.semibold,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}>
              {type}
            </Text>
            <Text style={{
              fontSize: theme.fontSizes.sm,
              color: theme.colors.textDim,
            }}>
              {dateText}
            </Text>
          </View>

          {/* Title */}
          <Text style={{
            fontSize: theme.fontSizes.lg,
            fontWeight: theme.fontWeights.semibold,
            color: theme.colors.text,
            marginBottom: theme.spacing.sm,
            lineHeight: theme.fontSizes.lg * 1.3,
          }}>
            {title}
          </Text>

          {/* Content preview */}
          <Text style={{
            fontSize: theme.fontSizes.md,
            color: theme.colors.textDim,
            lineHeight: theme.fontSizes.md * 1.4,
            marginBottom: theme.spacing.md,
          }}>
            {preview}
          </Text>

          {/* Footer */}
          <View style={{ 
            flexDirection: 'row', 
            alignItems: 'center', 
            justifyContent: 'space-between' 
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {/* Media indicator */}
              {media && media.length > 0 && (
                <View style={{ 
                  flexDirection: 'row', 
                  alignItems: 'center',
                  marginRight: theme.spacing.lg,
                }}>
                  <Ionicons 
                    name="image" 
                    size={16} 
                    color={theme.colors.textDim} 
                  />
                  <Text style={{
                    fontSize: theme.fontSizes.sm,
                    color: theme.colors.textDim,
                    marginLeft: theme.spacing.xs,
                  }}>
                    {media.length}
                  </Text>
                </View>
              )}

              {/* Word count */}
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons 
                  name="document-text" 
                  size={16} 
                  color={theme.colors.textDim} 
                />
                <Text style={{
                  fontSize: theme.fontSizes.sm,
                  color: theme.colors.textDim,
                  marginLeft: theme.spacing.xs,
                }}>
                  {(content && typeof content === 'string') ? content.split(' ').length : 0} words
                </Text>
              </View>
            </View>

            {/* Arrow */}
            <Ionicons 
              name="chevron-forward" 
              size={20} 
              color={theme.colors.textDim} 
            />
          </View>
        </View>
      </View>
    </Card>
  );
}
