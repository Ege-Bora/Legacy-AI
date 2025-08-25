import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from './ui/Button';
import { Card } from './ui/Card';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn('ErrorBoundary caught:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View
          style={{
            flex: 1,
            backgroundColor: '#f8f9fa',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 24,
          }}
        >
          <Card style={{ alignItems: 'center', maxWidth: 400, width: '100%' }}>
            <View
              style={{
                width: 64,
                height: 64,
                backgroundColor: '#fee2e2',
                borderRadius: 32,
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 24,
              }}
            >
              <Ionicons name="warning" size={32} color="#dc2626" />
            </View>

            <Text
              style={{
                fontSize: 20,
                fontWeight: '600',
                color: '#111827',
                textAlign: 'center',
                marginBottom: 8,
              }}
            >
              Something went wrong
            </Text>

            <Text
              style={{
                fontSize: 16,
                color: '#6b7280',
                textAlign: 'center',
                lineHeight: 22,
                marginBottom: 24,
              }}
            >
              We encountered an unexpected error. Please try again or restart the app.
            </Text>

            <Button
              title="Try Again"
              onPress={this.handleRetry}
              variant="primary"
              style={{ minWidth: 120 }}
              accessibilityLabel="Try again"
            />

            {__DEV__ && this.state.error && (
              <View
                style={{
                  marginTop: 24,
                  padding: 16,
                  backgroundColor: '#f3f4f6',
                  borderRadius: 8,
                  width: '100%',
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontFamily: 'monospace',
                    color: '#374151',
                  }}
                >
                  {this.state.error.toString()}
                </Text>
              </View>
            )}
          </Card>
        </View>
      );
    }

    return this.props.children;
  }
}
