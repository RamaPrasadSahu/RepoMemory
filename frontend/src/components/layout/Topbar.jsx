import React from 'react';
import { Menu, Search, GitBranch, Github, Bell, Sparkles, MessageSquareCode } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { config } from '../../config/env';

export const Topbar = ({ onMenuClick, activeRepoName }) => {
  const { user } = useAuth();

  return (
    <header className="h-16 px-4 sm:px-6 bg-slate-900/90 border-b border-slate-800/80 backdrop-blur-md flex items-center justify-between z-20 shrink-0">
      {/* Left: Mobile Toggle & Context */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="lg:hidden p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-xs">
          <Link
            to="/repositories"
            className="hidden sm:flex items-center gap-1.5 text-slate-400 hover:text-slate-200 px-2 py-1 rounded bg-slate-800/60 border border-slate-700/60 transition-colors"
          >
            <GitBranch className="w-3.5 h-3.5 text-brand-400" />
            <span>Repository:</span>
            <span className="font-semibold text-slate-200">
              {activeRepoName || 'student-management-system'}
            </span>
          </Link>
        </div>
      </div>

      {/* Right: Environment Info & Actions */}
      <div className="flex items-center gap-3">
        {/* Core question reminder tooltip / badge */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-950 border border-slate-800 text-[11px] text-slate-400 font-mono">
          <span className="text-brand-400 font-semibold">Core:</span>
          <span>"What might this pull request break?"</span>
        </div>

        {/* GitHub indicator */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800/80 border border-slate-700/80 rounded-lg text-xs text-slate-300">
          <Github className="w-3.5 h-3.5 text-slate-400" />
          <span className="hidden sm:inline">GitHub:</span>
          <span className="text-emerald-400 font-medium">Ready</span>
        </div>

        {/* Quick Q&A link */}
        <Link
          to="/qa"
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700/80 text-slate-200 hover:text-white border border-slate-700 rounded-lg text-xs font-medium transition-colors"
        >
          <MessageSquareCode className="w-3.5 h-3.5 text-brand-400" />
          <span>Ask Codebase</span>
        </Link>

        {/* Quick link to high risk analysis */}
        <Link
          to="/analysis/analysis_101"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-xs font-medium shadow-sm transition-all shadow-glow-brand"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Live Impact Report</span>
          <span className="sm:hidden">Report</span>
        </Link>
      </div>
    </header>
  );
};

export default Topbar;
