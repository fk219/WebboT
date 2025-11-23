import React, { useState, useEffect } from 'react';
import {
    User,
    BookOpen,
    Wrench,
    Palette,
    Mic,
    Bot,
    Plus,
    Edit2,
    Trash2,
    Power,
    PowerOff,
    Check,
    X,
    Sparkles,
    Save
} from 'lucide-react';
import { AgentConfig, BuilderTab } from '../../types';
import { useOrganizations } from '../context/OrganizationsContext';
import { Bot as BotType } from '../types/organization';
import Toast, { ToastType } from '../components/Toast';
import ChatWidget from '../../components/ChatWidget';

// Import the existing AgentBuilder content sections
import AgentBuilder from './AgentBuilder';

interface AgentBuilderNewProps {
    // Keep all existing props for compatibility
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
    removeQuickReply: (reply: string) => void;
    newQuickReply: string;
    setNewQuickReply: (val: string) => void;
    handleLogoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handlePlayVoicePreview: () => void;
    isPlayingPreview: boolean;
    currentProjectId?: string;
}

const AgentBuilderNew: React.FC<AgentBuilderNewProps> = (props) => {
    const {
        bots,
        currentBot,
        setCurrentBot,
        createBot,
        deleteBot,
        toggleBotStatus,
        updateBot,
        currentOrganization
    } = useOrganizations();

    const [showCreateBotModal, setShowCreateBotModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
    const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
    const [newBotName, setNewBotName] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    // Update agentConfig when currentBot changes
    useEffect(() => {
        if (currentBot?.config) {
            props.setAgentConfig(currentBot.config as AgentConfig);
        }
    }, [currentBot]);

    const handleCreateBot = async () => {
        if (!newBotName.trim()) return;

        setIsCreating(true);
        try {
            const defaultConfig: AgentConfig = {
                id: crypto.randomUUID(),
                name: newBotName,
                greeting: `Hello! I'm ${newBotName}. How can I help you today?`,
                systemInstruction: 'You are a helpful AI assistant.',
                maxReplyTokens: 150,
                tools: [],
                quickReplies: [],
                voice: {
                    enabled: true,
                    name: 'Alloy',
                    language: 'English',
                    speed: 1.0,
                    pitch: 1.0,
                    phoneCallEnabled: true
                },
                theme: {
                    primaryColor: '#10b981',
                    mode: 'light' as const,
                    fontFamily: 'inter' as const,
                    fontStyle: 'regular' as const,
                    radius: 'xl' as const,
                    avatarIcon: 'bot' as const,
                    showBranding: true
                }
            };

            const newBot = await createBot(newBotName, defaultConfig);
            if (newBot) {
                setToast({ message: 'Bot created successfully!', type: 'success' });
                setShowCreateBotModal(false);
                setNewBotName('');
            } else {
                setToast({ message: 'Failed to create bot', type: 'error' });
            }
        } catch (error) {
            setToast({ message: 'Failed to create bot', type: 'error' });
        } finally {
            setIsCreating(false);
        }
    };

    const handleDeleteBot = async (botId: string) => {
        const result = await deleteBot(botId);
        if (result.success) {
            setToast({ message: 'Bot deleted successfully', type: 'success' });
        } else {
            setToast({ message: result.error || 'Failed to delete bot', type: 'error' });
        }
        setShowDeleteConfirm(null);
    };

    const handleToggleStatus = async (botId: string, currentStatus: boolean) => {
        const success = await toggleBotStatus(botId, !currentStatus);
        if (success) {
            setToast({
                message: `Bot ${!currentStatus ? 'activated' : 'deactivated'} successfully`,
                type: 'success'
            });
        } else {
            setToast({ message: 'Failed to toggle bot status', type: 'error' });
        }
    };

    const handleSaveBot = async () => {
        if (!currentBot) return;

        const success = await updateBot(
            currentBot.id,
            props.agentConfig,
            props.agentConfig.name
        );

        if (success) {
            setToast({ message: 'Bot saved successfully!', type: 'success' });
        } else {
            setToast({ message: 'Failed to save bot', type: 'error' });
        }
    };

    return (
        <div className="flex h-full overflow-hidden bg-slate-50">
            {/* Left Sidebar - Bots List */}
            <aside className="w-80 bg-white border-r border-slate-200 flex flex-col overflow-hidden flex-shrink-0">
                {/* Header */}
                <div className="p-6 border-b border-slate-200">
                    <h2 className="text-lg font-bold text-slate-800 mb-1">Bots</h2>
                    <p className="text-sm text-slate-500">
                        {currentOrganization?.name || 'My Project'}
                    </p>
                </div>

                {/* Bots List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {bots.map((bot) => (
                        <div
                            key={bot.id}
                            className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${currentBot?.id === bot.id
                                ? 'border-emerald-500 bg-emerald-50'
                                : 'border-slate-200 bg-white hover:border-slate-300'
                                }`}
                            onClick={() => setCurrentBot(bot)}
                        >
                            {/* Bot Header */}
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center flex-shrink-0">
                                        <Bot className="text-white" size={20} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h3 className="font-semibold text-slate-800 truncate">
                                            {bot.name}
                                        </h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            {bot.is_active ? (
                                                <span className="flex items-center gap-1 text-xs text-emerald-600">
                                                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                                    Active
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1 text-xs text-slate-400">
                                                    <div className="w-2 h-2 rounded-full bg-slate-300"></div>
                                                    Inactive
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Bot Actions */}
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setCurrentBot(bot);
                                    }}
                                    className="flex-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1"
                                >
                                    <Edit2 size={14} />
                                    Edit
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleToggleStatus(bot.id, bot.is_active);
                                    }}
                                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1 ${bot.is_active
                                        ? 'bg-amber-100 hover:bg-amber-200 text-amber-700'
                                        : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-700'
                                        }`}
                                    title={bot.is_active ? 'Deactivate' : 'Activate'}
                                >
                                    {bot.is_active ? <PowerOff size={14} /> : <Power size={14} />}
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowDeleteConfirm(bot.id);
                                    }}
                                    className="px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1"
                                    title="Delete"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>

                            {/* Bot Info */}
                            {bot.description && (
                                <p className="text-xs text-slate-500 mt-2 line-clamp-2">
                                    {bot.description}
                                </p>
                            )}
                        </div>
                    ))}

                    {bots.length === 0 && (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Bot size={32} className="text-slate-400" />
                            </div>
                            <h3 className="text-sm font-medium text-slate-800 mb-2">No bots yet</h3>
                            <p className="text-xs text-slate-500 mb-4">
                                Create your first bot to get started
                            </p>
                        </div>
                    )}
                </div>

                {/* Create Bot Button */}
                <div className="p-4 border-t border-slate-200">
                    <button
                        onClick={() => setShowCreateBotModal(true)}
                        className="w-full px-4 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all font-medium shadow-lg shadow-emerald-200 flex items-center justify-center gap-2"
                    >
                        <Plus size={20} />
                        New Bot
                    </button>
                </div>
            </aside>

            {/* Main Content - Existing Agent Builder */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {currentBot ? (
                    <>
                        {/* Top Bar with Save Button */}
                        <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
                            <div>
                                <h2 className="text-lg font-bold text-slate-800">
                                    Editing: {currentBot.name}
                                </h2>
                                <p className="text-sm text-slate-500">
                                    Configure your bot's behavior and appearance
                                </p>
                            </div>
                            <button
                                onClick={handleSaveBot}
                                className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all font-semibold shadow-lg shadow-emerald-200 flex items-center gap-2"
                            >
                                <Save size={18} />
                                Save Bot
                            </button>
                        </div>

                        {/* Agent Builder Content */}
                        <div className="flex-1 overflow-hidden">
                            <AgentBuilder {...props} currentProjectId={currentBot.id} />
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-center">
                            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Bot size={40} className="text-slate-400" />
                            </div>
                            <h3 className="text-lg font-medium text-slate-800 mb-2">
                                Select a bot to edit
                            </h3>
                            <p className="text-sm text-slate-500 mb-6">
                                Choose a bot from the list or create a new one
                            </p>
                            <button
                                onClick={() => setShowCreateBotModal(true)}
                                className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all font-semibold shadow-lg shadow-emerald-200 inline-flex items-center gap-2"
                            >
                                <Plus size={20} />
                                Create New Bot
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Create Bot Modal */}
            {showCreateBotModal && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
                    onClick={() => setShowCreateBotModal(false)}
                >
                    <div
                        className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 p-6 relative overflow-hidden">
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.2),transparent)]"></div>
                            <div className="relative flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                                        <Sparkles className="text-white" size={24} />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-white">Create New Bot</h2>
                                        <p className="text-emerald-100 text-sm mt-0.5">
                                            Build your AI assistant
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowCreateBotModal(false)}
                                    className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-6">
                            <label className="block text-sm font-bold text-slate-700 mb-3 uppercase tracking-wider">
                                Bot Name
                            </label>
                            <input
                                type="text"
                                value={newBotName}
                                onChange={(e) => setNewBotName(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && newBotName.trim()) {
                                        handleCreateBot();
                                    }
                                }}
                                placeholder="e.g., Customer Support Bot"
                                className="w-full px-4 py-3.5 border-2 border-slate-200 rounded-xl outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all text-slate-800 placeholder-slate-400 font-medium"
                                autoFocus
                                disabled={isCreating}
                            />
                            <p className="text-xs text-slate-500 mt-2 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                                Choose a descriptive name for your bot
                            </p>
                        </div>

                        {/* Footer */}
                        <div className="px-6 pb-6 flex gap-3">
                            <button
                                onClick={() => setShowCreateBotModal(false)}
                                disabled={isCreating}
                                className="flex-1 px-6 py-3 border-2 border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateBot}
                                disabled={!newBotName.trim() || isCreating}
                                className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all font-semibold shadow-lg shadow-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-2"
                            >
                                {isCreating ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        Creating...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles size={18} />
                                        Create Bot
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
                    onClick={() => setShowDeleteConfirm(null)}
                >
                    <div
                        className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-lg font-bold text-slate-800 mb-2">Delete Bot?</h3>
                        <p className="text-sm text-slate-600 mb-6">
                            Are you sure you want to delete this bot? This action cannot be undone.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowDeleteConfirm(null)}
                                className="flex-1 px-4 py-2 border-2 border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-all font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleDeleteBot(showDeleteConfirm)}
                                className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-all font-medium"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast Notification */}
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
        </div>
    );
};

export default AgentBuilderNew;
