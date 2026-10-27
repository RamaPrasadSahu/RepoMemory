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
import { Table, Network, AlertCircle, FileCode } from 'lucide-react';
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
}) => {
  const { fitView, zoomIn, zoomOut } = useReactFlow();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [viewMode, setViewMode] = useState('graph'); // 'graph' | 'table'
  const [isFullscreen, setIsFullscreen] = useState(false);

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
      fitView({ padding: 0.25, duration: 300 });
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
      if (onNodeSelect) {
        onNodeSelect(node.data || node);
      }
    },
    [onNodeSelect]
  );

  const handleFitView = () => {
    fitView({ padding: 0.2, duration: 400 });
  };

  const handleReset = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setTypeFilter('all');
    setNodes(initialNodes);
    setEdges(initialEdges);
    setTimeout(() => {
      fitView({ padding: 0.2, duration: 400 });
    }, 50);
  };

  const hasData = rawGraph && Array.isArray(rawGraph.nodes) && rawGraph.nodes.length > 0;

  return (
    <div
      className={`relative flex flex-col bg-slate-950 border border-slate-800 rounded-xl overflow-hidden transition-all ${
        isFullscreen ? 'fixed inset-4 z-50 shadow-2xl' : 'w-full h-[520px] lg:h-[620px]'
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
        onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
      />

      {/* View Switcher Bar */}
      <div className="px-4 py-2 bg-slate-900/60 border-b border-slate-800/60 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-slate-400">
          <span className="font-mono text-[11px]">
            Visible: <span className="text-slate-200 font-bold">{visibleNodes.length}</span> nodes,{' '}
            <span className="text-slate-200 font-bold">{visibleEdges.length}</span> relationships
          </span>
        </div>

        <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded border border-slate-800">
          <button
            type="button"
            onClick={() => setViewMode('graph')}
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
              viewMode === 'graph'
                ? 'bg-brand-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Network className="w-3 h-3" />
            <span>Graph View</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
              viewMode === 'table'
                ? 'bg-brand-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Table className="w-3 h-3" />
            <span>Table View</span>
          </button>
        </div>
      </div>

      {/* Main Graph Canvas or Table View */}
      <div className="relative flex-1 w-full h-full min-h-0 bg-slate-950 overflow-hidden">
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
              minZoom={0.15}
              maxZoom={1.75}
              defaultEdgeOptions={{ type: 'smoothstep' }}
              proOptions={{ hideAttribution: true }}
            >
              <Background color="#1e293b" gap={24} size={1} />
              <Controls showInteractive={false} position="bottom-left" />
              <MiniMap
                nodeColor={(n) => {
                  if (n.data?.status === 'changed') return '#6366f1';
                  if (n.data?.status === 'affected') return '#f59e0b';
                  return '#334155';
                }}
                nodeStrokeWidth={2}
                maskColor="rgba(7, 11, 20, 0.7)"
                position="bottom-right"
                className="!m-4"
              />
            </ReactFlow>

            {/* Persistent Graph Legend overlay */}
            <div className="absolute top-4 right-4 z-10 w-56 pointer-events-auto">
              <GraphLegend />
            </div>
          </>
        ) : (
          /* Structured Table View Fallback */
          <div className="h-full overflow-y-auto p-4">
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
                      onClick={() => onNodeSelect && onNodeSelect(data)}
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
