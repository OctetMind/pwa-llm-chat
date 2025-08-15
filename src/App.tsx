import { Routes, Route, Link } from 'react-router-dom';
import './App.css';
import LLMSettings from './components/LLMSettings';
import Auth from './components/Auth';
import useAuth from './hooks/useAuth';

function Home() {
  return (
    <div>
      <h2>Welcome to LLM Chat PWA!</h2>
      <p>To get started, please follow these steps:</p>
      <ol>
        <li>Go to the "Settings" page to configure your LLM API keys.</li>
        <li>Provide a friendly name, select the AI service type (e.g., OpenAI, HuggingFace), enter your API key, and set an encryption password.</li>
        <li>Click "Encrypt and Save Key" to securely store your API key on your device.</li>
        <li>Once your LLM service is set up, navigate to the "Chat" page.</li>
        <li>Select your configured LLM service from the dropdown, enter your prompt, and generate a response!</li>
      </ol>
    </div>
  );
}

import ChatInterface from './components/ChatInterface';

function Chat() {
  return <ChatInterface />;
}

import PromptManager from './components/PromptManager';

function Prompts() {
  return <PromptManager />;
}

function App() {
  const { isAuthenticated, logout } = useAuth();

  return (
    <div className="App">
      <nav>
        <ul>
          <li>
            <Link to="/">Home</Link>
          </li>
          <li>
            <Link to="/chat">Chat</Link>
          </li>
          <li>
            <Link to="/settings">Settings</Link>
          </li>
          <li>
            <Link to="/prompts">Prompts</Link>
          </li>
          {isAuthenticated ? (
            <li>
              <button onClick={logout}>Logout</button>
            </li>
          ) : (
            <li>
              <Link to="/login">Login</Link>
            </li>
          )}
        </ul>
      </nav>
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/settings" element={<LLMSettings />} />
          <Route path="/login" element={<Auth />} />
          <Route path="/prompts" element={<Prompts />} />
        </Routes>
      </main>
      <footer>
        <p>&copy; 2025 LLM Chat PWA</p>
      </footer>
    </div>
  );
}

export default App;
