import apiClient from './apiClient';
import { config } from '../config/env';
import { mockPullRequests } from '../mocks/mockPullRequests';

export const pullRequestService = {
  async getPullRequests(repositoryId = null) {
    if (config.isMockMode) {
      await new Promise((resolve) => setTimeout(resolve, 200));
      if (!repositoryId) return [...mockPullRequests];
      return mockPullRequests.filter((pr) => pr.repositoryId === repositoryId);
    }

    const endpoint = repositoryId
      ? `/repositories/${repositoryId}/pull-requests`
      : '/pull-requests';
    const res = await apiClient.get(endpoint);
    return res.data || res;
  },

  async getPullRequestById(pullRequestId) {
    if (config.isMockMode) {
      await new Promise((resolve) => setTimeout(resolve, 150));
      const pr = mockPullRequests.find((p) => p.id === pullRequestId || String(p.number) === String(pullRequestId));
      if (!pr) {
        throw {
          status: 404,
          code: 'PULL_REQUEST_NOT_FOUND',
          message: `Pull request "${pullRequestId}" was not found.`,
        };
      }
      return pr;
    }

    const res = await apiClient.get(`/pull-requests/${pullRequestId}`);
    return res.data || res;
  },

  async getPullRequestAnalysis(pullRequestId) {
    if (config.isMockMode) {
      await new Promise((resolve) => setTimeout(resolve, 200));
      const pr = mockPullRequests.find((p) => p.id === pullRequestId || String(p.number) === String(pullRequestId));
      if (!pr || !pr.analysisId) {
        return null;
      }
      return { analysisId: pr.analysisId, status: pr.analysisStatus, riskLevel: pr.riskLevel };
    }

    const res = await apiClient.get(`/pull-requests/${pullRequestId}/analysis`);
    return res.data || res;
  },
};

export default pullRequestService;
