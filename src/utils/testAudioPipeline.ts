// Audio Pipeline Testing Utility
// Test the complete audio flow: Record → Upload → Transcribe → Timeline

import { api } from '../services/api';
import { Audio } from 'expo-av';

export interface AudioPipelineTestResult {
  success: boolean;
  step: string;
  error?: string;
  duration?: number;
  data?: any;
}

export async function testAudioPipeline(): Promise<AudioPipelineTestResult[]> {
  const results: AudioPipelineTestResult[] = [];
  const startTime = Date.now();

  try {
    // Step 1: Test Audio Permissions
    console.log('[AudioTest] Testing audio permissions...');
    const stepStart = Date.now();
    
    const { status } = await Audio.requestPermissionsAsync();
    results.push({
      success: status === 'granted',
      step: 'Audio Permissions',
      duration: Date.now() - stepStart,
      data: { status }
    });

    if (status !== 'granted') {
      return results;
    }

    // Step 2: Test Audio Mode Configuration
    console.log('[AudioTest] Testing audio mode configuration...');
    const configStart = Date.now();
    
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });
    
    results.push({
      success: true,
      step: 'Audio Configuration',
      duration: Date.now() - configStart
    });

    // Step 3: Test Recording Creation (don't actually record)
    console.log('[AudioTest] Testing recording creation...');
    const recordingStart = Date.now();
    
    try {
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      // Immediately stop without recording
      await recording.stopAndUnloadAsync();
      
      results.push({
        success: true,
        step: 'Recording Creation',
        duration: Date.now() - recordingStart
      });
    } catch (recordError) {
      results.push({
        success: false,
        step: 'Recording Creation',
        duration: Date.now() - recordingStart,
        error: recordError instanceof Error ? recordError.message : 'Recording failed'
      });
    }

    // Step 4: Test Upload API (with mock data)
    console.log('[AudioTest] Testing upload API...');
    const uploadStart = Date.now();
    
    try {
      const uploadResult = await api.uploadAudio('mock://test.m4a', {
        durationMs: 5000
      });
      
      results.push({
        success: true,
        step: 'Audio Upload',
        duration: Date.now() - uploadStart,
        data: uploadResult
      });
    } catch (uploadError) {
      results.push({
        success: false,
        step: 'Audio Upload',
        duration: Date.now() - uploadStart,
        error: uploadError instanceof Error ? uploadError.message : 'Upload failed'
      });
    }

    // Step 5: Test Transcription API
    console.log('[AudioTest] Testing transcription API...');
    const transcribeStart = Date.now();
    
    try {
      const transcribeResult = await api.transcribeMemo('mock-memo-id', 'whisper', 'en');
      
      results.push({
        success: true,
        step: 'Audio Transcription',
        duration: Date.now() - transcribeStart,
        data: transcribeResult
      });
    } catch (transcribeError) {
      results.push({
        success: false,
        step: 'Audio Transcription',
        duration: Date.now() - transcribeStart,
        error: transcribeError instanceof Error ? transcribeError.message : 'Transcription failed'
      });
    }

    // Step 6: Test Timeline Creation
    console.log('[AudioTest] Testing timeline creation...');
    const timelineStart = Date.now();
    
    try {
      const timelineResult = await api.createTimelineItem({
        type: 'log',
        transcript: 'Test transcription from audio pipeline test',
        audioUrl: 'mock://test-audio.m4a',
        memoId: 'mock-memo-id'
      });
      
      results.push({
        success: true,
        step: 'Timeline Creation',
        duration: Date.now() - timelineStart,
        data: timelineResult
      });
    } catch (timelineError) {
      results.push({
        success: false,
        step: 'Timeline Creation',
        duration: Date.now() - timelineStart,
        error: timelineError instanceof Error ? timelineError.message : 'Timeline creation failed'
      });
    }

    console.log(`[AudioTest] Pipeline test completed in ${Date.now() - startTime}ms`);
    return results;

  } catch (error) {
    results.push({
      success: false,
      step: 'Pipeline Test',
      error: error instanceof Error ? error.message : 'Unknown error',
      duration: Date.now() - startTime
    });
    return results;
  }
}

export function formatTestResults(results: AudioPipelineTestResult[]): string {
  let output = '🔊 Audio Pipeline Test Results:\n\n';
  
  const totalSteps = results.length;
  const passedSteps = results.filter(r => r.success).length;
  const failedSteps = totalSteps - passedSteps;
  
  output += `✅ Passed: ${passedSteps}/${totalSteps}\n`;
  if (failedSteps > 0) {
    output += `❌ Failed: ${failedSteps}/${totalSteps}\n`;
  }
  output += '\n';

  results.forEach((result, index) => {
    const icon = result.success ? '✅' : '❌';
    const duration = result.duration ? ` (${result.duration}ms)` : '';
    
    output += `${index + 1}. ${icon} ${result.step}${duration}\n`;
    
    if (result.error) {
      output += `   Error: ${result.error}\n`;
    }
    
    if (result.data) {
      const dataStr = JSON.stringify(result.data, null, 2);
      if (dataStr.length < 100) {
        output += `   Data: ${dataStr}\n`;
      }
    }
    output += '\n';
  });

  return output;
}