import React from 'react';
import { View, ViewStyle } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

interface ProgressBarProps {
  progress: number; // 0-100
  height?: number;
  style?: ViewStyle;
  variant?: 'default' | 'primary' | 'success';
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  height = 6,
  style,
  variant = 'primary',
}) => {
  const theme = useTheme();

  const getProgressColor = () => {
    switch (variant) {
      case 'success':
        return theme.colors.success;
      case 'primary':
      default:
        return theme.colors.primary;
    }
  };

  const containerStyle: ViewStyle = {
    height,
    backgroundColor: theme.colors.surface,
    borderRadius: height / 2,
    overflow: 'hidden',
    ...style,
  };

  const progressStyle: ViewStyle = {
    height: '100%',
    width: `${Math.min(Math.max(progress, 0), 100)}%`,
    backgroundColor: getProgressColor(),
    borderRadius: height / 2,
  };

  return (
    <View style={containerStyle}>
      <View style={progressStyle} />
    </View>
  );
};
