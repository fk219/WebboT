/**
 * LangGraph Agent Builder - Complete UI matching Simple Builder
 * All features integrated with consistent styling
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, BookOpen, Wrench, Palette, Mic, Bot, UploadCloud, Globe, Plus, X,
  Send, ArrowRight, Sparkles, MessageSquare, Phone, Headphones, Volume2,
  CheckCircle2, Play, Brain, Shield, Clock, Settings, Zap, Image, Check
} from 'lucide-react';
import { useOrganizations } from '../context/OrganizationsContext';
import ChatWidget from '../../components/ChatWidget';
import React from 'react';

// Types
interface AgentConfig {
  name: string;
  description: string;
  greeting: string;
  systemInstruction: string;
  knowledgeContext: string;
  maxReplyTokens: number;
  quickReplies: string[];
  
  // LLM
  llm_provider: string;
  llm_model: string;
  temperature: number;
  max_tokens: number;
  
  // Voice (TTS)
  voice: {
    enabled: boolean;
    name: string;
    language: string;
    speed: number;
    pitch: number;
    phoneCallEnabled: boolean;
    callButtonIcon: string;
    provider?: string;
    voice_id?: string;
    voice_model?: string;
    voice_temperature?: number;
    voice_volume?: number;
  };
  
  // STT
  stt_provider?: string;
  stt_mode?: 'fast' | 'accurate';
  denoising_mode?: string;
  boosted_keywords?: string[];
  
  // Speech Processing
  responsiveness?: number;
  interruption_sensitivity?: number;
  enable_backchannel?: boolean;
  backchannel_words?: string[];
  normalize_speech?: boolean;
  
  // Call Settings
  max_duration_seconds?: number;
  end_after_silence_seconds?: number;
  voicemail_detection?: boolean;
  voicemail_action?: 'hangup' | 'leave_message';
  voicemail_message?: string;
  
  // Advanced
  ambient_sound?: string;
  ambient_volume?: number;
  pii_redaction_enabled?: boolean;
  pii_redaction_list?: string[];
  data_storage_policy?: string;
  webhook_url?: string;
  
  // Tools & Knowledge
  tools?: string[];
  enabled_mcp_servers?: string[];
  knowledge_base_ids?: string[];
  
  // Theme
  theme: {
    primaryColor: string;
    headerColor?: string;
    userBubbleColor?: string;
    botBubbleColor?: string;
    mode: 'light' | 'dark';
    fontFamily: string;
    radius: string;
    avatarIcon: string;
    showBranding: boolean;
    headerIcon?: string;
    sendButtonIcon?: string;
    textSize?: string;
    chatWindowSize?: string;
    launcherBubbleSize?: string;
    fontWeight?: string;
    headerTitleSize?: string;
    headerTitleWeight?: string;
    avatarImage?: string;
    useLogoAsLauncher?: boolean;
  };
}

type BuilderTab = 'identity' | 'knowledge' | 'tools' | 'style' | 'voice' | 'advanced';

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
  agentConfig,
  setAgentConfig,
  activeTab,
  setActiveTab,
  isIngesting,
  ingestionProgress,
  urlInput,
  setUrlInput,
  handleFileUpload,
  handleUrlScrape,
  toggleTool,
  addQuickReply,
  removeQuickReply,
  newQuickReply,
  setNewQuickReply,
  handleLogoUpload,
  handlePlayVoicePreview,
  isPlayingPreview,
  currentProjectId
}: LangGraphAgentBuilderProps) {
  const navigate = useNavigate();
  const { createBot, updateBot, bots } = useOrganizations();
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveAndDeploy = async () => {
    setIsSaving(true);
    try {
      const config = {
        ...agentConfig,
        llm_provider: agentConfig.llm_provider,
        llm_model: agentConfig.llm_model,
        system_prompt: agentConfig.systemInstruction,
        temperature: agentConfig.temperature,
        max_tokens: agentConfig.max_tokens || agentConfig.maxReplyTokens,
        voice_provider: agentConfig.voice.provider || 'elevenlabs',
        voice_id: agentConfig.voice.voice_id || agentConfig.voice.name,
        voice_model: agentConfig.voice.voice_model || 'eleven_turbo_v2',
        voice_speed: agentConfig.voice.speed,
        voice_temperature: agentConfig.voice.voice_temperature || 1.0,
        voice_volume: agentConfig.voice.voice_volume || 1.0,
        stt_provider: agentConfig.stt_provider || 'deepgram',
        stt_mode: agentConfig.stt_mode || 'fast',
        denoising_mode: agentConfig.denoising_mode || 'noise-cancellation',
        responsiveness: agentConfig.responsiveness || 1.0,
        interruption_sensitivity: agentConfig.interruption_sensitivity || 1.0,
        enable_backchannel: agentConfig.enable_backchannel !== false,
        backchannel_words: agentConfig.backchannel_words || ['mm-hmm', 'yeah', 'uh-huh'],
        normalize_speech: agentConfig.normalize_speech !== false,
        boosted_keywords: agentConfig.boosted_keywords || [],
        max_duration_seconds: agentConfig.max_duration_seconds || 1800,
        end_after_silence_seconds: agentConfig.end_after_silence_seconds || 600,
        voicemail_detection: agentConfig.voicemail_detection || false,
        voicemail_action: agentConfig.voicemail_action || 'hangup',
        voicemail_message: agentConfig.voicemail_message || '',
        ambient_sound: agentConfig.ambient_sound || 'office',
        ambient_volume: agentConfig.ambient_volume || 0.5,
        pii_redaction_enabled: agentConfig.pii_redaction_enabled || false,
        pii_redaction_list: agentConfig.pii_redaction_list || [],
        data_storage_policy: agentConfig.data_storage_policy || 'everything',
        webhook_url: agentConfig.webhook_url || '',
        enabled_mcp_servers: agentConfig.enabled_mcp_servers || agentConfig.tools || [],
        knowledge_base_ids: agentConfig.knowledge_base_ids || []
      };

      if (currentProjectId) {
        await updateBot(currentProjectId, {
          name: agentConfig.name,
          description: agentConfig.description,
          config
        });
      } else {
        await createBot({
          name: agentConfig.name,
          description: agentConfig.description,
          config
        });
      }

      navigate('/agents');
    } catch (error) {
      console.error('Failed to save agent:', error);
      alert('Failed to save agent');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePlayPreview = async (voice: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (playingVoice === voice) {
      setPlayingVoice(null);
      window.speechSynthesis.cancel();
      return;
    }
    setPlayingVoice(voice);

    const utterance = new SpeechSynthesisUtterance(
      `Hello, I am ${agentConfig.name || 'your agent'}. This is a preview of the ${voice} voice.`
    );
    utterance.rate = agentConfig.voice.speed;
    utterance.pitch = agentConfig.voice.pitch;
    utterance.onend = () => setPlayingVoice(null);
    window.speechSynthesis.speak(utterance);
  };

  // Render Identity Tab (Basic + Persona)
  const renderIdentityTab = () => (
    <div className="space-y-8 animate-fade-in max-w-2xl">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
            <User size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">Agent Identity</h3>
            <p className="text-xs text-slate-500">Define how your agent presents itself</p>
          </div>
        </div>

        <div className="space-y-5">
          <div className="relative group">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Name</label>
            <input
              type="text"
              value={agentConfig.name}
              onChange={(e) => setAgentConfig({ ...agentConfig, name: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all font-medium text-slate-800 placeholder-slate-400"
              placeholder="e.g. Sales Assistant"
            />
          </div>

          <div className="relative group">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Description</label>
            <textarea
              value={agentConfig.description}
              onChange={(e) => setAgentConfig({ ...agentConfig, description: e.target.value })}
              rows={2}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none font-medium text-slate-700 resize-none placeholder-slate-400"
              placeholder="Brief description of your agent"
            />
          </div>

          <div className="relative group">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Greeting Message</label>
            <textarea
              value={agentConfig.greeting}
              onChange={(e) => setAgentConfig({ ...agentConfig, greeting: e.target.value })}
              rows={2}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none font-medium text-slate-700 resize-none placeholder-slate-400"
              placeholder="Hello! How can I help you today?"
            />
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
            <Sparkles size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">Persona & Behavior</h3>
            <p className="text-xs text-slate-500">Instruct the AI on how to behave</p>
          </div>
        </div>

        <div className="relative group">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">System Instructions</label>
          <div className="relative">
            <textarea
              value={agentConfig.systemInstruction}
              onChange={(e) => setAgentConfig({ ...agentConfig, systemInstruction: e.target.value })}
              rows={8}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none font-mono text-sm text-slate-600 resize-none leading-relaxed"
              placeholder="You are a helpful assistant..."
            />
            <div className="absolute bottom-3 right-3 text-[10px] bg-slate-200 text-slate-500 px-2 py-1 rounded font-mono font-bold">PROMPT</div>
          </div>
        </div>

        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div className="flex justify-between mb-4">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Response Length</label>
            <span className="text-xs font-mono bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-600 shadow-sm">
              {agentConfig.maxReplyTokens} tokens
            </span>
          </div>
          <input
            type="range"
            min="50"
            max="1000"
            step="10"
            value={agentConfig.maxReplyTokens}
            onChange={(e) => setAgentConfig({ ...agentConfig, maxReplyTokens: parseInt(e.target.value) })}
            className="w-full accent-emerald-500 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between mt-2 text-[10px] text-slate-400 font-medium uppercase tracking-wider">
            <span>Concise</span>
            <span>Verbose</span>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
            <MessageSquare size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">Quick Replies</h3>
            <p className="text-xs text-slate-500">Suggested questions for users</p>
          </div>
        </div>

        <div className="bg-slate-50 p-1 rounded-xl border border-slate-200 flex items-center gap-2 mb-3 shadow-sm focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 transition-all">
          <input
            type="text"
            value={newQuickReply}
            onChange={(e) => setNewQuickReply(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addQuickReply()}
            className="flex-1 bg-transparent border-none px-4 py-2 text-sm outline-none text-slate-700 placeholder-slate-400"
            placeholder="Type a suggestion and press Enter..."
          />
          <button
            onClick={addQuickReply}
            className="bg-white hover:bg-emerald-500 hover:text-white text-slate-500 p-2 rounded-lg transition-all shadow-sm border border-slate-200 hover:border-emerald-500"
          >
            <Plus size={18} />
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {agentConfig.quickReplies?.map((reply, idx) => (
            <div
              key={idx}
              className="group bg-white border border-slate-200 hover:border-emerald-200 hover:shadow-sm text-slate-600 text-xs font-medium px-3 py-1.5 rounded-lg flex items-center gap-2 transition-all cursor-default"
            >
              {reply}
              <button
                onClick={() => removeQuickReply(idx)}
                className="text-slate-300 hover:text-red-500 transition-colors"
              >
                <X size={12} />
              </button>
            </div>
          ))}
          {(!agentConfig.quickReplies || agentConfig.quickReplies.length === 0) && (
            <p className="text-xs text-slate-400 italic px-2">No quick replies added yet.</p>
          )}
        </div>
      </div>
    </div>
  );

  // Render Knowledge Tab
  const renderKnowledgeTab = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-4 flex items-start gap-3">
        <div className="bg-emerald-100 p-2 rounded-lg text-emerald-600 shadow-sm">
          <Bot size={18} />
        </div>
        <div>
          <h4 className="text-sm font-bold text-emerald-900">Knowledge Base</h4>
          <p className="text-xs text-emerald-700 mt-1 leading-relaxed opacity-90">
            Upload documents or add URLs to ground your agent's responses. The agent will prioritize this content over general knowledge.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div className="relative group">
          <input
            type="file"
            onChange={handleFileUpload}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            accept=".txt,.md,.json,.csv"
          />
          <div className="bg-white border-2 border-dashed border-slate-200 rounded-xl p-8 text-center transition-all group-hover:border-emerald-400 group-hover:bg-emerald-50/10 flex flex-col items-center justify-center gap-3">
            {isIngesting ? (
              <div className="w-full max-w-xs mx-auto">
                <div className="flex justify-between text-xs text-slate-500 mb-2 font-medium">
                  <span>Processing Document...</span>
                  <span>{ingestionProgress}%</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-300 ease-out rounded-full"
                    style={{ width: `${ingestionProgress}%` }}
                  />
                </div>
              </div>
            ) : (
              <>
                <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 group-hover:text-emerald-500 group-hover:bg-emerald-100 transition-colors">
                  <UploadCloud size={24} />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-700 group-hover:text-emerald-600 transition-colors">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1 font-medium">TXT, MD, JSON, CSV (Max 5MB)</p>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1 group">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors">
              <Globe size={16} />
            </div>
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium text-slate-700 placeholder-slate-400"
              placeholder="https://example.com/docs"
            />
          </div>
          <button
            onClick={handleUrlScrape}
            disabled={!urlInput || isIngesting}
            className="bg-white border border-slate-200 hover:border-emerald-500 hover:text-emerald-600 text-slate-600 px-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm active:scale-95"
          >
            <Plus size={20} />
          </button>
        </div>
      </div>

      <div className="relative group">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Knowledge Context</label>
          <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md font-mono">
            {agentConfig.knowledgeContext?.length || 0} chars
          </span>
        </div>
        <textarea
          value={agentConfig.knowledgeContext}
          onChange={(e) => setAgentConfig({ ...agentConfig, knowledgeContext: e.target.value })}
          rows={6}
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none font-mono text-sm text-slate-600 resize-none leading-relaxed"
          placeholder="Additional context or knowledge for your agent..."
        />
      </div>
    </div>
  );

  // Render Tools Tab (LLM + Tools + Advanced Settings)
  const renderToolsTab = () => (
    <div className="space-y-8 animate-fade-in max-w-2xl">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
            <Wrench size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">Tools & Capabilities</h3>
            <p className="text-xs text-slate-500">Empower your agent with advanced skills</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">LLM Provider</label>
            <select
              value={agentConfig.llm_provider || 'openai'}
              onChange={(e) => setAgentConfig({ ...agentConfig, llm_provider: e.target.value })}
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
            >
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic</option>
              <option value="google">Google</option>
            </select>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">AI Model</label>
            <select
              value={agentConfig.llm_model || 'gpt-4o-mini'}
              onChange={(e) => setAgentConfig({ ...agentConfig, llm_model: e.target.value })}
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
            >
              {(agentConfig.llm_provider === 'openai' || !agentConfig.llm_provider) && (
                <>
                  <option value="gpt-4o">GPT-4o</option>
                  <option value="gpt-4o-mini">GPT-4o Mini (Recommended)</option>
                  <option value="gpt-4.1">GPT-4.1</option>
                </>
              )}
              {agentConfig.llm_provider === 'anthropic' && (
                <>
                  <option value="claude-3.5-haiku">Claude 3.5 Haiku</option>
                  <option value="claude-3.7-sonnet">Claude 3.7 Sonnet</option>
                  <option value="claude-4.0-sonnet">Claude 4.0 Sonnet</option>
                </>
              )}
              {agentConfig.llm_provider === 'google' && (
                <>
                  <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                  <option value="gemini-pro">Gemini Pro</option>
                </>
              )}
            </select>
            <p className="text-[10px] text-slate-400 mt-2">
              Choose the model that best fits your use case
            </p>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="flex justify-between mb-4">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Temperature</label>
              <span className="text-xs font-mono bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-600 shadow-sm">
                {agentConfig.temperature || 0.7}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={agentConfig.temperature || 0.7}
              onChange={(e) => setAgentConfig({ ...agentConfig, temperature: parseFloat(e.target.value) })}
              className="w-full accent-emerald-500 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between mt-2 text-[10px] text-slate-400 font-medium uppercase tracking-wider">
              <span>Focused</span>
              <span>Creative</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {[
              { id: 'web_browsing', label: 'Web Browsing', icon: Globe, desc: 'Allow the agent to search the internet for real-time info' },
              { id: 'image_generation', label: 'Image Generation', icon: Image, desc: 'Enable creation of AI images on demand' },
              { id: 'code_interpreter', label: 'Code Interpreter', icon: Bot, desc: 'Execute Python code for calculations and analysis' },
            ].map((tool) => (
              <div
                key={tool.id}
                className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl hover:border-emerald-300 transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                      agentConfig.tools?.includes(tool.id) ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    <tool.icon size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-700">{tool.label}</p>
                    <p className="text-xs text-slate-400">{tool.desc}</p>
                  </div>
                </div>
                <div
                  onClick={() => toggleTool(tool.id)}
                  className={`w-12 h-7 rounded-full transition-colors relative cursor-pointer ${
                    agentConfig.tools?.includes(tool.id) ? 'bg-emerald-500' : 'bg-slate-200'
                  }`}
                >
                  <div
                    className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-md transition-transform ${
                      agentConfig.tools?.includes(tool.id) ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // Render Voice Tab (TTS + STT + Speech Processing)
  const renderVoiceTab = () => (
    <div className="space-y-8 animate-fade-in max-w-2xl">
      {/* Voice Personality */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
            <Mic size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">Voice Personality</h3>
            <p className="text-xs text-slate-500">Choose a voice that matches your brand</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Language</label>
            <select
              value={agentConfig.voice.language || 'English'}
              onChange={(e) => setAgentConfig({ ...agentConfig, voice: { ...agentConfig.voice, language: e.target.value } })}
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
            >
              <optgroup label="Popular">
                <option value="English">English (US)</option>
                <option value="Spanish">Spanish</option>
                <option value="French">French</option>
                <option value="German">German</option>
                <option value="Portuguese">Portuguese</option>
                <option value="Japanese">Japanese</option>
                <option value="Hindi">Hindi</option>
                <option value="Chinese">Chinese (Mandarin)</option>
              </optgroup>
            </select>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Voice Provider</label>
            <select
              value={agentConfig.voice.provider || 'elevenlabs'}
              onChange={(e) => setAgentConfig({ ...agentConfig, voice: { ...agentConfig.voice, provider: e.target.value } })}
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
            >
              <option value="elevenlabs">ElevenLabs</option>
              <option value="openai">OpenAI</option>
              <option value="google">Google</option>
              <option value="azure">Azure</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Voice Model</label>
          <div className="grid grid-cols-1 gap-3">
            {['Alloy', 'Echo', 'Fable', 'Onyx', 'Nova', 'Shimmer'].map((voice) => (
              <div
                key={voice}
                onClick={() => setAgentConfig({ ...agentConfig, voice: { ...agentConfig.voice, name: voice } })}
                className={`group flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${
                  agentConfig.voice.name === voice
                    ? 'border-emerald-500 bg-emerald-50/50 shadow-md ring-1 ring-emerald-500/20'
                    : 'border-slate-200 bg-white hover:border-emerald-300 hover:shadow-sm'
                }`}
              >
                <div className="flex items-center gap-4">
                  <button
                    onClick={(e) => handlePlayPreview(voice, e)}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95 shadow-sm ${
                      agentConfig.voice.name === voice
                        ? 'bg-emerald-500 text-white shadow-emerald-200'
                        : 'bg-slate-100 text-slate-400 group-hover:bg-emerald-100 group-hover:text-emerald-600'
                    }`}
                  >
                    {playingVoice === voice ? (
                      <div className="w-4 h-4 bg-current rounded-sm animate-pulse" />
                    ) : agentConfig.voice.name === voice ? (
                      <Mic size={20} />
                    ) : (
                      <Play size={20} className="ml-1" />
                    )}
                  </button>
                  <div>
                    <p
                      className={`text-base font-bold transition-colors ${
                        agentConfig.voice.name === voice ? 'text-emerald-900' : 'text-slate-700'
                      }`}
                    >
                      {voice}
                    </p>
                    <p className="text-xs text-slate-400 font-medium mt-0.5">Natural • Expressive</p>
                  </div>
                </div>
                {agentConfig.voice.name === voice && (
                  <div className="text-emerald-500 bg-emerald-100 p-1.5 rounded-full">
                    <CheckCircle2 size={18} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-6">
          <div>
            <div className="flex justify-between mb-4">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Speed</label>
              <span className="text-xs font-mono bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-600 shadow-sm">
                {agentConfig.voice.speed}x
              </span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              value={agentConfig.voice.speed}
              onChange={(e) => setAgentConfig({ ...agentConfig, voice: { ...agentConfig.voice, speed: parseFloat(e.target.value) } })}
              className="w-full accent-emerald-500 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>
          <div>
            <div className="flex justify-between mb-4">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Pitch</label>
              <span className="text-xs font-mono bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-600 shadow-sm">
                {agentConfig.voice.pitch}
              </span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              value={agentConfig.voice.pitch}
              onChange={(e) => setAgentConfig({ ...agentConfig, voice: { ...agentConfig.voice, pitch: parseFloat(e.target.value) } })}
              className="w-full accent-emerald-500 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Phone Integration */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
            <Phone size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">Phone Integration</h3>
            <p className="text-xs text-slate-500">Configure call settings</p>
          </div>
        </div>

        <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl">
          <div className="flex items-center gap-4">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors shadow-sm ${
                agentConfig.voice.phoneCallEnabled ? 'bg-emerald-500 text-white shadow-emerald-200' : 'bg-white text-slate-400 border border-slate-200'
              }`}
            >
              <Phone size={24} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">Enable Phone Calls</p>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Allow users to call your agent directly</p>
            </div>
          </div>
          <div
            onClick={() => setAgentConfig({ ...agentConfig, voice: { ...agentConfig.voice, phoneCallEnabled: !agentConfig.voice.phoneCallEnabled } })}
            className={`w-14 h-8 rounded-full transition-colors relative cursor-pointer ${
              agentConfig.voice.phoneCallEnabled ? 'bg-emerald-500' : 'bg-slate-200'
            }`}
          >
            <div
              className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform ${
                agentConfig.voice.phoneCallEnabled ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </div>
        </div>

        {agentConfig.voice.phoneCallEnabled && (
          <div className="animate-fade-in">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Call Button Icon</label>
            <div className="flex gap-3">
              {['Phone', 'Mic', 'Headphones', 'Volume2'].map((icon) => (
                <button
                  key={icon}
                  onClick={() => setAgentConfig({ ...agentConfig, voice: { ...agentConfig.voice, callButtonIcon: icon } })}
                  className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                    agentConfig.voice.callButtonIcon === icon
                      ? 'bg-emerald-100 border-2 border-emerald-500 text-emerald-600 shadow-sm'
                      : 'bg-white border border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-slate-600'
                  }`}
                >
                  {icon === 'Phone' && <Phone size={20} />}
                  {icon === 'Mic' && <Mic size={20} />}
                  {icon === 'Headphones' && <Headphones size={20} />}
                  {icon === 'Volume2' && <Volume2 size={20} />}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // Render Style Tab (Theme customization)
  const renderStyleTab = () => (
    <div className="space-y-8 animate-fade-in max-w-2xl">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-pink-100 flex items-center justify-center text-pink-600">
            <Palette size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">Appearance</h3>
            <p className="text-xs text-slate-500">Customize the look and feel of your widget</p>
          </div>
        </div>

        <div className="space-y-4">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Colors</label>

          <div className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl">
            <span className="text-sm text-slate-600">Primary Color</span>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full border border-slate-200 shadow-sm" style={{ backgroundColor: agentConfig.theme.primaryColor }}></div>
              <input
                type="color"
                value={agentConfig.theme.primaryColor}
                onChange={(e) => setAgentConfig({ ...agentConfig, theme: { ...agentConfig.theme, primaryColor: e.target.value } })}
                className="w-8 h-8 opacity-0 absolute cursor-pointer"
              />
              <span className="text-xs font-mono text-slate-400 uppercase">{agentConfig.theme.primaryColor}</span>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl">
            <span className="text-sm text-slate-600">Header Color</span>
            <div className="flex items-center gap-2 relative">
              <div className="w-6 h-6 rounded-full border border-slate-200 shadow-sm" style={{ backgroundColor: agentConfig.theme.headerColor || agentConfig.theme.primaryColor }}></div>
              <input
                type="color"
                value={agentConfig.theme.headerColor || agentConfig.theme.primaryColor}
                onChange={(e) => setAgentConfig({ ...agentConfig, theme: { ...agentConfig.theme, headerColor: e.target.value } })}
                className="w-8 h-8 opacity-0 absolute cursor-pointer"
              />
              <span className="text-xs font-mono text-slate-400 uppercase">{agentConfig.theme.headerColor || 'Default'}</span>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl">
            <span className="text-sm text-slate-600">User Bubble</span>
            <div className="flex items-center gap-2 relative">
              <div className="w-6 h-6 rounded-full border border-slate-200 shadow-sm" style={{ backgroundColor: agentConfig.theme.userBubbleColor || '#f1f5f9' }}></div>
              <input
                type="color"
                value={agentConfig.theme.userBubbleColor || '#f1f5f9'}
                onChange={(e) => setAgentConfig({ ...agentConfig, theme: { ...agentConfig.theme, userBubbleColor: e.target.value } })}
                className="w-8 h-8 opacity-0 absolute cursor-pointer"
              />
              <span className="text-xs font-mono text-slate-400 uppercase">{agentConfig.theme.userBubbleColor || '#f1f5f9'}</span>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl">
            <span className="text-sm text-slate-600">Bot Bubble</span>
            <div className="flex items-center gap-2 relative">
              <div className="w-6 h-6 rounded-full border border-slate-200 shadow-sm" style={{ backgroundColor: agentConfig.theme.botBubbleColor || '#ffffff' }}></div>
              <input
                type="color"
                value={agentConfig.theme.botBubbleColor || '#ffffff'}
                onChange={(e) => setAgentConfig({ ...agentConfig, theme: { ...agentConfig.theme, botBubbleColor: e.target.value } })}
                className="w-8 h-8 opacity-0 absolute cursor-pointer"
              />
              <span className="text-xs font-mono text-slate-400 uppercase">{agentConfig.theme.botBubbleColor || '#ffffff'}</span>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Corner Radius</label>
          <div className="bg-slate-100 p-1 rounded-xl flex overflow-x-auto">
            {['none', 'sm', 'md', 'lg', 'xl', '2xl', 'full'].map((radius) => (
              <button
                key={radius}
                onClick={() => setAgentConfig({ ...agentConfig, theme: { ...agentConfig.theme, radius: radius as any } })}
                className={`flex-1 py-2 px-3 text-xs font-medium rounded-lg transition-all capitalize whitespace-nowrap ${
                  agentConfig.theme.radius === radius ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {radius}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Icons</label>
          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Header Icon</label>
              <div className="grid grid-cols-6 gap-2 mb-3">
                {['Bot', 'MessageSquare', 'Sparkles', 'Zap', 'Heart'].map((icon) => (
                  <button
                    key={icon}
                    onClick={() => setAgentConfig({ ...agentConfig, theme: { ...agentConfig.theme, headerIcon: icon } })}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center text-slate-600 transition-all ${
                      agentConfig.theme.headerIcon === icon
                        ? 'bg-emerald-100 border-2 border-emerald-500 text-emerald-600'
                        : 'bg-slate-50 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {icon === 'Bot' && <Bot size={20} />}
                    {icon === 'MessageSquare' && <MessageSquare size={20} />}
                    {icon === 'Sparkles' && <Sparkles size={20} />}
                    {icon === 'Zap' && <Zap size={20} />}
                    {icon === 'Heart' && <span>❤️</span>}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl">
              <span className="text-sm text-slate-600">Send Icon</span>
              <div className="flex bg-slate-100 p-1 rounded-lg">
                {['send', 'arrow', 'plane', 'sparkle'].map((icon) => (
                  <button
                    key={icon}
                    onClick={() => setAgentConfig({ ...agentConfig, theme: { ...agentConfig.theme, sendButtonIcon: icon as any } })}
                    className={`p-1.5 rounded transition-all ${
                      agentConfig.theme.sendButtonIcon === icon || (!agentConfig.theme.sendButtonIcon && icon === 'arrow')
                        ? 'bg-white text-emerald-600 shadow-sm'
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                    title={icon}
                  >
                    {icon === 'send' && <Send size={16} />}
                    {icon === 'arrow' && <ArrowRight size={16} />}
                    {icon === 'plane' && <Send size={16} className="-rotate-45" />}
                    {icon === 'sparkle' && <Sparkles size={16} />}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={() =>
            setAgentConfig({
              ...agentConfig,
              theme: {
                primaryColor: '#10b981',
                headerColor: undefined,
                userBubbleColor: undefined,
                botBubbleColor: undefined,
                mode: 'light',
                fontFamily: 'inter',
                radius: 'xl',
                textSize: 'md',
                chatWindowSize: 'md',
                launcherBubbleSize: 'md',
                avatarIcon: 'bot',
                showBranding: true,
              },
            })
          }
          className="w-full py-3 rounded-xl border border-slate-200 text-slate-600 font-medium text-sm hover:bg-slate-50 hover:text-slate-900 transition-colors flex items-center justify-center gap-2"
        >
          Reset to Default Styles
        </button>
      </div>
    </div>
  );

  // Render Advanced Tab (STT + Speech Processing + Call Settings + Security)
  const renderAdvancedTab = () => (
    <div className="space-y-8 animate-fade-in max-w-2xl">
      {/* Speech-to-Text (STT) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
            <Mic size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">Speech-to-Text (STT)</h3>
            <p className="text-xs text-slate-500">Configure voice input recognition</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Provider</label>
            <select
              value={agentConfig.stt_provider || 'deepgram'}
              onChange={(e) => setAgentConfig({ ...agentConfig, stt_provider: e.target.value })}
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
            >
              <option value="deepgram">Deepgram</option>
              <option value="openai">OpenAI Whisper</option>
              <option value="google">Google</option>
              <option value="azure">Azure</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Mode</label>
            <select
              value={agentConfig.stt_mode || 'fast'}
              onChange={(e) => setAgentConfig({ ...agentConfig, stt_mode: e.target.value as 'fast' | 'accurate' })}
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
            >
              <option value="fast">Fast (Lower latency)</option>
              <option value="accurate">Accurate (Higher quality)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Denoising</label>
          <select
            value={agentConfig.denoising_mode || 'noise-cancellation'}
            onChange={(e) => setAgentConfig({ ...agentConfig, denoising_mode: e.target.value })}
            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
          >
            <option value="noise-cancellation">Noise Cancellation</option>
            <option value="noise-and-background-speech-cancellation">Noise + Background Speech Cancellation</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Boosted Keywords</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {(agentConfig.boosted_keywords || []).map((keyword, idx) => (
              <span key={idx} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-orange-100 text-orange-800">
                {keyword}
                <button
                  onClick={() => {
                    const newKeywords = [...(agentConfig.boosted_keywords || [])];
                    newKeywords.splice(idx, 1);
                    setAgentConfig({ ...agentConfig, boosted_keywords: newKeywords });
                  }}
                  className="ml-2 text-orange-600 hover:text-orange-800"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
          <input
            type="text"
            placeholder="Add keyword and press Enter..."
            className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                setAgentConfig({
                  ...agentConfig,
                  boosted_keywords: [...(agentConfig.boosted_keywords || []), e.currentTarget.value.trim()],
                });
                e.currentTarget.value = '';
              }
            }}
          />
          <p className="text-xs text-slate-500 mt-2">Keywords that should be recognized more accurately</p>
        </div>
      </div>

      {/* Speech Processing */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-cyan-100 flex items-center justify-center text-cyan-600">
            <MessageSquare size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">Speech Processing</h3>
            <p className="text-xs text-slate-500">Configure conversation behavior</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Responsiveness</label>
              <span className="text-xs font-mono bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-600 shadow-sm">
                {agentConfig.responsiveness || 1.0}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="3"
              step="0.1"
              value={agentConfig.responsiveness || 1.0}
              onChange={(e) => setAgentConfig({ ...agentConfig, responsiveness: parseFloat(e.target.value) })}
              className="w-full accent-cyan-500 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
            />
            <p className="text-xs text-slate-500 mt-1">How quickly agent responds</p>
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Interruption</label>
              <span className="text-xs font-mono bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-600 shadow-sm">
                {agentConfig.interruption_sensitivity || 1.0}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="3"
              step="0.1"
              value={agentConfig.interruption_sensitivity || 1.0}
              onChange={(e) => setAgentConfig({ ...agentConfig, interruption_sensitivity: parseFloat(e.target.value) })}
              className="w-full accent-cyan-500 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
            />
            <p className="text-xs text-slate-500 mt-1">How easily agent can be interrupted</p>
          </div>
        </div>

        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
          <div>
            <p className="font-medium text-slate-900">Enable Backchannel</p>
            <p className="text-sm text-slate-500">Agent makes acknowledgment sounds</p>
          </div>
          <div
            onClick={() => setAgentConfig({ ...agentConfig, enable_backchannel: !agentConfig.enable_backchannel })}
            className={`w-14 h-8 rounded-full transition-colors relative cursor-pointer ${
              agentConfig.enable_backchannel !== false ? 'bg-emerald-500' : 'bg-slate-200'
            }`}
          >
            <div
              className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform ${
                agentConfig.enable_backchannel !== false ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </div>
        </div>

        {agentConfig.enable_backchannel !== false && (
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Backchannel Words</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {(agentConfig.backchannel_words || ['mm-hmm', 'yeah', 'uh-huh']).map((word, idx) => (
                <span key={idx} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-cyan-100 text-cyan-800">
                  {word}
                  <button
                    onClick={() => {
                      const newWords = [...(agentConfig.backchannel_words || [])];
                      newWords.splice(idx, 1);
                      setAgentConfig({ ...agentConfig, backchannel_words: newWords });
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
              className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                  setAgentConfig({
                    ...agentConfig,
                    backchannel_words: [...(agentConfig.backchannel_words || []), e.currentTarget.value.trim()],
                  });
                  e.currentTarget.value = '';
                }
              }}
            />
          </div>
        )}

        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
          <div>
            <p className="font-medium text-slate-900">Normalize Speech</p>
            <p className="text-sm text-slate-500">Optimize speech for clarity</p>
          </div>
          <div
            onClick={() => setAgentConfig({ ...agentConfig, normalize_speech: !agentConfig.normalize_speech })}
            className={`w-14 h-8 rounded-full transition-colors relative cursor-pointer ${
              agentConfig.normalize_speech !== false ? 'bg-emerald-500' : 'bg-slate-200'
            }`}
          >
            <div
              className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform ${
                agentConfig.normalize_speech !== false ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </div>
        </div>
      </div>

      {/* Call Settings */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600">
            <Phone size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">Call Settings</h3>
            <p className="text-xs text-slate-500">Configure call duration and behavior</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Max Duration</label>
              <span className="text-xs font-mono bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-600 shadow-sm">
                {Math.floor((agentConfig.max_duration_seconds || 1800) / 60)} min
              </span>
            </div>
            <input
              type="range"
              min="60"
              max="3600"
              step="60"
              value={agentConfig.max_duration_seconds || 1800}
              onChange={(e) => setAgentConfig({ ...agentConfig, max_duration_seconds: parseInt(e.target.value) })}
              className="w-full accent-indigo-500 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">End After Silence</label>
              <span className="text-xs font-mono bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-600 shadow-sm">
                {Math.floor((agentConfig.end_after_silence_seconds || 600) / 60)} min
              </span>
            </div>
            <input
              type="range"
              min="60"
              max="1800"
              step="60"
              value={agentConfig.end_after_silence_seconds || 600}
              onChange={(e) => setAgentConfig({ ...agentConfig, end_after_silence_seconds: parseInt(e.target.value) })}
              className="w-full accent-indigo-500 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>

        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
          <div>
            <p className="font-medium text-slate-900">Voicemail Detection</p>
            <p className="text-sm text-slate-500">Detect and handle voicemail</p>
          </div>
          <div
            onClick={() => setAgentConfig({ ...agentConfig, voicemail_detection: !agentConfig.voicemail_detection })}
            className={`w-14 h-8 rounded-full transition-colors relative cursor-pointer ${
              agentConfig.voicemail_detection ? 'bg-emerald-500' : 'bg-slate-200'
            }`}
          >
            <div
              className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform ${
                agentConfig.voicemail_detection ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </div>
        </div>

        {agentConfig.voicemail_detection && (
          <>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Voicemail Action</label>
              <select
                value={agentConfig.voicemail_action || 'hangup'}
                onChange={(e) => setAgentConfig({ ...agentConfig, voicemail_action: e.target.value as any })}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
              >
                <option value="hangup">Hang Up</option>
                <option value="leave_message">Leave Message</option>
              </select>
            </div>

            {agentConfig.voicemail_action === 'leave_message' && (
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Voicemail Message</label>
                <textarea
                  value={agentConfig.voicemail_message || ''}
                  onChange={(e) => setAgentConfig({ ...agentConfig, voicemail_message: e.target.value })}
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none font-medium text-slate-700 resize-none placeholder-slate-400"
                  placeholder="Message to leave on voicemail..."
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Security & Privacy */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center text-red-600">
            <Shield size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">Security & Privacy</h3>
            <p className="text-xs text-slate-500">Configure data handling</p>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Data Storage Policy</label>
          <select
            value={agentConfig.data_storage_policy || 'everything'}
            onChange={(e) => setAgentConfig({ ...agentConfig, data_storage_policy: e.target.value })}
            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
          >
            <option value="everything">Store Everything</option>
            <option value="no-pii">No Personal Information</option>
            <option value="basic-attributes">Basic Attributes Only</option>
          </select>
        </div>

        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
          <div>
            <p className="font-medium text-slate-900">PII Redaction</p>
            <p className="text-sm text-slate-500">Automatically redact sensitive information</p>
          </div>
          <div
            onClick={() => setAgentConfig({ ...agentConfig, pii_redaction_enabled: !agentConfig.pii_redaction_enabled })}
            className={`w-14 h-8 rounded-full transition-colors relative cursor-pointer ${
              agentConfig.pii_redaction_enabled ? 'bg-emerald-500' : 'bg-slate-200'
            }`}
          >
            <div
              className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform ${
                agentConfig.pii_redaction_enabled ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </div>
        </div>

        {agentConfig.pii_redaction_enabled && (
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: 'ssn', label: 'Social Security Numbers' },
              { value: 'credit_card', label: 'Credit Card Numbers' },
              { value: 'phone_number', label: 'Phone Numbers' },
              { value: 'email', label: 'Email Addresses' },
              { value: 'address', label: 'Physical Addresses' },
              { value: 'name', label: 'Personal Names' },
            ].map((item) => (
              <label
                key={item.value}
                className="flex items-center space-x-2 p-3 bg-white border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50"
              >
                <input
                  type="checkbox"
                  checked={(agentConfig.pii_redaction_list || []).includes(item.value)}
                  onChange={(e) => {
                    const list = agentConfig.pii_redaction_list || [];
                    if (e.target.checked) {
                      setAgentConfig({ ...agentConfig, pii_redaction_list: [...list, item.value] });
                    } else {
                      setAgentConfig({ ...agentConfig, pii_redaction_list: list.filter((v) => v !== item.value) });
                    }
                  }}
                  className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-sm text-slate-700">{item.label}</span>
              </label>
            ))}
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Webhook URL</label>
          <input
            type="url"
            value={agentConfig.webhook_url || ''}
            onChange={(e) => setAgentConfig({ ...agentConfig, webhook_url: e.target.value })}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none font-medium text-slate-700 placeholder-slate-400"
            placeholder="https://your-webhook-url.com"
          />
          <p className="text-xs text-slate-500 mt-2">Receive real-time call events (HTTPS required)</p>
        </div>
      </div>
    </div>
  );

  // Main render
  return (
    <div className="flex h-full overflow-hidden bg-slate-50">
      {/* Left Panel - Builder */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-xl font-bold text-slate-800">LangGraph Agent Builder</h2>
            <p className="text-xs text-slate-500 mt-0.5">Configure your AI voice agent with advanced features</p>
          </div>
          <button
            onClick={handleSaveAndDeploy}
            disabled={isSaving}
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-medium text-sm transition-all shadow-sm hover:shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Saving...
              </>
            ) : (
              <>
                <CheckCircle2 size={18} />
                Save & Deploy
              </>
            )}
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white border-b border-slate-200 px-6 shrink-0">
          <div className="flex gap-1 overflow-x-auto">
            {[
              { id: 'identity', label: 'Identity', icon: User },
              { id: 'knowledge', label: 'Knowledge', icon: BookOpen },
              { id: 'tools', label: 'Tools', icon: Wrench },
              { id: 'style', label: 'Style', icon: Palette },
              { id: 'voice', label: 'Voice', icon: Mic },
              { id: 'advanced', label: 'Advanced', icon: Settings },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all border-b-2 whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-emerald-500 text-emerald-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'identity' && renderIdentityTab()}
          {activeTab === 'knowledge' && renderKnowledgeTab()}
          {activeTab === 'tools' && renderToolsTab()}
          {activeTab === 'style' && renderStyleTab()}
          {activeTab === 'voice' && renderVoiceTab()}
          {activeTab === 'advanced' && renderAdvancedTab()}
        </div>
      </div>

      {/* Right Panel - Preview */}
      <div className="w-96 bg-slate-100 border-l border-slate-200 flex flex-col shrink-0">
        <div className="bg-white border-b border-slate-200 px-6 py-4">
          <h3 className="text-lg font-bold text-slate-800">Live Preview</h3>
          <p className="text-xs text-slate-500 mt-0.5">See your changes in real-time</p>
        </div>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-sm">
            <ChatWidget config={agentConfig} />
          </div>
        </div>
      </div>
    </div>
  );
}
