/**
 * Agent Preview Page
 * Live testing with text and voice
 */

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageSquare, Mic } from 'lucide-react';
import { useAgent } from '../hooks/useAgents';
import { TextPreview } from '../components/agents/preview/TextPreview';
import { VoicePreview } from '../components/agents/preview/VoicePreview';

export default function AgentPreviewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: agent, isLoading } = useAgent(id);
  const [activeMode, setActiveMode] = useState<'text' | 'voice'>('text');
  const [sessionId] = useState(() => `session_${Date.now()}`);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading agent...</p>
        </div>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Agent not found</p>
          <button
            onClick={() => navigate('/agents')}
            className="mt-4 text-blue-600 hover:text-blue-700"
          >
            Go back to agents
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <button
              onClick={() => navigate(`/agents/${id}/edit`)}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{agent.name}</h1>
              <p className="mt-1 text-gray-600">Live Preview & Testing</p>
            </div>
          </div>

          {/* Mode Selector */}
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveMode('text')}
              className={`flex-1 inline-flex items-center justify-center px-4 py-3 rounded-lg font-medium transition-colors ${
                activeMode === 'text'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
              }`}
            >
              <MessageSquare className="h-5 w-5 mr-2" />
              Text Chat
            </button>
            <button
              onClick={() => setActiveMode('voice')}
              className={`flex-1 inline-flex items-center justify-center px-4 py-3 rounded-lg font-medium transition-colors ${
                activeMode === 'voice'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
              }`}
            >
              <Mic className="h-5 w-5 mr-2" />
              Voice Test
            </button>
          </div>
        </div>

        {/* Preview Content */}
        <div className="bg-white rounded-lg shadow">
          {activeMode === 'text' && (
            <TextPreview agentId={id!} sessionId={sessionId} />
          )}
          {activeMode === 'voice' && (
            <VoicePreview agentId={id!} sessionId={sessionId} />
          )}
        </div>
      </div>
    </div>
  );
}
