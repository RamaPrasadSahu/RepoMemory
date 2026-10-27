import apiClient from './apiClient';
import { config } from '../config/env';
import { mockProjectMemories } from '../mocks/mockMemory';

const MOCK_MEMORY_STORAGE_KEY = 'repomemory_mock_project_memories';

const getStoredMemories = () => {
  try {
    const raw = localStorage.getItem(MOCK_MEMORY_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(MOCK_MEMORY_STORAGE_KEY, JSON.stringify(mockProjectMemories));
      return [...mockProjectMemories];
    }
    return JSON.parse(raw);
  } catch {
    return [...mockProjectMemories];
  }
};

const saveStoredMemories = (memories) => {
  try {
    localStorage.setItem(MOCK_MEMORY_STORAGE_KEY, JSON.stringify(memories));
  } catch {
    // ignore local storage errors
  }
};

export const memoryService = {
  /**
   * Fetch all architectural decision records / memories for a repository.
   */
  async getMemories(repositoryId, params = {}) {
    if (config.isMockMode) {
      await new Promise((resolve) => setTimeout(resolve, 150));
      let memories = getStoredMemories();

      if (repositoryId) {
        memories = memories.filter((m) => m.repositoryId === repositoryId);
      }

      const { category, status, search } = params;

      if (category && category !== 'all') {
        memories = memories.filter((m) => m.category?.toLowerCase() === category.toLowerCase());
      }

      if (status && status !== 'all') {
        memories = memories.filter((m) => m.status?.toLowerCase() === status.toLowerCase());
      }

      if (search && search.trim()) {
        const query = search.toLowerCase().trim();
        memories = memories.filter(
          (m) =>
            m.title?.toLowerCase().includes(query) ||
            m.summary?.toLowerCase().includes(query) ||
            m.context?.toLowerCase().includes(query) ||
            m.decision?.toLowerCase().includes(query)
        );
      }

      return memories;
    }

    const response = await apiClient.get(`/repositories/${encodeURIComponent(repositoryId)}/memory`, {
      params,
    });
    return response.data?.data || [];
  },

  /**
   * Fetch single memory record by ID.
   */
  async getMemoryById(memoryId) {
    if (config.isMockMode) {
      const memories = getStoredMemories();
      const found = memories.find((m) => m.id === memoryId);
      if (!found) {
        throw new Error('Project memory record not found.');
      }
      return found;
    }

    const response = await apiClient.get(`/memory/${encodeURIComponent(memoryId)}`);
    return response.data?.data;
  },

  /**
   * Create a new architectural decision record / memory.
   */
  async createMemory(repositoryId, data) {
    if (!data.title?.trim()) {
      throw new Error('Title is required for an architectural decision record.');
    }
    if (!data.decision?.trim()) {
      throw new Error('Decision description is required.');
    }

    if (config.isMockMode) {
      await new Promise((resolve) => setTimeout(resolve, 200));
      const memories = getStoredMemories();

      const newRecord = {
        id: `mem_${Date.now()}`,
        repositoryId,
        title: data.title.trim(),
        category: data.category || 'Architecture',
        status: data.status || 'Accepted',
        author: data.author?.trim() || 'Engineering Team',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        summary: data.summary?.trim() || data.decision.trim().slice(0, 160),
        context: data.context?.trim() || 'Documented architectural context.',
        decision: data.decision.trim(),
        consequences: data.consequences?.trim() || 'No specific negative consequences noted.',
        affectedSymbols: Array.isArray(data.affectedSymbols) ? data.affectedSymbols : [],
      };

      const updated = [newRecord, ...memories];
      saveStoredMemories(updated);
      return newRecord;
    }

    const response = await apiClient.post(`/repositories/${encodeURIComponent(repositoryId)}/memory`, data);
    return response.data?.data;
  },

  /**
   * Update an existing memory record.
   */
  async updateMemory(memoryId, updates) {
    if (config.isMockMode) {
      await new Promise((resolve) => setTimeout(resolve, 150));
      const memories = getStoredMemories();
      const index = memories.findIndex((m) => m.id === memoryId);
      if (index === -1) {
        throw new Error('Memory record not found.');
      }

      memories[index] = {
        ...memories[index],
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      saveStoredMemories(memories);
      return memories[index];
    }

    const response = await apiClient.put(`/memory/${encodeURIComponent(memoryId)}`, updates);
    return response.data?.data;
  },

  /**
   * Delete a memory record.
   */
  async deleteMemory(memoryId) {
    if (config.isMockMode) {
      await new Promise((resolve) => setTimeout(resolve, 150));
      const memories = getStoredMemories();
      const filtered = memories.filter((m) => m.id !== memoryId);
      saveStoredMemories(filtered);
      return { success: true };
    }

    const response = await apiClient.delete(`/memory/${encodeURIComponent(memoryId)}`);
    return response.data?.data;
  },
};

export default memoryService;
