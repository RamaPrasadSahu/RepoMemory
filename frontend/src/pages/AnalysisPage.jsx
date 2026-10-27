import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  GitPullRequest,
  GitBranch,
  RefreshCw,
  FolderGit2,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  TestTube2,
  FileCode,
  Network,
  Code2,
  Layers,
  CheckCircle2,
  Info,
} from 'lucide-react';
import useAnalysis from '../hooks/useAnalysis';
import DependencyGraph from '../components/graph/DependencyGraph';
import ImpactSummary from '../components/analysis/ImpactSummary';
import AffectedFilesList from '../components/analysis/AffectedFilesList';
import TestRecommendations from '../components/analysis/TestRecommendations';
import EvidencePanel from '../components/analysis/EvidencePanel';
import RiskBadge from '../components/analysis/RiskBadge';
import AnalysisStatus from '../components/analysis/AnalysisStatus';
import Button from '../components/common/Button';
import LoadingState from '../components/common/LoadingState';
import ErrorState from '../components/common/ErrorState';
import { formatRelativeTime } from '../utils/formatters';
import { getNodeTypeDetails, getNodeStatusProps } from '../utils/riskUtils';

export const AnalysisPage = () => {
  const { analysisId } = useParams();
  const {
    analysis,
    graph,
    affectedFiles,
    testRecommendations,
    selectedNode,
    setSelectedNode,
    isLoading,
    isReanalyzing,
    error,
    refresh,
    rerunAnalysis,
  } = useAnalysis(analysisId || 'analysis_101');

  // Active views and right-panel tabs
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState('graph'); // 'graph' | 'changed'
  const [activeInspectorTab, setActiveInspectorTab] = useState('selected'); // 'selected' | 'affected' | 'tests' | 'evidence'

  if (isLoading) {
    return (
      <LoadingState
        message="Loading Pull Request Impact Workspace..."
        subtext="Generating AST module dependency graph and verifying test coverage"
      />
    );
  }

  if (error || !analysis) {
    return (
      <ErrorState
        title="Impact Report Unavailable"
        message={error || 'The requested analysis could not be retrieved.'}
        backUrl="/pull-requests"
        backLabel="Back to Pull Requests"
        onRetry={refresh}
      />
    );
  }

  const selectedNodeData = selectedNode?.data || selectedNode;
  const selectedTypeDetails = getNodeTypeDetails(selectedNodeData?.type);
  const selectedStatusProps = getNodeStatusProps(selectedNodeData?.status);

  // Incoming / Outgoing edges for the selected node
  const incomingEdges = selectedNodeData
    ? graph.edges?.filter((e) => e.target === (selectedNodeData.id || selectedNodeData.path))
    : [];
  const outgoingEdges = selectedNodeData
    ? graph.edges?.filter((e) => e.source === (selectedNodeData.id || selectedNodeData.path))
    : [];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
      {/* Top Header Workspace Bar */}
      <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-2">
          {/* Breadcrumb & Repo reference */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <Link
              to={`/repositories/${analysis.repositoryId}`}
              className="font-mono text-slate-400 hover:text-slate-200 flex items-center gap-1.5 transition-colors"
            >
              <FolderGit2 className="w-3.5 h-3.5 text-brand-400" />
              <span>{analysis.repositoryName}</span>
            </Link>
            <span className="text-slate-600">/</span>
            <span className="font-mono text-slate-300 font-bold">
              PR #{analysis.pullRequestNumber}
            </span>
          </div>

          {/* PR Title */}
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            {analysis.pullRequestTitle}
          </h1>

          {/* Branch Comparison & Status Badges */}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <div className="flex items-center gap-1.5 text-xs font-mono text-slate-300">
              <GitBranch className="w-3.5 h-3.5 text-slate-400" />
              <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-brand-300">
                {analysis.sourceBranch}
              </span>
              <ArrowRight className="w-3 h-3 text-slate-500" />
              <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300">
                {analysis.targetBranch}
              </span>
            </div>

            <span className="text-slate-600 hidden sm:inline">•</span>

            <AnalysisStatus status={analysis.status} />

            <RiskBadge level={analysis.riskLevel} size="sm" />
          </div>
        </div>

        {/* Right Action Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
          <div className="text-right text-[11px] text-slate-400 font-mono hidden lg:block">
            <div className="flex items-center gap-1 justify-end">
              <Clock className="w-3 h-3 text-slate-500" />
              <span>Analyzed {formatRelativeTime(analysis.createdAt)}</span>
            </div>
            <div className="text-slate-400">AST Engine v2.4.0</div>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={rerunAnalysis}
            isLoading={isReanalyzing}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Re-run Analysis
          </Button>
        </div>
      </div>

      {/* Summary Metrics & Uncertainty Explanation */}
      <ImpactSummary analysis={analysis} />

      {/* Flagship Engineering Workspace Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left / Center Main Canvas Area (7 or 8 columns) */}
        <div className="xl:col-span-8 space-y-4">
          {/* Main Canvas Tab Controls */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveWorkspaceTab('graph')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeWorkspaceTab === 'graph'
                    ? 'bg-brand-600 text-white shadow-sm shadow-glow-brand'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Network className="w-3.5 h-3.5" />
                <span>Interactive Dependency Graph</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveWorkspaceTab('changed')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeWorkspaceTab === 'changed'
                    ? 'bg-brand-600 text-white shadow-sm shadow-glow-brand'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <FileCode className="w-3.5 h-3.5" />
                <span>Changed Files in PR ({analysis.changedFiles?.length || 0})</span>
              </button>
            </div>
          </div>

          {/* Main Content: Graph or Changed Files list */}
          {activeWorkspaceTab === 'graph' ? (
            <DependencyGraph
              rawGraph={graph}
              onNodeSelect={(node) => {
                setSelectedNode(node);
                setActiveInspectorTab('selected');
              }}
              selectedNodeId={selectedNodeData?.id || selectedNodeData?.path}
            />
          ) : (
            /* Changed Files List View */
            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-800">
                <span>Direct git modifications introduced by this pull request</span>
                <span className="font-mono text-brand-400">
                  {analysis.changedFiles?.length || 0} source files
                </span>
              </div>

              {analysis.changedFiles && analysis.changedFiles.length > 0 ? (
                <div className="space-y-3">
                  {analysis.changedFiles.map((file) => {
                    const isSelected = selectedNodeData?.path === file.path;
                    return (
                      <div
                        key={file.path}
                        onClick={() => {
                          setSelectedNode(file);
                          setActiveInspectorTab('selected');
                        }}
                        className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-brand-500/10 border-brand-500 shadow-glow-brand ring-1 ring-brand-500/40'
                            : 'bg-slate-950/70 hover:bg-slate-950 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-brand-500/20 text-brand-300 border border-brand-500/30 uppercase font-semibold">
                              Changed in PR
                            </span>
                            <h4 className="font-semibold text-sm text-slate-100 mt-1.5 font-mono">
                              {file.path}
                            </h4>
                          </div>

                          <div className="flex items-center gap-1.5 font-mono text-xs">
                            {file.additions !== undefined && (
                              <span className="text-emerald-400">+{file.additions}</span>
                            )}
                            {file.deletions !== undefined && (
                              <span className="text-red-400">-{file.deletions}</span>
                            )}
                          </div>
                        </div>

                        <p className="text-xs text-slate-300 leading-relaxed my-2">
                          {file.summary}
                        </p>

                        {file.modifiedFunctions && file.modifiedFunctions.length > 0 && (
                          <div className="mt-3 pt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-1.5">
                            <span className="text-[10px] text-slate-400 font-mono">
                              Modified AST symbols:
                            </span>
                            {file.modifiedFunctions.map((fn) => (
                              <span
                                key={fn}
                                className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] font-mono text-brand-300"
                              >
                                {fn}()
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-slate-400">
                  No changed file definitions available in analysis response.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Contextual Inspector Sidebar (4 or 5 columns) */}
        <div className="xl:col-span-4 p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col space-y-4">
          {/* Tab Selector Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="grid grid-cols-4 gap-1 w-full bg-slate-950 p-1 rounded-lg border border-slate-800 text-[11px] font-medium">
              <button
                type="button"
                onClick={() => setActiveInspectorTab('selected')}
                className={`py-1.5 rounded transition-colors text-center truncate ${
                  activeInspectorTab === 'selected'
                    ? 'bg-brand-600 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Selected
              </button>
              <button
                type="button"
                onClick={() => setActiveInspectorTab('affected')}
                className={`py-1.5 rounded transition-colors text-center truncate ${
                  activeInspectorTab === 'affected'
                    ? 'bg-brand-600 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Affected ({affectedFiles.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveInspectorTab('tests')}
                className={`py-1.5 rounded transition-colors text-center truncate ${
                  activeInspectorTab === 'tests'
                    ? 'bg-brand-600 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Tests ({testRecommendations.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveInspectorTab('evidence')}
                className={`py-1.5 rounded transition-colors text-center truncate ${
                  activeInspectorTab === 'evidence'
                    ? 'bg-brand-600 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Evidence
              </button>
            </div>
          </div>

          {/* Inspector Tab Panes */}
          <div className="min-h-[460px]">
            {activeInspectorTab === 'selected' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs text-slate-400 pb-1 border-b border-slate-800/60">
                  <span>Module Inspector</span>
                  {selectedNodeData && (
                    <span
                      className={`text-[9px] font-mono uppercase px-2 py-0.5 rounded border ${selectedStatusProps.badgeBg}`}
                    >
                      {selectedNodeData.status || 'unaffected'}
                    </span>
                  )}
                </div>

                {selectedNodeData ? (
                  <div className="space-y-4">
                    {/* File Header */}
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded border ${selectedTypeDetails.bg} ${selectedTypeDetails.color}`}
                        >
                          {selectedTypeDetails.label}
                        </span>
                        <span className="font-semibold text-sm text-slate-100 truncate">
                          {selectedNodeData.label || selectedNodeData.path?.split('/').pop()}
                        </span>
                      </div>
                      <div className="text-xs font-mono text-slate-400 break-all p-2.5 bg-slate-950 rounded-lg border border-slate-800/80 mt-1.5">
                        {selectedNodeData.path || selectedNodeData.id}
                      </div>
                    </div>

                    {/* If Node is Changed */}
                    {selectedNodeData.status === 'changed' && (
                      <div className="p-3 rounded-lg bg-brand-500/10 border border-brand-500/30 text-xs text-brand-300 leading-relaxed">
                        This file is directly modified in the pull request. Downstream dependents below may be impacted by signature changes or export removals.
                      </div>
                    )}

                    {/* If Node is Affected */}
                    {selectedNodeData.status === 'affected' && (
                      <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 leading-relaxed">
                        <span className="font-bold">Downstream Risk: </span>
                        {selectedNodeData.reason ||
                          'Potentially affected by imported function signature changes.'}
                      </div>
                    )}

                    {/* Direct Callers */}
                    <div>
                      <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                        <span>Depended upon by:</span>
                        <span className="text-slate-300 font-bold">{incomingEdges.length} callers</span>
                      </div>
                      {incomingEdges.length > 0 ? (
                        <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                          {incomingEdges.map((e) => (
                            <div
                              key={e.id}
                              className="p-2 rounded bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 flex items-center justify-between"
                            >
                              <span className="truncate">{e.source.split('/').pop()}</span>
                              <span className="text-[10px] text-slate-400">({e.type || 'calls'})</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-2 rounded bg-slate-950/50 border border-slate-800 text-xs text-slate-400 italic">
                          No callers detected in current scope.
                        </div>
                      )}
                    </div>

                    {/* Direct Dependencies */}
                    <div>
                      <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                        <span>Direct Dependencies:</span>
                        <span className="text-slate-300 font-bold">{outgoingEdges.length} modules</span>
                      </div>
                      {outgoingEdges.length > 0 ? (
                        <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                          {outgoingEdges.map((e) => (
                            <div
                              key={e.id}
                              className="p-2 rounded bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 flex items-center justify-between"
                            >
                              <span className="truncate">{e.target.split('/').pop()}</span>
                              <span className="text-[10px] text-slate-400">({e.type || 'imports'})</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-2 rounded bg-slate-950/50 border border-slate-800 text-xs text-slate-400 italic">
                          Zero outbound imports detected.
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center text-xs text-slate-400 italic">
                    Click any module node in the dependency graph or select an affected file to inspect details.
                  </div>
                )}
              </div>
            )}

            {activeInspectorTab === 'affected' && (
              <AffectedFilesList
                files={affectedFiles}
                selectedFileId={selectedNodeData?.path}
                onSelectFile={(file) => {
                  setSelectedNode(file);
                  setActiveInspectorTab('selected');
                }}
              />
            )}

            {activeInspectorTab === 'tests' && (
              <TestRecommendations recommendations={testRecommendations} />
            )}

            {activeInspectorTab === 'evidence' && (
              <EvidencePanel evidence={analysis.evidence || []} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisPage;
