import React, { useState } from 'react';
import {
  FileCode,
  Sparkles,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  ExternalLink,
  Layers,
  Clock,
  Tag,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatRelativeTime } from '../../utils/formatters';

export const QuestionAnswerCard = ({ item, repositoryId }) => {
  const [expandedCitation, setExpandedCitation] = useState(0); // expand first citation by default
  const [copiedSnippetIndex, setCopiedSnippetIndex] = useState(null);

  const handleCopy = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippetIndex(index);
    setTimeout(() => setCopiedSnippetIndex(null), 2000);
  };

  return (
    <div className="p-5 sm:p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-4 hover:border-slate-700/80 transition-all shadow-sm">
      {/* Header: Question & Metadata */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div className="space-y-1.5 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-brand-500/15 text-brand-300 border border-brand-500/30 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-brand-400" />
              <span>{item.category || 'Codebase Q&A'}</span>
            </span>

            {item.confidenceScore && (
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                <span>{Math.round(item.confidenceScore * 100)}% Verified Confidence</span>
              </span>
            )}
          </div>

          <h3 className="text-base sm:text-lg font-semibold text-white tracking-tight">
            {item.question}
          </h3>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono shrink-0">
          <Clock className="w-3.5 h-3.5" />
          <span>{formatRelativeTime(item.createdAt)}</span>
        </div>
      </div>

      {/* Answer Body */}
      <div className="text-sm text-slate-300 leading-relaxed font-sans bg-slate-950/40 p-4 rounded-lg border border-slate-800/60">
        <p className="whitespace-pre-line">{item.answer}</p>
      </div>

      {/* Source Code Citations */}
      {item.sourceCitations && item.sourceCitations.length > 0 && (
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <FileCode className="w-3.5 h-3.5 text-brand-400" />
              <span>Source Citations & AST References ({item.sourceCitations.length})</span>
            </span>
          </div>

          <div className="space-y-2">
            {item.sourceCitations.map((citation, idx) => {
              const isExpanded = expandedCitation === idx;
              return (
                <div
                  key={`${citation.filePath}-${idx}`}
                  className="rounded-lg border border-slate-800 bg-slate-950/80 overflow-hidden"
                >
                  {/* Citation Header */}
                  <div
                    onClick={() => setExpandedCitation(isExpanded ? null : idx)}
                    className="p-3 flex items-center justify-between cursor-pointer hover:bg-slate-900/60 transition-colors select-none text-xs"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="font-mono text-brand-300 font-medium truncate">
                        {citation.filePath}
                      </span>
                      {citation.lineRange && (
                        <span className="text-slate-400 font-mono text-[11px] px-1.5 py-0.2 rounded bg-slate-800 border border-slate-700">
                          {citation.lineRange}
                        </span>
                      )}
                      {citation.symbolName && (
                        <span className="hidden sm:inline text-slate-400 text-[11px]">
                          • <code className="text-amber-300">{citation.symbolName}</code>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopy(citation.codeSnippet, idx);
                        }}
                        className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
                        title="Copy code snippet"
                      >
                        {copiedSnippetIndex === idx ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>

                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Code Snippet */}
                  {isExpanded && (
                    <div className="p-3 border-t border-slate-800/80 bg-slate-950">
                      <pre className="text-xs font-mono text-slate-300 overflow-x-auto p-3 rounded bg-slate-900/90 border border-slate-800/80 leading-5">
                        <code>{citation.codeSnippet}</code>
                      </pre>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Footer: Jump to Visual Mind Map */}
      {item.relatedNodes && item.relatedNodes.length > 0 && repositoryId && (
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/80 text-xs">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Layers className="w-3.5 h-3.5 text-brand-400" />
            <span>Connected Map Nodes:</span>
            <div className="flex flex-wrap gap-1">
              {item.relatedNodes.map((node) => (
                <span
                  key={node}
                  className="px-2 py-0.5 rounded font-mono text-[10px] bg-slate-800 text-slate-300 border border-slate-700"
                >
                  {node.split('/').pop()}
                </span>
              ))}
            </div>
          </div>

          <Link
            to={`/repositories/${repositoryId}?node=${encodeURIComponent(item.relatedNodes[0])}`}
            className="inline-flex items-center gap-1 text-brand-400 hover:text-brand-300 font-medium transition-colors"
          >
            <span>Inspect in Codebase Map</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      )}
    </div>
  );
};

export default QuestionAnswerCard;
