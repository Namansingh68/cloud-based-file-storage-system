import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleAuthLogout = () => {
      setUser(null);
      setToken(null);
    };
    window.addEventListener('auth-logout', handleAuthLogout);

    const checkAuth = async () => {
      const savedToken = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');

      if (savedToken && savedUser) {
        try {
          setUser(JSON.parse(savedUser));
          setToken(savedToken);
          // Verify with backend
          const res = await api.get('/auth/me');
          setUser(res.data);
          localStorage.setItem('user', JSON.stringify(res.data));
        } catch (err) {
          if (err.response && err.response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setUser(null);
            setToken(null);
          }
        }
      } else {
        // Default Demo User for public GitHub Pages visitors
        const demoUser = {
          id: 1,
          name: "Naman Kumar",
          email: "naman@bitmesra.ac.in",
          storageQuota: 524288000,
          usedStorage: 14680064,
          role: "ROLE_STUDENT"
        };
        const demoToken = "demo-token-bit-mesra-mo-2026";
        setUser(demoUser);
        setToken(demoToken);
        localStorage.setItem('user', JSON.stringify(demoUser));
        localStorage.setItem('token', demoToken);
      }
      setLoading(false);
    };

    checkAuth();
    return () => window.removeEventListener('auth-logout', handleAuthLogout);
  }, []);

  const login = async (email, password) => {
    setError(null);
    try {
      const res = await api.post('/auth/login', { email, password });
      const { token: jwtToken, user: userData } = res.data;
      localStorage.setItem('token', jwtToken);
      localStorage.setItem('user', JSON.stringify(userData));
      setToken(jwtToken);
      setUser(userData);
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Login failed. Please verify credentials.';
      setError(message);
      return { success: false, error: message };
    }
  };

  const register = async (name, email, password) => {
    setError(null);
    try {
      const res = await api.post('/auth/register', { name, email, password });
      const { token: jwtToken, user: userData } = res.data;
      localStorage.setItem('token', jwtToken);
      localStorage.setItem('user', JSON.stringify(userData));
      setToken(jwtToken);
      setUser(userData);
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Registration failed.';
      setError(message);
      return { success: false, error: message };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, error, login, register, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
