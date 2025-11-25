/**
 * Agent Card Component
 * Displays agent info with actions
 */

import { Bot, Edit, Trash2, Play, Phone, MessageSquare } from 'lucide-react';
import { Agent } from '../../types/agent';

interface AgentCardProps {
  agent: Agent;
  onEdit: () => void;
  onDelete: () => void;
  onTest: () => void;
}

export function AgentCard({ agent, onEdit, onDelete, onTest }: AgentCardProps) {
  return (
    <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow duration-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0 p-2 bg-blue-100 rounded-lg">
              <Bot className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {agent.name}
              </h3>
              <p className="text-sm text-gray-500 truncate">
                {agent.description || 'No description'}
              </p>
            </div>
          </div>
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              agent.is_published
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            {agent.is_published ? 'Live' : 'Draft'}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-4">
        {/* Agent Info */}
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-gray-500">Model:</span>
            <span className="font-medium text-gray-900">{agent.llm_model}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-500">Voice:</span>
            <span className="font-medium text-gray-900">
              {agent.voice_provider || 'Not configured'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-500">Knowledge Bases:</span>
            <span className="font-medium text-gray-900">
              {agent.knowledge_base_ids?.length || 0}
            </span>
          </div>
        </div>

        {/* Channels */}
        <div className="flex items-center space-x-2">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <MessageSquare className="h-3 w-3 mr-1" />
            Text
          </span>
          {agent.voice_provider && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              <Phone className="h-3 w-3 mr-1" />
              Voice
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center space-x-2">
        <button
          onClick={onTest}
          className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          <Play className="h-4 w-4 mr-1" />
          Test
        </button>
        <button
          onClick={onEdit}
          className="inline-flex items-center justify-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          <Edit className="h-4 w-4" />
        </button>
        <button
          onClick={onDelete}
          className="inline-flex items-center justify-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
