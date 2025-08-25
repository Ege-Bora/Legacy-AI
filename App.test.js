import 'react-native-url-polyfill/auto';
import React from 'react';
import { View, Text, AppRegistry } from 'react-native';

function App() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1F2937' }}>
      <Text style={{ color: 'white', fontSize: 24 }}>Life Legacy AI</Text>
      <Text style={{ color: '#9CA3AF', fontSize: 16, marginTop: 10 }}>Testing App Registration</Text>
    </View>
  );
}

export default App;

// Register the main application component
AppRegistry.registerComponent('main', () => App);