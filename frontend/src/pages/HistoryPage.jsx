import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  History,
  Search,
  Filter,
  ArrowRight,
  Clock,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import historyService from '../services/historyService';
import repositoryService from '../services/repositoryService';
import RiskBadge from '../components/analysis/RiskBadge';
import SearchInput from '../components/common/SearchInput';
import Button from '../components/common/Button';
import LoadingState from '../components/common/LoadingState';
import ErrorState from '../components/common/ErrorState';
import EmptyState from '../components/common/EmptyState';
import { formatDate, formatRelativeTime } from '../utils/formatters';

export const HistoryPage = () => {
  const [records, setRecords] = useState([]);
  const [repositories, setRepositories] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 8, total: 0, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('all');
  const [repoFilter, setRepoFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadHistory = async (page = 1) => {
    setIsLoading(true);
    setError(null);
    try {
      const [historyData, reposData] = await Promise.all([
        historyService.getAnalysisHistory({
          page,
          limit: 8,
          search,
          risk: riskFilter,
          repositoryId: repoFilter,
        }),
        repositoryService.getRepositories(),
      ]);

      setRecords(historyData?.items || []);
      if (historyData?.pagination) {
        setPagination(historyData.pagination);
      }
      setRepositories(Array.isArray(reposData) ? reposData : reposData.items || []);
    } catch (err) {
      setError(err.message || 'Failed to load analysis history.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHistory(1);
  }, [search, riskFilter, repoFilter]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <span>Analysis History & Audit Trail</span>
        </h1>
        <p className="mt-1 text-xs text-slate-400">
          Revisit previous pull request impact analyses, risk assessments, and test recommendations.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 p-3 bg-slate-900 border border-slate-800 rounded-xl">
        <SearchInput
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by pull request, title, or repository..."
          className="w-full lg:w-80"
        />

        <div className="flex flex-wrap items-center gap-3 text-xs">
          {/* Repo selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Repository:</span>
            <select
              value={repoFilter}
              onChange={(e) => setRepoFilter(e.target.value)}
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

          {/* Risk selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Risk Level:</span>
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-brand-500 capitalize"
            >
              <option value="all">All Risk Levels</option>
              <option value="high">High Risk</option>
              <option value="medium">Medium Risk</option>
              <option value="low">Low Risk</option>
            </select>
          </div>
        </div>
      </div>

      {/* History Table */}
      {isLoading ? (
        <LoadingState message="Loading historical analyses..." />
      ) : error ? (
        <ErrorState message={error} onRetry={() => loadHistory(pagination.page)} />
      ) : records.length === 0 ? (
        <EmptyState
          icon={History}
          title="No Historical Analyses Found"
          description="No previous analysis runs match your search or filter criteria."
          actionLabel="Reset Filters"
          onAction={() => {
            setSearch('');
            setRiskFilter('all');
            setRepoFilter('all');
          }}
        />
      ) : (
        <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-mono uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Repository & Pull Request</th>
                  <th className="px-5 py-3.5">Branch Comparison</th>
                  <th className="px-5 py-3.5">Risk Level</th>
                  <th className="px-5 py-3.5">Impact Scope</th>
                  <th className="px-5 py-3.5">Analyzed At</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {records.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-800/40 transition-colors group"
                  >
                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-100 flex items-center gap-1.5">
                        <span className="text-slate-400 font-mono">#{item.pullRequestNumber}</span>
                        <span>{item.pullRequestTitle}</span>
                      </div>
                      <div className="font-mono text-[11px] text-slate-400 mt-0.5">
                        {item.repositoryName}
                      </div>
                    </td>

                    <td className="px-5 py-4 font-mono text-[11px]">
                      <div className="flex items-center gap-1 text-slate-300">
                        <span className="text-brand-300">{item.sourceBranch}</span>
                        <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="text-slate-400">{item.targetBranch}</span>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <RiskBadge level={item.riskLevel} size="sm" />
                    </td>

                    <td className="px-5 py-4 font-mono text-xs">
                      <div className="text-slate-200">
                        <span className="font-bold text-brand-300">{item.changedFilesCount}</span> changed,{' '}
                        <span className="font-bold text-amber-300">{item.affectedFilesCount}</span> affected
                      </div>
                      <div className="text-[10px] text-cyan-400 mt-0.5">
                        {item.testRecommendationsCount} recommended tests
                      </div>
                    </td>

                    <td className="px-5 py-4 font-mono text-[11px] text-slate-400">
                      <div>{formatDate(item.createdAt)}</div>
                      <div className="text-[10px] text-slate-400">
                        {formatRelativeTime(item.createdAt)}
                      </div>
                    </td>

                    <td className="px-5 py-4 text-right">
                      <Link
                        to={`/analysis/${item.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-brand-600 text-slate-200 hover:text-white transition-all text-xs font-medium"
                      >
                        <span>View Report</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {pagination.totalPages > 1 && (
            <div className="px-5 py-3 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <div>
                Showing page <span className="font-bold text-slate-200">{pagination.page}</span> of{' '}
                <span className="font-bold text-slate-200">{pagination.totalPages}</span> ({pagination.total} total runs)
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="xs"
                  disabled={pagination.page <= 1}
                  onClick={() => loadHistory(pagination.page - 1)}
                  leftIcon={<ChevronLeft className="w-3 h-3" />}
                >
                  Previous
                </Button>
                <Button
                  variant="secondary"
                  size="xs"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => loadHistory(pagination.page + 1)}
                  rightIcon={<ChevronRight className="w-3 h-3" />}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default HistoryPage;
