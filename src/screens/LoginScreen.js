import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../hooks/useTheme';
import { useI18n } from '../hooks/useI18n';
import { Screen } from '../components/ui/Screen';
import { Button } from '../components/ui/Button';

export default function LoginScreen({ navigation }) {
  const { loginEmail, isLoading } = useAuth();
  const theme = useTheme();
  const { t } = useI18n();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    try {
      await loginEmail(email.trim(), password);
      // Navigation will be handled automatically via AuthContext
    } catch (error) {
      Alert.alert('Login Failed', error.message);
    }
  };

  const handleForgotPassword = () => {
    Alert.alert('Forgot Password', 'Password reset functionality coming soon!');
  };

  const goToRegister = () => {
    navigation.navigate('Register');
  };

  const goBack = () => {
    navigation.goBack();
  };

  return (
    <Screen>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <View style={{ 
            flex: 1, 
            paddingHorizontal: theme.spacing.xl,
            paddingTop: theme.spacing.xl
          }}>
            {/* Header */}
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: theme.spacing.xxl
            }}>
              <TouchableOpacity
                onPress={goBack}
                style={{
                  padding: theme.spacing.sm,
                  marginRight: theme.spacing.md
                }}
              >
                <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
              </TouchableOpacity>
              <Text style={{
                fontSize: theme.fontSizes.h2,
                fontWeight: theme.fontWeights.bold,
                color: theme.colors.text
              }}>
                Sign In
              </Text>
            </View>

            {/* Form */}
            <View style={{ marginBottom: theme.spacing.xxl }}>
              {/* Email Input */}
              <View style={{ marginBottom: theme.spacing.lg }}>
                <Text style={{
                  fontSize: theme.fontSizes.md,
                  fontWeight: theme.fontWeights.medium,
                  color: theme.colors.text,
                  marginBottom: theme.spacing.sm
                }}>
                  Email
                </Text>
                <TextInput
                  style={{
                    backgroundColor: theme.colors.card,
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                    borderRadius: theme.radius.md,
                    paddingHorizontal: theme.spacing.lg,
                    paddingVertical: theme.spacing.md,
                    fontSize: theme.fontSizes.md,
                    color: theme.colors.text,
                    minHeight: 50
                  }}
                  placeholder="Enter your email"
                  placeholderTextColor={theme.colors.textDim}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  autoCorrect={false}
                />
              </View>

              {/* Password Input */}
              <View style={{ marginBottom: theme.spacing.lg }}>
                <Text style={{
                  fontSize: theme.fontSizes.md,
                  fontWeight: theme.fontWeights.medium,
                  color: theme.colors.text,
                  marginBottom: theme.spacing.sm
                }}>
                  Password
                </Text>
                <View style={{ position: 'relative' }}>
                  <TextInput
                    style={{
                      backgroundColor: theme.colors.card,
                      borderWidth: 1,
                      borderColor: theme.colors.border,
                      borderRadius: theme.radius.md,
                      paddingHorizontal: theme.spacing.lg,
                      paddingVertical: theme.spacing.md,
                      paddingRight: 50,
                      fontSize: theme.fontSizes.md,
                      color: theme.colors.text,
                      minHeight: 50
                    }}
                    placeholder="Enter your password"
                    placeholderTextColor={theme.colors.textDim}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoComplete="password"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    style={{
                      position: 'absolute',
                      right: theme.spacing.md,
                      top: 0,
                      bottom: 0,
                      justifyContent: 'center',
                      alignItems: 'center',
                      width: 40
                    }}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Ionicons 
                      name={showPassword ? "eye-off" : "eye"} 
                      size={20} 
                      color={theme.colors.textDim} 
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Forgot Password */}
              <TouchableOpacity
                onPress={handleForgotPassword}
                style={{ alignSelf: 'flex-end', marginBottom: theme.spacing.xl }}
              >
                <Text style={{
                  fontSize: theme.fontSizes.sm,
                  color: theme.colors.primary,
                  fontWeight: theme.fontWeights.medium
                }}>
                  Forgot Password?
                </Text>
              </TouchableOpacity>

              {/* Login Button */}
              <Button
                title="Sign In"
                onPress={handleLogin}
                disabled={isLoading || !email.trim() || !password.trim()}
                loading={isLoading}
                style={{ marginBottom: theme.spacing.lg }}
              />
            </View>

            {/* Sign Up Link */}
            <View style={{
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
              marginTop: 'auto',
              paddingBottom: theme.spacing.xl
            }}>
              <Text style={{
                fontSize: theme.fontSizes.md,
                color: theme.colors.textDim
              }}>
                Don't have an account?{' '}
              </Text>
              <TouchableOpacity onPress={goToRegister}>
                <Text style={{
                  fontSize: theme.fontSizes.md,
                  color: theme.colors.primary,
                  fontWeight: theme.fontWeights.semibold
                }}>
                  Sign Up
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}