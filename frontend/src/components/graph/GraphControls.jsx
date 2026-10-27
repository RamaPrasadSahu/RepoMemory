import React from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  Filter,
  Search,
  SlidersHorizontal,
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
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-900/90 border-b border-slate-800/80 backdrop-blur-sm z-10">
      {/* Left: Search & Filter Controls */}
      <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[260px]">
        <SearchInput
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Filter nodes by filename or path..."
          className="w-full sm:w-64"
        />

        {/* Status Filter Pills */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
          {['all', 'changed', 'affected', 'unaffected'].map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => onStatusFilterChange(status)}
              className={`px-2.5 py-1 rounded text-xs font-medium capitalize transition-colors ${
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

      {/* Right: Zoom & Canvas Actions */}
      <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800">
        <button
          type="button"
          onClick={onZoomIn}
          title="Zoom In"
          className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded transition-colors"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={onZoomOut}
          title="Zoom Out"
          className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded transition-colors"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={onFitView}
          title="Fit to View"
          className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded transition-colors"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={onReset}
          title="Reset Layout"
          className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {onToggleFullscreen && (
          <button
            type="button"
            onClick={onToggleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Graph'}
            className="p-1.5 text-brand-400 hover:text-brand-300 hover:bg-slate-800 rounded transition-colors border-l border-slate-800 pl-2 ml-0.5"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default GraphControls;
