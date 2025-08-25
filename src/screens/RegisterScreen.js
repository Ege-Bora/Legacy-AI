import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../hooks/useTheme';
import { useI18n } from '../hooks/useI18n';
import { Screen } from '../components/ui/Screen';
import { Button } from '../components/ui/Button';

export default function RegisterScreen({ navigation }) {
  const { register, isLoading } = useAuth();
  const theme = useTheme();
  const { t } = useI18n();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validateForm = () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return false;
    }

    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email');
      return false;
    }

    if (!email.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return false;
    }

    if (!password.trim()) {
      Alert.alert('Error', 'Please enter a password');
      return false;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return false;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return false;
    }

    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    try {
      await register(email.trim(), password, name.trim());
      // Navigation will be handled automatically via AuthContext
    } catch (error) {
      Alert.alert('Registration Failed', error.message);
    }
  };

  const goToLogin = () => {
    navigation.navigate('Login');
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
                Create Account
              </Text>
            </View>

            {/* Form */}
            <View style={{ marginBottom: theme.spacing.xxl }}>
              {/* Name Input */}
              <View style={{ marginBottom: theme.spacing.lg }}>
                <Text style={{
                  fontSize: theme.fontSizes.md,
                  fontWeight: theme.fontWeights.medium,
                  color: theme.colors.text,
                  marginBottom: theme.spacing.sm
                }}>
                  Full Name
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
                  placeholder="Enter your full name"
                  placeholderTextColor={theme.colors.textDim}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  autoComplete="name"
                  autoCorrect={false}
                />
              </View>

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
                    placeholder="Create a password (min 6 characters)"
                    placeholderTextColor={theme.colors.textDim}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoComplete="new-password"
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

              {/* Confirm Password Input */}
              <View style={{ marginBottom: theme.spacing.xl }}>
                <Text style={{
                  fontSize: theme.fontSizes.md,
                  fontWeight: theme.fontWeights.medium,
                  color: theme.colors.text,
                  marginBottom: theme.spacing.sm
                }}>
                  Confirm Password
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
                    placeholder="Confirm your password"
                    placeholderTextColor={theme.colors.textDim}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                    autoComplete="new-password"
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
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    <Ionicons 
                      name={showConfirmPassword ? "eye-off" : "eye"} 
                      size={20} 
                      color={theme.colors.textDim} 
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Register Button */}
              <Button
                title="Create Account"
                onPress={handleRegister}
                disabled={isLoading || !name.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()}
                loading={isLoading}
                style={{ marginBottom: theme.spacing.lg }}
              />

              {/* Terms Text */}
              <Text style={{
                fontSize: theme.fontSizes.sm,
                color: theme.colors.textDim,
                textAlign: 'center',
                lineHeight: theme.fontSizes.sm * 1.4,
                marginBottom: theme.spacing.lg
              }}>
                By creating an account, you agree to our Terms of Service and Privacy Policy
              </Text>
            </View>

            {/* Sign In Link */}
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
                Already have an account?{' '}
              </Text>
              <TouchableOpacity onPress={goToLogin}>
                <Text style={{
                  fontSize: theme.fontSizes.md,
                  color: theme.colors.primary,
                  fontWeight: theme.fontWeights.semibold
                }}>
                  Sign In
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}