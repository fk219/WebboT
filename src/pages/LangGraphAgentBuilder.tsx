/**
 * LangGraph Agent Creation Page
 * Full-featured agent builder with TTS/STT/LLM configuration
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Save, Bot, Mic, Settings, MessageSquare, Phone, Volume2,
  BarChart3, Plus, Play, Info, Brain, Globe, Shield, Zap, Clock,
  BookOpen, Trash2, X, RefreshCw, CheckCircle, AlertTriangle
} from 'lucide-react';
import { useOrganizations } from '../context/OrganizationsContext';

// Types
interface AgentConfig {
  // Basic
  name: string;
  description: string;
  language: string;
  
  // LLM
  llm_provider: string;
  llm_model: string;
  system_prompt: string;
  temperature: number;
  max_tokens: number;
  
  // Voice (TTS)
  voice_provider: string;
  voice_id: string;
  voice_model: string;
  voice_speed: number;
  voice_temperature: number;
  voice_volume: number;
  
  // Speech (STT)
  stt_provider: string;
  stt_mode: 'fast' | 'accurate';
  denoising_mode: 'noise-cancellation' | 'noise-and-background-speech-cancellation';
  
  // Speech Processing
  responsiveness: number;
  interruption_sensitivity: number;
  enable_backchannel: boolean;
  backchannel_words: string[];
  normalize_speech: boolean;
  boosted_keywords: string[];
  
  // Call Settings
  max_duration_seconds: number;
  end_after_silence_seconds: number;
  voicemail_detection: boolean;
  voicemail_action: 'hangup' | 'leave_message';
  voicemail_message: string;
  
  // Advanced
  ambient_sound: string;
  ambient_volume: number;
  pii_redaction_enabled: boolean;
  pii_redaction_list: string[];
  data_storage_policy: string;
  webhook_url: string;
  
  // MCP & Knowledge
  enabled_mcp_servers: string[];
  knowledge_base_ids: string[];
}

interface LangGraphAgentBuilderProps {
  agentConfig: AgentConfig;
  setAgentConfig: (config: AgentConfig) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isIngesting: boolean;
  ingestionProgress: number;
  urlInput: string;
  setUrlInput: (url: string) => void;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleUrlScrape: () => void;
  toggleTool: (tool: string) => void;
  addQuickReply: () => void;
  removeQuickReply: (idx: number) => void;
  newQuickReply: string;
  setNewQuickReply: (val: string) => void;
  handleLogoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handlePlayVoicePreview: () => void;
  isPlayingPreview: boolean;
  currentProjectId?: string;
}

export default function LangGraphAgentBuilder({
  agentConfig: initialConfig,
  setAgentConfig: setInitialConfig,
  currentProjectId
}: LangGraphAgentBuilderProps) {
  const navigate = useNavigate();
  const { currentOrganization, createBot, updateBot, bots } = useOrganizations();
  const isEditing = !!currentProjectId;

  // State
  const [activeTab, setActiveTab] = useState('basic');
  const [saving, setSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  
  // Use provided config or default
  const [config, setConfig] = useState<AgentConfig>(initialConfig || {
    name: '',
    description: '',
    language: 'en-US',
    llm_provider: 'openai',
    llm_model: 'gpt-4o-mini',
    system_prompt: '',
    temperature: 0.7,
    max_tokens: 1000,
    voice_provider: 'elevenlabs',
    voice_id: '11labs-Adrian',
    voice_model: 'eleven_turbo_v2',
    voice_speed: 1.0,
    voice_temperature: 1.0,
    voice_volume: 1.0,
    stt_provider: 'deepgram',
    stt_mode: 'fast',
    denoising_mode: 'noise-cancellation',
    responsiveness: 1.0,
    interruption_sensitivity: 1.0,
    enable_backchannel: true,
    backchannel_words: ['mm-hmm', 'yeah', 'uh-huh'],
    normalize_speech: true,
    boosted_keywords: [],
    max_duration_seconds: 1800,
    end_after_silence_seconds: 600,
    voicemail_detection: false,
    voicemail_action: 'hangup',
    voicemail_message: '',
    ambient_sound: 'office',
    ambient_volume: 0.5,
    pii_redaction_enabled: false,
    pii_redaction_list: ['ssn', 'credit_card', 'phone_number'],
    data_storage_policy: 'everything',
    webhook_url: '',
    enabled_mcp_servers: [],
    knowledge_base_ids: []
  });

  // Sync with parent config
  useEffect(() => {
    if (initialConfig) {
      setConfig(initialConfig);
    }
  }, [initialConfig]);

  useEffect(() => {
    if (setInitialConfig) {
      setInitialConfig(config);
    }
  }, [config]);

  // Load agent data if editing
  useEffect(() => {
    if (isEditing && currentProjectId) {
      const agent = bots.find(b => b.id === currentProjectId);
      if (agent && agent.config) {
        setConfig({ ...config, ...agent.config });
      }
    }
  }, [currentProjectId, bots]);

  // Validation
  const validateConfig = (): string[] => {
    const errors: string[] = [];
    if (!config.name.trim()) errors.push('Agent name is required');
    if (!config.system_prompt.trim()) errors.push('System prompt is required');
    if (!config.voice_id) errors.push('Voice selection is required');
    return errors;
  };

  // Save handler
  const handleSave = async () => {
    const errors = validateConfig();
    setValidationErrors(errors);
    
    if (errors.length > 0) {
      return;
    }

    setSaving(true);
    try {
      if (isEditing && currentProjectId) {
        await updateBot(currentProjectId, {
          name: config.name,
          description: config.description,
          config
        });
      } else {
        await createBot({
          name: config.name,
          description: config.description,
          config
        });
      }
      navigate('/agents');
    } catch (error) {
      console.error('Failed to save agent:', error);
      alert('Failed to save agent');
    } finally {
      setSaving(false);
    }
  };

  // Render tabs
  const renderBasicTab = () => (
    <div className="space-y-6">
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
            <Bot className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Agent Information</h3>
            <p className="text-sm text-gray-500">Basic configuration for your agent</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Agent Name *</label>
            <input
              type="text"
              value={config.name}
              onChange={(e) => setConfig({ ...config, name: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="My Voice Agent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              value={config.description}
              onChange={(e) => setConfig({ ...config, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Brief description of your agent's purpose"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
            <select
              value={config.language}
              onChange={(e) => setConfig({ ...config, language: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="en-US">🇺🇸 English (US)</option>
              <option value="en-GB">🇬🇧 English (UK)</option>
              <option value="es-ES">🇪🇸 Spanish</option>
              <option value="fr-FR">🇫🇷 French</option>
              <option value="de-DE">🇩🇪 German</option>
              <option value="it-IT">🇮🇹 Italian</option>
              <option value="pt-BR">🇧🇷 Portuguese</option>
              <option value="ja-JP">🇯🇵 Japanese</option>
              <option value="zh-CN">🇨🇳 Chinese</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );

  const renderLLMTab = () => (
    <div className="space-y-6">
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg">
            <Brain className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">LLM Configuration</h3>
            <p className="text-sm text-gray-500">Configure the language model</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Provider</label>
              <select
                value={config.llm_provider}
                onChange={(e) => setConfig({ ...config, llm_provider: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="openai">OpenAI</option>
                <option value="anthropic">Anthropic</option>
                <option value="google">Google</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Model</label>
              <select
                value={config.llm_model}
                onChange={(e) => setConfig({ ...config, llm_model: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {config.llm_provider === 'openai' && (
                  <>
                    <option value="gpt-4o">GPT-4o</option>
                    <option value="gpt-4o-mini">GPT-4o Mini</option>
                    <option value="gpt-4.1">GPT-4.1</option>
                  </>
                )}
                {config.llm_provider === 'anthropic' && (
                  <>
                    <option value="claude-3.5-haiku">Claude 3.5 Haiku</option>
                    <option value="claude-3.7-sonnet">Claude 3.7 Sonnet</option>
                  </>
                )}
                {config.llm_provider === 'google' && (
                  <>
                    <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                    <option value="gemini-pro">Gemini Pro</option>
                  </>
                )}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">System Prompt *</label>
            <textarea
              value={config.system_prompt}
              onChange={(e) => setConfig({ ...config, system_prompt: e.target.value })}
              rows={8}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono text-sm"
              placeholder="You are a helpful AI assistant..."
            />
            <p className="text-xs text-gray-500 mt-2">{config.system_prompt.length} characters</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
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
                onChange={(e) => setConfig({ ...config, temperature: parseFloat(e.target.value) })}
                className="w-full accent-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">Controls randomness (0 = focused, 2 = creative)</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Tokens: {config.max_tokens}
              </label>
              <input
                type="range"
                min="100"
                max="4000"
                step="100"
                value={config.max_tokens}
                onChange={(e) => setConfig({ ...config, max_tokens: parseInt(e.target.value) })}
                className="w-full accent-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">Maximum response length</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTTSTab = () => (
    <div className="space-y-6">
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
            <Volume2 className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Text-to-Speech (TTS)</h3>
            <p className="text-sm text-gray-500">Configure voice output</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Provider</label>
              <select
                value={config.voice_provider}
                onChange={(e) => setConfig({ ...config, voice_provider: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="elevenlabs">ElevenLabs</option>
                <option value="openai">OpenAI</option>
                <option value="google">Google</option>
                <option value="azure">Azure</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Voice</label>
              <select
                value={config.voice_id}
                onChange={(e) => setConfig({ ...config, voice_id: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {config.voice_provider === 'elevenlabs' && (
                  <>
                    <option value="11labs-Adrian">Adrian (Male)</option>
                    <option value="11labs-Rachel">Rachel (Female)</option>
                    <option value="11labs-Domi">Domi (Female)</option>
                    <option value="11labs-Bella">Bella (Female)</option>
                  </>
                )}
                {config.voice_provider === 'openai' && (
                  <>
                    <option value="alloy">Alloy</option>
                    <option value="echo">Echo</option>
                    <option value="fable">Fable</option>
                    <option value="onyx">Onyx</option>
                    <option value="nova">Nova</option>
                    <option value="shimmer">Shimmer</option>
                  </>
                )}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Speed: {config.voice_speed}x
              </label>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={config.voice_speed}
                onChange={(e) => setConfig({ ...config, voice_speed: parseFloat(e.target.value) })}
                className="w-full accent-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Temperature: {config.voice_temperature}
              </label>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={config.voice_temperature}
                onChange={(e) => setConfig({ ...config, voice_temperature: parseFloat(e.target.value) })}
                className="w-full accent-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Volume: {config.voice_volume}
              </label>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={config.voice_volume}
                onChange={(e) => setConfig({ ...config, voice_volume: parseFloat(e.target.value) })}
                className="w-full accent-green-500"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSTTTab = () => (
    <div className="space-y-6">
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg">
            <Mic className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Speech-to-Text (STT)</h3>
            <p className="text-sm text-gray-500">Configure voice input</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Provider</label>
              <select
                value={config.stt_provider}
                onChange={(e) => setConfig({ ...config, stt_provider: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="deepgram">Deepgram</option>
                <option value="openai">OpenAI Whisper</option>
                <option value="google">Google</option>
                <option value="azure">Azure</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Mode</label>
              <select
                value={config.stt_mode}
                onChange={(e) => setConfig({ ...config, stt_mode: e.target.value as 'fast' | 'accurate' })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="fast">Fast (Lower latency)</option>
                <option value="accurate">Accurate (Higher quality)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Denoising</label>
            <select
              value={config.denoising_mode}
              onChange={(e) => setConfig({ ...config, denoising_mode: e.target.value as any })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="noise-cancellation">Noise Cancellation</option>
              <option value="noise-and-background-speech-cancellation">
                Noise + Background Speech Cancellation
              </option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Boosted Keywords</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {config.boosted_keywords.map((keyword, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-orange-100 text-orange-800"
                >
                  {keyword}
                  <button
                    onClick={() => {
                      const newKeywords = [...config.boosted_keywords];
                      newKeywords.splice(idx, 1);
                      setConfig({ ...config, boosted_keywords: newKeywords });
                    }}
                    className="ml-2 text-orange-600 hover:text-orange-800"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add keyword..."
                className="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                    setConfig({
                      ...config,
                      boosted_keywords: [...config.boosted_keywords, e.currentTarget.value.trim()]
                    });
                    e.currentTarget.value = '';
                  }
                }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Keywords that should be recognized more accurately
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSpeechTab = () => (
    <div className="space-y-6">
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg">
            <MessageSquare className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Speech Processing</h3>
            <p className="text-sm text-gray-500">Configure conversation behavior</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Responsiveness: {config.responsiveness}
              </label>
              <input
                type="range"
                min="0"
                max="3"
                step="0.1"
                value={config.responsiveness}
                onChange={(e) => setConfig({ ...config, responsiveness: parseFloat(e.target.value) })}
                className="w-full accent-cyan-500"
              />
              <p className="text-xs text-gray-500 mt-1">How quickly agent responds</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Interruption Sensitivity: {config.interruption_sensitivity}
              </label>
              <input
                type="range"
                min="0"
                max="3"
                step="0.1"
                value={config.interruption_sensitivity}
                onChange={(e) => setConfig({ ...config, interruption_sensitivity: parseFloat(e.target.value) })}
                className="w-full accent-cyan-500"
              />
              <p className="text-xs text-gray-500 mt-1">How easily agent can be interrupted</p>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div>
              <p className="font-medium text-gray-900">Enable Backchannel</p>
              <p className="text-sm text-gray-500">Agent makes acknowledgment sounds</p>
            </div>
            <button
              onClick={() => setConfig({ ...config, enable_backchannel: !config.enable_backchannel })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                config.enable_backchannel ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  config.enable_backchannel ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {config.enable_backchannel && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Backchannel Words</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {config.backchannel_words.map((word, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-cyan-100 text-cyan-800"
                  >
                    {word}
                    <button
                      onClick={() => {
                        const newWords = [...config.backchannel_words];
                        newWords.splice(idx, 1);
                        setConfig({ ...config, backchannel_words: newWords });
                      }}
                      className="ml-2 text-cyan-600 hover:text-cyan-800"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                placeholder="Add backchannel word..."
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                    setConfig({
                      ...config,
                      backchannel_words: [...config.backchannel_words, e.currentTarget.value.trim()]
                    });
                    e.currentTarget.value = '';
                  }
                }}
              />
            </div>
          )}

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div>
              <p className="font-medium text-gray-900">Normalize Speech</p>
              <p className="text-sm text-gray-500">Optimize speech for clarity</p>
            </div>
            <button
              onClick={() => setConfig({ ...config, normalize_speech: !config.normalize_speech })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                config.normalize_speech ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  config.normalize_speech ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCallTab = () => (
    <div className="space-y-6">
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
            <Phone className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Call Settings</h3>
            <p className="text-sm text-gray-500">Configure call behavior</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Duration: {Math.floor(config.max_duration_seconds / 60)} min
              </label>
              <input
                type="range"
                min="60"
                max="3600"
                step="60"
                value={config.max_duration_seconds}
                onChange={(e) => setConfig({ ...config, max_duration_seconds: parseInt(e.target.value) })}
                className="w-full accent-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End After Silence: {Math.floor(config.end_after_silence_seconds / 60)} min
              </label>
              <input
                type="range"
                min="60"
                max="1800"
                step="60"
                value={config.end_after_silence_seconds}
                onChange={(e) => setConfig({ ...config, end_after_silence_seconds: parseInt(e.target.value) })}
                className="w-full accent-indigo-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div>
              <p className="font-medium text-gray-900">Voicemail Detection</p>
              <p className="text-sm text-gray-500">Detect and handle voicemail</p>
            </div>
            <button
              onClick={() => setConfig({ ...config, voicemail_detection: !config.voicemail_detection })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                config.voicemail_detection ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  config.voicemail_detection ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {config.voicemail_detection && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Voicemail Action</label>
                <select
                  value={config.voicemail_action}
                  onChange={(e) => setConfig({ ...config, voicemail_action: e.target.value as any })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="hangup">Hang Up</option>
                  <option value="leave_message">Leave Message</option>
                </select>
              </div>

              {config.voicemail_action === 'leave_message' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Voicemail Message</label>
                  <textarea
                    value={config.voicemail_message}
                    onChange={(e) => setConfig({ ...config, voicemail_message: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    placeholder="Message to leave on voicemail..."
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );

  const renderSecurityTab = () => (
    <div className="space-y-6">
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center shadow-lg">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Security & Privacy</h3>
            <p className="text-sm text-gray-500">Configure data handling</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Data Storage Policy</label>
            <select
              value={config.data_storage_policy}
              onChange={(e) => setConfig({ ...config, data_storage_policy: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="everything">Store Everything</option>
              <option value="no-pii">No Personal Information</option>
              <option value="basic-attributes">Basic Attributes Only</option>
            </select>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div>
              <p className="font-medium text-gray-900">PII Redaction</p>
              <p className="text-sm text-gray-500">Automatically redact sensitive information</p>
            </div>
            <button
              onClick={() => setConfig({ ...config, pii_redaction_enabled: !config.pii_redaction_enabled })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                config.pii_redaction_enabled ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  config.pii_redaction_enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {config.pii_redaction_enabled && (
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'ssn', label: 'Social Security Numbers' },
                { value: 'credit_card', label: 'Credit Card Numbers' },
                { value: 'phone_number', label: 'Phone Numbers' },
                { value: 'email', label: 'Email Addresses' },
                { value: 'address', label: 'Physical Addresses' },
                { value: 'name', label: 'Personal Names' }
              ].map((item) => (
                <label key={item.value} className="flex items-center space-x-2 p-3 bg-white border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={config.pii_redaction_list.includes(item.value)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setConfig({
                          ...config,
                          pii_redaction_list: [...config.pii_redaction_list, item.value]
                        });
                      } else {
                        setConfig({
                          ...config,
                          pii_redaction_list: config.pii_redaction_list.filter(v => v !== item.value)
                        });
                      }
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{item.label}</span>
                </label>
              ))}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Webhook URL</label>
            <input
              type="url"
              value={config.webhook_url}
              onChange={(e) => setConfig({ ...config, webhook_url: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://your-webhook-url.com"
            />
            <p className="text-xs text-gray-500 mt-2">Receive real-time call events (HTTPS required)</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/agents')}
                className="p-2 hover:bg-white/50 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  {isEditing ? 'Edit Agent' : 'Create New Agent'}
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Configure your LangGraph-powered AI agent
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {validationErrors.length > 0 && (
                <div className="flex items-center space-x-2 px-4 py-2 bg-red-50 border border-red-200 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  <span className="text-sm text-red-700">{validationErrors.length} errors</span>
                </div>
              )}

              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-5 w-5 mr-2" />
                    Save Agent
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="flex space-x-2 bg-white/80 backdrop-blur-sm rounded-xl p-2 shadow-sm border border-gray-100">
            {[
              { id: 'basic', label: 'Basic', icon: Bot },
              { id: 'llm', label: 'LLM', icon: Brain },
              { id: 'tts', label: 'TTS', icon: Volume2 },
              { id: 'stt', label: 'STT', icon: Mic },
              { id: 'speech', label: 'Speech', icon: MessageSquare },
              { id: 'call', label: 'Call', icon: Phone },
              { id: 'security', label: 'Security', icon: Shield }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="animate-fade-in">
          {activeTab === 'basic' && renderBasicTab()}
          {activeTab === 'llm' && renderLLMTab()}
          {activeTab === 'tts' && renderTTSTab()}
          {activeTab === 'stt' && renderSTTTab()}
          {activeTab === 'speech' && renderSpeechTab()}
          {activeTab === 'call' && renderCallTab()}
          {activeTab === 'security' && renderSecurityTab()}
        </div>

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="mt-6 bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-medium text-red-800 mb-2">
                  Please fix the following errors:
                </h4>
                <ul className="space-y-1">
                  {validationErrors.map((error, index) => (
                    <li key={index} className="text-sm text-red-700">• {error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
