import React, { useState } from 'react';
import {
  Brain,
  Clock,
  User,
  Layers,
  ChevronDown,
  ChevronUp,
  Tag,
  CheckCircle2,
  AlertCircle,
  FileCode,
  ExternalLink,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatRelativeTime } from '../../utils/formatters';

const getStatusBadge = (status) => {
  const norm = (status || 'Accepted').toLowerCase();
  switch (norm) {
    case 'accepted':
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    case 'proposed':
      return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    case 'deprecated':
      return 'bg-red-500/10 text-red-400 border-red-500/30';
    case 'superseded':
    default:
      return 'bg-slate-800 text-slate-400 border-slate-700';
  }
};

const getCategoryColor = (category) => {
  const norm = (category || 'Architecture').toLowerCase();
  switch (norm) {
    case 'security':
      return 'text-red-400 bg-red-500/10 border-red-500/30';
    case 'performance':
      return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30';
    case 'integration':
      return 'text-purple-400 bg-purple-500/10 border-purple-500/30';
    case 'architecture':
    default:
      return 'text-brand-300 bg-brand-500/15 border-brand-500/30';
  }
};

export const MemoryCard = ({ memory, repositoryId, onDelete }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="p-5 sm:p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-4 hover:border-slate-700/80 transition-all shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div className="space-y-1.5 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider border flex items-center gap-1 ${getCategoryColor(
                memory.category
              )}`}
            >
              <Tag className="w-3 h-3" />
              <span>{memory.category || 'Architecture'}</span>
            </span>

            <span
              className={`px-2 py-0.5 rounded text-[10px] font-mono border uppercase tracking-wider ${getStatusBadge(
                memory.status
              )}`}
            >
              {memory.status || 'Accepted'}
            </span>
          </div>

          <h3 className="text-base font-bold text-white tracking-tight">
            {memory.title}
          </h3>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-400 font-mono shrink-0">
          <span className="flex items-center gap-1">
            <User className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-300">{memory.author || 'Team'}</span>
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{formatRelativeTime(memory.createdAt)}</span>
          </span>
        </div>
      </div>

      {/* Summary */}
      <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
        {memory.summary}
      </p>

      {/* Expandable Architectural Details: Context, Decision, Consequences */}
      {isExpanded && (
        <div className="pt-3 border-t border-slate-800/80 space-y-4 text-xs font-sans">
          {/* Context */}
          {memory.context && (
            <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800/80 space-y-1">
              <span className="font-semibold text-slate-400 uppercase tracking-wider text-[10px] flex items-center gap-1">
                <AlertCircle className="w-3 h-3 text-amber-400" />
                <span>Context & Problem Statement</span>
              </span>
              <p className="text-slate-300 leading-relaxed">{memory.context}</p>
            </div>
          )}

          {/* Decision */}
          {memory.decision && (
            <div className="p-3.5 rounded-lg bg-brand-950/20 border border-brand-500/20 space-y-1">
              <span className="font-semibold text-brand-300 uppercase tracking-wider text-[10px] flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-brand-400" />
                <span>Decision & Architectural Rationale</span>
              </span>
              <p className="text-slate-200 leading-relaxed">{memory.decision}</p>
            </div>
          )}

          {/* Consequences */}
          {memory.consequences && (
            <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800/80 space-y-1">
              <span className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">
                Consequences & Trade-offs
              </span>
              <p className="text-slate-300 leading-relaxed">{memory.consequences}</p>
            </div>
          )}

          {/* Affected Symbols */}
          {memory.affectedSymbols && memory.affectedSymbols.length > 0 && (
            <div className="space-y-2 pt-1">
              <span className="font-semibold text-slate-400 uppercase tracking-wider text-[10px] flex items-center gap-1">
                <FileCode className="w-3 h-3 text-brand-400" />
                <span>Associated Files & Symbols ({memory.affectedSymbols.length})</span>
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {memory.affectedSymbols.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded bg-slate-950 border border-slate-800 flex items-center justify-between text-[11px]"
                  >
                    <div className="truncate">
                      <span className="font-mono text-brand-300 truncate">{item.path}</span>
                      {item.symbol && (
                        <span className="text-slate-400 font-mono block text-[10px]">
                          {item.symbol}
                        </span>
                      )}
                    </div>
                    {repositoryId && (
                      <Link
                        to={`/repositories/${repositoryId}?node=${encodeURIComponent(item.path)}`}
                        className="text-slate-400 hover:text-brand-300 p-1 transition-colors"
                        title="View on Map"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Expand / Collapse toggle & delete */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="inline-flex items-center gap-1 text-brand-400 hover:text-brand-300 font-medium transition-colors"
        >
          <span>{isExpanded ? 'Hide Architecture Details' : 'View Context & Rationale'}</span>
          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {onDelete && (
          <button
            type="button"
            onClick={() => onDelete(memory.id)}
            className="text-[11px] text-slate-500 hover:text-red-400 transition-colors"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
};

export default MemoryCard;
