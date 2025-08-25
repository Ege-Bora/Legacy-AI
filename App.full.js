import 'react-native-url-polyfill/auto';
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, AppRegistry, Alert } from 'react-native';
import { Audio } from 'expo-av';

function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordings, setRecordings] = useState([]);
  const [recording, setRecording] = useState(null);
  const [selectedRecording, setSelectedRecording] = useState(null);
  const [transcriptionText, setTranscriptionText] = useState('');

  const startRecording = async () => {
    try {
      // Request permissions
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Audio recording permission is required');
        return;
      }

      // Configure audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Start recording
      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      setRecording(newRecording);
      setIsRecording(true);
      Alert.alert('Recording Started', 'Voice recording is now active');
    } catch (error) {
      console.error('Failed to start recording', error);
      Alert.alert('Error', 'Failed to start recording: ' + error.message);
    }
  };

  const stopRecording = async () => {
    try {
      if (!recording) return;

      setIsRecording(false);
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      
      // Add to recordings list
      const newRecording = {
        id: Date.now(),
        name: `Recording ${recordings.length + 1}`,
        status: 'Ready to upload',
        uri: uri
      };
      
      setRecordings([...recordings, newRecording]);
      setRecording(null);
      
      Alert.alert('Recording Stopped', `File saved and ready to upload\nLocation: ${uri}`);
    } catch (error) {
      console.error('Failed to stop recording', error);
      Alert.alert('Error', 'Failed to stop recording: ' + error.message);
    }
  };

  const uploadToBackend = async (recordingId) => {
    try {
      // Find the recording
      const recordingToUpload = recordings.find(r => r.id === recordingId);
      if (!recordingToUpload || !recordingToUpload.uri) {
        Alert.alert('Error', 'Recording not found');
        return;
      }

      // Update status to uploading
      setRecordings(recordings.map(r => 
        r.id === recordingId 
          ? { ...r, status: 'Uploading...' }
          : r
      ));

      // Prepare FormData for file upload
      const formData = new FormData();
      formData.append('file', {
        uri: recordingToUpload.uri,
        type: 'audio/m4a',
        name: `${recordingToUpload.name}.m4a`
      });

      // Upload to backend
      const response = await fetch('http://192.168.1.155:8080/memos/upload', {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.ok) {
        const result = await response.json();
        
        // Update status to success
        setRecordings(recordings.map(r => 
          r.id === recordingId 
            ? { ...r, status: 'Uploaded successfully', memoId: result.memoId }
            : r
        ));

        Alert.alert('Success', `File uploaded successfully!\nMemo ID: ${result.memoId}`);
        
        // Automatically trigger transcription
        triggerTranscription(result.memoId, recordingId);
      } else {
        throw new Error(`Upload failed: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      
      // Update status to error
      setRecordings(recordings.map(r => 
        r.id === recordingId 
          ? { ...r, status: 'Upload failed' }
          : r
      ));

      Alert.alert('Upload Error', error.message);
    }
  };

  const triggerTranscription = async (memoId, recordingId) => {
    try {
      // Update status to transcribing
      setRecordings(recordings.map(r => 
        r.id === recordingId 
          ? { ...r, status: 'Transcribing...' }
          : r
      ));

      // Trigger transcription
      const response = await fetch(`http://192.168.1.155:8080/memos/${memoId}/transcribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        
        // Update status to transcribed
        setRecordings(recordings.map(r => 
          r.id === recordingId 
            ? { ...r, status: 'Transcription queued', jobId: result.jobId }
            : r
        ));

        Alert.alert('Transcription Started', `Job ID: ${result.jobId}\nTranscription is being processed`);
        
        // Poll for transcription result
        pollTranscriptionResult(result.jobId, recordingId);
      } else {
        throw new Error(`Transcription failed: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Transcription error:', error);
      
      // Update status to error
      setRecordings(recordings.map(r => 
        r.id === recordingId 
          ? { ...r, status: 'Transcription failed' }
          : r
      ));

      Alert.alert('Transcription Error', error.message);
    }
  };

  const pollTranscriptionResult = async (jobId, recordingId) => {
    try {
      const maxPolls = 30;
      let polls = 0;
      
      const pollInterval = setInterval(async () => {
        polls++;
        
        try {
          const response = await fetch(`http://192.168.1.155:8080/jobs/${jobId}/status`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            const result = await response.json();
            
            if (result.status === 'completed') {
              clearInterval(pollInterval);
              
              // Update recording with transcription
              setRecordings(recordings.map(r => 
                r.id === recordingId 
                  ? { ...r, status: 'Transcription complete', transcription: result.data?.transcript }
                  : r
              ));
              
              Alert.alert('Transcription Complete', 'Your audio has been transcribed successfully!');
            } else if (result.status === 'failed') {
              clearInterval(pollInterval);
              
              setRecordings(recordings.map(r => 
                r.id === recordingId 
                  ? { ...r, status: 'Transcription failed' }
                  : r
              ));
            }
          }
        } catch (error) {
          console.error('Polling error:', error);
        }
        
        if (polls >= maxPolls) {
          clearInterval(pollInterval);
          setRecordings(recordings.map(r => 
            r.id === recordingId 
              ? { ...r, status: 'Transcription timeout' }
              : r
          ));
        }
      }, 2000);
      
    } catch (error) {
      console.error('Polling setup error:', error);
    }
  };

  const viewTranscription = (recording) => {
    setSelectedRecording(recording);
    setTranscriptionText(recording.transcription || 'No transcription available');
  };

  const closeTranscription = () => {
    setSelectedRecording(null);
    setTranscriptionText('');
  };

  return (
    <View style={{ 
      flex: 1, 
      backgroundColor: '#0B1020',
      paddingTop: 80,
      paddingHorizontal: 20
    }}>
      {/* Header */}
      <View style={{ alignItems: 'center', marginBottom: 40 }}>
        <Text style={{ color: '#E9EEF9', fontSize: 28, fontWeight: 'bold' }}>
          Life Legacy AI
        </Text>
        <Text style={{ color: '#A7B0C7', fontSize: 16, marginTop: 8 }}>
          Voice Memo & Transcription
        </Text>
      </View>

      {/* Recording Button */}
      <View style={{ alignItems: 'center', marginBottom: 40 }}>
        <TouchableOpacity
          style={{
            backgroundColor: isRecording ? '#FF4444' : '#6E9BFF',
            width: 120,
            height: 120,
            borderRadius: 60,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 20
          }}
          onPress={isRecording ? stopRecording : startRecording}
        >
          <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>
            {isRecording ? 'STOP' : 'RECORD'}
          </Text>
        </TouchableOpacity>
        
        <Text style={{ color: '#A7B0C7', fontSize: 14 }}>
          {isRecording ? 'Recording in progress...' : 'Tap to start recording'}
        </Text>
      </View>

      {/* Recordings List */}
      <View>
        <Text style={{ color: '#E9EEF9', fontSize: 18, fontWeight: 'bold', marginBottom: 20 }}>
          Recent Recordings ({recordings.length})
        </Text>
        
        {recordings.map((recording) => (
          <View 
            key={recording.id}
            style={{
              backgroundColor: '#1A1F2E',
              padding: 15,
              borderRadius: 10,
              marginBottom: 10,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <View>
              <Text style={{ color: '#E9EEF9', fontSize: 16 }}>
                {recording.name}
              </Text>
              <Text style={{ color: '#A7B0C7', fontSize: 12 }}>
                {recording.status}
              </Text>
            </View>
            
            <View style={{ flexDirection: 'row', gap: 5 }}>
              {recording.status === 'Ready to upload' && (
                <TouchableOpacity
                  style={{
                    backgroundColor: '#6E9BFF',
                    paddingHorizontal: 15,
                    paddingVertical: 8,
                    borderRadius: 5
                  }}
                  onPress={() => uploadToBackend(recording.id)}
                >
                  <Text style={{ color: 'white', fontSize: 12 }}>
                    Upload & Transcribe
                  </Text>
                </TouchableOpacity>
              )}
              
              {recording.transcription && (
                <TouchableOpacity
                  style={{
                    backgroundColor: '#4CAF50',
                    paddingHorizontal: 15,
                    paddingVertical: 8,
                    borderRadius: 5
                  }}
                  onPress={() => viewTranscription(recording)}
                >
                  <Text style={{ color: 'white', fontSize: 12 }}>
                    View Text
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}
        
        {recordings.length === 0 && (
          <Text style={{ color: '#A7B0C7', fontSize: 14, textAlign: 'center', marginTop: 20 }}>
            No recordings yet. Start recording to see them here.
          </Text>
        )}
      </View>

      {/* Transcription Modal */}
      {selectedRecording && (
        <View style={{ 
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: 20
        }}>
          <View style={{
            backgroundColor: '#1A1F2E',
            borderRadius: 15,
            padding: 20,
            maxHeight: '80%',
            width: '100%'
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ color: '#E9EEF9', fontSize: 18, fontWeight: 'bold' }}>
                Transcription
              </Text>
              <TouchableOpacity
                style={{
                  backgroundColor: '#FF4444',
                  paddingHorizontal: 15,
                  paddingVertical: 8,
                  borderRadius: 5
                }}
                onPress={closeTranscription}
              >
                <Text style={{ color: 'white', fontSize: 12 }}>
                  Close
                </Text>
              </TouchableOpacity>
            </View>
            
            <Text style={{ color: '#A7B0C7', fontSize: 14, marginBottom: 10 }}>
              {selectedRecording.name}
            </Text>
            
            <View style={{
              backgroundColor: '#0B1020',
              borderRadius: 8,
              padding: 15,
              maxHeight: 300
            }}>
              <Text style={{ color: '#E9EEF9', fontSize: 16, lineHeight: 24 }}>
                {transcriptionText}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Backend Status */}
      <View style={{ position: 'absolute', bottom: 40, left: 20, right: 20 }}>
        <Text style={{ color: '#A7B0C7', fontSize: 12, textAlign: 'center' }}>
          Backend: localhost:8080 • Ready for integration
        </Text>
      </View>
    </View>
  );
}

// Register the main component
AppRegistry.registerComponent('main', () => App);

export default App;