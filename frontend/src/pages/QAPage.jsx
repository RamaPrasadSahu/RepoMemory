import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  MessageSquareCode,
  Sparkles,
  Send,
  HelpCircle,
  FolderGit2,
  Cpu,
  RefreshCw,
  Search,
} from 'lucide-react';
import repositoryService from '../services/repositoryService';
import qaService from '../services/qaService';
import QuestionAnswerCard from '../components/qa/QuestionAnswerCard';
import Button from '../components/common/Button';
import LoadingState from '../components/common/LoadingState';
import ErrorState from '../components/common/ErrorState';
import EmptyState from '../components/common/EmptyState';

export const QAPage = () => {
  const { repositoryId: routeRepoId } = useParams();
  const navigate = useNavigate();

  const [repositories, setRepositories] = useState([]);
  const [selectedRepoId, setSelectedRepoId] = useState(routeRepoId || 'repo_101');
  const [prompt, setPrompt] = useState('');
  const [suggestedQuestions, setSuggestedQuestions] = useState([]);
  const [qaItems, setQaItems] = useState([]);
  const [isAsking, setIsAsking] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load repositories & initial Q&A items
  useEffect(() => {
    const fetchInitial = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const repos = await repositoryService.getRepositories();
        setRepositories(repos || []);

        const activeId = routeRepoId || (repos?.[0]?.id) || 'repo_101';
        setSelectedRepoId(activeId);

        const [history, suggestions] = await Promise.all([
          qaService.getQAHistory(activeId),
          qaService.getSuggestedQuestions(activeId),
        ]);

        setQaItems(history || []);
        setSuggestedQuestions(suggestions || []);
      } catch (err) {
        setError(err.message || 'Failed to initialize Repository Q&A workspace.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitial();
  }, [routeRepoId]);

  // Handle repository switch
  const handleRepoChange = async (newRepoId) => {
    setSelectedRepoId(newRepoId);
    setError(null);
    try {
      const [history, suggestions] = await Promise.all([
        qaService.getQAHistory(newRepoId),
        qaService.getSuggestedQuestions(newRepoId),
      ]);
      setQaItems(history || []);
      setSuggestedQuestions(suggestions || []);
    } catch (err) {
      setError(err.message || 'Failed to load Q&A for selected repository.');
    }
  };

  const handleAskQuestion = async (queryToAsk) => {
    const text = queryToAsk || prompt;
    if (!text.trim() || isAsking) return;

    setIsAsking(true);
    setError(null);
    try {
      const newAnswer = await qaService.askQuestion(selectedRepoId, text.trim());
      setQaItems((prev) => [newAnswer, ...prev.filter((item) => item.id !== newAnswer.id)]);
      setPrompt('');
    } catch (err) {
      setError(err.message || 'Failed to generate code-grounded answer.');
    } finally {
      setIsAsking(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAskQuestion();
    }
  };

  if (isLoading) {
    return <LoadingState message="Connecting to AST Codebase Knowledge Index..." subtext="Loading repository context" />;
  }

  const selectedRepo = repositories.find((r) => r.id === selectedRepoId) || repositories[0];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      {/* Header & Repository Picker */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-xl bg-slate-900 border border-slate-800">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/30 flex items-center justify-center text-brand-400 shrink-0 shadow-glow-brand">
            <MessageSquareCode className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white tracking-tight">Repository Q&A</h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-brand-500/20 text-brand-300 border border-brand-500/40">
                AST Grounded
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Ask natural language questions about architecture, authentication, algorithms, or API routes with verified code citations.
            </p>
          </div>
        </div>

        {/* Repository selector */}
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
      </div>

      {/* Interactive Prompt Input Box */}
      <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800/90 shadow-lg space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5 font-medium text-slate-300">
            <Sparkles className="w-3.5 h-3.5 text-brand-400" />
            <span>Ask anything about {selectedRepo?.name || 'the repository'}:</span>
          </span>
          <span className="font-mono text-[11px] text-slate-400 hidden sm:inline">
            Press <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">Enter</kbd> to ask
          </span>
        </div>

        <div className="relative flex items-center">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isAsking}
            placeholder={`e.g. "Where is authentication handled?" or "How does grade calculation work?"`}
            className="w-full pl-4 pr-24 py-3 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500/80 focus:ring-1 focus:ring-brand-500/50 transition-all font-sans"
          />

          <div className="absolute right-2 flex items-center">
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleAskQuestion()}
              isLoading={isAsking}
              disabled={!prompt.trim() || isAsking}
              leftIcon={<Send className="w-3.5 h-3.5" />}
            >
              Ask
            </Button>
          </div>
        </div>

        {/* Suggested Quick Prompt Pills */}
        {suggestedQuestions && suggestedQuestions.length > 0 && (
          <div className="pt-2 flex flex-wrap items-center gap-2">
            <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
              <HelpCircle className="w-3 h-3 text-brand-400" />
              <span>Suggested:</span>
            </span>
            {suggestedQuestions.map((q, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleAskQuestion(q)}
                disabled={isAsking}
                className="text-xs px-2.5 py-1 rounded-full bg-slate-800/80 hover:bg-brand-500/20 text-slate-300 hover:text-brand-300 border border-slate-700/80 hover:border-brand-500/40 transition-colors text-left"
              >
                {q}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Answering Loading State */}
      {isAsking && (
        <div className="p-6 rounded-xl bg-slate-900 border border-brand-500/30 shadow-glow-brand flex items-center gap-4 animate-pulse">
          <div className="w-9 h-9 rounded-lg bg-brand-500/20 flex items-center justify-center text-brand-400">
            <Cpu className="w-5 h-5 animate-spin" />
          </div>
          <div>
            <div className="text-sm font-semibold text-white">Analyzing AST code structures & tracing citations...</div>
            <div className="text-xs text-slate-400 mt-0.5 font-mono">
              Resolving imports, function call expressions, and file paths in {selectedRepo?.name}
            </div>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400">
          {error}
        </div>
      )}

      {/* Answers Feed */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-200">
            Repository Answers & Explanations ({qaItems.length})
          </h2>
          <span className="text-xs text-slate-400 font-mono">
            {selectedRepo?.name}
          </span>
        </div>

        {qaItems.length === 0 ? (
          <EmptyState
            title="No questions asked yet"
            description="Select a suggested prompt above or type a question about how this repository works."
          />
        ) : (
          <div className="space-y-4">
            {qaItems.map((item) => (
              <QuestionAnswerCard
                key={item.id}
                item={item}
                repositoryId={selectedRepoId}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default QAPage;
