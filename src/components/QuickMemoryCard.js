import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  PanResponder,
  Animated,
  Modal,
  TextInput,
  Alert,
  StyleSheet,
  Vibration,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-audio';
import { timelineStore } from '../store/timelineStore';

const { width } = Dimensions.get('window');
const DRAG_THRESHOLD = 50;

export default function QuickMemoryCard({ t, onMemoryAdded }) {
  // Text Modal State
  const [showTextModal, setShowTextModal] = useState(false);
  const [textContent, setTextContent] = useState('');
  const [isSavingText, setIsSavingText] = useState(false);

  // Voice Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [showVoicePreview, setShowVoicePreview] = useState(false);
  const [recording, setRecording] = useState(null);
  const [recordedAudio, setRecordedAudio] = useState(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [addToBook, setAddToBook] = useState(false);

  // Animation State
  const scale = useRef(new Animated.Value(1)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const dragStartY = useRef(0);
  const isDragging = useRef(false);
  const recordingTimer = useRef(null);

  // PanResponder for hold/drag gesture
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_, gesture) => {
      return Math.abs(gesture.dy) > 10;
    },

    onPanResponderGrant: (_, gesture) => {
      dragStartY.current = gesture.y0;
      startHoldTimer();
      
      // Scale down animation
      Animated.spring(scale, {
        toValue: 0.95,
        useNativeDriver: true,
      }).start();
    },

    onPanResponderMove: (_, gesture) => {
      const dragDistance = dragStartY.current - gesture.moveY;
      
      if (dragDistance > DRAG_THRESHOLD) {
        isDragging.current = true;
        translateY.setValue(-dragDistance + DRAG_THRESHOLD);
        
        if (isRecording && dragDistance > 100) {
          // Show cancel state
          Vibration.vibrate(50);
        }
      }
    },

    onPanResponderRelease: (_, gesture) => {
      const dragDistance = dragStartY.current - gesture.moveY;
      clearHoldTimer();
      
      // Reset animations
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, useNativeDriver: true }),
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true })
      ]).start();

      if (isRecording) {
        if (isDragging.current && dragDistance > 100) {
          // Cancel recording
          cancelRecording();
        } else {
          // Stop recording
          stopRecording();
        }
      } else if (!isDragging.current) {
        // Simple tap - show text modal
        setShowTextModal(true);
      }

      isDragging.current = false;
    },

    onPanResponderTerminate: () => {
      clearHoldTimer();
      isDragging.current = false;
      
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, useNativeDriver: true }),
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true })
      ]).start();
    }
  });

  const startHoldTimer = () => {
    recordingTimer.current = setTimeout(() => {
      if (!isDragging.current) {
        startRecording();
      }
    }, 500); // 500ms hold to start recording
  };

  const clearHoldTimer = () => {
    if (recordingTimer.current) {
      clearTimeout(recordingTimer.current);
      recordingTimer.current = null;
    }
  };

  const startRecording = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('permission_denied'), t('microphone_permission_required'));
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(newRecording);
      setIsRecording(true);
      setRecordingDuration(0);
      Vibration.vibrate(100); // Haptic feedback

      // Start duration timer
      const timer = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

      recordingTimer.current = timer;
      
    } catch (error) {
      Alert.alert(t('error'), t('recording_failed'));
      console.error('Recording error:', error);
    }
  };

  const stopRecording = async () => {
    try {
      if (!recording) return;

      clearInterval(recordingTimer.current);
      setIsRecording(false);
      
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      
      setRecordedAudio({ uri, duration: recordingDuration });
      setRecording(null);
      setShowVoicePreview(true);
      
      Vibration.vibrate(50); // Success haptic
      
    } catch (error) {
      Alert.alert(t('error'), t('recording_stop_failed'));
      console.error('Stop recording error:', error);
    }
  };

  const cancelRecording = async () => {
    try {
      if (recording) {
        clearInterval(recordingTimer.current);
        setIsRecording(false);
        await recording.stopAndUnloadAsync();
        setRecording(null);
      }
      setRecordingDuration(0);
      Vibration.vibrate([50, 50]); // Cancel haptic pattern
      
    } catch (error) {
      console.error('Cancel recording error:', error);
    }
  };

  const saveTextMemory = async () => {
    if (!textContent.trim()) return;

    try {
      setIsSavingText(true);
      
      const item = await timelineStore.addPendingItem({
        type: 'text',
        content: textContent.trim(),
        source: 'quick_memory',
        addToBook: false
      });

      setShowTextModal(false);
      setTextContent('');
      
      if (onMemoryAdded) onMemoryAdded(item);
      
      // Show success feedback
      Alert.alert(t('memory_saved'), t('text_memory_saved_success'));
      
    } catch (error) {
      Alert.alert(t('error'), t('save_failed'));
      console.error('Save text error:', error);
    } finally {
      setIsSavingText(false);
    }
  };

  const saveVoiceMemory = async () => {
    if (!recordedAudio) return;

    try {
      const item = await timelineStore.addPendingItem({
        type: 'voice',
        title: t('voice_memory'),
        audioPath: recordedAudio.uri,
        duration: recordedAudio.duration,
        source: 'quick_memory',
        addToBook: addToBook
      });

      setShowVoicePreview(false);
      setRecordedAudio(null);
      setRecordingDuration(0);
      setAddToBook(false);
      
      if (onMemoryAdded) onMemoryAdded(item);
      
      // Show success feedback
      Alert.alert(
        t('memory_saved'),
        addToBook ? t('voice_memory_saved_with_book') : t('voice_memory_saved')
      );
      
    } catch (error) {
      Alert.alert(t('error'), t('save_failed'));
      console.error('Save voice error:', error);
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const discardRecording = () => {
    setShowVoicePreview(false);
    setRecordedAudio(null);
    setRecordingDuration(0);
    setAddToBook(false);
  };

  return (
    <>
      {/* Main Quick Memory Card */}
      <View style={styles.container}>
        <Text style={styles.title}>{t('quick_memory')}</Text>
        <Text style={styles.description}>
          {t('quick_memory_description')}
        </Text>
        
        <Animated.View
          style={[
            styles.micButtonContainer,
            {
              transform: [
                { scale },
                { translateY }
              ]
            }
          ]}
          {...panResponder.panHandlers}
        >
          <TouchableOpacity
            style={[
              styles.micButton,
              isRecording && styles.micButtonRecording
            ]}
            activeOpacity={0.8}
          >
            <Ionicons 
              name={isRecording ? "stop" : "mic"} 
              size={32} 
              color="white" 
            />
          </TouchableOpacity>
        </Animated.View>

        {isRecording && (
          <View style={styles.recordingIndicator}>
            <View style={styles.recordingDot} />
            <Text style={styles.recordingText}>
              {formatDuration(recordingDuration)}
            </Text>
            <Text style={styles.recordingHint}>
              {t('drag_up_to_cancel')}
            </Text>
          </View>
        )}
      </View>

      {/* Text Memory Modal */}
      <Modal
        visible={showTextModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowTextModal(false)}>
              <Text style={styles.cancelButton}>{t('cancel')}</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{t('quick_text_memory')}</Text>
            <TouchableOpacity
              onPress={saveTextMemory}
              disabled={!textContent.trim() || isSavingText}
              style={[styles.saveButton, (!textContent.trim() || isSavingText) && styles.saveButtonDisabled]}
            >
              <Text style={[styles.saveButtonText, (!textContent.trim() || isSavingText) && styles.saveButtonTextDisabled]}>
                {isSavingText ? t('saving') : t('save')}
              </Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.textInput}
            placeholder={t('text_memory_placeholder')}
            placeholderTextColor="#999"
            value={textContent}
            onChangeText={setTextContent}
            multiline
            autoFocus
            textAlignVertical="top"
          />
        </View>
      </Modal>

      {/* Voice Preview Modal */}
      <Modal
        visible={showVoicePreview}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={discardRecording}>
              <Text style={styles.cancelButton}>{t('discard')}</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{t('voice_memory')}</Text>
            <TouchableOpacity onPress={saveVoiceMemory} style={styles.saveButton}>
              <Text style={styles.saveButtonText}>{t('save')}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.voicePreviewContent}>
            <View style={styles.audioPreview}>
              <Ionicons name="mic" size={48} color="#007AFF" />
              <Text style={styles.audioDuration}>
                {formatDuration(recordedAudio?.duration || 0)}
              </Text>
              <Text style={styles.audioDescription}>
                {t('voice_recording_captured')}
              </Text>
            </View>

            <View style={styles.bookToggle}>
              <TouchableOpacity
                style={styles.bookToggleButton}
                onPress={() => setAddToBook(!addToBook)}
              >
                <Ionicons 
                  name={addToBook ? "checkmark-circle" : "ellipse-outline"} 
                  size={24} 
                  color={addToBook ? "#00A86B" : "#999"} 
                />
                <Text style={styles.bookToggleText}>
                  {t('add_to_book')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  micButtonContainer: {
    marginBottom: 16,
  },
  micButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  micButtonRecording: {
    backgroundColor: '#EF4444',
  },
  recordingIndicator: {
    alignItems: 'center',
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    marginBottom: 8,
  },
  recordingText: {
    color: '#EF4444',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  recordingHint: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E7',
  },
  cancelButton: {
    fontSize: 16,
    color: '#EF4444',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#007AFF',
  },
  saveButtonDisabled: {
    backgroundColor: '#E5E5E7',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonTextDisabled: {
    color: '#999',
  },
  textInput: {
    flex: 1,
    padding: 20,
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
  },
  voicePreviewContent: {
    flex: 1,
    padding: 20,
  },
  audioPreview: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 40,
  },
  audioDuration: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  audioDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  bookToggle: {
    marginTop: 40,
  },
  bookToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
  },
  bookToggleText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
});