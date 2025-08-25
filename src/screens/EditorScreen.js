import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  SafeAreaView, 
  ScrollView, 
  TextInput, 
  Alert, 
  KeyboardAvoidingView, 
  Platform 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../services/api';
import MediaUploader from '../components/MediaUploader';
import { useTheme } from '../hooks/useTheme';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { IconButton } from '../components/ui/IconButton';

export default function EditorScreen({ navigation, route }) {
  const { item } = route.params;
  const [title, setTitle] = useState(item.title);
  const [content, setContent] = useState(item.content);
  const [media, setMedia] = useState(item.media || []);
  const [isLoading, setIsLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  
  const TAB_BAR_HEIGHT = 83;
  const bottomPadding = insets.bottom + TAB_BAR_HEIGHT + theme.spacing.lg;

  useEffect(() => {
    const hasContentChanged = title !== item.title || content !== item.content;
    setHasChanges(hasContentChanged);
  }, [title, content, item]);

  const saveChanges = async () => {
    try {
      setIsLoading(true);
      const updates = { title, content, media };
      const result = await api.updateChapter(item.id, updates);
      
      if (result.success) {
        setHasChanges(false);
        Alert.alert('Saved', 'Your changes have been saved successfully.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save changes');
    } finally {
      setIsLoading(false);
    }
  };

  const regenerateWithAI = async () => {
    Alert.prompt(
      'AI Regeneration',
      'Provide instructions for how you want the AI to modify this content:',
      async (prompt) => {
        if (prompt) {
          try {
            setIsLoading(true);
            const result = await api.regenerateChapterWithAI(item.id, prompt);
            if (result.success) {
              setContent(result.content);
              Alert.alert('Regenerated', 'Content has been updated with AI assistance.');
            }
          } catch (error) {
            Alert.alert('Error', 'Failed to regenerate content');
          } finally {
            setIsLoading(false);
          }
        }
      }
    );
  };

  const handleMediaUpload = async (mediaFile) => {
    try {
      setIsLoading(true);
      const result = await api.uploadMedia(mediaFile, item.id);
      if (result.success) {
        setMedia(prev => [...prev, result.mediaUrl]);
        Alert.alert('Success', 'Media uploaded successfully');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to upload media');
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
          paddingBottom: theme.spacing.md,
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
              Edit {item.type === 'chapter' ? 'Chapter' : 'Memory'}
            </Text>
            <Button
              title={isLoading ? 'Saving...' : 'Save'}
              onPress={saveChanges}
              disabled={!hasChanges || isLoading}
              variant={hasChanges && !isLoading ? 'primary' : 'secondary'}
              size="sm"
              accessibilityLabel="Save changes"
            />
          </View>
        </View>

        <ScrollView 
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: theme.spacing.lg,
            paddingVertical: theme.spacing.lg,
            paddingBottom: bottomPadding
          }}
          showsVerticalScrollIndicator={true}
          scrollIndicatorInsets={{ right: 1 }}
        >
          {/* Title Editor */}
          <View style={{ marginBottom: theme.spacing.lg }}>
            <Text style={{
              fontSize: theme.fontSizes.sm,
              fontWeight: theme.fontWeights.medium,
              color: theme.colors.textDim,
              marginBottom: theme.spacing.sm
            }}>
              Title
            </Text>
            <Card variant="surface">
              <TextInput
                value={title}
                onChangeText={setTitle}
                style={{
                  fontSize: theme.fontSizes.xl,
                  fontWeight: theme.fontWeights.semibold,
                  color: theme.colors.text
                }}
                placeholder="Enter title..."
                placeholderTextColor={theme.colors.textDim}
                accessibilityLabel="Chapter title"
              />
            </Card>
          </View>

          {/* Content Editor */}
          <View style={{ marginBottom: theme.spacing.lg }}>
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: theme.spacing.sm
            }}>
              <Text style={{
                fontSize: theme.fontSizes.sm,
                fontWeight: theme.fontWeights.medium,
                color: theme.colors.textDim
              }}>
                Content
              </Text>
              <Button
                title="AI Enhance"
                onPress={regenerateWithAI}
                disabled={isLoading}
                variant="secondary"
                size="sm"
                icon="star"
                style={{
                  backgroundColor: `${theme.colors.secondary}20`,
                  borderColor: `${theme.colors.secondary}30`
                }}
                accessibilityLabel="Enhance content with AI"
              />
            </View>
            <Card variant="surface">
              <TextInput
                value={content}
                onChangeText={setContent}
                multiline
                style={{
                  fontSize: theme.fontSizes.md,
                  color: theme.colors.text,
                  minHeight: 300,
                  textAlignVertical: 'top',
                  lineHeight: theme.fontSizes.md * 1.4
                }}
                placeholder="Write your story..."
                placeholderTextColor={theme.colors.textDim}
                accessibilityLabel="Chapter content"
              />
            </Card>
          </View>

          {/* Formatting Tools */}
          <View style={{ marginBottom: theme.spacing.lg }}>
            <Text style={{
              fontSize: theme.fontSizes.sm,
              fontWeight: theme.fontWeights.medium,
              color: theme.colors.textDim,
              marginBottom: theme.spacing.md
            }}>
              Formatting
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ 
                flexDirection: 'row', 
                gap: theme.spacing.sm 
              }}>
                <Button
                  title="B"
                  variant="secondary"
                  size="sm"
                  style={{ minWidth: 44 }}
                  accessibilityLabel="Bold"
                />
                <Button
                  title="I"
                  variant="secondary"
                  size="sm"
                  style={{ minWidth: 44, fontStyle: 'italic' }}
                  accessibilityLabel="Italic"
                />
                <Button
                  title="H1"
                  variant="secondary"
                  size="sm"
                  style={{ minWidth: 44 }}
                  accessibilityLabel="Heading 1"
                />
                <Button
                  title="H2"
                  variant="secondary"
                  size="sm"
                  style={{ minWidth: 44 }}
                  accessibilityLabel="Heading 2"
                />
                <IconButton
                  icon="list"
                  variant="secondary"
                  size="sm"
                  accessibilityLabel="List"
                />
              </View>
            </ScrollView>
          </View>

          {/* Media Section */}
          <View style={{ marginBottom: theme.spacing.lg }}>
            <Text style={{
              fontSize: theme.fontSizes.sm,
              fontWeight: theme.fontWeights.medium,
              color: theme.colors.textDim,
              marginBottom: theme.spacing.md
            }}>
              Media
            </Text>
            <MediaUploader onUpload={handleMediaUpload} />
            
            {/* Existing Media */}
            {media.length > 0 && (
              <View style={{ marginTop: theme.spacing.md }}>
                <Text style={{
                  fontSize: theme.fontSizes.sm,
                  color: theme.colors.textDim,
                  marginBottom: theme.spacing.sm
                }}>
                  {media.length} media file(s) attached
                </Text>
                {media.map((mediaUrl, index) => (
                  <Card 
                    key={index} 
                    variant="surface"
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: theme.spacing.sm
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Ionicons name="image" size={20} color={theme.colors.textDim} />
                      <Text style={{
                        marginLeft: theme.spacing.sm,
                        fontSize: theme.fontSizes.md,
                        color: theme.colors.text
                      }}>
                        Media {index + 1}
                      </Text>
                    </View>
                    <IconButton
                      icon="trash-outline"
                      size="md"
                      variant="ghost"
                      accessibilityLabel={`Delete media ${index + 1}`}
                    />
                  </Card>
                ))}
              </View>
            )}
          </View>

          {/* Metadata */}
          <Card 
            variant="surface"
            style={{
              backgroundColor: theme.colors.surfaceSecondary,
              marginBottom: theme.spacing.lg
            }}
          >
            <Text style={{
              fontSize: theme.fontSizes.sm,
              fontWeight: theme.fontWeights.medium,
              color: theme.colors.textDim,
              marginBottom: theme.spacing.sm
            }}>
              Details
            </Text>
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              marginBottom: theme.spacing.sm
            }}>
              <Text style={{
                fontSize: theme.fontSizes.sm,
                color: theme.colors.textDim
              }}>
                Created:
              </Text>
              <Text style={{
                fontSize: theme.fontSizes.sm,
                color: theme.colors.text
              }}>
                {item.date}
              </Text>
            </View>
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              marginBottom: theme.spacing.sm
            }}>
              <Text style={{
                fontSize: theme.fontSizes.sm,
                color: theme.colors.textDim
              }}>
                Type:
              </Text>
              <Text style={{
                fontSize: theme.fontSizes.sm,
                color: theme.colors.text,
                textTransform: 'capitalize'
              }}>
                {item.type}
              </Text>
            </View>
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between'
            }}>
              <Text style={{
                fontSize: theme.fontSizes.sm,
                color: theme.colors.textDim
              }}>
                Word Count:
              </Text>
              <Text style={{
                fontSize: theme.fontSizes.sm,
                color: theme.colors.text
              }}>
                {(content && typeof content === 'string') ? content.split(' ').length : 0} words
              </Text>
            </View>
          </Card>
        </ScrollView>

        {/* Bottom Actions */}
        {hasChanges && (
          <View style={{
            paddingHorizontal: theme.spacing.lg,
            paddingVertical: theme.spacing.md,
            borderTopWidth: 1,
            borderTopColor: theme.colors.border,
            backgroundColor: `${theme.colors.primary}10`
          }}>
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <Text style={{
                fontSize: theme.fontSizes.md,
                color: theme.colors.primary
              }}>
                You have unsaved changes
              </Text>
              <Button
                title={isLoading ? 'Saving...' : 'Save Changes'}
                onPress={saveChanges}
                disabled={isLoading}
                variant="primary"
                accessibilityLabel="Save all changes"
              />
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
