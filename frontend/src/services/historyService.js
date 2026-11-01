import apiClient from './apiClient';
import { config } from '../config/env';
import { mockAnalyses } from '../mocks/mockAnalysis';

export const historyService = {
  async getAnalysisHistory(params = {}) {
    if (config.isMockMode) {
      await new Promise((resolve) => setTimeout(resolve, 200));
      let records = [...mockAnalyses];

      if (params.repositoryId && params.repositoryId !== 'all') {
        records = records.filter((r) => r.repositoryId === params.repositoryId);
      }

      if (params.risk && params.risk !== 'all') {
        records = records.filter((r) => r.riskLevel === params.risk.toLowerCase());
      }

      if (params.search) {
        const query = params.search.toLowerCase();
        records = records.filter(
          (r) =>
            r.pullRequestTitle.toLowerCase().includes(query) ||
            r.repositoryName.toLowerCase().includes(query) ||
            String(r.pullRequestNumber).includes(query)
        );
      }

      const page = Number(params.page) || 1;
      const limit = Number(params.limit) || 10;
      const total = records.length;
      const paginated = records.slice((page - 1) * limit, page * limit);

      return {
        items: paginated,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit) || 1,
        },
      };
    }

    const res = await apiClient.get('/analyses', { params });
    const data = res.data || res;
    return {
      items: data.items || data.analyses || (Array.isArray(data) ? data : []),
      pagination: data.pagination || {
        page: data.page || 1,
        limit: data.limit || 10,
        total: data.total || (data.analyses ? data.analyses.length : 0),
        totalPages: data.totalPages || 1,
      },
    };
  },
};

export default historyService;
