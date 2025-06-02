import React, { useState, useEffect } from 'react';
import { Settings, Eye, EyeOff, Check, X } from 'lucide-react';

interface AISettingsProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (apiKey: string, model: string) => void;
  currentApiKey: string;
  currentModel: string;
}

const AISettings: React.FC<AISettingsProps> = ({
  isOpen,
  onClose,
  onSave,
  currentApiKey,
  currentModel
}) => {
  const [apiKey, setApiKey] = useState(currentApiKey);
  const [model, setModel] = useState(currentModel);
  const [showApiKey, setShowApiKey] = useState(false);

  useEffect(() => {
    setApiKey(currentApiKey);
    setModel(currentModel);
  }, [currentApiKey, currentModel]);

  const handleSave = () => {
    onSave(apiKey, model);
    onClose();
  };

  const availableModels = [
    { id: 'gpt-4o', name: 'GPT-4o (Recommended)', description: 'Most capable model' },
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini', description: 'Faster and more cost-effective' },
    { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', description: 'High performance model' },
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', description: 'Fast and efficient' }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="icon-container bg-brand-50 border-brand-100 text-brand-600">
                <Settings className="w-5 h-5" />
              </div>
              <h3 className="text-subheading">AI Assistant Settings</h3>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-6">
            {/* API Key */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                OpenAI API Key *
              </label>
              <div className="relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-..."
                  className="input-field pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showApiKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Get your API key from{' '}
                <a 
                  href="https://platform.openai.com/api-keys" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800"
                >
                  OpenAI Platform
                </a>
              </p>
            </div>

            {/* Model Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Model
              </label>
              <div className="space-y-2">
                {availableModels.map((modelOption) => (
                  <button
                    key={modelOption.id}
                    onClick={() => setModel(modelOption.id)}
                    className={`w-full p-4 rounded-lg border text-left transition-all ${
                      model === modelOption.id
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{modelOption.name}</div>
                        <div className="text-sm opacity-75">{modelOption.description}</div>
                      </div>
                      {model === modelOption.id && (
                        <Check className="w-5 h-5 text-blue-600" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Warning */}
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> Your API key is stored locally in your browser and never sent to our servers. 
                It's only used to communicate directly with OpenAI's API.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                onClick={onClose}
                className="button-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="button-primary flex-1"
                disabled={!apiKey.trim()}
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AISettings; 