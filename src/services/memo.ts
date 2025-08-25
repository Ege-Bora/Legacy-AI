import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import * as Haptics from 'expo-haptics';

export interface RecordingStatus {
  isRecording: boolean;
  durationMillis: number;
  metering?: number;
}

export interface MemoRecording {
  uri: string;
  duration: number;
  size: number;
  metering?: number[];
}

export class MemoService {
  private recording: Audio.Recording | null = null;
  private recordingStatus: RecordingStatus = {
    isRecording: false,
    durationMillis: 0,
  };
  private statusCallback?: (status: RecordingStatus) => void;
  private maxDurationMs = 3 * 60 * 1000; // 3 minutes

  constructor() {
    this.setupAudio();
  }

  private async setupAudio() {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        staysActiveInBackground: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
    } catch (error) {
      console.error('Failed to setup audio:', error);
    }
  }

  async checkPermissions(): Promise<boolean> {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Failed to check permissions:', error);
      return false;
    }
  }

  async startRecording(onStatusUpdate?: (status: RecordingStatus) => void): Promise<boolean> {
    try {
      if (this.recording) {
        await this.stopRecording();
      }

      const hasPermission = await this.checkPermissions();
      if (!hasPermission) {
        throw new Error('Microphone permission not granted');
      }

      this.statusCallback = onStatusUpdate;
      this.recording = new Audio.Recording();

      const recordingOptions = Audio.RecordingOptionsPresets.HIGH_QUALITY;

      await this.recording.prepareToRecordAsync(recordingOptions);
      
      this.recording.setOnRecordingStatusUpdate((status) => {
        this.recordingStatus = {
          isRecording: status.isRecording || false,
          durationMillis: status.durationMillis || 0,
          metering: status.metering,
        };

        // Auto-stop at max duration
        if (this.recordingStatus.durationMillis >= this.maxDurationMs) {
          this.stopRecording();
        }

        if (this.statusCallback) {
          this.statusCallback(this.recordingStatus);
        }
      });

      await this.recording.startAsync();
      
      // Haptic feedback on start
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      return true;
    } catch (error) {
      console.error('Failed to start recording:', error);
      this.recording = null;
      return false;
    }
  }

  async stopRecording(): Promise<MemoRecording | null> {
    try {
      if (!this.recording) {
        return null;
      }

      await this.recording.stopAndUnloadAsync();
      
      // Haptic feedback on stop
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const uri = this.recording.getURI();
      if (!uri) {
        throw new Error('No recording URI available');
      }

      // Get file info
      const fileInfo = await FileSystem.getInfoAsync(uri);
      const duration = this.recordingStatus.durationMillis;

      const memoRecording: MemoRecording = {
        uri,
        duration,
        size: fileInfo.exists ? fileInfo.size || 0 : 0,
      };

      this.recording = null;
      this.recordingStatus = {
        isRecording: false,
        durationMillis: 0,
      };

      return memoRecording;
    } catch (error) {
      console.error('Failed to stop recording:', error);
      this.recording = null;
      return null;
    }
  }

  async cancelRecording(): Promise<void> {
    try {
      if (this.recording) {
        await this.recording.stopAndUnloadAsync();
        const uri = this.recording.getURI();
        
        // Delete the file
        if (uri) {
          await FileSystem.deleteAsync(uri, { idempotent: true });
        }
        
        this.recording = null;
        this.recordingStatus = {
          isRecording: false,
          durationMillis: 0,
        };
      }
    } catch (error) {
      console.error('Failed to cancel recording:', error);
    }
  }

  getCurrentStatus(): RecordingStatus {
    return this.recordingStatus;
  }

  getMaxDuration(): number {
    return this.maxDurationMs;
  }

  setMaxDuration(durationMs: number): void {
    this.maxDurationMs = durationMs;
  }

  formatDuration(durationMs: number): string {
    const totalSeconds = Math.floor(durationMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
}

export const memoService = new MemoService();
