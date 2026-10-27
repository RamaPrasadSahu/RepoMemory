import React, { useState } from 'react';
import {
  FolderGit2,
  Plus,
  Filter,
  Search,
  Github,
  CheckCircle2,
} from 'lucide-react';
import useRepositories from '../hooks/useRepositories';
import RepositoryCard from '../components/dashboard/RepositoryCard';
import Button from '../components/common/Button';
import SearchInput from '../components/common/SearchInput';
import Modal from '../components/common/Modal';
import LoadingState from '../components/common/LoadingState';
import ErrorState from '../components/common/ErrorState';
import EmptyState from '../components/common/EmptyState';

export const RepositoriesPage = () => {
  const { repositories, isLoading, error, refresh, connectRepo } = useRepositories();

  const [search, setSearch] = useState('');
  const [languageFilter, setLanguageFilter] = useState('all');
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [newRepoFullName, setNewRepoFullName] = useState('');
  const [newRepoDescription, setNewRepoDescription] = useState('');
  const [newRepoLanguage, setNewRepoLanguage] = useState('JavaScript');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const filteredRepositories = repositories.filter((repo) => {
    const query = search.toLowerCase();
    const matchesSearch =
      !query ||
      repo.name.toLowerCase().includes(query) ||
      (repo.fullName && repo.fullName.toLowerCase().includes(query)) ||
      (repo.description && repo.description.toLowerCase().includes(query));

    const matchesLanguage =
      languageFilter === 'all' ||
      repo.primaryLanguage?.toLowerCase() === languageFilter.toLowerCase();

    return matchesSearch && matchesLanguage;
  });

  const handleConnectSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!newRepoFullName.trim() || !newRepoFullName.includes('/')) {
      setFormError('Please enter repository reference in "owner/repo" format (e.g. acme/api-core).');
      return;
    }

    setIsSubmitting(true);
    try {
      await connectRepo({
        fullName: newRepoFullName.trim(),
        description: newRepoDescription.trim(),
        primaryLanguage: newRepoLanguage,
      });
      setIsConnectModalOpen(false);
      setNewRepoFullName('');
      setNewRepoDescription('');
    } catch (err) {
      setFormError(err.message || 'Failed to connect repository.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <LoadingState message="Loading connected repositories..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={refresh} />;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>Connected Repositories</span>
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Repositories mapped for AST syntax trees and pull request impact analysis.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsConnectModalOpen(true)}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Connect Repository
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-slate-900 border border-slate-800 rounded-xl">
        <SearchInput
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by repository name, owner, or description..."
          className="w-full sm:w-80"
        />

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">Language:</span>
          <select
            value={languageFilter}
            onChange={(e) => setLanguageFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-brand-500"
          >
            <option value="all">All Languages</option>
            <option value="javascript">JavaScript</option>
            <option value="typescript">TypeScript</option>
          </select>
        </div>
      </div>

      {/* Repository Grid */}
      {filteredRepositories.length === 0 ? (
        <EmptyState
          icon={FolderGit2}
          title="No Repositories Found"
          description={
            repositories.length === 0
              ? 'No GitHub repositories are connected yet. Connect your first repository to start analyzing change impact.'
              : 'No repositories match your active search query.'
          }
          actionLabel={repositories.length === 0 ? 'Connect First Repository' : 'Clear Search'}
          onAction={() => (repositories.length === 0 ? setIsConnectModalOpen(true) : setSearch(''))}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRepositories.map((repo) => (
            <RepositoryCard key={repo.id} repository={repo} />
          ))}
        </div>
      )}

      {/* Connect Repository Modal */}
      <Modal
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
        title="Connect GitHub Repository"
        description="Reference a public or private GitHub repository to index for impact analysis."
        footer={
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsConnectModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleConnectSubmit}
              isLoading={isSubmitting}
            >
              Connect Repository
            </Button>
          </>
        }
      >
        <form onSubmit={handleConnectSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Repository Full Reference (owner/repo)
            </label>
            <div className="relative">
              <Github className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={newRepoFullName}
                onChange={(e) => setNewRepoFullName(e.target.value)}
                placeholder="acme-corp/service-auth"
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-sm text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-brand-500 font-mono text-xs"
              />
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              The backend will verify GitHub repository access and clone metadata.
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Primary Language</label>
            <select
              value={newRepoLanguage}
              onChange={(e) => setNewRepoLanguage(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-brand-500"
            >
              <option value="JavaScript">JavaScript (Node.js / Express)</option>
              <option value="TypeScript">TypeScript (Nest / React / Next)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Description (Optional)
            </label>
            <textarea
              rows={2}
              value={newRepoDescription}
              onChange={(e) => setNewRepoDescription(e.target.value)}
              placeholder="Brief description of the service role and boundary..."
              className="w-full p-2.5 bg-slate-950 border border-slate-700/80 rounded-lg text-xs text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-brand-500 resize-none"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default RepositoriesPage;
