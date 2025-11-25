/**
 * Agent List Page - Main agents page with cards
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Bot } from 'lucide-react';
import { useAgents, useDeleteAgent } from '../hooks/useAgents';
import { AgentCard } from '../components/agents/AgentCard';

export default function AgentListPage() {
  const navigate = useNavigate();
  const organizationId = 'org_123'; // TODO: Get from context
  const { data: agents, isLoading } = useAgents(organizationId);
  const deleteAgent = useDeleteAgent();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredAgents = agents?.filter((agent) =>
    agent.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = async (agentId: string) => {
    if (confirm('Are you sure you want to delete this agent?')) {
      try {
        await deleteAgent.mutateAsync(agentId);
      } catch (error) {
        console.error('Failed to delete agent:', error);
        alert('Failed to delete agent');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">AI Agents</h1>
              <p className="mt-2 text-gray-600">
                Create and manage your LangGraph-powered agents
              </p>
            </div>
            <button
              onClick={() => navigate('/agents/create')}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <Plus className="h-5 w-5 mr-2" />
              Create Agent
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search agents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
        </div>

        {/* Agent Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-64 bg-white rounded-lg shadow animate-pulse"
              />
            ))}
          </div>
        ) : filteredAgents && filteredAgents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAgents.map((agent) => (
              <AgentCard
                key={agent.id}
                agent={agent}
                onEdit={() => navigate(`/agents/${agent.id}/edit`)}
                onDelete={() => handleDelete(agent.id)}
                onTest={() => navigate(`/agents/${agent.id}/preview`)}
              />
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <Bot className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No agents found
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchQuery
                ? 'Try adjusting your search'
                : 'Get started by creating your first agent'}
            </p>
            {!searchQuery && (
              <div className="mt-6">
                <button
                  onClick={() => navigate('/agents/create')}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Create Agent
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
