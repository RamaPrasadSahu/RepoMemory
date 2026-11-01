import React, { useState, useEffect } from 'react';
import {
  FolderGit2,
  Plus,
  Search,
  Github,
  CheckCircle2,
  Sparkles,
  GitPullRequest,
  Star,
  GitFork,
  Lock,
  Globe,
  ExternalLink,
  KeyRound,
  RefreshCw,
  LogOut,
  AlertCircle,
} from 'lucide-react';
import useRepositories from '../hooks/useRepositories';
import RepositoryCard from '../components/dashboard/RepositoryCard';
import Button from '../components/common/Button';
import SearchInput from '../components/common/SearchInput';
import Modal from '../components/common/Modal';
import LoadingState from '../components/common/LoadingState';
import ErrorState from '../components/common/ErrorState';
import EmptyState from '../components/common/EmptyState';
import AnalyzeGithubModal from '../components/common/AnalyzeGithubModal';
import githubService from '../services/githubService';

export const RepositoriesPage = () => {
  const { repositories, isLoading, error, refresh, connectRepo } = useRepositories();

  // Search and filter
  const [search, setSearch] = useState('');
  const [languageFilter, setLanguageFilter] = useState('all');

  // Modals state
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [isAnalyzeModalOpen, setIsAnalyzeModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('user-repos'); // 'user-repos' | 'url'

  // Connect by URL form
  const [newRepoFullName, setNewRepoFullName] = useState('');
  const [newRepoDescription, setNewRepoDescription] = useState('');
  const [newRepoLanguage, setNewRepoLanguage] = useState('JavaScript');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // GitHub Account State
  const [githubUser, setGithubUser] = useState(githubService.getStoredUser());
  const [githubToken, setGithubToken] = useState(githubService.getStoredToken());
  const [tokenInput, setTokenInput] = useState('');
  const [isVerifyingToken, setIsVerifyingToken] = useState(false);
  const [tokenError, setTokenError] = useState('');

  // User repositories list
  const [userRepos, setUserRepos] = useState([]);
  const [isLoadingUserRepos, setIsLoadingUserRepos] = useState(false);
  const [userRepoSearch, setUserRepoSearch] = useState('');
  const [connectingRepoId, setConnectingRepoId] = useState(null);

  // Sync GitHub state on mount and custom events
  useEffect(() => {
    const handleConnected = (e) => {
      setGithubUser(e.detail?.user || githubService.getStoredUser());
      setGithubToken(githubService.getStoredToken());
    };
    const handleDisconnected = () => {
      setGithubUser(null);
      setGithubToken('');
      setUserRepos([]);
    };

    window.addEventListener('repomemory:github_connected', handleConnected);
    window.addEventListener('repomemory:github_disconnected', handleDisconnected);

    return () => {
      window.removeEventListener('repomemory:github_connected', handleConnected);
      window.removeEventListener('repomemory:github_disconnected', handleDisconnected);
    };
  }, []);

  // Fetch GitHub repos when modal opens or token changes
  useEffect(() => {
    if (isConnectModalOpen && activeTab === 'user-repos' && githubToken) {
      loadUserRepositories();
    }
  }, [isConnectModalOpen, activeTab, githubToken]);

  const loadUserRepositories = async () => {
    setIsLoadingUserRepos(true);
    setTokenError('');
    try {
      const repos = await githubService.getUserRepositories(githubToken);
      setUserRepos(Array.isArray(repos) ? repos : []);
    } catch (err) {
      setTokenError(err.message || 'Failed to fetch repositories from GitHub.');
    } finally {
      setIsLoadingUserRepos(false);
    }
  };

  const handleVerifyToken = async (e) => {
    e.preventDefault();
    if (!tokenInput.trim()) {
      setTokenError('Please enter a GitHub Personal Access Token.');
      return;
    }

    setIsVerifyingToken(true);
    setTokenError('');
    try {
      const res = await githubService.verifyToken(tokenInput.trim());
      setGithubUser(res.user);
      setGithubToken(tokenInput.trim());
      setTokenInput('');
      // Automatically load repos after verification
      const repos = await githubService.getUserRepositories(tokenInput.trim());
      setUserRepos(Array.isArray(repos) ? repos : []);
    } catch (err) {
      setTokenError(err.message || 'Invalid GitHub token. Please verify token permissions and expiration.');
    } finally {
      setIsVerifyingToken(false);
    }
  };

  const handleDisconnectGithub = () => {
    githubService.disconnect();
    setGithubUser(null);
    setGithubToken('');
    setUserRepos([]);
  };

  const handleConnectUserRepo = async (repo) => {
    setConnectingRepoId(repo.id);
    setFormError('');
    try {
      await connectRepo({
        fullName: repo.fullName,
        description: repo.description,
        primaryLanguage: repo.primaryLanguage,
      });
      setIsConnectModalOpen(false);
      refresh();
    } catch (err) {
      setFormError(err.message || `Failed to connect repository ${repo.fullName}`);
    } finally {
      setConnectingRepoId(null);
    }
  };

  const handleConnectSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!newRepoFullName.trim()) {
      setFormError('Please enter a repository reference (e.g. facebook/react or full URL).');
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
      refresh();
    } catch (err) {
      setFormError(err.message || 'Failed to connect repository.');
    } finally {
      setIsSubmitting(false);
    }
  };

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

  const filteredUserRepos = userRepos.filter((r) => {
    if (!userRepoSearch) return true;
    const q = userRepoSearch.toLowerCase();
    return (
      r.name.toLowerCase().includes(q) ||
      r.fullName.toLowerCase().includes(q) ||
      (r.description && r.description.toLowerCase().includes(q))
    );
  });

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
            Repositories mapped for AST syntax trees, dependency graphs, and live pull request impact analysis.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsAnalyzeModalOpen(true)}
            leftIcon={<Sparkles className="w-4 h-4 text-amber-300" />}
          >
            Analyze Any PR
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setActiveTab(githubToken ? 'user-repos' : 'url');
              setIsConnectModalOpen(true);
            }}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Connect Repository
          </Button>
        </div>
      </div>

      {/* GitHub Account Banner */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          {githubUser?.avatar_url ? (
            <img
              src={githubUser.avatar_url}
              alt={githubUser.login}
              className="w-10 h-10 rounded-xl object-cover border border-slate-700"
            />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
              <Github className="w-5 h-5" />
            </div>
          )}

          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white">
                {githubUser ? (githubUser.name || `@${githubUser.login}`) : 'GitHub Connector'}
              </span>
              {githubUser ? (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Connected
                </span>
              ) : (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                  Not Linked
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {githubUser
                ? `Signed in as @${githubUser.login} • ${githubUser.public_repos || 0} public, ${githubUser.total_private_repos || 0} private repositories available`
                : 'Connect your personal GitHub account to import your repositories with 1-click and bypass public rate limits.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-center">
          {githubUser ? (
            <>
              <Button
                variant="secondary"
                size="xs"
                onClick={() => {
                  setActiveTab('user-repos');
                  setIsConnectModalOpen(true);
                }}
                leftIcon={<FolderGit2 className="w-3.5 h-3.5 text-brand-400" />}
              >
                Import My Repos
              </Button>
              <Button
                variant="ghost"
                size="xs"
                onClick={handleDisconnectGithub}
                leftIcon={<LogOut className="w-3.5 h-3.5 text-slate-400" />}
              >
                Disconnect
              </Button>
            </>
          ) : (
            <Button
              variant="secondary"
              size="xs"
              onClick={() => {
                setActiveTab('user-repos');
                setIsConnectModalOpen(true);
              }}
              leftIcon={<KeyRound className="w-3.5 h-3.5 text-brand-400" />}
            >
              Link GitHub Account
            </Button>
          )}
        </div>
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
              ? 'No GitHub repositories are connected yet. Connect your personal GitHub repository or analyze any public PR to get started.'
              : 'No repositories match your active search query.'
          }
          actionLabel={repositories.length === 0 ? 'Connect First Repository' : 'Clear Search'}
          onAction={() =>
            repositories.length === 0
              ? setIsConnectModalOpen(true)
              : setSearch('')
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRepositories.map((repo) => (
            <RepositoryCard key={repo.id} repository={repo} />
          ))}
        </div>
      )}

      {/* Connect Repository Modal with Multi-Tab Experience */}
      <Modal
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
        title="Connect GitHub Repository"
        description="Add a GitHub repository to RepoMemory to map syntax dependencies and run impact graphs on every PR."
      >
        <div className="space-y-4">
          {/* Tabs */}
          <div className="flex border-b border-slate-800">
            <button
              type="button"
              onClick={() => setActiveTab('user-repos')}
              className={`pb-2.5 px-3 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === 'user-repos'
                  ? 'border-brand-500 text-brand-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Github className="w-3.5 h-3.5" />
              <span>My GitHub Repositories</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('url')}
              className={`pb-2.5 px-3 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === 'url'
                  ? 'border-brand-500 text-brand-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <FolderGit2 className="w-3.5 h-3.5" />
              <span>Connect by URL or Name</span>
            </button>
          </div>

          {/* TAB 1: USER REPOSITORIES */}
          {activeTab === 'user-repos' && (
            <div className="space-y-4">
              {!githubToken ? (
                // Token connect prompt
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-white">
                    <KeyRound className="w-4 h-4 text-brand-400" />
                    <span>Link your GitHub Personal Access Token</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Connect your GitHub account to instantly browse and import your private and public repositories with a single click.
                  </p>

                  {tokenError && (
                    <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{tokenError}</span>
                    </div>
                  )}

                  <form onSubmit={handleVerifyToken} className="space-y-3 pt-1">
                    <div>
                      <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                        <span>Personal Access Token</span>
                        <a
                          href="https://github.com/settings/tokens/new?scopes=repo,read:user&description=RepoMemory%20Analysis"
                          target="_blank"
                          rel="noreferrer"
                          className="text-brand-400 hover:text-brand-300 flex items-center gap-1"
                        >
                          <span>Generate Token (repo scope)</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                      <input
                        type="password"
                        value={tokenInput}
                        onChange={(e) => setTokenInput(e.target.value)}
                        placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-lg text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-brand-500 font-mono"
                      />
                    </div>

                    <Button
                      type="submit"
                      variant="primary"
                      size="sm"
                      className="w-full"
                      isLoading={isVerifyingToken}
                    >
                      Verify & List My Repositories
                    </Button>
                  </form>
                </div>
              ) : (
                // Repositories list
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <input
                      type="text"
                      value={userRepoSearch}
                      onChange={(e) => setUserRepoSearch(e.target.value)}
                      placeholder="Filter your repositories..."
                      className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-brand-500"
                    />
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={loadUserRepositories}
                      isLoading={isLoadingUserRepos}
                      leftIcon={<RefreshCw className="w-3 h-3" />}
                    >
                      Refresh
                    </Button>
                  </div>

                  {formError && (
                    <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400">
                      {formError}
                    </div>
                  )}

                  {isLoadingUserRepos ? (
                    <div className="p-8 text-center text-xs text-slate-400">
                      Loading your GitHub repositories...
                    </div>
                  ) : filteredUserRepos.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400 border border-slate-800 rounded-lg">
                      No matching repositories found on your GitHub account.
                    </div>
                  ) : (
                    <div className="max-h-72 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                      {filteredUserRepos.map((repo) => {
                        const isAlreadyConnected = repositories.some(
                          (r) => r.fullName === repo.fullName || r.name === repo.name
                        );

                        return (
                          <div
                            key={repo.id}
                            className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 flex items-center justify-between gap-3 hover:border-slate-700 transition-colors"
                          >
                            <div className="min-w-0 flex-1 space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-xs text-white truncate font-mono">
                                  {repo.fullName}
                                </span>
                                {repo.isPrivate ? (
                                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-0.5">
                                    <Lock className="w-2.5 h-2.5" />
                                    Private
                                  </span>
                                ) : (
                                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 flex items-center gap-0.5">
                                    <Globe className="w-2.5 h-2.5" />
                                    Public
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-400 truncate">
                                {repo.description || 'No description provided.'}
                              </p>
                              <div className="flex items-center gap-3 text-[10px] text-slate-400">
                                <span>{repo.primaryLanguage}</span>
                                <span className="flex items-center gap-1">
                                  <Star className="w-3 h-3 text-amber-400" />
                                  {repo.starsCount}
                                </span>
                                <span className="flex items-center gap-1">
                                  <GitPullRequest className="w-3 h-3 text-cyan-400" />
                                  {repo.openPrsCount} open PRs
                                </span>
                              </div>
                            </div>

                            <Button
                              variant={isAlreadyConnected ? 'ghost' : 'primary'}
                              size="xs"
                              disabled={isAlreadyConnected || connectingRepoId === repo.id}
                              isLoading={connectingRepoId === repo.id}
                              onClick={() => handleConnectUserRepo(repo)}
                            >
                              {isAlreadyConnected ? 'Connected' : 'Connect'}
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CONNECT BY URL OR SHORTHAND */}
          {activeTab === 'url' && (
            <form onSubmit={handleConnectSubmit} className="space-y-4">
              {formError && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  GitHub Repository Reference or URL
                </label>
                <div className="relative">
                  <Github className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={newRepoFullName}
                    onChange={(e) => setNewRepoFullName(e.target.value)}
                    placeholder="https://github.com/facebook/react or facebook/react"
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-brand-500 font-mono"
                    autoFocus
                  />
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  Accepts full URLs, organization/repo, or direct PR links. Automatically syncs active PRs.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Primary Language</label>
                <select
                  value={newRepoLanguage}
                  onChange={(e) => setNewRepoLanguage(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-brand-500"
                >
                  <option value="JavaScript">JavaScript (Node.js / Express / React)</option>
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
                  placeholder="Brief description of this repository's architectural role..."
                  className="w-full p-2.5 bg-slate-950 border border-slate-700/80 rounded-lg text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-brand-500 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
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
                  type="submit"
                  isLoading={isSubmitting}
                >
                  Connect & Sync PRs
                </Button>
              </div>
            </form>
          )}
        </div>
      </Modal>

      {/* Direct PR Analysis Modal */}
      <AnalyzeGithubModal
        isOpen={isAnalyzeModalOpen}
        onClose={() => setIsAnalyzeModalOpen(false)}
        onSuccess={() => refresh()}
      />
    </div>
  );
};

export default RepositoriesPage;
