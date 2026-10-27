import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';

export const GraphLegend = ({ className = '' }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div
      className={`bg-slate-900/90 border border-slate-800 rounded-xl shadow-xl backdrop-blur-md text-xs select-none transition-all ${className}`}
    >
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-2.5 font-semibold text-slate-300 hover:text-white"
      >
        <div className="flex items-center gap-1.5 font-mono text-[11px]">
          <HelpCircle className="w-3.5 h-3.5 text-brand-400" />
          <span>GRAPH LEGEND</span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
        )}
      </button>

      {isExpanded && (
        <div className="px-3 pb-3 space-y-2.5 border-t border-slate-800/80 pt-2.5">
          {/* Node classifications */}
          <div>
            <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400 mb-1.5 font-medium">
              Node Status
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-brand-500 shadow-glow-brand ring-2 ring-brand-400/30 shrink-0" />
                <span>Changed in PR</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-glow-amber ring-2 ring-amber-400/30 shrink-0" />
                <span>Potentially Affected</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-500 shrink-0" />
                <span>Unaffected Context</span>
              </div>
            </div>
          </div>

          {/* Edge relationship types */}
          <div className="pt-2 border-t border-slate-800/60">
            <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400 mb-1.5 font-medium">
              Relationships
            </div>
            <div className="space-y-1.5 text-[11px] font-mono">
              <div className="flex items-center gap-2 text-slate-300">
                <span className="w-5 h-0.5 bg-amber-400 shrink-0" />
                <span>Impact ripple (calls/imports)</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <span className="w-5 h-0.5 bg-cyan-400 border-b border-dashed shrink-0" />
                <span>Test suite verification</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <span className="w-5 h-0.5 bg-slate-600 shrink-0" />
                <span>Baseline dependency</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GraphLegend;
