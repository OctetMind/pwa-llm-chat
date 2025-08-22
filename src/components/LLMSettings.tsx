import React, { useState, useMemo, useEffect } from 'react';
import { encrypt, decrypt } from '../utils/crypto';
import type { LLMAdapter } from '../llm';
import { getLLMServiceConfig, getAllLLMServiceTypes, createLLMAdapter } from '../llm/LLMServiceFactory';
import { saveEncryptedKey, getEncryptedKey, getAllFriendlyNames, deleteEncryptedKey } from '../utils/indexedDB';
import type { LLMServiceData } from '../utils/indexedDB';
import useDebounce from '../hooks/useDebounce';
import PasswordModal from './PasswordModal';

const LLMSettings: React.FC = () => {
  const [friendlyName, setFriendlyName] = useState('');
  const [serviceType, setServiceType] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [endpoint, setEndpoint] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [encryptionPassword, setEncryptionPassword] = useState('');
  const [message, setMessage] = useState('');
  const [savedConnections, setSavedConnections] = useState<LLMServiceData[]>([]);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordModalTitle, setPasswordModalTitle] = useState('');
  const [passwordModalMessage, setPasswordModalMessage] = useState('');
  const [passwordModalCallback, setPasswordModalCallback] = useState<(password: string) => void>(() => () => {});
  const [currentConnectionFriendlyName, setCurrentConnectionFriendlyName] = useState('');
  const [modelToSelectAfterFetch, setModelToSelectAfterFetch] = useState<string | null>(null);
  const [isLoadingModels, setIsLoadingModels] = useState(false);

  const debouncedApiKey = useDebounce(apiKey, 500); // Debounce API key input

  const formattedServiceTypes = useMemo(() => {
    return getAllLLMServiceTypes().map((config) => ({
      value: config.serviceType,
      label: config.displayName,
    }));
  }, []);

  const llmAdapter = useMemo(() => {
    if (!serviceType) {
      return undefined;
    }

    const serviceConfig = getLLMServiceConfig(serviceType);
    // Only create adapter if it requires a model or if it doesn't require a model but has an API key or endpoint
    if (!serviceConfig?.requiresModel && !serviceConfig?.requiresApiKeyForModels && !serviceConfig?.requiresEndpoint) {
      return undefined;
    }

    // Check if API key is required for fetching models and if it's missing
    if (serviceConfig?.requiresApiKeyForModels && !debouncedApiKey) { // Use debounced API key here
      setMessage(`API Key is required for ${serviceConfig.displayName} to fetch models.`);
      return undefined;
    }

    return createLLMAdapter(serviceType, debouncedApiKey, endpoint); // Use debounced API key here
  }, [serviceType, debouncedApiKey, endpoint]); // Add debouncedApiKey to dependencies

  const handleFetchModels = async (): Promise<string[]> => {
    console.log('handleFetchModels called.');
    if (!llmAdapter) {
      console.log('No llmAdapter, returning empty array.');
      return [];
    }

    setIsLoadingModels(true); // Set loading state to true
    setAvailableModels([]);

    try {
      console.log('Fetching models...');
      const models = await llmAdapter.getAvailableModels();
      console.log('Models fetched:', models);
      setAvailableModels(models);
      return models;
    } catch (error) {
      console.error(`Error fetching models for ${serviceType}:`, error);
      setAvailableModels([]);
      if (!modelToSelectAfterFetch) { // Only clear if no model is pending selection
        if (!modelToSelectAfterFetch) { // Only clear if no model is pending selection
          if (!modelToSelectAfterFetch) { // Only clear if no model is pending selection
            setSelectedModel('');
          }
        }
      }
      setMessage(`Failed to fetch models for ${serviceType}. Check API Key and Endpoint.`);
      return [];
    } finally {
      setIsLoadingModels(false); // Set loading state to false regardless of success or failure
    }
  };

  useEffect(() => {
    const serviceConfig = getLLMServiceConfig(serviceType);
    if (llmAdapter && serviceConfig?.requiresModel && !modelToSelectAfterFetch) {
      handleFetchModels();
    }
  }, [llmAdapter, serviceType]);

  useEffect(() => {
    if (modelToSelectAfterFetch && availableModels.length > 0) {
      console.log('Attempting to select model after fetch:', modelToSelectAfterFetch);
      if (availableModels.includes(modelToSelectAfterFetch)) {
        setSelectedModel(modelToSelectAfterFetch);
        console.log('Successfully selected model:', modelToSelectAfterFetch);
      } else {
        setMessage(`Previously selected model "${modelToSelectAfterFetch}" not found for ${serviceType}. Please select a new model.`);
        setSelectedModel('');
        console.log('Previously selected model not found.');
      }
      setModelToSelectAfterFetch(null); // Clear the temporary state
    }
  }, [modelToSelectAfterFetch, availableModels, serviceType]);

  useEffect(() => {
    const loadSavedConnections = async () => {
      try {
        const names = await getAllFriendlyNames();
        const connections: LLMServiceData[] = [];
        for (const name of names) {
          const data = await getEncryptedKey(name as string);
          if (data) {
            connections.push(data);
          }
        }
        setSavedConnections(connections);
      } catch (error) {
        console.error('Error loading saved connections:', error);
        setMessage('Failed to load saved connections.');
      }
    };
    loadSavedConnections();
  }, []); // Empty dependency array to run once on mount

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
      loadSavedConnections(); // Refresh the list after saving
    } catch (error) {
      console.error('Encryption failed:', error);
      setMessage('Failed to encrypt API Key and settings. Check console for details.');
    }
  };

  const loadSavedConnections = async () => {
    try {
      const names = await getAllFriendlyNames();
      const connections: LLMServiceData[] = [];
      for (const name of names) {
        const data = await getEncryptedKey(name as string);
        if (data) {
          connections.push(data);
        }
      }
      setSavedConnections(connections);
    } catch (error) {
      console.error('Error loading saved connections:', error);
      setMessage('Failed to load saved connections.');
    }
  };

  useEffect(() => {
    loadSavedConnections();
  }, []); // Empty dependency array to run once on mount

  const handleUseConnection = (friendlyName: string) => {
    console.log('handleUseConnection called for:', friendlyName);
    setCurrentConnectionFriendlyName(friendlyName);
    setPasswordModalTitle(`Use Connection: ${friendlyName}`);
    setPasswordModalMessage('Please enter your encryption password to use this connection:');
    setPasswordModalCallback(() => async (password: string) => {
      setIsPasswordModalOpen(false);
      if (!password) {
        setMessage('Password is required to decrypt.');
        return;
      }

      try {
        const storedData = await getEncryptedKey(friendlyName);
        if (!storedData) {
          setMessage('No encrypted API Key found for this friendly name.');
          return;
        }
        console.log('Stored data retrieved:', storedData);

        const decryptedApiKey = await decrypt(storedData.encryptedKey, password);
        setMessage(`API Key decrypted successfully for ${friendlyName}`);
        setApiKey(decryptedApiKey);
        setServiceType(storedData.serviceType);
        setEndpoint(storedData.endpoint || '');
        setFriendlyName(friendlyName); // Set friendly name for the loaded connection
        setEncryptionPassword(password); // Set password for the loaded connection
        if (getLLMServiceConfig(storedData.serviceType)?.requiresModel) {
          console.log('Service requires model, setting modelToSelectAfterFetch:', storedData.model);
          setModelToSelectAfterFetch(storedData.model); // Store model to select after fetch
        } else {
          console.log('Service does not require model, setting selected model directly:', storedData.model);
          setSelectedModel(storedData.model || '');
        }
      } catch (error) {
        console.error('Decryption failed:', error);
        setMessage('Failed to decrypt API Key. Incorrect password or corrupted data.');
      }
    });
    setIsPasswordModalOpen(true);
  };

  const handleDeleteConnection = async (friendlyName: string) => {
    if (window.confirm(`Are you sure you want to delete the connection "${friendlyName}"?`)) {
      try {
        await deleteEncryptedKey(friendlyName);
        setMessage(`Connection "${friendlyName}" deleted successfully.`);
        loadSavedConnections(); // Refresh the list after deletion
      } catch (error) {
        console.error('Error deleting connection:', error);
        setMessage(`Failed to delete connection "${friendlyName}".`);
      }
    }
  };

  const handleEditConnection = (friendlyName: string) => {
    console.log('handleEditConnection called for:', friendlyName);
    setCurrentConnectionFriendlyName(friendlyName);
    setPasswordModalTitle(`Edit Connection: ${friendlyName}`);
    setPasswordModalMessage('Please enter your encryption password to edit this connection:');
    setPasswordModalCallback(() => async (password: string) => {
      setIsPasswordModalOpen(false);
      if (!password) {
        setMessage('Password is required to decrypt for editing.');
        return;
      }

      try {
        const storedData = await getEncryptedKey(friendlyName);
        if (!storedData) {
          setMessage('No encrypted API Key found for this friendly name.');
          return;
        }
        console.log('Stored data retrieved:', storedData);

        const decryptedApiKey = await decrypt(storedData.encryptedKey, password);
        setMessage(`Connection "${friendlyName}" loaded for editing.`);
        setFriendlyName(friendlyName);
        setServiceType(storedData.serviceType);
        setApiKey(decryptedApiKey);
        setEndpoint(storedData.endpoint || '');
        setEncryptionPassword(password);
        if (getLLMServiceConfig(storedData.serviceType)?.requiresModel) {
          console.log('Service requires model, setting modelToSelectAfterFetch:', storedData.model);
          setModelToSelectAfterFetch(storedData.model); // Store model to select after fetch
        } else {
          console.log('Service does not require model, setting selected model directly:', storedData.model);
          setSelectedModel(storedData.model || '');
        }
      } catch (error) {
        console.error('Decryption failed for editing:', error);
        setMessage('Failed to decrypt API Key for editing. Incorrect password or corrupted data.');
      }
    });
    setIsPasswordModalOpen(true);
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
          <button onClick={() => handleFetchModels()} disabled={!llmAdapter || isLoadingModels}>
            {isLoadingModels ? 'Fetching Models...' : 'Fetch Models'}
          </button>
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
      {message && <p>{message}</p>}

      <h3>Saved LLM Connections</h3>
      {savedConnections.length === 0 ? (
        <p>No saved connections found.</p>
      ) : (
        <ul>
          {savedConnections.map((connection) => (
            <li key={connection.friendlyName}>
              {connection.friendlyName} ({connection.serviceType})
              <button onClick={() => handleEditConnection(connection.friendlyName)}>Edit</button>
              <button onClick={() => handleDeleteConnection(connection.friendlyName)}>Delete</button>
            </li>
          ))}
        </ul>
      )}

      <PasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        onSubmit={passwordModalCallback}
        title={passwordModalTitle}
        message={passwordModalMessage}
      />
    </div>
  );
};

export default LLMSettings;