import apiClient, { setAuthToken, getAuthToken } from './apiClient';
import { config } from '../config/env';

/**
 * Pre-configured default demo developer account.
 * Used for instant preview and one-click demo login.
 */
const DEFAULT_DEMO_USER = {
  id: 'usr_dev_101',
  name: 'Rama Dev (Demo)',
  email: 'developer@example.com',
  password: 'demo-developer-mode',
  role: 'Lead Staff Engineer',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop&crop=faces',
  githubConnected: true,
  createdAt: '2025-01-15T00:00:00.000Z',
};

const MOCK_STORAGE_KEY = 'repomemory_mock_auth_user';
const MOCK_USERS_DB_KEY = 'repomemory_mock_users_db';

/**
 * Retrieves the mock accounts database from localStorage.
 * Guarantees the pre-seeded demo developer account is available.
 */
const getMockUsersDB = () => {
  try {
    const raw = localStorage.getItem(MOCK_USERS_DB_KEY);
    if (!raw) {
      const initial = [DEFAULT_DEMO_USER];
      localStorage.setItem(MOCK_USERS_DB_KEY, JSON.stringify(initial));
      return initial;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [DEFAULT_DEMO_USER];
    }
    if (!parsed.some((u) => u.email?.toLowerCase() === DEFAULT_DEMO_USER.email.toLowerCase())) {
      parsed.unshift(DEFAULT_DEMO_USER);
      localStorage.setItem(MOCK_USERS_DB_KEY, JSON.stringify(parsed));
    }
    return parsed;
  } catch {
    return [DEFAULT_DEMO_USER];
  }
};

/**
 * Persists the mock accounts list into localStorage.
 */
const saveMockUsersDB = (users) => {
  try {
    localStorage.setItem(MOCK_USERS_DB_KEY, JSON.stringify(users));
  } catch (err) {
    console.error('Failed to save mock users database to localStorage:', err);
  }
};

