import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useSubscription } from '../context/SubscriptionContext';
import { useTheme } from '../hooks/useTheme';
import { useI18n } from '../hooks/useI18n';
import { Screen } from '../components/ui/Screen';
import { Card } from '../components/ui/Card';
import { SectionHeader } from '../components/ui/SectionHeader';
import { Pill } from '../components/ui/Pill';
import { Button } from '../components/ui/Button';
import { QuickMemoCard } from '../components/QuickMemoCard';
import { useMemoStore } from '../state/memos';

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const { subscriptionStatus, features } = useSubscription();
  const theme = useTheme();
  const { t } = useI18n();
  const { savedMemos, currentStatus } = useMemoStore();

  const [showMemoSuccess, setShowMemoSuccess] = useState(false);

  const primaryActions = [
    {
      title: t('home.startInterview'),
      subtitle: t('home.interviewSubtitle'),
      icon: 'mic',
      onPress: () => navigation.navigate('Interview')
    },
    {
      title: t('home.quickMemory'),
      subtitle: t('home.quickMemorySubtitle'),
      icon: 'flash',
      onPress: () => navigation.navigate('QuickCapture')
    }
  ];

  const secondaryActions = [
    {
      title: t('home.viewTimeline'),
      subtitle: t('home.timelineSubtitle'),
      icon: 'time',
      onPress: () => navigation.navigate('Timeline')
    },
    {
      title: t('home.exportBook'),
      subtitle: t('home.exportSubtitle'),
      icon: 'book',
      onPress: () => navigation.navigate('Book')
    }
  ];

  return (
    <Screen scroll>
      {/* Header */}
      <View style={{ 
        paddingTop: theme.spacing.lg,
        paddingBottom: theme.spacing.md 
      }}>
        <View style={{ 
          flexDirection: 'row', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          marginBottom: theme.spacing.sm 
        }}>
          <View style={{ flex: 1 }}>
            <Text style={{
              fontSize: theme.fontSizes.h2,
              fontWeight: theme.fontWeights.bold,
              color: theme.colors.text,
            }}>
              {t('home.welcome', { name: (user?.name && typeof user.name === 'string') ? user.name.split(' ')[0] : 'User' })}
            </Text>
            <Text style={{
              fontSize: theme.fontSizes.md,
              color: theme.colors.textDim,
              marginTop: theme.spacing.xs,
            }}>
              Ready to capture more memories?
            </Text>
          </View>
          <Pill 
            label={`${subscriptionStatus} Plan`} 
            variant={subscriptionStatus === 'free' ? 'default' : 'primary'}
          />
        </View>
      </View>

      {/* Quick Memo Section */}
      <QuickMemoCard 
        onMemoSaved={(transcript) => {
          setShowMemoSuccess(true);
          setTimeout(() => setShowMemoSuccess(false), 3000);
        }}
      />

      {/* Success Toast */}
      {showMemoSuccess && (
        <Card style={{
          marginTop: theme.spacing.md,
          backgroundColor: `${theme.colors.success}20`,
          borderColor: theme.colors.success,
          borderWidth: 1,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="checkmark-circle" size={24} color={theme.colors.success} />
            <View style={{ marginLeft: theme.spacing.md, flex: 1 }}>
              <Text style={{
                fontSize: theme.fontSizes.md,
                fontWeight: theme.fontWeights.medium,
                color: theme.colors.text,
              }}>
                Memo saved successfully!
              </Text>
              <TouchableOpacity 
                onPress={() => navigation.navigate('Timeline')}
                style={{ marginTop: theme.spacing.xs }}
              >
                <Text style={{
                  fontSize: theme.fontSizes.sm,
                  color: theme.colors.primary,
                  textDecorationLine: 'underline',
                }}>
                  View in Timeline →
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Card>
      )}

      {/* Subscription Status */}
      <Card style={{ marginBottom: theme.spacing.xl }}>
        <View style={{ 
          flexDirection: 'row', 
          alignItems: 'center', 
          justifyContent: 'space-between' 
        }}>
          <View style={{ flex: 1 }}>
            <Text style={{
              fontSize: theme.fontSizes.md,
              fontWeight: theme.fontWeights.semibold,
              color: theme.colors.text,
              marginBottom: theme.spacing.xs,
            }}>
              {features.maxChapters === -1 ? 'Unlimited' : features.maxChapters} chapters available
            </Text>
            <Text style={{
              fontSize: theme.fontSizes.sm,
              color: theme.colors.textDim,
            }}>
              {features.aiGenerations === -1 ? 'Unlimited' : features.aiGenerations} AI generations remaining
            </Text>
          </View>
          {subscriptionStatus === 'free' && (
            <Button
              title="Upgrade"
              onPress={() => {/* Handle upgrade */}}
              variant="primary"
              size="sm"
            />
          )}
        </View>
      </Card>

      {/* Quick Actions */}
      <SectionHeader title={t('home.quickActions')} />
      <View style={{ 
        flexDirection: 'row', 
        gap: theme.spacing.md,
        marginBottom: theme.spacing.xl 
      }}>
        {primaryActions.map((action, index) => (
          <Card 
            key={index} 
            onPress={action.onPress}
            style={{ flex: 1 }}
          >
            <View style={{
              width: 56,
              height: 56,
              backgroundColor: theme.colors.primary,
              borderRadius: theme.radius.lg,
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: theme.spacing.md,
            }}>
              <Ionicons name={action.icon} size={24} color={theme.colors.white} />
            </View>
            <Text style={{
              fontSize: theme.fontSizes.md,
              fontWeight: theme.fontWeights.semibold,
              color: theme.colors.text,
              marginBottom: theme.spacing.xs,
            }}>
              {action.title}
            </Text>
            <Text style={{
              fontSize: theme.fontSizes.sm,
              color: theme.colors.textDim,
              lineHeight: theme.fontSizes.sm * 1.3,
            }}>
              {action.subtitle}
            </Text>
          </Card>
        ))}
      </View>

      {/* Secondary Actions */}
      <View style={{ 
        flexDirection: 'row', 
        gap: theme.spacing.md,
        marginBottom: theme.spacing.xl 
      }}>
        {secondaryActions.map((action, index) => (
          <Card 
            key={index} 
            onPress={action.onPress}
            style={{ flex: 1 }}
            variant="surface"
          >
            <View style={{
              width: 40,
              height: 40,
              backgroundColor: theme.colors.card,
              borderRadius: theme.radius.md,
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: theme.spacing.sm,
            }}>
              <Ionicons name={action.icon} size={20} color={theme.colors.primary} />
            </View>
            <Text style={{
              fontSize: theme.fontSizes.sm,
              fontWeight: theme.fontWeights.medium,
              color: theme.colors.text,
              marginBottom: theme.spacing.xs,
            }}>
              {action.title}
            </Text>
            <Text style={{
              fontSize: theme.fontSizes.xs,
              color: theme.colors.textDim,
            }}>
              {action.subtitle}
            </Text>
          </Card>
        ))}
      </View>

      {/* Recent Activity */}
      <SectionHeader title={t('home.recentActivity')} />
      <Card 
        onPress={() => navigation.navigate('Timeline')}
        style={{ marginBottom: theme.spacing.xl }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{
            width: 44,
            height: 44,
            backgroundColor: theme.colors.surface,
            borderRadius: theme.radius.md,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: theme.spacing.md,
          }}>
            <Ionicons name="document-text" size={20} color={theme.colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{
              fontSize: theme.fontSizes.md,
              fontWeight: theme.fontWeights.medium,
              color: theme.colors.text,
              marginBottom: theme.spacing.xs,
            }}>
              Childhood Memories
            </Text>
            <Text style={{
              fontSize: theme.fontSizes.sm,
              color: theme.colors.textDim,
            }}>
              Last edited 2 days ago
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.textDim} />
        </View>
      </Card>

      {/* Pro Tip */}
      <Card 
        variant="surface" 
        style={{ 
          backgroundColor: `${theme.colors.primary}10`,
          borderColor: `${theme.colors.primary}20`,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
          <View style={{
            width: 32,
            height: 32,
            backgroundColor: `${theme.colors.primary}20`,
            borderRadius: 16,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: theme.spacing.md,
          }}>
            <Ionicons name="bulb" size={16} color={theme.colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{
              fontSize: theme.fontSizes.sm,
              fontWeight: theme.fontWeights.semibold,
              color: theme.colors.primary,
              marginBottom: theme.spacing.xs,
            }}>
              Pro Tip
            </Text>
            <Text style={{
              fontSize: theme.fontSizes.sm,
              color: theme.colors.text,
              lineHeight: theme.fontSizes.sm * 1.4,
            }}>
              Try recording voice memories for a more natural storytelling experience. Our AI will transcribe and enhance them automatically.
            </Text>
          </View>
        </View>
      </Card>
    </Screen>
  );
}
