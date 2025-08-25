import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../hooks/useTheme';
import { useI18n } from '../hooks/useI18n';
import { Screen } from '../components/ui/Screen';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export default function OnboardingScreen({ navigation }) {
  const { login } = useAuth();
  const theme = useTheme();
  const { t } = useI18n();

  const handleGoogleLogin = async () => {
    try {
      await login('google');
    } catch (error) {
      console.error('Google login failed:', error);
    }
  };

  const handleAppleLogin = async () => {
    try {
      await login('apple');
    } catch (error) {
      console.error('Apple login failed:', error);
    }
  };

  const goToLogin = () => {
    navigation.navigate('Login');
  };

  const goToRegister = () => {
    navigation.navigate('Register');
  };

  const features = [
    { icon: 'mic', title: t('onboarding.recordVoice') },
    { icon: 'star', title: t('onboarding.aiChapters') },
    { icon: 'book', title: t('onboarding.exportBeautiful') },
  ];

  return (
    <Screen>
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center',
        paddingHorizontal: theme.spacing.xl 
      }}>
        {/* Hero Section */}
        <View style={{ 
          width: 120, 
          height: 120, 
          backgroundColor: theme.colors.surface,
          borderRadius: 60,
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: theme.spacing.xl,
          borderWidth: 1,
          borderColor: theme.colors.border,
        }}>
          <Ionicons name="book" size={64} color={theme.colors.primary} />
        </View>

        <Text style={{
          fontSize: theme.fontSizes.h1,
          fontWeight: theme.fontWeights.bold,
          color: theme.colors.text,
          textAlign: 'center',
          marginBottom: theme.spacing.md,
        }}>
          {t('onboarding.title')}
        </Text>

        <Text style={{
          fontSize: theme.fontSizes.lg,
          color: theme.colors.textDim,
          textAlign: 'center',
          marginBottom: theme.spacing.xxl,
          lineHeight: theme.fontSizes.lg * 1.4,
        }}>
          {t('onboarding.subtitle')}
        </Text>

        {/* Features */}
        <View style={{ width: '100%', marginBottom: theme.spacing.xxl }}>
          {features.map((feature, index) => (
            <Card key={index} style={{ marginBottom: theme.spacing.md }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{
                  width: 40,
                  height: 40,
                  backgroundColor: theme.colors.surface,
                  borderRadius: 20,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: theme.spacing.md,
                }}>
                  <Ionicons name={feature.icon} size={20} color={theme.colors.primary} />
                </View>
                <Text style={{
                  fontSize: theme.fontSizes.md,
                  color: theme.colors.text,
                  fontWeight: theme.fontWeights.medium,
                }}>
                  {feature.title}
                </Text>
              </View>
            </Card>
          ))}
        </View>

        {/* Login Buttons */}
        <View style={{ width: '100%', gap: theme.spacing.md }}>
          {/* Email/Password Options */}
          <Button
            title="Sign Up with Email"
            onPress={goToRegister}
            style={{ marginBottom: theme.spacing.sm }}
          />

          <TouchableOpacity
            onPress={goToLogin}
            style={{
              backgroundColor: 'transparent',
              borderWidth: 1,
              borderColor: theme.colors.border,
              borderRadius: theme.radius.lg,
              paddingVertical: theme.spacing.lg,
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: 56,
              marginBottom: theme.spacing.lg,
            }}
            activeOpacity={theme.opacity.pressed}
          >
            <Text style={{
              fontSize: theme.fontSizes.lg,
              fontWeight: theme.fontWeights.semibold,
              color: theme.colors.text,
            }}>
              Sign In with Email
            </Text>
          </TouchableOpacity>

          {/* Divider */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginVertical: theme.spacing.md
          }}>
            <View style={{
              flex: 1,
              height: 1,
              backgroundColor: theme.colors.border
            }} />
            <Text style={{
              marginHorizontal: theme.spacing.md,
              fontSize: theme.fontSizes.sm,
              color: theme.colors.textDim
            }}>
              or continue with
            </Text>
            <View style={{
              flex: 1,
              height: 1,
              backgroundColor: theme.colors.border
            }} />
          </View>

          <TouchableOpacity
            onPress={handleGoogleLogin}
            style={{
              backgroundColor: theme.colors.card,
              borderWidth: 1,
              borderColor: theme.colors.border,
              borderRadius: theme.radius.lg,
              paddingVertical: theme.spacing.lg,
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: 56,
            }}
            activeOpacity={theme.opacity.pressed}
            accessibilityRole="button"
            accessibilityLabel={t('auth.continueGoogle')}
          >
            <Ionicons name="logo-google" size={24} color="#4285f4" />
            <Text style={{
              marginLeft: theme.spacing.md,
              fontSize: theme.fontSizes.lg,
              fontWeight: theme.fontWeights.semibold,
              color: theme.colors.text,
            }}>
              {t('auth.continueGoogle')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleAppleLogin}
            style={{
              backgroundColor: theme.colors.text,
              borderRadius: theme.radius.lg,
              paddingVertical: theme.spacing.lg,
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: 56,
            }}
            activeOpacity={theme.opacity.pressed}
            accessibilityRole="button"
            accessibilityLabel={t('auth.continueApple')}
          >
            <Ionicons name="logo-apple" size={24} color={theme.colors.bg} />
            <Text style={{
              marginLeft: theme.spacing.md,
              fontSize: theme.fontSizes.lg,
              fontWeight: theme.fontWeights.semibold,
              color: theme.colors.bg,
            }}>
              {t('auth.continueApple')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Terms */}
        <Text style={{
          fontSize: theme.fontSizes.sm,
          color: theme.colors.textDim,
          textAlign: 'center',
          marginTop: theme.spacing.xl,
          lineHeight: theme.fontSizes.sm * 1.4,
        }}>
          {t('onboarding.termsText', 'By continuing, you agree to our Terms of Service and Privacy Policy')}
        </Text>
      </View>
    </Screen>
  );
}
