import React, { useState, useEffect } from 'react';
import { View, Text, Linking, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { useTheme } from '../../hooks/useTheme';
import { useI18n } from '../../hooks/useI18n';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

interface MicGateProps {
  children: React.ReactNode;
  onPermissionGranted?: () => void;
  showInlineCard?: boolean;
}

export const MicGate: React.FC<MicGateProps> = ({
  children,
  onPermissionGranted,
  showInlineCard = true,
}) => {
  const theme = useTheme();
  const { t } = useI18n();
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'undetermined' | 'checking'>('checking');

  useEffect(() => {
    checkPermission();
  }, []);

  const checkPermission = async () => {
    try {
      const { status } = await Audio.getPermissionsAsync();
      setPermissionStatus(status);
      
      if (status === 'granted' && onPermissionGranted) {
        onPermissionGranted();
      }
    } catch (error) {
      console.error('Failed to check microphone permission:', error);
      setPermissionStatus('denied');
    }
  };

  const requestPermission = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      setPermissionStatus(status);
      
      if (status === 'granted') {
        if (onPermissionGranted) {
          onPermissionGranted();
        }
      } else if (status === 'denied') {
        // Show alert suggesting to go to settings
        Alert.alert(
          t('permissions.microphoneDenied'),
          t('permissions.microphoneExplanation'),
          [
            { text: t('common.cancel'), style: 'cancel' },
            { text: t('permissions.openSettings'), onPress: openSettings },
          ]
        );
      }
    } catch (error) {
      console.error('Failed to request microphone permission:', error);
      setPermissionStatus('denied');
    }
  };

  const openSettings = () => {
    Linking.openSettings();
  };

  // Show loading state while checking
  if (permissionStatus === 'checking') {
    return (
      <Card style={{ alignItems: 'center', padding: theme.spacing.xl }}>
        <View
          style={{
            width: 48,
            height: 48,
            backgroundColor: `${theme.colors.primary}20`,
            borderRadius: 24,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: theme.spacing.md,
          }}
        >
          <Ionicons name="mic-outline" size={24} color={theme.colors.primary} />
        </View>
        <Text
          style={{
            fontSize: theme.fontSizes.md,
            color: theme.colors.textDim,
            textAlign: 'center',
          }}
        >
          {t('permissions.checkingMicrophone')}
        </Text>
      </Card>
    );
  }

  // Show permission denied UI
  if (permissionStatus === 'denied') {
    if (!showInlineCard) {
      return null;
    }

    return (
      <Card
        style={{
          alignItems: 'center',
          padding: theme.spacing.xl,
          backgroundColor: `${theme.colors.warning}10`,
          borderColor: `${theme.colors.warning}30`,
          borderWidth: 1,
        }}
      >
        <View
          style={{
            width: 64,
            height: 64,
            backgroundColor: `${theme.colors.warning}20`,
            borderRadius: 32,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: theme.spacing.lg,
          }}
        >
          <Ionicons name="mic-off" size={32} color={theme.colors.warning} />
        </View>

        <Text
          style={{
            fontSize: theme.fontSizes.lg,
            fontWeight: theme.fontWeights.semibold,
            color: theme.colors.text,
            textAlign: 'center',
            marginBottom: theme.spacing.sm,
          }}
        >
          {t('permissions.microphoneRequired')}
        </Text>

        <Text
          style={{
            fontSize: theme.fontSizes.md,
            color: theme.colors.textDim,
            textAlign: 'center',
            lineHeight: theme.fontSizes.md * 1.4,
            marginBottom: theme.spacing.lg,
          }}
        >
          {t('permissions.microphoneExplanation')}
        </Text>

        <View style={{ gap: theme.spacing.md, width: '100%', maxWidth: 280 }}>
          <Button
            title={t('permissions.enableMicrophone')}
            onPress={requestPermission}
            variant="primary"
            accessibilityLabel={t('permissions.enableMicrophone')}
          />

          <Button
            title={t('permissions.openSettings')}
            onPress={openSettings}
            variant="secondary"
            accessibilityLabel={t('permissions.openSettings')}
          />
        </View>

        <Text
          style={{
            fontSize: theme.fontSizes.xs,
            color: theme.colors.textDim,
            textAlign: 'center',
            marginTop: theme.spacing.md,
            fontStyle: 'italic',
          }}
        >
          {t('permissions.microphonePrivacy')}
        </Text>
      </Card>
    );
  }

  // Show undetermined state with request button
  if (permissionStatus === 'undetermined') {
    if (!showInlineCard) {
      return null;
    }

    return (
      <Card style={{ alignItems: 'center', padding: theme.spacing.xl }}>
        <View
          style={{
            width: 48,
            height: 48,
            backgroundColor: `${theme.colors.primary}20`,
            borderRadius: 24,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: theme.spacing.lg,
          }}
        >
          <Ionicons name="mic-outline" size={24} color={theme.colors.primary} />
        </View>

        <Text
          style={{
            fontSize: theme.fontSizes.lg,
            fontWeight: theme.fontWeights.semibold,
            color: theme.colors.text,
            textAlign: 'center',
            marginBottom: theme.spacing.sm,
          }}
        >
          {t('permissions.microphoneNeeded')}
        </Text>

        <Text
          style={{
            fontSize: theme.fontSizes.md,
            color: theme.colors.textDim,
            textAlign: 'center',
            lineHeight: theme.fontSizes.md * 1.4,
            marginBottom: theme.spacing.lg,
          }}
        >
          {t('permissions.microphoneDescription')}
        </Text>

        <Button
          title={t('permissions.allowMicrophone')}
          onPress={requestPermission}
          variant="primary"
          style={{ minWidth: 200 }}
          accessibilityLabel={t('permissions.allowMicrophone')}
        />
      </Card>
    );
  }

  // Permission granted - show children
  return <>{children}</>;
};
