import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Github,
  Sparkles,
  GitPullRequest,
  FolderGit2,
  AlertCircle,
  ExternalLink,
  CheckCircle2,
  KeyRound,
} from 'lucide-react';
import Modal from './Modal';
import Button from './Button';
import githubService from '../../services/githubService';

export const AnalyzeGithubModal = ({ isOpen, onClose, onSuccess }) => {
  const navigate = useNavigate();
  const [urlInput, setUrlInput] = useState('');
  const [prNumberInput, setPrNumberInput] = useState('');
  const [customToken, setCustomToken] = useState(githubService.getStoredToken() || '');
  const [showTokenInput, setShowTokenInput] = useState(!githubService.getStoredToken());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [detectedInfo, setDetectedInfo] = useState(null);

  const handleInputChange = (val) => {
    setUrlInput(val);
    setError('');

    // Quick regex to detect PR URL or repo format
    const trimmed = val.trim();
    const prMatch = trimmed.match(/(?:github\.com\/)?([^/]+)\/([^/#]+)(?:\/pull\/|#)(\d+)/i);
    const repoMatch = trimmed.match(/(?:github\.com\/)?([^/]+)\/([^/#?]+)/i);

    if (prMatch) {
      setDetectedInfo({
        type: 'pr',
        owner: prMatch[1],
        repo: prMatch[2].replace(/\.git$/, ''),
        prNumber: parseInt(prMatch[3], 10),
        fullName: `${prMatch[1]}/${prMatch[2].replace(/\.git$/, '')}`,
      });
      setPrNumberInput(prMatch[3]);
    } else if (repoMatch && repoMatch[2]) {
      setDetectedInfo({
        type: 'repo',
        owner: repoMatch[1],
        repo: repoMatch[2].replace(/\.git$/, ''),
        fullName: `${repoMatch[1]}/${repoMatch[2].replace(/\.git$/, '')}`,
      });
    } else {
      setDetectedInfo(null);
    }
  };

  const handleAnalyze = async (e) => {
    e.preventDefault();
    setError('');

    if (!urlInput.trim()) {
      setError('Please provide a GitHub repository or pull request URL.');
      return;
    }

    const prNum = prNumberInput.trim() ? parseInt(prNumberInput.trim(), 10) : detectedInfo?.prNumber || 1;

    setIsLoading(true);
    try {
      const activeToken = customToken.trim() || githubService.getStoredToken() || null;
      if (customToken.trim() && !githubService.getStoredToken()) {
        githubService.saveConnection(customToken.trim(), null);
      }

      const analysis = await githubService.analyzeGithubPR(
        detectedInfo?.fullName || urlInput.trim(),
        prNum,
        activeToken
      );

      if (onSuccess) {
        onSuccess(analysis);
      }

      onClose();
      // Navigate straight to the live impact analysis
      const analysisId = analysis.id || analysis.analysisId;
      if (analysisId) {
        navigate(`/analysis/${analysisId}`);
      }
    } catch (err) {
      setError(err.message || 'Failed to analyze GitHub Pull Request. Please check URL or rate limits.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Analyze GitHub Pull Request"
      description="Connect any public or private GitHub repository to run AST impact graph analysis on live pull requests."
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleAnalyze}
            isLoading={isLoading}
            leftIcon={<Sparkles className="w-4 h-4 text-amber-300" />}
          >
            Run AST Impact Analysis
          </Button>
        </>
      }
    >
      <form onSubmit={handleAnalyze} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            GitHub PR or Repository URL
          </label>
          <div className="relative">
            <Github className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={urlInput}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder="e.g. https://github.com/facebook/react/pull/31415 or owner/repo"
              className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700/80 rounded-lg text-xs text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-brand-500 font-mono"
              autoFocus
            />
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            Accepts full GitHub PR URLs, repo URLs, or shorthand like <code className="font-mono text-slate-300">facebook/react#31415</code>.
          </p>
        </div>

        {detectedInfo && (
          <div className="p-3 rounded-lg bg-brand-500/10 border border-brand-500/30 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              {detectedInfo.type === 'pr' ? (
                <GitPullRequest className="w-4 h-4 text-brand-400" />
              ) : (
                <FolderGit2 className="w-4 h-4 text-brand-400" />
              )}
              <span className="text-slate-200">
                Target: <strong className="font-mono text-white">{detectedInfo.fullName}</strong>
                {detectedInfo.type === 'pr' && (
                  <span className="ml-1 text-brand-300 font-mono font-semibold">
                    (PR #{detectedInfo.prNumber})
                  </span>
                )}
              </span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              Validated
            </span>
          </div>
        )}

        {detectedInfo?.type === 'repo' && (
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Pull Request Number to Analyze
            </label>
            <input
              type="number"
              min="1"
              value={prNumberInput}
              onChange={(e) => setPrNumberInput(e.target.value)}
              placeholder="1"
              className="w-32 px-3 py-1.5 bg-slate-950 border border-slate-700/80 rounded-lg text-xs text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-brand-500 font-mono"
            />
          </div>
        )}

        {/* Optional GitHub PAT for Rate Limits & Private Repos */}
        <div className="pt-2 border-t border-slate-800">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setShowTokenInput(!showTokenInput)}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200"
            >
              <KeyRound className="w-3.5 h-3.5 text-brand-400" />
              <span>{showTokenInput ? 'Hide GitHub Token Options' : 'GitHub Token (Optional for higher limits)'}</span>
            </button>
            <a
              href="https://github.com/settings/tokens/new?scopes=repo,read:user&description=RepoMemory%20Analysis"
              target="_blank"
              rel="noreferrer"
              className="text-[11px] text-brand-400 hover:text-brand-300 flex items-center gap-1"
            >
              <span>Get Token</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {showTokenInput && (
            <div className="mt-2 space-y-1.5">
              <input
                type="password"
                value={customToken}
                onChange={(e) => setCustomToken(e.target.value)}
                placeholder="ghp_... (Personal Access Token)"
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700/80 rounded-lg text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-brand-500 font-mono"
              />
              <p className="text-[10px] text-slate-400">
                Public repositories analyze with 0 credentials. Adding a Personal Access Token grants access to private repositories and raises rate limits to 5,000 req/hr.
              </p>
            </div>
          )}
        </div>
      </form>
    </Modal>
  );
};

export default AnalyzeGithubModal;
