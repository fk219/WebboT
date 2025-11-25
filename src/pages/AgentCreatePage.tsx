/**
 * Agent Create/Edit Page
 * Comprehensive configuration with tabs
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Eye, AlertTriangle } from 'lucide-react';
import { useAgent, useCreateAgent, useUpdateAgent } from '../hooks/useAgents';
import { AgentConfig } from '../types/agent';
import { BasicConfig } from '../components/agents/config/BasicConfig';
import { LLMConfig } from '../components/agents/config/LLMConfig';
import { VoiceConfig } from '../components/agents/config/VoiceConfig';
import { SpeechConfig } from '../components/agents/config/SpeechConfig';
import { KnowledgeBaseConfig } from '../components/agents/config/KnowledgeBaseConfig';
import { ToolsConfig } from '../components/agents/config/ToolsConfig';
import { SecurityConfig } from '../components/agents/config/SecurityConfig';

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

export default function AgentCreatePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  const { data: existingAgent, isLoading } = useAgent(id);
  const createAgent = useCreateAgent();
  const updateAgent = useUpdateAgent();

  const [activeTab, setActiveTab] = useState<TabType>('basic');
  const [config, setConfig] = useState<AgentConfig>(DEFAULT_CONFIG);
  const [errors, setErrors] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Load existing agent data
  useEffect(() => {
    if (existingAgent) {
      setConfig(existingAgent.config_json);
    }
  }, [existingAgent]);

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
      if (isEditing) {
        await updateAgent.mutateAsync({
          id: id!,
          input: {
            name: config.name,
            description: config.description,
            config,
          },
        });
        alert('Agent updated successfully!');
      } else {
        const created = await createAgent.mutateAsync({
          name: config.name,
          description: config.description,
          config,
        });
        alert('Agent created successfully!');
        navigate(`/agents/${created.id}/edit`);
      }
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
                onClick={() => navigate('/agents')}
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
              {isEditing && (
                <button
                  onClick={() => navigate(`/agents/${id}/preview`)}
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
              <BasicConfig config={config} onChange={updateConfig} />
            )}
            {activeTab === 'llm' && (
              <LLMConfig config={config} onChange={updateConfig} />
            )}
            {activeTab === 'voice' && (
              <VoiceConfig config={config} onChange={updateConfig} />
            )}
            {activeTab === 'speech' && (
              <SpeechConfig config={config} onChange={updateConfig} />
            )}
            {activeTab === 'knowledge' && (
              <KnowledgeBaseConfig config={config} onChange={updateConfig} />
            )}
            {activeTab === 'tools' && (
              <ToolsConfig config={config} onChange={updateConfig} />
            )}
            {activeTab === 'security' && (
              <SecurityConfig config={config} onChange={updateConfig} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
