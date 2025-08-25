import React, { useState } from 'react';
import { View, Text, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { useTheme } from '../hooks/useTheme';
import { Card } from './ui/Card';
import { Button } from './ui/Button';

export default function MediaUploader({ onUpload }) {
  const [isUploading, setIsUploading] = useState(false);
  const theme = useTheme();

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please grant camera roll permissions to upload media.'
      );
      return false;
    }
    return true;
  };

  const pickImage = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        handleUpload(result.assets[0]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const pickVideo = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        handleUpload(result.assets[0]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick video');
    }
  };

  const pickAudio = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        handleUpload(result.assets[0]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick audio file');
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please grant camera permissions to take photos.'
      );
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        handleUpload(result.assets[0]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const handleUpload = async (file) => {
    setIsUploading(true);
    try {
      if (onUpload) {
        await onUpload(file);
      }
    } catch (error) {
      Alert.alert('Upload Error', 'Failed to upload media file');
    } finally {
      setIsUploading(false);
    }
  };

  const showMediaOptions = () => {
    Alert.alert(
      'Add Media',
      'Choose the type of media you want to add',
      [
        { text: 'Take Photo', onPress: takePhoto },
        { text: 'Choose Photo', onPress: pickImage },
        { text: 'Choose Video', onPress: pickVideo },
        { text: 'Choose Audio', onPress: pickAudio },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  return (
    <View>
      <Card
        onPress={showMediaOptions}
        disabled={isUploading}
        style={{
          borderWidth: 2,
          borderStyle: 'dashed',
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.surface,
          alignItems: 'center',
          opacity: isUploading ? theme.opacity.disabled : 1,
        }}
      >
        {isUploading ? (
          <View style={{ alignItems: 'center' }}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={{
              color: theme.colors.textDim,
              marginTop: theme.spacing.sm,
              fontSize: theme.fontSizes.md,
              fontWeight: theme.fontWeights.medium,
            }}>
              Uploading...
            </Text>
          </View>
        ) : (
          <View style={{ alignItems: 'center' }}>
            <Ionicons 
              name="add-circle-outline" 
              size={32} 
              color={theme.colors.textDim} 
            />
            <Text style={{
              color: theme.colors.text,
              marginTop: theme.spacing.sm,
              fontSize: theme.fontSizes.md,
              fontWeight: theme.fontWeights.medium,
            }}>
              Add Media
            </Text>
            <Text style={{
              color: theme.colors.textDim,
              fontSize: theme.fontSizes.sm,
              marginTop: theme.spacing.xs,
              textAlign: 'center',
            }}>
              Photos, videos, or audio files
            </Text>
          </View>
        )}
      </Card>

      {/* Quick Action Buttons */}
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: theme.spacing.lg,
        gap: theme.spacing.sm,
      }}>
        <Button
          title="Camera"
          onPress={takePhoto}
          disabled={isUploading}
          variant="secondary"
          icon="camera"
          style={{ 
            flex: 1,
            backgroundColor: `${theme.colors.primary}10`,
          }}
          textStyle={{ color: theme.colors.primary }}
        />

        <Button
          title="Photos"
          onPress={pickImage}
          disabled={isUploading}
          variant="secondary"
          icon="image"
          style={{ 
            flex: 1,
            backgroundColor: `${theme.colors.success}10`,
          }}
          textStyle={{ color: theme.colors.success }}
        />

        <Button
          title="Videos"
          onPress={pickVideo}
          disabled={isUploading}
          variant="secondary"
          icon="videocam"
          style={{ 
            flex: 1,
            backgroundColor: `${theme.colors.warning}10`,
          }}
          textStyle={{ color: theme.colors.warning }}
        />

        <Button
          title="Audio"
          onPress={pickAudio}
          disabled={isUploading}
          variant="secondary"
          icon="musical-notes"
          style={{ 
            flex: 1,
            backgroundColor: `${theme.colors.danger}10`,
          }}
          textStyle={{ color: theme.colors.danger }}
        />
      </View>
    </View>
  );
}
