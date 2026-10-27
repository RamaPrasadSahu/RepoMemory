import apiClient from './apiClient';
import { config } from '../config/env';
import { mockRepositories } from '../mocks/mockRepositories';

// Local storage cache for mock operations so user can test adding/removing repos
const MOCK_REPOS_KEY = 'repomemory_mock_repositories';

const getMockRepos = () => {
  const stored = localStorage.getItem(MOCK_REPOS_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      // Fallback
    }
  }
  localStorage.setItem(MOCK_REPOS_KEY, JSON.stringify(mockRepositories));
  return [...mockRepositories];
};

const saveMockRepos = (repos) => {
  localStorage.setItem(MOCK_REPOS_KEY, JSON.stringify(repos));
};

export const repositoryService = {
  async getRepositories() {
    if (config.isMockMode) {
      await new Promise((resolve) => setTimeout(resolve, 200));
      return getMockRepos();
    }

    const res = await apiClient.get('/repositories');
    return res.data || res;
  },

  async getRepositoryById(repositoryId) {
    if (config.isMockMode) {
      await new Promise((resolve) => setTimeout(resolve, 150));
      const repos = getMockRepos();
      const repo = repos.find((r) => r.id === repositoryId || r.name === repositoryId);
      if (!repo) {
        throw {
          status: 404,
          code: 'REPOSITORY_NOT_FOUND',
          message: `Repository "${repositoryId}" was not found.`,
        };
      }
      return repo;
    }

    const res = await apiClient.get(`/repositories/${repositoryId}`);
    return res.data || res;
  },

  async connectRepository(repoData) {
    if (config.isMockMode) {
      await new Promise((resolve) => setTimeout(resolve, 350));
      const repos = getMockRepos();
      const fullName = repoData.fullName || `organization/${repoData.name || 'new-repo'}`;
      const name = fullName.split('/')[1] || fullName;

      const newRepo = {
        id: `repo_${Date.now()}`,
        name,
        fullName,
        description: repoData.description || 'Newly connected repository for impact analysis.',
        primaryLanguage: repoData.primaryLanguage || 'JavaScript',
        defaultBranch: repoData.defaultBranch || 'main',
        connectionStatus: 'connected',
        starsCount: 1,
        forksCount: 0,
        openPrsCount: 0,
        lastAnalyzedAt: null,
        createdAt: new Date().toISOString(),
        branches: ['main'],
        modulesCount: 12,
        testsCount: 10,
      };

      const updated = [newRepo, ...repos];
      saveMockRepos(updated);
      return newRepo;
    }

    const res = await apiClient.post('/repositories/connect', repoData);
    return res.data || res;
  },

  async disconnectRepository(repositoryId) {
    if (config.isMockMode) {
      await new Promise((resolve) => setTimeout(resolve, 250));
      const repos = getMockRepos();
      const updated = repos.filter((r) => r.id !== repositoryId);
      saveMockRepos(updated);
      return { success: true };
    }

    const res = await apiClient.delete(`/repositories/${repositoryId}`);
    return res.data || res;
  },
};

export default repositoryService;
