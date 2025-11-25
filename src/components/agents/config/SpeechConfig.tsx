/**
 * Speech Processing Configuration
 */

import { AgentConfig } from '../../../types/agent';

interface SpeechConfigProps {
  config: AgentConfig;
  onChange: (updates: Partial<AgentConfig>) => void;
}

export function SpeechConfig({ config, onChange }: SpeechConfigProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Speech Processing
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Responsiveness: {config.responsiveness}
            </label>
            <input
              type="range"
              min="0"
              max="3"
              step="0.1"
              value={config.responsiveness}
              onChange={(e) =>
                onChange({ responsiveness: parseFloat(e.target.value) })
              }
              className="w-full"
            />
            <p className="mt-1 text-sm text-gray-500">
              How quickly the agent responds (0 = slow, 3 = instant)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Interruption Sensitivity: {config.interruption_sensitivity}
            </label>
            <input
              type="range"
              min="0"
              max="3"
              step="0.1"
              value={config.interruption_sensitivity}
              onChange={(e) =>
                onChange({
                  interruption_sensitivity: parseFloat(e.target.value),
                })
              }
              className="w-full"
            />
            <p className="mt-1 text-sm text-gray-500">
              How easily the agent can be interrupted (0 = hard, 3 = easy)
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Enable Backchannel
              </label>
              <p className="text-sm text-gray-500">
                Agent makes acknowledgment sounds (mm-hmm, yeah)
              </p>
            </div>
            <input
              type="checkbox"
              checked={config.enable_backchannel}
              onChange={(e) =>
                onChange({ enable_backchannel: e.target.checked })
              }
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Normalize Speech
              </label>
              <p className="text-sm text-gray-500">
                Optimize speech for better clarity
              </p>
            </div>
            <input
              type="checkbox"
              checked={config.normalize_speech}
              onChange={(e) =>
                onChange({ normalize_speech: e.target.checked })
              }
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
