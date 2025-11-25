/**
 * Security & Privacy Configuration
 */

import { AgentConfig } from '../../../types/agent';

interface SecurityConfigProps {
  config: AgentConfig;
  onChange: (updates: Partial<AgentConfig>) => void;
}

const PII_TYPES = [
  { value: 'ssn', label: 'Social Security Numbers' },
  { value: 'credit_card', label: 'Credit Card Numbers' },
  { value: 'phone_number', label: 'Phone Numbers' },
  { value: 'email', label: 'Email Addresses' },
  { value: 'address', label: 'Physical Addresses' },
  { value: 'name', label: 'Personal Names' },
];

export function SecurityConfig({ config, onChange }: SecurityConfigProps) {
  const togglePIIType = (type: string) => {
    const list = config.pii_redaction_list || [];
    const newList = list.includes(type)
      ? list.filter((t) => t !== type)
      : [...list, type];
    onChange({ pii_redaction_list: newList });
  };

  return (
    <div className="space-y-6">
      {/* Data Storage */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Data Storage Policy
        </h3>
        <div className="space-y-3">
          {[
            {
              value: 'everything',
              label: 'Store Everything',
              description:
                'Store all call data including recordings and transcripts',
            },
            {
              value: 'no-pii',
              label: 'No Personal Information',
              description: 'Store data but redact personal information',
            },
            {
              value: 'basic-attributes',
              label: 'Basic Attributes Only',
              description: 'Store only basic call metadata',
            },
          ].map((option) => (
            <label
              key={option.value}
              className="flex items-start p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50"
            >
              <input
                type="radio"
                name="data_storage"
                value={option.value}
                checked={config.data_storage_policy === option.value}
                onChange={(e) =>
                  onChange({ data_storage_policy: e.target.value as any })
                }
                className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <div className="ml-3">
                <div className="text-sm font-medium text-gray-900">
                  {option.label}
                </div>
                <div className="text-sm text-gray-500">{option.description}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* PII Redaction */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-medium text-gray-900">PII Redaction</h3>
            <p className="text-sm text-gray-500">
              Automatically redact personally identifiable information
            </p>
          </div>
          <input
            type="checkbox"
            checked={config.pii_redaction_enabled}
            onChange={(e) =>
              onChange({ pii_redaction_enabled: e.target.checked })
            }
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
        </div>

        {config.pii_redaction_enabled && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Information to Redact
            </label>
            <div className="grid grid-cols-2 gap-3">
              {PII_TYPES.map((type) => (
                <label
                  key={type.value}
                  className="flex items-center space-x-2 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    checked={config.pii_redaction_list?.includes(type.value)}
                    onChange={() => togglePIIType(type.value)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700">{type.label}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Webhook */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Webhook Integration
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Webhook URL
            </label>
            <input
              type="url"
              value={config.webhook_url || ''}
              onChange={(e) => onChange({ webhook_url: e.target.value })}
              placeholder="https://your-webhook-url.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="mt-1 text-sm text-gray-500">
              Receive real-time call events and updates (HTTPS required)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
