import React, { useState, useEffect } from 'react';
import {
  Settings,
  User,
  Shield,
  Palette,
  LogOut,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  FolderGit2,
  Github,
  KeyRound,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import Button from '../components/common/Button';
import githubService from '../services/githubService';

export const SettingsPage = () => {
  const { user, logout } = useAuth();

  // GitHub Account State
  const [githubUser, setGithubUser] = useState(githubService.getStoredUser());
  const [githubToken, setGithubToken] = useState(githubService.getStoredToken());
  const [tokenInput, setTokenInput] = useState('');
  const [isVerifyingToken, setIsVerifyingToken] = useState(false);
  const [tokenMessage, setTokenMessage] = useState(null); // { success: boolean, text: string }

  useEffect(() => {
    const handleConnected = (e) => {
      setGithubUser(e.detail?.user || githubService.getStoredUser());
      setGithubToken(githubService.getStoredToken());
    };
    const handleDisconnected = () => {
      setGithubUser(null);
      setGithubToken('');
    };

    window.addEventListener('repomemory:github_connected', handleConnected);
    window.addEventListener('repomemory:github_disconnected', handleDisconnected);

    return () => {
      window.removeEventListener('repomemory:github_connected', handleConnected);
      window.removeEventListener('repomemory:github_disconnected', handleDisconnected);
    };
  }, []);

  const handleVerifyGitHubToken = async (e) => {
    e.preventDefault();
    if (!tokenInput.trim()) {
      setTokenMessage({ success: false, text: 'Please enter a GitHub Personal Access Token.' });
      return;
    }

    setIsVerifyingToken(true);
    setTokenMessage(null);
    try {
      const res = await githubService.verifyToken(tokenInput.trim());
      setGithubUser(res.user);
      setGithubToken(tokenInput.trim());
      setTokenInput('');
      setTokenMessage({
        success: true,
        text: `Connected successfully as @${res.user.login} (${res.user.name || res.user.login}). Access granted to repositories.`,
      });
    } catch (err) {
      setTokenMessage({
        success: false,
        text: err.message || 'Failed to verify GitHub token. Please verify permissions and expiration.',
      });
    } finally {
      setIsVerifyingToken(false);
    }
  };

  const handleDisconnectGitHub = () => {
    githubService.disconnect();
    setGithubUser(null);
    setGithubToken('');
    setTokenMessage(null);
  };

  const handleResetDemoData = () => {
    localStorage.removeItem('repomemory_mock_repositories');
    localStorage.removeItem('repomemory_mock_auth_user');
    localStorage.removeItem('repomemory_mock_users_db');
    githubService.disconnect();
    window.location.reload();
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <span>Settings & Configuration</span>
        </h1>
        <p className="mt-1 text-xs text-slate-400">
          Manage developer profile, GitHub account connection, workspace preferences, and repository index state.
        </p>
      </div>

      {/* User Profile Card */}
      <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-100 border-b border-slate-800 pb-3">
          <User className="w-4 h-4 text-brand-400" />
          <span>Developer Profile</span>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <img
            src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop&crop=faces'}
            alt={user?.name || 'Developer'}
            className="w-16 h-16 rounded-xl object-cover border-2 border-slate-700"
          />
          <div className="space-y-1">
            <h3 className="font-bold text-base text-white">{user?.name || 'Developer'}</h3>
            <p className="text-xs text-slate-400 font-mono">{user?.email || 'dev@example.com'}</p>
            <div className="flex items-center gap-2 pt-1">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-brand-500/10 text-brand-300 border border-brand-500/30 font-semibold">
                {user?.role || 'Staff Engineer'}
              </span>
              {githubUser ? (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  GitHub Linked (@{githubUser.login})
                </span>
              ) : (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                  GitHub Not Linked
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* GitHub Account Connection Card */}
      <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-100">
            <Github className="w-4 h-4 text-brand-400" />
            <span>GitHub Integration & Personal Repositories</span>
          </div>

          {githubUser ? (
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Connected
            </span>
          ) : (
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded font-semibold bg-slate-800 text-slate-400 border border-slate-700">
              Not Connected
            </span>
          )}
        </div>

        {githubUser ? (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-950 border border-slate-800">
              <div className="flex items-center gap-3">
                <img
                  src={githubUser.avatar_url}
                  alt={githubUser.login}
                  className="w-12 h-12 rounded-xl object-cover border border-slate-700"
                />
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white">{githubUser.name || githubUser.login}</span>
                    <a
                      href={githubUser.html_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-brand-400 hover:text-brand-300 font-mono flex items-center gap-0.5"
                    >
                      <span>@{githubUser.login}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-1">{githubUser.bio || 'Personal GitHub account'}</p>
                  <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-1 font-mono">
                    <span>{githubUser.public_repos || 0} public repos</span>
                    <span>•</span>
                    <span>{githubUser.total_private_repos || 0} private repos</span>
                    <span>•</span>
                    <span className="text-emerald-400">5,000 req/hr rate limit</span>
                  </div>
                </div>
              </div>

              <Button
                variant="secondary"
                size="sm"
                onClick={handleDisconnectGitHub}
                leftIcon={<LogOut className="w-3.5 h-3.5 text-slate-400" />}
              >
                Disconnect GitHub
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-xs text-slate-400 leading-relaxed">
              Connect your GitHub account to analyze private repositories, automatically import your codebases with 1-click, and unlock continuous pull request AST impact tracking.
            </p>

            {tokenMessage && (
              <div
                className={`p-3 rounded-lg border text-xs flex items-start gap-2 ${
                  tokenMessage.success
                    ? 'bg-emerald-950/20 border-emerald-800/60 text-emerald-300'
                    : 'bg-red-950/20 border-red-800/60 text-red-300'
                }`}
              >
                {tokenMessage.success ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                )}
                <span>{tokenMessage.text}</span>
              </div>
            )}

            <form onSubmit={handleVerifyGitHubToken} className="space-y-3 p-4 rounded-xl bg-slate-950 border border-slate-800">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                <label className="font-medium text-slate-300">
                  GitHub Personal Access Token (classic or fine-grained)
                </label>
                <a
                  href="https://github.com/settings/tokens/new?scopes=repo,read:user&description=RepoMemory%20Analysis"
                  target="_blank"
                  rel="noreferrer"
                  className="text-brand-400 hover:text-brand-300 flex items-center gap-1 font-medium"
                >
                  <span>Generate Token on GitHub (with repo scope)</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="relative">
                <KeyRound className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700/80 rounded-lg text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-brand-500 font-mono"
                />
              </div>

              <div className="flex justify-end pt-1">
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={isVerifyingToken}
                  leftIcon={<Github className="w-4 h-4" />}
                >
                  Verify & Connect GitHub Account
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>



      {/* Theme & Workspace Preferences */}
      <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-100 border-b border-slate-800 pb-3">
          <Palette className="w-4 h-4 text-purple-400" />
          <span>Appearance & Graph Workspace</span>
        </div>

        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800">
            <div>
              <div className="font-medium text-slate-200">Engineering Dark Theme</div>
              <div className="text-[11px] text-slate-400">High-contrast slate palette designed for code review</div>
            </div>
            <span className="px-2 py-1 rounded bg-slate-800 font-mono text-[10px] text-brand-300">
              Default Active
            </span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800">
            <div>
              <div className="font-medium text-slate-200">React Flow Hardware Acceleration</div>
              <div className="text-[11px] text-slate-400">WebGL / GPU edge smoothing enabled</div>
            </div>
            <span className="px-2 py-1 rounded bg-slate-800 font-mono text-[10px] text-emerald-400">
              Enabled
            </span>
          </div>
        </div>
      </div>

      {/* Account & Session Controls */}
      <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-100 border-b border-slate-800 pb-3">
          <Shield className="w-4 h-4 text-red-400" />
          <span>Session & Cache Maintenance</span>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
          <Button
            variant="outline"
            size="sm"
            onClick={handleResetDemoData}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Reset Local Demo Data
          </Button>

          <Button
            variant="danger"
            size="sm"
            onClick={logout}
            leftIcon={<LogOut className="w-3.5 h-3.5" />}
          >
            Sign Out of Account
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
