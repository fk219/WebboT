/**
 * Agent type definitions for LangGraph-based agents
 */

export interface Agent {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  
  // LLM Configuration
  llm_provider: 'openai' | 'anthropic' | 'google' | 'deepseek';
  llm_model: string;
  system_prompt: string;
  temperature: number;
  max_tokens: number;
  
  // Voice Configuration
  voice_provider?: 'elevenlabs' | 'openai' | 'cartesia';
  voice_id?: string;
  voice_model?: string;
  voice_speed: number;
  voice_temperature: number;
  voice_volume: number;
  
  // Speech Processing
  responsiveness: number;
  interruption_sensitivity: number;
  enable_backchannel: boolean;
  backchannel_words: string[];
  normalize_speech: boolean;
  boosted_keywords: string[];
  
  // Ambient & Environment
  ambient_sound: string;
  ambient_volume: number;
  
  // Call Settings
  max_duration_seconds: number;
  end_after_silence_seconds: number;
  voicemail_detection: boolean;
  voicemail_action: 'hangup' | 'leave_message';
  voicemail_message?: string;
  
  // Transcription
  stt_provider: 'whisper' | 'deepgram';
  stt_mode: 'fast' | 'accurate';
  denoising_mode: 'noise-cancellation' | 'noise-and-background-speech-cancellation';
  
  // Security & Privacy
  pii_redaction_enabled: boolean;
  pii_redaction_list: string[];
  data_storage_policy: 'everything' | 'no-pii' | 'basic-attributes';
  
  // Integration
  webhook_url?: string;
  webhook_timeout_ms: number;
  custom_headers: Record<string, string>;
  
  // MCP Tools
  enabled_mcp_servers: string[];
  
  // Knowledge Base
  knowledge_base_ids: string[];
  
  // Status
  is_published: boolean;
  version: number;
  
  // Full config backup
  config_json: AgentConfig;
  
  // Metadata
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface AgentConfig {
  name: string;
  description?: string;
  llm_provider: string;
  llm_model: string;
  system_prompt: string;
  temperature: number;
  max_tokens: number;
  voice_provider?: string;
  voice_id?: string;
  voice_model?: string;
  voice_speed: number;
  voice_temperature: number;
  voice_volume: number;
  responsiveness: number;
  interruption_sensitivity: number;
  enable_backchannel: boolean;
  backchannel_words: string[];
  normalize_speech: boolean;
  boosted_keywords: string[];
  ambient_sound: string;
  ambient_volume: number;
  max_duration_seconds: number;
  end_after_silence_seconds: number;
  voicemail_detection: boolean;
  voicemail_action: string;
  voicemail_message?: string;
  stt_provider: string;
  stt_mode: string;
  denoising_mode: string;
  pii_redaction_enabled: boolean;
  pii_redaction_list: string[];
  data_storage_policy: string;
  webhook_url?: string;
  webhook_timeout_ms: number;
  custom_headers: Record<string, string>;
  enabled_mcp_servers: string[];
  knowledge_base_ids: string[];
}

export interface AgentCreateInput {
  name: string;
  description?: string;
  config: AgentConfig;
}

export interface AgentUpdateInput {
  name?: string;
  description?: string;
  config?: Partial<AgentConfig>;
}

export interface AgentSession {
  id: string;
  agent_id: string;
  session_id: string;
  channel: 'text' | 'voice' | 'phone';
  call_id?: string;
  phone_number?: string;
  message_count: number;
  duration_seconds: number;
  status: 'active' | 'ended';
  started_at: string;
  ended_at?: string;
}

export interface AgentMessage {
  id: string;
  session_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  audio_url?: string;
  audio_duration_ms?: number;
  tokens_used?: number;
  latency_ms?: number;
  created_at: string;
}
