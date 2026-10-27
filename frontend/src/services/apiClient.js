import axios from 'axios';
import { config } from '../config/env';

/**
 * Centralized Axios client for RepoMemory Impact.
 * Configured with base URL, timeout, credentials, and error normalization.
 */
const apiClient = axios.create({
  baseURL: config.apiBaseUrl,
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  withCredentials: true, // For cookie-based sessions if backend requires it
});

// Storage key for token if Bearer auth strategy is used
const TOKEN_KEY = 'repomemory_auth_token';

export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
};

export const getAuthToken = () => {
  return localStorage.getItem(TOKEN_KEY);
};

// Request interceptor: injects Bearer token if present
apiClient.interceptors.request.use(
  (reqConfig) => {
    const token = getAuthToken();
    if (token && reqConfig.headers) {
      reqConfig.headers.Authorization = `Bearer ${token}`;
    }
    return reqConfig;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: normalizes response and error formats
apiClient.interceptors.response.use(
  (response) => {
    // If backend returns standard { success: true, data: ... }
    return response.data;
  },
  (error) => {
    let normalizedError = {
      message: 'An unexpected network error occurred.',
      code: 'NETWORK_ERROR',
      status: error.response?.status || 500,
      details: null,
    };

    if (error.response) {
      const data = error.response.data;
      normalizedError = {
        message: data?.message || data?.error?.message || `Request failed with status ${error.response.status}`,
        code: data?.error?.code || data?.code || 'API_ERROR',
        status: error.response.status,
        details: data?.error?.details || data?.details || null,
      };

      // Handle session expiration
      if (error.response.status === 401) {
        setAuthToken(null);
        window.dispatchEvent(new CustomEvent('repomemory:unauthorized'));
      }
    } else if (error.request) {
      normalizedError = {
        message: 'Could not connect to the backend server. Please verify the API is running.',
        code: 'CONNECTION_REFUSED',
        status: 0,
        details: error.message,
      };
    }

    return Promise.reject(normalizedError);
  }
);

export default apiClient;
