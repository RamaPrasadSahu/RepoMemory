import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
} from '@xyflow/react';
import DependencyNode from './DependencyNode';
import GraphControls from './GraphControls';
import GraphLegend from './GraphLegend';
import { transformGraphData, filterGraph } from '../../utils/graphUtils';
import {
  Table,
  Network,
  AlertCircle,
  FileCode,
  X,
  Code2,
  Terminal,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import EmptyState from '../common/EmptyState';

const nodeTypes = {
  dependencyNode: DependencyNode,
};

// Internal graph canvas component wrapped in ReactFlowProvider
const GraphCanvas = ({
  rawGraph,
  onNodeSelect,
  selectedNodeId,
  className = '',
  pullRequestTitle = '',
  repositoryName = '',
  riskLevel = '',
  prNumber = null,
  isMaxFullscreen = false,
  onFullscreenChange,
}) => {
  const { fitView, zoomIn, zoomOut } = useReactFlow();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [viewMode, setViewMode] = useState('graph'); // 'graph' | 'table'
  const [isFullscreen, setIsFullscreen] = useState(isMaxFullscreen);
  const [showMinimap, setShowMinimap] = useState(true);
  const [showInspector, setShowInspector] = useState(false);
  const [activeSelectedNode, setActiveSelectedNode] = useState(null);

  // Sync with incoming prop if controlled
  useEffect(() => {
    if (isMaxFullscreen !== undefined && isMaxFullscreen !== isFullscreen) {
      setIsFullscreen(isMaxFullscreen);
    }
  }, [isMaxFullscreen]);

  // Handle Fullscreen transitions & body scroll lock
  const handleToggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => {
      const next = !prev;
      if (onFullscreenChange) {
        onFullscreenChange(next);
      }
      return next;
    });
  }, [onFullscreenChange]);

  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    const timer = setTimeout(() => {
      fitView({ padding: 0.18, duration: 400 });
    }, 150);

    return () => {
      clearTimeout(timer);
      document.body.style.overflow = '';
    };
  }, [isFullscreen, fitView]);

  // Keyboard shortcut listener: F = toggle fullscreen, Esc = exit fullscreen
  useEffect(() => {
    const handleKeyDown = (e) => {
      const activeTag = document.activeElement?.tagName?.toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea') {
        return;
      }

      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
        if (onFullscreenChange) onFullscreenChange(false);
      } else if (e.key === 'f' || e.key === 'F') {
        handleToggleFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, handleToggleFullscreen, onFullscreenChange]);

  // Transform raw API graph to flow format
  const { initialNodes, initialEdges } = useMemo(() => {
    const { nodes, edges } = transformGraphData(rawGraph);
    return { initialNodes: nodes, initialEdges: edges };
  }, [rawGraph]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update nodes when initial data changes
  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
    setTimeout(() => {
      fitView({ padding: 0.22, duration: 300 });
    }, 100);
  }, [initialNodes, initialEdges, fitView, setNodes, setEdges]);

  // Synchronize selection state in React Flow nodes
  useEffect(() => {
    setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        selected: node.id === selectedNodeId || node.data?.path === selectedNodeId,
      }))
    );
  }, [selectedNodeId, setNodes]);

  // Apply filters to nodes and edges
  const { visibleNodes, visibleEdges } = useMemo(() => {
    const { nodes: filteredNds, edges: filteredEds } = filterGraph(nodes, edges, {
      searchQuery,
      statusFilter,
      typeFilter,
    });
    return { visibleNodes: filteredNds, visibleEdges: filteredEds };
  }, [nodes, edges, searchQuery, statusFilter, typeFilter]);

  const handleNodeClick = useCallback(
    (_, node) => {
      const nodeData = node.data || node;
      setActiveSelectedNode(nodeData);
      if (isFullscreen) {
        setShowInspector(true);
      }
      if (onNodeSelect) {
        onNodeSelect(nodeData);
      }
    },
    [onNodeSelect, isFullscreen]
  );

  const handleFitView = () => {
    fitView({ padding: 0.18, duration: 400 });
  };

  const handleReset = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setTypeFilter('all');
    setNodes(initialNodes);
    setEdges(initialEdges);
    setTimeout(() => {
      fitView({ padding: 0.18, duration: 400 });
    }, 50);
  };

  const hasData = rawGraph && Array.isArray(rawGraph.nodes) && rawGraph.nodes.length > 0;

  return (
    <div
      className={`transition-all duration-200 flex flex-col bg-slate-950 border border-slate-800 ${
        isFullscreen
          ? 'fixed inset-0 z-50 w-screen h-screen rounded-none shadow-2xl'
          : 'relative rounded-xl overflow-hidden w-full h-[540px] lg:h-[640px]'
      } ${className}`}
    >
      {/* Graph Toolbar */}
      <GraphControls
        onZoomIn={() => zoomIn({ duration: 300 })}
        onZoomOut={() => zoomOut({ duration: 300 })}
        onFitView={handleFitView}
        onReset={handleReset}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        typeFilter={typeFilter}
        onTypeFilterChange={setTypeFilter}
        isFullscreen={isFullscreen}
        onToggleFullscreen={handleToggleFullscreen}
        showMinimap={showMinimap}
        onToggleMinimap={() => setShowMinimap(!showMinimap)}
        pullRequestTitle={pullRequestTitle}
        repositoryName={repositoryName}
        riskLevel={riskLevel}
        prNumber={prNumber}
        hasSelectedNode={!!activeSelectedNode}
        showInspector={showInspector}
        onToggleInspector={() => setShowInspector(!showInspector)}
      />

      {/* Subheader / Mode Switcher Bar */}
      <div className="px-4 py-2 bg-slate-900/60 border-b border-slate-800/70 flex items-center justify-between text-xs backdrop-blur-sm z-10">
        <div className="flex items-center gap-3 text-slate-400">
          <span className="font-mono text-[11px]">
            Visible: <span className="text-slate-100 font-bold">{visibleNodes.length}</span> nodes,{' '}
            <span className="text-slate-100 font-bold">{visibleEdges.length}</span> relations
          </span>

          {isFullscreen && (
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-mono text-brand-300 bg-brand-500/10 px-2 py-0.5 rounded border border-brand-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Max Full Screen Active
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
          <button
            type="button"
            onClick={() => setViewMode('graph')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
              viewMode === 'graph'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Network className="w-3 h-3" />
            <span>Graph Canvas</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
              viewMode === 'table'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Table className="w-3 h-3" />
            <span>Table View</span>
          </button>
        </div>
      </div>

      {/* Canvas Area / Table View with Collapsible Inspector Drawer in Fullscreen */}
      <div className="relative flex-1 w-full h-full min-h-0 bg-slate-950 overflow-hidden flex">
        <div className="relative flex-1 w-full h-full min-h-0 overflow-hidden">
          {!hasData ? (
            <EmptyState
              icon={AlertCircle}
              title="No Dependency Graph Data Available"
              description="The dependency parser found no modules or relations for this changeset."
              className="h-full border-none"
            />
          ) : visibleNodes.length === 0 ? (
            <EmptyState
              icon={FileCode}
              title="No Matching Graph Nodes"
              description="No nodes match your current search query or active filter settings."
              actionLabel="Reset Filters"
              onAction={handleReset}
              className="h-full border-none"
            />
          ) : viewMode === 'graph' ? (
            <>
              <ReactFlow
                nodes={visibleNodes}
                edges={visibleEdges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onNodeClick={handleNodeClick}
                nodeTypes={nodeTypes}
                fitView
                minZoom={0.12}
                maxZoom={2.0}
                defaultEdgeOptions={{ type: 'smoothstep' }}
                proOptions={{ hideAttribution: true }}
              >
                <Background color="#1e293b" gap={24} size={1} />
                <Controls showInteractive={false} position="bottom-left" />

                {showMinimap && (
                  <MiniMap
                    nodeColor={(n) => {
                      if (n.data?.status === 'changed') return '#6366f1';
                      if (n.data?.status === 'affected') return '#f59e0b';
                      return '#334155';
                    }}
                    nodeStrokeWidth={2}
                    maskColor="rgba(7, 11, 20, 0.75)"
                    position="bottom-right"
                    className="!m-4 !border !border-slate-800 !rounded-xl overflow-hidden !shadow-lg"
                  />
                )}
              </ReactFlow>

              {/* Persistent Graph Legend overlay */}
              <div className="absolute top-4 right-4 z-10 w-56 pointer-events-auto">
                <GraphLegend />
              </div>
            </>
          ) : (
            /* Structured Table View Fallback */
            <div className="h-full overflow-y-auto p-4 custom-scrollbar">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 font-mono uppercase text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Module / File</th>
                    <th className="px-4 py-3">Classification</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {visibleNodes.map((node) => {
                    const data = node.data || {};
                    return (
                      <tr
                        key={node.id}
                        onClick={() => {
                          setActiveSelectedNode(data);
                          if (onNodeSelect) onNodeSelect(data);
                        }}
                        className={`hover:bg-slate-900/60 cursor-pointer transition-colors ${
                          selectedNodeId === node.id ? 'bg-brand-500/10' : ''
                        }`}
                      >
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-100">{data.label || data.path}</div>
                          <div className="font-mono text-[10px] text-slate-400">{data.path}</div>
                        </td>
                        <td className="px-4 py-3 capitalize font-mono text-[11px] text-slate-300">
                          {data.type || 'file'}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-semibold ${
                              data.status === 'changed'
                                ? 'bg-brand-500/20 text-brand-300 border border-brand-500/30'
                                : data.status === 'affected'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {data.status || 'unaffected'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveSelectedNode(data);
                              if (isFullscreen) setShowInspector(true);
                              if (onNodeSelect) onNodeSelect(data);
                            }}
                            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium"
                          >
                            Inspect
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Fullscreen Node Inspector Drawer (Slide-out panel on right) */}
        {isFullscreen && showInspector && activeSelectedNode && (
          <div className="w-80 md:w-96 border-l border-slate-800 bg-slate-900/95 backdrop-blur-xl h-full flex flex-col z-20 shadow-2xl transition-all">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-brand-400" />
                <span className="font-bold text-sm text-white">Node Inspector</span>
              </div>
              <button
                type="button"
                onClick={() => setShowInspector(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 flex-1 overflow-y-auto space-y-4 custom-scrollbar text-xs">
              <div>
                <span className="text-[10px] font-mono uppercase text-slate-400">File Path</span>
                <div className="font-mono text-xs text-brand-300 break-all bg-slate-950 p-2.5 rounded-lg border border-slate-800 mt-1">
                  {activeSelectedNode.path || activeSelectedNode.id}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase">Impact Status</span>
                  <div className="font-semibold text-slate-100 mt-0.5 capitalize flex items-center gap-1">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        activeSelectedNode.status === 'changed'
                          ? 'bg-indigo-400'
                          : activeSelectedNode.status === 'affected'
                          ? 'bg-amber-400'
                          : 'bg-slate-500'
                      }`}
                    />
                    {activeSelectedNode.status || 'unaffected'}
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase">Module Type</span>
                  <div className="font-semibold text-slate-100 mt-0.5 capitalize">
                    {activeSelectedNode.type || 'Source File'}
                  </div>
                </div>
              </div>

              {activeSelectedNode.status === 'changed' && (
                <div className="p-3 rounded-lg bg-brand-500/10 border border-brand-500/30 space-y-1.5">
                  <span className="text-[10px] font-mono text-brand-300 uppercase font-bold">
                    Direct PR Changes
                  </span>
                  <div className="flex items-center gap-3 font-mono text-xs">
                    {activeSelectedNode.additions !== undefined && (
                      <span className="text-emerald-400 font-bold">
                        +{activeSelectedNode.additions} lines
                      </span>
                    )}
                    {activeSelectedNode.deletions !== undefined && (
                      <span className="text-red-400 font-bold">
                        -{activeSelectedNode.deletions} lines
                      </span>
                    )}
                  </div>
                </div>
              )}

              {activeSelectedNode.reason && (
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-mono">Ripple Reason</span>
                  <p className="text-slate-300 leading-relaxed text-xs">
                    {activeSelectedNode.reason}
                  </p>
                </div>
              )}

              {activeSelectedNode.modifiedFunctions && activeSelectedNode.modifiedFunctions.length > 0 && (
                <div>
                  <span className="text-[10px] font-mono uppercase text-slate-400">
                    Exported Functions Touched ({activeSelectedNode.modifiedFunctions.length})
                  </span>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {activeSelectedNode.modifiedFunctions.map((fn, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 font-mono text-[11px] text-brand-300"
                      >
                        {typeof fn === 'string' ? fn : fn.name}()
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => fitView({ nodes: [{ id: activeSelectedNode.id || activeSelectedNode.path }], duration: 400 })}
                  className="w-full py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <span>Center in Viewport</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const DependencyGraph = (props) => {
  return (
    <ReactFlowProvider>
      <GraphCanvas {...props} />
    </ReactFlowProvider>
  );
};

export default DependencyGraph;
