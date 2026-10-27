import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  GitPullRequest,
  FolderGit2,
  History,
  Settings,
  LogOut,
  Layers,
  Sparkles,
  ExternalLink,
  MessageSquareCode,
  Brain,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { config } from '../../config/env';

export const Sidebar = ({ className = '' }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Repositories', path: '/repositories', icon: FolderGit2 },
    { label: 'Repository Q&A', path: '/qa', icon: MessageSquareCode },
    { label: 'Project Memory', path: '/memory', icon: Brain },
    { label: 'Pull Requests', path: '/pull-requests', icon: GitPullRequest },
    { label: 'Analysis History', path: '/history', icon: History },
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <aside
      className={`w-64 bg-slate-900 border-r border-slate-800/80 flex flex-col shrink-0 select-none ${className}`}
    >
      {/* Brand Header */}
      <div className="h-16 px-5 flex items-center justify-between border-b border-slate-800/80">
        <NavLink to="/dashboard" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-indigo-700 flex items-center justify-center text-white shadow-glow-brand group-hover:scale-105 transition-transform">
            <Layers className="w-4.5 h-4.5" />
          </div>
          <div>
            <div className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
              <span>RepoMemory</span>
              <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-brand-500/20 text-brand-300 border border-brand-500/30">
                IMPACT
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono">AST Change Analysis</p>
          </div>
        </NavLink>
      </div>

      {/* Mode Tag */}
      <div className="px-5 py-2.5 bg-slate-950/40 border-b border-slate-800/60 flex items-center justify-between text-xs">
        <span className="text-slate-400 font-medium">Environment</span>
        <span
          className={`font-mono text-[10px] px-2 py-0.5 rounded font-semibold flex items-center gap-1 ${
            config.isMockMode
              ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
              : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              config.isMockMode ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'
            }`}
          />
          {config.isMockMode ? 'MOCK MODE' : 'LIVE API'}
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-2 pb-2 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
          Workspace
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-brand-500/15 text-brand-300 font-semibold border border-brand-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}

        {/* Quick Demo Analysis Link */}
        <div className="pt-4 px-2">
          <div className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase pb-2">
            Featured PR
          </div>
          <NavLink
            to="/analysis/analysis_101"
            className={({ isActive }) =>
              `flex items-center justify-between p-2.5 rounded-lg border text-xs transition-all ${
                isActive
                  ? 'bg-red-500/10 border-red-500/40 text-red-300'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
              }`
            }
          >
            <div className="truncate">
              <div className="font-medium truncate">PR #142 Grade Refactor</div>
              <div className="text-[10px] text-red-400 font-mono mt-0.5">High Risk Detected</div>
            </div>
            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 ml-1.5" />
          </NavLink>
        </div>
      </nav>

      {/* User Footer */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/40">
        <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800">
          <div className="flex items-center gap-2.5 min-w-0">
            <img
              src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop&crop=faces'}
              alt={user?.name || 'User'}
              className="w-7 h-7 rounded-full object-cover border border-slate-700 shrink-0"
            />
            <div className="min-w-0">
              <div className="text-xs font-medium text-slate-200 truncate">{user?.name || 'Developer'}</div>
              <div className="text-[10px] text-slate-400 truncate">{user?.email || 'dev@example.com'}</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Sign out"
            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
