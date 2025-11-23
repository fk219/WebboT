
import { GoogleGenAI, GenerateContentResponse, LiveServerMessage, Modality } from "@google/genai";
import { AgentConfig, Message } from "../types";
import { supabaseService } from "../src/services/supabaseService";

// Initialize GenAI Client is moved inside functions to ensure API key availability.

const MODEL_NAME = 'gemini-2.5-flash';
const LIVE_MODEL_NAME = 'gemini-2.0-flash-exp';
const TTS_MODEL_NAME = 'gemini-2.5-flash-preview-tts';

const getApiKey = () => {
  // Try multiple sources for the API key
  const key = process.env.API_KEY ||
    process.env.GEMINI_API_KEY ||
    (import.meta.env && import.meta.env.VITE_GEMINI_API_KEY);

  // Debug logging (remove in production)
  console.log('🔑 API Key Check:', {
    hasProcessEnvApiKey: !!process.env.API_KEY,
    hasProcessEnvGeminiKey: !!process.env.GEMINI_API_KEY,
    hasViteEnvKey: !!(import.meta.env && import.meta.env.VITE_GEMINI_API_KEY),
    keyFound: !!key,
    keyLength: key?.length || 0
  });

  if (!key) {
    console.error("❌ VerdantAI: Missing API Key. Please set VITE_GEMINI_API_KEY in .env.local and restart the dev server");
  } else {
    console.log("✅ VerdantAI: API Key loaded successfully");
  }
  return key;
};

/**
 * Simulates the RAG pipeline + Generation.
 */
export const chatWithAgent = async (
  agent: AgentConfig,
  history: Message[],
  userMessage: string,
  userId?: string,
  projectId?: string,
  isTest: boolean = false,
  sessionId?: string
): Promise<Message> => {

  if (userId && projectId) {
    const canProceed = await supabaseService.checkUsageAvailability(userId, projectId, 100); // Pre-flight check (approx 100 tokens)
    if (!canProceed) {
      return {
        id: crypto.randomUUID(),
        role: 'model',
        text: "You have reached your usage limit for this billing cycle. Please upgrade your plan to continue.",
        timestamp: new Date()
      };
    }
  }

  try {
    const apiKey = getApiKey();
    if (!apiKey) throw new Error("Missing API Key");

    const ai = new GoogleGenAI({ apiKey });

    const systemInstruction = `
      You are an AI agent named ${agent.name}.
      TONE & STYLE: ${agent.systemInstruction}
      KNOWLEDGE BASE: ${agent.knowledgeContext || "No specific knowledge base provided."}
    `;

    const chatHistory = history.slice(-6).map(msg => ({
      role: msg.role,
      parts: [{ text: msg.text }]
    }));

    const chat = ai.chats.create({
      model: MODEL_NAME,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
        maxOutputTokens: agent.maxReplyTokens,
      },
      history: chatHistory
    });

    const result: GenerateContentResponse = await chat.sendMessage({
      message: userMessage
    });

    const responseText = result.text || "I'm having trouble connecting to my knowledge base right now.";

    if (userId && projectId) {
      const totalTokens = result.usageMetadata?.totalTokenCount || 100; // Fallback to 100 if undefined
      await supabaseService.recordUsage(userId, projectId, totalTokens, isTest, sessionId);
    }

    const citations = agent.knowledgeContext && agent.knowledgeContext.length > 0
      ? [{ title: "Company Knowledge Base", url: "#" }]
      : [];

    return {
      id: crypto.randomUUID(),
      role: 'model',
      text: responseText,
      citations: citations,
      timestamp: new Date()
    };

  } catch (error) {
    console.error("Gemini API Error:", error);
    return {
      id: crypto.randomUUID(),
      role: 'model',
      text: "I encountered a temporary error processing your request.",
      timestamp: new Date()
    };
  }
};

/**
 * Generates a voice preview using Gemini TTS
 */
