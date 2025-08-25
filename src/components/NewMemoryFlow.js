import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Modal,
  TextInput,
  Alert,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-audio';
import { timelineStore } from '../store/timelineStore';

export default function NewMemoryFlow({ visible, onClose, t, onMemoryAdded }) {
  // Flow State
  const [currentStep, setCurrentStep] = useState('choice'); // 'choice', 'write', 'speak'
  
  // Text Memory State
  const [textContent, setTextContent] = useState('');
  const [memoryTitle, setMemoryTitle] = useState('');
  const [isSavingText, setIsSavingText] = useState(false);

  // Voice Memory State
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recording, setRecording] = useState(null);
  const [recordedSegments, setRecordedSegments] = useState([]);
  const [totalDuration, setTotalDuration] = useState(0);
  const [currentSegmentDuration, setCurrentSegmentDuration] = useState(0);
  const [showVoicePreview, setShowVoicePreview] = useState(false);
  
  // Shared State
  const [addToBook, setAddToBook] = useState(false);
  
  const timerRef = useRef(null);

  const resetState = () => {
    setCurrentStep('choice');
    setTextContent('');
    setMemoryTitle('');
    setRecordedSegments([]);
    setTotalDuration(0);
    setCurrentSegmentDuration(0);
    setAddToBook(false);
    setIsSavingText(false);
    setIsRecording(false);
    setIsPaused(false);
    setShowVoicePreview(false);
    
    if (recording) {
      recording.stopAndUnloadAsync();
      setRecording(null);
    }
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleClose = () => {
    if (textContent.trim() || recordedSegments.length > 0) {
      Alert.alert(
        'Discard Changes?',
        'You have unsaved content. Are you sure you want to close?',
        [
          { text: t('cancel'), style: 'cancel' },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => {
              resetState();
              onClose();
            }
          }
        ]
      );
    } else {
      resetState();
      onClose();
    }
  };

  const handleModeChoice = (mode) => {
    setCurrentStep(mode);
  };

  const goBack = () => {
    if (currentStep === 'choice') {
      handleClose();
    } else {
      setCurrentStep('choice');
    }
  };

  // Text Memory Functions
  const saveTextMemory = async () => {
    if (!textContent.trim()) {
      Alert.alert(t('error'), 'Please write something before saving');
      return;
    }

    try {
      setIsSavingText(true);
      
      const title = memoryTitle.trim() || textContent.trim().split('\n')[0].substring(0, 50) + 
                   (textContent.trim().length > 50 ? '...' : '');

      const item = await timelineStore.addPendingItem({
        type: 'text',
        title: title,
        content: textContent.trim(),
        source: 'new_memory',
        addToBook: addToBook
      });

      Alert.alert(
        '✅ ' + t('memory_saved'),
        addToBook ? t('text_memory_saved_with_book') : t('text_memory_saved_success')
      );

      if (onMemoryAdded) onMemoryAdded(item);
      
      resetState();
      onClose();
      
    } catch (error) {
      Alert.alert(t('error'), t('save_failed'));
      console.error('Save text error:', error);
    } finally {
      setIsSavingText(false);
    }
  };

  // Voice Memory Functions
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
      setIsPaused(false);
      setCurrentSegmentDuration(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setCurrentSegmentDuration(prev => prev + 1);
        setTotalDuration(prev => prev + 1);
      }, 1000);
      
    } catch (error) {
      Alert.alert(t('error'), t('recording_failed'));
      console.error('Recording error:', error);
    }
  };

  const pauseRecording = async () => {
    try {
      if (recording && isRecording) {
        await recording.pauseAsync();
        setIsPaused(true);
        setIsRecording(false);
        
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }

        // Add current segment
        const segmentInfo = {
          id: Date.now(),
          duration: currentSegmentDuration,
          recording: recording
        };
        setRecordedSegments(prev => [...prev, segmentInfo]);
      }
    } catch (error) {
      console.error('Pause error:', error);
    }
  };

  const resumeRecording = async () => {
    try {
      if (recording && isPaused) {
        await recording.startAsync();
        setIsRecording(true);
        setIsPaused(false);
        setCurrentSegmentDuration(0);

        // Resume timer
        timerRef.current = setInterval(() => {
          setCurrentSegmentDuration(prev => prev + 1);
          setTotalDuration(prev => prev + 1);
        }, 1000);
      }
    } catch (error) {
      console.error('Resume error:', error);
    }
  };

  const stopRecording = async () => {
    try {
      if (recording) {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }

        await recording.stopAndUnloadAsync();
        
        // Add final segment
        const finalSegment = {
          id: Date.now(),
          duration: currentSegmentDuration,
          uri: recording.getURI(),
          recording: recording
        };
        
        setRecordedSegments(prev => [...prev, finalSegment]);
        setRecording(null);
        setIsRecording(false);
        setIsPaused(false);
        setShowVoicePreview(true);
      }
    } catch (error) {
      Alert.alert(t('error'), t('recording_stop_failed'));
      console.error('Stop recording error:', error);
    }
  };

  const discardRecording = () => {
    Alert.alert(
      'Discard Recording?',
      'Are you sure you want to discard this recording?',
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => {
            if (recording) {
              recording.stopAndUnloadAsync();
              setRecording(null);
            }
            
            if (timerRef.current) {
              clearInterval(timerRef.current);
              timerRef.current = null;
            }
            
            setRecordedSegments([]);
            setTotalDuration(0);
            setCurrentSegmentDuration(0);
            setIsRecording(false);
            setIsPaused(false);
            setShowVoicePreview(false);
          }
        }
      ]
    );
  };

  const saveVoiceMemory = async () => {
    if (recordedSegments.length === 0) {
      Alert.alert(t('error'), 'No recording found');
      return;
    }

    try {
      // Use the last segment's URI (complete recording)
      const finalSegment = recordedSegments[recordedSegments.length - 1];
      const audioUri = finalSegment.uri || finalSegment.recording?.getURI();

      if (!audioUri) {
        Alert.alert(t('error'), 'Recording file not found');
        return;
      }

      const title = memoryTitle.trim() || t('voice_memory');

      const item = await timelineStore.addPendingItem({
        type: 'voice',
        title: title,
        audioPath: audioUri,
        duration: totalDuration,
        source: 'new_memory',
        addToBook: addToBook
      });

      Alert.alert(
        '✅ ' + t('memory_saved'),
        addToBook ? t('voice_memory_saved_with_book') : t('voice_memory_saved')
      );

      if (onMemoryAdded) onMemoryAdded(item);
      
      resetState();
      onClose();
      
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

  const renderChoiceStep = () => (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleClose}>
          <Ionicons name="close" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('new_memory')}</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.choiceContent}>
        <Text style={styles.choiceTitle}>{t('how_to_capture')}</Text>
        <Text style={styles.choiceSubtitle}>{t('capture_subtitle')}</Text>

        <TouchableOpacity
          style={styles.choiceButton}
          onPress={() => handleModeChoice('write')}
        >
          <View style={styles.choiceIcon}>
            <Ionicons name="create-outline" size={32} color="#007AFF" />
          </View>
          <Text style={styles.choiceButtonTitle}>{t('write_it_down')}</Text>
          <Text style={styles.choiceButtonDescription}>
            {t('write_description')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.choiceButton}
          onPress={() => handleModeChoice('speak')}
        >
          <View style={styles.choiceIcon}>
            <Ionicons name="mic-outline" size={32} color="#007AFF" />
          </View>
          <Text style={styles.choiceButtonTitle}>{t('speak_it_out')}</Text>
          <Text style={styles.choiceButtonDescription}>
            {t('speak_description')}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );

  const renderWriteStep = () => (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Write Your Memory</Text>
        <TouchableOpacity
          onPress={saveTextMemory}
          disabled={!textContent.trim() || isSavingText}
          style={[styles.saveHeaderButton, (!textContent.trim() || isSavingText) && styles.saveHeaderButtonDisabled]}
        >
          {isSavingText ? (
            <ActivityIndicator color="#007AFF" size="small" />
          ) : (
            <Text style={[styles.saveHeaderButtonText, (!textContent.trim() || isSavingText) && styles.saveHeaderButtonTextDisabled]}>
              {t('save')}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.instructionText}>
          Share whatever comes to mind about this memory. There are no prompts or questions - just write freely about what you want to capture.
        </Text>

        <TextInput
          style={styles.titleInput}
          placeholder="Memory title (optional)"
          placeholderTextColor="#999"
          value={memoryTitle}
          onChangeText={setMemoryTitle}
        />

        <TextInput
          style={styles.textInput}
          multiline
          placeholder="Start writing your memory here..."
          placeholderTextColor="#999"
          value={textContent}
          onChangeText={setTextContent}
          autoFocus
          textAlignVertical="top"
        />

        <View style={styles.textStats}>
          <Text style={styles.textStatsText}>
            {textContent.length} characters
          </Text>
        </View>

        <View style={styles.optionsSection}>
          <TouchableOpacity
            style={styles.bookToggleButton}
            onPress={() => setAddToBook(!addToBook)}
          >
            <Ionicons 
              name={addToBook ? "checkmark-circle" : "ellipse-outline"} 
              size={20} 
              color={addToBook ? "#00A86B" : "#999"} 
            />
            <Text style={styles.bookToggleText}>
              {t('add_to_book')}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );

  const renderSpeakStep = () => {
    if (showVoicePreview) {
      return renderVoicePreview();
    }

    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={goBack}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Record Your Memory</Text>
          <TouchableOpacity onPress={discardRecording}>
            <Ionicons name="trash-outline" size={20} color="#EF4444" />
          </TouchableOpacity>
        </View>

        <View style={styles.voiceContent}>
          <Text style={styles.instructionText}>
            Speak freely about your memory. You can pause and resume anytime. No questions, no interruptions - just share whatever you want to capture in your own words.
          </Text>

          <View style={styles.recordingInterface}>
            <View style={styles.durationDisplay}>
              <Text style={styles.currentDuration}>
                {formatDuration(currentSegmentDuration)}
              </Text>
              {totalDuration > currentSegmentDuration && (
                <Text style={styles.totalDuration}>
                  Total: {formatDuration(totalDuration)}
                </Text>
              )}
            </View>

            <View style={styles.recordingControls}>
              {!isRecording && !isPaused && recordedSegments.length === 0 && (
                <TouchableOpacity
                  style={styles.startButton}
                  onPress={startRecording}
                >
                  <Ionicons name="mic" size={32} color="white" />
                </TouchableOpacity>
              )}

              {isRecording && (
                <View style={styles.activeControls}>
                  <TouchableOpacity
                    style={styles.pauseButton}
                    onPress={pauseRecording}
                  >
                    <Ionicons name="pause" size={24} color="white" />
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.stopButton}
                    onPress={stopRecording}
                  >
                    <Ionicons name="stop" size={24} color="white" />
                  </TouchableOpacity>
                </View>
              )}

              {isPaused && (
                <View style={styles.pausedControls}>
                  <TouchableOpacity
                    style={styles.resumeButton}
                    onPress={resumeRecording}
                  >
                    <Ionicons name="play" size={24} color="white" />
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.stopButton}
                    onPress={stopRecording}
                  >
                    <Ionicons name="stop" size={24} color="white" />
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {isRecording && (
              <View style={styles.recordingIndicator}>
                <View style={styles.pulseDot} />
                <Text style={styles.recordingStatus}>Recording...</Text>
              </View>
            )}

            {isPaused && (
              <Text style={styles.pausedStatus}>Recording paused</Text>
            )}
          </View>
        </View>
      </SafeAreaView>
    );
  };

  const renderVoicePreview = () => (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setShowVoicePreview(false)}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Preview Recording</Text>
        <TouchableOpacity onPress={saveVoiceMemory} style={styles.saveHeaderButton}>
          <Text style={styles.saveHeaderButtonText}>{t('save')}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.previewContent}>
        <View style={styles.previewInfo}>
          <Ionicons name="checkmark-circle" size={48} color="#00A86B" />
          <Text style={styles.previewDuration}>
            {formatDuration(totalDuration)}
          </Text>
          <Text style={styles.previewText}>
            Recording completed successfully
          </Text>
        </View>

        <TextInput
          style={styles.titleInput}
          placeholder="Memory title (optional)"
          placeholderTextColor="#999"
          value={memoryTitle}
          onChangeText={setMemoryTitle}
        />

        <View style={styles.optionsSection}>
          <TouchableOpacity
            style={styles.bookToggleButton}
            onPress={() => setAddToBook(!addToBook)}
          >
            <Ionicons 
              name={addToBook ? "checkmark-circle" : "ellipse-outline"} 
              size={20} 
              color={addToBook ? "#00A86B" : "#999"} 
            />
            <Text style={styles.bookToggleText}>
              {t('add_to_book')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      {currentStep === 'choice' && renderChoiceStep()}
      {currentStep === 'write' && renderWriteStep()}
      {currentStep === 'speak' && renderSpeakStep()}
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E7',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  saveHeaderButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#007AFF',
  },
  saveHeaderButtonDisabled: {
    backgroundColor: '#E5E5E7',
  },
  saveHeaderButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  saveHeaderButtonTextDisabled: {
    color: '#999',
  },
  choiceContent: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  choiceTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 12,
  },
  choiceSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 40,
  },
  choiceButton: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 24,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5E7',
  },
  choiceIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E8F4FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  choiceButtonTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  choiceButtonDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  instructionText: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
    marginBottom: 24,
    textAlign: 'center',
  },
  titleInput: {
    borderWidth: 1,
    borderColor: '#E5E5E7',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    color: '#333',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E5E5E7',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 300,
    color: '#333',
  },
  textStats: {
    alignItems: 'flex-end',
    marginTop: 8,
    marginBottom: 20,
  },
  textStatsText: {
    fontSize: 12,
    color: '#999',
  },
  voiceContent: {
    flex: 1,
    padding: 20,
  },
  recordingInterface: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  durationDisplay: {
    alignItems: 'center',
    marginBottom: 40,
  },
  currentDuration: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
  },
  totalDuration: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  recordingControls: {
    alignItems: 'center',
    marginBottom: 40,
  },
  startButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeControls: {
    flexDirection: 'row',
    gap: 20,
  },
  pausedControls: {
    flexDirection: 'row',
    gap: 20,
  },
  pauseButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stopButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resumeButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#00A86B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingIndicator: {
    alignItems: 'center',
  },
  pulseDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#EF4444',
    marginBottom: 8,
  },
  recordingStatus: {
    fontSize: 16,
    color: '#EF4444',
    fontWeight: '500',
  },
  pausedStatus: {
    fontSize: 16,
    color: '#F59E0B',
    fontWeight: '500',
  },
  previewContent: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  previewInfo: {
    alignItems: 'center',
    marginBottom: 40,
  },
  previewDuration: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  previewText: {
    fontSize: 16,
    color: '#00A86B',
  },
  optionsSection: {
    marginTop: 20,
  },
  bookToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 8,
  },
  bookToggleText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
});