import React, { useState } from 'react';
import { 
  View, 
  Text, 
  SafeAreaView, 
  TextInput, 
  Alert, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../services/api';
import RecordButton from '../components/RecordButton';
import { useTheme } from '../hooks/useTheme';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { IconButton } from '../components/ui/IconButton';
import { SegmentedControl } from '../components/ui/SegmentedControl';

export default function QuickCaptureScreen({ navigation }) {
  const [content, setContent] = useState('');
  const [isVoiceMode, setIsVoiceMode] = useState(0); // 0 = Voice, 1 = Text
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  
  const TAB_BAR_HEIGHT = 83;
  const bottomPadding = insets.bottom + TAB_BAR_HEIGHT + theme.spacing.lg;

  const saveQuickLog = async () => {
    if (!content.trim()) {
      Alert.alert('Empty Memory', 'Please capture a memory before saving.');
      return;
    }

    try {
      setIsLoading(true);
      const result = await api.saveQuickLog(content, isVoiceMode === 0);
      
      if (result.success) {
        Alert.alert(
          'Memory Saved!',
          'Your quick memory has been added to your timeline.',
          [
            {
              text: 'Add Another',
              onPress: () => {
                setContent('');
                setIsRecording(false);
              }
            },
            {
              text: 'View Timeline',
              onPress: () => navigation.navigate('Timeline')
            }
          ]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save memory');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceRecording = async (audioUri) => {
    try {
      setIsLoading(true);
      const transcription = await api.transcribeAudio(audioUri);
      if (transcription.success) {
        setContent(transcription.transcription);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to transcribe audio');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ 
      flex: 1, 
      backgroundColor: theme.colors.background 
    }}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={{
          paddingHorizontal: theme.spacing.lg,
          paddingTop: theme.spacing.md,
          paddingBottom: theme.spacing.lg,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border,
          backgroundColor: theme.colors.surface
        }}>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <IconButton
              icon="arrow-back"
              onPress={() => navigation.goBack()}
              size="md"
              accessibilityLabel="Go back"
            />
            <Text style={{
              fontSize: theme.fontSizes.lg,
              fontWeight: theme.fontWeights.semibold,
              color: theme.colors.text
            }}>
              Quick Capture
            </Text>
            <View style={{ width: 44 }} />
          </View>
        </View>

        <ScrollView 
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: theme.spacing.lg,
            paddingVertical: theme.spacing.xl,
            paddingBottom: bottomPadding
          }}
          showsVerticalScrollIndicator={true}
          scrollIndicatorInsets={{ right: 1 }}
        >
          {/* Title */}
          <View style={{ marginBottom: theme.spacing.xl }}>
            <Text style={{
              fontSize: theme.fontSizes.h1,
              fontWeight: theme.fontWeights.bold,
              color: theme.colors.text,
              marginBottom: theme.spacing.md
            }}>
              Capture a Memory
            </Text>
            <Text style={{
              fontSize: theme.fontSizes.lg,
              color: theme.colors.textDim,
              lineHeight: theme.fontSizes.lg * 1.4
            }}>
              Record a quick voice note or write down what's on your mind
            </Text>
          </View>

          {/* Mode Toggle */}
          <SegmentedControl
            options={['Voice', 'Text']}
            selectedIndex={isVoiceMode}
            onSelectionChange={setIsVoiceMode}
            style={{ marginBottom: theme.spacing.xl }}
          />

          {/* Capture Interface */}
          <View style={{ 
            flex: 1, 
            justifyContent: 'center',
            minHeight: 300
          }}>
            {isVoiceMode === 0 ? (
              <View style={{ alignItems: 'center' }}>
                <RecordButton
                  onRecordingComplete={handleVoiceRecording}
                  isRecording={isRecording}
                  setIsRecording={setIsRecording}
                  size="large"
                />
                <Text style={{
                  fontSize: theme.fontSizes.lg,
                  color: theme.colors.textDim,
                  marginTop: theme.spacing.lg,
                  textAlign: 'center'
                }}>
                  {isRecording ? 'Recording your memory...' : 'Tap to start recording'}
                </Text>
                {isRecording && (
                  <Text style={{
                    fontSize: theme.fontSizes.sm,
                    color: theme.colors.textDim,
                    marginTop: theme.spacing.sm,
                    textAlign: 'center'
                  }}>
                    Speak naturally about what you want to remember
                  </Text>
                )}
              </View>
            ) : (
              <Card variant="surface">
                <TextInput
                  value={content}
                  onChangeText={setContent}
                  placeholder="What's on your mind? Describe a moment, feeling, or memory you want to capture..."
                  placeholderTextColor={theme.colors.textDim}
                  multiline
                  style={{
                    fontSize: theme.fontSizes.lg,
                    color: theme.colors.text,
                    minHeight: 200,
                    textAlignVertical: 'top',
                    lineHeight: theme.fontSizes.lg * 1.4
                  }}
                  autoFocus
                  accessibilityLabel="Enter your memory or thoughts"
                />
              </Card>
            )}
          </View>

          {/* Content Preview */}
          {content ? (
            <Card 
              variant="surface"
              style={{
                backgroundColor: `${theme.colors.primary}10`,
                borderColor: `${theme.colors.primary}20`,
                marginTop: theme.spacing.lg
              }}
            >
              <Text style={{
                fontSize: theme.fontSizes.sm,
                color: theme.colors.primary,
                fontWeight: theme.fontWeights.medium,
                marginBottom: theme.spacing.sm
              }}>
                Your Memory:
              </Text>
              <Text style={{
                fontSize: theme.fontSizes.md,
                color: theme.colors.text,
                lineHeight: theme.fontSizes.md * 1.4
              }}>
                {content}
              </Text>
            </Card>
          ) : null}

          {/* Save Button */}
          <Button
            title={isLoading ? 'Saving Memory...' : 'Save Memory'}
            onPress={saveQuickLog}
            disabled={isLoading || !content.trim()}
            variant={isLoading || !content.trim() ? 'secondary' : 'primary'}
            size="lg"
            style={{ marginTop: theme.spacing.lg }}
            accessibilityLabel="Save your memory to timeline"
          />

          {/* Tips */}
          <Card 
            variant="surface"
            style={{
              backgroundColor: `${theme.colors.warning}10`,
              borderColor: `${theme.colors.warning}20`,
              marginTop: theme.spacing.lg
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
              <Ionicons 
                name="bulb-outline" 
                size={20} 
                color={theme.colors.warning} 
              />
              <Text style={{
                marginLeft: theme.spacing.sm,
                fontSize: theme.fontSizes.sm,
                color: theme.colors.text,
                flex: 1,
                lineHeight: theme.fontSizes.sm * 1.4
              }}>
                <Text style={{ fontWeight: theme.fontWeights.medium }}>Tip:</Text> Quick captures are perfect for spontaneous moments, 
                daily reflections, or when inspiration strikes. They'll be organized in your timeline automatically.
              </Text>
            </View>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
