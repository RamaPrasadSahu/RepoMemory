import { useState, useEffect, useCallback } from 'react';
import repositoryService from '../services/repositoryService';

export const useRepositories = () => {
  const [repositories, setRepositories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRepositories = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await repositoryService.getRepositories();
      setRepositories(Array.isArray(data) ? data : data.items || []);
    } catch (err) {
      setError(err.message || 'Failed to load repositories');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRepositories();
  }, [fetchRepositories]);

  const connectRepo = async (repoData) => {
    try {
      const newRepo = await repositoryService.connectRepository(repoData);
      setRepositories((prev) => [newRepo, ...prev]);
      return newRepo;
    } catch (err) {
      throw err;
    }
  };

  const disconnectRepo = async (repoId) => {
    try {
      await repositoryService.disconnectRepository(repoId);
      setRepositories((prev) => prev.filter((r) => r.id !== repoId));
    } catch (err) {
      throw err;
    }
  };

  return {
    repositories,
    isLoading,
    error,
    refresh: fetchRepositories,
    connectRepo,
    disconnectRepo,
  };
};

export default useRepositories;
