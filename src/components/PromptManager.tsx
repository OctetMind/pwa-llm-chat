import React, { useState, useEffect } from 'react';
import useAuth from '../hooks/useAuth';
import { saveLocalPrompt, getLocalPrompts, deleteLocalPrompt } from '../utils/indexedDB';
import WIPOverlay from './WIPOverlay';

interface Prompt {
  id?: number; // Make id optional for local prompts before saving
  title: string;
  content: string;
  is_public: boolean;
  isLocal?: boolean; // Added to differentiate local prompts
}

const PromptManager: React.FC = () => {
  const { isAuthenticated, token } = useAuth();
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [newPromptTitle, setNewPromptTitle] = useState('');
  const [newPromptContent, setNewPromptContent] = useState('');
  const [newPromptIsPublic, setNewPromptIsPublic] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [message, setMessage] = useState('');

  const API_BASE_URL = 'http://localhost:3000'; // Replace with your backend URL

  useEffect(() => {
    if (isAuthenticated && token) {
      fetchBackendPrompts();
    }
    fetchLocalPrompts();
  }, [isAuthenticated, token]);

  const fetchBackendPrompts = async () => {
    if (!token) return;
    try {
      const response = await fetch(`${API_BASE_URL}/prompts`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setPrompts((prevPrompts) => [...prevPrompts.filter(p => p.isLocal), ...data]);
      } else {
        setMessage('Failed to fetch backend prompts.');
      }
    } catch (error) {
      console.error('Error fetching backend prompts:', error);
      setMessage('Network error fetching backend prompts.');
    }
  };

  const fetchLocalPrompts = async () => {
    try {
      const local = await getLocalPrompts();
      setPrompts((prevPrompts) => [...prevPrompts.filter(p => !p.isLocal), ...local.map(p => ({ ...p, isLocal: true, id: p.id }))]);
    } catch (error) {
      console.error('Error fetching local prompts:', error);
      setMessage('Error fetching local prompts.');
    }
  };

  const handleCreatePrompt = async (event: React.FormEvent) => {
    event.preventDefault();

    const promptData = {
      title: newPromptTitle,
      content: newPromptContent,
      is_public: newPromptIsPublic,
    };

    if (isAuthenticated && token) {
      try {
        const response = await fetch(`${API_BASE_URL}/prompts`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(promptData),
        });

        if (response.ok) {
          setMessage('Prompt created successfully!');
          setNewPromptTitle('');
          setNewPromptContent('');
          setNewPromptIsPublic(false);
          fetchBackendPrompts(); // Refresh the list
        } else {
          const errorData = await response.json();
          setMessage(errorData.message || 'Failed to create prompt.');
        }
      } catch (error) {
        console.error('Error creating prompt:', error);
        setMessage('Network error creating prompt.');
      }
    } else {
      try {
        await saveLocalPrompt(promptData);
        setMessage('Prompt saved locally!');
        setNewPromptTitle('');
        setNewPromptContent('');
        setNewPromptIsPublic(false);
        fetchLocalPrompts(); // Refresh the list
      } catch (error) {
        console.error('Error saving local prompt:', error);
        setMessage('Failed to save local prompt.');
      }
    }
  };

  const handleUpdatePrompt = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingPrompt) return;

    const promptData = {
      title: editingPrompt.title,
      content: editingPrompt.content,
      is_public: editingPrompt.is_public,
    };

    if (editingPrompt.isLocal) {
      try {
        await saveLocalPrompt({ ...promptData, id: editingPrompt.id });
        setMessage('Local prompt updated successfully!');
        setEditingPrompt(null);
        fetchLocalPrompts();
      } catch (error) {
        console.error('Error updating local prompt:', error);
        setMessage('Failed to update local prompt.');
      }
    } else if (isAuthenticated && token) {
      try {
        const response = await fetch(`${API_BASE_URL}/prompts/${editingPrompt.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(promptData),
        });

        if (response.ok) {
          setMessage('Prompt updated successfully!');
          setEditingPrompt(null);
          fetchBackendPrompts(); // Refresh the list
        } else {
          const errorData = await response.json();
          setMessage(errorData.message || 'Failed to update prompt.');
        }
      } catch (error) {
        console.error('Error updating prompt:', error);
        setMessage('Network error updating prompt.');
      }
    } else {
      setMessage('Please log in to update backend prompts.');
    }
  };

  const handleDeletePrompt = async (id: number | undefined, isLocal: boolean | undefined) => {
    if (!id || !window.confirm('Are you sure you want to delete this prompt?')) return;

    if (isLocal) {
      try {
        await deleteLocalPrompt(id);
        setMessage('Local prompt deleted successfully!');
        fetchLocalPrompts();
      } catch (error) {
        console.error('Error deleting local prompt:', error);
        setMessage('Failed to delete local prompt.');
      }
    } else if (isAuthenticated && token) {
      try {
        const response = await fetch(`${API_BASE_URL}/prompts/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          setMessage('Prompt deleted successfully!');
          fetchBackendPrompts(); // Refresh the list
        } else {
          const errorData = await response.json();
          setMessage(errorData.message || 'Failed to delete prompt.');
        }
      } catch (error) {
        console.error('Error deleting prompt:', error);
        setMessage('Network error deleting prompt.');
      }
    } else {
      setMessage('Please log in to delete backend prompts.');
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      <WIPOverlay />
      <div>
        <h2>Your Prompts (WIP)</h2>
        {message && <p>{message}</p>}

        <h3>{editingPrompt ? 'Edit Prompt' : 'Create New Prompt'}</h3>
        <form onSubmit={editingPrompt ? handleUpdatePrompt : handleCreatePrompt}>
          <div>
            <label htmlFor="promptTitle">Title:</label>
            <input
              id="promptTitle"
              type="text"
              value={editingPrompt ? editingPrompt.title : newPromptTitle}
              onChange={(e) => editingPrompt ? setEditingPrompt({ ...editingPrompt, title: e.target.value }) : setNewPromptTitle(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="promptContent">Content:</label>
            <textarea
              id="promptContent"
              value={editingPrompt ? editingPrompt.content : newPromptContent}
              onChange={(e) => editingPrompt ? setEditingPrompt({ ...editingPrompt, content: e.target.value }) : setNewPromptContent(e.target.value)}
              rows={5}
              required
            ></textarea>
          </div>
          <div>
            <label htmlFor="isPublic">Public:</label>
            <input
              id="isPublic"
              type="checkbox"
              checked={editingPrompt ? editingPrompt.is_public : newPromptIsPublic}
              onChange={(e) => editingPrompt ? setEditingPrompt({ ...editingPrompt, is_public: e.target.checked }) : setNewPromptIsPublic(e.target.checked)}
              disabled={!isAuthenticated} // Disable if not authenticated for backend prompts
            />
            {!isAuthenticated && (
              <small title="Login to make prompts public"> (Login to make prompts public)</small>
            )}
          </div>
          <button type="submit">{editingPrompt ? 'Update Prompt' : 'Create Prompt'}</button>
          {editingPrompt && <button type="button" onClick={() => setEditingPrompt(null)}>Cancel Edit</button>}
        </form>

        <h3>All Prompts</h3>
        {prompts.length === 0 ? (
          <p>No prompts found. Create one above!</p>
        ) : (
          <ul>
            {prompts.map((prompt) => (
              <li key={prompt.id}>
                <h4>{prompt.title} {prompt.isLocal && <small>(Local)</small>}</h4>
                <p>{prompt.content}</p>
                <p>Public: {prompt.is_public ? 'Yes' : 'No'}</p>
                <button onClick={() => setEditingPrompt(prompt)}>Edit</button>
                <button onClick={() => handleDeletePrompt(prompt.id, prompt.isLocal)}>Delete</button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default PromptManager;