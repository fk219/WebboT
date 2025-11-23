import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Bot,
  BarChart3,
  Settings,
  LogOut,
  UploadCloud,
  Code,
  Palette,
  CheckCircle2,
  FileText,
  Trash2,
  Copy,
  History,
  Share2,
  Wrench,
  Mic,
  Search,
  Clock,
  MessageSquare,
  Type,
  Box,
  Moon,
  Sun,
  Monitor,
  Plus,
  X,
  Upload,
  AlertTriangle,
  User,
  HelpCircle,
  Star,
  Sparkles,
  Flower2,
  Globe,
  PlayCircle,
  Power,
  Phone,
  Filter,
  ChevronDown,
  ArrowRight,
  CreditCard,
  Zap,
  Shield,
  Check,
  Loader2,
  Lock
} from 'lucide-react';
import { AgentConfig, AppView, AnalyticsData, ThemeColor, BorderRadius } from './types';
import ChatWidget from './components/ChatWidget';
import { previewVoice } from './services/geminiService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import AuthPage from './src/pages/AuthPage';
import SettingsPage from './src/pages/SettingsPage';
import { supabaseService, Project } from './src/services/supabaseService';
import SupabaseSetupCheck from './src/components/SupabaseSetupCheck';

// --- Mock Data ---

const INITIAL_AGENT: AgentConfig = {
  id: 'agent_01',
  name: 'Verdant Assistant',
  greeting: 'Hello! I am your Verdant AI assistant. How can I help you today?',
  systemInstruction: 'You are a helpful, professional, and concise AI assistant for a SaaS platform. Be polite and use an emerald/nature metaphor occasionally.',
  knowledgeContext: 'VerdantAI is a premium SaaS platform that allows businesses to embed Gemini-powered AI agents into their websites.',
  tools: ['googleSearch'],
  maxReplyTokens: 150,
  quickReplies: ['Pricing?', 'How does it work?', 'Contact Support'],
  voice: {
    enabled: true,
    name: 'Kore',
    language: 'English',
    speed: 1.0,
    pitch: 1.0
  },
  theme: {
    primaryColor: '#10b981',
    headerColor: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    userBubbleColor: '#10b981',
    botBubbleColor: '', // Empty implies default based on mode
    mode: 'light',
    fontFamily: 'inter',
    fontStyle: 'thin',
    radius: '2xl',
    avatarIcon: 'sparkles',
    showBranding: true,
    customCss: '',
  },
};

const ANALYTICS_DATA: AnalyticsData[] = [
  { name: 'Mon', conversations: 12, tokens: 4500 },
  { name: 'Tue', conversations: 19, tokens: 8200 },
  { name: 'Wed', conversations: 15, tokens: 6100 },
  { name: 'Thu', conversations: 25, tokens: 11200 },
  { name: 'Fri', conversations: 32, tokens: 15400 },
  { name: 'Sat', conversations: 18, tokens: 7800 },
  { name: 'Sun', conversations: 10, tokens: 3200 },
];

const MOCK_HISTORY = [
  { id: 'sess_01', user: 'Visitor #8821', lastMsg: 'How do I upload a PDF?', time: '2 mins ago', status: 'active' },
  { id: 'sess_02', user: 'Visitor #9942', lastMsg: 'What are the pricing tiers?', time: '1 hour ago', status: 'completed' },
  { id: 'sess_03', user: 'Visitor #1123', lastMsg: 'Is there an API?', time: '3 hours ago', status: 'completed' },
  { id: 'sess_04', user: 'Visitor #5512', lastMsg: 'Connection issues.', time: '5 hours ago', status: 'failed' },
  { id: 'sess_05', user: 'Visitor #3311', lastMsg: 'Thanks for the help!', time: '1 day ago', status: 'completed' },
];

const LANGUAGES = [
  'English', 'Spanish', 'French', 'German', 'Portuguese', 'Italian', 'Japanese', 'Korean', 'Hindi'
];

const GEMINI_VOICES = [
  { name: 'Puck', gender: 'Male', style: 'Neutral' },
  { name: 'Charon', gender: 'Male', style: 'Deep' },
  { name: 'Kore', gender: 'Female', style: 'Soft' },
  { name: 'Fenrir', gender: 'Male', style: 'Intense' },
  { name: 'Aoede', gender: 'Female', style: 'Soprano' },
  { name: 'Zephyr', gender: 'Female', style: 'Calm' },
];

type BuilderTab = 'identity' | 'knowledge' | 'tools' | 'style' | 'voice';

// --- Protected Route Component ---
const RequireAuth = ({ children }: { children: React.ReactElement }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#f8fafc]">
        <Loader2 className="animate-spin text-emerald-500" size={32} />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return children;
};

