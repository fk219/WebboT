import React, { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Send, MessageSquare } from 'lucide-react';
import { useWebSocket } from '../hooks/useWebSocket';
import { v4 as uuidv4 } from 'uuid';

interface Message {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

const AgentEmbedPage: React.FC = () => {
    const { agentId } = useParams<{ agentId: string }>();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Persist session ID in localStorage for this agent
    const [sessionId] = useState(() => {
        const key = `webbot_session_${agentId}`;
        const stored = localStorage.getItem(key);
        if (stored) return stored;
        const newId = uuidv4();
        localStorage.setItem(key, newId);
        return newId;
    });

    const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000';

    // WebSocket connection
    const { sendMessage, isConnected } = useWebSocket(
        `${WS_URL}/ws/chat/${agentId}`,
        {
            onMessage: (data) => {
                if (data.type === 'message') {
                    setMessages((prev) => [
                        ...prev,
                        {
                            role: 'assistant',
                            content: data.content,
                            timestamp: new Date(),
                        },
                    ]);
                    setIsLoading(false);
                }
            },
        }
    );

    // Auto-scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = () => {
        if (!input.trim() || !isConnected) return;

        const userMessage: Message = {
            role: 'user',
            content: input,
            timestamp: new Date(),
        };
        setMessages((prev) => [...prev, userMessage]);

        sendMessage({
            message: input,
            session_id: sessionId,
        });

        setInput('');
        setIsLoading(true);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    if (!agentId) return <div>Invalid Agent ID</div>;

    return (
        <div className="flex flex-col h-screen bg-white">
            {/* Header */}
            <div className="px-4 py-3 bg-emerald-600 text-white shadow-md flex items-center gap-2">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <MessageSquare size={18} />
                </div>
                <div>
                    <h1 className="font-bold text-sm">AI Assistant</h1>
                    <div className="flex items-center gap-1.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-300' : 'bg-red-300'}`} />
                        <span className="text-xs opacity-90">{isConnected ? 'Online' : 'Connecting...'}</span>
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                {messages.length === 0 && (
                    <div className="text-center py-8">
                        <p className="text-slate-400 text-sm">
                            How can I help you today?
                        </p>
                    </div>
                )}

                {messages.map((msg, idx) => (
                    <div
                        key={idx}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'
                            }`}
                    >
                        <div
                            className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${msg.role === 'user'
                                    ? 'bg-emerald-600 text-white rounded-br-none'
                                    : 'bg-white text-slate-800 border border-slate-100 rounded-bl-none'
                                }`}
                        >
                            <p className="whitespace-pre-wrap">{msg.content}</p>
                        </div>
                    </div>
                ))}

                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-white border border-slate-100 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm">
                            <div className="flex space-x-1.5">
                                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
                                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-100" />
                                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-200" />
                            </div>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 bg-white border-t border-slate-100">
                <div className="flex items-center gap-2 bg-slate-50 rounded-full px-4 py-2 border border-slate-200 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500 transition-all">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Type a message..."
                        disabled={isLoading || !isConnected}
                        className="flex-1 bg-transparent border-none focus:ring-0 text-sm placeholder:text-slate-400"
                    />
                    <button
                        onClick={handleSend}
                        disabled={isLoading || !isConnected || !input.trim()}
                        className="p-1.5 bg-emerald-600 text-white rounded-full hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <Send size={16} />
                    </button>
                </div>
                <div className="text-center mt-2">
                    <p className="text-[10px] text-slate-400">Powered by WebboT</p>
                </div>
            </div>
        </div>
    );
};

export default AgentEmbedPage;
