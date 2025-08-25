import React from 'react';
import { View, Text, TextStyle, ViewStyle } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

interface PillProps {
  label: string;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md';
  style?: ViewStyle;
}

export const Pill: React.FC<PillProps> = ({
  label,
  variant = 'default',
  size = 'sm',
  style,
}) => {
  const theme = useTheme();

  const getContainerStyle = (): ViewStyle => {
    const sizeStyles = {
      sm: { 
        paddingHorizontal: theme.spacing.sm, 
        paddingVertical: theme.spacing.xs,
        borderRadius: theme.radius.sm,
      },
      md: { 
        paddingHorizontal: theme.spacing.md, 
        paddingVertical: theme.spacing.sm,
        borderRadius: theme.radius.md,
      },
    };

    const variantStyles = {
      default: {
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.border,
      },
      primary: {
        backgroundColor: `${theme.colors.primary}20`,
        borderWidth: 1,
        borderColor: `${theme.colors.primary}40`,
      },
      success: {
        backgroundColor: `${theme.colors.success}20`,
        borderWidth: 1,
        borderColor: `${theme.colors.success}40`,
      },
      warning: {
        backgroundColor: `${theme.colors.warning}20`,
        borderWidth: 1,
        borderColor: `${theme.colors.warning}40`,
      },
      danger: {
        backgroundColor: `${theme.colors.danger}20`,
        borderWidth: 1,
        borderColor: `${theme.colors.danger}40`,
      },
    };

    return {
      alignSelf: 'flex-start',
      ...sizeStyles[size],
      ...variantStyles[variant],
      ...style,
    };
  };

  const getTextStyle = (): TextStyle => {
    const sizeStyles = {
      sm: { fontSize: theme.fontSizes.xs },
      md: { fontSize: theme.fontSizes.sm },
    };

    const variantStyles = {
      default: { color: theme.colors.textDim },
      primary: { color: theme.colors.primary },
      success: { color: theme.colors.success },
      warning: { color: theme.colors.warning },
      danger: { color: theme.colors.danger },
    };

    return {
      fontWeight: theme.fontWeights.medium,
      ...sizeStyles[size],
      ...variantStyles[variant],
    };
  };

  return (
    <View style={getContainerStyle()}>
      <Text style={getTextStyle()}>{label}</Text>
    </View>
  );
};
