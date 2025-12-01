/**
 * Voice Orchestration Service
 * Handles STT, TTS, and VAD for LangGraph agents
 * Uses backend API instead of Gemini Live
 */

import { AgentConfig } from '../types/agent';

interface VoiceCallbacks {
  onTranscript: (role: 'user' | 'assistant', text: string) => void;
  onError: (error: string) => void;
  onDisconnect: () => void;
  onAudioStart: () => void;
  onAudioEnd: () => void;
}

export class VoiceOrchestrationService {
  private mediaRecorder: MediaRecorder | null = null;
  private audioContext: AudioContext | null = null;
  private audioChunks: Blob[] = [];
  private isRecording: boolean = false;
  private isProcessing: boolean = false;
  private agentId: string;
  private sessionId: string;
  private config: AgentConfig;
  private callbacks: VoiceCallbacks;
  private silenceTimeout: NodeJS.Timeout | null = null;
  private audioQueue: HTMLAudioElement[] = [];
  private isPlayingAudio: boolean = false;

  // VAD settings
  private readonly SILENCE_THRESHOLD = 1000; // 1 second of silence
  private readonly MIN_RECORDING_TIME = 500; // Minimum 0.5 seconds
  private recordingStartTime: number = 0;

  constructor(
    agentId: string,
    sessionId: string,
    config: AgentConfig,
    callbacks: VoiceCallbacks
  ) {
    this.agentId = agentId;
    this.sessionId = sessionId;
    this.config = config;
    this.callbacks = callbacks;
  }

