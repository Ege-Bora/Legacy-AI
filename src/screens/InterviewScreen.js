import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  Alert, 
  ActivityIndicator, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView,
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-audio';
import { interviewService } from '../services/interviewService';

export default function InterviewScreen({ route, navigation }) {
  const session = route?.params?.session;
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [response, setResponse] = useState('');
  const [isVoiceMode, setIsVoiceMode] = useState(session?.mode === 'spoken' ? 1 : 0);
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState(null);
  const [answers, setAnswers] = useState({});

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    try {
      setIsLoading(true);
      
      // If no session, create a mock session
      const sessionId = session?.id || 'mock-session-' + Date.now();
      
      const result = await interviewService.generateQuestions(sessionId);
      if (result.questions) {
        setQuestions(result.questions);
      } else {
        // Fallback to default questions
        setQuestions([
          "Tell me about your childhood and where you grew up.",
          "What are your most cherished memories with family?",
          "What life lessons would you want to pass down?",
          "Describe a moment that changed your perspective on life.",
          "What traditions did your family have when you were growing up?"
        ]);
      }
    } catch (error) {
      console.error('Failed to load questions:', error);
      // Fallback to default questions on error
      setQuestions([
        "Tell me about your childhood and where you grew up.",
        "What are your most cherished memories with family?",
        "What life lessons would you want to pass down?"
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const saveResponse = async () => {
    if (!response.trim()) {
      Alert.alert('Empty Response', 'Please provide a response before continuing.');
      return;
    }

    try {
      setIsLoading(true);
      const currentQuestion = questions[currentQuestionIndex];
      
      const answerData = {
        question: currentQuestion,
        answerText: response,
        source: isVoiceMode === 1 ? 'voice' : 'text',
        sequenceNumber: currentQuestionIndex + 1
      };
      
      const sessionId = session?.id || 'mock-session-' + Date.now();
      await interviewService.addAnswer(sessionId, answerData);
      
      // Save answer locally
      setAnswers(prev => ({...prev, [currentQuestionIndex]: answerData}));
      
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
        setResponse('');
      } else {
        completeInterview();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save response');
    } finally {
      setIsLoading(false);
    }
  };

  const completeInterview = async () => {
    Alert.alert(
      'Interview Completed!',
      'Thank you for sharing your memories. Your responses have been saved.',
      [
        {
          text: 'Go Home',
          onPress: () => navigation.navigate('Home')
        }
      ]
    );
  };

  const startRecording = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant microphone permission');
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
    }
  };

  const stopRecording = async () => {
    try {
      setIsRecording(false);
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      
      // For now, just set a placeholder response
      setResponse('[Voice recording completed - would be transcribed in production]');
      setRecording(null);
    } catch (error) {
      Alert.alert('Error', 'Failed to stop recording');
    }
  };

  if (isLoading && questions.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading questions...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (questions.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No questions available</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadQuestions}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Life Interview</Text>
        <Text style={styles.progressText}>
          {currentQuestionIndex + 1}/{questions.length}
        </Text>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { width: `${progress}%` }]} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Question */}
        <View style={styles.questionContainer}>
          <Text style={styles.questionText}>{currentQuestion}</Text>
          <Text style={styles.questionSubtext}>
            Take your time to think about this. You can respond with voice or text.
          </Text>
        </View>

        {/* Mode Toggle */}
        <View style={styles.modeToggle}>
          <TouchableOpacity
            style={[styles.modeButton, isVoiceMode === 0 && styles.modeButtonActive]}
            onPress={() => setIsVoiceMode(0)}
          >
            <Text style={[styles.modeButtonText, isVoiceMode === 0 && styles.modeButtonTextActive]}>
              Text
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeButton, isVoiceMode === 1 && styles.modeButtonActive]}
            onPress={() => setIsVoiceMode(1)}
          >
            <Text style={[styles.modeButtonText, isVoiceMode === 1 && styles.modeButtonTextActive]}>
              Voice
            </Text>
          </TouchableOpacity>
        </View>

        {/* Response Input */}
        <View style={styles.responseContainer}>
          {isVoiceMode === 1 ? (
            <View style={styles.voiceContainer}>
              <TouchableOpacity
                style={[styles.recordButton, isRecording && styles.recordButtonActive]}
                onPress={isRecording ? stopRecording : startRecording}
              >
                <Ionicons 
                  name={isRecording ? "stop" : "mic"} 
                  size={32} 
                  color="white" 
                />
              </TouchableOpacity>
              <Text style={styles.recordingText}>
                {isRecording ? 'Recording... Tap to stop' : 'Tap to start recording'}
              </Text>
            </View>
          ) : (
            <TextInput
              value={response}
              onChangeText={setResponse}
              placeholder="Share your thoughts and memories..."
              placeholderTextColor="#999"
              multiline
              style={styles.textInput}
              textAlignVertical="top"
            />
          )}
        </View>

        {/* Response Preview */}
        {response ? (
          <View style={styles.responsePreview}>
            <Text style={styles.responsePreviewLabel}>Your Response:</Text>
            <Text style={styles.responsePreviewText}>{response}</Text>
          </View>
        ) : null}
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.secondaryButtonText}>Discard</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.button, 
            styles.primaryButton,
            (!response.trim() || isLoading) && styles.buttonDisabled
          ]}
          onPress={saveResponse}
          disabled={!response.trim() || isLoading}
        >
          <Text style={styles.primaryButtonText}>
            {isLoading ? 'Saving...' : 
             currentQuestionIndex === questions.length - 1 ? 'Finish Interview' : 'Next Question'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
  progressText: {
    fontSize: 14,
    color: '#666',
  },
  progressContainer: {
    height: 4,
    backgroundColor: '#E5E5E7',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 2,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  questionContainer: {
    backgroundColor: '#F2F2F7',
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
  },
  questionText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1D1D1F',
    marginBottom: 8,
    lineHeight: 26,
  },
  questionSubtext: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    padding: 2,
    marginBottom: 24,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 6,
  },
  modeButtonActive: {
    backgroundColor: '#fff',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  modeButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  modeButtonTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  responseContainer: {
    marginBottom: 24,
  },
  voiceContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  recordButtonActive: {
    backgroundColor: '#FF3B30',
  },
  recordingText: {
    marginTop: 20,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E5E5E7',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 150,
    color: '#333',
  },
  responsePreview: {
    backgroundColor: '#E8F4FF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderColor: '#B3D9FF',
    borderWidth: 1,
  },
  responsePreviewLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 8,
  },
  responsePreviewText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  bottomActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E7',
    gap: 12,
  },
  button: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    borderWidth: 1,
    borderColor: '#E5E5E7',
  },
  primaryButton: {
    flex: 2,
    backgroundColor: '#007AFF',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
