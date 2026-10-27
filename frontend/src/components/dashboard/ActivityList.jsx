import React from 'react';
import { Link } from 'react-router-dom';
import {
  GitPullRequest,
  ShieldAlert,
  ArrowRight,
  Clock,
  Sparkles,
} from 'lucide-react';
import { formatRelativeTime } from '../../utils/formatters';
import RiskBadge from '../analysis/RiskBadge';

export const ActivityList = ({ activities = [], className = '' }) => {
  if (!activities || activities.length === 0) {
    return (
      <div className="p-6 text-center text-slate-400 text-xs rounded-xl bg-slate-900/50 border border-slate-800">
        No recent analysis activity.
      </div>
    );
  }

  return (
    <div className={`space-y-2.5 ${className}`}>
      {activities.map((item) => (
        <div
          key={item.id}
          className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors flex items-center justify-between gap-3"
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-slate-400 truncate">
                {item.repositoryName}
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-xs font-semibold text-slate-200 truncate">
                PR #{item.pullRequestNumber} {item.pullRequestTitle}
              </span>
            </div>

            <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono mt-1">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-500" />
                {formatRelativeTime(item.createdAt)}
              </span>
              <span>•</span>
              <span className="text-slate-300">
                {item.changedFilesCount} changed, {item.affectedFilesCount} affected
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <RiskBadge level={item.riskLevel} size="sm" />
            <Link
              to={`/analysis/${item.id}`}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              title="Open Impact Report"
            >
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ActivityList;
