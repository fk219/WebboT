/**
 * LLM Configuration Component
 */

import { AgentConfig } from '../../../types/agent';

interface LLMConfigProps {
  config: AgentConfig;
  onChange: (updates: Partial<AgentConfig>) => void;
}

const LLM_MODELS = [
  { value: 'gpt-4o', label: 'GPT-4o', provider: 'OpenAI', recommended: true },
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini', provider: 'OpenAI', recommended: true },
  { value: 'gpt-4-turbo', label: 'GPT-4 Turbo', provider: 'OpenAI' },
  { value: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet', provider: 'Anthropic' },
  { value: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku', provider: 'Anthropic' },
  { value: 'gemini-2.0-flash-exp', label: 'Gemini 2.0 Flash', provider: 'Google' },
];

export function LLMConfig({ config, onChange }: LLMConfigProps) {
  return (
    <div className="space-y-6">
      {/* Model Selection */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Language Model
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Model
            </label>
            <select
              value={config.llm_model}
              onChange={(e) => onChange({ llm_model: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {LLM_MODELS.map((model) => (
                <option key={model.value} value={model.value}>
                  {model.label} ({model.provider})
                  {model.recommended ? ' - Recommended' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* System Prompt */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          System Prompt *
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Instructions
            </label>
            <textarea
              value={config.system_prompt}
              onChange={(e) => onChange({ system_prompt: e.target.value })}
              placeholder="You are a helpful AI assistant. Your role is to..."
              rows={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
            />
            <p className="mt-1 text-sm text-gray-500">
              Define your agent's personality, role, and behavior (
              {config.system_prompt.length}/10,000)
            </p>
          </div>
        </div>
      </div>

      {/* Model Parameters */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Model Parameters
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Temperature: {config.temperature}
            </label>
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={config.temperature}
              onChange={(e) =>
                onChange({ temperature: parseFloat(e.target.value) })
              }
              className="w-full"
            />
            <p className="mt-1 text-sm text-gray-500">
              Controls randomness (0 = focused, 2 = creative)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Max Tokens: {config.max_tokens}
            </label>
            <input
              type="range"
              min="100"
              max="4000"
              step="100"
              value={config.max_tokens}
              onChange={(e) =>
                onChange({ max_tokens: parseInt(e.target.value) })
              }
              className="w-full"
            />
            <p className="mt-1 text-sm text-gray-500">
              Maximum response length
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
