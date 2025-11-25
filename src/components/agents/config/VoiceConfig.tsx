/**
 * Voice Configuration Component
 */

import { AgentConfig } from '../../../types/agent';

interface VoiceConfigProps {
  config: AgentConfig;
  onChange: (updates: Partial<AgentConfig>) => void;
}

export function VoiceConfig({ config, onChange }: VoiceConfigProps) {
  return (
    <div className="space-y-6">
      {/* Voice Provider */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Voice Provider
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Provider
            </label>
            <select
              value={config.voice_provider || 'elevenlabs'}
              onChange={(e) => onChange({ voice_provider: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="elevenlabs">ElevenLabs</option>
              <option value="openai">OpenAI</option>
              <option value="cartesia">Cartesia</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Voice ID
            </label>
            <input
              type="text"
              value={config.voice_id || ''}
              onChange={(e) => onChange({ voice_id: e.target.value })}
              placeholder="Enter voice ID"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="mt-1 text-sm text-gray-500">
              Voice ID from your selected provider
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Voice Model
            </label>
            <input
              type="text"
              value={config.voice_model || ''}
              onChange={(e) => onChange({ voice_model: e.target.value })}
              placeholder="e.g., eleven_turbo_v2"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Voice Parameters */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Voice Parameters
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Speed: {config.voice_speed}
            </label>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={config.voice_speed}
              onChange={(e) =>
                onChange({ voice_speed: parseFloat(e.target.value) })
              }
              className="w-full"
            />
            <p className="mt-1 text-sm text-gray-500">
              Speech rate (0.5x - 2x)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Temperature: {config.voice_temperature}
            </label>
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={config.voice_temperature}
              onChange={(e) =>
                onChange({ voice_temperature: parseFloat(e.target.value) })
              }
              className="w-full"
            />
            <p className="mt-1 text-sm text-gray-500">
              Voice variation (0 = consistent, 2 = varied)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Volume: {config.voice_volume}
            </label>
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={config.voice_volume}
              onChange={(e) =>
                onChange({ voice_volume: parseFloat(e.target.value) })
              }
              className="w-full"
            />
            <p className="mt-1 text-sm text-gray-500">
              Output volume (0 = quiet, 2 = loud)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
