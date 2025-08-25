import React, { useState } from 'react';
import { View, Text, Alert, ScrollView, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { useI18n } from '../hooks/useI18n';
import { Screen } from '../components/layout/Screen';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { config } from '../config';
import { analytics, crashReporting } from '../services/analytics';
import { useMemoStore } from '../state/memos';
import { useTimelineStore } from '../state/timeline';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function DeveloperScreen() {
  const theme = useTheme();
  const { t } = useI18n();
  const [debugMode, setDebugMode] = useState(false);
  const [mockApiEnabled, setMockApiEnabled] = useState(config.features.mockApi);
  
  const memoStore = useMemoStore();
  const timelineStore = useTimelineStore();

  const handleClearStorage = async () => {
    Alert.alert(
      'Clear All Storage',
      'This will clear all local data including memos, timeline, and settings. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              // Clear AsyncStorage
              await AsyncStorage.clear();
              
              // Reset Zustand stores to initial state
              // Note: clearAll methods don't exist, so we'll clear AsyncStorage which will reset persisted state
              
              Alert.alert('Success', 'All local storage cleared');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear storage');
              console.error('Clear storage error:', error);
            }
          }
        }
      ]
    );
  };

  const handleTestCrashReporting = () => {
    Alert.alert(
      'Test Crash Reporting',
      'This will generate a test error to verify crash reporting is working.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Generate Error',
          style: 'destructive',
          onPress: () => {
            try {
              throw new Error('Test error for crash reporting');
            } catch (error) {
              crashReporting.recordError(error as Error, {
                test: true,
                screen: 'DeveloperScreen',
              });
              Alert.alert('Test Error Sent', 'Check console for crash report');
            }
          }
        }
      ]
    );
  };

  const handleTestAnalytics = () => {
    analytics.track('Developer Test Event', {
      test: true,
      timestamp: new Date().toISOString(),
      screen: 'DeveloperScreen',
    });
    Alert.alert('Analytics Event Sent', 'Check console for analytics event');
  };

  const handleExportLogs = async () => {
    try {
      const logs = {
        config,
        memoCount: memoStore.savedMemos?.length || 0,
        pendingMemoCount: memoStore.pendingMemos?.length || 0,
        timelineCount: timelineStore.items?.length || 0,
        timestamp: new Date().toISOString(),
      };

      const logString = JSON.stringify(logs, null, 2);
      const fileName = `legacy-ai-logs-${Date.now()}.json`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;
      
      await FileSystem.writeAsStringAsync(fileUri, logString);
      Alert.alert('Logs Exported', `Logs saved to: ${fileUri}`);
    } catch (error) {
      Alert.alert('Export Failed', 'Failed to export logs');
      console.error('Export logs error:', error);
    }
  };

  const handleResetOnboarding = async () => {
    try {
      await AsyncStorage.removeItem('onboarding_completed');
      Alert.alert('Onboarding Reset', 'Restart the app to see onboarding again');
    } catch (error) {
      Alert.alert('Reset Failed', 'Failed to reset onboarding');
    }
  };

  const debugSections = [
    {
      title: 'Debug Controls',
      items: [
        {
          icon: 'bug' as keyof typeof Ionicons.glyphMap,
          title: 'Debug Mode',
          subtitle: debugMode ? 'Enabled' : 'Disabled',
          rightElement: (
            <Switch
              value={debugMode}
              onValueChange={setDebugMode}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
              thumbColor={theme.colors.surface}
            />
          ),
        },
        {
          icon: 'cloud-offline' as keyof typeof Ionicons.glyphMap,
          title: 'Mock API',
          subtitle: mockApiEnabled ? 'Enabled' : 'Disabled',
          rightElement: (
            <Switch
              value={mockApiEnabled}
              onValueChange={setMockApiEnabled}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
              thumbColor={theme.colors.surface}
            />
          ),
        },
      ],
    },
    {
      title: 'Data Management',
      items: [
        {
          icon: 'trash' as keyof typeof Ionicons.glyphMap,
          title: 'Clear All Storage',
          subtitle: 'Remove all local data',
          onPress: handleClearStorage,
          isDestructive: true,
        },
        {
          icon: 'download' as keyof typeof Ionicons.glyphMap,
          title: 'Export Debug Logs',
          subtitle: 'Save app state to file',
          onPress: handleExportLogs,
        },
        {
          icon: 'refresh' as keyof typeof Ionicons.glyphMap,
          title: 'Reset Onboarding',
          subtitle: 'Show onboarding on next launch',
          onPress: handleResetOnboarding,
        },
      ],
    },
    {
      title: 'Testing',
      items: [
        {
          icon: 'analytics' as keyof typeof Ionicons.glyphMap,
          title: 'Test Analytics',
          subtitle: 'Send test analytics event',
          onPress: handleTestAnalytics,
        },
        {
          icon: 'warning' as keyof typeof Ionicons.glyphMap,
          title: 'Test Crash Reporting',
          subtitle: 'Generate test error',
          onPress: handleTestCrashReporting,
        },
      ],
    },
  ];

  const InfoCard = ({ title, value }: { title: string; value: string | number }) => (
    <View style={{
      backgroundColor: theme.colors.surface,
      padding: theme.spacing.md,
      borderRadius: theme.spacing.sm,
      marginBottom: theme.spacing.sm,
    }}>
      <Text style={{
        fontSize: theme.fontSizes.sm,
        color: theme.colors.textDim,
        marginBottom: theme.spacing.xs,
      }}>
        {title}
      </Text>
      <Text style={{
        fontSize: theme.fontSizes.lg,
        color: theme.colors.text,
        fontWeight: theme.fontWeights.semibold,
      }}>
        {value}
      </Text>
    </View>
  );

  const ListItem = ({ icon, title, subtitle, onPress, rightElement, isDestructive = false }: {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    rightElement?: React.ReactNode;
    isDestructive?: boolean;
  }) => (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    }}>
      <Ionicons 
        name={icon} 
        size={24} 
        color={isDestructive ? theme.colors.danger : theme.colors.textDim} 
        style={{ marginRight: theme.spacing.md }}
      />
      <View style={{ flex: 1 }}>
        <Text style={{
          fontSize: theme.fontSizes.md,
          color: isDestructive ? theme.colors.danger : theme.colors.text,
          fontWeight: theme.fontWeights.medium,
        }}>
          {title}
        </Text>
        {subtitle && (
          <Text style={{
            fontSize: theme.fontSizes.sm,
            color: theme.colors.textDim,
            marginTop: theme.spacing.xs,
          }}>
            {subtitle}
          </Text>
        )}
      </View>
      {rightElement}
    </View>
  );

  return (
    <Screen scroll={true}>
      {/* Header */}
      <View style={{
        paddingTop: theme.spacing.xl,
        paddingBottom: theme.spacing.lg,
        paddingHorizontal: theme.spacing.md,
      }}>
        <Text style={{
          fontSize: theme.fontSizes.h1,
          fontWeight: theme.fontWeights.bold,
          color: theme.colors.text,
          marginBottom: theme.spacing.xs,
        }}>
          Developer Panel
        </Text>
        <Text style={{
          fontSize: theme.fontSizes.md,
          color: theme.colors.textDim,
          lineHeight: theme.fontSizes.md * 1.4,
        }}>
          Debug tools and app diagnostics
        </Text>
      </View>

      {/* App Info */}
      <View style={{ paddingHorizontal: theme.spacing.md, marginBottom: theme.spacing.lg }}>
        <Text style={{
          fontSize: theme.fontSizes.sm,
          fontWeight: theme.fontWeights.semibold,
          color: theme.colors.textDim,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          marginBottom: theme.spacing.md,
        }}>
          App Information
        </Text>
        <Card>
          <View style={{ padding: theme.spacing.md }}>
            <InfoCard title="Version" value="1.0.0" />
            <InfoCard title="Environment" value={config.isDevelopment ? 'Development' : 'Production'} />
            <InfoCard title="API Base URL" value={config.apiBaseUrl} />
            <InfoCard title="Saved Memos" value={memoStore.savedMemos?.length || 0} />
            <InfoCard title="Pending Memos" value={memoStore.pendingMemos?.length || 0} />
            <InfoCard title="Timeline Items" value={timelineStore.items?.length || 0} />
          </View>
        </Card>
      </View>

      {/* Debug Sections */}
      {debugSections.map((section, sectionIndex) => (
        <View key={sectionIndex} style={{ marginBottom: theme.spacing.lg }}>
          <Text style={{
            fontSize: theme.fontSizes.sm,
            fontWeight: theme.fontWeights.semibold,
            color: theme.colors.textDim,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            marginBottom: theme.spacing.md,
            paddingHorizontal: theme.spacing.md,
          }}>
            {section.title}
          </Text>
          <Card style={{ marginHorizontal: theme.spacing.md }}>
            {section.items.map((item, itemIndex) => (
              <ListItem
                key={itemIndex}
                icon={item.icon}
                title={item.title}
                subtitle={item.subtitle}
                onPress={item.onPress}
                rightElement={item.rightElement}
                isDestructive={item.isDestructive}
                showDivider={itemIndex < section.items.length - 1}
              />
            ))}
          </Card>
        </View>
      ))}

      {/* Warning */}
      <Card style={{
        marginHorizontal: theme.spacing.md,
        marginBottom: theme.spacing.xl,
        backgroundColor: theme.colors.warning + '20',
        borderColor: theme.colors.warning,
        borderWidth: 1,
      }}>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          padding: theme.spacing.md,
        }}>
          <Ionicons 
            name="warning" 
            size={24} 
            color={theme.colors.warning} 
            style={{ marginRight: theme.spacing.md }}
          />
          <View style={{ flex: 1 }}>
            <Text style={{
              fontSize: theme.fontSizes.md,
              color: theme.colors.warning,
              fontWeight: theme.fontWeights.semibold,
              marginBottom: theme.spacing.xs,
            }}>
              Developer Mode Only
            </Text>
            <Text style={{
              fontSize: theme.fontSizes.sm,
              color: theme.colors.text,
              lineHeight: theme.fontSizes.sm * 1.4,
            }}>
              This panel is only available in development builds. Use with caution as some actions cannot be undone.
            </Text>
          </View>
        </View>
      </Card>
    </Screen>
  );
}
