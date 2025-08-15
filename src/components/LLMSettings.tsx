import React, { useState, useMemo, useEffect } from 'react';
import { encrypt, decrypt } from '../utils/crypto';
import { OpenAIAdapter, HuggingFaceAdapter, GoogleVertexAIAdapter, AnthropicAdapter, RequestyAIAdapter } from '../llm';
import type { LLMAdapter } from '../llm';
import { getLLMServiceConfig, getAllLLMServiceTypes } from '../llm/LLMServiceFactory';
import { saveEncryptedKey, getEncryptedKey } from '../utils/indexedDB';
import type { LLMServiceData } from '../utils/indexedDB';

const LLMSettings: React.FC = () => {
  const [friendlyName, setFriendlyName] = useState('');
  const [serviceType, setServiceType] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [endpoint, setEndpoint] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [encryptionPassword, setEncryptionPassword] = useState('');
  const [message, setMessage] = useState('');

  const formattedServiceTypes = useMemo(() => {
    return getAllLLMServiceTypes().map((config) => ({
      value: config.serviceType,
      label: config.displayName,
    }));
  }, []);

  useEffect(() => {
    const fetchModels = async () => {
      if (!serviceType || !apiKey) {
        setAvailableModels([]);
        setSelectedModel('');
        return;
      }

      const serviceConfig = getLLMServiceConfig(serviceType);
      if (!serviceConfig?.requiresModel) {
        setAvailableModels([]);
        setSelectedModel('');
        return;
      }

      let adapter: LLMAdapter | undefined;
      try {
        switch (serviceType.toLowerCase()) {
          case 'openai':
            adapter = new OpenAIAdapter(apiKey);
            break;
          case 'huggingface':
            if (!endpoint) return; // Endpoint is required for HuggingFace
            adapter = new HuggingFaceAdapter(apiKey, endpoint);
            break;
          case 'google-vertex-ai':
            if (!endpoint) return; // Endpoint is required for Google Vertex AI
            adapter = new GoogleVertexAIAdapter(apiKey, endpoint);
            break;
          case 'anthropic':
            adapter = new AnthropicAdapter(apiKey);
            break;
          case 'requesty-ai':
            adapter = new RequestyAIAdapter(apiKey);
            break;
          default:
            break;
        }

        if (adapter) {
          const models = await adapter.getAvailableModels();
          setAvailableModels(models);
          if (models.length > 0 && !models.includes(selectedModel)) {
            setSelectedModel(models[0]);
          }
        }
      } catch (error) {
        console.error(`Error fetching models for ${serviceType}:`, error);
        setAvailableModels([]);
        setSelectedModel('');
        setMessage(`Failed to fetch models for ${serviceType}. Check API Key and Endpoint.`);
      }
    };

    fetchModels();
  }, [serviceType, apiKey, endpoint, selectedModel]);

  const handleSave = async () => {
    if (!friendlyName || !serviceType || !apiKey || !encryptionPassword) {
      setMessage('Please fill in all required fields.');
      return;
    }

    const serviceConfig = getLLMServiceConfig(serviceType);
    if (serviceConfig?.requiresEndpoint && !endpoint) {
      setMessage(`Please provide an endpoint for ${serviceConfig.serviceType}.`);
      return;
    }
    if (serviceConfig?.requiresModel && !selectedModel) {
      setMessage(`Please select a model for ${serviceConfig.serviceType}.`);
      return;
    }

    try {
      const encryptedApiKey = await encrypt(apiKey, encryptionPassword);
      const dataToSave: LLMServiceData = {
        friendlyName,
        serviceType,
        encryptedKey: encryptedApiKey,
        endpoint: serviceConfig?.requiresEndpoint ? endpoint : null,
        model: serviceConfig?.requiresModel ? selectedModel : null,
      };
      await saveEncryptedKey(dataToSave);
      setMessage('API Key and settings encrypted and saved successfully!');
    } catch (error) {
      console.error('Encryption failed:', error);
      setMessage('Failed to encrypt API Key and settings. Check console for details.');
    }
  };

  const handleLoadAndDecrypt = async () => {
    if (!friendlyName || !encryptionPassword) {
      setMessage('Please provide Friendly Name and Encryption Password to decrypt.');
      return;
    }

    try {
      const storedData = await getEncryptedKey(friendlyName) as LLMServiceData | null;
      if (!storedData) {
        setMessage('No encrypted API Key found for this friendly name.');
        return;
      }

      const decryptedApiKey = await decrypt(storedData.encryptedKey, encryptionPassword);
      setMessage(`API Key decrypted successfully for ${friendlyName}`);
      setApiKey(decryptedApiKey);
      setServiceType(storedData.serviceType);
      setEndpoint(storedData.endpoint || '');
      setSelectedModel(storedData.model || '');
    } catch (error) {
      console.error('Decryption failed:', error);
      setMessage('Failed to decrypt API Key. Incorrect password or corrupted data.');
    }
  };

  return (
    <div>
      <h2>LLM Connection Settings</h2>
      <p>Your LLM API keys are encrypted and stored only on your device.</p>
      <div>
        <label htmlFor="friendlyName">Friendly Name:</label>
        <input
          id="friendlyName"
          type="text"
          value={friendlyName}
          onChange={(e) => setFriendlyName(e.target.value)}
          placeholder={`e.g., My ${serviceType || 'LLM'} Key`}
        />
      </div>
      <div>
        <label htmlFor="serviceType">AI Service Type:</label>
        <select
          id="serviceType"
          value={serviceType}
          onChange={(e) => {
            setServiceType(e.target.value);
            setEndpoint(''); // Reset endpoint when service type changes
            setSelectedModel(''); // Reset model when service type changes
            setAvailableModels([]); // Clear available models
          }}
        >
          <option value="">--Select--</option>
          {formattedServiceTypes.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      {serviceType && getLLMServiceConfig(serviceType)?.requiresEndpoint && (
        <div>
          <label htmlFor="endpoint">Endpoint:</label>
          <input
            id="endpoint"
            type="text"
            value={endpoint}
            onChange={(e) => setEndpoint(e.target.value)}
            placeholder={getLLMServiceConfig(serviceType)?.endpointPlaceholder}
          />
        </div>
      )}
      {serviceType && getLLMServiceConfig(serviceType)?.requiresModel && (
        <div>
          <label htmlFor="model">Model:</label>
          <select
            id="model"
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            disabled={availableModels.length === 0}
          >
            <option value="">--Select Model--</option>
            {availableModels.map((model) => (
              <option key={model} value={model}>
                {model}
              </option>
            ))}
          </select>
          {availableModels.length === 0 && apiKey && serviceType && (
            <p style={{ color: 'orange' }}>No models found. Check API Key and Endpoint.</p>
          )}
        </div>
      )}
      <div>
        <label htmlFor="apiKey">API Key:</label>
        <input
          id="apiKey"
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="Enter your API Key"
        />
      </div>
      <div>
        <label htmlFor="encryptionPassword">Encryption Password:</label>
        <input
          id="encryptionPassword"
          type="password"
          value={encryptionPassword}
          onChange={(e) => setEncryptionPassword(e.target.value)}
          placeholder="Enter a password to encrypt/decrypt"
        />
      </div>
      <button onClick={handleSave}>Encrypt and Save Key</button>
      <button onClick={handleLoadAndDecrypt}>Load and Decrypt Key</button>
      {message && <p>{message}</p>}
    </div>
  );
};

export default LLMSettings;