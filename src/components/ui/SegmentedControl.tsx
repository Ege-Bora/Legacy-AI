import React from 'react';
import { View, TouchableOpacity, Text, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

interface SegmentedControlProps {
  options: string[];
  selectedIndex: number;
  onSelectionChange: (index: number) => void;
  style?: ViewStyle;
}

export const SegmentedControl: React.FC<SegmentedControlProps> = ({
  options,
  selectedIndex,
  onSelectionChange,
  style,
}) => {
  const theme = useTheme();

  const containerStyle: ViewStyle = {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: 4,
    ...style,
  };

  const segmentStyle = (isSelected: boolean): ViewStyle => ({
    flex: 1,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.sm,
    backgroundColor: isSelected ? theme.colors.primary : 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 36,
  });

  const textStyle = (isSelected: boolean): TextStyle => ({
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.medium,
    color: isSelected ? theme.colors.white : theme.colors.textDim,
  });

  return (
    <View style={containerStyle}>
      {options.map((option, index) => (
        <TouchableOpacity
          key={index}
          style={segmentStyle(selectedIndex === index)}
          onPress={() => onSelectionChange(index)}
          activeOpacity={theme.opacity.pressed}
          accessibilityRole="button"
          accessibilityLabel={option}
          accessibilityState={{ selected: selectedIndex === index }}
        >
          <Text style={textStyle(selectedIndex === index)}>{option}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};
