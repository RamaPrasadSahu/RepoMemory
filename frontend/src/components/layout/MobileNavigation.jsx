import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  X,
  LayoutDashboard,
  FolderGit2,
  GitPullRequest,
  History,
  Settings,
  Layers,
  LogOut,
  MessageSquareCode,
  Brain,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export const MobileNavigation = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();

  if (!isOpen) return null;

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
    <div className="fixed inset-0 z-50 lg:hidden flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div className="relative w-72 max-w-[85vw] bg-slate-900 border-r border-slate-800 flex flex-col h-full z-10 animate-in slide-in-from-left duration-200">
        <div className="h-16 px-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white">
              <Layers className="w-4 h-4" />
            </div>
            <span className="font-bold text-sm text-white">RepoMemory Impact</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-brand-500/15 text-brand-300 font-semibold border border-brand-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`
                }
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800 bg-slate-950/50">
          <div className="flex items-center justify-between">
            <div className="text-xs">
              <div className="font-medium text-slate-200">{user?.name}</div>
              <div className="text-slate-400">{user?.email}</div>
            </div>
            <button
              onClick={() => {
                onClose();
                logout();
              }}
              className="p-2 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-800"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileNavigation;
