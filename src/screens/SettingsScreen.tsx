import React, { useState } from 'react';
import { View, Text, Alert, Linking, Switch, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { useI18n } from '../hooks/useI18n';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { useSubscription } from '../context/SubscriptionContext';
import { Screen } from '../components/layout/Screen';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { authService } from '../services/auth';
import { LanguagePicker } from '../components/LanguagePicker';

interface SettingItem {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  showArrow?: boolean;
  isDestructive?: boolean;
}

interface SettingSection {
  title: string;
  items: SettingItem[];
}

export default function SettingsScreen() {
  const { user, logout } = useAuth();
  const { settings, updateSetting } = useSettings();
  const { subscriptionStatus, upgradeSubscription } = useSubscription();
  const theme = useTheme();
  const { t } = useI18n();

  const handleLogout = () => {
    Alert.alert(
      t('auth.signOut'),
      'Are you sure you want to sign out?',
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('auth.signOut'), style: 'destructive', onPress: logout }
      ]
    );
  };

  const handleExportData = async () => {
    Alert.alert(
      'Export Data',
      'Your data export will be prepared and sent to your email address.',
      [{ text: 'OK' }]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      t('settings.deleteAccount'),
      'This will permanently delete your account and all data. This action cannot be undone.',
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('settings.deleteAccount'),
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('[Settings] Deleting account...');
              await authService.deleteAccount();
              logout();
            } catch (error) {
              console.error('[Settings] Account deletion failed:', error);
              Alert.alert('Error', 'Failed to delete account. Please try again.');
            }
          }
        }
      ]
    );
  };

  const handleDeleteData = () => {
    Alert.alert(
      'Delete All Data',
      'This will permanently delete all your memories, chapters, and settings. This action cannot be undone.',
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: 'Delete Everything',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('[Settings] Deleting all data...');
              await authService.deleteAccount();
              Alert.alert('Success', 'All data has been deleted.');
              logout();
            } catch (error) {
              console.error('[Settings] Data deletion failed:', error);
              Alert.alert('Error', 'Failed to delete data. Please try again.');
            }
          }
        }
      ]
    );
  };

  const handleManageSubscription = () => {
    Alert.alert('Subscription', 'Subscription management coming soon');
  };

  const handleOpenPrivacyPolicy = () => {
    Linking.openURL('https://lifelegacy.ai/privacy');
  };

  const handleOpenTerms = () => {
    Linking.openURL('https://lifelegacy.ai/terms');
  };

  const settingSections: SettingSection[] = [
    {
      title: t('settings.account'),
      items: [
        {
          icon: 'person-circle',
          title: 'Profile',
          subtitle: user?.email || 'Not signed in',
          onPress: () => Alert.alert('Profile', 'Profile editing coming soon'),
          showArrow: true
        }
      ]
    },
    {
      title: t('settings.subscription'),
      items: [
        {
          icon: 'card',
          title: 'Current Plan',
          subtitle: `${subscriptionStatus} plan`,
          onPress: handleManageSubscription,
          showArrow: true
        }
      ]
    },
    {
      title: 'Preferences',
      items: [
        {
          icon: 'notifications',
          title: 'Notifications',
          subtitle: 'Memory reminders and updates',
          rightElement: (
            <Switch
              value={settings?.notifications || false}
              onValueChange={(value) => updateSetting('notifications', value)}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
              thumbColor={theme.colors.surface}
            />
          )
        },
        {
          icon: 'save',
          title: 'Auto Save',
          subtitle: 'Automatically save changes',
          rightElement: (
            <Switch
              value={settings?.autoSave || false}
              onValueChange={(value) => updateSetting('autoSave', value)}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
              thumbColor={theme.colors.surface}
            />
          )
        },
        {
          icon: 'color-palette',
          title: 'Theme',
          subtitle: settings?.theme === 'light' ? 'Light' : 'Dark',
          onPress: () => {
            const newTheme = settings?.theme === 'light' ? 'dark' : 'light';
            updateSetting('theme', newTheme);
          },
          showArrow: true
        }
      ]
    },
    {
      title: 'Voice & Recording',
      items: [
        {
          icon: 'mic',
          title: 'Voice Quality',
          subtitle: settings?.voiceQuality === 'high' ? 'High Quality' : 'Standard',
          onPress: () => {
            const newQuality = settings?.voiceQuality === 'high' ? 'standard' : 'high';
            updateSetting('voiceQuality', newQuality);
          },
          showArrow: true
        },
        {
          icon: 'document',
          title: 'Default Export Format',
          subtitle: settings?.exportFormat?.toUpperCase() || 'PDF',
          onPress: () => Alert.alert('Export Format', 'Format selection coming soon'),
          showArrow: true
        }
      ]
    },
    {
      title: t('settings.privacy'),
      items: [
        {
          icon: 'download',
          title: t('settings.downloadData'),
          subtitle: 'Export all your memories',
          onPress: handleExportData,
          showArrow: true
        },
        {
          icon: 'document-text',
          title: t('settings.privacyPolicy'),
          subtitle: 'How we protect your data',
          onPress: handleOpenPrivacyPolicy,
          showArrow: true
        },
        {
          icon: 'document-text',
          title: t('settings.terms'),
          subtitle: 'App terms and conditions',
          onPress: handleOpenTerms,
          showArrow: true
        }
      ]
    },
    {
      title: t('settings.support'),
      items: [
        {
          icon: 'help-circle',
          title: 'Help & Support',
          subtitle: 'Get help with the app',
          onPress: () => Alert.alert('Support', 'Support coming soon'),
          showArrow: true
        }
      ]
    }
  ];

  const SectionHeader = ({ title }: { title: string }) => (
    <Text style={{
      fontSize: theme.fontSizes.sm,
      fontWeight: theme.fontWeights.semibold,
      color: theme.colors.textDim,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: theme.spacing.md,
      marginTop: theme.spacing.xl,
      paddingHorizontal: theme.spacing.md,
    }}>
      {title}
    </Text>
  );

  const ListItem = ({ icon, title, subtitle, onPress, rightElement, showArrow = false, isDestructive = false, showDivider = true }: {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    rightElement?: React.ReactNode;
    showArrow?: boolean;
    isDestructive?: boolean;
    showDivider?: boolean;
  }) => (
    <TouchableOpacity 
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.md,
        borderBottomWidth: showDivider ? 1 : 0,
        borderBottomColor: theme.colors.border,
      }}
    >
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
      {showArrow && (
        <Ionicons 
          name="chevron-forward" 
          size={20} 
          color={theme.colors.textDim} 
        />
      )}
    </TouchableOpacity>
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
          {t('settings.title')}
        </Text>
        <Text style={{
          fontSize: theme.fontSizes.md,
          color: theme.colors.textDim,
          lineHeight: theme.fontSizes.md * 1.4,
        }}>
          Manage your account and preferences
        </Text>
      </View>

      {/* Settings Sections */}
      {settingSections.map((section, sectionIndex) => (
        <View key={sectionIndex}>
          <SectionHeader title={section.title} />
          <Card style={{ marginBottom: theme.spacing.md, marginHorizontal: theme.spacing.md }}>
            {section.items.map((item, itemIndex) => (
              <ListItem
                key={itemIndex}
                icon={item.icon}
                title={item.title}
                subtitle={item.subtitle}
                onPress={item.onPress}
                rightElement={item.rightElement}
                showArrow={item.showArrow}
                isDestructive={item.isDestructive}
                showDivider={itemIndex < section.items.length - 1}
              />
            ))}
          </Card>
        </View>
      ))}

      {/* Language Selection */}
      <View style={{ marginBottom: theme.spacing.lg, paddingHorizontal: theme.spacing.md }}>
        <LanguagePicker />
      </View>

      {/* Subscription Upgrade Button (if free plan) */}
      {subscriptionStatus === 'free' && (
        <>
          <Text style={{
            fontSize: theme.fontSizes.sm,
            fontWeight: theme.fontWeights.semibold,
            color: theme.colors.textDim,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            marginBottom: theme.spacing.md,
            marginTop: theme.spacing.xl,
            paddingHorizontal: theme.spacing.md,
          }}>
            Upgrade
          </Text>
          <Button
            title="Upgrade to Premium"
            onPress={() => upgradeSubscription('premium')}
            variant="primary"
            style={{ 
              marginBottom: theme.spacing.lg,
              marginHorizontal: theme.spacing.md,
              borderRadius: theme.spacing.md,
            }}
            accessibilityLabel="Upgrade to Premium subscription"
          />
        </>
      )}

      {/* Danger Zone */}
      <Text style={{
        fontSize: theme.fontSizes.sm,
        fontWeight: theme.fontWeights.semibold,
        color: theme.colors.textDim,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: theme.spacing.md,
        marginTop: theme.spacing.xl,
        paddingHorizontal: theme.spacing.md,
      }}>
        Danger Zone
      </Text>
      <Card style={{ marginBottom: theme.spacing.lg, marginHorizontal: theme.spacing.md }}>
        <ListItem
          icon="trash"
          title={t('settings.deleteAccount')}
          subtitle="Permanently delete everything"
          onPress={handleDeleteData}
          showArrow={true}
          isDestructive={true}
          showDivider={false}
        />
      </Card>

      {/* Sign Out Button */}
      <Button
        title={t('auth.signOut')}
        onPress={handleLogout}
        variant="danger"
        style={{ 
          marginBottom: theme.spacing.xl,
          marginHorizontal: theme.spacing.md,
          borderRadius: theme.spacing.md,
        }}
        accessibilityLabel={t('auth.signOut')}
      />

      {/* App Info */}
      <Card style={{
        backgroundColor: theme.colors.surface,
        alignItems: 'center',
        marginBottom: theme.spacing.lg,
        marginHorizontal: theme.spacing.md,
      }}>
        <Text style={{
          fontSize: theme.fontSizes.sm,
          color: theme.colors.textDim,
          textAlign: 'center',
          marginBottom: theme.spacing.xs,
        }}>
          Life Legacy AI v1.0.0
        </Text>
        <Text style={{
          fontSize: theme.fontSizes.xs,
          color: theme.colors.textDim,
          textAlign: 'center',
        }}>
          Made with ❤️ for preserving memories
        </Text>
      </Card>
    </Screen>
  );
}
