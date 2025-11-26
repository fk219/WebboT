/**
 * Agent Create/Edit Page
 * Comprehensive configuration with tabs
 */

import { useState, useEffect } from 'react';
import { ArrowLeft, Save, Eye, AlertTriangle } from 'lucide-react';

interface AgentConfig {
  name: string;
  description: string;
  llm_provider: string;
  llm_model: string;
  system_prompt: string;
  temperature: number;
  max_tokens: number;
  voice_provider?: string;
  voice_id?: string;
  voice_model?: string;
  voice_speed?: number;
  voice_temperature?: number;
  voice_volume?: number;
  stt_provider?: string;
  stt_mode?: string;
  denoising_mode?: string;
  responsiveness?: number;
  interruption_sensitivity?: number;
  enable_backchannel?: boolean;
  backchannel_words?: string[];
  normalize_speech?: boolean;
  boosted_keywords?: string[];
  ambient_sound?: string;
  ambient_volume?: number;
  knowledge_base_ids?: string[];
  enabled_mcp_servers?: string[];
  webhook_url?: string;
  webhook_timeout_ms?: number;
  custom_headers?: Record<string, string>;
  pii_redaction_enabled?: boolean;
  pii_redaction_list?: string[];
  data_storage_policy?: string;
  max_duration_seconds?: number;
  end_after_silence_seconds?: number;
  voicemail_detection?: boolean;
  voicemail_action?: string;
  voicemail_message?: string;
}

const DEFAULT_CONFIG: AgentConfig = {
  name: '',
  description: '',
  llm_provider: 'openai',
  llm_model: 'gpt-4o-mini',
  system_prompt: '',
  temperature: 0.7,
  max_tokens: 1000,
  voice_provider: 'elevenlabs',
  voice_id: '',
  voice_model: 'eleven_turbo_v2',
  voice_speed: 1.0,
  voice_temperature: 1.0,
  voice_volume: 1.0,
  responsiveness: 1.0,
  interruption_sensitivity: 1.0,
  enable_backchannel: true,
  backchannel_words: ['mm-hmm', 'yeah', 'uh-huh'],
  normalize_speech: true,
  boosted_keywords: [],
  ambient_sound: 'none',
  ambient_volume: 0.5,
  max_duration_seconds: 1800,
  end_after_silence_seconds: 600,
  voicemail_detection: false,
  voicemail_action: 'hangup',
  stt_provider: 'whisper',
  stt_mode: 'fast',
  denoising_mode: 'noise-cancellation',
  pii_redaction_enabled: false,
  pii_redaction_list: [],
  data_storage_policy: 'everything',
  webhook_timeout_ms: 5000,
  custom_headers: {},
  enabled_mcp_servers: [],
  knowledge_base_ids: [],
};

type TabType = 'basic' | 'llm' | 'voice' | 'speech' | 'knowledge' | 'tools' | 'security';

interface AgentCreatePageProps {
  agentId?: string;
  onNavigate: (view: 'list' | 'create' | 'edit' | 'preview', agentId?: string) => void;
}

