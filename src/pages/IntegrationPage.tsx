import React, { useState } from 'react';
import { Code, Box, CheckCircle2, Copy, Bot } from 'lucide-react';
import { AgentConfig } from '../../types';

interface IntegrationPageProps {
    agentConfig: AgentConfig;
    currentProjectId?: string;
}

const IntegrationPage: React.FC<IntegrationPageProps> = ({ agentConfig, currentProjectId }) => {
    const [copySuccess, setCopySuccess] = useState<string | null>(null);
    const projectId = currentProjectId || agentConfig.id;
    const widgetHost = 'http://localhost:3000'; // Change this for production

    const handleCopy = (text: string, type: string) => {
        navigator.clipboard.writeText(text);
        setCopySuccess(type);
        setTimeout(() => setCopySuccess(null), 2000);
    };

    const scriptEmbedCode = `<script src="${widgetHost}/widget-embed.js" data-agent-id="${projectId}"></script>`;
    const iframeEmbedCode = `<iframe src="${widgetHost}/widget/${projectId}" width="100%" height="600px" frameborder="0" allow="microphone"></iframe>`;

    return (
        <div className="space-y-8 max-w-4xl mx-auto animate-fade-in">
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
                        <code className="text-sm font-mono text-emerald-400 break-all whitespace-pre-wrap">
                            {scriptEmbedCode}
                        </code>
                        <button
                            onClick={() => handleCopy(scriptEmbedCode, 'script')}
                            className="absolute top-3 right-3 p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                        >
                            {copySuccess === 'script' ? <CheckCircle2 size={16} className="text-emerald-400" /> : <Copy size={16} />}
                        </button>
                    </div>
                    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                        <p className="text-sm text-blue-800">
                            <strong>For localhost testing:</strong> This embed code will work on any website running on your local machine. 
                            The widget will load from <code className="bg-blue-100 px-1 rounded">http://localhost:3000</code>
                        </p>
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
                        <code className="text-sm font-mono text-blue-300 break-all whitespace-pre-wrap">
                            {iframeEmbedCode}
                        </code>
                        <button
                            onClick={() => handleCopy(iframeEmbedCode, 'iframe')}
                            className="absolute top-3 right-3 p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                        >
                            {copySuccess === 'iframe' ? <CheckCircle2 size={16} className="text-emerald-400" /> : <Copy size={16} />}
                        </button>
                    </div>
                    <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                        <p className="text-sm text-amber-800">
                            <strong>Test it now:</strong> Open <a href={`/widget/${projectId}`} target="_blank" className="underline hover:text-amber-900">this link</a> to see your widget in action!
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default IntegrationPage;
