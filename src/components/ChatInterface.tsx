import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { encrypt, decrypt } from '../utils/crypto';
import { getEncryptedKey, getAllFriendlyNames } from '../utils/indexedDB';
import { OpenAIAdapter, HuggingFaceAdapter, GoogleVertexAIAdapter, AnthropicAdapter, type LLMAdapter } from '../llm';

const ChatInterface: React.FC = () => {
  const [selectedLlmService, setSelectedLlmService] = useState('');
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [availableLlmServices, setAvailableLlmServices] = useState<string[]>([]);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const services = await getAllFriendlyNames();
        setAvailableLlmServices(services);
      } catch (error) {
        console.error('Error fetching LLM services:', error);
        // Removed redundant message as it's handled by the "no services added" check
      }
    };
    fetchServices();
  }, []);

  const handleGenerate = async () => {
    if (!selectedLlmService || !prompt) {
      setMessage('Please select an LLM service and enter a prompt.');
      return;
    }

    setLoading(true);
    setMessage('');
    setResponse('');

    try {
      // For simplicity, assuming a default encryption password for now.
      // In a real app, this would be handled more securely, perhaps by prompting the user once.
      const encryptionPassword = "default_password";

      const storedData = await getEncryptedKey(selectedLlmService);
      if (!storedData) {
        setMessage(`No encrypted API Key found for ${selectedLlmService}. Please set it in settings.`);
        setLoading(false);
        return;
      }

      const decryptedApiKey = await decrypt(storedData.encryptedKey, encryptionPassword);

      let adapter: LLMAdapter;
      switch (storedData.serviceType.toLowerCase()) {
        case 'openai':
        case 'chatgpt': // Assuming 'chatgpt' is an alias for OpenAI
          adapter = new OpenAIAdapter(decryptedApiKey);
          break;
        case 'huggingface':
          adapter = new HuggingFaceAdapter(decryptedApiKey, 'https://api-inference.huggingface.co/models/gpt2'); // Default HF endpoint
          break;
        case 'google-vertex-ai':
          if (!storedData.endpoint) {
            setMessage('Endpoint not found for Google Vertex AI. Please update settings.');
            setLoading(false);
            return;
          }
          adapter = new GoogleVertexAIAdapter(decryptedApiKey, storedData.endpoint);
          break;
        case 'anthropic':
          adapter = new AnthropicAdapter(decryptedApiKey);
          break;
        default:
          setMessage('Unsupported LLM service.');
          setLoading(false);
          return;
      }

      const llmResponse = await adapter.generate(prompt);
      setResponse(llmResponse);
    } catch (error) {
      console.error('Error during LLM generation:', error);
      setMessage(`Error: ${error instanceof Error ? error.message : 'An unknown error occurred.'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Chat with LLM</h2>
      {availableLlmServices.length === 0 ? (
        <p style={{ color: 'orange' }}>
          Sorry, no LLM services added. Please go to{' '}
          <Link to="/settings">Settings</Link> to set one up.
        </p>
      ) : (
        <div>
          <div>
            <label htmlFor="llmService">Select LLM Service:</label>
            <select
              id="llmService"
              value={selectedLlmService}
              onChange={(e) => setSelectedLlmService(e.target.value)}
            >
              <option value="">--Select--</option>
              {availableLlmServices.map((service) => (
                <option key={service} value={service}>
                  {service}
                </option>
              ))}
            </select>
          </div>
      <div>
        <label htmlFor="prompt">Your Prompt:</label>
        <textarea
          id="prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={5}
          placeholder="Type your message here..."
        ></textarea>
      </div>
      <button onClick={handleGenerate} disabled={loading}>
        {loading ? 'Generating...' : 'Generate Response'}
      </button>
        </div>
      )}
      {message && <p style={{ color: 'red' }}>{message}</p>}
      {response && (
        <div>
          <h3>LLM Response:</h3>
          <p>{response}</p>
        </div>
      )}
    </div>
  );
};

export default ChatInterface;