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

interface TimelineSkeletonProps {
  count?: number;
}

const TimelineSkeletonItem: React.FC = () => {
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
        marginBottom: theme.spacing.lg,
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
      {/* Timeline dot and line */}
      <View style={{ flexDirection: 'row' }}>
        <View style={{ alignItems: 'center', marginRight: theme.spacing.md }}>
          <Animated.View
            style={[
              {
                width: 12,
                height: 12,
                borderRadius: 6,
                backgroundColor: theme.colors.border,
                marginBottom: theme.spacing.sm,
              },
              animatedStyle,
            ]}
          />
          <Animated.View
            style={[
              {
                width: 2,
                height: 60,
                backgroundColor: theme.colors.border,
              },
              animatedStyle,
            ]}
          />
        </View>

        <View style={{ flex: 1 }}>
          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.sm }}>
            <Animated.View
              style={[
                {
                  height: 18,
                  backgroundColor: theme.colors.border,
                  borderRadius: 9,
                  width: '40%',
                  marginRight: theme.spacing.md,
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
                  width: '25%',
                },
                animatedStyle,
              ]}
            />
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
                  width: '90%',
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
                  width: '75%',
                },
                animatedStyle,
              ]}
            />
          </View>

          {/* Media placeholder */}
          <Animated.View
            style={[
              {
                height: 80,
                backgroundColor: theme.colors.border,
                borderRadius: 8,
                marginBottom: theme.spacing.md,
                width: '100%',
              },
              animatedStyle,
            ]}
          />

          {/* Footer actions */}
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
            <View style={{ flexDirection: 'row', gap: theme.spacing.md }}>
              <Animated.View
                style={[
                  {
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    backgroundColor: theme.colors.border,
                  },
                  animatedStyle,
                ]}
              />
              <Animated.View
                style={[
                  {
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    backgroundColor: theme.colors.border,
                  },
                  animatedStyle,
                ]}
              />
              <Animated.View
                style={[
                  {
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    backgroundColor: theme.colors.border,
                  },
                  animatedStyle,
                ]}
              />
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

export const TimelineSkeleton: React.FC<TimelineSkeletonProps> = ({ count = 4 }) => {
  return (
    <>
      {Array.from({ length: count }, (_, index) => (
        <TimelineSkeletonItem key={index} />
      ))}
    </>
  );
};