export const previewVoice = async (
  config: AgentConfig,
  userId?: string,
  projectId?: string,
  isTest: boolean = false,
  sessionId?: string
): Promise<AudioBuffer | null> => {
  try {
    const apiKey = getApiKey();
    if (!apiKey) {
      console.warn("Preview Voice: Missing API Key, falling back to browser TTS");
      return null;
    }
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: TTS_MODEL_NAME,
      contents: [{ parts: [{ text: `Hello, I am ${config.name}. This is a preview of my voice.` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: config.voice.name }
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) return null;

    // Decode logic
    const binaryString = atob(base64Audio);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    const audioBuffer = await ctx.decodeAudioData(bytes.buffer);

    // Record Usage for Voice Preview (Estimate ~50 tokens)
    if (userId && projectId) {
      await supabaseService.recordUsage(userId, projectId, 50, isTest, sessionId);
    }

    return audioBuffer;
  } catch (e) {
    console.error("Voice Preview Error", e);
    return null;
  }
};

// --- Live API / Audio Handling ---

export class LiveSession {
  private config: AgentConfig;
  private session: any = null;
  private inputAudioContext: AudioContext | null = null;
  private outputAudioContext: AudioContext | null = null;
  private inputSource: MediaStreamAudioSourceNode | null = null;
  private processor: ScriptProcessorNode | null = null;
  private outputNode: GainNode | null = null;
  private nextStartTime: number = 0;
  private activeSources: Set<AudioBufferSourceNode> = new Set();
  private onDisconnect: (error?: string) => void;
  private onTranscript: (role: 'user' | 'model', text: string) => void;
  private mediaStream: MediaStream | null = null;

  // Buffer for partial transcriptions
  private currentInputTranscription = '';
  private currentOutputTranscription = '';

  private userId?: string;
  private projectId?: string;
  private isTest: boolean;
  private sessionId?: string;
  private startTime: number = 0;

  private isConnected: boolean = false;

  constructor(
    config: AgentConfig,
    onDisconnect: (error?: string) => void,
    onTranscript: (role: 'user' | 'model', text: string) => void,
    userId?: string,
    projectId?: string,
    isTest: boolean = false,
    sessionId?: string
  ) {
    this.config = config;
    this.onDisconnect = onDisconnect;
    this.onTranscript = onTranscript;
    this.userId = userId;
    this.projectId = projectId;
    this.isTest = isTest;
    this.sessionId = sessionId;
  }

  async connect() {
    console.log("🎙️ VerdantAI: Starting voice connection...");

    // 1. Request Microphone Permission IMMEDIATELY (User Gesture Context)
    try {
      console.log("🎙️ Requesting microphone access...");
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log("✅ Microphone access granted");
    } catch (err) {
      console.error("❌ Microphone permission failed:", err);
      this.onDisconnect("Microphone access denied. Please allow microphone access to use voice mode.");
      return;
    }

    // 2. Setup Audio Contexts
    console.log("🔊 Setting up audio contexts...");
    this.inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
    this.outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

    if (this.inputAudioContext.state === 'suspended') {
      console.log("▶️ Resuming input audio context...");
      await this.inputAudioContext.resume();
    }
    if (this.outputAudioContext.state === 'suspended') {
      console.log("▶️ Resuming output audio context...");
      await this.outputAudioContext.resume();
    }

    console.log("✅ Audio contexts ready:", {
      inputState: this.inputAudioContext.state,
      outputState: this.outputAudioContext.state
    });

    this.outputNode = this.outputAudioContext.createGain();
    this.outputNode.connect(this.outputAudioContext.destination);

    // 3. Connect to Gemini Live
    try {
      console.log("🔗 Connecting to Gemini Live API...");
      const apiKey = getApiKey();
      if (!apiKey) {
        throw new Error("Missing API Key - Please add VITE_GEMINI_API_KEY to .env.local");
      }

      const ai = new GoogleGenAI({ apiKey });
      console.log("✅ GoogleGenAI client initialized");

      const sessionPromise = ai.live.connect({
        model: LIVE_MODEL_NAME,
        config: {
          responseModalities: [Modality.AUDIO, Modality.TEXT], // Request TEXT as well for stability
          // Request transcription for both input (user) and output (model)
          // inputAudioTranscription: { model: "google-1.0-pro" }, // Removed empty object to prevent errors
          // outputAudioTranscription: { model: "google-1.0-pro" }, // Removed empty object to prevent errors
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: this.getValidVoiceName(this.config.voice.name) } },
          },
          systemInstruction: `You are ${this.config.name}. ${this.config.systemInstruction}. Language: ${this.config.voice.language || 'English'}. Keep responses concise.`,
        },
        callbacks: {
          onopen: async () => {
            console.log("✅ Webbot: Voice Session Opened");
            this.isConnected = true;
            this.startTime = Date.now();
            await this.startInputStreaming(sessionPromise);
          },
          onmessage: async (message: LiveServerMessage) => {
            // Uncomment for detailed message debugging:
            // console.log("📨 Server Message:", message);
            this.handleServerMessage(message);
          },
          onclose: (event: any) => {
            console.log("🔌 Webbot: Voice Session Closed", event); // Log event details
            this.isConnected = false;
            this.flushTranscripts(); // Ensure any remaining text is saved

            // Record Usage (Time-based estimation: ~100 tokens per minute for audio)
            if (this.userId && this.projectId && this.startTime > 0) {
              const durationSeconds = (Date.now() - this.startTime) / 1000;
              const estimatedTokens = Math.ceil(durationSeconds * 2); // Approx 2 tokens per second
              supabaseService.recordUsage(this.userId, this.projectId, estimatedTokens, this.isTest, this.sessionId);
            }

            this.cleanup();
            this.onDisconnect();
          },
          onerror: (err) => {
            console.error("❌ Webbot: Voice Session Error", err);
            this.isConnected = false;
            this.cleanup();
            this.onDisconnect("Connection error occurred. Please check your internet connection and try again.");
          }
        }
      });

      this.session = sessionPromise;
      console.log("✅ Voice session connection initiated");
    } catch (err: any) {
      console.error("❌ Webbot: Connection Failed", err);
      console.error("Error details:", {
        message: err.message,
        stack: err.stack,
        name: err.name
      });
      this.cleanup();
      this.onDisconnect(`Connection failed: ${err.message || "Unknown error"}. Please check console for details.`);
    }
  }

  private async startInputStreaming(sessionPromise: Promise<any>) {
    if (!this.inputAudioContext || !this.mediaStream) return;

    try {
      this.inputSource = this.inputAudioContext.createMediaStreamSource(this.mediaStream);
      this.processor = this.inputAudioContext.createScriptProcessor(4096, 1, 1);

      this.processor.onaudioprocess = (e) => {
        if (!this.isConnected) return; // Stop processing if disconnected

        const inputData = e.inputBuffer.getChannelData(0);
        const pcmData = this.floatTo16BitPCM(inputData);
        const base64 = this.arrayBufferToBase64(pcmData);

        sessionPromise.then(async (session) => {
          if (!this.isConnected) return; // Double check inside promise
          try {
            await session.sendRealtimeInput({
              media: {
                mimeType: 'audio/pcm;rate=16000',
                data: base64
              }
            });
          } catch (sendErr: any) {
            // Ignore errors if we are already closing or if it's the specific WebSocket error
            const errorMessage = sendErr?.message || String(sendErr);
            if (this.isConnected && !errorMessage.includes('CLOSING or CLOSED')) {
              console.error("⚠️ Error sending audio frame:", sendErr);
            }
          }
        }).catch(err => {
          if (this.isConnected) {
            console.error("⚠️ Session promise error in audio process:", err);
          }
        });
      };

      this.inputSource.connect(this.processor);
      this.processor.connect(this.inputAudioContext.destination);
    } catch (err) {
      console.error("Audio streaming setup failed:", err);
      this.disconnect();
    }
  }

  private async handleServerMessage(message: LiveServerMessage) {
    const serverContent = message.serverContent;

    // 1. Handle Transcription
    if (serverContent?.inputTranscription) {
      // User is speaking
      this.currentInputTranscription += serverContent.inputTranscription.text;
    }

    if (serverContent?.outputTranscription) {
      // Model is speaking
      this.currentOutputTranscription += serverContent.outputTranscription.text;
    }

    // Check for turn completion to commit transcript to history
    if (serverContent?.turnComplete) {
      this.flushTranscripts();
    }

    // 2. Handle Interruption
    if (serverContent?.interrupted) {
      this.stopAllAudio();
      this.nextStartTime = 0;
      this.currentOutputTranscription = ''; // Discard interrupted speech text
      return;
    }

    // 3. Handle Audio Output
    const base64Audio = serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
    if (base64Audio && this.outputAudioContext && this.outputNode) {
      const audioData = this.base64ToArrayBuffer(base64Audio);
      const audioBuffer = await this.decodeAudioData(
        audioData,
        this.outputAudioContext,
        24000,
        1
      );

      this.nextStartTime = Math.max(this.nextStartTime, this.outputAudioContext.currentTime);

      const source = this.outputAudioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.outputNode);
      source.start(this.nextStartTime);

      this.nextStartTime += audioBuffer.duration;

      this.activeSources.add(source);
      source.onended = () => this.activeSources.delete(source);
    }
  }

  // Helper to flush incomplete transcripts to history
  private flushTranscripts() {
    if (this.currentInputTranscription.trim()) {
      this.onTranscript('user', this.currentInputTranscription.trim());
      this.currentInputTranscription = '';
    }
    if (this.currentOutputTranscription.trim()) {
      this.onTranscript('model', this.currentOutputTranscription.trim());
      this.currentOutputTranscription = '';
    }
  }

  private stopAllAudio() {
    this.activeSources.forEach(source => {
      try { source.stop(); } catch (e) { }
    });
    this.activeSources.clear();
  }

  disconnect() {
    if (this.session) {
      this.session.then((s: any) => s.close());
    }
    // Don't cleanup immediately here, wait for onclose callback which calls flushTranscripts
  }

  private cleanup() {
    this.stopAllAudio();

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }

    this.inputSource?.disconnect();
    this.processor?.disconnect();
    this.inputAudioContext?.close();
    this.outputAudioContext?.close();

    this.inputSource = null;
    this.processor = null;
    this.inputAudioContext = null;
    this.outputAudioContext = null;
  }

  // --- Utils for Audio Encoding/Decoding ---

  private floatTo16BitPCM(float32Array: Float32Array): ArrayBuffer {
    const buffer = new ArrayBuffer(float32Array.length * 2);
    const view = new DataView(buffer);
    for (let i = 0; i < float32Array.length; i++) {
      let s = Math.max(-1, Math.min(1, float32Array[i]));
      view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7FFF, true); // Little endian
    }
    return buffer;
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private base64ToArrayBuffer(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  private async decodeAudioData(
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number
  ): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  }
  private getValidVoiceName(voiceName?: string): string {
    const validVoices = ['Puck', 'Charon', 'Kore', 'Fenrir', 'Aoede'];
    if (voiceName && validVoices.includes(voiceName)) {
      return voiceName;
    }

    // Map OpenAI voices to Gemini equivalents
    const mapping: Record<string, string> = {
      'Alloy': 'Puck',
      'Echo': 'Fenrir',
      'Fable': 'Charon',
      'Onyx': 'Fenrir',
      'Nova': 'Aoede',
      'Shimmer': 'Aoede'
    };

    if (voiceName && mapping[voiceName]) {
      console.log(`⚠️ Mapped invalid voice '${voiceName}' to '${mapping[voiceName]}'`);
      return mapping[voiceName];
    }

    console.warn(`⚠️ Unknown voice '${voiceName}', defaulting to 'Kore'`);
    return 'Kore';
  }
}
