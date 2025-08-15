import React, { useState } from 'react';
import { encrypt, decrypt } from '../utils/crypto';
import { saveEncryptedKey, getEncryptedKey } from '../utils/indexedDB';

const LLMSettings: React.FC = () => {
  const [llmService, setLlmService] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [encryptionPassword, setEncryptionPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleSave = async () => {
    if (!llmService || !apiKey || !encryptionPassword) {
      setMessage('Please fill in all fields.');
      return;
    }

    try {
      const encryptedApiKey = await encrypt(apiKey, encryptionPassword);
      await saveEncryptedKey(llmService, encryptedApiKey);
      setMessage('API Key encrypted and saved successfully!');
    } catch (error) {
      console.error('Encryption failed:', error);
      setMessage('Failed to encrypt API Key. Check console for details.');
    }
  };

  const handleLoadAndDecrypt = async () => {
    if (!llmService || !encryptionPassword) {
      setMessage('Please provide LLM Service and Encryption Password to decrypt.');
      return;
    }

    try {
      const storedEncryptedApiKey = await getEncryptedKey(llmService);
      if (!storedEncryptedApiKey) {
        setMessage('No encrypted API Key found for this service.');
        return;
      }

      const decryptedApiKey = await decrypt(storedEncryptedApiKey, encryptionPassword);
      setMessage(`API Key decrypted successfully: ${decryptedApiKey}`);
      setApiKey(decryptedApiKey); // Populate the API key field with decrypted value
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
        <label htmlFor="llmService">LLM Service:</label>
        <input
          id="llmService"
          type="text"
          value={llmService}
          onChange={(e) => setLlmService(e.target.value)}
          placeholder="e.g., OpenAI, HuggingFace"
        />
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