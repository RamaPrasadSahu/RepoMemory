import React, { useState } from 'react';
import {
  TestTube2,
  Copy,
  Check,
  AlertCircle,
  FileCode2,
  Terminal,
} from 'lucide-react';
import EmptyState from '../common/EmptyState';

export const TestRecommendations = ({ recommendations = [], className = '' }) => {
  const [copiedId, setCopiedId] = useState(null);

  const handleCopy = (command, id) => {
    if (!command) return;
    navigator.clipboard.writeText(command);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getPriorityBadge = (priority) => {
    const norm = (priority || 'medium').toLowerCase();
    switch (norm) {
      case 'critical':
        return 'bg-red-500/15 text-red-300 border-red-500/40 font-bold';
      case 'high':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/40';
      case 'medium':
        return 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  if (!recommendations || recommendations.length === 0) {
    return (
      <EmptyState
        icon={TestTube2}
        title="No Test Recommendations Found"
        description="The analysis found no automated test suites covering the modified AST paths."
      />
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between text-xs text-slate-400 px-1">
        <span>Recommended verification commands</span>
        <span className="font-mono text-[11px] text-cyan-400">
          {recommendations.length} suites identified
        </span>
      </div>

      <div className="space-y-3">
        {recommendations.map((rec) => {
          const isCopied = copiedId === rec.id;
          return (
            <div
              key={rec.id}
              className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <h4 className="text-xs font-semibold text-slate-100 flex items-center gap-2">
                    <TestTube2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span>{rec.name}</span>
                  </h4>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">{rec.reason}</p>
                </div>

                {rec.priority && (
                  <span
                    className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded border shrink-0 ${getPriorityBadge(
                      rec.priority
                    )}`}
                  >
                    {rec.priority}
                  </span>
                )}
              </div>

              {/* Terminal Command Box */}
              {rec.command && (
                <div className="mt-3 flex items-center justify-between gap-2 p-2.5 rounded-lg bg-slate-950 border border-slate-800/90 font-mono text-xs text-cyan-300 select-all group">
                  <div className="flex items-center gap-2 min-w-0 overflow-x-auto">
                    <Terminal className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="truncate">{rec.command}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(rec.command, rec.id)}
                    title="Copy command to clipboard"
                    className="p-1.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors shrink-0 flex items-center gap-1 text-[11px]"
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-400" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Related files tags */}
              {rec.relatedFiles && rec.relatedFiles.length > 0 && (
                <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] text-slate-400 font-mono">Related modules:</span>
                  {rec.relatedFiles.map((file) => (
                    <span
                      key={file}
                      className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800 truncate max-w-[200px]"
                      title={file}
                    >
                      {file.split('/').pop()}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TestRecommendations;
