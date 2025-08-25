import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';

interface ListItemProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  showArrow?: boolean;
  isDestructive?: boolean;
  showDivider?: boolean;
}

export function ListItem({
  icon,
  title,
  subtitle,
  onPress,
  rightElement,
  showArrow,
  isDestructive,
  showDivider
}: ListItemProps) {
  const theme = useTheme();

  return (
    <>
      <TouchableOpacity
        onPress={onPress}
        disabled={!onPress}
        activeOpacity={theme.opacity.pressed}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          padding: theme.spacing.lg,
          minHeight: 60,
        }}
      >
        {icon && (
          <View style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: isDestructive 
              ? `${theme.colors.danger}15` 
              : `${theme.colors.textDim}10`,
            marginRight: theme.spacing.md,
          }}>
            <Ionicons 
              name={icon} 
              size={20} 
              color={isDestructive ? theme.colors.danger : theme.colors.textDim} 
            />
          </View>
        )}
        
        <View style={{ flex: 1 }}>
          <Text style={{
            fontSize: theme.fontSizes.md,
            fontWeight: theme.fontWeights.medium,
            color: isDestructive ? theme.colors.danger : theme.colors.text,
            marginBottom: subtitle ? theme.spacing.xs : 0,
          }}>
            {title}
          </Text>
          {subtitle && (
            <Text style={{
              fontSize: theme.fontSizes.sm,
              color: theme.colors.textDim,
            }}>
              {subtitle}
            </Text>
          )}
        </View>

        {rightElement || (showArrow && (
          <Ionicons 
            name="chevron-forward" 
            size={20} 
            color={theme.colors.textDim} 
          />
        ))}
      </TouchableOpacity>
      
      {showDivider && (
        <View style={{
          height: 1,
          backgroundColor: theme.colors.border,
          marginLeft: icon ? 64 : theme.spacing.lg,
        }} />
      )}
    </>
  );
}