export const authService = {
  /**
   * Register a new user.
   * In Mock Mode: Validates required fields, checks for duplicate email,
   * stores user with password in mock DB, and creates an active session.
   * In Live Mode: Dispatches HTTP POST /auth/register to backend.
   */
  async register(userData) {
    if (config.isMockMode) {
      await new Promise((resolve) => setTimeout(resolve, 350));
      const { name, email, password } = userData || {};

      if (!name?.trim() || !email?.trim() || !password) {
        throw new Error('All fields (name, email, password) are required.');
      }

      const normalizedEmail = email.toLowerCase().trim();
      const users = getMockUsersDB();

      if (users.some((u) => u.email?.toLowerCase() === normalizedEmail)) {
        throw new Error('User with this email already exists.');
      }

      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters long.');
      }

      const newUser = {
        id: `usr_${Date.now()}`,
        name: name.trim(),
        email: normalizedEmail,
        password: password, // Stored to verify future login attempts
        role: 'developer',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop&crop=faces',
        githubConnected: false,
        createdAt: new Date().toISOString(),
      };

      users.push(newUser);
      saveMockUsersDB(users);

      // Session user object (omits password for security)
      const sessionUser = {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        avatar: newUser.avatar,
        githubConnected: newUser.githubConnected,
        createdAt: newUser.createdAt,
      };

      localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(sessionUser));
      const mockToken = `mock_jwt_token_${newUser.id}`;
      setAuthToken(mockToken);
      return { success: true, user: sessionUser, token: mockToken };
    }

    const res = await apiClient.post('/auth/register', userData);
    const data = res.data || res;
    if (data.token) setAuthToken(data.token);
    return data;
  },

  /**
   * Authenticate an existing user.
   * In Mock Mode: Strictly verifies that the email exists and the password matches.
   * Throws an error on password mismatch or non-existent account.
   * In Live Mode: Dispatches HTTP POST /auth/login to backend.
   */
  async login(credentials) {
    if (config.isMockMode) {
      await new Promise((resolve) => setTimeout(resolve, 350));
      const { email, password } = credentials || {};

      if (!email?.trim() || !password) {
        throw new Error('Email and password must be valid non-empty strings.');
      }

      const normalizedEmail = email.toLowerCase().trim();
      const users = getMockUsersDB();

      const account = users.find((u) => u.email?.toLowerCase() === normalizedEmail);

      // Verify credentials strictly: email must exist AND password must match
      if (!account || account.password !== password) {
        throw new Error('Invalid email or password');
      }

      // Safe user payload excluding credentials
      const sessionUser = {
        id: account.id,
        name: account.name,
        email: account.email,
        role: account.role || 'developer',
        avatar: account.avatar || DEFAULT_DEMO_USER.avatar,
        githubConnected: !!account.githubConnected,
        createdAt: account.createdAt || new Date().toISOString(),
      };

      localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(sessionUser));
      const mockToken = `mock_jwt_token_${account.id}`;
      setAuthToken(mockToken);
      return { success: true, user: sessionUser, token: mockToken };
    }

    const res = await apiClient.post('/auth/login', credentials);
    const data = res.data || res;
    if (data.token) setAuthToken(data.token);
    return data;
  },

  /**
   * Retrieves the currently authenticated user session.
   * In Mock Mode: Reads active session from localStorage. Returns null if logged out.
   * In Live Mode: Validates JWT token against backend GET /auth/me.
   */
  async getCurrentUser() {
    if (config.isMockMode) {
      await new Promise((resolve) => setTimeout(resolve, 150));
      const saved = localStorage.getItem(MOCK_STORAGE_KEY);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          localStorage.removeItem(MOCK_STORAGE_KEY);
          return null;
        }
      }
      // Strictly return null when not logged in (prevents unwanted auto-login)
      return null;
    }

    // In live mode, verify token or cookie session with backend
    const token = getAuthToken();
    if (!token) return null;

    const res = await apiClient.get('/auth/me');
    return res.data || res;
  },

  /**
   * Clears the current authentication session.
   */
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

  /**
   * Request password reset instructions.
   */
  async forgotPassword(email) {
    if (config.isMockMode) {
      await new Promise((resolve) => setTimeout(resolve, 350));
      if (!email || !email.includes('@')) {
        throw new Error('Please enter a valid email address.');
      }

      const normalized = email.toLowerCase().trim();
      const users = getMockUsersDB();
      let user = users.find((u) => u.email?.toLowerCase() === normalized);

      const mockToken = `mock_reset_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      if (!user) {
        user = {
          id: `usr_${Date.now()}`,
          name: normalized.split('@')[0],
          email: normalized,
          password: 'TemporaryPassword123!',
          role: 'developer',
          createdAt: new Date().toISOString(),
        };
        users.push(user);
      }

      user.resetPasswordToken = mockToken;
      user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
      saveMockUsersDB(users);

      return {
        success: true,
        message: 'If an account with that email exists, password reset instructions have been sent.',
        resetToken: mockToken,
        resetUrl: `/reset-password?token=${mockToken}`,
      };
    }

    const res = await apiClient.post('/auth/forgot-password', { email });
    return res.data || res;
  },

  /**
   * Complete password reset using reset token and new password.
   */
  async resetPassword({ token, newPassword }) {
    if (config.isMockMode) {
      await new Promise((resolve) => setTimeout(resolve, 400));
      if (!token) {
        throw new Error('Password reset token is required.');
      }
      if (!newPassword || newPassword.length < 8) {
        throw new Error('Password must be at least 8 characters long.');
      }

      const users = getMockUsersDB();
      const user = users.find(
        (u) =>
          u.resetPasswordToken === token &&
          (!u.resetPasswordExpires || u.resetPasswordExpires > Date.now())
      );

      // In mock mode, if testing with generic token allow reset on the demo account as well
      const targetUser = user || users.find((u) => u.email === DEFAULT_DEMO_USER.email);

      if (!targetUser) {
        throw new Error('Password reset token is invalid or has expired.');
      }

      targetUser.password = newPassword;
      delete targetUser.resetPasswordToken;
      delete targetUser.resetPasswordExpires;
      saveMockUsersDB(users);

      return {
        success: true,
        message: 'Password has been reset successfully. You can now log in with your new password.',
      };
    }

    const res = await apiClient.post('/auth/reset-password', { token, newPassword });
    return res.data || res;
  },

  /**
   * Authenticate or register using Google OAuth.
   */
  async loginWithGoogle(payload) {
    if (config.isMockMode) {
      await new Promise((resolve) => setTimeout(resolve, 350));
      const email = payload.email || 'developer.personal@gmail.com';
      const normalizedEmail = email.toLowerCase().trim();

      if (!normalizedEmail.endsWith('@gmail.com') && !normalizedEmail.endsWith('@googlemail.com')) {
        throw new Error(
          'Google login is restricted to personal Gmail accounts (@gmail.com). Work or enterprise emails are not permitted.'
        );
      }

      const name = payload.name || 'Google Developer';
      const avatar =
        payload.avatar ||
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&h=120&fit=crop&crop=faces';
      const googleId = payload.googleId || `g_${Date.now()}`;

      const users = getMockUsersDB();
      let account = users.find(
        (u) => u.googleId === googleId || u.email?.toLowerCase() === normalizedEmail
      );

      if (account) {
        account.googleId = googleId;
        account.authProvider = 'google';
        if (avatar) account.avatar = avatar;
      } else {
        account = {
          id: `usr_g_${Date.now()}`,
          name,
          email: normalizedEmail,
          googleId,
          authProvider: 'google',
          role: 'developer',
          avatar,
          githubConnected: false,
          createdAt: new Date().toISOString(),
        };
        users.push(account);
      }
      saveMockUsersDB(users);

      const sessionUser = {
        id: account.id,
        name: account.name,
        email: account.email,
        role: account.role || 'developer',
        avatar: account.avatar,
        authProvider: 'google',
        githubConnected: !!account.githubConnected,
      };

      localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(sessionUser));
      const mockToken = `mock_google_jwt_${account.id}`;
      setAuthToken(mockToken);
      return { success: true, user: sessionUser, token: mockToken };
    }

    const res = await apiClient.post('/auth/google', payload);
    const data = res.data || res;
    if (data.token) setAuthToken(data.token);
    return data;
  },

  /**
   * Authenticate or register using Microsoft OAuth.
   */
  async loginWithMicrosoft(payload) {
    if (config.isMockMode) {
      await new Promise((resolve) => setTimeout(resolve, 350));
      const email = payload.email || 'developer.msft@repomemory.io';
      const normalizedEmail = email.toLowerCase().trim();
      const name = payload.name || 'Microsoft Developer';
      const avatar =
        payload.avatar ||
        'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=120&h=120&fit=crop&crop=faces';
      const microsoftId = payload.microsoftId || `ms_${Date.now()}`;

      const users = getMockUsersDB();
      let account = users.find(
        (u) => u.microsoftId === microsoftId || u.email?.toLowerCase() === normalizedEmail
      );

      if (account) {
        account.microsoftId = microsoftId;
        account.authProvider = 'microsoft';
        if (avatar) account.avatar = avatar;
      } else {
        account = {
          id: `usr_ms_${Date.now()}`,
          name,
          email: normalizedEmail,
          microsoftId,
          authProvider: 'microsoft',
          role: 'developer',
          avatar,
          githubConnected: false,
          createdAt: new Date().toISOString(),
        };
        users.push(account);
      }
      saveMockUsersDB(users);

      const sessionUser = {
        id: account.id,
        name: account.name,
        email: account.email,
        role: account.role || 'developer',
        avatar: account.avatar,
        authProvider: 'microsoft',
        githubConnected: !!account.githubConnected,
      };

      localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(sessionUser));
      const mockToken = `mock_ms_jwt_${account.id}`;
      setAuthToken(mockToken);
      return { success: true, user: sessionUser, token: mockToken };
    }

    const res = await apiClient.post('/auth/microsoft', payload);
    const data = res.data || res;
    if (data.token) setAuthToken(data.token);
    return data;
  },
};

export default authService;