// --- App Layout Component ---
const AppLayout = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [agentConfig, setAgentConfig] = useState<AgentConfig>(INITIAL_AGENT);
  const [activeBuilderTab, setActiveBuilderTab] = useState<BuilderTab>('identity');
  const [isIngesting, setIsIngesting] = useState(false);
  const [ingestionProgress, setIngestionProgress] = useState(0);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  const [newQuickReply, setNewQuickReply] = useState('');
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [historyFilter, setHistoryFilter] = useState<string>('all');
  const [hasApiKey, setHasApiKey] = useState(false);
  // DEMO MODE: Mock user and profile for testing
  const mockUser = { id: 'demo-user-123', email: 'demo@verdantai.com' };
  const mockProfile = { 
    id: 'demo-user-123', 
    email: 'demo@verdantai.com',
    created_at: new Date().toISOString()
  };
  
  const user = mockUser;
  const profile = mockProfile;
  const signOut = async () => { console.log('Demo mode: Sign out disabled'); };
  
  // All features available - no tier restrictions
  const isPro = true;

  // Show demo mode banner in console
  useEffect(() => {
    console.log('%c🎮 DEMO MODE ACTIVE', 'background: #10b981; color: white; padding: 8px 16px; font-size: 16px; font-weight: bold; border-radius: 4px;');
    console.log('%cAuthentication bypassed for testing', 'color: #10b981; font-size: 12px;');
    console.log('%cUser:', 'color: #64748b; font-weight: bold;', mockUser.email);
    console.log('%c📖 All features unlocked - No tier restrictions', 'color: #3b82f6; font-size: 12px;');
  }, []);

  // Multi-project State
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [loadingProjects, setLoadingProjects] = useState(true);

  useEffect(() => {
    // DEMO MODE: Load mock projects
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setLoadingProjects(true);
    
    // DEMO MODE: Use mock projects instead of Supabase
    const mockProjects: Project[] = [
      {
        id: 'project-1',
        user_id: 'demo-user-123',
        name: 'My First Agent',
        config: INITIAL_AGENT,
        created_at: new Date().toISOString()
      }
    ];
    
    setProjects(mockProjects);
    setCurrentProject(mockProjects[0]);
    setAgentConfig(mockProjects[0].config);
    setLoadingProjects(false);
  };

  const handleCreateProject = async () => {
    // DEMO MODE: Create mock project (no restrictions)
    const name = `Agent ${projects.length + 1}`;
    const newProj: Project = {
      id: `project-${Date.now()}`,
      user_id: 'demo-user-123',
      name: name,
      config: INITIAL_AGENT,
      created_at: new Date().toISOString()
    };
    
    setProjects([newProj, ...projects]);
    setCurrentProject(newProj);
    setAgentConfig(newProj.config);
    setCurrentView(AppView.BUILDER);
  };

  const handleSwitchProject = (proj: Project) => {
    setCurrentProject(proj);
    setAgentConfig(proj.config);
  };

  // Auto-save (DEMO MODE: Local state only)
  useEffect(() => {
    if (currentProject && JSON.stringify(agentConfig) !== JSON.stringify(currentProject.config)) {
      const timer = setTimeout(() => {
        // DEMO MODE: Update local state only (no Supabase)
        setProjects(prev => prev.map(p => p.id === currentProject.id ? { ...p, config: agentConfig } : p));
        setCurrentProject(prev => prev ? { ...prev, config: agentConfig } : null);
        console.log('✅ Demo mode: Config auto-saved to local state');
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [agentConfig, currentProject]);

  useEffect(() => {
    // DEMO MODE: Always set hasApiKey to true for testing
    setHasApiKey(true);
    
    /* Production code:
    const checkKey = async () => {
      if ((window as any).aistudio && (window as any).aistudio.hasSelectedApiKey) {
        const hasKey = await (window as any).aistudio.hasSelectedApiKey();
        setHasApiKey(hasKey);
      } else {
        setHasApiKey(true);
      }
    };
    checkKey();
    */
  }, []);

  const handleSelectApiKey = async () => {
    if ((window as any).aistudio && (window as any).aistudio.openSelectKey) {
      await (window as any).aistudio.openSelectKey();
      setHasApiKey(true);
    }
  };

  // --- Helpers ---

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopySuccess(type);
    setTimeout(() => setCopySuccess(null), 2000);
  };

  const simulateIngestion = () => {
    setIsIngesting(true);
    setIngestionProgress(0);
    const interval = setInterval(() => {
      setIngestionProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsIngesting(false);
          return 100;
        }
        return prev + 10;
      });
    }, 300);
  };

  const toggleTool = (tool: string) => {
    if (agentConfig.tools.includes(tool)) {
      setAgentConfig({ ...agentConfig, tools: agentConfig.tools.filter(t => t !== tool) });
    } else {
      setAgentConfig({ ...agentConfig, tools: [...agentConfig.tools, tool] });
    }
  };

  const addQuickReply = () => {
    if (newQuickReply.trim()) {
      setAgentConfig({
        ...agentConfig,
        quickReplies: [...(agentConfig.quickReplies || []), newQuickReply.trim()]
      });
      setNewQuickReply('');
    }
  };

  const removeQuickReply = (idx: number) => {
    const newReplies = [...(agentConfig.quickReplies || [])];
    newReplies.splice(idx, 1);
    setAgentConfig({ ...agentConfig, quickReplies: newReplies });
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAgentConfig({
          ...agentConfig,
          theme: { ...agentConfig.theme, customAvatar: reader.result as string }
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePlayVoicePreview = async () => {
    if (isPlayingPreview) return;
    setIsPlayingPreview(true);

    const audioBuffer = await previewVoice(agentConfig);
    if (audioBuffer) {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      source.start(0);
      source.onended = () => setIsPlayingPreview(false);
    } else {
      setIsPlayingPreview(false);
    }
  };

  const filteredHistory = MOCK_HISTORY.filter(sess =>
    historyFilter === 'all' || sess.status === historyFilter
  );

  // --- Sub-renderers for Builder Tabs ---

  const renderIdentityTab = () => (
    <div className="space-y-8 animate-fade-in">
      <div className="space-y-4">
        <div>
          <label className="block text-xs uppercase tracking-wider text-slate-400 font-medium mb-2">Agent Name</label>
          <input
            type="text"
            value={agentConfig.name}
            onChange={(e) => setAgentConfig({ ...agentConfig, name: e.target.value })}
            className="w-full bg-white border border-slate-200 rounded-lg px-4 py-3 focus:ring-1 focus:ring-emerald-400 focus:border-emerald-400 outline-none transition-all font-light text-slate-700"
            placeholder="e.g. Sales Bot"
          />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-wider text-slate-400 font-medium mb-2">Greeting Message</label>
          <textarea
            value={agentConfig.greeting}
            onChange={(e) => setAgentConfig({ ...agentConfig, greeting: e.target.value })}
            rows={2}
            className="w-full bg-white border border-slate-200 rounded-lg px-4 py-3 focus:ring-1 focus:ring-emerald-400 outline-none font-light text-slate-700 resize-none"
            placeholder="e.g. Hello! How can I help?"
          />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-wider text-slate-400 font-medium mb-2">System Instruction (Persona)</label>
          <textarea
            value={agentConfig.systemInstruction}
            onChange={(e) => setAgentConfig({ ...agentConfig, systemInstruction: e.target.value })}
            rows={6}
            className="w-full bg-white border border-slate-200 rounded-lg px-4 py-3 focus:ring-1 focus:ring-emerald-400 outline-none font-light text-slate-700 resize-none"
            placeholder="Define how the agent should behave..."
          />
          <p className="text-[10px] text-slate-400 mt-2">Tip: Define the tone, role, and constraints for the AI.</p>
        </div>

        {/* Max Tokens Slider */}
        <div>
          <div className="flex justify-between mb-2">
            <label className="text-xs uppercase tracking-wider text-slate-400 font-medium">Max Response Length</label>
            <span className="text-xs text-slate-600 font-mono">{agentConfig.maxReplyTokens} Tokens</span>
          </div>
          <input
            type="range" min="50" max="1000" step="10"
            value={agentConfig.maxReplyTokens}
            onChange={(e) => setAgentConfig({ ...agentConfig, maxReplyTokens: parseInt(e.target.value) })}
            className="w-full accent-emerald-500 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
          />
          <p className="text-[10px] text-slate-400 mt-1">Controls the verbosity of the agent's replies.</p>
        </div>
      </div>

      <div className="pt-6 border-t border-slate-100">
        <label className="block text-xs uppercase tracking-wider text-slate-400 font-medium mb-3">Quick Replies</label>
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={newQuickReply}
            onChange={(e) => setNewQuickReply(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addQuickReply()}
            className="flex-1 bg-white border border-slate-200 rounded-lg px-4 py-2 text-sm outline-none focus:border-emerald-400"
            placeholder="Add suggestion button..."
          />
          <button
            onClick={addQuickReply}
            className="bg-slate-100 text-slate-600 p-2 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <Plus size={20} />
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {agentConfig.quickReplies?.map((reply, idx) => (
            <div key={idx} className="bg-white border border-slate-200 text-slate-600 text-xs px-3 py-1.5 rounded-full flex items-center gap-2">
              {reply}
              <button onClick={() => removeQuickReply(idx)} className="text-slate-400 hover:text-red-400">
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderKnowledgeTab = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-emerald-50/50 border border-emerald-100 rounded-lg p-4 flex items-start gap-3">
        <div className="bg-emerald-100 p-1.5 rounded text-emerald-600 mt-0.5">
          <Bot size={16} />
        </div>
        <div>
          <h4 className="text-sm font-medium text-emerald-900">Knowledge Base</h4>
          <p className="text-xs text-emerald-700 mt-1 leading-relaxed">
            Upload documents to ground your agent's responses. The agent will prioritize this content over general knowledge.
          </p>
        </div>
      </div>

      <div className="glass-panel border-dashed border-2 border-slate-200 rounded-xl p-10 text-center hover:border-emerald-300 transition-colors cursor-pointer group relative bg-white">
        {isIngesting ? (
          <div className="w-full max-w-xs mx-auto">
            <div className="flex justify-between text-xs text-slate-500 mb-2">
              <span>Processing Document...</span>
              <span>{ingestionProgress}%</span>
            </div>
            <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-400 transition-all duration-300"
                style={{ width: `${ingestionProgress}% ` }}
              ></div>
            </div>
          </div>
        ) : (
          <div onClick={simulateIngestion}>
            <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
              <UploadCloud className="text-emerald-500" size={28} />
            </div>
            <p className="text-sm text-slate-700 font-medium">Click to upload or drag and drop</p>
            <p className="text-xs text-slate-400 mt-1">PDF, DOCX, TXT (Max 10MB)</p>
          </div>
        )}
      </div>

      <div>
        <label className="block text-xs uppercase tracking-wider text-slate-400 font-medium mb-2">
          Paste Text / URL Content
        </label>
        <textarea
          value={agentConfig.knowledgeContext}
          onChange={(e) => setAgentConfig({ ...agentConfig, knowledgeContext: e.target.value })}
          rows={6}
          placeholder="Or simply paste your content here directly..."
          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-xs font-mono text-slate-600 focus:ring-1 focus:ring-emerald-400 outline-none resize-none"
        />
      </div>
    </div>
  );

  const renderToolsTab = () => (
    <div className="space-y-4 animate-fade-in">
      <p className="text-sm text-slate-500 font-light mb-4">Enable capabilities for your agent to interact with the outside world.</p>

      <div
        onClick={() => toggleTool('googleSearch')}
        className={`flex items - center justify - between p - 5 rounded - xl border cursor - pointer transition - all group ${agentConfig.tools.includes('googleSearch') ? 'border-emerald-400 bg-emerald-50/30 shadow-sm' : 'border-slate-200 bg-white hover:border-emerald-200'} `}
      >
        <div className="flex items-center gap-4">
          <div className={`w - 10 h - 10 rounded - lg flex items - center justify - center ${agentConfig.tools.includes('googleSearch') ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'} `}>
            <Search size={20} />
          </div>
          <div>
            <p className={`text - sm font - medium ${agentConfig.tools.includes('googleSearch') ? 'text-emerald-900' : 'text-slate-700'} `}>Google Search Grounding</p>
            <p className="text-xs text-slate-400 font-light mt-0.5">Allows the agent to search the web for real-time info.</p>
          </div>
        </div>
        <div className={`w - 6 h - 6 rounded - full border flex items - center justify - center transition - colors ${agentConfig.tools.includes('googleSearch') ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300 bg-white'} `}>
          {agentConfig.tools.includes('googleSearch') && <CheckCircle2 size={14} className="text-white" />}
        </div>
      </div>

      <div className="flex items-center justify-between p-5 rounded-xl border border-slate-100 bg-slate-50 opacity-60 cursor-not-allowed">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-slate-200 flex items-center justify-center text-slate-400">
            <Clock size={20} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Booking & Scheduling</p>
            <p className="text-xs text-slate-400 font-light mt-0.5">Connect to Calendar API (Coming Soon).</p>
          </div>
        </div>
        <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 bg-slate-200 px-2 py-1 rounded">Beta</span>
      </div>
    </div>
  );

  const renderStyleTab = () => (
    <div className="space-y-8 animate-fade-in pb-12">

      {/* Interface Mode */}
      <div>
        <label className="block text-xs uppercase tracking-wider text-slate-400 font-medium mb-3">Interface Theme</label>
        <div className="flex bg-slate-100 p-1 rounded-lg w-fit">
          <button
            onClick={() => setAgentConfig({ ...agentConfig, theme: { ...agentConfig.theme, mode: 'light' } })}
            className={`flex items - center gap - 2 px - 4 py - 2 rounded - md text - xs font - medium transition - all ${agentConfig.theme.mode === 'light' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'} `}
          >
            <Sun size={14} /> Light
          </button>
          <button
            onClick={() => setAgentConfig({ ...agentConfig, theme: { ...agentConfig.theme, mode: 'dark' } })}
            className={`flex items - center gap - 2 px - 4 py - 2 rounded - md text - xs font - medium transition - all ${agentConfig.theme.mode === 'dark' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'} `}
          >
            <Moon size={14} /> Dark
          </button>
        </div>
      </div>

      {/* Colors & Gradients */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Primary Color</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={agentConfig.theme.primaryColor}
              onChange={(e) => setAgentConfig({ ...agentConfig, theme: { ...agentConfig.theme, primaryColor: e.target.value } })}
              className="h-10 w-20 rounded cursor-pointer"
            />
            <span className="text-sm text-slate-500 uppercase">{agentConfig.theme.primaryColor}</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Header Color</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={agentConfig.theme.headerColor || agentConfig.theme.primaryColor}
              onChange={(e) => setAgentConfig({ ...agentConfig, theme: { ...agentConfig.theme, headerColor: e.target.value } })}
              className="h-10 w-20 rounded cursor-pointer"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs uppercase tracking-wider text-slate-400 font-medium mb-2">User Bubble Background</label>
          <input type="text" value={agentConfig.theme.userBubbleColor || ''} onChange={(e) => setAgentConfig({ ...agentConfig, theme: { ...agentConfig.theme, userBubbleColor: e.target.value } })} className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-xs font-mono text-slate-600 outline-none" />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-wider text-slate-400 font-medium mb-2">Bot Bubble Background</label>
          <input type="text" value={agentConfig.theme.botBubbleColor || ''} placeholder="Optional override..." onChange={(e) => setAgentConfig({ ...agentConfig, theme: { ...agentConfig.theme, botBubbleColor: e.target.value } })} className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-xs font-mono text-slate-600 outline-none" />
        </div>
      </div>

      {/* Typography */}
      <div className="grid grid-cols-2 gap-6 pt-4 border-t border-slate-100">
        <div>
          <label className="block text-xs uppercase tracking-wider text-slate-400 font-medium mb-3">Font Family</label>
          <div className="space-y-2">
            {[
              { id: 'inter', label: 'Inter (Clean)' },
              { id: 'roboto', label: 'Roboto (Neutral)' },
              { id: 'mono', label: 'Mono (Tech)' }
            ].map((font) => (
              <div
                key={font.id}
                onClick={() => setAgentConfig({ ...agentConfig, theme: { ...agentConfig.theme, fontFamily: font.id as any } })}
                className={`px - 4 py - 3 rounded - lg border cursor - pointer flex items - center justify - between transition - all ${agentConfig.theme.fontFamily === font.id ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-200 hover:border-slate-300 bg-white'} `}
              >
                <span className={`text - sm text - slate - 700 ${font.id === 'mono' ? 'font-mono' : 'font-sans'} `}>{font.label}</span>
                {agentConfig.theme.fontFamily === font.id && <CheckCircle2 size={14} className="text-emerald-500" />}
              </div>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-xs uppercase tracking-wider text-slate-400 font-medium mb-3">Font Weight</label>
          <div className="flex flex-col gap-2">
            {['thin', 'regular', 'medium'].map((weight) => (
              <button
                key={weight}
                onClick={() => setAgentConfig({ ...agentConfig, theme: { ...agentConfig.theme, fontStyle: weight as any } })}
                className={`px - 4 py - 2 rounded - lg border text - left text - sm transition - all capitalize ${agentConfig.theme.fontStyle === weight ? 'border-emerald-500 bg-emerald-50/50 text-emerald-900' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'} `}
              >
                {weight}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Avatar & Logo */}
      <div>
        <label className="block text-xs uppercase tracking-wider text-slate-400 font-medium mb-3">Avatar</label>
        <div className="space-y-4">
          <div className="flex gap-3">
            {[
              { id: 'sparkles', Icon: Sparkles },
              { id: 'bot', Icon: Bot },
              { id: 'flower', Icon: Flower2 },
              { id: 'user', Icon: User },
              { id: 'help', Icon: HelpCircle },
              { id: 'star', Icon: Star }
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setAgentConfig({
                  ...agentConfig,
                  theme: { ...agentConfig.theme, avatarIcon: item.id as any, customAvatar: undefined }
                })}
                className={`w - 10 h - 10 rounded - lg border flex items - center justify - center transition - all ${agentConfig.theme.avatarIcon === item.id && !agentConfig.theme.customAvatar ? 'border-emerald-500 bg-emerald-50 text-emerald-600' : 'border-slate-200 bg-white text-slate-400 hover:border-emerald-300'} `}
              >
                <item.Icon size={20} />
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <div className="h-px bg-slate-100 flex-1"></div>
            <span className="text-[10px] text-slate-400 uppercase">OR</span>
            <div className="h-px bg-slate-100 flex-1"></div>
          </div>

          <div className="flex items-center gap-4">
            {agentConfig.theme.customAvatar ? (
              <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-200">
                <img src={agentConfig.theme.customAvatar} alt="Logo" className="w-full h-full object-cover" />
                <button
                  onClick={() => setAgentConfig({ ...agentConfig, theme: { ...agentConfig.theme, customAvatar: undefined } })}
                  className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded-full hover:bg-black/70"
                >
                  <X size={12} />
                </button>
              </div>
            ) : (
              <div className="w-16 h-16 rounded-xl border border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center text-slate-400">
                <Upload size={16} />
                <span className="text-[10px] mt-1">Logo</span>
              </div>
            )}
            <div className="flex-1">
              <label className="cursor-pointer inline-block bg-white border border-slate-200 px-4 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-sm">
                Upload Custom Logo
                <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
              </label>
              <p className="text-[10px] text-slate-400 mt-1.5">Recommended: 200x200px PNG or JPG</p>
            </div>
          </div>
        </div>
      </div>

      {/* Shape & Branding */}
      <div className="space-y-6 pt-6 border-t border-slate-100">
        <div>
          <div className="flex justify-between mb-3">
            <label className="block text-xs uppercase tracking-wider text-slate-400 font-medium">Corner Radius</label>
            <span className="text-xs text-slate-500 font-mono">{agentConfig.theme.radius}</span>
          </div>
          <div className="flex gap-2">
            {(['none', 'sm', 'md', 'lg', 'xl', '2xl', 'full'] as BorderRadius[]).map((r) => (
              <button
                key={r}
                onClick={() => setAgentConfig({ ...agentConfig, theme: { ...agentConfig.theme, radius: r } })}
                className={`flex - 1 h - 8 rounded border transition - all text - [10px] uppercase ${agentConfig.theme.radius === r ? 'bg-slate-800 text-white border-slate-800' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'} `}
              >
                {r === 'none' ? 'SQ' : r}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <label className="block text-sm font-medium text-slate-700">Show Branding</label>
            <p className="text-xs text-slate-500">Display "Powered by VerdantAI"</p>
          </div>
          <button
            onClick={() => setAgentConfig({ ...agentConfig, theme: { ...agentConfig.theme, showBranding: !agentConfig.theme.showBranding } })}
            className={`w-11 h-6 rounded-full transition-colors relative ${agentConfig.theme.showBranding ? 'bg-emerald-500' : 'bg-slate-200'}`}
          >
            <span className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${agentConfig.theme.showBranding ? 'translate-x-5' : ''}`} />
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Custom CSS</label>
          <textarea
            value={agentConfig.theme.customCss || ''}
            onChange={(e) => setAgentConfig({ ...agentConfig, theme: { ...agentConfig.theme, customCss: e.target.value } })}
            placeholder=".widget-container { ... }"
            className="w-full border border-slate-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent h-32 font-mono"
          />
        </div>
      </div>
    </div>
  );

  const renderVoiceTab = () => (
    <div className="space-y-8 animate-fade-in">
      <div className="bg-slate-50 rounded-xl p-6 border border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`w - 12 h - 12 rounded - full flex items - center justify - center transition - colors ${agentConfig.voice.enabled ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-400'} `}>
            <Mic size={24} />
          </div>
          <div>
            <h3 className="text-sm font-medium text-slate-800">Enable Voice Mode</h3>
            <p className="text-xs text-slate-500 mt-0.5">Allow users to speak with the agent via microphone.</p>
          </div>
        </div>
        <button
          onClick={() => setAgentConfig({ ...agentConfig, voice: { ...agentConfig.voice, enabled: !agentConfig.voice.enabled } })}
          className={`w - 12 h - 7 rounded - full transition - colors relative ${agentConfig.voice.enabled ? 'bg-emerald-500' : 'bg-slate-300'} `}
        >
          <span className={`absolute top - 1 w - 5 h - 5 bg - white rounded - full shadow - sm transition - transform ${agentConfig.voice.enabled ? 'left-6' : 'left-1'} `} />
        </button>
      </div>

      <div className={`space - y - 6 transition - opacity ${agentConfig.voice.enabled ? 'opacity-100' : 'opacity-50 pointer-events-none'} `}>
        <div>
          <label className="block text-xs uppercase tracking-wider text-slate-400 font-medium mb-3">Language</label>
          <div className="relative">
            <Globe size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <select
              value={agentConfig.voice.language}
              onChange={(e) => setAgentConfig({ ...agentConfig, voice: { ...agentConfig.voice, language: e.target.value } })}
              className="w-full appearance-none bg-white border border-slate-200 rounded-lg pl-10 pr-4 py-3 text-sm text-slate-700 outline-none focus:border-emerald-400"
            >
              {LANGUAGES.map(lang => <option key={lang} value={lang}>{lang}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Voice Selection */}
        <div>
          <label className="block text-xs uppercase tracking-wider text-slate-400 font-medium mb-3">Voice Persona</label>
          <div className="grid grid-cols-2 gap-3">
            {GEMINI_VOICES.map((voice) => (
              <div
                key={voice.name}
                onClick={() => setAgentConfig({ ...agentConfig, voice: { ...agentConfig.voice, name: voice.name } })}
                className={`p - 3 rounded - lg border cursor - pointer transition - all ${agentConfig.voice.name === voice.name ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-200 bg-white hover:bg-slate-50'} `}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text - sm font - medium ${agentConfig.voice.name === voice.name ? 'text-emerald-900' : 'text-slate-700'} `}>{voice.name}</span>
                  {agentConfig.voice.name === voice.name && <Check size={14} className="text-emerald-500" />}
                </div>
                <div className="flex gap-2 text-[10px] text-slate-500">
                  <span>{voice.gender}</span>
                  <span>•</span>
                  <span>{voice.style}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs uppercase tracking-wider text-slate-400 font-medium mb-3">Preview Voice</label>
          <button
            onClick={handlePlayVoicePreview}
            disabled={isPlayingPreview}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium transition-all active:scale-95 disabled:opacity-70 disabled:cursor-wait"
          >
            {isPlayingPreview ? <span className="animate-pulse flex items-center gap-2"><Zap size={16} className="text-emerald-500" /> Generating Audio...</span> : <> <PlayCircle size={16} /> Play Sample ({agentConfig.voice.name}) </>}
          </button>
          <p className="text-[10px] text-slate-400 mt-2">Generates a live sample using Gemini TTS.</p>
        </div>
      </div>
    </div>
  );

  const renderBuilder = () => (
    <div className="flex h-[calc(100vh-2rem)] gap-6">
      {/* Editor Panel */}
      <div className="w-[500px] bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-slate-100 px-6 pt-6 gap-6 bg-slate-50/50">
          {(['identity', 'knowledge', 'tools', 'style', 'voice'] as BuilderTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveBuilderTab(tab)}
              className={`pb - 4 text - xs font - medium uppercase tracking - wider transition - all relative ${activeBuilderTab === tab ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'} `}
            >
              {tab}
              {activeBuilderTab === tab && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-emerald-500 rounded-t-full"></span>}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-slate-50/30">
          {activeBuilderTab === 'identity' && renderIdentityTab()}
          {activeBuilderTab === 'knowledge' && renderKnowledgeTab()}
          {activeBuilderTab === 'tools' && renderToolsTab()}
          {activeBuilderTab === 'style' && renderStyleTab()}
          {activeBuilderTab === 'voice' && renderVoiceTab()}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 bg-white flex justify-between items-center">
          <div className="flex items-center gap-2 text-[10px] text-slate-400">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
            All changes saved automatically
          </div>
          <button
            onClick={() => setCurrentView(AppView.INTEGRATION)}
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2.5 rounded-lg text-xs font-medium transition-all shadow-lg shadow-emerald-200 flex items-center gap-2"
          >
            Publish & Embed <ArrowRight size={14} className="ml-1" />
          </button>
        </div>
      </div>

      {/* Live Preview Panel */}
      <div className="flex-1 bg-slate-100 rounded-2xl border border-slate-200 relative flex flex-col overflow-hidden">
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/80 backdrop-blur px-4 py-1.5 rounded-full text-[10px] font-medium text-slate-500 shadow-sm z-10 flex items-center gap-2 border border-slate-200/50">
          <Monitor size={12} /> Live Preview Environment
        </div>

        <div className="flex-1 relative flex items-center justify-center bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px]">
          <div className="text-center opacity-30 pointer-events-none select-none">
            <Monitor size={48} className="mx-auto mb-4 text-slate-400" />
            <h3 className="text-lg font-medium text-slate-500">Your Website Content</h3>
            <p className="text-sm text-slate-400 max-w-md mx-auto mt-2">The agent widget will float above your content. Interact with the widget in the bottom right to test.</p>
          </div>

          {/* The Widget Instance */}
          <ChatWidget 
            config={agentConfig} 
            previewMode={true} 
            userId={user?.id} 
            projectId={currentProject?.id} 
          />
        </div>
      </div>
    </div>
  );

  const renderDashboard = () => (
    <div className="space-y-8 max-w-5xl animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-light text-slate-800">Dashboard</h1>
          <p className="text-slate-400 font-light mt-1">Overview of your agent's performance.</p>
        </div>
        <button className="flex items-center gap-2 text-sm text-slate-500 hover:text-emerald-600 transition-colors bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm">
          <Clock size={16} /> Last 7 Days
        </button>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="glass-panel bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><MessageSquare size={18} /></div>
            <span className="text-sm text-slate-500 font-medium">Total Conversations</span>
          </div>
          <div className="flex items-end gap-3">
            <span className="text-3xl font-light text-slate-800">1,248</span>
            <span className="text-xs text-emerald-500 font-medium mb-1.5 flex items-center">+12.5% <ArrowUpRight size={12} /></span>
          </div>
        </div>
        <div className="glass-panel bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Box size={18} /></div>
            <span className="text-sm text-slate-500 font-medium">Tokens Consumed</span>
          </div>
          <div className="flex items-end gap-3">
            <span className="text-3xl font-light text-slate-800">482k</span>
            <span className="text-xs text-slate-400 font-medium mb-1.5">Est. $12.40</span>
          </div>
        </div>
        <div className="glass-panel bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><CheckCircle2 size={18} /></div>
            <span className="text-sm text-slate-500 font-medium">Grounding Rate</span>
          </div>
          <div className="flex items-end gap-3">
            <span className="text-3xl font-light text-slate-800">94.2%</span>
            <span className="text-xs text-emerald-500 font-medium mb-1.5">Healthy</span>
          </div>
        </div>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
        <h3 className="text-sm font-medium text-slate-600 mb-6">Token Usage Trend</h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={ANALYTICS_DATA}>
              <defs>
                <linearGradient id="colorTokens" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
              <Tooltip
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                cursor={{ stroke: '#e2e8f0' }}
              />
              <Area type="monotone" dataKey="tokens" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorTokens)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  const renderAnalytics = () => (
    <div className="space-y-6 max-w-5xl animate-fade-in">
      <h1 className="text-2xl font-light text-slate-800">Analytics Report</h1>
      <div className="bg-white rounded-2xl border border-slate-200 p-12 flex flex-col items-center justify-center text-center min-h-[400px]">
        <div className="bg-slate-50 p-4 rounded-full mb-4">
          <BarChart3 size={32} className="text-slate-400" />
        </div>
        <h3 className="text-lg font-medium text-slate-700">Detailed Reports</h3>
        <p className="text-slate-500 max-w-md mt-2">Granular conversation analytics and export tools will be available in the full release.</p>
        <button className="mt-6 text-emerald-600 text-sm font-medium hover:underline">Download CSV Sample</button>
      </div>
    </div>
  );

  const renderHistory = () => (
    <div className="space-y-6 max-w-5xl animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-light text-slate-800">Chat History</h1>
        <div className="relative">
          <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <select
            value={historyFilter}
            onChange={(e) => setHistoryFilter(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg pl-10 pr-8 py-2 text-sm text-slate-700 outline-none focus:border-emerald-400 appearance-none cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-4">User</th>
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-4">Last Message</th>
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-4">Time</th>
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-4">Status</th>
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredHistory.length > 0 ? filteredHistory.map((sess) => (
              <tr key={sess.id} className="hover:bg-slate-50/50 transition-colors group">
                <td className="px-6 py-4 text-sm font-medium text-slate-700">{sess.user}</td>
                <td className="px-6 py-4 text-sm text-slate-500 truncate max-w-[200px]">{sess.lastMsg}</td>
                <td className="px-6 py-4 text-sm text-slate-400">{sess.time}</td>
                <td className="px-6 py-4">
                  <span className={`inline - flex items - center px - 2.5 py - 0.5 rounded - full text - xs font - medium capitalize
                           ${sess.status === 'active' ? 'bg-green-100 text-green-800' :
                      sess.status === 'completed' ? 'bg-slate-100 text-slate-600' :
                        'bg-red-100 text-red-800'
                    } `}>
                    {sess.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="text-slate-400 hover:text-emerald-600 opacity-0 group-hover:opacity-100 transition-all">
                    <MessageSquare size={18} />
                  </button>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-400 text-sm">
                  No sessions found matching filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderIntegration = () => (
    <div className="space-y-8 max-w-4xl animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-light text-slate-800">Integration</h1>
          <p className="text-slate-400 font-light mt-1">Get your agent on your website in seconds.</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
          <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
          Ready to Deploy
        </div>
      </div>

      <div className="grid gap-6">
        {/* Script Embed */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 bg-slate-100 rounded-xl text-slate-600"><Code size={24} /></div>
            <div>
              <h3 className="text-lg font-medium text-slate-800">Script Tag (Recommended)</h3>
              <p className="text-sm text-slate-500 mt-1">Adds the floating widget to the bottom corner of your site. Best for most use cases.</p>
            </div>
          </div>
          <div className="bg-slate-900 rounded-xl p-4 relative group">
            <code className="text-sm font-mono text-emerald-400 break-all">
              &lt;script src="https://cdn.verdantai.com/embed/v1.js" data-agent-id="{agentConfig.id}"&gt;&lt;/script&gt;
            </code>
            <button
              onClick={() => handleCopy(`< script src = "https://cdn.verdantai.com/embed/v1.js" data - agent - id="${agentConfig.id}" ></script > `, 'script')}
              className="absolute top-3 right-3 p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
            >
              {copySuccess === 'script' ? <CheckCircle2 size={16} className="text-emerald-400" /> : <Copy size={16} />}
            </button>
          </div>
        </div>

        {/* Iframe Embed */}
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 bg-slate-100 rounded-xl text-slate-600"><Box size={24} /></div>
            <div>
              <h3 className="text-lg font-medium text-slate-800">Iframe Embed</h3>
              <p className="text-sm text-slate-500 mt-1">Embed the chat interface directly into a page section or container.</p>
            </div>
          </div>
          <div className="bg-slate-900 rounded-xl p-4 relative group">
            <code className="text-sm font-mono text-blue-300 break-all">
              &lt;iframe src="https://verdantai.com/chat/{agentConfig.id}" width="100%" height="600px" frameborder="0"&gt;&lt;/iframe&gt;
            </code>
            <button
              onClick={() => handleCopy(`< iframe src = "https://verdantai.com/chat/${agentConfig.id}" width = "100%" height = "600px" frameborder = "0" ></iframe > `, 'iframe')}
              className="absolute top-3 right-3 p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
            >
              {copySuccess === 'iframe' ? <CheckCircle2 size={16} className="text-emerald-400" /> : <Copy size={16} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (!hasApiKey) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#f8fafc]">
        <div className="text-center space-y-6 max-w-md px-6">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl mx-auto flex items-center justify-center shadow-xl shadow-emerald-200/50">
            <Bot className="text-white" size={32} />
          </div>
          <h1 className="text-xl font-medium text-slate-800">Setup Required</h1>
          <p className="text-slate-500 text-sm">Please select a Google Cloud API Key to continue using VerdantAI.</p>

          <button
            onClick={handleSelectApiKey}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-xl font-medium transition-all shadow-lg shadow-emerald-200 active:scale-95"
          >
            Select API Key
          </button>

          <div className="pt-2">
            <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="text-xs text-slate-400 underline hover:text-emerald-600">
              Billing Information
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#f8fafc] font-sans text-slate-900 selection:bg-emerald-100">

      {/* Sidebar */}
      <aside className="w-20 lg:w-64 bg-white border-r border-slate-200 flex flex-col sticky top-0 h-screen z-40 transition-all">
        <div className="p-6 flex items-center gap-3 mb-6">
          <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-200/50">
            <Bot className="text-white" size={20} />
          </div>
          <span className="font-medium text-lg tracking-tight hidden lg:block text-slate-800">Verdant<span className="text-emerald-500">AI</span></span>
        </div>

        {/* Project Selector */}
        <div className="px-4 mb-6">
          <div className="relative group">
            <button className="w-full flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm text-slate-700 hover:border-emerald-300 transition-colors">
              <span className="truncate">{currentProject?.name || 'Select Project'}</span>
              <ChevronDown size={14} className="text-slate-400" />
            </button>
            <div className="absolute top-full left-0 w-full bg-white border border-slate-200 rounded-lg shadow-lg mt-1 hidden group-hover:block z-50">
              {projects.map(p => (
                <button
                  key={p.id}
                  onClick={() => handleSwitchProject(p)}
                  className={`w - full text - left px - 3 py - 2 text - sm hover: bg - slate - 50 ${currentProject?.id === p.id ? 'text-emerald-600 font-medium' : 'text-slate-600'} `}
                >
                  {p.name}
                </button>
              ))}
              <div className="border-t border-slate-100 p-1">
                <button
                  onClick={handleCreateProject}
                  className="w-full flex items-center gap-2 px-2 py-1.5 text-xs rounded text-emerald-600 hover:bg-emerald-50"
                >
                  <Plus size={12} /> New Project
                </button>
              </div>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          <SidebarItem icon={<LayoutDashboard size={20} />} label="Dashboard" active={currentView === AppView.DASHBOARD} onClick={() => setCurrentView(AppView.DASHBOARD)} />
          <SidebarItem icon={<Wrench size={20} />} label="Agent Builder" active={currentView === AppView.BUILDER} onClick={() => setCurrentView(AppView.BUILDER)} />
          <SidebarItem icon={<BarChart3 size={20} />} label="Analytics" active={currentView === AppView.ANALYTICS} onClick={() => setCurrentView(AppView.ANALYTICS)} />
          <SidebarItem icon={<History size={20} />} label="History" active={currentView === AppView.HISTORY} onClick={() => setCurrentView(AppView.HISTORY)} />
          <div className="pt-4 pb-2">
            <div className="h-px bg-slate-100 mx-2"></div>
          </div>
          <SidebarItem icon={<Code size={20} />} label="Integration" active={currentView === AppView.INTEGRATION} onClick={() => setCurrentView(AppView.INTEGRATION)} />
          <SidebarItem icon={<CreditCard size={20} />} label="Billing" active={currentView === AppView.BILLING} onClick={() => setCurrentView(AppView.BILLING)} />
          <SidebarItem icon={<Settings size={20} />} label="Settings" active={false} onClick={() => window.location.href = '/settings'} />
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button
            onClick={() => window.location.href = '/settings'}
            className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-slate-50 text-slate-500 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-medium text-xs">
              {user?.email?.[0].toUpperCase() || 'U'}
            </div>
            <div className="hidden lg:block text-left">
              <p className="text-xs font-medium text-slate-700 truncate max-w-[100px]">{user?.email || 'User'}</p>
              <p className="text-[10px] text-slate-400">Pro Plan</p>
            </div>
            <LogOut size={16} className="ml-auto hidden lg:block text-slate-400" />
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto h-screen scroll-smooth">
        {currentView === AppView.DASHBOARD && renderDashboard()}
        {currentView === AppView.BUILDER && renderBuilder()}
        {currentView === AppView.ANALYTICS && renderAnalytics()}
        {currentView === AppView.HISTORY && renderHistory()}
        {currentView === AppView.INTEGRATION && renderIntegration()}
        {currentView === AppView.BILLING && <SettingsPage />}
      </main>

    </div>
  );
};

// --- Helper Components ---

const SidebarItem = ({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) => (
  <button
    onClick={onClick}
    className={`flex items - center gap - 3 w - full p - 3 rounded - xl transition - all group relative
      ${active ? 'bg-emerald-50 text-emerald-600 shadow-sm' : 'text-slate-500 hover:bg-white hover:text-emerald-600 hover:shadow-sm'} `}
  >
    {icon}
    <span className="font-medium text-sm hidden lg:block">{label}</span>
    {active && <div className="absolute right-2 w-1.5 h-1.5 bg-emerald-500 rounded-full hidden lg:block"></div>}
  </button>
);

const ArrowUpRight = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M7 7h10v10" /><path d="M7 17 17 7" /></svg>
);

// --- Main App Entry Point ---

export default function App() {
  // DEMO MODE: Bypass authentication for testing
  // TODO: Remove this and uncomment Supabase check for production
  
  /* 
  // Check if Supabase is configured
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const isSupabaseConfigured = supabaseUrl && 
                               supabaseKey && 
                               !supabaseUrl.includes('placeholder') && 
                               !supabaseKey.includes('placeholder') &&
                               supabaseUrl.includes('.supabase.co');

  if (!isSupabaseConfigured) {
    return <SupabaseSetupCheck />;
  }
  */

  return (
    <BrowserRouter>
      <Routes>
        {/* DEMO MODE: Direct access to app without auth */}
        <Route path="/" element={<AppLayout />} />
        <Route path="/dashboard/*" element={<AppLayout />} />
        
        {/* Commented out for demo mode */}
        {/* <Route path="/auth" element={<AuthPage />} /> */}
        {/* <Route path="/settings" element={<RequireAuth>...</RequireAuth>} /> */}
      </Routes>
    </BrowserRouter>
  );
}
