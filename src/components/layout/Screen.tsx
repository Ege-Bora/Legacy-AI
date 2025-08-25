import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../hooks/useTheme';

interface ScreenProps {
  children: React.ReactNode;
  scroll?: boolean;
  keyboard?: boolean;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
  showsVerticalScrollIndicator?: boolean;
  nestedScrollEnabled?: boolean;
}

export const Screen: React.FC<ScreenProps> = ({
  children,
  scroll = false,
  keyboard = false,
  style,
  contentContainerStyle,
  showsVerticalScrollIndicator = false,
  nestedScrollEnabled = false,
}) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  
  // Calculate bottom padding for tab bar
  const TAB_BAR_HEIGHT = 83;
  const bottomPadding = insets.bottom + TAB_BAR_HEIGHT + theme.spacing.lg;

  const defaultContentStyle = {
    flexGrow: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: bottomPadding,
  };

  const mergedContentStyle = {
    ...defaultContentStyle,
    ...contentContainerStyle,
  };

  const defaultStyle = {
    flex: 1,
    backgroundColor: theme.colors.bg,
  };

  const mergedStyle = {
    ...defaultStyle,
    ...style,
  };

  const content = scroll ? (
    <ScrollView
      contentContainerStyle={mergedContentStyle}
      showsVerticalScrollIndicator={showsVerticalScrollIndicator}
      nestedScrollEnabled={nestedScrollEnabled}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  ) : (
    <>{children}</>
  );

  const wrappedContent = keyboard ? (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      {content}
    </KeyboardAvoidingView>
  ) : (
    content
  );

  return (
    <SafeAreaView style={mergedStyle}>
      {wrappedContent}
    </SafeAreaView>
  );
};
