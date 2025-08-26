import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  RefreshControl, 
  ActivityIndicator,
  TouchableOpacity 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../services/api';
import ChapterCard from '../components/ChapterCard';
import { useTheme } from '../hooks/useTheme';
import { useI18n } from '../hooks/useI18n';
import { Screen } from '../components/layout/Screen';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { TimelineSkeleton } from '../components/skeleton/TimelineSkeleton';
import { useMemoStore } from '../state/memos';
import { useTimelineStore } from '../state/timeline';

export default function TimelineScreen({ navigation }) {
  const theme = useTheme();
  const { t } = useI18n();
  const { savedMemos } = useMemoStore();
  const { 
    items: timelineItems, 
    isLoading, 
    isRefreshing,
    loadTimeline,
    refresh,
    addItemOptimistic 
  } = useTimelineStore();

  useEffect(() => {
    // Load timeline on mount if we don't have items and we're not already loading
    if (timelineItems.length === 0 && !isLoading) {
      console.log('[TimelineScreen] Initial load');
      loadTimeline();
    }
  }, []); // Load once on mount

  const onRefresh = async () => {
    if (isRefreshing) return; // Prevent multiple concurrent refreshes
    console.log('[TimelineScreen] Refreshing timeline...');
    try {
      await refresh();
    } catch (error) {
      console.error('[TimelineScreen] Refresh failed:', error);
    }
  };

  // Combine timeline items with saved memos
  const allItems = React.useMemo(() => {
    const memoItems = Array.isArray(savedMemos) ? savedMemos.map(memo => ({
      id: memo?.id || `memo-${Date.now()}`,
      type: 'log',
      title: 'Voice Memo',
      content: memo?.transcript || '',
      snippet: memo?.transcript ? memo.transcript.substring(0, 100) + (memo.transcript.length > 100 ? '...' : '') : '',
      transcriptPreview: memo?.transcript || '',
      createdAt: memo?.createdAt || new Date().toISOString(),
      date: memo?.createdAt || new Date().toISOString(),
      duration: memo?.duration || 0,
      audioUrl: memo?.audioUrl,
      media: memo?.audioUrl ? [{
        kind: 'audio',
        url: memo.audioUrl
      }] : [],
      confidence: memo?.confidence || 0,
      source: 'voice_memo'
    })) : [];
    
    // Combine and sort by date with safe access
    const combined = [...(timelineItems || []), ...memoItems].sort((a, b) => {
      const dateA = new Date(a?.createdAt || a?.date || 0).getTime();
      const dateB = new Date(b?.createdAt || b?.date || 0).getTime();
      return dateB - dateA;
    });
    
    return combined;
  }, [timelineItems, savedMemos]);

  const handleItemPress = (item) => {
    navigation.navigate('Editor', { item });
  };

  if (isLoading) {
    return (
      <Screen scroll={true}>
        {/* Header */}
        <View style={{
          paddingTop: theme.spacing.lg,
          paddingBottom: theme.spacing.md,
        }}>
          <Text style={{
            fontSize: theme.fontSizes.h1,
            fontWeight: theme.fontWeights.bold,
            color: theme.colors.text
          }}>
            {t('timeline.title')}
          </Text>
          <Text style={{
            fontSize: theme.fontSizes.md,
            color: theme.colors.textDim,
            marginTop: theme.spacing.xs
          }}>
            {t('timeline.loadingSubtitle')}
          </Text>
        </View>

        <TimelineSkeleton count={4} />
      </Screen>
    );
  }

  return (
    <Screen scroll={true}>
      {/* Header */}
      <View style={{
        paddingTop: theme.spacing.lg,
        paddingBottom: theme.spacing.md,
      }}>
        <Text style={{
          fontSize: theme.fontSizes.h1,
          fontWeight: theme.fontWeights.bold,
          color: theme.colors.text
        }}>
          {t('timeline.title')}
        </Text>
        <Text style={{
          fontSize: theme.fontSizes.md,
          color: theme.colors.textDim,
          marginTop: theme.spacing.xs
        }}>
          {t('timeline.memoriesCount', { count: Array.isArray(timelineItems) ? timelineItems.length : 0 })}
        </Text>
      </View>

      {/* Timeline Content */}
      {!Array.isArray(allItems) || allItems.length === 0 ? (
        <EmptyState
          icon="time-outline"
          title={t('timeline.emptyTitle')}
          description={t('timeline.emptyDescription')}
          actionTitle={t('timeline.startRecording')}
          onActionPress={() => navigation.navigate('Home')}
        />
      ) : (
        <>
          {allItems.map((item, index) => (
            <ChapterCard
              key={item?.id || `item-${index}`}
              item={item}
              onPress={() => handleItemPress(item)}
              style={{ marginBottom: theme.spacing.lg }}
            />
          ))}

          {/* Stats Card */}
          <Card style={{ marginTop: theme.spacing.xl }}>
            <Text style={{
              fontSize: theme.fontSizes.lg,
              fontWeight: theme.fontWeights.semibold,
              color: theme.colors.text,
              marginBottom: theme.spacing.md,
              textAlign: 'center'
            }}>
              {t('timeline.statsTitle')}
            </Text>
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-around',
              alignItems: 'center'
            }}>
              <View style={{ alignItems: 'center' }}>
                <Text style={{
                  fontSize: theme.fontSizes.h2,
                  fontWeight: theme.fontWeights.bold,
                  color: theme.colors.primary
                }}>
                  {timelineItems.length}
                </Text>
                <Text style={{
                  fontSize: theme.fontSizes.sm,
                  color: theme.colors.textDim
                }}>
                  {t('timeline.chapters')}
                </Text>
              </View>
              <View style={{ alignItems: 'center' }}>
                <Text style={{
                  fontSize: theme.fontSizes.h2,
                  fontWeight: theme.fontWeights.bold,
                  color: theme.colors.secondary
                }}>
                  {Array.isArray(timelineItems) ? timelineItems.reduce((acc, item) => acc + (Array.isArray(item?.media) ? item.media.length : 0), 0) : 0}
                </Text>
                <Text style={{
                  fontSize: theme.fontSizes.sm,
                  color: theme.colors.textDim
                }}>
                  {t('timeline.mediaFiles')}
                </Text>
              </View>
            </View>
          </Card>
        </>
      )}
    </Screen>
  );
}
