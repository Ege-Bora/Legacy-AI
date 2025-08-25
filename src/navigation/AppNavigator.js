import React, { useContext } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';

// Screens
import OnboardingScreen from '../screens/OnboardingScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import InterviewScreen from '../screens/InterviewScreen';
import QuickCaptureScreen from '../screens/QuickCaptureScreen';
import TimelineScreen from '../screens/TimelineScreen';
import EditorScreen from '../screens/EditorScreen';
import BookScreen from '../screens/BookScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Timeline') {
            iconName = focused ? 'time' : 'time-outline';
          } else if (route.name === 'Book') {
            iconName = focused ? 'book' : 'book-outline';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'settings' : 'settings-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Timeline" component={TimelineScreen} />
      <Tab.Screen name="Book" component={BookScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { isAuthenticated, isLoading } = useContext(AuthContext);

  // Show loading screen while determining auth state
  if (isLoading) {
    return null; // You could add a loading screen component here
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        // Auth Stack - screens available when not authenticated
        <>
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      ) : (
        // Main App Stack - screens available when authenticated
        <>
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen name="Interview" component={InterviewScreen} />
          <Stack.Screen name="QuickCapture" component={QuickCaptureScreen} />
          <Stack.Screen name="Editor" component={EditorScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}
