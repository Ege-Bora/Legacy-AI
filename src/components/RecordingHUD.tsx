import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { useTheme } from '../hooks/useTheme';
import { useMemoStore } from '../state/memos';
import { memoService } from '../services/memo';

interface RecordingHUDProps {
  visible: boolean;
  duration: number;
  level?: number;
}

export const RecordingHUD: React.FC<RecordingHUDProps> = ({
  visible,
  duration,
  level = 0,
}) => {
  const theme = useTheme();
  const { currentStatus } = useMemoStore();
  
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);
  
  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 200 });
      translateY.value = withTiming(0, { duration: 200 });
    } else {
      opacity.value = withTiming(0, { duration: 200 });
      translateY.value = withTiming(20, { duration: 200 });
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const formatDuration = (durationMs: number): string => {
    return memoService.formatDuration(durationMs);
  };

  const getMaxDuration = (): string => {
    return memoService.formatDuration(memoService.getMaxDuration());
  };

  const getLevelBars = () => {
    const numBars = 20;
    const activeBars = Math.floor((level || 0) * numBars);
    
    return Array.from({ length: numBars }, (_, index) => {
      const isActive = index < activeBars;
      const height = 4 + (index * 2); // Varying heights for visual appeal
      
      return (
        <View
          key={index}
          style={{
            width: 3,
            height,
            backgroundColor: isActive ? '#4CAF50' : theme.colors.border,
            marginHorizontal: 1,
            borderRadius: 1.5,
          }}
        />
      );
    });
  };

  const getStatusText = () => {
    switch (currentStatus) {
      case 'recording':
        return 'Recording...';
      case 'stopping':
        return 'Saving...';
      case 'uploading':
        return 'Uploading...';
      case 'transcribing':
        return 'Transcribing...';
      default:
        return 'Ready';
    }
  };

  const getStatusIcon = () => {
    switch (currentStatus) {
      case 'recording':
        return 'radio-button-on';
      case 'stopping':
      case 'uploading':
        return 'cloud-upload-outline';
      case 'transcribing':
        return 'text-outline';
      default:
        return 'mic-outline';
    }
  };

  if (!visible && currentStatus === 'idle') return null;

  return (
    <Animated.View
      style={[
        {
          backgroundColor: theme.colors.surface,
          borderRadius: 12,
          padding: theme.spacing.lg,
          marginHorizontal: theme.spacing.lg,
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: 2,
          },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 4,
          borderWidth: 1,
          borderColor: theme.colors.border,
        },
        animatedStyle,
      ]}
    >
      {/* Status and Timer Row */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: theme.spacing.md,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons
            name={getStatusIcon()}
            size={20}
            color={currentStatus === 'recording' ? '#FF4444' : theme.colors.primary}
            style={{ marginRight: theme.spacing.sm }}
          />
          <Text
            style={{
              fontSize: theme.fontSizes.md,
              fontWeight: theme.fontWeights.medium,
              color: theme.colors.text,
            }}
          >
            {getStatusText()}
          </Text>
        </View>

        <Text
          style={{
            fontSize: theme.fontSizes.lg,
            fontWeight: theme.fontWeights.semibold,
            color: theme.colors.text,
            fontFamily: 'monospace',
          }}
        >
          {formatDuration(duration)}
        </Text>
      </View>

      {/* Level Meter */}
      {currentStatus === 'recording' && (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: theme.spacing.md,
            height: 24,
          }}
        >
          {getLevelBars()}
        </View>
      )}

      {/* Progress Bar for Max Duration */}
      {currentStatus === 'recording' && (
        <View
          style={{
            marginBottom: theme.spacing.sm,
          }}
        >
          <View
            style={{
              height: 4,
              backgroundColor: theme.colors.border,
              borderRadius: 2,
              overflow: 'hidden',
            }}
          >
            <View
              style={{
                height: '100%',
                backgroundColor: duration > memoService.getMaxDuration() * 0.8 ? '#FF9800' : theme.colors.primary,
                width: `${Math.min((duration / memoService.getMaxDuration()) * 100, 100)}%`,
                borderRadius: 2,
              }}
            />
          </View>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              marginTop: theme.spacing.xs,
            }}
          >
            <Text
              style={{
                fontSize: theme.fontSizes.xs,
                color: theme.colors.textDim,
              }}
            >
              0:00
            </Text>
            <Text
              style={{
                fontSize: theme.fontSizes.xs,
                color: theme.colors.textDim,
              }}
            >
              Max: {getMaxDuration()}
            </Text>
          </View>
        </View>
      )}

      {/* Tips */}
      {currentStatus === 'recording' && (
        <Text
          style={{
            fontSize: theme.fontSizes.xs,
            color: theme.colors.textDim,
            textAlign: 'center',
            lineHeight: theme.fontSizes.xs * 1.4,
          }}
        >
          Speak clearly • Release button to save • Drag away to cancel
        </Text>
      )}

      {/* Processing status */}
      {(currentStatus === 'uploading' || currentStatus === 'transcribing') && (
        <Text
          style={{
            fontSize: theme.fontSizes.sm,
            color: theme.colors.textDim,
            textAlign: 'center',
            marginTop: theme.spacing.sm,
          }}
        >
          {currentStatus === 'uploading' 
            ? 'Uploading your memo...' 
            : 'Converting speech to text...'
          }
        </Text>
      )}
    </Animated.View>
  );
};
