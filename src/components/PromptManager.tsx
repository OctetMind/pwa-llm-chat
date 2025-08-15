import React, { useState, useEffect } from 'react';
import useAuth from '../hooks/useAuth';

interface Prompt {
  id: number;
  title: string;
  content: string;
  is_public: boolean;
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
      fetchPrompts();
    } else {
      setPrompts([]);
    }
  }, [isAuthenticated, token]);

  const fetchPrompts = async () => {
    if (!token) return;
    try {
      const response = await fetch(`${API_BASE_URL}/prompts`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setPrompts(data);
      } else {
        setMessage('Failed to fetch prompts.');
      }
    } catch (error) {
      console.error('Error fetching prompts:', error);
      setMessage('Network error fetching prompts.');
    }
  };

  const handleCreatePrompt = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/prompts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: newPromptTitle,
          content: newPromptContent,
          is_public: newPromptIsPublic,
        }),
      });

      if (response.ok) {
        setMessage('Prompt created successfully!');
        setNewPromptTitle('');
        setNewPromptContent('');
        setNewPromptIsPublic(false);
        fetchPrompts(); // Refresh the list
      } else {
        const errorData = await response.json();
        setMessage(errorData.message || 'Failed to create prompt.');
      }
    } catch (error) {
      console.error('Error creating prompt:', error);
      setMessage('Network error creating prompt.');
    }
  };

  const handleUpdatePrompt = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!token || !editingPrompt) return;

    try {
      const response = await fetch(`${API_BASE_URL}/prompts/${editingPrompt.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: editingPrompt.title,
          content: editingPrompt.content,
          is_public: editingPrompt.is_public,
        }),
      });

      if (response.ok) {
        setMessage('Prompt updated successfully!');
        setEditingPrompt(null);
        fetchPrompts(); // Refresh the list
      } else {
        const errorData = await response.json();
        setMessage(errorData.message || 'Failed to update prompt.');
      }
    } catch (error) {
      console.error('Error updating prompt:', error);
      setMessage('Network error updating prompt.');
    }
  };

  const handleDeletePrompt = async (id: number) => {
    if (!token || !window.confirm('Are you sure you want to delete this prompt?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/prompts/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setMessage('Prompt deleted successfully!');
        fetchPrompts(); // Refresh the list
      } else {
        const errorData = await response.json();
        setMessage(errorData.message || 'Failed to delete prompt.');
      }
    } catch (error) {
      console.error('Error deleting prompt:', error);
      setMessage('Network error deleting prompt.');
    }
  };

  if (!isAuthenticated) {
    return <p>Please log in to manage your prompts.</p>;
  }

  return (
    <div>
      <h2>Your Prompts</h2>
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
          />
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
              <h4>{prompt.title}</h4>
              <p>{prompt.content}</p>
              <p>Public: {prompt.is_public ? 'Yes' : 'No'}</p>
              <button onClick={() => setEditingPrompt(prompt)}>Edit</button>
              <button onClick={() => handleDeletePrompt(prompt.id)}>Delete</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default PromptManager;