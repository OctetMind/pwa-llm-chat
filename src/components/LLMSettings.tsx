import React, { useState, useMemo } from 'react';
import { encrypt, decrypt } from '../utils/crypto';
import { saveEncryptedKey, getEncryptedKey } from '../utils/indexedDB';
import { OpenAIAdapter, HuggingFaceAdapter, GoogleVertexAIAdapter, AnthropicAdapter } from '../llm';
import type { LLMAdapter } from '../llm';
import { getLLMServiceConfig, getAllLLMServiceTypes } from '../llm/LLMServiceFactory';

const LLMSettings: React.FC = () => {
  const [friendlyName, setFriendlyName] = useState('');
  const [serviceType, setServiceType] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [endpoint, setEndpoint] = useState(''); // New state for endpoint
  const [encryptionPassword, setEncryptionPassword] = useState('');
  const [message, setMessage] = useState('');

  // Memoize the formatted service types to prevent re-calculation on every render
  const formattedServiceTypes = useMemo(() => {
    return getAllLLMServiceTypes().map((config) => ({
      value: config.serviceType,
      label: config.displayName,
    }));
  }, []);

  const handleSave = async () => {
    if (!friendlyName || !serviceType || !apiKey || !encryptionPassword) {
      setMessage('Please fill in all fields.');
      return;
    }

    // Validate endpoint for Google Vertex AI
    const serviceConfig = getLLMServiceConfig(serviceType);
    if (serviceConfig?.requiresEndpoint && !endpoint) {
      setMessage(`Please provide an endpoint for ${serviceConfig.serviceType}.`);
      return;
    }

    try {
      const encryptedApiKey = await encrypt(apiKey, encryptionPassword);
      await saveEncryptedKey({
        friendlyName,
        serviceType,
        encryptedKey: encryptedApiKey,
        endpoint: serviceConfig?.requiresEndpoint ? endpoint : null,
      });
      setMessage('API Key encrypted and saved successfully!');
    } catch (error) {
      console.error('Encryption failed:', error);
      setMessage('Failed to encrypt API Key. Check console for details.');
    }
  };

  const handleLoadAndDecrypt = async () => {
    if (!friendlyName || !encryptionPassword) {
      setMessage('Please provide Friendly Name and Encryption Password to decrypt.');
      return;
    }

    try {
      const storedData = await getEncryptedKey(friendlyName);
      if (!storedData) {
        setMessage('No encrypted API Key found for this friendly name.');
        return;
      }

      const decryptedApiKey = await decrypt(storedData.encryptedKey, encryptionPassword);
      setMessage(`API Key decrypted successfully: ${decryptedApiKey}`);
      setApiKey(decryptedApiKey); // Populate the API key field with decrypted value
      setServiceType(storedData.serviceType); // Populate the service type field
      if (storedData.endpoint) {
        setEndpoint(storedData.endpoint); // Populate the endpoint field if available
      }
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
      <div>
        <label htmlFor="serviceType">AI Service Type:</label>
        <select
          id="serviceType"
          value={serviceType}
          onChange={(e) => setServiceType(e.target.value)}
        >
          <option value="">--Select--</option>
          {formattedServiceTypes.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
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