import apiClient from './apiClient';
import { config } from '../config/env';
import { mockAnalysisDetails, mockAnalyses } from '../mocks/mockAnalysis';

export const analysisService = {
  async startAnalysis(pullRequestId, { baseBranch = 'main', headBranch } = {}) {
    if (config.isMockMode) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      // In mock mode, find existing analysis or return the primary student system analysis
      const existing = Object.values(mockAnalysisDetails).find((a) => a.pullRequestId === pullRequestId);
      if (existing) {
        return {
          ...existing,
          status: 'completed',
          updatedAt: new Date().toISOString(),
        };
      }
      return {
        ...mockAnalysisDetails.analysis_101,
        id: `analysis_${Date.now()}`,
        pullRequestId,
        sourceBranch: headBranch || 'feature/proposed-change',
        targetBranch: baseBranch,
        status: 'completed',
      };
    }

    const res = await apiClient.post(`/pull-requests/${pullRequestId}/analyze`, {
      baseBranch,
      headBranch,
    });
    return res.data || res;
  },

  async getAnalysisById(analysisId) {
    if (config.isMockMode) {
      await new Promise((resolve) => setTimeout(resolve, 200));
      const analysis = mockAnalysisDetails[analysisId] || Object.values(mockAnalysisDetails).find((a) => a.id === analysisId || a.pullRequestId === analysisId);
      if (!analysis) {
        // Fallback to analysis_101 if sample ID
        if (mockAnalysisDetails.analysis_101) return mockAnalysisDetails.analysis_101;
        throw {
          status: 404,
          code: 'ANALYSIS_NOT_FOUND',
          message: `Impact analysis "${analysisId}" was not found.`,
        };
      }
      return analysis;
    }

    const res = await apiClient.get(`/analyses/${analysisId}`);
    return res.data || res;
  },

  async getAnalysisGraph(analysisId) {
    if (config.isMockMode) {
      await new Promise((resolve) => setTimeout(resolve, 150));
      const analysis = mockAnalysisDetails[analysisId] || mockAnalysisDetails.analysis_101;
      return analysis?.graph || { nodes: [], edges: [] };
    }

    const res = await apiClient.get(`/analyses/${analysisId}/graph`);
    return res.data || res;
  },

  async getAffectedFiles(analysisId) {
    if (config.isMockMode) {
      await new Promise((resolve) => setTimeout(resolve, 150));
      const analysis = mockAnalysisDetails[analysisId] || mockAnalysisDetails.analysis_101;
      return analysis?.affectedFiles || [];
    }

    const res = await apiClient.get(`/analyses/${analysisId}/affected-files`);
    return res.data || res;
  },

  async getTestRecommendations(analysisId) {
    if (config.isMockMode) {
      await new Promise((resolve) => setTimeout(resolve, 150));
      const analysis = mockAnalysisDetails[analysisId] || mockAnalysisDetails.analysis_101;
      return analysis?.testRecommendations || [];
    }

    const res = await apiClient.get(`/analyses/${analysisId}/test-recommendations`);
    return res.data || res;
  },
};

export default analysisService;
