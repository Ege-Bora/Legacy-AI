import React from 'react';
import { View, Text, TextStyle, ViewStyle } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  style?: ViewStyle;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  style,
}) => {
  const theme = useTheme();

  const containerStyle: ViewStyle = {
    marginBottom: theme.spacing.md,
    ...style,
  };

  const titleStyle: TextStyle = {
    fontSize: theme.fontSizes.lg,
    fontWeight: theme.fontWeights.semibold,
    color: theme.colors.text,
    marginBottom: subtitle ? theme.spacing.xs : 0,
  };

  const subtitleStyle: TextStyle = {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.textDim,
  };

  return (
    <View style={containerStyle}>
      <Text style={titleStyle}>{title}</Text>
      {subtitle && <Text style={subtitleStyle}>{subtitle}</Text>}
    </View>
  );
};
