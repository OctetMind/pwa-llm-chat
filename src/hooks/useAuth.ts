import { useState, useEffect } from 'react';

interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
  user: { id: string; username: string } | null;
  loading: boolean;
}

const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    token: null,
    user: null,
    loading: true,
  });

  useEffect(() => {
    const token = localStorage.getItem('jwt_token');
    if (token) {
      // In a real app, you'd want to validate the token with your backend
      // For simplicity, we'll just assume it's valid for now and decode it
      try {
        const decodedUser = JSON.parse(atob(token.split('.')[1])); // Basic JWT decode
        setAuthState({
          isAuthenticated: true,
          token,
          user: decodedUser,
          loading: false,
        });
      } catch (error) {
        console.error('Failed to decode token:', error);
        localStorage.removeItem('jwt_token'); // Clear invalid token
        setAuthState({
          isAuthenticated: false,
          token: null,
          user: null,
          loading: false,
        });
      }
    } else {
      setAuthState({
        isAuthenticated: false,
        token: null,
        user: null,
        loading: false,
      });
    }
  }, []);

  const login = (token: string) => {
    localStorage.setItem('jwt_token', token);
    try {
      const decodedUser = JSON.parse(atob(token.split('.')[1]));
      setAuthState({
        isAuthenticated: true,
        token,
        user: decodedUser,
        loading: false,
      });
    } catch (error) {
      console.error('Failed to decode token on login:', error);
      setAuthState({
        isAuthenticated: false,
        token: null,
        user: null,
        loading: false,
      });
    }
  };

  const logout = () => {
    localStorage.removeItem('jwt_token');
    setAuthState({
      isAuthenticated: false,
      token: null,
      user: null,
      loading: false,
    });
  };

  return { ...authState, login, logout };
};

export default useAuth;