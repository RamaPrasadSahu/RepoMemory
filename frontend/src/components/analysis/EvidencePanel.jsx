import React from 'react';
import {
  ShieldCheck,
  Sparkles,
  FileCode,
  ArrowRight,
  Code2,
  ExternalLink,
} from 'lucide-react';
import EmptyState from '../common/EmptyState';

export const EvidencePanel = ({ evidence = [], className = '' }) => {
  if (!evidence || evidence.length === 0) {
    return (
      <EmptyState
        icon={Code2}
        title="No Explicit Evidence Snippets"
        description="The parser did not generate discrete AST syntax snippets for this analysis."
      />
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between text-xs text-slate-400 px-1">
        <span>Supporting Code References & AST Call Traces</span>
        <span className="font-mono text-[11px] text-brand-400">
          {evidence.length} evidence records
        </span>
      </div>

      <div className="space-y-3.5">
        {evidence.map((item) => {
          const isAi = item.isAiGenerated;

          return (
            <div
              key={item.id}
              className={`p-4 rounded-xl border transition-colors ${
                isAi
                  ? 'bg-purple-950/15 border-purple-800/40'
                  : 'bg-slate-900 border-slate-800'
              }`}
            >
              {/* Header with Classification Badge */}
              <div className="flex items-start justify-between gap-3 mb-2">
                <h4 className="text-xs font-semibold text-slate-100 flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>{item.title}</span>
                </h4>

                <span
                  className={`text-[10px] font-mono uppercase tracking-wider font-semibold px-2 py-0.5 rounded border shrink-0 flex items-center gap-1 ${
                    isAi
                      ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  }`}
                >
                  {isAi ? (
                    <>
                      <Sparkles className="w-3 h-3 text-purple-300" />
                      <span>AI Semantic Inference</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-3 h-3 text-emerald-300" />
                      <span>Verified AST Parser</span>
                    </>
                  )}
                </span>
              </div>

              {/* Source -> Target link */}
              <div className="flex items-center gap-2 text-xs font-mono text-slate-300 my-2">
                <span className="text-brand-300 truncate">{item.sourceFile}</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="text-amber-300 truncate">{item.targetFile}</span>
              </div>

              {/* Description */}
              <p className="text-xs text-slate-300 leading-relaxed my-2">
                {item.description}
              </p>

              {/* Code Snippet Box */}
              {item.codeSnippet && (
                <div className="mt-3">
                  <div className="px-3 py-1 bg-slate-950/90 border-t border-x border-slate-800 rounded-t text-[10px] font-mono text-slate-400 flex items-center justify-between">
                    <span>Source Excerpt</span>
                    {item.confidence && (
                      <span>Confidence: {Math.round(item.confidence * 100)}%</span>
                    )}
                  </div>
                  <pre className="p-3 bg-slate-950 border border-slate-800 rounded-b text-xs font-mono text-slate-200 overflow-x-auto leading-relaxed">
                    <code>{item.codeSnippet}</code>
                  </pre>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default EvidencePanel;
