import React, { useState, useEffect } from 'react';
import { useOrganizations } from '../context/OrganizationsContext';
import {
    Bot,
    Code,
    Phone,
    Copy,
    Check,
    ExternalLink,
    Globe,
    Smartphone,
    MessageSquare,
    Settings
} from 'lucide-react';
import Toast, { ToastType } from '../components/Toast';

const IntegrationPage: React.FC = () => {
    const { bots, currentBot, setCurrentBot, currentOrganization } = useOrganizations();
    const [activeTab, setActiveTab] = useState<'web' | 'phone'>('web');
    const [copiedField, setCopiedField] = useState<string | null>(null);
    const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

    // Select the first bot if none is selected
    useEffect(() => {
        if (!currentBot && bots.length > 0) {
            setCurrentBot(bots[0]);
        }
    }, [bots, currentBot, setCurrentBot]);

    const handleCopy = (text: string, field: string) => {
        navigator.clipboard.writeText(text);
        setCopiedField(field);
        setToast({ message: 'Copied to clipboard!', type: 'success' });
        setTimeout(() => setCopiedField(null), 2000);
    };

    const getWebEmbedCode = () => {
        if (!currentBot) return '';
        const scriptUrl = `${window.location.origin}/widget.js`; // Placeholder for actual script URL
        return `<!-- Chat Widget Embed Code -->
<script 
  src="${scriptUrl}"
  data-agent-id="${currentBot.id}"
  data-org-id="${currentOrganization?.id}"
  async
></script>`;
    };

    const getIframeCode = () => {
        if (!currentBot) return '';
        const iframeUrl = `${window.location.origin}/embed/${currentBot.id}`;
        return `<iframe
  src="${iframeUrl}"
  width="100%"
  height="600"
  frameborder="0"
  allow="microphone"
></iframe>`;
    };

    if (bots.length === 0) {
        return (
            <div className="flex-1 flex items-center justify-center bg-slate-50 h-full">
                <div className="text-center p-8 bg-white rounded-2xl shadow-xl max-w-md">
                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Bot size={32} className="text-emerald-600" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-800 mb-2">No Agents Found</h2>
                    <p className="text-slate-500 mb-6">
                        You need to create an agent before you can integrate it.
                    </p>
                    <a
                        href="/agents"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-medium"
                    >
                        Go to Agent Builder
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-full bg-slate-50 overflow-hidden">
            {/* Sidebar - Agent Selection */}
            <aside className="w-80 bg-white border-r border-slate-200 flex flex-col overflow-hidden flex-shrink-0">
                <div className="p-6 border-b border-slate-200">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <Globe size={20} className="text-emerald-600" />
                        Integration
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">
                        Deploy your agents to the world
                    </p>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-2">
                        Select Agent
                    </h3>
                    {bots.map((bot) => (
                        <button
                            key={bot.id}
                            onClick={() => setCurrentBot(bot)}
                            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left ${currentBot?.id === bot.id
                                    ? 'bg-emerald-50 border-2 border-emerald-500 shadow-sm'
                                    : 'hover:bg-slate-50 border-2 border-transparent'
                                }`}
                        >
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${currentBot?.id === bot.id
                                    ? 'bg-emerald-500 text-white'
                                    : 'bg-slate-100 text-slate-500'
                                }`}>
                                <Bot size={20} />
                            </div>
                            <div className="min-w-0 flex-1">
                                <h4 className={`font-medium truncate ${currentBot?.id === bot.id ? 'text-emerald-900' : 'text-slate-700'
                                    }`}>
                                    {bot.name}
                                </h4>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className={`w-1.5 h-1.5 rounded-full ${bot.is_active ? 'bg-emerald-500' : 'bg-slate-300'
                                        }`} />
                                    <span className="text-xs text-slate-400">
                                        {bot.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                            </div>
                            {currentBot?.id === bot.id && (
                                <Check size={16} className="text-emerald-600" />
                            )}
                        </button>
                    ))}
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto p-8">
                {currentBot && (
                    <div className="max-w-4xl mx-auto space-y-8">
                        {/* Header */}
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                                    Deploy <span className="text-emerald-600">{currentBot.name}</span>
                                </h1>
                                <p className="text-slate-500 mt-1">
                                    Choose how you want to integrate this agent into your workflow
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setActiveTab('web')}
                                    className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${activeTab === 'web'
                                            ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200'
                                            : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                                        }`}
                                >
                                    <Globe size={18} />
                                    Web Widget
                                </button>
                                <button
                                    onClick={() => setActiveTab('phone')}
                                    className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${activeTab === 'phone'
                                            ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200'
                                            : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                                        }`}
                                >
                                    <Phone size={18} />
                                    Phone Call
                                </button>
                            </div>
                        </div>

                        {/* Content Area */}
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            {activeTab === 'web' ? (
                                <div className="p-6 space-y-8">
                                    {/* Script Embed */}
                                    <div>
                                        <div className="flex items-center justify-between mb-4">
                                            <div>
                                                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                                    <Code size={20} className="text-emerald-500" />
                                                    Script Embed
                                                </h3>
                                                <p className="text-sm text-slate-500">
                                                    Add this code to your website's &lt;head&gt; or &lt;body&gt; to show the chat widget.
                                                </p>
                                            </div>
                                        </div>
                                        <div className="relative group">
                                            <pre className="bg-slate-900 text-slate-300 p-4 rounded-xl text-sm font-mono overflow-x-auto border border-slate-800">
                                                {getWebEmbedCode()}
                                            </pre>
                                            <button
                                                onClick={() => handleCopy(getWebEmbedCode(), 'script')}
                                                className="absolute top-3 right-3 p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors backdrop-blur-sm"
                                                title="Copy code"
                                            >
                                                {copiedField === 'script' ? <Check size={16} /> : <Copy size={16} />}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="w-full h-px bg-slate-100" />

                                    {/* Iframe Embed */}
                                    <div>
                                        <div className="flex items-center justify-between mb-4">
                                            <div>
                                                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                                    <ExternalLink size={20} className="text-emerald-500" />
                                                    Iframe Embed
                                                </h3>
                                                <p className="text-sm text-slate-500">
                                                    Use this if you want to embed the chat interface directly into a page.
                                                </p>
                                            </div>
                                        </div>
                                        <div className="relative group">
                                            <pre className="bg-slate-900 text-slate-300 p-4 rounded-xl text-sm font-mono overflow-x-auto border border-slate-800">
                                                {getIframeCode()}
                                            </pre>
                                            <button
                                                onClick={() => handleCopy(getIframeCode(), 'iframe')}
                                                className="absolute top-3 right-3 p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors backdrop-blur-sm"
                                                title="Copy code"
                                            >
                                                {copiedField === 'iframe' ? <Check size={16} /> : <Copy size={16} />}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-6 space-y-8">
                                    {/* Phone Number */}
                                    <div className="bg-emerald-50 rounded-xl p-6 border border-emerald-100">
                                        <div className="flex items-start gap-4">
                                            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                                                <Smartphone size={24} className="text-emerald-600" />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="text-lg font-bold text-emerald-900">
                                                    Dedicated Phone Number
                                                </h3>
                                                <p className="text-emerald-700 text-sm mb-4">
                                                    Call this number to talk to your agent.
                                                </p>
                                                <div className="flex items-center gap-3">
                                                    <code className="text-2xl font-mono font-bold text-emerald-800 bg-white px-4 py-2 rounded-lg border border-emerald-200 shadow-sm">
                                                        +1 (555) 123-4567
                                                    </code>
                                                    <button
                                                        onClick={() => handleCopy('+1 (555) 123-4567', 'phone')}
                                                        className="p-3 bg-white hover:bg-emerald-100 text-emerald-600 rounded-lg transition-colors border border-emerald-200 shadow-sm"
                                                        title="Copy number"
                                                    >
                                                        {copiedField === 'phone' ? <Check size={20} /> : <Copy size={20} />}
                                                    </button>
                                                </div>
                                                <p className="text-xs text-emerald-600 mt-3 flex items-center gap-1">
                                                    <Settings size={12} />
                                                    Manage phone numbers in Organization Settings
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Voice Settings Summary */}
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                            <Settings size={20} className="text-emerald-500" />
                                            Voice Configuration
                                        </h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                                                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                                                    Provider
                                                </span>
                                                <p className="font-semibold text-slate-800 mt-1 capitalize">
                                                    {currentBot.config?.voice_provider || 'OpenAI'}
                                                </p>
                                            </div>
                                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                                                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                                                    Voice ID
                                                </span>
                                                <p className="font-semibold text-slate-800 mt-1">
                                                    {currentBot.config?.voice_id || 'Alloy'}
                                                </p>
                                            </div>
                                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                                                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                                                    Responsiveness
                                                </span>
                                                <p className="font-semibold text-slate-800 mt-1">
                                                    {currentBot.config?.responsiveness || 1.0}x
                                                </p>
                                            </div>
                                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                                                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                                                    Background Audio
                                                </span>
                                                <p className="font-semibold text-slate-800 mt-1 capitalize">
                                                    {currentBot.config?.ambient_sound || 'None'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {toast && (
                    <Toast
                        message={toast.message}
                        type={toast.type}
                        onClose={() => setToast(null)}
                    />
                )}
            </main>
        </div>
    );
};

export default IntegrationPage;
