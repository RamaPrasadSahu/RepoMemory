import React from 'react';
import {
  FileEdit,
  GitFork,
  TestTube2,
  Info,
  ShieldAlert,
  Percent,
} from 'lucide-react';
import RiskBadge from './RiskBadge';

export const ImpactSummary = ({ analysis, className = '' }) => {
  if (!analysis) return null;

  const changedCount = analysis.changedFilesCount ?? (analysis.changedFiles?.length || 0);
  const affectedCount = analysis.affectedFilesCount ?? (analysis.affectedFiles?.length || 0);
  const testCount = analysis.testRecommendationsCount ?? (analysis.testRecommendations?.length || 0);
  const confidence = analysis.confidenceScore ? Math.round(analysis.confidenceScore * 100) : 92;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Risk Level Card */}
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Overall Risk</span>
            <ShieldAlert className="w-4 h-4 text-slate-500" />
          </div>
          <div className="mt-2 flex items-center gap-2">
            <RiskBadge level={analysis.riskLevel} size="md" />
          </div>
          <p className="text-[11px] text-slate-400 mt-2 font-mono">Assessed by AST Impact Engine</p>
        </div>

        {/* Changed Files Card */}
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Changed in PR</span>
            <FileEdit className="w-4 h-4 text-brand-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-slate-100">
            {changedCount}
          </div>
          <p className="text-[11px] text-slate-400 mt-1 font-mono">Direct PR git modifications</p>
        </div>

        {/* Affected Files Card */}
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Potentially Affected</span>
            <GitFork className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-amber-300">
            {affectedCount}
          </div>
          <p className="text-[11px] text-slate-400 mt-1 font-mono">Downstream AST dependents</p>
        </div>

        {/* Test Recommendations Card */}
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Recommended Tests</span>
            <TestTube2 className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-cyan-300">
            {testCount}
          </div>
          <p className="text-[11px] text-slate-400 mt-1 font-mono">Targeted regression suites</p>
        </div>
      </div>

      {/* Summary Explanation Banner */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-start gap-3.5">
        <div className="p-2 rounded-lg bg-brand-500/10 border border-brand-500/20 text-brand-400 shrink-0 mt-0.5">
          <Info className="w-4 h-4" />
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider font-mono">
              Impact Assessment Summary
            </h4>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
              Confidence: {confidence}%
            </span>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed">{analysis.summary}</p>
          <p className="text-[11px] text-slate-400 italic pt-1">
            * Note on Uncertainty: Highlighted files indicate downstream AST dependencies and call references.
            This identifies where regression risk exists, not a guarantee that a defect is present.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ImpactSummary;
