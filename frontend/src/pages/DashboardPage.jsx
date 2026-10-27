import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FolderGit2,
  GitPullRequest,
  ShieldAlert,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Activity,
  Layers,
  Plus,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import repositoryService from '../services/repositoryService';
import pullRequestService from '../services/pullRequestService';
import historyService from '../services/historyService';
import RepositoryCard from '../components/dashboard/RepositoryCard';
import PullRequestCard from '../components/dashboard/PullRequestCard';
import ActivityList from '../components/dashboard/ActivityList';
import Button from '../components/common/Button';
import LoadingState from '../components/common/LoadingState';
import ErrorState from '../components/common/ErrorState';

export const DashboardPage = () => {
  const [repositories, setRepositories] = useState([]);
  const [pullRequests, setPullRequests] = useState([]);
  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadDashboardData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [reposData, prsData, historyData] = await Promise.all([
        repositoryService.getRepositories(),
        pullRequestService.getPullRequests(),
        historyService.getAnalysisHistory({ limit: 6 }),
      ]);

      setRepositories(Array.isArray(reposData) ? reposData : reposData.items || []);
      setPullRequests(Array.isArray(prsData) ? prsData : prsData.items || []);
      setActivities(historyData?.items || []);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  if (isLoading) {
    return <LoadingState message="Loading engineering workspace..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadDashboardData} />;
  }

  // Trend Chart Data (Impact Analyses over recent timeline)
  const chartData = [
    { name: 'Mon', analyses: 2, highRisk: 1 },
    { name: 'Tue', analyses: 4, highRisk: 1 },
    { name: 'Wed', analyses: 3, highRisk: 0 },
    { name: 'Thu', analyses: 6, highRisk: 2 },
    { name: 'Fri', analyses: 5, highRisk: 3 },
    { name: 'Sat', analyses: 4, highRisk: 2 },
    { name: 'Sun', analyses: 5, highRisk: 2 },
  ];

  const highRiskCount = pullRequests.filter((pr) => pr.riskLevel === 'high').length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>Workspace Overview</span>
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Real-time change impact monitoring across connected codebases.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link to="/repositories">
            <Button variant="secondary" size="sm" leftIcon={<FolderGit2 className="w-3.5 h-3.5" />}>
              Repositories
            </Button>
          </Link>
          <Link to="/analysis/analysis_101">
            <Button variant="primary" size="sm" leftIcon={<Sparkles className="w-3.5 h-3.5 text-amber-400" />}>
              Live PR Analysis
            </Button>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Connected Repositories</span>
            <FolderGit2 className="w-4 h-4 text-brand-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-slate-100">
            {repositories.length}
          </div>
          <p className="text-[11px] text-slate-400 mt-1 font-mono">JS / TS projects</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Open Pull Requests</span>
            <GitPullRequest className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-cyan-300">
            {pullRequests.length}
          </div>
          <p className="text-[11px] text-slate-400 mt-1 font-mono">Active review queue</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Completed Analyses</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-emerald-300">
            {activities.length}
          </div>
          <p className="text-[11px] text-slate-400 mt-1 font-mono">AST reports stored</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>High-Risk Flags</span>
            <ShieldAlert className="w-4 h-4 text-red-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-red-400">
            {highRiskCount}
          </div>
          <p className="text-[11px] text-slate-400 mt-1 font-mono">Breaking changes possible</p>
        </div>
      </div>

      {/* Main Grid: Trend Chart & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Column (2 spans) */}
        <div className="lg:col-span-2 p-5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-brand-400" />
                <span>Impact Analysis Velocity</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Evaluated pull requests and detected high-risk regressions
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-brand-500" />
                <span>Analyses</span>
              </span>
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                <span>High Risk</span>
              </span>
            </div>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAnalyses" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorHighRisk" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="analyses"
                  stroke="#818cf8"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorAnalyses)"
                />
                <Area
                  type="monotone"
                  dataKey="highRisk"
                  stroke="#ef4444"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorHighRisk)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Analysis Timeline (1 span) */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                <span>Recent Analyses</span>
              </h2>
              <Link
                to="/history"
                className="text-xs text-brand-400 hover:text-brand-300 font-medium"
              >
                View all
              </Link>
            </div>
            <ActivityList activities={activities.slice(0, 4)} />
          </div>
        </div>
      </div>

      {/* Featured Repositories Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-100">Connected Repositories</h2>
            <p className="text-xs text-slate-400">Repositories monitored for dependency impact</p>
          </div>
          <Link
            to="/repositories"
            className="text-xs text-brand-400 hover:text-brand-300 font-medium flex items-center gap-1"
          >
            <span>All repositories</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {repositories.slice(0, 3).map((repo) => (
            <RepositoryCard key={repo.id} repository={repo} />
          ))}
        </div>
      </div>

      {/* Open Pull Requests Awaiting Review Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-100">Pull Requests Awaiting Review</h2>
            <p className="text-xs text-slate-400">Evaluate change impact before merging</p>
          </div>
          <Link
            to="/pull-requests"
            className="text-xs text-brand-400 hover:text-brand-300 font-medium flex items-center gap-1"
          >
            <span>All pull requests</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pullRequests.slice(0, 3).map((pr) => (
            <PullRequestCard key={pr.id} pullRequest={pr} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
