/* eslint-disable react-refresh/only-export-components */
// src/auth/AuthProvider.jsx
import React, { createContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserById, loginRequest, setToken } from '../api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const token = localStorage.getItem('token');
        const userId = localStorage.getItem('user_id');

        if (!token || token === '' || !userId) {
          setToken(null);
          setUser(null);
          localStorage.removeItem('token');
          localStorage.removeItem('user_id');
        } else {
          setToken(token);
          const userData = await getUserById(userId);
          if (userData) {
            setUser({
              id: userData.id,
              username: userData.username,
              role: userData.role ? { id: userData.role_id, name: userData.role.name } : null,
            });
            if (window.location.pathname === '/login') {
              navigate('/');
            }
          } else {
            setToken(null);
            setUser(null);
            localStorage.removeItem('token');
            localStorage.removeItem('user_id');
            navigate('/login');
          }
        }
      } catch (error) {
        console.error('Session restoration failed:', error);
        setToken(null);
        setUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user_id');
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, [navigate]);

  const login = async (username, password) => {
    try {
      const { access_token, user_id } = await loginRequest(username, password);
      setToken(access_token);
      localStorage.setItem('token', access_token);
      localStorage.setItem('user_id', user_id);
      const userData = await getUserById(user_id);
      if (!userData) {
        throw new Error('Failed to fetch user data');
      }
      setUser({
        id: userData.id,
        username: userData.username,
        role: userData.role ? { id: userData.role_id, name: userData.role.name } : null,
      });
      navigate('/');
    } catch (error) {
      localStorage.removeItem('token');
      localStorage.removeItem('user_id');
      throw new Error(error.response?.data?.detail || 'Login failed');
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user_id');
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};