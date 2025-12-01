import React, { useState, useEffect } from 'react';
import { AgentConfig } from '../types/agent';
import { BuilderTab } from '../../types';
import LangGraphAgentBuilder from './LangGraphAgentBuilder';
import { supabaseService } from '../services/supabaseService';

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
  sip: {
    enabled: false,
    username: '',
    domain: '',
    port: 5060
  },
  theme: {
    primaryColor: '#10b981',
    mode: 'light',
    fontFamily: 'inter',
    fontStyle: 'regular',
    radius: 'xl',
    avatarIcon: 'bot',
    showBranding: true
  }
};

interface AgentCreatePageProps {
  agentId?: string;
  onNavigate: (view: 'list' | 'create' | 'edit' | 'preview', agentId?: string) => void;
}

export default function AgentCreatePage({ agentId, onNavigate }: AgentCreatePageProps) {
  const isEditing = !!agentId;
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<BuilderTab>('identity');
  const [config, setConfig] = useState<AgentConfig>(DEFAULT_CONFIG);

  // State for builder props
  const [isIngesting, setIsIngesting] = useState(false);
  const [ingestionProgress, setIngestionProgress] = useState(0);
  const [urlInput, setUrlInput] = useState('');
  const [newQuickReply, setNewQuickReply] = useState('');
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);

  useEffect(() => {
    if (isEditing && agentId) {
      loadAgent();
    }
  }, [isEditing, agentId]);

  const loadAgent = async () => {
    setIsLoading(true);
    try {
      if (!agentId) return;
      const project = await supabaseService.getProject(agentId);
      if (project) {
        setConfig(project.config);
      }
    } catch (error) {
      console.error("Failed to load agent", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    // Implement file upload logic
    console.log("File upload", e.target.files);
  };

  const handleUrlScrape = async () => {
    // Implement URL scrape logic
    console.log("Scrape URL", urlInput);
    setIsIngesting(true);
    // Simulate ingestion
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setIngestionProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        setIsIngesting(false);
        setIngestionProgress(0);
        setUrlInput('');
      }
    }, 200);
  };

  const toggleTool = (tool: string) => {
    setConfig(prev => {
      const tools = prev.enabled_mcp_servers || [];
      if (tools.includes(tool)) {
        return { ...prev, enabled_mcp_servers: tools.filter(t => t !== tool) };
      } else {
        return { ...prev, enabled_mcp_servers: [...tools, tool] };
      }
    });
  };

  const addQuickReply = () => {
    // Implement add quick reply
    console.log("Add quick reply", newQuickReply);
    setNewQuickReply('');
  };

  const removeQuickReply = (idx: number) => {
    // Implement remove quick reply
    console.log("Remove quick reply", idx);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Implement logo upload
    console.log("Logo upload", e.target.files);
  };

  const handlePlayVoicePreview = () => {
    setIsPlayingPreview(!isPlayingPreview);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading agent...</p>
        </div>
      </div>
    );
  }

  return (
    <LangGraphAgentBuilder
      agentConfig={config}
      setAgentConfig={setConfig}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      isIngesting={isIngesting}
      ingestionProgress={ingestionProgress}
      urlInput={urlInput}
      setUrlInput={setUrlInput}
      handleFileUpload={handleFileUpload}
      handleUrlScrape={handleUrlScrape}
      toggleTool={toggleTool}
      addQuickReply={addQuickReply}
      removeQuickReply={removeQuickReply}
      newQuickReply={newQuickReply}
      setNewQuickReply={setNewQuickReply}
      handleLogoUpload={handleLogoUpload}
      handlePlayVoicePreview={handlePlayVoicePreview}
      isPlayingPreview={isPlayingPreview}
      currentProjectId={agentId}
    />
  );
}
