import React from 'react';
import { View, ViewStyle } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

interface DividerProps {
  style?: ViewStyle;
  orientation?: 'horizontal' | 'vertical';
  thickness?: number;
}

export const Divider: React.FC<DividerProps> = ({
  style,
  orientation = 'horizontal',
  thickness = 1,
}) => {
  const theme = useTheme();

  const dividerStyle: ViewStyle = {
    backgroundColor: theme.colors.border,
    ...(orientation === 'horizontal' 
      ? { height: thickness, width: '100%' }
      : { width: thickness, height: '100%' }
    ),
    ...style,
  };

  return <View style={dividerStyle} />;
};
