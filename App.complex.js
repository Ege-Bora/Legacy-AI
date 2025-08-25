import 'react-native-url-polyfill/auto';
import React, { useEffect, useState } from 'react';
import { StatusBar, Alert, LogBox, AppRegistry } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Audio } from 'expo-av';
// import * as Font from 'expo-font';

// Context Providers
import { AuthProvider } from './src/context/AuthContext';
import { SettingsProvider } from './src/context/SettingsContext';
import { SubscriptionProvider } from './src/context/SubscriptionContext';

// Navigation
import AppNavigator from './src/navigation/AppNavigator';

// Components
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { Toast } from './src/components/ui/Toast';

// Configuration
import { config } from './src/config';

// Ignore specific warnings in development
if (__DEV__) {
  LogBox.ignoreLogs([
    'Warning: ...', // Add specific warnings to ignore if needed
  ]);
}

// Keep splash screen visible while loading
// SplashScreen.preventAutoHideAsync(); // Commented out for now

function App() {
  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      console.log('[App] Initializing Life Legacy AI...');
      
      // Initialize audio settings
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
      
      console.log('[App] App initialized successfully');
    } catch (error) {
      console.error('[App] Failed to initialize app:', error);
    }
  };


  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <AuthProvider>
            <SettingsProvider>
              <SubscriptionProvider>
                <StatusBar barStyle="light-content" backgroundColor="#1F2937" />
                <NavigationContainer>
                  <AppNavigator />
                </NavigationContainer>
                <Toast />
              </SubscriptionProvider>
            </SettingsProvider>
          </AuthProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}

export default App;

// Register the main application component
AppRegistry.registerComponent('main', () => App);