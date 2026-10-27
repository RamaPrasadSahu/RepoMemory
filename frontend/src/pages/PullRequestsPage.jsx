import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GitPullRequest,
  Search,
  Filter,
  Plus,
  Play,
  Sparkles,
} from 'lucide-react';
import pullRequestService from '../services/pullRequestService';
import repositoryService from '../services/repositoryService';
import analysisService from '../services/analysisService';
import PullRequestCard from '../components/dashboard/PullRequestCard';
import Button from '../components/common/Button';
import SearchInput from '../components/common/SearchInput';
import Modal from '../components/common/Modal';
import LoadingState from '../components/common/LoadingState';
import ErrorState from '../components/common/ErrorState';
import EmptyState from '../components/common/EmptyState';

export const PullRequestsPage = () => {
  const navigate = useNavigate();

  const [pullRequests, setPullRequests] = useState([]);
  const [repositories, setRepositories] = useState([]);
  const [selectedRepoFilter, setSelectedRepoFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // New Analysis Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [targetPr, setTargetPr] = useState(null);
  const [baseBranch, setBaseBranch] = useState('main');
  const [headBranch, setHeadBranch] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [prs, repos] = await Promise.all([
        pullRequestService.getPullRequests(),
        repositoryService.getRepositories(),
      ]);
      setPullRequests(Array.isArray(prs) ? prs : prs.items || []);
      setRepositories(Array.isArray(repos) ? repos : repos.items || []);
    } catch (err) {
      setError(err.message || 'Failed to load pull requests.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredPrs = pullRequests.filter((pr) => {
    const query = search.toLowerCase();
    const matchesSearch =
      !query ||
      pr.title.toLowerCase().includes(query) ||
      String(pr.number).includes(query) ||
      pr.repositoryName.toLowerCase().includes(query);

    const matchesRepo =
      selectedRepoFilter === 'all' ||
      pr.repositoryId === selectedRepoFilter ||
      pr.repositoryName === selectedRepoFilter;

    const matchesStatus =
      statusFilter === 'all' || pr.status === statusFilter;

    return matchesSearch && matchesRepo && matchesStatus;
  });

  const handleStartAnalysis = (pr) => {
    setTargetPr(pr);
    setBaseBranch(pr.targetBranch || 'main');
    setHeadBranch(pr.sourceBranch || '');
    setIsModalOpen(true);
  };

  const handleRunAnalysisSubmit = async (e) => {
    e.preventDefault();
    if (!targetPr) return;

    setIsAnalyzing(true);
    try {
      const res = await analysisService.startAnalysis(targetPr.id, {
        baseBranch,
        headBranch,
      });
      setIsModalOpen(false);
      navigate(`/analysis/${res.id || 'analysis_101'}`);
    } catch (err) {
      alert(err.message || 'Failed to start analysis.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (isLoading) {
    return <LoadingState message="Loading pull requests..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadData} />;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>Pull Request Impact Queue</span>
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Select a pull request to calculate change impact, downstream ripple, and test recommendations.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 p-3 bg-slate-900 border border-slate-800 rounded-xl">
        <SearchInput
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by title, PR #, or repository..."
          className="w-full lg:w-80"
        />

        <div className="flex flex-wrap items-center gap-3 text-xs">
          {/* Repo selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Repo:</span>
            <select
              value={selectedRepoFilter}
              onChange={(e) => setSelectedRepoFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-brand-500"
            >
              <option value="all">All Repositories</option>
              {repositories.map((repo) => (
                <option key={repo.id} value={repo.id}>
                  {repo.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-brand-500 capitalize"
            >
              <option value="all">All Statuses</option>
              <option value="open">Open</option>
              <option value="merged">Merged</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>
      </div>

      {/* PR Cards Grid */}
      {filteredPrs.length === 0 ? (
        <EmptyState
          icon={GitPullRequest}
          title="No Pull Requests Found"
          description="No pull requests match your active search and filter settings."
          actionLabel="Reset Filters"
          onAction={() => {
            setSearch('');
            setSelectedRepoFilter('all');
            setStatusFilter('all');
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPrs.map((pr) => (
            <PullRequestCard
              key={pr.id}
              pullRequest={pr}
              onAnalyze={handleStartAnalysis}
            />
          ))}
        </div>
      )}

      {/* Start Analysis Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Trigger Impact Analysis: PR #${targetPr?.number}`}
        description={`Configure branches to compute change impact for ${targetPr?.repositoryName}.`}
        footer={
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsModalOpen(false)}
              disabled={isAnalyzing}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleRunAnalysisSubmit}
              isLoading={isAnalyzing}
              leftIcon={<Sparkles className="w-4 h-4 text-amber-400" />}
            >
              Run AST Analysis
            </Button>
          </>
        }
      >
        <form onSubmit={handleRunAnalysisSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Pull Request
            </label>
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 font-medium">
              #{targetPr?.number} {targetPr?.title}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Head (Feature) Branch
              </label>
              <input
                type="text"
                value={headBranch}
                onChange={(e) => setHeadBranch(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700/80 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Base (Target) Branch
              </label>
              <input
                type="text"
                value={baseBranch}
                onChange={(e) => setBaseBranch(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700/80 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed">
            The impact engine will parse all changed JavaScript/TypeScript files between these two branches, detect modified AST exports, and trace downstream consumers.
          </p>
        </form>
      </Modal>
    </div>
  );
};

export default PullRequestsPage;
