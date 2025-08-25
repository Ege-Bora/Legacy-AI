import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  Alert, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView,
  SafeAreaView,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-audio';
import { memoryService } from '../services/memoryService';

export default function NewMemoryScreen({ navigation }) {
  const [mode, setMode] = useState(null); // 'text' or 'voice'
  const [memoryText, setMemoryText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState(null);
  const [recordedAudio, setRecordedAudio] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const startRecording = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant microphone permission to record');
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
    } catch (error) {
      Alert.alert('Error', 'Failed to start recording');
      console.error('Recording error:', error);
    }
  };

  const stopRecording = async () => {
    try {
      setIsRecording(false);
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecordedAudio(uri);
      setRecording(null);
    } catch (error) {
      Alert.alert('Error', 'Failed to stop recording');
      console.error('Stop recording error:', error);
    }
  };

  const saveMemory = async () => {
    if (mode === 'text' && !memoryText.trim()) {
      Alert.alert('Empty Memory', 'Please write something before saving');
      return;
    }
    
    if (mode === 'voice' && !recordedAudio) {
      Alert.alert('No Recording', 'Please record something before saving');
      return;
    }

    try {
      setIsSaving(true);
      
      // Prepare memory data for saving
      const memoryData = {
        title: mode === 'text' 
          ? memoryText.trim().split('\n')[0].substring(0, 50) + (memoryText.trim().length > 50 ? '...' : '')
          : 'Voice Memory',
        content: mode === 'text' ? memoryText.trim() : 'Voice recording captured',
        audioPath: mode === 'voice' ? recordedAudio : null,
        category: 'general' // Default category, could be enhanced with user selection
      };

      // Save via memory service
      const savedMemory = await memoryService.saveFreeformMemory(memoryData);
      
      Alert.alert(
        '✅ Memory Saved!',
        mode === 'text' 
          ? `Your written memory has been saved: "${memoryData.title}"`
          : 'Your voice memory has been saved and is ready to view in your timeline',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to save memory. Please try again.');
      console.error('Save memory error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const resetRecording = () => {
    setRecordedAudio(null);
    setRecording(null);
  };

  // Initial mode selection
  if (!mode) {
    return (
      <Modal
        visible={true}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>New Memory</Text>
            <View style={{ width: 24 }} />
          </View>

          <View style={styles.modeSelection}>
            <Text style={styles.modeTitle}>How would you like to capture your memory?</Text>
            <Text style={styles.modeSubtitle}>
              Share whatever comes to mind - no prompts, no questions, just your thoughts.
            </Text>

            <TouchableOpacity
              style={styles.modeButton}
              onPress={() => setMode('text')}
            >
              <View style={styles.modeIcon}>
                <Ionicons name="create-outline" size={32} color="#007AFF" />
              </View>
              <Text style={styles.modeButtonTitle}>Write it down</Text>
              <Text style={styles.modeButtonDescription}>
                Type your memory, thoughts, or story
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modeButton}
              onPress={() => setMode('voice')}
            >
              <View style={styles.modeIcon}>
                <Ionicons name="mic-outline" size={32} color="#007AFF" />
              </View>
              <Text style={styles.modeButtonTitle}>Speak it out</Text>
              <Text style={styles.modeButtonDescription}>
                Record your voice sharing the memory
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    );
  }

  // Text mode
  if (mode === 'text') {
    return (
      <Modal
        visible={true}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => setMode(null)}>
              <Ionicons name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Write Your Memory</Text>
            <TouchableOpacity
              onPress={saveMemory}
              disabled={isSaving || !memoryText.trim()}
              style={[styles.saveButton, (!memoryText.trim() || isSaving) && styles.saveButtonDisabled]}
            >
              <Text style={[styles.saveButtonText, (!memoryText.trim() || isSaving) && styles.saveButtonTextDisabled]}>
                {isSaving ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            <Text style={styles.instructionText}>
              Share whatever comes to mind about this memory. There are no prompts or questions - 
              just write freely about what you want to capture.
            </Text>

            <TextInput
              style={styles.textInput}
              multiline
              placeholder="Start writing your memory here..."
              placeholderTextColor="#999"
              value={memoryText}
              onChangeText={setMemoryText}
              autoFocus
              textAlignVertical="top"
            />

            <View style={styles.textStats}>
              <Text style={styles.textStatsText}>
                {memoryText.length} characters
              </Text>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    );
  }

  // Voice mode
  return (
    <Modal
      visible={true}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setMode(null)}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Record Your Memory</Text>
          <TouchableOpacity
            onPress={saveMemory}
            disabled={isSaving || !recordedAudio}
            style={[styles.saveButton, (!recordedAudio || isSaving) && styles.saveButtonDisabled]}
          >
            <Text style={[styles.saveButtonText, (!recordedAudio || isSaving) && styles.saveButtonTextDisabled]}>
              {isSaving ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <Text style={styles.instructionText}>
            Speak freely about your memory. No questions, no interruptions - 
            just share whatever you want to capture in your own words.
          </Text>

          <View style={styles.voiceInterface}>
            {!recordedAudio ? (
              <View style={styles.recordingSection}>
                <TouchableOpacity
                  style={[styles.recordButton, isRecording && styles.recordButtonActive]}
                  onPress={isRecording ? stopRecording : startRecording}
                >
                  <Ionicons 
                    name={isRecording ? "stop" : "mic"} 
                    size={40} 
                    color="white" 
                  />
                </TouchableOpacity>

                <Text style={styles.recordingText}>
                  {isRecording 
                    ? 'Recording... Tap to stop' 
                    : 'Tap to start recording your memory'
                  }
                </Text>

                {isRecording && (
                  <View style={styles.recordingIndicator}>
                    <View style={styles.pulseDot} />
                    <Text style={styles.recordingStatus}>Recording in progress</Text>
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.playbackSection}>
                <View style={styles.recordedIndicator}>
                  <Ionicons name="checkmark-circle" size={48} color="#00A86B" />
                  <Text style={styles.recordedText}>Recording completed!</Text>
                  <Text style={styles.recordedSubtext}>
                    Your voice memory has been captured
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.rerecordButton}
                  onPress={resetRecording}
                >
                  <Ionicons name="refresh" size={20} color="#007AFF" />
                  <Text style={styles.rerecordButtonText}>Record Again</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </SafeAreaView>
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
  content: {
    flex: 1,
    padding: 20,
  },
  modeSelection: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 12,
  },
  modeSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 40,
  },
  modeButton: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 24,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5E7',
  },
  modeIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E8F4FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modeButtonTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  modeButtonDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  instructionText: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
    marginBottom: 24,
    textAlign: 'center',
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
  },
  textStatsText: {
    fontSize: 12,
    color: '#999',
  },
  voiceInterface: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingSection: {
    alignItems: 'center',
  },
  recordButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    marginBottom: 24,
  },
  recordButtonActive: {
    backgroundColor: '#FF3B30',
  },
  recordingText: {
    fontSize: 18,
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  recordingIndicator: {
    alignItems: 'center',
  },
  pulseDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF3B30',
    marginBottom: 8,
  },
  recordingStatus: {
    fontSize: 14,
    color: '#FF3B30',
    fontWeight: '500',
  },
  playbackSection: {
    alignItems: 'center',
  },
  recordedIndicator: {
    alignItems: 'center',
    marginBottom: 32,
  },
  recordedText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#00A86B',
    marginTop: 16,
    marginBottom: 8,
  },
  recordedSubtext: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  rerecordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  rerecordButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
});