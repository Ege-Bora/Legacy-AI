import React, { useRef, useEffect } from 'react';
import { View, Text, PanResponder, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { useTheme } from '../hooks/useTheme';
import { useMemoStore } from '../state/memos';

interface RecordButtonProps {
  onStartRecording: () => void;
  onStopRecording: () => void;
  onCancelRecording: () => void;
  disabled?: boolean;
  size?: number;
}

const { width: screenWidth } = Dimensions.get('window');

const RecordButton: React.FC<RecordButtonProps> = ({
  onStartRecording,
  onStopRecording,
  onCancelRecording,
  disabled = false,
  size = 140,
}) => {
  const theme = useTheme();
  const { currentStatus, recordingDuration } = useMemoStore();
  
  // Animation values
  const scale = useSharedValue(1);
  const pulseScale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const ringScale = useSharedValue(0);
  
  const isRecording = currentStatus === 'recording';
  const isPressed = useRef(false);
  const startPosition = useRef({ x: 0, y: 0 });
  const cancelThreshold = 50; // pixels to drag before canceling

  // Start pulsing animation when recording
  useEffect(() => {
    if (isRecording) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 600 }),
          withTiming(1, { duration: 600 })
        ),
        -1,
        false
      );
      ringScale.value = withRepeat(
        withSequence(
          withTiming(1.5, { duration: 1000 }),
          withTiming(0, { duration: 0 })
        ),
        -1,
        false
      );
    } else {
      pulseScale.value = withTiming(1, { duration: 200 });
      ringScale.value = withTiming(0, { duration: 200 });
    }
  }, [isRecording]);

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => !disabled,
    onMoveShouldSetPanResponder: () => !disabled,

    onPanResponderGrant: (evt) => {
      if (disabled) return;
      
      isPressed.current = true;
      startPosition.current = { x: evt.nativeEvent.pageX, y: evt.nativeEvent.pageY };
      
      scale.value = withTiming(0.95, { duration: 100 });
      runOnJS(onStartRecording)();
    },

    onPanResponderMove: (evt) => {
      if (!isPressed.current) return;

      const deltaX = Math.abs(evt.nativeEvent.pageX - startPosition.current.x);
      const deltaY = Math.abs(evt.nativeEvent.pageY - startPosition.current.y);
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      // Visual feedback for cancel gesture
      if (distance > cancelThreshold) {
        opacity.value = withTiming(0.5, { duration: 100 });
      } else {
        opacity.value = withTiming(1, { duration: 100 });
      }
    },

    onPanResponderRelease: (evt) => {
      if (!isPressed.current) return;
      
      isPressed.current = false;
      scale.value = withTiming(1, { duration: 100 });
      opacity.value = withTiming(1, { duration: 100 });

      const deltaX = Math.abs(evt.nativeEvent.pageX - startPosition.current.x);
      const deltaY = Math.abs(evt.nativeEvent.pageY - startPosition.current.y);
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      if (distance > cancelThreshold) {
        runOnJS(onCancelRecording)();
      } else {
        runOnJS(onStopRecording)();
      }
    },
  });

  // Animated styles
  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value * pulseScale.value },
    ],
    opacity: opacity.value,
  }));

  const ringAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
    opacity: interpolate(ringScale.value, [0, 0.5, 1.5], [0.8, 0.4, 0]),
  }));

  const getButtonColor = () => {
    if (disabled) return theme.colors.border;
    if (isRecording) return '#FF4444';
    return theme.colors.primary;
  };

  const getIconName = () => {
    if (currentStatus === 'uploading' || currentStatus === 'transcribing') {
      return 'cloud-upload-outline';
    }
    if (isRecording) return 'stop';
    return 'mic';
  };

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      {/* Pulsing ring for recording state */}
      {isRecording && (
        <Animated.View
          style={[
            {
              position: 'absolute',
              width: size + 40,
              height: size + 40,
              borderRadius: (size + 40) / 2,
              borderWidth: 3,
              borderColor: '#FF4444',
            },
            ringAnimatedStyle,
          ]}
        />
      )}

      {/* Main button */}
      <Animated.View
        {...panResponder.panHandlers}
        style={[
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: getButtonColor(),
            justifyContent: 'center',
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: {
              width: 0,
              height: 4,
            },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
          },
          buttonAnimatedStyle,
        ]}
      >
        {/* Gradient border effect */}
        <View
          style={{
            position: 'absolute',
            width: size - 8,
            height: size - 8,
            borderRadius: (size - 8) / 2,
            backgroundColor: 'white',
            opacity: 0.1,
          }}
        />

        <Ionicons
          name={getIconName()}
          size={size * 0.35}
          color="white"
        />
      </Animated.View>

      {/* Instruction text */}
      <Text
        style={{
          marginTop: theme.spacing.md,
          fontSize: theme.fontSizes.sm,
          color: theme.colors.textDim,
          textAlign: 'center',
          maxWidth: screenWidth * 0.8,
        }}
      >
        {isRecording
          ? 'Hold to record • Release to save'
          : disabled
          ? 'Microphone access needed'
          : 'Hold to record • Release to save'
        }
      </Text>

      {/* Cancel instruction when dragging */}
      {isRecording && (
        <Text
          style={{
            marginTop: theme.spacing.xs,
            fontSize: theme.fontSizes.xs,
            color: theme.colors.textDim,
            textAlign: 'center',
            opacity: 0.7,
          }}
        >
          Drag away to cancel
        </Text>
      )}
    </View>
  );
};

export default RecordButton;
export { RecordButton };
