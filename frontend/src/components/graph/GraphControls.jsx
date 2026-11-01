import React from 'react';
import {
  ZoomIn,
  ZoomOut,
  Scan,
  RotateCcw,
  Maximize,
  Minimize,
  Map,
  Info,
  GitPullRequest,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import SearchInput from '../common/SearchInput';

export const GraphControls = ({
  onZoomIn,
  onZoomOut,
  onFitView,
  onReset,
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  typeFilter,
  onTypeFilterChange,
  isFullscreen,
  onToggleFullscreen,
  showMinimap = true,
  onToggleMinimap,
  pullRequestTitle = '',
  repositoryName = '',
  riskLevel = '',
  prNumber = null,
  hasSelectedNode = false,
  showInspector = false,
  onToggleInspector,
}) => {
  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-900/95 border-b border-slate-800/90 backdrop-blur-md z-20 ${
        isFullscreen ? 'shadow-lg bg-slate-950/90 border-slate-800' : ''
      }`}
    >
      {/* Left: PR Context Badge (Visible especially in Fullscreen) & Search/Filter */}
      <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
        {isFullscreen && (repositoryName || prNumber || pullRequestTitle) && (
          <div className="flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs">
            <div className="flex items-center gap-1.5 font-mono font-semibold text-white">
              <GitPullRequest className="w-3.5 h-3.5 text-brand-400" />
              <span>{repositoryName ? `${repositoryName}` : 'Pull Request'}</span>
              {prNumber && <span className="text-brand-300">#{prNumber}</span>}
            </div>

            {riskLevel && (
              <span
                className={`text-[9px] font-mono uppercase px-1.5 py-0.2 rounded font-bold border ${
                  riskLevel === 'high'
                    ? 'bg-red-500/10 text-red-400 border-red-500/30'
                    : riskLevel === 'medium'
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                }`}
              >
                {riskLevel} risk
              </span>
            )}
          </div>
        )}

        <SearchInput
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Filter nodes by filename or path..."
          className="w-full sm:w-60"
        />

        {/* Status Filter Pills */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
          {['all', 'changed', 'affected', 'unaffected'].map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => onStatusFilterChange(status)}
              className={`px-2 py-0.5 rounded text-[11px] font-medium capitalize transition-colors ${
                statusFilter === status
                  ? 'bg-brand-600 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Node Type Selector */}
        <select
          value={typeFilter}
          onChange={(e) => onTypeFilterChange(e.target.value)}
          className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-brand-500"
        >
          <option value="all">All Types</option>
          <option value="controller">Controllers</option>
          <option value="route">API Routes</option>
          <option value="module">Modules / Utils</option>
          <option value="service">Services</option>
          <option value="model">Models</option>
          <option value="test">Test Suites</option>
          <option value="middleware">Middleware</option>
        </select>
      </div>

      {/* Right: Canvas Actions & Max Fullscreen Trigger */}
      <div className="flex items-center gap-1.5">
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
          <button
            type="button"
            onClick={onZoomIn}
            title="Zoom In (+)"
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded transition-colors"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onZoomOut}
            title="Zoom Out (-)"
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded transition-colors"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onFitView}
            title="Fit Entire Graph to View"
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded transition-colors"
          >
            <Scan className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onReset}
            title="Reset Filters & View"
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {onToggleMinimap && (
            <button
              type="button"
              onClick={onToggleMinimap}
              title={showMinimap ? 'Hide Minimap' : 'Show Minimap'}
              className={`p-1.5 rounded transition-colors ${
                showMinimap
                  ? 'text-brand-400 bg-brand-500/10'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
              }`}
            >
              <Map className="w-4 h-4" />
            </button>
          )}

          {isFullscreen && onToggleInspector && (
            <button
              type="button"
              onClick={onToggleInspector}
              title={showInspector ? 'Hide Node Inspector' : 'Show Node Inspector'}
              className={`p-1.5 rounded transition-colors ${
                showInspector
                  ? 'text-brand-400 bg-brand-500/10'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
              }`}
            >
              <Info className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Dedicated Max Full Screen Button */}
        {onToggleFullscreen && (
          <button
            type="button"
            onClick={onToggleFullscreen}
            title={isFullscreen ? 'Exit Full Screen (Esc)' : 'Enter Max Full Screen (F)'}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-sm ${
              isFullscreen
                ? 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                : 'bg-brand-600 hover:bg-brand-500 text-white border border-brand-500 shadow-glow-brand'
            }`}
          >
            {isFullscreen ? (
              <>
                <Minimize className="w-3.5 h-3.5 text-amber-300" />
                <span>Exit Fullscreen</span>
                <kbd className="hidden sm:inline-block ml-1 px-1.5 py-0.2 rounded bg-slate-900 border border-slate-700 text-[10px] text-slate-400 font-mono">
                  Esc
                </kbd>
              </>
            ) : (
              <>
                <Maximize className="w-3.5 h-3.5 text-brand-200" />
                <span>Max Full Screen</span>
                <kbd className="hidden sm:inline-block ml-1 px-1.5 py-0.2 rounded bg-brand-700 text-[10px] text-brand-100 font-mono">
                  F
                </kbd>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default GraphControls;
