import { Routes, Route, Link } from 'react-router-dom';
import './App.css';
import LLMSettings from './components/LLMSettings';
import Auth from './components/Auth';
import useAuth from './hooks/useAuth';

function Home() {
  return <h2>Home</h2>;
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
