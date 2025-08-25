import React from 'react';
import { ScrollView, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../hooks/useTheme';

interface ScreenProps {
  children: React.ReactNode;
  scroll?: boolean;
  padding?: boolean;
  style?: ViewStyle;
}

export const Screen: React.FC<ScreenProps> = ({ 
  children, 
  scroll = false, 
  padding = true,
  style 
}) => {
  const theme = useTheme();
  
  const containerStyle: ViewStyle = {
    flex: 1,
    backgroundColor: theme.colors.bg,
    ...style,
  };

  const contentStyle: ViewStyle = {
    flex: 1,
    paddingHorizontal: padding ? theme.spacing.md : 0,
  };

  if (scroll) {
    return (
      <SafeAreaView style={containerStyle}>
        <ScrollView 
          style={contentStyle}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: theme.spacing.xl }}
        >
          {children}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={containerStyle}>
      <View style={contentStyle}>
        {children}
      </View>
    </SafeAreaView>
  );
};
