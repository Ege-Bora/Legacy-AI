import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/context/AuthContext';
import { SubscriptionProvider } from './src/context/SubscriptionContext';
import { SettingsProvider } from './src/context/SettingsContext';
import AppNavigator from './src/navigation/AppNavigator';
import { initI18n } from './src/i18n';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { ToastContainer } from './src/components/ui/Toast';

const Stack = createStackNavigator();

// Loading screen component
const LoadingScreen = () => {
  return (
    <View style={{
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#0B1020',
    }}>
      <ActivityIndicator size="large" color="#6E9BFF" />
      <Text style={{
        marginTop: 16,
        fontSize: 16,
        color: '#A7B0C7',
      }}>
        Loading...
      </Text>
    </View>
  );
};

export default function App() {
  const [isI18nInitialized, setIsI18nInitialized] = useState(false);

  useEffect(() => {
    const initializeI18n = async () => {
      try {
        await initI18n();
        setIsI18nInitialized(true);
      } catch (error) {
        console.error('Failed to initialize i18n:', error);
        // Still allow app to load with fallback
        setIsI18nInitialized(true);
      }
    };

    initializeI18n();
  }, []);

  if (!isI18nInitialized) {
    return (
      <SettingsProvider>
        <LoadingScreen />
      </SettingsProvider>
    );
  }

  return (
    <ErrorBoundary>
      <AuthProvider>
        <SubscriptionProvider>
          <SettingsProvider>
            <NavigationContainer>
              <AppNavigator />
              <StatusBar style="auto" />
              <ToastContainer />
            </NavigationContainer>
          </SettingsProvider>
        </SubscriptionProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
