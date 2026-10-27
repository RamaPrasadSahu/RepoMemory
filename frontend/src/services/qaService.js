import apiClient from './apiClient';
import { config } from '../config/env';
import { mockQADatasets } from '../mocks/mockQA';

const MOCK_QA_STORAGE_KEY = 'repomemory_mock_qa_history';

const getStoredQAHistory = () => {
  try {
    const raw = localStorage.getItem(MOCK_QA_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const saveQAHistory = (history) => {
  try {
    localStorage.setItem(MOCK_QA_STORAGE_KEY, JSON.stringify(history));
  } catch {
    // ignore local storage errors
  }
};

export const qaService = {
  /**
   * Ask a natural language question about the repository.
   */
  async askQuestion(repositoryId, questionText) {
    if (!questionText || !questionText.trim()) {
      throw new Error('Question prompt cannot be empty.');
    }

    if (config.isMockMode) {
      await new Promise((resolve) => setTimeout(resolve, 600)); // Simulate AI reasoning latency

      const dataset = mockQADatasets[repositoryId] || mockQADatasets.repo_101;
      const lower = questionText.toLowerCase().trim();

      // Find closest predefined match
      const matchedItem = dataset.items.find((item) => {
        const qLower = item.question.toLowerCase();
        return (
          lower.includes('auth') && qLower.includes('auth') ||
          (lower.includes('grade') || lower.includes('gpa')) && (qLower.includes('grade') || qLower.includes('gpa')) ||
          (lower.includes('csv') || lower.includes('attendance')) && (qLower.includes('csv') || qLower.includes('attendance')) ||
          (lower.includes('webhook') || lower.includes('stripe')) && (qLower.includes('webhook') || qLower.includes('stripe')) ||
          (lower.includes('schema') || lower.includes('kafka')) && (qLower.includes('schema') || qLower.includes('kafka'))
        );
      });

      const responseItem = matchedItem || {
        id: `qa_${Date.now()}`,
        repositoryId,
        question: questionText,
        answer: `Based on AST dependency indexing of **${dataset.repositoryName || 'repository'}**, the primary implementation for this functionality is located within the core controllers and services. Module dependencies were traced through the import hierarchy.`,
        confidenceScore: 0.89,
        category: 'Codebase Architecture',
        createdAt: new Date().toISOString(),
        sourceCitations: [
          {
            filePath: 'src/controllers/studentController.js',
            symbolName: 'Controller Exports',
            lineRange: 'Lines 12-45',
            codeSnippet: `// Primary handler binding in src/controllers/studentController.js\nexport const handleRequest = asyncHandler(async (req, res) => {\n  // Contextual delegation to service layer\n  const result = await computeResult(req.body);\n  res.json(new ApiResponse(200, result));\n});`,
          },
        ],
        relatedNodes: ['src/controllers/studentController.js', 'src/routes/studentRoutes.js'],
      };

      // Store in session history
      const history = getStoredQAHistory();
      const repoHistory = history[repositoryId] || [];
      const updatedHistory = [responseItem, ...repoHistory.filter((i) => i.id !== responseItem.id)].slice(0, 20);
      history[repositoryId] = updatedHistory;
      saveQAHistory(history);

      return responseItem;
    }

    // Live backend mode
    const response = await apiClient.post(`/repositories/${encodeURIComponent(repositoryId)}/qa`, {
      question: questionText.trim(),
    });
    return response.data?.data;
  },

  /**
   * Get suggested questions for a repository.
   */
  async getSuggestedQuestions(repositoryId) {
    if (config.isMockMode) {
      const dataset = mockQADatasets[repositoryId] || mockQADatasets.repo_101;
      return dataset.suggestedQuestions || [];
    }

    const response = await apiClient.get(`/repositories/${encodeURIComponent(repositoryId)}/qa/suggested`);
    return response.data?.data || [];
  },

  /**
   * Get past questions answered for this repository.
   */
  async getQAHistory(repositoryId) {
    if (config.isMockMode) {
      const history = getStoredQAHistory();
      const userHistory = history[repositoryId] || [];
      const dataset = mockQADatasets[repositoryId] || mockQADatasets.repo_101;
      
      // Combine user queries with default mock samples
      const combined = [...userHistory];
      dataset.items.forEach((item) => {
        if (!combined.some((c) => c.id === item.id)) {
          combined.push(item);
        }
      });
      return combined;
    }

    const response = await apiClient.get(`/repositories/${encodeURIComponent(repositoryId)}/qa/history`);
    return response.data?.data || [];
  },
};

export default qaService;
