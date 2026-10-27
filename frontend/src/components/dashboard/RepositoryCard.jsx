import React from 'react';
import { Link } from 'react-router-dom';
import {
  FolderGit2,
  GitBranch,
  Star,
  GitFork,
  Clock,
  ArrowRight,
  GitPullRequest,
} from 'lucide-react';
import { formatRelativeTime } from '../../utils/formatters';

export const RepositoryCard = ({ repository, onDisconnect }) => {
  if (!repository) return null;

  return (
    <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700/80 transition-all flex flex-col justify-between group">
      <div>
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700/60 flex items-center justify-center text-brand-400 shrink-0 group-hover:scale-105 transition-transform">
              <FolderGit2 className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <Link
                to={`/repositories/${repository.id}`}
                className="font-semibold text-sm text-slate-100 hover:text-brand-300 truncate block transition-colors"
              >
                {repository.name}
              </Link>
              <div className="text-[11px] text-slate-400 font-mono truncate">
                {repository.fullName}
              </div>
            </div>
          </div>

          <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shrink-0">
            {repository.connectionStatus || 'connected'}
          </span>
        </div>

        {/* Description */}
        <p className="text-xs text-slate-400 line-clamp-2 my-3 leading-relaxed">
          {repository.description || 'No description provided.'}
        </p>
      </div>

      <div>
        {/* Metadata stats */}
        <div className="flex flex-wrap items-center gap-3 py-2.5 border-t border-slate-800/80 text-xs text-slate-400 font-mono">
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-brand-400" />
            <span className="text-slate-300">{repository.primaryLanguage || 'JavaScript'}</span>
          </div>

          <div className="flex items-center gap-1">
            <GitBranch className="w-3.5 h-3.5 text-slate-500" />
            <span>{repository.defaultBranch || 'main'}</span>
          </div>

          <div className="flex items-center gap-1">
            <GitPullRequest className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-amber-300">{repository.openPrsCount || 0} PRs</span>
          </div>
        </div>

        {/* Action Footer */}
        <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex items-center justify-between">
          <div className="flex items-center gap-1 text-[11px] text-slate-400">
            <Clock className="w-3 h-3 text-slate-500" />
            <span>Analyzed {formatRelativeTime(repository.lastAnalyzedAt)}</span>
          </div>

          <Link
            to={`/repositories/${repository.id}`}
            className="inline-flex items-center gap-1 text-xs font-medium text-brand-400 hover:text-brand-300 transition-colors"
          >
            <span>View Graph</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RepositoryCard;
