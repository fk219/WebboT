/**
 * Agent Preview Page - Test the LangGraph agent
 */

import { useState, useRef, useMemo, useEffect } from 'react';
import { ArrowLeft, Send, Mic, MicOff, MessageSquare, Phone } from 'lucide-react';
import { useLiveKitAudio } from '../hooks/useLiveKitAudio';

interface AgentPreviewPageProps {
  agentId: string;
  onNavigate: (view: 'list' | 'create' | 'edit' | 'preview', agentId?: string) => void;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function AgentPreviewPage({ agentId, onNavigate }: AgentPreviewPageProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<'text' | 'voice'>('text');

  // LiveKit State
  const [token, setToken] = useState('');
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState<string>('');

  const sessionId = useMemo(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, []);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Call backend API to execute agent
      const response = await fetch(`http://localhost:8000/api/chat/${agentId}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
          session_id: sessionId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response || 'No response received',
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Failed to send message:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request.',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const [token, setToken] = useState('');
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState<string>('');

  // LiveKit Hook
  const { room, isConnecting, isAgentSpeaking } = useLiveKitAudio({
    token,
    serverUrl: import.meta.env.VITE_LIVEKIT_URL || 'wss://your-project.livekit.cloud',
    onConnected: () => setVoiceStatus('🎙️ Connected to LiveKit'),
    onDisconnected: () => {
      setVoiceStatus('🔌 Disconnected');
      setIsVoiceActive(false);
      setToken('');
    },
    onError: (err) => setVoiceStatus(`Error: ${err.message}`),
  });

  const handleVoiceToggle = async () => {
    if (isVoiceActive) {
      // Stop voice: clear token to disconnect
      setToken('');
      setIsVoiceActive(false);
      setVoiceStatus('');
    } else {
      // Start voice: fetch token
      try {
        setVoiceStatus('🔄 Connecting...');
        const { LiveKitService } = await import('../services/livekitService');
        const newToken = await LiveKitService.getToken(`room-${agentId}-${sessionId}`, `user-${sessionId}`);
        setToken(newToken);
        setIsVoiceActive(true);
      } catch (error) {
        console.error('Failed to start voice:', error);
        setVoiceStatus('❌ Failed to connect');
        alert('Failed to connect to LiveKit. Check console for details.');
      }
    }
  };

  // Update status based on agent speaking
  useEffect(() => {
    if (isAgentSpeaking) {
      setVoiceStatus('🔊 Agent speaking...');
    } else if (isVoiceActive && !isConnecting) {
      setVoiceStatus('🎙️ Listening...');
    }
  }, [isAgentSpeaking, isVoiceActive, isConnecting]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => onNavigate('edit', agentId)}
                className="p-2 hover:bg-white/50 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Test Agent
                </h1>
                <p className="mt-1 text-gray-600">
                  Chat with your LangGraph-powered agent
                </p>
              </div>
            </div>

            {/* Mode Toggle */}
            <div className="flex items-center space-x-2 bg-white/80 backdrop-blur-sm rounded-xl p-1 shadow-sm">
              <button
                onClick={() => setMode('text')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${mode === 'text'
                  ? 'bg-blue-100 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-100'
                  }`}
              >
                <MessageSquare className="h-4 w-4" />
                <span className="text-sm font-medium">Text</span>
              </button>
              <button
                onClick={() => setMode('voice')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${mode === 'voice'
                  ? 'bg-purple-100 text-purple-600'
                  : 'text-gray-600 hover:bg-gray-100'
                  }`}
              >
                <Mic className="h-4 w-4" />
                <span className="text-sm font-medium">Voice</span>
              </button>
            </div>
          </div>
        </div>

        {/* Chat Container */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden border border-gray-100">
          {/* Messages */}
          <div className="h-[500px] overflow-y-auto p-6 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 mt-20">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                  {mode === 'text' ? (
                    <MessageSquare className="h-8 w-8 text-blue-600" />
                  ) : (
                    <Mic className="h-8 w-8 text-purple-600" />
                  )}
                </div>
                <p className="text-lg font-medium">
                  {mode === 'text'
                    ? 'Start a conversation with your agent'
                    : 'Click the microphone to start talking'}
                </p>
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                >
                  <div
                    className={`max-w-[70%] rounded-2xl px-4 py-3 shadow-sm ${message.role === 'user'
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
                      : 'bg-white border border-gray-200 text-gray-900'
                      }`}
                  >
                    {message.content}
                  </div>
                </div>
              ))
            )}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-sm">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-200 bg-gray-50/50 p-4">
            {mode === 'text' ? (
              <div className="flex space-x-4">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  disabled={isLoading}
                />
                <button
                  onClick={handleSend}
                  disabled={isLoading || !input.trim()}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center space-x-2"
                >
                  <Send className="h-4 w-4" />
                  <span>Send</span>
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-4">
                {voiceStatus && (
                  <div className="text-sm text-gray-600 font-medium">
                    {voiceStatus}
                  </div>
                )}
                <button
                  onClick={handleVoiceToggle}
                  className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all transform hover:scale-105 ${isVoiceActive
                    ? 'bg-gradient-to-br from-red-500 to-red-600 shadow-lg shadow-red-500/50 animate-pulse'
                    : 'bg-gradient-to-br from-purple-500 to-indigo-600 shadow-lg shadow-purple-500/50'
                    }`}
                >
                  {isVoiceActive ? (
                    <MicOff className="h-8 w-8 text-white" />
                  ) : (
                    <Mic className="h-8 w-8 text-white" />
                  )}
                </button>
                <p className="text-sm text-gray-600">
                  {isVoiceActive ? 'Click to stop' : 'Click to start talking'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Info Card */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-blue-900">Voice Mode Features</h3>
              <p className="mt-1 text-sm text-blue-700">
                Voice mode uses automatic speech detection (VAD), sends audio to your backend for STT → LangGraph Agent → TTS processing, and plays the response.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
