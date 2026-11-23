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
          if (err.response && (err.response.status === 401 || err.response.status === 403)) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setUser(null);
            setToken(null);
          }
        }
      } else {
        setUser(null);
        setToken(null);
      }
      setLoading(false);
    };

    checkAuth();
    return () => window.removeEventListener('auth-logout', handleAuthLogout);
  }, []);

  const login = async (email, password) => {
    setError(null);
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const res = await api.post('/auth/login', { email: normalizedEmail, password });
      const { token: jwtToken, user: userData } = res.data;
      localStorage.setItem('token', jwtToken);
      localStorage.setItem('user', JSON.stringify(userData));
      setToken(jwtToken);
      setUser(userData);
      return { success: true, user: userData };
    } catch (err) {
      if (err.response?.status === 403 && err.response?.data?.errorCode === 'EMAIL_NOT_VERIFIED') {
        const message = err.response.data.message || 'Please verify your email before signing in.';
        setError(message);
        return {
          success: false,
          requiresVerification: true,
          email: err.response.data.email || email.trim().toLowerCase(),
          error: message
        };
      }
      const message = err.response?.data?.message || 'Invalid email or password.';
      setError(message);
      return { success: false, error: message };
    }
  };

  const register = async (name, email, password) => {
    setError(null);
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const res = await api.post('/auth/register', {
        name: name.trim(),
        email: normalizedEmail,
        password
      });
      return {
        success: true,
        requiresVerification: true,
        email: res.data?.email || normalizedEmail,
        message: res.data?.message || 'Verification email sent. Please check your inbox.'
      };
    } catch (err) {
      const message = err.response?.data?.message || 'Registration failed. Please verify the information entered.';
      setError(message);
      return { success: false, error: message };
    }
  };

  const verifyOtp = async (email, otp) => {
    setError(null);
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const res = await api.post('/auth/verify-otp', {
        email: normalizedEmail,
        otp: otp.trim()
      });
      const { token: jwtToken, user: userData, message } = res.data;
      if (jwtToken && userData) {
        localStorage.setItem('token', jwtToken);
        localStorage.setItem('user', JSON.stringify(userData));
        setToken(jwtToken);
        setUser(userData);
      }
      return { success: true, message: message || 'Email verified successfully!', user: userData };
    } catch (err) {
      const message = err.response?.data?.message || 'Invalid verification code. Please try again.';
      setError(message);
      return { success: false, error: message };
    }
  };

  const verifyToken = async (verificationToken) => {
    setError(null);
    try {
      const res = await api.get('/auth/verify-link', {
        params: { token: verificationToken.trim() }
      });
      const { token: jwtToken, user: userData, message } = res.data;
      if (jwtToken && userData) {
        localStorage.setItem('token', jwtToken);
        localStorage.setItem('user', JSON.stringify(userData));
        setToken(jwtToken);
        setUser(userData);
      }
      return { success: true, message: message || 'Email verified successfully!', user: userData };
    } catch (err) {
      const message = err.response?.data?.message || 'Invalid or expired verification link.';
      setError(message);
      return { success: false, error: message };
    }
  };

  const resendVerification = async (email) => {
    setError(null);
    try {
      const normalizedEmail = email.trim().toLowerCase();
      const res = await api.post('/auth/resend-verification', {
        email: normalizedEmail
      });
      return {
        success: true,
        message: res.data?.message || 'Verification code resent successfully.',
        cooldownSeconds: res.data?.cooldownSeconds || 60
      };
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to resend verification code.';
      setError(message);
      return {
        success: false,
        error: message,
        isRateLimited: err.response?.status === 429,
        cooldownSeconds: err.response?.data?.cooldownSeconds
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        error,
        login,
        register,
        verifyOtp,
        verifyToken,
        resendVerification,
        logout,
        isAuthenticated: !!token
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
