import React, { useState, useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import {
  FolderGit2,
  GitBranch,
  Star,
  GitFork,
  Clock,
  ArrowLeft,
  GitPullRequest,
  Sparkles,
  Info,
  FileCode,
  ArrowRight,
  Cpu,
  Layers,
  MessageSquareCode,
  Brain,
  Plus,
  Send,
  ExternalLink,
} from 'lucide-react';
import repositoryService from '../services/repositoryService';
import pullRequestService from '../services/pullRequestService';
import analysisService from '../services/analysisService';
import qaService from '../services/qaService';
import memoryService from '../services/memoryService';
import DependencyGraph from '../components/graph/DependencyGraph';
import PullRequestCard from '../components/dashboard/PullRequestCard';
import QuestionAnswerCard from '../components/qa/QuestionAnswerCard';
import MemoryCard from '../components/memory/MemoryCard';
import CreateMemoryModal from '../components/memory/CreateMemoryModal';
import Button from '../components/common/Button';
import LoadingState from '../components/common/LoadingState';
import ErrorState from '../components/common/ErrorState';
import EmptyState from '../components/common/EmptyState';
import { formatRelativeTime } from '../utils/formatters';
import { getNodeTypeDetails, getNodeStatusProps } from '../utils/riskUtils';

export const RepositoryDetailPage = () => {
  const { repositoryId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  const activeTab = searchParams.get('tab') || 'map'; // 'map' | 'qa' | 'memory' | 'prs'
  const targetNodeParam = searchParams.get('node');

  const [repository, setRepository] = useState(null);
  const [pullRequests, setPullRequests] = useState([]);
  const [graphData, setGraphData] = useState({ nodes: [], edges: [] });
  const [selectedNode, setSelectedNode] = useState(null);
  const [activeBranch, setActiveBranch] = useState('main');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Q&A state
  const [qaItems, setQaItems] = useState([]);
  const [suggestedQuestions, setSuggestedQuestions] = useState([]);
  const [qaPrompt, setQaPrompt] = useState('');
  const [isAsking, setIsAsking] = useState(false);

  // Memory state
  const [memories, setMemories] = useState([]);
  const [isMemoryModalOpen, setIsMemoryModalOpen] = useState(false);

  const setTab = (tab) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('tab', tab);
    setSearchParams(nextParams);
  };

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [repo, prs, analysis, qas, suggestions, memoryList] = await Promise.all([
        repositoryService.getRepositoryById(repositoryId),
        pullRequestService.getPullRequests(repositoryId),
        analysisService.getAnalysisById('analysis_101'),
        qaService.getQAHistory(repositoryId),
        qaService.getSuggestedQuestions(repositoryId),
        memoryService.getMemories(repositoryId),
      ]);

      setRepository(repo);
      setPullRequests(prs || []);
      setActiveBranch(repo.defaultBranch || 'main');
      setQaItems(qas || []);
      setSuggestedQuestions(suggestions || []);
      setMemories(memoryList || []);

      if (analysis?.graph) {
        setGraphData(analysis.graph);
        // Find target node from search param if available
        if (targetNodeParam) {
          const match = analysis.graph.nodes?.find(
            (n) => n.id === targetNodeParam || n.path === targetNodeParam
          );
          setSelectedNode(match || analysis.graph.nodes[0]);
        } else if (analysis.graph.nodes?.length > 0) {
          setSelectedNode(analysis.graph.nodes[0]);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to load repository details.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [repositoryId]);

  // When node param changes in URL
  useEffect(() => {
    if (targetNodeParam && graphData.nodes?.length > 0) {
      const match = graphData.nodes.find(
        (n) => n.id === targetNodeParam || n.path === targetNodeParam
      );
      if (match) {
        setSelectedNode(match);
      }
    }
  }, [targetNodeParam, graphData.nodes]);

  const handleAskQuestion = async (text) => {
    const query = text || qaPrompt;
    if (!query.trim() || isAsking) return;

    setIsAsking(true);
    try {
      const answer = await qaService.askQuestion(repositoryId, query.trim());
      setQaItems((prev) => [answer, ...prev.filter((i) => i.id !== answer.id)]);
      setQaPrompt('');
    } catch (err) {
      alert(err.message || 'Failed to ask question.');
    } finally {
      setIsAsking(false);
    }
  };

  const handleSaveMemory = async (data) => {
    const created = await memoryService.createMemory(repositoryId, data);
    setMemories((prev) => [created, ...prev]);
  };

  const handleDeleteMemory = async (id) => {
    if (window.confirm('Delete this decision record?')) {
      await memoryService.deleteMemory(id);
      setMemories((prev) => prev.filter((m) => m.id !== id));
    }
  };

  if (isLoading) {
    return <LoadingState message="Constructing repository dependency hierarchy & memory index..." />;
  }

  if (error || !repository) {
    return (
      <ErrorState
        title="Repository Not Found"
        message={error || 'Could not load repository information.'}
        backUrl="/repositories"
        backLabel="Back to Repositories"
        onRetry={loadData}
      />
    );
  }

  // Find incoming and outgoing edges for selected node
  const incomingEdges = selectedNode
    ? graphData.edges?.filter((e) => e.target === (selectedNode.id || selectedNode.path))
    : [];
  const outgoingEdges = selectedNode
    ? graphData.edges?.filter((e) => e.source === (selectedNode.id || selectedNode.path))
    : [];

  const selectedTypeDetails = getNodeTypeDetails(selectedNode?.type);
  const selectedStatusProps = getNodeStatusProps(selectedNode?.status);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Breadcrumb & Metadata Header */}
      <div>
        <Link
          to="/repositories"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Repositories</span>
        </Link>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-brand-400 shrink-0">
              <FolderGit2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white">{repository.name}</h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  {repository.connectionStatus}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 font-mono">{repository.fullName}</p>
              <p className="text-xs text-slate-300 mt-2 max-w-2xl">{repository.description}</p>
            </div>
          </div>

          {/* Branch & PR impact link */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs">
              <GitBranch className="w-3.5 h-3.5 text-brand-400" />
              <span className="text-slate-400">Branch:</span>
              <select
                value={activeBranch}
                onChange={(e) => setActiveBranch(e.target.value)}
                className="bg-transparent text-slate-200 font-mono text-xs focus:outline-none cursor-pointer"
              >
                {repository.branches?.map((b) => (
                  <option key={b} value={b} className="bg-slate-900 text-slate-200">
                    {b}
                  </option>
                )) || <option value="main">main</option>}
              </select>
            </div>

            <Link to="/analysis/analysis_101">
              <Button variant="primary" size="sm" leftIcon={<Sparkles className="w-3.5 h-3.5 text-amber-400" />}>
                Active PR Impact
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Navigation Tabs (All 4 Pillars) */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto select-none">
        <button
          type="button"
          onClick={() => setTab('map')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
            activeTab === 'map'
              ? 'bg-brand-500/20 text-brand-300 border border-brand-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Layers className="w-4 h-4 text-brand-400" />
          <span>Codebase Mind Map</span>
          <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-800 text-slate-300">
            {graphData.nodes?.length || 0}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setTab('qa')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
            activeTab === 'qa'
              ? 'bg-brand-500/20 text-brand-300 border border-brand-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <MessageSquareCode className="w-4 h-4 text-emerald-400" />
          <span>Repository Q&A</span>
          <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-800 text-slate-300">
            {qaItems.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setTab('memory')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
            activeTab === 'memory'
              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Brain className="w-4 h-4 text-purple-400" />
          <span>Project Memory (ADRs)</span>
          <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-800 text-slate-300">
            {memories.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setTab('prs')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
            activeTab === 'prs'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <GitPullRequest className="w-4 h-4 text-amber-400" />
          <span>Pull Requests</span>
          <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-800 text-slate-300">
            {pullRequests.length}
          </span>
        </button>
      </div>

      {/* Tab 1: Codebase Mind Map */}
      {activeTab === 'map' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Dependency Graph (2 cols) */}
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-brand-400" />
                  <span>Visual Codebase Mind Map</span>
                </h2>
                <p className="text-xs text-slate-400">
                  Interactive relationship graph connecting files, routes, controllers, schemas, and test suites.
                </p>
              </div>
            </div>

            <DependencyGraph
              rawGraph={graphData}
              onNodeSelect={(node) => setSelectedNode(node)}
              selectedNodeId={selectedNode?.id || selectedNode?.path}
            />
          </div>

          {/* Right: Selected Node Details Panel (1 col) */}
          <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-4">
                <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                  <Info className="w-4 h-4 text-brand-400" />
                  <span>Selected Node Inspector</span>
                </h3>
                {selectedNode && (
                  <span
                    className={`text-[9px] font-mono uppercase px-2 py-0.5 rounded border ${selectedStatusProps.badgeBg}`}
                  >
                    {selectedNode.status || 'unaffected'}
                  </span>
                )}
              </div>

              {selectedNode ? (
                <div className="space-y-4">
                  {/* File Title & Type */}
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded border ${selectedTypeDetails.bg} ${selectedTypeDetails.color}`}
                      >
                        {selectedTypeDetails.label}
                      </span>
                      <span className="font-semibold text-sm text-slate-100 truncate">
                        {selectedNode.label || selectedNode.path?.split('/').pop()}
                      </span>
                    </div>
                    <div className="text-xs font-mono text-slate-400 break-all p-2 bg-slate-950 rounded border border-slate-800/80 mt-1">
                      {selectedNode.path || selectedNode.id}
                    </div>
                  </div>

                  {/* Actions for this node: Ask Q&A or Record Memory */}
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                    <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block">
                      Node Actions
                    </span>
                    <div className="flex flex-col gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setTab('qa');
                          setQaPrompt(`Explain the role and architecture of ${selectedNode.path || selectedNode.id}`);
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded bg-slate-900 hover:bg-brand-500/15 border border-slate-800 hover:border-brand-500/30 text-xs text-brand-300 font-medium transition-colors flex items-center justify-between"
                      >
                        <span className="flex items-center gap-1.5">
                          <MessageSquareCode className="w-3.5 h-3.5 text-brand-400" />
                          <span>Ask Q&A about this node</span>
                        </span>
                        <ArrowRight className="w-3 h-3 text-slate-500" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setIsMemoryModalOpen(true)}
                        className="w-full text-left px-2.5 py-1.5 rounded bg-slate-900 hover:bg-purple-500/15 border border-slate-800 hover:border-purple-500/30 text-xs text-purple-300 font-medium transition-colors flex items-center justify-between"
                      >
                        <span className="flex items-center gap-1.5">
                          <Brain className="w-3.5 h-3.5 text-purple-400" />
                          <span>Record Decision for this file</span>
                        </span>
                        <Plus className="w-3 h-3 text-slate-500" />
                      </button>
                    </div>
                  </div>

                  {/* Incoming dependents */}
                  <div>
                    <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                      <span>Depended upon by:</span>
                      <span className="text-slate-300 font-bold">{incomingEdges?.length || 0} modules</span>
                    </div>
                    {incomingEdges && incomingEdges.length > 0 ? (
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {incomingEdges.map((e) => (
                          <div
                            key={e.id}
                            className="px-2.5 py-1.5 rounded bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 truncate"
                          >
                            {e.source.split('/').pop()} ({e.type || 'calls'})
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-2 rounded bg-slate-950/50 border border-slate-800 text-xs text-slate-400 italic">
                        No incoming callers identified.
                      </div>
                    )}
                  </div>

                  {/* Outgoing dependencies */}
                  <div>
                    <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                      <span>Direct Dependencies:</span>
                      <span className="text-slate-300 font-bold">{outgoingEdges?.length || 0} modules</span>
                    </div>
                    {outgoingEdges && outgoingEdges.length > 0 ? (
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {outgoingEdges.map((e) => (
                          <div
                            key={e.id}
                            className="px-2.5 py-1.5 rounded bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 truncate"
                          >
                            {e.target.split('/').pop()} ({e.type || 'imports'})
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-2 rounded bg-slate-950/50 border border-slate-800 text-xs text-slate-400 italic">
                        Zero outbound dependencies.
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-slate-400 italic">
                  Click any node in the dependency graph to inspect its AST connections and direct dependents.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Repository Q&A */}
      {activeTab === 'qa' && (
        <div className="space-y-6">
          <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-brand-400" />
              <span>Ask a Question about {repository.name}:</span>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={qaPrompt}
                onChange={(e) => setQaPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAskQuestion()}
                placeholder="Ask about authentication, algorithms, routes, or database schemas..."
                className="flex-1 px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500"
              />
              <Button
                variant="primary"
                onClick={() => handleAskQuestion()}
                isLoading={isAsking}
                leftIcon={<Send className="w-3.5 h-3.5" />}
              >
                Ask
              </Button>
            </div>

            {/* Suggested prompts */}
            {suggestedQuestions.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {suggestedQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleAskQuestion(q)}
                    className="text-xs px-2.5 py-1 rounded-full bg-slate-950 hover:bg-brand-500/20 text-slate-400 hover:text-brand-300 border border-slate-800 hover:border-brand-500/40 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-200">
              Answered Questions with Code Citations ({qaItems.length})
            </h3>
            {qaItems.length === 0 ? (
              <EmptyState
                title="No Q&A records yet"
                description="Type a question above to generate an AST-grounded explanation."
              />
            ) : (
              qaItems.map((item) => (
                <QuestionAnswerCard key={item.id} item={item} repositoryId={repositoryId} />
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Project Memory */}
      {activeTab === 'memory' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900 border border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Brain className="w-4 h-4 text-purple-400" />
                <span>Architectural Decisions & Knowledge</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Documenting why modules are designed this way and recording technical trade-offs.
              </p>
            </div>

            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsMemoryModalOpen(true)}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Record Decision
            </Button>
          </div>

          <div className="space-y-4">
            {memories.length === 0 ? (
              <EmptyState
                title="No architectural records yet"
                description="Record the first technical decision or rationale for this codebase."
                actionLabel="Record Decision"
                onAction={() => setIsMemoryModalOpen(true)}
              />
            ) : (
              memories.map((m) => (
                <MemoryCard
                  key={m.id}
                  memory={m}
                  repositoryId={repositoryId}
                  onDelete={handleDeleteMemory}
                />
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 4: Pull Requests */}
      {activeTab === 'prs' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-100">
                Pull Requests in {repository.name}
              </h2>
              <p className="text-xs text-slate-400">
                Open and recent pull requests targeting this repository
              </p>
            </div>
          </div>

          {pullRequests.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400 rounded-xl bg-slate-900 border border-slate-800">
              No pull requests registered for this repository yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pullRequests.map((pr) => (
                <PullRequestCard key={pr.id} pullRequest={pr} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create Memory Modal */}
      <CreateMemoryModal
        isOpen={isMemoryModalOpen}
        onClose={() => setIsMemoryModalOpen(false)}
        onSave={handleSaveMemory}
        repositoryName={repository.name}
      />
    </div>
  );
};

export default RepositoryDetailPage;
