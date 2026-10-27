import { useState, useEffect, useCallback } from 'react';
import analysisService from '../services/analysisService';

export const useAnalysis = (analysisId) => {
  const [analysis, setAnalysis] = useState(null);
  const [graph, setGraph] = useState({ nodes: [], edges: [] });
  const [affectedFiles, setAffectedFiles] = useState([]);
  const [testRecommendations, setTestRecommendations] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isReanalyzing, setIsReanalyzing] = useState(false);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    if (!analysisId) return;
    setIsLoading(true);
    setError(null);

    try {
      const [analysisData, graphData, affectedData, testData] = await Promise.all([
        analysisService.getAnalysisById(analysisId),
        analysisService.getAnalysisGraph(analysisId),
        analysisService.getAffectedFiles(analysisId),
        analysisService.getTestRecommendations(analysisId),
      ]);

      setAnalysis(analysisData);
      setGraph(graphData || { nodes: [], edges: [] });
      setAffectedFiles(affectedData || []);
      setTestRecommendations(testData || []);

      // Default select the first changed file if available
      if (analysisData?.changedFiles?.length > 0) {
        const firstChanged = analysisData.changedFiles[0];
        const matchInGraph = graphData?.nodes?.find((n) => n.id === firstChanged.path || n.path === firstChanged.path);
        setSelectedNode(matchInGraph || firstChanged);
      }
    } catch (err) {
      setError(err.message || 'Failed to load impact analysis details.');
    } finally {
      setIsLoading(false);
    }
  }, [analysisId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const rerunAnalysis = async () => {
    if (!analysis) return;
    setIsReanalyzing(true);
    try {
      const refreshed = await analysisService.startAnalysis(analysis.pullRequestId, {
        baseBranch: analysis.targetBranch,
        headBranch: analysis.sourceBranch,
      });
      setAnalysis(refreshed);
      await loadData();
    } catch (err) {
      setError(err.message || 'Re-run analysis failed.');
    } finally {
      setIsReanalyzing(false);
    }
  };

  return {
    analysis,
    graph,
    affectedFiles,
    testRecommendations,
    selectedNode,
    setSelectedNode,
    isLoading,
    isReanalyzing,
    error,
    refresh: loadData,
    rerunAnalysis,
  };
};

export default useAnalysis;
