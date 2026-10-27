import React from 'react';
import { Link } from 'react-router-dom';
import {
  GitPullRequest,
  GitBranch,
  ArrowRight,
  Clock,
  Sparkles,
  Play,
} from 'lucide-react';
import { formatRelativeTime } from '../../utils/formatters';
import RiskBadge from '../analysis/RiskBadge';

export const PullRequestCard = ({ pullRequest, onAnalyze }) => {
  if (!pullRequest) return null;

  const hasAnalysis = !!pullRequest.analysisId;

  return (
    <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700/80 transition-all flex flex-col justify-between">
      <div>
        {/* Top: Repo name & Risk badge */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-[11px] font-mono text-slate-400 truncate">
            {pullRequest.repositoryName}
          </span>
          {hasAnalysis && pullRequest.riskLevel ? (
            <RiskBadge level={pullRequest.riskLevel} size="sm" />
          ) : (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
              Not Analyzed
            </span>
          )}
        </div>

        {/* PR Title & Number */}
        <h3 className="font-semibold text-sm text-slate-100 line-clamp-1 mb-1.5 hover:text-brand-300 transition-colors">
          <span className="text-slate-400 font-mono mr-1.5">#{pullRequest.number}</span>
          {pullRequest.title}
        </h3>

        {/* Branch flow */}
        <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400 my-2">
          <GitBranch className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span className="px-1.5 py-0.5 rounded bg-slate-950 text-brand-300 border border-slate-800 truncate max-w-[120px]">
            {pullRequest.sourceBranch}
          </span>
          <ArrowRight className="w-3 h-3 text-slate-600 shrink-0" />
          <span className="px-1.5 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800 truncate max-w-[80px]">
            {pullRequest.targetBranch}
          </span>
        </div>
      </div>

      {/* Footer: Author, timestamp & Action CTA */}
      <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          {pullRequest.author?.avatar && (
            <img
              src={pullRequest.author.avatar}
              alt={pullRequest.author.name}
              className="w-5 h-5 rounded-full object-cover border border-slate-700"
            />
          )}
          <span className="truncate max-w-[100px] text-slate-300 font-medium">
            {pullRequest.author?.username || 'developer'}
          </span>
          <span>•</span>
          <span className="text-[11px] text-slate-400">
            {formatRelativeTime(pullRequest.updatedAt)}
          </span>
        </div>

        {hasAnalysis ? (
          <Link
            to={`/analysis/${pullRequest.analysisId}`}
            className="inline-flex items-center gap-1 text-xs font-medium text-brand-400 hover:text-brand-300 bg-brand-500/10 hover:bg-brand-500/20 px-2.5 py-1 rounded-lg border border-brand-500/30 transition-colors"
          >
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>Impact Report</span>
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => onAnalyze && onAnalyze(pullRequest)}
            className="inline-flex items-center gap-1 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded-lg border border-slate-700 transition-colors"
          >
            <Play className="w-3 h-3 text-emerald-400" />
            <span>Analyze</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default PullRequestCard;
