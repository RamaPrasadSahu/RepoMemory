import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Brain,
  Plus,
  FolderGit2,
  Search,
  Filter,
  Layers,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import repositoryService from '../services/repositoryService';
import memoryService from '../services/memoryService';
import MemoryCard from '../components/memory/MemoryCard';
import CreateMemoryModal from '../components/memory/CreateMemoryModal';
import Button from '../components/common/Button';
import SearchInput from '../components/common/SearchInput';
import LoadingState from '../components/common/LoadingState';
import EmptyState from '../components/common/EmptyState';

const CATEGORIES = ['All', 'Architecture', 'Security', 'Performance', 'Integration', 'Data Modeling'];
const STATUSES = ['All', 'Accepted', 'Proposed', 'Deprecated', 'Superseded'];

export const MemoryPage = () => {
  const { repositoryId: routeRepoId } = useParams();

  const [repositories, setRepositories] = useState([]);
  const [selectedRepoId, setSelectedRepoId] = useState(routeRepoId || 'repo_101');
  const [memories, setMemories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load repositories and initial memory records
  useEffect(() => {
    const fetchInitial = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const repos = await repositoryService.getRepositories();
        setRepositories(repos || []);

        const activeId = routeRepoId || (repos?.[0]?.id) || 'repo_101';
        setSelectedRepoId(activeId);

        const records = await memoryService.getMemories(activeId);
        setMemories(records || []);
      } catch (err) {
        setError(err.message || 'Failed to initialize Project Memory workspace.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitial();
  }, [routeRepoId]);

  // Refetch when filters change
  const loadMemories = async (repoId = selectedRepoId) => {
    try {
      const records = await memoryService.getMemories(repoId, {
        category: selectedCategory === 'All' ? undefined : selectedCategory,
        status: selectedStatus === 'All' ? undefined : selectedStatus,
        search: searchQuery,
      });
      setMemories(records || []);
    } catch (err) {
      setError(err.message || 'Failed to load project memories.');
    }
  };

  useEffect(() => {
    if (selectedRepoId) {
      loadMemories(selectedRepoId);
    }
  }, [selectedRepoId, selectedCategory, selectedStatus, searchQuery]);

  const handleRepoChange = (newRepoId) => {
    setSelectedRepoId(newRepoId);
  };

  const handleCreateMemory = async (data) => {
    const created = await memoryService.createMemory(selectedRepoId, data);
    setMemories((prev) => [created, ...prev]);
  };

  const handleDeleteMemory = async (id) => {
    if (window.confirm('Are you sure you want to delete this architectural decision record?')) {
      await memoryService.deleteMemory(id);
      setMemories((prev) => prev.filter((m) => m.id !== id));
    }
  };

  if (isLoading) {
    return <LoadingState message="Retrieving Repository Architectural Memory..." subtext="Loading ADR index" />;
  }

  const selectedRepo = repositories.find((r) => r.id === selectedRepoId) || repositories[0];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-xl bg-slate-900 border border-slate-800">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0 shadow-glow-brand">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white tracking-tight">Project Memory</h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Architectural Records (ADR)
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Persistent repository knowledge answering <strong>why</strong> code was designed this way, preserving critical technical decisions.
            </p>
          </div>
        </div>

        {/* Actions: Target Repo & Record Button */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs">
            <FolderGit2 className="w-4 h-4 text-brand-400 shrink-0" />
            <span className="text-slate-400">Target Repo:</span>
            <select
              value={selectedRepoId}
              onChange={(e) => handleRepoChange(e.target.value)}
              className="bg-transparent text-slate-100 font-semibold focus:outline-none cursor-pointer"
            >
              {repositories.map((repo) => (
                <option key={repo.id} value={repo.id} className="bg-slate-900 text-slate-200">
                  {repo.name}
                </option>
              ))}
            </select>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsModalOpen(true)}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            Record Decision
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="w-full sm:flex-1">
            <SearchInput
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClear={() => setSearchQuery('')}
              placeholder="Search decisions, contexts, rationale, or affected modules..."
            />
          </div>

          {/* Status selector */}
          <div className="flex items-center gap-2 w-full sm:w-auto text-xs">
            <span className="text-slate-400 font-medium shrink-0">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-brand-500 w-full sm:w-auto"
            >
              {STATUSES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Category Filter Chips */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[11px] font-mono text-slate-400 mr-1">Categories:</span>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`text-xs px-2.5 py-1 rounded-lg transition-colors font-medium ${
                selectedCategory === cat
                  ? 'bg-brand-500/20 text-brand-300 border border-brand-500/40 font-semibold'
                  : 'bg-slate-950/80 text-slate-400 hover:text-slate-200 border border-slate-800 hover:bg-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400">
          {error}
        </div>
      )}

      {/* Decision Cards Feed */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-200">
            Recorded Decisions & Architecture Memory ({memories.length})
          </h2>
          <span className="text-xs text-slate-400 font-mono">
            {selectedRepo?.name}
          </span>
        </div>

        {memories.length === 0 ? (
          <EmptyState
            title="No architectural records found"
            description="No project memory records match the selected category or search query."
            actionLabel="Record First Decision"
            onAction={() => setIsModalOpen(true)}
          />
        ) : (
          <div className="space-y-4">
            {memories.map((memory) => (
              <MemoryCard
                key={memory.id}
                memory={memory}
                repositoryId={selectedRepoId}
                onDelete={handleDeleteMemory}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create Memory Modal */}
      <CreateMemoryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleCreateMemory}
        repositoryName={selectedRepo?.name}
      />
    </div>
  );
};

export default MemoryPage;
