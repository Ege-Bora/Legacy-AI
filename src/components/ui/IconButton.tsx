import React from 'react';
import { TouchableOpacity, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';

interface IconButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'primary' | 'danger';
  disabled?: boolean;
  style?: ViewStyle;
  accessibilityLabel: string;
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  onPress,
  size = 'md',
  variant = 'default',
  disabled = false,
  style,
  accessibilityLabel,
}) => {
  const theme = useTheme();

  const sizeMap = {
    sm: { buttonSize: 32, iconSize: 16 },
    md: { buttonSize: 44, iconSize: 20 },
    lg: { buttonSize: 56, iconSize: 24 },
  };

  const { buttonSize, iconSize } = sizeMap[size];

  const getButtonStyle = (): ViewStyle => {
    const variantStyles = {
      default: {
        backgroundColor: 'transparent',
      },
      primary: {
        backgroundColor: theme.colors.primary,
      },
      danger: {
        backgroundColor: theme.colors.danger,
      },
    };

    return {
      width: buttonSize,
      height: buttonSize,
      borderRadius: buttonSize / 2,
      alignItems: 'center',
      justifyContent: 'center',
      opacity: disabled ? theme.opacity.disabled : 1,
      ...variantStyles[variant],
      ...style,
    };
  };

  const getIconColor = () => {
    if (variant === 'primary' || variant === 'danger') {
      return theme.colors.white;
    }
    return theme.colors.text;
  };

  return (
    <TouchableOpacity
      style={getButtonStyle()}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={theme.opacity.pressed}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
    >
      <Ionicons name={icon} size={iconSize} color={getIconColor()} />
    </TouchableOpacity>
  );
};
