import React from 'react';
import { View, Text, ViewStyle, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { Button } from './Button';

interface EmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  actionTitle?: string;
  onAction?: () => void;
  style?: ViewStyle;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  subtitle,
  actionTitle,
  onAction,
  style,
}) => {
  const theme = useTheme();

  const containerStyle: ViewStyle = {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.xxl,
    ...style,
  };

  const iconContainerStyle: ViewStyle = {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
  };

  const titleStyle: TextStyle = {
    fontSize: theme.fontSizes.xl,
    fontWeight: theme.fontWeights.semibold,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  };

  const subtitleStyle: TextStyle = {
    fontSize: theme.fontSizes.md,
    color: theme.colors.textDim,
    textAlign: 'center',
    lineHeight: theme.fontSizes.md * 1.5,
    marginBottom: actionTitle ? theme.spacing.xl : 0,
  };

  return (
    <View style={containerStyle}>
      <View style={iconContainerStyle}>
        <Ionicons name={icon} size={40} color={theme.colors.textDim} />
      </View>
      <Text style={titleStyle}>{title}</Text>
      <Text style={subtitleStyle}>{subtitle}</Text>
      {actionTitle && onAction && (
        <Button
          title={actionTitle}
          onPress={onAction}
          variant="primary"
          accessibilityLabel={actionTitle}
        />
      )}
    </View>
  );
};
