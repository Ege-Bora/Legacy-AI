import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Alert, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio, AVPlaybackStatus } from 'expo-av';
import { useTheme } from '../hooks/useTheme';
import { useI18n } from '../hooks/useI18n';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import RecordButton from './RecordButton';
import { MicGate } from './permissions/MicGate';
import { useMemoStore, MemoStatus } from '../state/memos';

interface QuickMemoCardProps {
  onMemoSaved?: (transcript: string) => void;
  showFirstTimeHint?: boolean;
}

export const QuickMemoCard: React.FC<QuickMemoCardProps> = ({
  onMemoSaved,
  showFirstTimeHint: propShowHint,
}) => {
  const theme = useTheme();
  const { t } = useI18n();
  
  // Memo store state
  const { 
    currentStatus, 
    recordingDuration, 
    recordingLevel,
    pendingMemos,
    setRecordingState,
    addPendingMemo,
    showFirstTimeHint,
    dismissFirstTimeHint,
    retryFailedMemos
  } = useMemoStore();
  
  // Local state for recording
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const durationInterval = useRef<NodeJS.Timeout | null>(null);
  
  // Derived state
  const isRecording = currentStatus === 'recording';
  const isProcessing = ['uploading', 'transcribing'].includes(currentStatus);
  const failedMemos = pendingMemos.filter(memo => memo.status === 'failed');
  const hasFailedMemos = failedMemos.length > 0;

  // Check microphone permissions on mount
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Audio.requestPermissionsAsync();
        setHasPermission(status === 'granted');
        
        // Configure audio mode for recording
        if (status === 'granted') {
          await Audio.setAudioModeAsync({
            allowsRecordingIOS: true,
            playsInSilentModeIOS: true,
          });
        }
      } catch (error) {
        console.error('Permission request failed:', error);
        setHasPermission(false);
      }
    })();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (durationInterval.current) {
        clearInterval(durationInterval.current);
      }
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync();
      }
    };
  }, []);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    Alert.alert(type === 'error' ? 'Error' : 'Success', message);
  };

  const handleStartRecording = async () => {
    try {
      if (!hasPermission) {
        showToast(t('memo.permissionDenied'), 'error');
        return;
      }

      console.log('[QuickMemo] Starting recording...');
      setRecordingState('recording', 0, 0);
      
      // Create and start recording with optimized settings for Whisper
      const recordingOptions = {
        android: {
          extension: '.m4a',
          outputFormat: Audio.RECORDING_FORMAT_ANDROID_AMR_WB,
          audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_AMR_WB,
          sampleRate: 16000, // Whisper prefers 16kHz
          numberOfChannels: 1,
          bitRate: 128000,
        },
        ios: {
          extension: '.m4a',
          outputFormat: Audio.RECORDING_FORMAT_IOS_AVAudioRecordingFormatMPEG4AAC,
          audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_HIGH,
          sampleRate: 16000, // Whisper prefers 16kHz  
          numberOfChannels: 1,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {
          mimeType: 'audio/webm;codecs=opus',
          bitsPerSecond: 128000,
        },
      };
      
      let recording: Audio.Recording;
      try {
        const { recording: newRecording } = await Audio.Recording.createAsync(recordingOptions);
        recording = newRecording;
      } catch (error) {
        console.warn('[QuickMemo] Custom recording options failed, falling back to HIGH_QUALITY preset:', error);
        const { recording: fallbackRecording } = await Audio.Recording.createAsync(
          Audio.RecordingOptionsPresets.HIGH_QUALITY
        );
        recording = fallbackRecording;
      }
      
      setRecording(recording);
      recordingRef.current = recording;
      
      // Start duration tracking
      const startTime = Date.now();
      durationInterval.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setRecordingState('recording', elapsed, Math.random() * 0.5); // Mock level
      }, 100);

      // Dismiss first time hint if shown
      if (showFirstTimeHint) {
        dismissFirstTimeHint();
      }
      
    } catch (error) {
      console.error('Recording start failed:', error);
      showToast(t('memo.recordingFailed'), 'error');
      setRecordingState('idle');
    }
  };

  const handleStopRecording = async () => {
    try {
      if (!recording) return;

      console.log('[QuickMemo] Stopping recording...');
      setRecordingState('stopping');
      
      // Clear duration interval
      if (durationInterval.current) {
        clearInterval(durationInterval.current);
        durationInterval.current = null;
      }
      
      // Stop and get recording URI
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      
      setRecording(null);
      recordingRef.current = null;
      
      if (!uri) {
        throw new Error('No recording URI available');
      }

      console.log('[QuickMemo] Recording saved to:', uri);
      console.log('[QuickMemo] Recording duration:', recordingDuration, 'seconds');
      
      // Add to pending memos for processing
      addPendingMemo({
        uri,
        duration: recordingDuration,
        size: recordingDuration * 1000, // Approximate size in milliseconds
      });

      showToast(t('memo.processingStarted'));
      onMemoSaved?.('Processing audio...');
      
    } catch (error) {
      console.error('Recording stop failed:', error);
      showToast(t('memo.processingFailed'), 'error');
      setRecordingState('idle');
    }
  };

  const handleCancelRecording = async () => {
    try {
      console.log('[QuickMemo] Cancelling recording...');
      
      if (durationInterval.current) {
        clearInterval(durationInterval.current);
        durationInterval.current = null;
      }
      
      if (recording) {
        await recording.stopAndUnloadAsync();
        setRecording(null);
        recordingRef.current = null;
      }
      
      setRecordingState('idle');
      
    } catch (error) {
      console.error('Recording cancel failed:', error);
      setRecordingState('idle');
    }
  };

  const handleOpenSettings = () => {
    Linking.openSettings();
  };

  if (hasPermission === null) {
    return (
      <Card style={{ padding: theme.spacing.xl }}>
        <Text style={{ 
          textAlign: 'center', 
          color: theme.colors.textDim,
          fontSize: theme.fontSizes.md 
        }}>
          {t('memo.checkingPermissions')}
        </Text>
      </Card>
    );
  }

  if (hasPermission === false) {
    return (
      <Card style={{ padding: theme.spacing.xl }}>
        <View style={{ alignItems: 'center' }}>
          <Ionicons 
            name="mic-off" 
            size={48} 
            color={theme.colors.textDim} 
            style={{ marginBottom: theme.spacing.lg }}
          />
          <Text style={{
            fontSize: theme.fontSizes.lg,
            fontWeight: theme.fontWeights.semibold,
            color: theme.colors.text,
            textAlign: 'center',
            marginBottom: theme.spacing.md,
          }}>
            {t('memo.microphoneRequired')}
          </Text>
          <Text style={{
            fontSize: theme.fontSizes.md,
            color: theme.colors.textDim,
            textAlign: 'center',
            marginBottom: theme.spacing.xl,
            lineHeight: theme.fontSizes.md * 1.4,
          }}>
            {t('memo.microphoneDescription')}
          </Text>
          <Button
            title={t('memo.openSettings')}
            onPress={handleOpenSettings}
            variant="primary"
          />
        </View>
      </Card>
    );
  }

  return (
    <MicGate>
      <View>
        <Card style={{ padding: theme.spacing.xl }}>
          <Text
            style={{
              fontSize: theme.fontSizes.lg,
              fontWeight: theme.fontWeights.semibold,
              color: theme.colors.text,
              textAlign: 'center',
              marginBottom: theme.spacing.md,
            }}
          >
            {t('memo.quickCapture')}
          </Text>

          <Text
            style={{
              fontSize: theme.fontSizes.md,
              color: theme.colors.textDim,
              textAlign: 'center',
              marginBottom: theme.spacing.xl,
              lineHeight: theme.fontSizes.md * 1.4,
            }}
          >
            {t('memo.captureDescription')}
          </Text>

          <RecordButton
            onStartRecording={handleStartRecording}
            onStopRecording={handleStopRecording}
            onCancelRecording={handleCancelRecording}
            disabled={!hasPermission || isProcessing}
            size={160}
          />

          {/* Recording duration */}
          {isRecording && (
            <Text
              style={{
                fontSize: theme.fontSizes.lg,
                color: theme.colors.primary,
                textAlign: 'center',
                marginTop: theme.spacing.lg,
                fontWeight: theme.fontWeights.semibold,
                fontFamily: 'monospace',
              }}
            >
              {Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, '0')}
            </Text>
          )}

          {/* Status message */}
          {isProcessing && (
            <Text
              style={{
                fontSize: theme.fontSizes.sm,
                color: theme.colors.primary,
                textAlign: 'center',
                marginTop: theme.spacing.lg,
                fontWeight: theme.fontWeights.medium,
              }}
            >
              {currentStatus === 'uploading' && t('memo.uploading')}
              {currentStatus === 'transcribing' && t('memo.transcribing')}
            </Text>
          )}

          {/* First time hint */}
          {showFirstTimeHint && (
            <Text
              style={{
                fontSize: theme.fontSizes.sm,
                color: theme.colors.textDim,
                textAlign: 'center',
                marginTop: theme.spacing.lg,
                fontStyle: 'italic',
              }}
            >
              {t('memo.firstTimeHint')}
            </Text>
          )}
        </Card>

        {/* Failed memos retry */}
        {hasFailedMemos && (
          <Card style={{ 
            marginTop: theme.spacing.md,
            backgroundColor: `${theme.colors.error}10`,
            borderColor: theme.colors.error,
            borderWidth: 1,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="warning" size={20} color={theme.colors.error} />
              <View style={{ marginLeft: theme.spacing.sm, flex: 1 }}>
                <Text style={{
                  fontSize: theme.fontSizes.sm,
                  fontWeight: theme.fontWeights.medium,
                  color: theme.colors.text,
                  marginBottom: theme.spacing.xs,
                }}>
                  {failedMemos.length} memo(s) failed to process
                </Text>
                <Button
                  title="Retry Failed Memos"
                  onPress={() => {
                    retryFailedMemos();
                    showToast('Retrying failed memos...');
                  }}
                  variant="secondary"
                  size="sm"
                />
              </View>
            </View>
          </Card>
        )}
      </View>
    </MicGate>
  );
};
