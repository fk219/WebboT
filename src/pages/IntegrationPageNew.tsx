import React, { useState } from 'react';
import { Code, Copy, CheckCircle2, ExternalLink, Book, Zap, Globe } from 'lucide-react';
import { useOrganizations } from '../context/OrganizationsContext';

const IntegrationPageNew: React.FC = () => {
    const { bots, currentOrganization } = useOrganizations();
    const [copiedItem, setCopiedItem] = useState<string | null>(null);
    const widgetHost = window.location.origin; // Use current host

    const handleCopy = (text: string, itemId: string) => {
        navigator.clipboard.writeText(text);
        setCopiedItem(itemId);
        setTimeout(() => setCopiedItem(null), 2000);
    };

    const getScriptCode = (botId: string) => 
        `<script src="${widgetHost}/widget-embed.js" data-agent-id="${botId}"></script>`;
    
    const getIframeCode = (botId: string) => 
        `<iframe src="${widgetHost}/widget/${botId}" width="100%" height="600px" frameborder="0" allow="microphone"></iframe>`;
    
    const getWidgetUrl = (botId: string) => 
        `${widgetHost}/widget/${botId}`;

    return (
        <div className="space-y-8 max-w-6xl mx-auto animate-fade-in">
            {/* Header with Gradient */}
            <div className="bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 rounded-2xl p-8 text-white shadow-lg">
                <h1 className="text-3xl font-bold">Integration</h1>
                <p className="text-emerald-100 mt-2">
                    Get your bots on your website in seconds. Choose a bot below and copy its integration code.
                </p>
            </div>

            {/* Quick Start Guide */}
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-2xl p-6">
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Book className="text-white" size={24} />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-bold text-slate-800 mb-3">How to Add Bot to Your Website</h3>
                        <div className="space-y-3">
                            <div className="flex items-start gap-3">
                                <div className="w-6 h-6 bg-emerald-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">1</div>
                                <div>
                                    <p className="font-semibold text-slate-800">Choose Your Bot</p>
                                    <p className="text-sm text-slate-600">Select the bot you want to integrate from the list below</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="w-6 h-6 bg-emerald-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">2</div>
                                <div>
                                    <p className="font-semibold text-slate-800">Copy the Code</p>
                                    <p className="text-sm text-slate-600">Click "Copy Script" to get the embed code for that specific bot</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="w-6 h-6 bg-emerald-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">3</div>
                                <div>
                                    <p className="font-semibold text-slate-800">Paste Before &lt;/body&gt;</p>
                                    <p className="text-sm text-slate-600">Add the code to your website's HTML, just before the closing &lt;/body&gt; tag</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="w-6 h-6 bg-emerald-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">4</div>
                                <div>
                                    <p className="font-semibold text-slate-800">Done! 🎉</p>
                                    <p className="text-sm text-slate-600">Your bot will appear as a floating widget on your website</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Organization Info */}
            {currentOrganization && (
                <div className="bg-white border border-slate-200 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <Globe className="text-emerald-600" size={20} />
                        <div>
                            <p className="text-sm font-medium text-slate-800">
                                Showing bots for: <span className="text-emerald-600">{currentOrganization.name}</span>
                            </p>
                            <p className="text-xs text-slate-500">
                                {bots.length} {bots.length === 1 ? 'bot' : 'bots'} available
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Bots List */}
            {bots.length === 0 ? (
                <div className="bg-white border-2 border-dashed border-slate-300 rounded-2xl p-12 text-center">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Code size={32} className="text-slate-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-800 mb-2">No Bots Yet</h3>
                    <p className="text-slate-600 mb-4">Create a bot in the Agent Builder to get integration codes</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {bots.map((bot) => (
                        <div key={bot.id} className="bg-white border-2 border-slate-200 rounded-2xl overflow-hidden hover:border-emerald-300 transition-all">
                            {/* Bot Header */}
                            <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-4 border-b border-slate-200">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center">
                                            <Zap className="text-white" size={24} />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-800">{bot.name}</h3>
                                            <p className="text-sm text-slate-500">
                                                {bot.is_active ? (
                                                    <span className="text-emerald-600 flex items-center gap-1">
                                                        <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                                                        Active
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-400">Inactive</span>
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => window.open(getWidgetUrl(bot.id), '_blank')}
                                        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg hover:border-emerald-500 hover:text-emerald-600 transition-all text-sm font-medium"
                                    >
                                        <ExternalLink size={16} />
                                        Test Widget
                                    </button>
                                </div>
                            </div>

                            {/* Integration Codes */}
                            <div className="p-6 space-y-6">
                                {/* Script Embed */}
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <div>
                                            <h4 className="font-semibold text-slate-800">Script Tag (Recommended)</h4>
                                            <p className="text-sm text-slate-500">Floating widget in bottom corner</p>
                                        </div>
                                        <button
                                            onClick={() => handleCopy(getScriptCode(bot.id), `script-${bot.id}`)}
                                            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-all text-sm font-medium"
                                        >
                                            {copiedItem === `script-${bot.id}` ? (
                                                <>
                                                    <CheckCircle2 size={16} />
                                                    Copied!
                                                </>
                                            ) : (
                                                <>
                                                    <Copy size={16} />
                                                    Copy Script
                                                </>
                                            )}
                                        </button>
                                    </div>
                                    <div className="bg-slate-900 rounded-xl p-4 overflow-x-auto">
                                        <code className="text-sm font-mono text-emerald-400 whitespace-pre">
                                            {getScriptCode(bot.id)}
                                        </code>
                                    </div>
                                </div>

                                {/* iFrame Embed */}
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <div>
                                            <h4 className="font-semibold text-slate-800">iFrame Embed</h4>
                                            <p className="text-sm text-slate-500">Embed in specific page section</p>
                                        </div>
                                        <button
                                            onClick={() => handleCopy(getIframeCode(bot.id), `iframe-${bot.id}`)}
                                            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white rounded-lg transition-all text-sm font-medium"
                                        >
                                            {copiedItem === `iframe-${bot.id}` ? (
                                                <>
                                                    <CheckCircle2 size={16} />
                                                    Copied!
                                                </>
                                            ) : (
                                                <>
                                                    <Copy size={16} />
                                                    Copy iFrame
                                                </>
                                            )}
                                        </button>
                                    </div>
                                    <div className="bg-slate-900 rounded-xl p-4 overflow-x-auto">
                                        <code className="text-sm font-mono text-blue-400 whitespace-pre">
                                            {getIframeCode(bot.id)}
                                        </code>
                                    </div>
                                </div>

                                {/* Direct URL */}
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <div>
                                            <h4 className="font-semibold text-slate-800">Direct Widget URL</h4>
                                            <p className="text-sm text-slate-500">Standalone widget page</p>
                                        </div>
                                        <button
                                            onClick={() => handleCopy(getWidgetUrl(bot.id), `url-${bot.id}`)}
                                            className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-all text-sm font-medium"
                                        >
                                            {copiedItem === `url-${bot.id}` ? (
                                                <>
                                                    <CheckCircle2 size={16} />
                                                    Copied!
                                                </>
                                            ) : (
                                                <>
                                                    <Copy size={16} />
                                                    Copy URL
                                                </>
                                            )}
                                        </button>
                                    </div>
                                    <div className="bg-slate-900 rounded-xl p-4 overflow-x-auto">
                                        <code className="text-sm font-mono text-purple-400 whitespace-pre">
                                            {getWidgetUrl(bot.id)}
                                        </code>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Additional Help */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <h3 className="font-semibold text-blue-900 mb-2">Need Help?</h3>
                <p className="text-sm text-blue-800 mb-3">
                    Each bot has its own unique integration code. Make sure you copy the code for the specific bot you want to add to your website.
                </p>
                <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                    <li>The script tag adds a floating widget to your site</li>
                    <li>The iframe embeds the widget in a specific location</li>
                    <li>The direct URL opens the widget in a new page</li>
                    <li>You can use different bots on different pages</li>
                </ul>
            </div>
        </div>
    );
};

export default IntegrationPageNew;
