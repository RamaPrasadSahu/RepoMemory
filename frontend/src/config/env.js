/**
 * Environment configuration for RepoMemory Impact frontend.
 * Reads Vite environment variables safely and applies production-ready defaults.
 * 
 * Note: Vite environment variables are public and bundled into the client build.
 * NEVER put secrets, tokens, or private credentials in this file or VITE_* variables.
 */

const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';
const rawUseMocks = import.meta.env.VITE_USE_MOCKS;

export const config = {
  // Central API Base URL for backend requests
  apiBaseUrl: rawApiBaseUrl.replace(/\/+$/, ''), // strip trailing slash
  
  // Flag indicating if application should operate in mock mode
  isMockMode: rawUseMocks === undefined || rawUseMocks === 'true' || rawUseMocks === true,
  
  // App metadata
  appName: 'RepoMemory Impact',
  appTagline: 'Pull Request Change Impact Analysis Platform',
  version: '1.0.0',
  mode: import.meta.env.MODE || 'development',
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
};

/**
 * Validates configuration and logs status in development mode.
 */
export const validateConfig = () => {
  if (config.isDev) {
    console.info(
      `%c[RepoMemory Impact]%c Initialized in ${config.isMockMode ? 'MOCK' : 'LIVE'} mode. API Base: ${config.apiBaseUrl}`,
      'color: #818cf8; font-weight: bold;',
      'color: inherit;'
    );
  }
};

export default config;
