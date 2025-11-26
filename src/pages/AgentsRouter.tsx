/**
 * Agents Router - Handles nested views for LangGraph agents
 */

import { useState } from 'react';
import AgentListPage from './AgentListPage';
import AgentCreatePage from './AgentCreatePage';
import AgentPreviewPage from './AgentPreviewPage';

type AgentView = 'list' | 'create' | 'edit' | 'preview';

export default function AgentsRouter() {
  const [agentView, setAgentView] = useState<AgentView>('list');
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);

  const handleNavigate = (view: AgentView, agentId?: string) => {
    setAgentView(view);
    if (agentId) {
      setSelectedAgentId(agentId);
    }
  };

  return (
    <div className="h-full">
      {agentView === 'list' && (
        <AgentListPage 
          onNavigate={handleNavigate}
        />
      )}
      {agentView === 'create' && (
        <AgentCreatePage 
          onNavigate={handleNavigate}
        />
      )}
      {agentView === 'edit' && selectedAgentId && (
        <AgentCreatePage 
          agentId={selectedAgentId}
          onNavigate={handleNavigate}
        />
      )}
      {agentView === 'preview' && selectedAgentId && (
        <AgentPreviewPage 
          agentId={selectedAgentId}
          onNavigate={handleNavigate}
        />
      )}
    </div>
  );
}
