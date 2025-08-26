import 'react-native-url-polyfill/auto';
import React, { useEffect, useState } from 'react';
import { AppRegistry } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider } from './src/context/AuthContext';
import { SettingsProvider } from './src/context/SettingsContext';
import { SubscriptionProvider } from './src/context/SubscriptionContext';
import { initI18n } from './src/i18n';
import AppNavigator from './src/navigation/AppNavigator';

function App() {
  const [i18nInitialized, setI18nInitialized] = useState(false);

  useEffect(() => {
    initI18n().then(() => {
      setI18nInitialized(true);
    }).catch(console.error);
  }, []);

  if (!i18nInitialized) {
    return null; // Show loading screen if needed
  }

  return (
    <AuthProvider>
      <SettingsProvider>
        <SubscriptionProvider>
          <NavigationContainer>
            <AppNavigator />
          </NavigationContainer>
        </SubscriptionProvider>
      </SettingsProvider>
    </AuthProvider>
  );
}

AppRegistry.registerComponent('main', () => App);

export default App;