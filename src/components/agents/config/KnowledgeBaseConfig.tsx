/**
 * Knowledge Base Configuration
 */

import React from 'react';
import { AgentConfig } from '../../../types/agent';
import { Plus, X } from 'lucide-react';

interface KnowledgeBaseConfigProps {
  config: AgentConfig;
  onChange: (updates: Partial<AgentConfig>) => void;
}

export function KnowledgeBaseConfig({
  config,
  onChange,
}: KnowledgeBaseConfigProps) {
  const [newKbId, setNewKbId] = React.useState('');

  const addKnowledgeBase = () => {
    if (newKbId.trim()) {
      onChange({
        knowledge_base_ids: [...config.knowledge_base_ids, newKbId.trim()],
      });
      setNewKbId('');
    }
  };

  const removeKnowledgeBase = (kbId: string) => {
    onChange({
      knowledge_base_ids: config.knowledge_base_ids.filter((id) => id !== kbId),
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Knowledge Base Integration
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Attach knowledge bases to enhance your agent's responses with custom
          information.
        </p>

        <div className="space-y-4">
          {/* Current Knowledge Bases */}
          {config.knowledge_base_ids.length > 0 && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Attached Knowledge Bases
              </label>
              {config.knowledge_base_ids.map((kbId) => (
                <div
                  key={kbId}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <span className="text-sm text-gray-900">{kbId}</span>
                  <button
                    onClick={() => removeKnowledgeBase(kbId)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add New Knowledge Base */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Add Knowledge Base
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={newKbId}
                onChange={(e) => setNewKbId(e.target.value)}
                placeholder="Enter knowledge base ID"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={addKnowledgeBase}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add
              </button>
            </div>
          </div>

          {config.knowledge_base_ids.length === 0 && (
            <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <p className="text-sm text-gray-500">
                No knowledge bases attached yet
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