  /**
   * Initialize and start voice session
   */
  async start(): Promise<void> {
    try {
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: this.config.denoising_mode !== 'none',
          autoGainControl: true,
        } 
      });

      // Initialize audio context for VAD
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Setup media recorder
      const mimeType = this.getSupportedMimeType();
      this.mediaRecorder = new MediaRecorder(stream, { mimeType });

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = async () => {
        await this.processRecording();
      };

      // Setup VAD (Voice Activity Detection)
      this.setupVAD(stream);

      console.log('✅ Voice session started');
    } catch (error) {
      console.error('❌ Failed to start voice session:', error);
      this.callbacks.onError('Failed to access microphone. Please check permissions.');
      throw error;
    }
  }

  /**
   * Setup Voice Activity Detection
   */
  private setupVAD(stream: MediaStream): void {
    if (!this.audioContext) return;

    const source = this.audioContext.createMediaStreamSource(stream);
    const analyser = this.audioContext.createAnalyser();
    analyser.fftSize = 2048;
    
    source.connect(analyser);

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const checkAudioLevel = () => {
      if (!this.audioContext) return;

      analyser.getByteTimeDomainData(dataArray);
      
      // Calculate RMS (Root Mean Square) for audio level
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        const normalized = (dataArray[i] - 128) / 128;
        sum += normalized * normalized;
      }
      const rms = Math.sqrt(sum / bufferLength);
      const db = 20 * Math.log10(rms);

      // Voice detected (threshold: -50dB)
      const isSpeaking = db > -50;

      if (isSpeaking && !this.isRecording && !this.isProcessing) {
        this.startRecording();
      } else if (!isSpeaking && this.isRecording) {
        // Start silence timer
        if (!this.silenceTimeout) {
          this.silenceTimeout = setTimeout(() => {
            this.stopRecording();
          }, this.SILENCE_THRESHOLD);
        }
      } else if (isSpeaking && this.isRecording && this.silenceTimeout) {
        // Cancel silence timer if user starts speaking again
        clearTimeout(this.silenceTimeout);
        this.silenceTimeout = null;
      }

      // Continue checking
      requestAnimationFrame(checkAudioLevel);
    };

    checkAudioLevel();
  }

  /**
   * Start recording audio
   */
  private startRecording(): void {
    if (!this.mediaRecorder || this.isRecording) return;

    this.audioChunks = [];
    this.recordingStartTime = Date.now();
    this.mediaRecorder.start();
    this.isRecording = true;

    console.log('🎙️ Recording started');
  }

  /**
   * Stop recording audio
   */
  private stopRecording(): void {
    if (!this.mediaRecorder || !this.isRecording) return;

    const recordingDuration = Date.now() - this.recordingStartTime;
    
    // Only process if recording is long enough
    if (recordingDuration < this.MIN_RECORDING_TIME) {
      this.audioChunks = [];
      this.isRecording = false;
      return;
    }

    this.mediaRecorder.stop();
    this.isRecording = false;
    this.silenceTimeout = null;

    console.log('🛑 Recording stopped');
  }

  /**
   * Process recorded audio
   */
  private async processRecording(): Promise<void> {
    if (this.audioChunks.length === 0 || this.isProcessing) return;

    this.isProcessing = true;

    try {
      // Create audio blob
      const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
      this.audioChunks = [];

      // Send to backend for STT + Agent Processing + TTS
      const formData = new FormData();
      formData.append('audio', audioBlob, 'audio.webm');
      formData.append('session_id', this.sessionId);

      const response = await fetch(`http://localhost:8000/api/voice/${this.agentId}/process`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Voice processing failed: ${response.statusText}`);
      }

      // Get transcription from headers (if backend sends it)
      const userTranscript = response.headers.get('X-User-Transcript');
      const agentTranscript = response.headers.get('X-Agent-Transcript');

      if (userTranscript) {
        this.callbacks.onTranscript('user', userTranscript);
      }

      if (agentTranscript) {
        this.callbacks.onTranscript('assistant', agentTranscript);
      }

      // Get audio response
      const audioData = await response.blob();
      await this.playAudio(audioData);

    } catch (error) {
      console.error('❌ Voice processing error:', error);
      this.callbacks.onError('Failed to process voice input');
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Play audio response
   */
  private async playAudio(audioBlob: Blob): Promise<void> {
    return new Promise((resolve, reject) => {
      const audio = new Audio(URL.createObjectURL(audioBlob));
      
      audio.onloadedmetadata = () => {
        this.callbacks.onAudioStart();
      };

      audio.onended = () => {
        this.callbacks.onAudioEnd();
        URL.revokeObjectURL(audio.src);
        this.audioQueue.shift();
        
        // Play next in queue
        if (this.audioQueue.length > 0) {
          this.audioQueue[0].play();
        } else {
          this.isPlayingAudio = false;
        }
        
        resolve();
      };

      audio.onerror = (error) => {
        console.error('❌ Audio playback error:', error);
        this.callbacks.onAudioEnd();
        reject(error);
      };

      // Add to queue
      this.audioQueue.push(audio);

      // Play if not already playing
      if (!this.isPlayingAudio) {
        this.isPlayingAudio = true;
        audio.play().catch(reject);
      }
    });
  }

  /**
   * Stop voice session
   */
  stop(): void {
    // Stop recording
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
    }

    // Stop all audio
    this.audioQueue.forEach(audio => {
      audio.pause();
      URL.revokeObjectURL(audio.src);
    });
    this.audioQueue = [];
    this.isPlayingAudio = false;

    // Stop media tracks
    if (this.mediaRecorder && this.mediaRecorder.stream) {
      this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
    }

    // Close audio context
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    // Clear timers
    if (this.silenceTimeout) {
      clearTimeout(this.silenceTimeout);
      this.silenceTimeout = null;
    }

    this.mediaRecorder = null;
    this.isRecording = false;
    this.isProcessing = false;

    console.log('🔴 Voice session stopped');
    this.callbacks.onDisconnect();
  }

  /**
   * Get supported MIME type for recording
   */
  private getSupportedMimeType(): string {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/mp4',
    ];

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }

    return 'audio/webm'; // Fallback
  }

  /**
   * Check if voice is supported
   */
  static isSupported(): boolean {
    return !!(
      navigator.mediaDevices &&
      navigator.mediaDevices.getUserMedia &&
      window.MediaRecorder
    );
  }
}

/**
 * Phone Call Service (for SIP/PSTN calls)
 */
export class PhoneCallService {
  private agentId: string;
  private sessionId: string;
  private config: AgentConfig;
  private ws: WebSocket | null = null;

  constructor(agentId: string, sessionId: string, config: AgentConfig) {
    this.agentId = agentId;
    this.sessionId = sessionId;
    this.config = config;
  }

  /**
   * Initiate outbound call
   */
  async makeCall(phoneNumber: string): Promise<void> {
    try {
      const response = await fetch(`http://localhost:8000/api/voice/${this.agentId}/call`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone_number: phoneNumber,
          session_id: this.sessionId,
          config: this.config,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to initiate call');
      }

      const data = await response.json();
      console.log('📞 Call initiated:', data);
    } catch (error) {
      console.error('❌ Call failed:', error);
      throw error;
    }
  }

  /**
   * Connect to call WebSocket for real-time updates
   */
  connectToCall(callId: string, callbacks: {
    onStatus: (status: string) => void;
    onTranscript: (role: 'user' | 'assistant', text: string) => void;
    onEnd: () => void;
  }): void {
    this.ws = new WebSocket(`ws://localhost:8000/api/voice/call/${callId}`);

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'status') {
        callbacks.onStatus(data.status);
      } else if (data.type === 'transcript') {
        callbacks.onTranscript(data.role, data.text);
      } else if (data.type === 'end') {
        callbacks.onEnd();
      }
    };

    this.ws.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
    };

    this.ws.onclose = () => {
      console.log('🔴 Call WebSocket closed');
      callbacks.onEnd();
    };
  }

  /**
   * Hang up call
   */
  hangup(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}
