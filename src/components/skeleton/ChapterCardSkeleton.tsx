import React from 'react';
import { View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../../hooks/useTheme';

interface ChapterCardSkeletonProps {
  count?: number;
}

const SkeletonItem: React.FC = () => {
  const theme = useTheme();
  const opacity = useSharedValue(0.3);

  React.useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 1000 }),
        withTiming(0.3, { duration: 1000 })
      ),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <View
      style={{
        backgroundColor: theme.colors.surface,
        borderRadius: 12,
        padding: theme.spacing.lg,
        marginBottom: theme.spacing.md,
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 1,
        },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
      }}
    >
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.md }}>
        <Animated.View
          style={[
            {
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: theme.colors.border,
            },
            animatedStyle,
          ]}
        />
        <View style={{ marginLeft: theme.spacing.md, flex: 1 }}>
          <Animated.View
            style={[
              {
                height: 16,
                backgroundColor: theme.colors.border,
                borderRadius: 8,
                marginBottom: theme.spacing.xs,
                width: '60%',
              },
              animatedStyle,
            ]}
          />
          <Animated.View
            style={[
              {
                height: 12,
                backgroundColor: theme.colors.border,
                borderRadius: 6,
                width: '40%',
              },
              animatedStyle,
            ]}
          />
        </View>
      </View>

      {/* Content */}
      <View style={{ marginBottom: theme.spacing.md }}>
        <Animated.View
          style={[
            {
              height: 14,
              backgroundColor: theme.colors.border,
              borderRadius: 7,
              marginBottom: theme.spacing.xs,
              width: '100%',
            },
            animatedStyle,
          ]}
        />
        <Animated.View
          style={[
            {
              height: 14,
              backgroundColor: theme.colors.border,
              borderRadius: 7,
              marginBottom: theme.spacing.xs,
              width: '85%',
            },
            animatedStyle,
          ]}
        />
        <Animated.View
          style={[
            {
              height: 14,
              backgroundColor: theme.colors.border,
              borderRadius: 7,
              width: '70%',
            },
            animatedStyle,
          ]}
        />
      </View>

      {/* Footer */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Animated.View
          style={[
            {
              height: 12,
              backgroundColor: theme.colors.border,
              borderRadius: 6,
              width: '30%',
            },
            animatedStyle,
          ]}
        />
        <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
          <Animated.View
            style={[
              {
                width: 24,
                height: 24,
                borderRadius: 12,
                backgroundColor: theme.colors.border,
              },
              animatedStyle,
            ]}
          />
          <Animated.View
            style={[
              {
                width: 24,
                height: 24,
                borderRadius: 12,
                backgroundColor: theme.colors.border,
              },
              animatedStyle,
            ]}
          />
        </View>
      </View>
    </View>
  );
};

export const ChapterCardSkeleton: React.FC<ChapterCardSkeletonProps> = ({ count = 3 }) => {
  return (
    <>
      {Array.from({ length: count }, (_, index) => (
        <SkeletonItem key={index} />
      ))}
    </>
  );
};
