import apiClient, { setAuthToken, getAuthToken } from './apiClient';
import { config } from '../config/env';

const MOCK_USER = {
  id: 'usr_dev_101',
  name: 'Rama Dev',
  email: 'developer@example.com',
  role: 'Lead Staff Engineer',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop&crop=faces',
  githubConnected: true,
  createdAt: '2025-01-15T00:00:00.000Z',
};

const MOCK_STORAGE_KEY = 'repomemory_mock_auth_user';

export const authService = {
  async register(userData) {
    if (config.isMockMode) {
      await new Promise((resolve) => setTimeout(resolve, 350));
      const user = {
        ...MOCK_USER,
        name: userData.name || 'New Developer',
        email: userData.email,
      };
      localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(user));
      setAuthToken('mock_jwt_token_sample');
      return { success: true, user, token: 'mock_jwt_token_sample' };
    }

    const res = await apiClient.post('/auth/register', userData);
    const data = res.data || res;
    if (data.token) setAuthToken(data.token);
    return data;
  },

  async login(credentials) {
    if (config.isMockMode) {
      await new Promise((resolve) => setTimeout(resolve, 350));
      const user = {
        ...MOCK_USER,
        email: credentials.email || MOCK_USER.email,
      };
      localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(user));
      setAuthToken('mock_jwt_token_sample');
      return { success: true, user, token: 'mock_jwt_token_sample' };
    }

    const res = await apiClient.post('/auth/login', credentials);
    const data = res.data || res;
    if (data.token) setAuthToken(data.token);
    return data;
  },

  async getCurrentUser() {
    if (config.isMockMode) {
      await new Promise((resolve) => setTimeout(resolve, 150));
      const saved = localStorage.getItem(MOCK_STORAGE_KEY);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          return MOCK_USER;
        }
      }
      // In mock mode, default to logged in demo user for seamless exploration
      localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(MOCK_USER));
      return MOCK_USER;
    }

    // In live mode, verify token or cookie session with backend
    const token = getAuthToken();
    if (!token) return null;

    const res = await apiClient.get('/auth/me');
    return res.data || res;
  },

  async logout() {
    if (config.isMockMode) {
      await new Promise((resolve) => setTimeout(resolve, 150));
      localStorage.removeItem(MOCK_STORAGE_KEY);
      setAuthToken(null);
      return { success: true };
    }

    try {
      await apiClient.post('/auth/logout');
    } finally {
      setAuthToken(null);
    }
    return { success: true };
  },
};

export default authService;
