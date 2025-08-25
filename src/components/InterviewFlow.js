import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  TextInput,
  ScrollView,
  Modal,
  ActivityIndicator,
  Animated
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-audio';
import { timelineStore } from '../store/timelineStore';
import { interviewService } from '../services/interviewService';

export default function InterviewFlow({ session, onComplete, onClose, t }) {
  // Interview State
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(true);
  
  // Answer State
  const [answerMode, setAnswerMode] = useState(null); // 'text' or 'voice'
  const [textAnswer, setTextAnswer] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState(null);
  const [recordedAudio, setRecordedAudio] = useState(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isSavingAnswer, setIsSavingAnswer] = useState(false);

  // Animation
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    loadQuestions();
  }, []);

  useEffect(() => {
    // Animate question in
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      })
    ]).start();
  }, [currentQuestionIndex]);

  const loadQuestions = async () => {
    try {
      setIsLoadingQuestions(true);
      
      // Generate questions using the real API
      const result = await interviewService.generateQuestions(session.id);
      
      if (result.questions && result.questions.length > 0) {
        // Convert question strings to objects with ID
        const questionObjects = result.questions.map((questionText, index) => ({
          id: index + 1,
          text: questionText,
          category: "interview"
        }));
        
        setQuestions(questionObjects);
      } else {
        throw new Error('No questions received from API');
      }
      
      setIsLoadingQuestions(false);
      
    } catch (error) {
      console.error('Failed to load questions:', error);
      Alert.alert(t('error'), 'Failed to load interview questions');
      setIsLoadingQuestions(false);
    }
  };

  const getCurrentQuestion = () => {
    return questions[currentQuestionIndex];
  };

  const getProgress = () => {
    if (questions.length === 0) return 0;
    return Math.round(((currentQuestionIndex + 1) / questions.length) * 100);
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

      // Start timer
      const timer = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

      newRecording._timer = timer;
      
    } catch (error) {
      Alert.alert(t('error'), t('recording_failed'));
      console.error('Recording error:', error);
    }
  };

  const stopRecording = async () => {
    try {
      if (!recording) return;

      clearInterval(recording._timer);
      setIsRecording(false);
      
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      
      setRecordedAudio({ uri, duration: recordingDuration });
      setRecording(null);
      
    } catch (error) {
      Alert.alert(t('error'), t('recording_stop_failed'));
      console.error('Stop recording error:', error);
    }
  };

  const resetRecording = () => {
    setRecordedAudio(null);
    setRecordingDuration(0);
  };

  const saveAnswer = async () => {
    const question = getCurrentQuestion();
    const hasTextAnswer = textAnswer.trim();
    const hasVoiceAnswer = recordedAudio;

    if (!hasTextAnswer && !hasVoiceAnswer) {
      Alert.alert(t('error'), 'Please provide an answer before continuing');
      return;
    }

    try {
      setIsSavingAnswer(true);

      // Create answer object
      const answer = {
        questionId: question.id,
        questionText: question.text,
        sessionId: session.id,
        answerType: answerMode,
        textAnswer: hasTextAnswer ? textAnswer.trim() : null,
        voiceAnswer: hasVoiceAnswer ? recordedAudio : null,
        timestamp: new Date().toISOString()
      };

      // Add to timeline as interview answer
      const timelineItem = await timelineStore.addPendingItem({
        type: 'interview_answer',
        sessionId: session.id,
        questionId: question.id,
        questionText: question.text,
        content: hasTextAnswer ? textAnswer.trim() : 'Voice answer',
        audioPath: hasVoiceAnswer ? recordedAudio.uri : null,
        answerType: answerMode,
        source: 'interview',
        addToBook: false // Can be toggled later
      });

      // Save answer locally
      const newAnswers = [...answers, answer];
      setAnswers(newAnswers);

      // Clear current answer
      setTextAnswer('');
      setRecordedAudio(null);
      setRecordingDuration(0);
      setAnswerMode(null);

      // Move to next question or complete
      if (currentQuestionIndex < questions.length - 1) {
        // Animate out current question
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: -50,
            duration: 300,
            useNativeDriver: true,
          })
        ]).start(() => {
          setCurrentQuestionIndex(currentQuestionIndex + 1);
          fadeAnim.setValue(0);
          slideAnim.setValue(50);
        });
      } else {
        // Interview complete
        completeInterview(newAnswers);
      }

    } catch (error) {
      Alert.alert(t('error'), 'Failed to save answer');
      console.error('Save answer error:', error);
    } finally {
      setIsSavingAnswer(false);
    }
  };

  const skipQuestion = () => {
    Alert.alert(
      'Skip Question',
      'Are you sure you want to skip this question?',
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('skip'),
          onPress: () => {
            if (currentQuestionIndex < questions.length - 1) {
              setCurrentQuestionIndex(currentQuestionIndex + 1);
            } else {
              completeInterview(answers);
            }
            
            // Reset answer state
            setTextAnswer('');
            setRecordedAudio(null);
            setRecordingDuration(0);
            setAnswerMode(null);
          }
        }
      ]
    );
  };

  const completeInterview = (finalAnswers) => {
    const stats = {
      totalQuestions: questions.length,
      answeredQuestions: finalAnswers.length,
      skippedQuestions: questions.length - finalAnswers.length,
      textAnswers: finalAnswers.filter(a => a.answerType === 'text').length,
      voiceAnswers: finalAnswers.filter(a => a.answerType === 'voice').length,
      duration: Date.now() - new Date(session.createdAt).getTime()
    };

    Alert.alert(
      '🎉 Interview Complete!',
      `Great job! You've completed your life story interview.\n\n✅ ${stats.answeredQuestions} questions answered\n⏱️ ${Math.round(stats.duration / 60000)} minutes`,
      [
        {
          text: 'View Timeline',
          onPress: () => {
            if (onComplete) onComplete(finalAnswers, stats);
          }
        }
      ]
    );
  };

  const exitInterview = () => {
    Alert.alert(
      'Exit Interview',
      'Are you sure you want to exit? Your progress will be saved.',
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: 'Exit',
          style: 'destructive',
          onPress: () => {
            if (onClose) onClose();
          }
        }
      ]
    );
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoadingQuestions) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading interview questions...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (questions.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color="#EF4444" />
          <Text style={styles.errorText}>Failed to load questions</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadQuestions}>
            <Text style={styles.retryText}>{t('retry')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const currentQuestion = getCurrentQuestion();
  
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={exitInterview}>
          <Ionicons name="close" size={24} color="#333" />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Text style={styles.questionCounter}>
            {currentQuestionIndex + 1} of {questions.length}
          </Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${getProgress()}%` }]} />
          </View>
        </View>

        <TouchableOpacity onPress={skipQuestion}>
          <Text style={styles.skipButton}>{t('skip')}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Question */}
        <Animated.View
          style={[
            styles.questionContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <Text style={styles.questionText}>{currentQuestion.text}</Text>
        </Animated.View>

        {/* Answer Mode Selection */}
        {!answerMode && (
          <View style={styles.modeSelection}>
            <Text style={styles.modeTitle}>How would you like to answer?</Text>
            
            <TouchableOpacity
              style={styles.modeButton}
              onPress={() => setAnswerMode('text')}
            >
              <Ionicons name="create" size={24} color="#007AFF" />
              <Text style={styles.modeButtonText}>Write Answer</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modeButton}
              onPress={() => setAnswerMode('voice')}
            >
              <Ionicons name="mic" size={24} color="#007AFF" />
              <Text style={styles.modeButtonText}>Voice Answer</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Text Answer Mode */}
        {answerMode === 'text' && (
          <View style={styles.answerContainer}>
            <Text style={styles.answerTitle}>Write your answer</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Share your thoughts..."
              placeholderTextColor="#999"
              value={textAnswer}
              onChangeText={setTextAnswer}
              multiline
              autoFocus
              textAlignVertical="top"
            />
            
            <View style={styles.answerActions}>
              <TouchableOpacity
                style={styles.changeMode}
                onPress={() => setAnswerMode('voice')}
              >
                <Ionicons name="mic" size={16} color="#007AFF" />
                <Text style={styles.changeModeText}>Switch to Voice</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Voice Answer Mode */}
        {answerMode === 'voice' && (
          <View style={styles.answerContainer}>
            <Text style={styles.answerTitle}>Record your answer</Text>
            
            {!recordedAudio ? (
              <View style={styles.recordingSection}>
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

                {isRecording ? (
                  <View style={styles.recordingInfo}>
                    <Text style={styles.recordingDuration}>
                      {formatDuration(recordingDuration)}
                    </Text>
                    <Text style={styles.recordingHint}>Tap to stop recording</Text>
                  </View>
                ) : (
                  <Text style={styles.recordHint}>Tap to start recording</Text>
                )}
              </View>
            ) : (
              <View style={styles.recordedSection}>
                <View style={styles.recordedInfo}>
                  <Ionicons name="checkmark-circle" size={32} color="#00A86B" />
                  <Text style={styles.recordedDuration}>
                    {formatDuration(recordedAudio.duration)}
                  </Text>
                  <Text style={styles.recordedText}>Recording completed</Text>
                </View>

                <TouchableOpacity
                  style={styles.rerecordButton}
                  onPress={resetRecording}
                >
                  <Ionicons name="refresh" size={16} color="#007AFF" />
                  <Text style={styles.rerecordText}>Record Again</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.answerActions}>
              <TouchableOpacity
                style={styles.changeMode}
                onPress={() => setAnswerMode('text')}
              >
                <Ionicons name="create" size={16} color="#007AFF" />
                <Text style={styles.changeModeText}>Switch to Text</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Save Answer Button */}
        {answerMode && (textAnswer.trim() || recordedAudio) && (
          <TouchableOpacity
            style={[styles.saveButton, isSavingAnswer && styles.saveButtonDisabled]}
            onPress={saveAnswer}
            disabled={isSavingAnswer}
          >
            {isSavingAnswer ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>
                {currentQuestionIndex < questions.length - 1 ? t('next') : 'Complete Interview'}
              </Text>
            )}
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E7',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 20,
  },
  questionCounter: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: '#E5E5E7',
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 2,
  },
  skipButton: {
    fontSize: 16,
    color: '#007AFF',
  },
  content: {
    flex: 1,
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
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  questionContainer: {
    padding: 20,
  },
  questionText: {
    fontSize: 20,
    lineHeight: 28,
    color: '#333',
    textAlign: 'center',
  },
  modeSelection: {
    padding: 20,
  },
  modeTitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  modeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
  },
  modeButtonText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
    fontWeight: '500',
  },
  answerContainer: {
    padding: 20,
  },
  answerTitle: {
    fontSize: 16,
    color: '#333',
    marginBottom: 16,
    fontWeight: '600',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E5E5E7',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 120,
    color: '#333',
  },
  recordingSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  recordButtonActive: {
    backgroundColor: '#EF4444',
  },
  recordingInfo: {
    alignItems: 'center',
  },
  recordingDuration: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#EF4444',
    marginBottom: 4,
  },
  recordingHint: {
    fontSize: 14,
    color: '#666',
  },
  recordHint: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  recordedSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  recordedInfo: {
    alignItems: 'center',
    marginBottom: 16,
  },
  recordedDuration: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
    marginBottom: 4,
  },
  recordedText: {
    fontSize: 14,
    color: '#00A86B',
  },
  rerecordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  rerecordText: {
    fontSize: 14,
    color: '#007AFF',
    marginLeft: 4,
  },
  answerActions: {
    marginTop: 16,
    alignItems: 'center',
  },
  changeMode: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  changeModeText: {
    fontSize: 14,
    color: '#007AFF',
    marginLeft: 4,
  },
  saveButton: {
    marginHorizontal: 20,
    marginBottom: 40,
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#999',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});