import React, { useState } from 'react';
import {
    User,
    BookOpen,
    Wrench,
    Palette,
    Mic,
    ChevronRight,
    Bot,
    UploadCloud,
    Globe,
    Plus,
    Search,
    Clock,
    Sun,
    Moon,
    CheckCircle2,
    Play,
    X,
    Send,
    ArrowRight,
    Sparkles,
    MessageCircle,
    Zap,
    Heart,
    Phone,
    Headphones,
    Volume2,
    MessageSquare,
    Smile,
    Image,
    Check
} from 'lucide-react';
import { AgentConfig, BuilderTab } from '../../types';
import ChatWidget from '../../components/ChatWidget';
import { previewVoice } from '../../services/geminiService';
import { supabaseService } from '../services/supabaseService';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface AgentBuilderProps {
    agentConfig: AgentConfig;
    setAgentConfig: (config: AgentConfig) => void;
    activeTab: BuilderTab;
    setActiveTab: (tab: BuilderTab) => void;
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

const AgentBuilder: React.FC<AgentBuilderProps> = ({
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
}) => {

    const navigate = useNavigate();
    const { user } = useAuth();
    const [playingVoice, setPlayingVoice] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const handleSaveAndDeploy = async () => {
        if (!user) {
            alert('You must be logged in to save');
            return;
        }

        setIsSaving(true);
        try {
            // Use currentProjectId if available, otherwise check config.id
            const projectId = currentProjectId || agentConfig.id;
            const isExistingProject = projectId && projectId.includes('-');

            if (isExistingProject) {
                // Update existing project
                await supabaseService.updateProject(projectId, agentConfig, agentConfig.name);
            } else {
                // Create new project
                await supabaseService.createProject(user.id, agentConfig.name, agentConfig);
            }

            // Navigate to integration
            navigate('/dashboard/integration');
        } catch (error) {
            console.error("Failed to save:", error);
            alert('Failed to save agent. Please try again.');
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

        try {
            // Try to use the backend API first
            // Create a temporary config with the selected voice
            const tempConfig = { ...agentConfig, voice: { ...agentConfig.voice, name: voice } };
            const audioBuffer = await previewVoice(tempConfig);

            if (audioBuffer) {
                const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
                const source = ctx.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(ctx.destination);
                source.onended = () => setPlayingVoice(null);
                source.start(0);
                return;
            }
        } catch (err) {
            console.warn("Backend TTS failed, falling back to browser TTS", err);
        }

        // Fallback to browser TTS
        const utterance = new SpeechSynthesisUtterance(`Hello, I am ${agentConfig.name || 'your agent'}. This is a preview of the ${voice} voice.`);
        utterance.rate = agentConfig.voice.speed;
        utterance.pitch = agentConfig.voice.pitch;

        // Attempt to find a matching system voice
        const voices = window.speechSynthesis.getVoices();
        const voiceMap: Record<string, string> = {
            'Alloy': 'Google US English',
            'Echo': 'Microsoft David',
            'Fable': 'Google UK English Male',
            'Onyx': 'Microsoft Mark',
            'Nova': 'Google US English Female',
            'Shimmer': 'Microsoft Zira'
        };

        const targetVoice = voices.find(v => v.name.includes(voiceMap[voice] || voice));
        if (targetVoice) utterance.voice = targetVoice;

        utterance.onend = () => setPlayingVoice(null);
        window.speechSynthesis.speak(utterance);
    };

    const renderIdentityTab = () => (
        <div className="space-y-8 animate-fade-in">
            <div className="space-y-5">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">Agent Identity</h3>

                <div className="relative group">
                    <input
                        type="text"
                        value={agentConfig.name}
                        onChange={(e) => setAgentConfig({ ...agentConfig, name: e.target.value })}
                        className="peer w-full bg-white border border-slate-200 rounded-xl px-4 pt-5 pb-2 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all font-medium text-slate-700 placeholder-transparent"
                        placeholder="Agent Name"
                        id="agent-name"
                    />
                    <label htmlFor="agent-name" className="absolute left-4 top-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:font-normal peer-placeholder-shown:text-slate-400 peer-focus:top-1.5 peer-focus:text-[10px] peer-focus:font-bold peer-focus:text-emerald-500">
                        Agent Name
                    </label>
                </div>

                <div className="relative group">
                    <textarea
                        value={agentConfig.greeting}
                        onChange={(e) => setAgentConfig({ ...agentConfig, greeting: e.target.value })}
                        rows={2}
                        className="peer w-full bg-white border border-slate-200 rounded-xl px-4 pt-5 pb-2 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none font-light text-slate-700 resize-none placeholder-transparent"
                        placeholder="Greeting Message"
                        id="agent-greeting"
                    />
                    <label htmlFor="agent-greeting" className="absolute left-4 top-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:font-normal peer-placeholder-shown:text-slate-400 peer-focus:top-1.5 peer-focus:text-[10px] peer-focus:font-bold peer-focus:text-emerald-500">
                        Greeting Message
                    </label>
                </div>
            </div>

            <div className="space-y-5 pt-6 border-t border-slate-100">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">Persona & Behavior</h3>

                <div className="relative group">
                    <textarea
                        value={agentConfig.systemInstruction}
                        onChange={(e) => setAgentConfig({ ...agentConfig, systemInstruction: e.target.value })}
                        rows={6}
                        className="peer w-full bg-white border border-slate-200 rounded-xl px-4 pt-5 pb-2 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none font-mono text-xs text-slate-600 resize-none placeholder-transparent leading-relaxed"
                        placeholder="System Instruction"
                        id="agent-instruction"
                    />
                    <label htmlFor="agent-instruction" className="absolute left-4 top-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:font-normal peer-placeholder-shown:text-slate-400 peer-focus:top-1.5 peer-focus:text-[10px] peer-focus:font-bold peer-focus:text-emerald-500">
                        System Instruction
                    </label>
                    <div className="absolute bottom-2 right-2 text-[10px] text-slate-300 font-mono">PROMPT</div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200">
                    <div className="flex justify-between mb-4">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Response Length</label>
                        <span className="text-xs font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600">{agentConfig.maxReplyTokens} tokens</span>
                    </div>
                    <input
                        type="range" min="50" max="1000" step="10"
                        value={agentConfig.maxReplyTokens}
                        onChange={(e) => setAgentConfig({ ...agentConfig, maxReplyTokens: parseInt(e.target.value) })}
                        className="w-full accent-emerald-500 h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between mt-2 text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                        <span>Concise</span>
                        <span>Verbose</span>
                    </div>
                </div>
            </div>

            <div className="pt-6 border-t border-slate-100">
                <label className="block text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">Quick Replies</label>
                <div className="bg-white p-1 rounded-xl border border-slate-200 flex items-center gap-2 mb-3 shadow-sm focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 transition-all">
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
                        className="bg-slate-100 hover:bg-emerald-500 hover:text-white text-slate-500 p-2 rounded-lg transition-all"
                    >
                        <Plus size={18} />
                    </button>
                </div>
                <div className="flex flex-wrap gap-2">
                    {agentConfig.quickReplies?.map((reply, idx) => (
                        <div key={idx} className="group bg-white border border-slate-200 hover:border-emerald-200 hover:shadow-sm text-slate-600 text-xs font-medium px-3 py-1.5 rounded-lg flex items-center gap-2 transition-all cursor-default">
                            {reply}
                            <button onClick={() => removeQuickReply(idx)} className="text-slate-300 hover:text-red-500 transition-colors">
                                <X size={12} />
                            </button>
                        </div>
                    ))}
                    {(!agentConfig.quickReplies || agentConfig.quickReplies.length === 0) && (
                        <p className="text-xs text-slate-400 italic">No quick replies added yet.</p>
                    )}
                </div>
            </div>
        </div>
    );

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
                                    <p className="text-sm font-bold text-slate-700 group-hover:text-emerald-600 transition-colors">Click to upload or drag and drop</p>
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
                    rows={10}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none font-mono text-xs text-slate-600 resize-none leading-relaxed"
                    placeholder="Paste text or upload files to populate this context..."
                />
            </div>
        </div>
    );

    const renderToolsTab = () => (
        <div className="space-y-6 animate-fade-in">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <h4 className="text-sm font-bold text-slate-800 mb-1">Agent Capabilities</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                    Enable specific tools to give your agent real-time capabilities.
                </p>
            </div>

            <div className="grid grid-cols-1 gap-3">
                <div
                    onClick={() => toggleTool('googleSearch')}
                    className={`group flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer ${agentConfig.tools.includes('googleSearch') ? 'border-emerald-500 bg-emerald-50/30 shadow-sm' : 'border-slate-200 bg-white hover:border-emerald-300 hover:shadow-sm'}`}
                >
                    <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${agentConfig.tools.includes('googleSearch') ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-500'}`}>
                            <Search size={20} />
                        </div>
                        <div>
                            <p className={`text-sm font-bold transition-colors ${agentConfig.tools.includes('googleSearch') ? 'text-emerald-900' : 'text-slate-700'}`}>Google Search</p>
                            <p className="text-[10px] text-slate-400 font-medium mt-0.5">Web grounding & real-time info</p>
                        </div>
                    </div>

                    <div className={`w-11 h-6 rounded-full transition-colors relative ${agentConfig.tools.includes('googleSearch') ? 'bg-emerald-500' : 'bg-slate-200'}`}>
                        <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${agentConfig.tools.includes('googleSearch') ? 'translate-x-5' : 'translate-x-0'}`} />
                    </div>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50 opacity-60 cursor-not-allowed">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-slate-200 flex items-center justify-center text-slate-400">
                            <Clock size={20} />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-500">Booking & Scheduling</p>
                            <p className="text-[10px] text-slate-400 font-medium mt-0.5">Calendar API Integration</p>
                        </div>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-200 px-2 py-1 rounded uppercase tracking-wider">Coming Soon</span>
                </div>
            </div>
        </div>
    );

    const renderStyleTab = () => (
        <div className="space-y-8 animate-fade-in">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <h4 className="text-sm font-bold text-slate-800 mb-1">Appearance</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                    Customize every aspect of your agent's design.
                </p>
            </div>

            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Theme Mode</label>
                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={() => setAgentConfig({ ...agentConfig, theme: { ...agentConfig.theme, mode: 'light' } })}
                        className={`p-4 rounded-xl border flex items-center justify-center gap-2 transition-all ${agentConfig.theme.mode === 'light' ? 'border-emerald-500 bg-emerald-50/30 text-emerald-700 ring-1 ring-emerald-500' : 'border-slate-200 hover:border-emerald-200 text-slate-600'}`}
                    >
                        <Sun size={18} />
                        <span className="text-sm font-medium">Light</span>
                    </button>
                    <button
                        onClick={() => setAgentConfig({ ...agentConfig, theme: { ...agentConfig.theme, mode: 'dark' } })}
                        className={`p-4 rounded-xl border flex items-center justify-center gap-2 transition-all ${agentConfig.theme.mode === 'dark' ? 'border-emerald-500 bg-slate-800 text-emerald-400 ring-1 ring-emerald-500' : 'border-slate-200 hover:border-emerald-200 text-slate-600'}`}
                    >
                        <Moon size={18} />
                        <span className="text-sm font-medium">Dark</span>
                    </button>
                </div>
            </div>

            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Agent Avatar</label>
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden relative group">
                        {agentConfig.theme.avatarImage ? (
                            <img src={agentConfig.theme.avatarImage} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            <Bot size={24} className="text-slate-400" />
                        )}
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                            <UploadCloud size={16} className="text-white" />
                        </div>
                        <input
                            type="file"
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            onChange={handleLogoUpload}
                            accept="image/*"
                        />
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-medium text-slate-700">Custom Icon</p>
                        <p className="text-xs text-slate-400 mt-1">Best results: Square image with transparent background (PNG). Max 2MB.</p>
                        {agentConfig.theme.avatarImage && (
                            <div className="mt-3 flex items-center gap-2">
                                <div
                                    onClick={() => setAgentConfig({ ...agentConfig, theme: { ...agentConfig.theme, useLogoAsLauncher: !agentConfig.theme.useLogoAsLauncher } })}
                                    className={`w-4 h-4 rounded border flex items-center justify-center cursor-pointer transition-colors ${agentConfig.theme.useLogoAsLauncher ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300 bg-white'}`}
                                >
                                    {agentConfig.theme.useLogoAsLauncher && <Check size={12} className="text-white" />}
                                </div>
                                <label className="text-xs text-slate-600 font-medium cursor-pointer" onClick={() => setAgentConfig({ ...agentConfig, theme: { ...agentConfig.theme, useLogoAsLauncher: !agentConfig.theme.useLogoAsLauncher } })}>
                                    Use logo as launcher bubble
                                </label>
                            </div>
                        )}
                    </div>
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

            <div className="space-y-4">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Typography</label>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-[10px] text-slate-400 font-bold uppercase mb-1.5 block">Font Family</label>
                        <select
                            value={agentConfig.theme.fontFamily}
                            onChange={(e) => setAgentConfig({ ...agentConfig, theme: { ...agentConfig.theme, fontFamily: e.target.value as any } })}
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 outline-none focus:border-emerald-500"
                        >
                            <option value="inter">Inter</option>
                            <option value="roboto">Roboto</option>
                            <option value="mono">Monospace</option>
                        </select>
                    </div>

                    <div>
                        <label className="text-[10px] text-slate-400 font-bold uppercase mb-1.5 block">Font Weight</label>
                        <select
                            value={agentConfig.theme.fontWeight || 'normal'}
                            onChange={(e) => setAgentConfig({ ...agentConfig, theme: { ...agentConfig.theme, fontWeight: e.target.value as any } })}
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 outline-none focus:border-emerald-500"
                        >
                            <option value="normal">Normal</option>
                            <option value="medium">Medium</option>
                            <option value="bold">Bold</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Icons</label>
                <div className="grid grid-cols-1 gap-3">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Header Icon</label>
                        <div className="grid grid-cols-6 gap-2 mb-3">
                            {['Bot', 'MessageSquare', 'Sparkles', 'Zap', 'Heart', 'Smile'].map((icon) => (
                                <button
                                    key={icon}
                                    onClick={() => setAgentConfig({ ...agentConfig, theme: { ...agentConfig.theme, headerIcon: icon } })}
                                    className={`w-10 h-10 rounded-lg flex items-center justify-center text-slate-600 transition-all ${agentConfig.theme.headerIcon === icon ? 'bg-emerald-100 border-2 border-emerald-500 text-emerald-600' : 'bg-slate-50 border border-slate-200 hover:bg-slate-100'}`}
                                >
                                    {icon === 'Bot' && <Bot size={20} />}
                                    {icon === 'MessageSquare' && <MessageSquare size={20} />}
                                    {icon === 'Sparkles' && <Sparkles size={20} />}
                                    {icon === 'Zap' && <Zap size={20} />}
                                    {icon === 'Heart' && <Heart size={20} />}
                                    {icon === 'Smile' && <Smile size={20} />}
                                </button>
                            ))}
                        </div>
                        <div className="flex items-center gap-3">
                            <input
                                type="text"
                                value={agentConfig.theme.headerIcon || ''}
                                onChange={(e) => setAgentConfig({ ...agentConfig, theme: { ...agentConfig.theme, headerIcon: e.target.value } })}
                                placeholder="Or type custom emoji..."
                                className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-500 placeholder-slate-400"
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl">
                        <span className="text-sm text-slate-600">Send Icon</span>
                        <div className="flex bg-slate-100 p-1 rounded-lg">
                            {['send', 'arrow', 'plane', 'sparkle'].map((icon) => (
                                <button
                                    key={icon}
                                    onClick={() => setAgentConfig({ ...agentConfig, theme: { ...agentConfig.theme, sendButtonIcon: icon as any } })}
                                    className={`p-1.5 rounded transition-all ${agentConfig.theme.sendButtonIcon === icon || (!agentConfig.theme.sendButtonIcon && icon === 'arrow') ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
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

            <div className="space-y-4">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Header Text</label>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-[10px] text-slate-400 font-bold uppercase mb-1.5 block">Size</label>
                        <select
                            value={agentConfig.theme.headerTitleSize || 'md'}
                            onChange={(e) => setAgentConfig({ ...agentConfig, theme: { ...agentConfig.theme, headerTitleSize: e.target.value as any } })}
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 outline-none focus:border-emerald-500"
                        >
                            <option value="sm">Small</option>
                            <option value="md">Medium</option>
                            <option value="lg">Large</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-[10px] text-slate-400 font-bold uppercase mb-1.5 block">Weight</label>
                        <select
                            value={agentConfig.theme.headerTitleWeight || 'medium'}
                            onChange={(e) => setAgentConfig({ ...agentConfig, theme: { ...agentConfig.theme, headerTitleWeight: e.target.value as any } })}
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 outline-none focus:border-emerald-500"
                        >
                            <option value="normal">Normal</option>
                            <option value="medium">Medium</option>
                            <option value="bold">Bold</option>
                        </select>
                    </div>
                </div>
            </div>

            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Text Size</label>
                <div className="bg-slate-100 p-1 rounded-xl flex">
                    {['sm', 'md', 'lg'].map((size) => (
                        <button
                            key={size}
                            onClick={() => setAgentConfig({ ...agentConfig, theme: { ...agentConfig.theme, textSize: size as any } })}
                            className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all capitalize ${agentConfig.theme.textSize === size ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            {size === 'sm' ? 'Small' : size === 'md' ? 'Medium' : 'Large'}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-4">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Dimensions</label>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-[10px] text-slate-400 font-bold uppercase mb-1.5 block">Window Size</label>
                        <select
                            value={agentConfig.theme.chatWindowSize || 'md'}
                            onChange={(e) => setAgentConfig({ ...agentConfig, theme: { ...agentConfig.theme, chatWindowSize: e.target.value as any } })}
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 outline-none focus:border-emerald-500"
                        >
                            <option value="sm">Small</option>
                            <option value="md">Medium</option>
                            <option value="lg">Large</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-[10px] text-slate-400 font-bold uppercase mb-1.5 block">Launcher Size</label>
                        <select
                            value={agentConfig.theme.launcherBubbleSize || 'md'}
                            onChange={(e) => setAgentConfig({ ...agentConfig, theme: { ...agentConfig.theme, launcherBubbleSize: e.target.value as any } })}
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 outline-none focus:border-emerald-500"
                        >
                            <option value="sm">Small</option>
                            <option value="md">Medium</option>
                            <option value="lg">Large</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Launcher Icon */}
            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Launcher Icon</label>
                <div className="bg-slate-100 p-1 rounded-xl flex gap-1 overflow-x-auto">
                    {['MessageCircle', 'Bot', 'Sparkles', 'Zap', 'Heart'].map((icon) => (
                        <button
                            key={icon}
                            onClick={() => setAgentConfig({ ...agentConfig, theme: { ...agentConfig.theme, launcherIcon: icon } })}
                            className={`flex-1 py-2 flex items-center justify-center rounded-lg transition-all ${agentConfig.theme.launcherIcon === icon ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            title={icon}
                        >
                            {icon === 'MessageCircle' && <MessageCircle size={18} />}
                            {icon === 'Bot' && <Bot size={18} />}
                            {icon === 'Sparkles' && <Sparkles size={18} />}
                            {icon === 'Zap' && <div className="font-bold">⚡</div>}
                            {icon === 'Heart' && <div className="font-bold">❤️</div>}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl">
                <span className="text-sm text-slate-600">Scrollbar Color</span>
                <div className="flex items-center gap-2 relative">
                    <div className="w-6 h-6 rounded-full border border-slate-200 shadow-sm" style={{ backgroundColor: agentConfig.theme.scrollbarColor || '#cbd5e1' }}></div>
                    <input
                        type="color"
                        value={agentConfig.theme.scrollbarColor || '#cbd5e1'}
                        onChange={(e) => setAgentConfig({ ...agentConfig, theme: { ...agentConfig.theme, scrollbarColor: e.target.value } })}
                        className="w-8 h-8 opacity-0 absolute cursor-pointer"
                    />
                    <span className="text-xs font-mono text-slate-400 uppercase">{agentConfig.theme.scrollbarColor || 'Default'}</span>
                </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl">
                <div>
                    <p className="text-sm font-bold text-slate-800">Show Branding</p>
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">Display "Powered by VerdantAI"</p>
                </div>
                <div
                    onClick={() => setAgentConfig({ ...agentConfig, theme: { ...agentConfig.theme, showBranding: !agentConfig.theme.showBranding } })}
                    className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${agentConfig.theme.showBranding ? 'bg-emerald-500' : 'bg-slate-200'}`}
                >
                    <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${agentConfig.theme.showBranding ? 'translate-x-5' : 'translate-x-0'}`} />
                </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
                <button
                    onClick={() => setAgentConfig({
                        ...agentConfig, theme: {
                            ...agentConfig.theme,
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
                            scrollbarColor: undefined,
                            showBranding: true
                        }
                    })}
                    className="w-full py-3 rounded-xl border border-slate-200 text-slate-600 font-medium text-sm hover:bg-slate-50 hover:text-slate-900 transition-colors flex items-center justify-center gap-2"
                >
                    <span className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin hidden"></span>
                    Reset to Default Styles
                </button>
            </div>

            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Corner Radius</label>
                <div className="bg-slate-100 p-1 rounded-xl flex overflow-x-auto">
                    {['none', 'sm', 'md', 'lg', 'xl', '2xl', 'full'].map((radius) => (
                        <button
                            key={radius}
                            onClick={() => setAgentConfig({ ...agentConfig, theme: { ...agentConfig.theme, radius: radius as any } })}
                            className={`flex-1 py-2 px-3 text-xs font-medium rounded-lg transition-all capitalize whitespace-nowrap ${agentConfig.theme.radius === radius ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            {radius}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );

    const renderVoiceTab = () => (
        <div className="space-y-8 animate-fade-in">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <h4 className="text-sm font-bold text-slate-800 mb-1">Voice Personality</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                    Choose a voice that matches your brand's persona and configure call settings.
                </p>
            </div>

            <div className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl">
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${agentConfig.voice.phoneCallEnabled ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                        <Mic size={20} />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-slate-800">Enable Phone Calls</p>
                        <p className="text-[10px] text-slate-400 font-medium mt-0.5">Allow users to call your agent</p>
                    </div>
                </div>
                <div
                    onClick={() => setAgentConfig({ ...agentConfig, voice: { ...agentConfig.voice, phoneCallEnabled: !agentConfig.voice.phoneCallEnabled } })}
                    className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${agentConfig.voice.phoneCallEnabled ? 'bg-emerald-500' : 'bg-slate-200'}`}
                >
                    <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${agentConfig.voice.phoneCallEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                </div>
            </div>

            {agentConfig.voice.phoneCallEnabled && (
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Call Button Icon</label>
                    <div className="flex gap-2">
                        {['Phone', 'Mic', 'Headphones', 'Volume2'].map((icon) => (
                            <button
                                key={icon}
                                onClick={() => setAgentConfig({ ...agentConfig, voice: { ...agentConfig.voice, callButtonIcon: icon } })}
                                className={`w-10 h-10 rounded-lg flex items-center justify-center text-slate-600 transition-all ${agentConfig.voice.callButtonIcon === icon ? 'bg-emerald-100 border-2 border-emerald-500 text-emerald-600' : 'bg-slate-50 border border-slate-200 hover:bg-slate-100'}`}
                            >
                                {icon === 'Phone' && <Phone size={20} />}
                                {icon === 'Mic' && <Mic size={20} />}
                                {icon === 'Headphones' && <Headphones size={20} />}
                                {icon === 'Volume2' && <Volume2 size={20} />}
                            </button>
                        ))}
                        <input
                            type="text"
                            value={agentConfig.voice.callButtonIcon && !['Phone', 'Mic', 'Headphones', 'Volume2'].includes(agentConfig.voice.callButtonIcon) ? agentConfig.voice.callButtonIcon : ''}
                            onChange={(e) => setAgentConfig({ ...agentConfig, voice: { ...agentConfig.voice, callButtonIcon: e.target.value } })}
                            placeholder="Emoji"
                            className="w-20 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-emerald-500 text-center placeholder-slate-400"
                        />
                    </div>
                </div>
            )}

            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Language</label>
                <select
                    value={agentConfig.voice.language || 'English'}
                    onChange={(e) => setAgentConfig({ ...agentConfig, voice: { ...agentConfig.voice, language: e.target.value } })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
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
                    <optgroup label="All Supported">
                        <option value="Arabic">Arabic</option>
                        <option value="Bengali">Bengali</option>
                        <option value="Bulgarian">Bulgarian</option>
                        <option value="Croatian">Croatian</option>
                        <option value="Czech">Czech</option>
                        <option value="Danish">Danish</option>
                        <option value="Dutch">Dutch</option>
                        <option value="English (UK)">English (UK)</option>
                        <option value="English (Australia)">English (Australia)</option>
                        <option value="Estonian">Estonian</option>
                        <option value="Finnish">Finnish</option>
                        <option value="Greek">Greek</option>
                        <option value="Hebrew">Hebrew</option>
                        <option value="Hungarian">Hungarian</option>
                        <option value="Indonesian">Indonesian</option>
                        <option value="Italian">Italian</option>
                        <option value="Korean">Korean</option>
                        <option value="Latvian">Latvian</option>
                        <option value="Lithuanian">Lithuanian</option>
                        <option value="Norwegian">Norwegian</option>
                        <option value="Polish">Polish</option>
                        <option value="Romanian">Romanian</option>
                        <option value="Russian">Russian</option>
                        <option value="Serbian">Serbian</option>
                        <option value="Slovak">Slovak</option>
                        <option value="Slovenian">Slovenian</option>
                        <option value="Swahili">Swahili</option>
                        <option value="Swedish">Swedish</option>
                        <option value="Thai">Thai</option>
                        <option value="Turkish">Turkish</option>
                        <option value="Ukrainian">Ukrainian</option>
                        <option value="Vietnamese">Vietnamese</option>
                    </optgroup>
                </select>
            </div>

            <div className="grid grid-cols-1 gap-3">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Voice Gender</label>
                <div className="flex gap-3">
                    <button
                        onClick={() => setAgentConfig({ ...agentConfig, voice: { ...agentConfig.voice, gender: 'male' } })}
                        className={`flex-1 py-3 rounded-xl border font-medium text-sm transition-all ${agentConfig.voice.gender === 'male' ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-white border-slate-200 text-slate-600 hover:border-emerald-200'}`}
                    >
                        Male
                    </button>
                    <button
                        onClick={() => setAgentConfig({ ...agentConfig, voice: { ...agentConfig.voice, gender: 'female' } })}
                        className={`flex-1 py-3 rounded-xl border font-medium text-sm transition-all ${agentConfig.voice.gender === 'female' ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-white border-slate-200 text-slate-600 hover:border-emerald-200'}`}
                    >
                        Female
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Voice Model</label>
                {['Alloy', 'Echo', 'Fable', 'Onyx', 'Nova', 'Shimmer']
                    .filter(voice => {
                        if (!agentConfig.voice.gender) return true;
                        const males = ['Echo', 'Fable', 'Onyx'];
                        const females = ['Alloy', 'Nova', 'Shimmer'];
                        return agentConfig.voice.gender === 'male' ? males.includes(voice) : females.includes(voice);
                    })
                    .map((voice) => (
                        <div
                            key={voice}
                            onClick={() => setAgentConfig({ ...agentConfig, voice: { ...agentConfig.voice, name: voice } })}
                            className={`group flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${agentConfig.voice.name === voice ? 'border-emerald-500 bg-emerald-50/30 shadow-sm' : 'border-slate-200 bg-white hover:border-emerald-300 hover:shadow-sm'}`}
                        >
                            <div className="flex items-center gap-4">
                                <div
                                    onClick={(e) => handlePlayPreview(voice, e)}
                                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors cursor-pointer hover:scale-105 active:scale-95 ${agentConfig.voice.name === voice ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-500'}`}
                                >
                                    {playingVoice === voice ? <div className="w-3 h-3 bg-current rounded-sm animate-pulse" /> : (agentConfig.voice.name === voice ? <Mic size={20} /> : <Play size={20} className="ml-0.5" />)}
                                </div>
                                <div>
                                    <p className={`text-sm font-bold transition-colors ${agentConfig.voice.name === voice ? 'text-emerald-900' : 'text-slate-700'}`}>{voice}</p>
                                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">Neutral • Balanced</p>
                                </div>
                            </div>
                            {agentConfig.voice.name === voice && (
                                <div className="text-emerald-500">
                                    <CheckCircle2 size={20} />
                                </div>
                            )}
                        </div>
                    ))}
            </div>
            <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-6">
                <div>
                    <div className="flex justify-between mb-4">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Speed</label>
                        <span className="text-xs font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600">{agentConfig.voice.speed}x</span>
                    </div>
                    <input
                        type="range" min="0.5" max="2.0" step="0.1"
                        value={agentConfig.voice.speed}
                        onChange={(e) => setAgentConfig({ ...agentConfig, voice: { ...agentConfig.voice, speed: parseFloat(e.target.value) } })}
                        className="w-full accent-emerald-500 h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer"
                    />
                </div>
                <div>
                    <div className="flex justify-between mb-4">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Pitch</label>
                        <span className="text-xs font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600">{agentConfig.voice.pitch}</span>
                    </div>
                    <input
                        type="range" min="0.5" max="2.0" step="0.1"
                        value={agentConfig.voice.pitch}
                        onChange={(e) => setAgentConfig({ ...agentConfig, voice: { ...agentConfig.voice, pitch: parseFloat(e.target.value) } })}
                        className="w-full accent-emerald-500 h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer"
                    />
                </div>
            </div>
        </div>
    );

    return (
        <div className="flex h-full overflow-hidden">
            {/* Left Sidebar - Fixed */}
            <div className="w-64 border-r border-slate-200 bg-white flex flex-col flex-shrink-0 h-full">
                <div className="p-4 border-b border-slate-100 flex-shrink-0">
                    <h2 className="font-bold text-slate-800">Agent Builder</h2>
                    <p className="text-xs text-slate-500">Configure your assistant</p>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {[
                        { id: 'identity', label: 'Identity', icon: <User size={18} /> },
                        { id: 'knowledge', label: 'Knowledge', icon: <BookOpen size={18} /> },
                        { id: 'tools', label: 'Tools', icon: <Wrench size={18} /> },
                        { id: 'style', label: 'Style', icon: <Palette size={18} /> },
                        { id: 'voice', label: 'Voice', icon: <Mic size={18} /> },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as BuilderTab)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                        >
                            {tab.icon}
                            {tab.label}
                            {activeTab === tab.id && <ChevronRight size={14} className="ml-auto text-emerald-500" />}
                        </button>
                    ))}
                </div>
                <div className="p-4 border-t border-slate-100 flex-shrink-0">
                    <button
                        onClick={handleSaveAndDeploy}
                        disabled={isSaving}
                        className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/20 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isSaving ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <UploadCloud size={18} />
                                Save & Deploy
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Middle Content - Scrollable */}
            <div className="flex-1 bg-slate-50/50 overflow-y-auto h-full">
                <div className="max-w-3xl mx-auto p-8 h-full">
                    {activeTab === 'identity' && renderIdentityTab()}
                    {activeTab === 'knowledge' && renderKnowledgeTab()}
                    {activeTab === 'tools' && renderToolsTab()}
                    {activeTab === 'style' && renderStyleTab()}
                    {activeTab === 'voice' && renderVoiceTab()}
                </div>
            </div>

            {/* Right Preview - Fixed */}
            <div className="w-[500px] border-l border-slate-200 bg-slate-100 flex flex-col flex-shrink-0 h-full relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-50"></div>

                <div className="relative z-10 w-full h-full flex flex-col">
                    <div className="p-6 text-center flex-shrink-0">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Live Preview</h3>
                        <p className="text-xs text-slate-400 mt-1">Interact with your agent as you build</p>
                    </div>

                    <div className="flex-1 flex items-end justify-end p-6">
                        <div className="transform scale-90 origin-bottom-right">
                            <ChatWidget
                                config={agentConfig}
                                previewMode={true}
                                userId={user?.id}
                                projectId={currentProjectId || agentConfig.id}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div >
    );
};

export default AgentBuilder;
