/**
 * Tools & MCP Configuration
 */

import { AgentConfig } from '../../../types/agent';
import { Plus, X } from 'lucide-react';
import { useState } from 'react';

interface ToolsConfigProps {
  config: AgentConfig;
  onChange: (updates: Partial<AgentConfig>) => void;
}

export function ToolsConfig({ config, onChange }: ToolsConfigProps) {
  const [newServer, setNewServer] = useState('');

  const addMCPServer = () => {
    if (newServer.trim()) {
      onChange({
        enabled_mcp_servers: [...config.enabled_mcp_servers, newServer.trim()],
      });
      setNewServer('');
    }
  };

  const removeMCPServer = (server: string) => {
    onChange({
      enabled_mcp_servers: config.enabled_mcp_servers.filter((s) => s !== server),
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          MCP Tools Integration
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Enable Model Context Protocol (MCP) servers to give your agent access
          to external tools and APIs.
        </p>

        <div className="space-y-4">
          {/* Current MCP Servers */}
          {config.enabled_mcp_servers.length > 0 && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Enabled MCP Servers
              </label>
              {config.enabled_mcp_servers.map((server) => (
                <div
                  key={server}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <span className="text-sm text-gray-900">{server}</span>
                  <button
                    onClick={() => removeMCPServer(server)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add New MCP Server */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Add MCP Server
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={newServer}
                onChange={(e) => setNewServer(e.target.value)}
                placeholder="Enter MCP server name"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={addMCPServer}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add
              </button>
            </div>
          </div>

          {config.enabled_mcp_servers.length === 0 && (
            <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <p className="text-sm text-gray-500">
                No MCP servers enabled yet
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
