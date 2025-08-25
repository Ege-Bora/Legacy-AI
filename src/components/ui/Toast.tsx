import React, { useState, useEffect } from 'react';
import { View, Text, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../hooks/useTheme';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastData {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastProps {
  toast: ToastData;
  onHide: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ toast, onHide }) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const translateY = new Animated.Value(-100);
  const opacity = new Animated.Value(0);

  useEffect(() => {
    // Show animation
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto hide
    const timer = setTimeout(() => {
      hideToast();
    }, toast.duration || 3000);

    return () => clearTimeout(timer);
  }, []);

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onHide(toast.id);
    });
  };

  const getToastConfig = (type: ToastType) => {
    switch (type) {
      case 'success':
        return {
          icon: 'checkmark-circle' as const,
          color: theme.colors.success,
          backgroundColor: `${theme.colors.success}15`,
          borderColor: `${theme.colors.success}30`,
        };
      case 'error':
        return {
          icon: 'close-circle' as const,
          color: theme.colors.danger,
          backgroundColor: `${theme.colors.danger}15`,
          borderColor: `${theme.colors.danger}30`,
        };
      case 'warning':
        return {
          icon: 'warning' as const,
          color: theme.colors.warning,
          backgroundColor: `${theme.colors.warning}15`,
          borderColor: `${theme.colors.warning}30`,
        };
      case 'info':
      default:
        return {
          icon: 'information-circle' as const,
          color: theme.colors.primary,
          backgroundColor: `${theme.colors.primary}15`,
          borderColor: `${theme.colors.primary}30`,
        };
    }
  };

  const config = getToastConfig(toast.type);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: insets.top + theme.spacing.md,
        left: theme.spacing.lg,
        right: theme.spacing.lg,
        zIndex: 9999,
        transform: [{ translateY }],
        opacity,
      }}
    >
      <View
        style={{
          backgroundColor: config.backgroundColor,
          borderColor: config.borderColor,
          borderWidth: 1,
          borderRadius: 12,
          padding: theme.spacing.md,
          flexDirection: 'row',
          alignItems: 'center',
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: 2,
          },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 4,
        }}
      >
        <Ionicons
          name={config.icon}
          size={24}
          color={config.color}
          style={{ marginRight: theme.spacing.md }}
        />
        <Text
          style={{
            flex: 1,
            fontSize: theme.fontSizes.md,
            color: theme.colors.text,
            fontWeight: theme.fontWeights.medium,
          }}
        >
          {toast.message}
        </Text>
      </View>
    </Animated.View>
  );
};

// Toast Manager
class ToastManager {
  private toasts: ToastData[] = [];
  private listeners: ((toasts: ToastData[]) => void)[] = [];

  subscribe(listener: (toasts: ToastData[]) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(listener => listener([...this.toasts]));
  }

  private show(type: ToastType, message: string, duration?: number) {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 11);
    const toast: ToastData = { id, type, message, duration };
    
    this.toasts.push(toast);
    this.notify();
  }

  showSuccess(message: string, duration?: number) {
    this.show('success', message, duration);
  }

  showError(message: string, duration?: number) {
    this.show('error', message, duration);
  }

  showInfo(message: string, duration?: number) {
    this.show('info', message, duration);
  }

  showWarning(message: string, duration?: number) {
    this.show('warning', message, duration);
  }

  hide(id: string) {
    this.toasts = this.toasts.filter(toast => toast.id !== id);
    this.notify();
  }

  clear() {
    this.toasts = [];
    this.notify();
  }
}

export const toastManager = new ToastManager();

// Toast Container Component
export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  useEffect(() => {
    const unsubscribe = toastManager.subscribe(setToasts);
    return unsubscribe;
  }, []);

  return (
    <>
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          toast={toast}
          onHide={toastManager.hide.bind(toastManager)}
        />
      ))}
    </>
  );
};

// Convenience functions
export const showSuccess = (message: string, duration?: number) => {
  toastManager.showSuccess(message, duration);
};

export const showError = (message: string, duration?: number) => {
  toastManager.showError(message, duration);
};

export const showInfo = (message: string, duration?: number) => {
  toastManager.showInfo(message, duration);
};

export const showWarning = (message: string, duration?: number) => {
  toastManager.showWarning(message, duration);
};
