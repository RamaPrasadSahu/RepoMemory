import apiClient from './apiClient';
import { config } from '../config/env';

export const GITHUB_PAT_KEY = 'repomemory_github_pat';
export const GITHUB_USER_KEY = 'repomemory_github_user';

export const githubService = {
  /**
   * Get currently saved GitHub Personal Access Token from local storage.
   */
  getStoredToken() {
    return localStorage.getItem(GITHUB_PAT_KEY) || '';
  },

  /**
   * Get currently saved GitHub User profile from local storage.
   */
  getStoredUser() {
    try {
      const data = localStorage.getItem(GITHUB_USER_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  /**
   * Persist GitHub connection credentials and user profile.
   */
  saveConnection(token, user) {
    if (token) {
      localStorage.setItem(GITHUB_PAT_KEY, token.trim());
    }
    if (user) {
      localStorage.setItem(GITHUB_USER_KEY, JSON.stringify(user));
    }
    window.dispatchEvent(new CustomEvent('repomemory:github_connected', { detail: { user } }));
  },

  /**
   * Disconnect the current GitHub account and remove credentials.
   */
  disconnect() {
    localStorage.removeItem(GITHUB_PAT_KEY);
    localStorage.removeItem(GITHUB_USER_KEY);
    window.dispatchEvent(new CustomEvent('repomemory:github_disconnected'));
  },

  /**
   * Check whether a GitHub account is currently connected.
   */
  isConnected() {
    return !!this.getStoredToken();
  },

  /**
   * Verify a GitHub Personal Access Token.
   */
  async verifyToken(token) {
    if (!token || !token.trim()) {
      throw new Error('Please enter a GitHub Personal Access Token.');
    }

    if (config.isMockMode) {
      await new Promise((r) => setTimeout(r, 600));
      const mockUser = {
        login: 'octocat',
        name: 'The Octocat',
        avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop&crop=faces',
        html_url: 'https://github.com/octocat',
        public_repos: 8,
        total_private_repos: 4,
        bio: 'Open source contributor & software architect.',
      };
      this.saveConnection(token, mockUser);
      return { valid: true, user: mockUser };
    }

    const res = await apiClient.post('/repositories/github/verify-token', { token: token.trim() });
    const data = res.data || res;
    if (data?.user) {
      this.saveConnection(token, data.user);
    }
    return data;
  },

  /**
   * Fetch repositories owned or collaborated by the user.
   */
  async getUserRepositories(token = null, username = null) {
    const activeToken = token || this.getStoredToken();
    const storedUser = this.getStoredUser();
    const targetUsername = username || storedUser?.login;

    if (config.isMockMode && !activeToken) {
      await new Promise((r) => setTimeout(r, 400));
      return [
        {
          id: 'repo_gh_1',
          name: 'ecommerce-microservices',
          fullName: 'octocat/ecommerce-microservices',
          description: 'High-concurrency e-commerce order routing and checkout service.',
          primaryLanguage: 'TypeScript',
          defaultBranch: 'main',
          starsCount: 42,
          forksCount: 12,
          openPrsCount: 3,
          isPrivate: false,
          htmlUrl: 'https://github.com/octocat/ecommerce-microservices',
        },
        {
          id: 'repo_gh_2',
          name: 'auth-gateway-service',
          fullName: 'octocat/auth-gateway-service',
          description: 'Zero-trust JWT authentication and RBAC permission gateway.',
          primaryLanguage: 'JavaScript',
          defaultBranch: 'master',
          starsCount: 128,
          forksCount: 34,
          openPrsCount: 2,
          isPrivate: true,
          htmlUrl: 'https://github.com/octocat/auth-gateway-service',
        },
        {
          id: 'repo_gh_3',
          name: 'cloud-infra-terraform',
          fullName: 'octocat/cloud-infra-terraform',
          description: 'Terraform modules for multi-region AWS and GCP deployments.',
          primaryLanguage: 'HCL',
          defaultBranch: 'main',
          starsCount: 19,
          forksCount: 4,
          openPrsCount: 1,
          isPrivate: false,
          htmlUrl: 'https://github.com/octocat/cloud-infra-terraform',
        },
      ];
    }

    const params = {};
    if (activeToken) params.token = activeToken;
    if (targetUsername) params.username = targetUsername;

    const res = await apiClient.get('/repositories/github/user-repos', {
      params,
      headers: activeToken ? { 'x-github-token': activeToken } : {},
    });
    return res.data || res;
  },

  /**
   * Connect a repository by full name or URL.
   */
  async connectRepository(repoUrl, token = null) {
    const activeToken = token || this.getStoredToken();
    const res = await apiClient.post(
      '/repositories/connect',
      {
        fullName: repoUrl,
        token: activeToken,
      },
      {
        headers: activeToken ? { 'x-github-token': activeToken } : {},
      }
    );
    return res.data || res;
  },

  /**
   * Analyze an arbitrary GitHub PR URL or repo + prNumber.
   */
  async analyzeGithubPR(repoUrl, prNumber = null, token = null) {
    const activeToken = token || this.getStoredToken();
    const res = await apiClient.post(
      '/repositories/github/analyze-pr',
      {
        repoUrl,
        prNumber,
        token: activeToken,
      },
      {
        headers: activeToken ? { 'x-github-token': activeToken } : {},
      }
    );
    return res.data || res;
  },
};

export default githubService;
