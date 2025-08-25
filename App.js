import 'react-native-url-polyfill/auto';
import React from 'react';
import { View, Text } from 'react-native';

export default function App() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1F2937' }}>
      <Text style={{ color: 'white', fontSize: 24, marginBottom: 10 }}>Life Legacy AI</Text>
      <Text style={{ color: '#9CA3AF', textAlign: 'center', paddingHorizontal: 20 }}>
        Testing basic app loading...
      </Text>
    </View>
  );
}