export default function AgentCreatePage({ agentId, onNavigate }: AgentCreatePageProps) {
  const isEditing = !!agentId;
  const [isLoading, setIsLoading] = useState(false);

  const [activeTab, setActiveTab] = useState<TabType>('basic');
  const [config, setConfig] = useState<AgentConfig>(DEFAULT_CONFIG);
  const [errors, setErrors] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // TODO: Load existing agent data from context if editing
  useEffect(() => {
    if (isEditing && agentId) {
      // Load agent config from context
      setIsLoading(true);
      // Simulate loading
      setTimeout(() => setIsLoading(false), 500);
    }
  }, [isEditing, agentId]);

  const validateConfig = (): string[] => {
    const validationErrors: string[] = [];

    if (!config.name.trim()) {
      validationErrors.push('Agent name is required');
    }
    if (!config.system_prompt.trim()) {
      validationErrors.push('System prompt is required');
    }
    if (config.voice_provider && !config.voice_id) {
      validationErrors.push('Voice ID is required when voice is enabled');
    }

    return validationErrors;
  };

  const handleSave = async () => {
    const validationErrors = validateConfig();
    setErrors(validationErrors);

    if (validationErrors.length > 0) {
      return;
    }

    setIsSaving(true);

    try {
      // TODO: Implement save via context/API
      console.log('Saving agent:', config);
      alert(isEditing ? 'Agent updated successfully!' : 'Agent created successfully!');
      onNavigate('list');
    } catch (error) {
      console.error('Failed to save agent:', error);
      alert('Failed to save agent. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const updateConfig = (updates: Partial<AgentConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading agent...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => onNavigate('list')}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {isEditing ? 'Edit Agent' : 'Create Agent'}
                </h1>
                <p className="mt-1 text-gray-600">
                  Configure your LangGraph-powered AI agent
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {isEditing && agentId && (
                <button
                  onClick={() => onNavigate('preview', agentId)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </button>
              )}
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save Agent'}
              </button>
            </div>
          </div>
        </div>

        {/* Validation Errors */}
        {errors.length > 0 && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-red-800">
                  Please fix the following errors:
                </h3>
                <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
                  {errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {[
                { id: 'basic', label: 'Basic' },
                { id: 'llm', label: 'LLM' },
                { id: 'voice', label: 'Voice' },
                { id: 'speech', label: 'Speech' },
                { id: 'knowledge', label: 'Knowledge' },
                { id: 'tools', label: 'Tools' },
                { id: 'security', label: 'Security' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'basic' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Agent Name *
                  </label>
                  <input
                    type="text"
                    value={config.name}
                    onChange={(e) => updateConfig({ name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="My AI Agent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={config.description}
                    onChange={(e) => updateConfig({ description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Describe what this agent does..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    System Prompt *
                  </label>
                  <textarea
                    value={config.system_prompt}
                    onChange={(e) => updateConfig({ system_prompt: e.target.value })}
                    rows={6}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                    placeholder="You are a helpful AI assistant..."
                  />
                </div>
              </div>
            )}
            {activeTab === 'llm' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    LLM Provider
                  </label>
                  <select
                    value={config.llm_provider}
                    onChange={(e) => updateConfig({ llm_provider: e.target.value as any })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="openai">OpenAI</option>
                    <option value="anthropic">Anthropic</option>
                    <option value="google">Google</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Model
                  </label>
                  <input
                    type="text"
                    value={config.llm_model}
                    onChange={(e) => updateConfig({ llm_model: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="gpt-4o-mini"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Temperature: {config.temperature}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.1"
                    value={config.temperature}
                    onChange={(e) => updateConfig({ temperature: parseFloat(e.target.value) })}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Tokens
                  </label>
                  <input
                    type="number"
                    value={config.max_tokens}
                    onChange={(e) => updateConfig({ max_tokens: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            )}
            {activeTab === 'voice' && (
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <h3 className="text-sm font-semibold text-blue-900 mb-2">🎙️ Voice Configuration</h3>
                  <p className="text-sm text-blue-700">Configure Text-to-Speech (TTS) settings for voice responses</p>
                </div>

                {/* Voice Provider */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Voice Provider
                  </label>
                  <select
                    value={config.voice_provider || 'elevenlabs'}
                    onChange={(e) => updateConfig({ voice_provider: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="elevenlabs">ElevenLabs (Recommended)</option>
                    <option value="openai">OpenAI TTS</option>
                    <option value="google">Google Cloud TTS</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    {config.voice_provider === 'elevenlabs' && 'High-quality, natural-sounding voices'}
                    {config.voice_provider === 'openai' && 'Fast, reliable TTS from OpenAI'}
                    {config.voice_provider === 'google' && 'Wide language support from Google'}
                  </p>
                </div>

                {/* Voice ID/Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Voice ID {config.voice_provider === 'elevenlabs' && '(ElevenLabs Voice ID)'}
                  </label>
                  <input
                    type="text"
                    value={config.voice_id || ''}
                    onChange={(e) => updateConfig({ voice_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={
                      config.voice_provider === 'elevenlabs' 
                        ? '21m00Tcm4TlvDq8ikWAM' 
                        : config.voice_provider === 'openai'
                        ? 'alloy, echo, fable, onyx, nova, shimmer'
                        : 'en-US-Standard-A'
                    }
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {config.voice_provider === 'elevenlabs' && 'Get voice IDs from ElevenLabs dashboard'}
                    {config.voice_provider === 'openai' && 'Choose from: alloy, echo, fable, onyx, nova, shimmer'}
                    {config.voice_provider === 'google' && 'Format: language-region-voice (e.g., en-US-Standard-A)'}
                  </p>
                </div>

                {/* Voice Model */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Voice Model
                  </label>
                  <select
                    value={config.voice_model || 'eleven_turbo_v2'}
                    onChange={(e) => updateConfig({ voice_model: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {config.voice_provider === 'elevenlabs' && (
                      <>
                        <option value="eleven_turbo_v2">Eleven Turbo v2 (Fastest)</option>
                        <option value="eleven_multilingual_v2">Eleven Multilingual v2</option>
                        <option value="eleven_monolingual_v1">Eleven Monolingual v1</option>
                      </>
                    )}
                    {config.voice_provider === 'openai' && (
                      <>
                        <option value="tts-1">TTS-1 (Fast)</option>
                        <option value="tts-1-hd">TTS-1 HD (High Quality)</option>
                      </>
                    )}
                    {config.voice_provider === 'google' && (
                      <>
                        <option value="standard">Standard</option>
                        <option value="wavenet">WaveNet (Premium)</option>
                        <option value="neural2">Neural2 (Latest)</option>
                      </>
                    )}
                  </select>
                </div>

                {/* Voice Speed */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Voice Speed: {config.voice_speed?.toFixed(1) || '1.0'}x
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="2.0"
                    step="0.1"
                    value={config.voice_speed || 1.0}
                    onChange={(e) => updateConfig({ voice_speed: parseFloat(e.target.value) })}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Slower (0.5x)</span>
                    <span>Normal (1.0x)</span>
                    <span>Faster (2.0x)</span>
                  </div>
                </div>

                {/* Voice Temperature (ElevenLabs only) */}
                {config.voice_provider === 'elevenlabs' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Voice Stability: {config.voice_temperature?.toFixed(1) || '1.0'}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={config.voice_temperature || 1.0}
                      onChange={(e) => updateConfig({ voice_temperature: parseFloat(e.target.value) })}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>More Variable</span>
                      <span>More Stable</span>
                    </div>
                  </div>
                )}

                {/* Voice Volume */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Volume: {Math.round((config.voice_volume || 1.0) * 100)}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.1"
                    value={config.voice_volume || 1.0}
                    onChange={(e) => updateConfig({ voice_volume: parseFloat(e.target.value) })}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Quiet (0%)</span>
                    <span>Normal (100%)</span>
                    <span>Loud (200%)</span>
                  </div>
                </div>

                {/* Test Voice Button */}
                <div className="pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    onClick={() => alert('Voice preview will play a sample with your settings')}
                  >
                    🔊 Test Voice
                  </button>
                  <p className="text-xs text-gray-500 text-center mt-2">
                    Preview how your agent will sound
                  </p>
                </div>
              </div>
            )}
            {activeTab === 'speech' && (
              <div className="space-y-6">
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
                  <h3 className="text-sm font-semibold text-purple-900 mb-2">🎤 Speech Processing</h3>
                  <p className="text-sm text-purple-700">Configure Speech-to-Text (STT) and conversation behavior</p>
                </div>

                {/* STT Provider */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Speech-to-Text Provider
                  </label>
                  <select
                    value={config.stt_provider || 'whisper'}
                    onChange={(e) => updateConfig({ stt_provider: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="whisper">OpenAI Whisper (Recommended)</option>
                    <option value="deepgram">Deepgram (Real-time)</option>
                    <option value="google">Google Cloud STT</option>
                    <option value="azure">Azure Speech</option>
                  </select>
                </div>

                {/* STT Mode */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Transcription Mode
                  </label>
                  <select
                    value={config.stt_mode || 'fast'}
                    onChange={(e) => updateConfig({ stt_mode: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="fast">Fast (Lower accuracy)</option>
                    <option value="accurate">Accurate (Slower)</option>
                    <option value="streaming">Streaming (Real-time)</option>
                  </select>
                </div>

                {/* Denoising */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Audio Denoising
                  </label>
                  <select
                    value={config.denoising_mode || 'noise-cancellation'}
                    onChange={(e) => updateConfig({ denoising_mode: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="none">None</option>
                    <option value="light">Light</option>
                    <option value="noise-cancellation">Noise Cancellation</option>
                    <option value="aggressive">Aggressive</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Remove background noise from user audio
                  </p>
                </div>

                {/* Responsiveness */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Responsiveness: {config.responsiveness?.toFixed(1) || '1.0'}
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="2.0"
                    step="0.1"
                    value={config.responsiveness || 1.0}
                    onChange={(e) => updateConfig({ responsiveness: parseFloat(e.target.value) })}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Slower (0.5x)</span>
                    <span>Normal (1.0x)</span>
                    <span>Faster (2.0x)</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    How quickly the agent responds after user stops speaking
                  </p>
                </div>

                {/* Interruption Sensitivity */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Interruption Sensitivity: {config.interruption_sensitivity?.toFixed(1) || '1.0'}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.1"
                    value={config.interruption_sensitivity || 1.0}
                    onChange={(e) => updateConfig({ interruption_sensitivity: parseFloat(e.target.value) })}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Less Sensitive</span>
                    <span>More Sensitive</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    How easily user can interrupt the agent while speaking
                  </p>
                </div>

                {/* Enable Backchannel */}
                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id="enable_backchannel"
                    checked={config.enable_backchannel ?? true}
                    onChange={(e) => updateConfig({ enable_backchannel: e.target.checked })}
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <div className="flex-1">
                    <label htmlFor="enable_backchannel" className="text-sm font-medium text-gray-700">
                      Enable Backchannel Responses
                    </label>
                    <p className="text-xs text-gray-500 mt-1">
                      Agent says "mm-hmm", "yeah", etc. while user is speaking to show it's listening
                    </p>
                  </div>
                </div>

                {/* Backchannel Words */}
                {config.enable_backchannel && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Backchannel Words (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={Array.isArray(config.backchannel_words) ? config.backchannel_words.join(', ') : 'mm-hmm, yeah, uh-huh'}
                      onChange={(e) => updateConfig({ 
                        backchannel_words: e.target.value.split(',').map(w => w.trim()).filter(Boolean)
                      })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="mm-hmm, yeah, uh-huh, I see, okay"
                    />
                  </div>
                )}

                {/* Normalize Speech */}
                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id="normalize_speech"
                    checked={config.normalize_speech ?? true}
                    onChange={(e) => updateConfig({ normalize_speech: e.target.checked })}
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <div className="flex-1">
                    <label htmlFor="normalize_speech" className="text-sm font-medium text-gray-700">
                      Normalize Speech
                    </label>
                    <p className="text-xs text-gray-500 mt-1">
                      Clean up transcription (remove filler words, fix grammar)
                    </p>
                  </div>
                </div>

                {/* Boosted Keywords */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Boosted Keywords (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={Array.isArray(config.boosted_keywords) ? config.boosted_keywords.join(', ') : ''}
                    onChange={(e) => updateConfig({ 
                      boosted_keywords: e.target.value.split(',').map(w => w.trim()).filter(Boolean)
                    })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="product names, technical terms, etc."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Keywords to prioritize in transcription (improves accuracy for specific terms)
                  </p>
                </div>

                {/* Ambient Sound */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ambient Background Sound
                  </label>
                  <select
                    value={config.ambient_sound || 'none'}
                    onChange={(e) => updateConfig({ ambient_sound: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="none">None</option>
                    <option value="office">Office</option>
                    <option value="cafe">Cafe</option>
                    <option value="nature">Nature</option>
                    <option value="white-noise">White Noise</option>
                  </select>
                </div>

                {/* Ambient Volume */}
                {config.ambient_sound !== 'none' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ambient Volume: {Math.round((config.ambient_volume || 0.5) * 100)}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={config.ambient_volume || 0.5}
                      onChange={(e) => updateConfig({ ambient_volume: parseFloat(e.target.value) })}
                      className="w-full"
                    />
                  </div>
                )}
              </div>
            )}
            {activeTab === 'knowledge' && (
              <div className="space-y-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                  <h3 className="text-sm font-semibold text-green-900 mb-2">📚 Knowledge Base</h3>
                  <p className="text-sm text-green-700">Upload documents and configure RAG (Retrieval-Augmented Generation)</p>
                </div>

                {/* Document Upload */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
                  <input
                    type="file"
                    id="document-upload"
                    multiple
                    accept=".pdf,.txt,.doc,.docx,.md"
                    className="hidden"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      alert(`Selected ${files.length} file(s): ${files.map(f => f.name).join(', ')}`);
                    }}
                  />
                  <label htmlFor="document-upload" className="cursor-pointer">
                    <div className="text-gray-400 mb-4">
                      <svg className="mx-auto h-12 w-12" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      <span className="text-blue-600 font-medium">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">
                      PDF, TXT, DOC, DOCX, MD (Max 10MB per file)
                    </p>
                  </label>
                </div>

                {/* Uploaded Documents List */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Uploaded Documents
                  </label>
                  <div className="border border-gray-200 rounded-lg divide-y divide-gray-200">
                    {(config.knowledge_base_ids && config.knowledge_base_ids.length > 0) ? (
                      config.knowledge_base_ids.map((id: string, index: number) => (
                        <div key={index} className="p-3 flex items-center justify-between hover:bg-gray-50">
                          <div className="flex items-center space-x-3">
                            <div className="text-blue-600">📄</div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">Document {index + 1}</p>
                              <p className="text-xs text-gray-500">ID: {id}</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const newIds = config.knowledge_base_ids.filter((_: any, i: number) => i !== index);
                              updateConfig({ knowledge_base_ids: newIds });
                            }}
                            className="text-red-600 hover:text-red-700 text-sm"
                          >
                            Remove
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center text-gray-500 text-sm">
                        No documents uploaded yet
                      </div>
                    )}
                  </div>
                </div>

                {/* URL Scraping */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Scrape Website Content
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="url"
                      placeholder="https://example.com"
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      type="button"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      onClick={() => alert('URL scraping will extract content from the website')}
                    >
                      Scrape
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Extract and index content from a website
                  </p>
                </div>

                {/* RAG Settings */}
                <div className="pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-900 mb-4">RAG Configuration</h4>
                  
                  {/* Chunk Size */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Chunk Size: 1000 tokens
                    </label>
                    <input
                      type="range"
                      min="200"
                      max="2000"
                      step="100"
                      defaultValue="1000"
                      className="w-full"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Size of text chunks for retrieval
                    </p>
                  </div>

                  {/* Chunk Overlap */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Chunk Overlap: 200 tokens
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="500"
                      step="50"
                      defaultValue="200"
                      className="w-full"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Overlap between chunks to maintain context
                    </p>
                  </div>

                  {/* Top K Results */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Top K Results
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      defaultValue="5"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Number of relevant chunks to retrieve
                    </p>
                  </div>

                  {/* Similarity Threshold */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Similarity Threshold: 0.7
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      defaultValue="0.7"
                      className="w-full"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Minimum similarity score for retrieval
                    </p>
                  </div>
                </div>
              </div>
            )}
            {activeTab === 'tools' && (
              <div className="space-y-6">
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
                  <h3 className="text-sm font-semibold text-orange-900 mb-2">🛠️ Tools & Integrations</h3>
                  <p className="text-sm text-orange-700">Enable MCP servers and custom tools for your agent</p>
                </div>

                {/* MCP Servers */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Model Context Protocol (MCP) Servers</h4>
                  <p className="text-xs text-gray-500 mb-4">
                    MCP servers provide tools and data sources for your agent
                  </p>

                  <div className="space-y-3">
                    {/* Google Search */}
                    <div className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3 flex-1">
                          <input
                            type="checkbox"
                            id="mcp-google-search"
                            checked={config.enabled_mcp_servers?.includes('google-search') || false}
                            onChange={(e) => {
                              const servers = config.enabled_mcp_servers || [];
                              updateConfig({
                                enabled_mcp_servers: e.target.checked
                                  ? [...servers, 'google-search']
                                  : servers.filter(s => s !== 'google-search')
                              });
                            }}
                            className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <div className="flex-1">
                            <label htmlFor="mcp-google-search" className="text-sm font-medium text-gray-900 cursor-pointer">
                              🔍 Google Search
                            </label>
                            <p className="text-xs text-gray-500 mt-1">
                              Search the web for real-time information
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Weather */}
                    <div className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3 flex-1">
                          <input
                            type="checkbox"
                            id="mcp-weather"
                            checked={config.enabled_mcp_servers?.includes('weather') || false}
                            onChange={(e) => {
                              const servers = config.enabled_mcp_servers || [];
                              updateConfig({
                                enabled_mcp_servers: e.target.checked
                                  ? [...servers, 'weather']
                                  : servers.filter(s => s !== 'weather')
                              });
                            }}
                            className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <div className="flex-1">
                            <label htmlFor="mcp-weather" className="text-sm font-medium text-gray-900 cursor-pointer">
                              🌤️ Weather
                            </label>
                            <p className="text-xs text-gray-500 mt-1">
                              Get current weather and forecasts
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Calculator */}
                    <div className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3 flex-1">
                          <input
                            type="checkbox"
                            id="mcp-calculator"
                            checked={config.enabled_mcp_servers?.includes('calculator') || false}
                            onChange={(e) => {
                              const servers = config.enabled_mcp_servers || [];
                              updateConfig({
                                enabled_mcp_servers: e.target.checked
                                  ? [...servers, 'calculator']
                                  : servers.filter(s => s !== 'calculator')
                              });
                            }}
                            className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <div className="flex-1">
                            <label htmlFor="mcp-calculator" className="text-sm font-medium text-gray-900 cursor-pointer">
                              🔢 Calculator
                            </label>
                            <p className="text-xs text-gray-500 mt-1">
                              Perform mathematical calculations
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Database */}
                    <div className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3 flex-1">
                          <input
                            type="checkbox"
                            id="mcp-database"
                            checked={config.enabled_mcp_servers?.includes('database') || false}
                            onChange={(e) => {
                              const servers = config.enabled_mcp_servers || [];
                              updateConfig({
                                enabled_mcp_servers: e.target.checked
                                  ? [...servers, 'database']
                                  : servers.filter(s => s !== 'database')
                              });
                            }}
                            className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <div className="flex-1">
                            <label htmlFor="mcp-database" className="text-sm font-medium text-gray-900 cursor-pointer">
                              🗄️ Database Query
                            </label>
                            <p className="text-xs text-gray-500 mt-1">
                              Query your database with natural language
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Email */}
                    <div className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3 flex-1">
                          <input
                            type="checkbox"
                            id="mcp-email"
                            checked={config.enabled_mcp_servers?.includes('email') || false}
                            onChange={(e) => {
                              const servers = config.enabled_mcp_servers || [];
                              updateConfig({
                                enabled_mcp_servers: e.target.checked
                                  ? [...servers, 'email']
                                  : servers.filter(s => s !== 'email')
                              });
                            }}
                            className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <div className="flex-1">
                            <label htmlFor="mcp-email" className="text-sm font-medium text-gray-900 cursor-pointer">
                              📧 Email
                            </label>
                            <p className="text-xs text-gray-500 mt-1">
                              Send emails on behalf of users
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Calendar */}
                    <div className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3 flex-1">
                          <input
                            type="checkbox"
                            id="mcp-calendar"
                            checked={config.enabled_mcp_servers?.includes('calendar') || false}
                            onChange={(e) => {
                              const servers = config.enabled_mcp_servers || [];
                              updateConfig({
                                enabled_mcp_servers: e.target.checked
                                  ? [...servers, 'calendar']
                                  : servers.filter(s => s !== 'calendar')
                              });
                            }}
                            className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <div className="flex-1">
                            <label htmlFor="mcp-calendar" className="text-sm font-medium text-gray-900 cursor-pointer">
                              📅 Calendar
                            </label>
                            <p className="text-xs text-gray-500 mt-1">
                              Manage calendar events and schedules
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Custom Webhooks */}
                <div className="pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Custom Webhooks</h4>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Webhook URL
                    </label>
                    <input
                      type="url"
                      value={config.webhook_url || ''}
                      onChange={(e) => updateConfig({ webhook_url: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="https://api.example.com/webhook"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Send agent events to your custom endpoint
                    </p>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Webhook Timeout (ms)
                    </label>
                    <input
                      type="number"
                      value={config.webhook_timeout_ms || 5000}
                      onChange={(e) => updateConfig({ webhook_timeout_ms: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="1000"
                      max="30000"
                      step="1000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Custom Headers (JSON)
                    </label>
                    <textarea
                      value={JSON.stringify(config.custom_headers || {}, null, 2)}
                      onChange={(e) => {
                        try {
                          updateConfig({ custom_headers: JSON.parse(e.target.value) });
                        } catch (err) {
                          // Invalid JSON, ignore
                        }
                      }}
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                      placeholder='{\n  "Authorization": "Bearer token",\n  "X-Custom-Header": "value"\n}'
                    />
                  </div>
                </div>
              </div>
            )}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <h3 className="text-sm font-semibold text-red-900 mb-2">🔒 Security & Privacy</h3>
                  <p className="text-sm text-red-700">Configure data protection and privacy settings</p>
                </div>

                {/* PII Redaction */}
                <div>
                  <div className="flex items-start space-x-3 mb-4">
                    <input
                      type="checkbox"
                      id="pii_redaction_enabled"
                      checked={config.pii_redaction_enabled || false}
                      onChange={(e) => updateConfig({ pii_redaction_enabled: e.target.checked })}
                      className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <div className="flex-1">
                      <label htmlFor="pii_redaction_enabled" className="text-sm font-medium text-gray-900">
                        Enable PII Redaction
                      </label>
                      <p className="text-xs text-gray-500 mt-1">
                        Automatically detect and redact personally identifiable information
                      </p>
                    </div>
                  </div>

                  {config.pii_redaction_enabled && (
                    <div className="ml-7 space-y-3">
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        Select PII types to redact:
                      </p>
                      
                      {[
                        { id: 'email', label: 'Email Addresses', example: 'user@example.com' },
                        { id: 'phone', label: 'Phone Numbers', example: '+1 (555) 123-4567' },
                        { id: 'ssn', label: 'Social Security Numbers', example: '123-45-6789' },
                        { id: 'credit_card', label: 'Credit Card Numbers', example: '4111-1111-1111-1111' },
                        { id: 'address', label: 'Physical Addresses', example: '123 Main St, City, State' },
                        { id: 'name', label: 'Person Names', example: 'John Doe' },
                        { id: 'date_of_birth', label: 'Dates of Birth', example: '01/01/1990' },
                        { id: 'ip_address', label: 'IP Addresses', example: '192.168.1.1' },
                        { id: 'passport', label: 'Passport Numbers', example: 'A12345678' },
                        { id: 'driver_license', label: 'Driver License Numbers', example: 'D1234567' },
                      ].map((pii) => (
                        <div key={pii.id} className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                          <input
                            type="checkbox"
                            id={`pii-${pii.id}`}
                            checked={config.pii_redaction_list?.includes(pii.id) || false}
                            onChange={(e) => {
                              const list = config.pii_redaction_list || [];
                              updateConfig({
                                pii_redaction_list: e.target.checked
                                  ? [...list, pii.id]
                                  : list.filter(item => item !== pii.id)
                              });
                            }}
                            className="mt-0.5 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <div className="flex-1">
                            <label htmlFor={`pii-${pii.id}`} className="text-sm font-medium text-gray-900 cursor-pointer">
                              {pii.label}
                            </label>
                            <p className="text-xs text-gray-500">Example: {pii.example}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Data Storage Policy */}
                <div className="pt-4 border-t border-gray-200">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data Storage Policy
                  </label>
                  <select
                    value={config.data_storage_policy || 'everything'}
                    onChange={(e) => updateConfig({ data_storage_policy: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="everything">Store Everything</option>
                    <option value="no-pii">Store Everything Except PII</option>
                    <option value="metadata-only">Store Metadata Only</option>
                    <option value="nothing">Don't Store Anything</option>
                  </select>
                  <div className="mt-2 text-xs text-gray-500 space-y-1">
                    <p><strong>Everything:</strong> Store all conversation data including messages and metadata</p>
                    <p><strong>No PII:</strong> Store conversations but redact PII before storage</p>
                    <p><strong>Metadata Only:</strong> Store only timestamps, token counts, no message content</p>
                    <p><strong>Nothing:</strong> Don't store any data (analytics will be limited)</p>
                  </div>
                </div>

                {/* Call Settings */}
                <div className="pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-900 mb-4">Call & Session Settings</h4>
                  
                  <div className="space-y-4">
                    {/* Max Duration */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Maximum Call Duration (seconds)
                      </label>
                      <input
                        type="number"
                        value={config.max_duration_seconds || 1800}
                        onChange={(e) => updateConfig({ max_duration_seconds: parseInt(e.target.value) })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        min="60"
                        max="7200"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Default: 1800 seconds (30 minutes)
                      </p>
                    </div>

                    {/* End After Silence */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        End After Silence (seconds)
                      </label>
                      <input
                        type="number"
                        value={config.end_after_silence_seconds || 600}
                        onChange={(e) => updateConfig({ end_after_silence_seconds: parseInt(e.target.value) })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        min="30"
                        max="1800"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Automatically end call after this many seconds of silence
                      </p>
                    </div>

                    {/* Voicemail Detection */}
                    <div className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        id="voicemail_detection"
                        checked={config.voicemail_detection || false}
                        onChange={(e) => updateConfig({ voicemail_detection: e.target.checked })}
                        className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <div className="flex-1">
                        <label htmlFor="voicemail_detection" className="text-sm font-medium text-gray-900">
                          Enable Voicemail Detection
                        </label>
                        <p className="text-xs text-gray-500 mt-1">
                          Detect when call goes to voicemail
                        </p>
                      </div>
                    </div>

                    {/* Voicemail Action */}
                    {config.voicemail_detection && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Voicemail Action
                          </label>
                          <select
                            value={config.voicemail_action || 'hangup'}
                            onChange={(e) => updateConfig({ voicemail_action: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="hangup">Hang Up</option>
                            <option value="leave-message">Leave Message</option>
                          </select>
                        </div>

                        {config.voicemail_action === 'leave-message' && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Voicemail Message
                            </label>
                            <textarea
                              value={config.voicemail_message || ''}
                              onChange={(e) => updateConfig({ voicemail_message: e.target.value })}
                              rows={3}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="Hi, this is [Agent Name]. Please call back or leave a message..."
                            />
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Rate Limiting */}
                <div className="pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-900 mb-4">Rate Limiting</h4>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Max Requests per User (per hour)
                      </label>
                      <input
                        type="number"
                        defaultValue="100"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        min="1"
                        max="10000"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Prevent abuse by limiting requests per user
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Max Tokens per Request
                      </label>
                      <input
                        type="number"
                        defaultValue="4000"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        min="100"
                        max="32000"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Limit token usage per request to control costs
                      </p>
                    </div>
                  </div>
                </div>

                {/* Compliance */}
                <div className="pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-900 mb-4">Compliance</h4>
                  
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        id="gdpr_compliant"
                        defaultChecked
                        className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <div className="flex-1">
                        <label htmlFor="gdpr_compliant" className="text-sm font-medium text-gray-900">
                          GDPR Compliant
                        </label>
                        <p className="text-xs text-gray-500 mt-1">
                          Follow GDPR data protection regulations
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        id="hipaa_compliant"
                        className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <div className="flex-1">
                        <label htmlFor="hipaa_compliant" className="text-sm font-medium text-gray-900">
                          HIPAA Compliant
                        </label>
                        <p className="text-xs text-gray-500 mt-1">
                          Follow HIPAA healthcare data regulations
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        id="ccpa_compliant"
                        defaultChecked
                        className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <div className="flex-1">
                        <label htmlFor="ccpa_compliant" className="text-sm font-medium text-gray-900">
                          CCPA Compliant
                        </label>
                        <p className="text-xs text-gray-500 mt-1">
                          Follow California Consumer Privacy Act regulations
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
