import React from 'react';
import { View, ViewStyle, TouchableOpacity } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  padding?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
  variant?: 'default' | 'surface';
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  onPress, 
  style,
  padding = 'md',
  variant = 'default'
}) => {
  const theme = useTheme();
  
  const cardStyle: ViewStyle = {
    backgroundColor: variant === 'surface' ? theme.colors.surface : theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: theme.spacing[padding],
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: theme.colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
    ...style,
  };

  if (onPress) {
    return (
      <TouchableOpacity 
        style={cardStyle} 
        onPress={onPress}
        activeOpacity={theme.opacity.pressed}
        accessibilityRole="button"
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyle}>{children}</View>;
};
