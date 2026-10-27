import React, { useState } from 'react';
import {
  Settings,
  User,
  Server,
  Shield,
  Palette,
  LogOut,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  FolderGit2,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { config } from '../config/env';
import Button from '../components/common/Button';
import apiClient from '../services/apiClient';

export const SettingsPage = () => {
  const { user, logout } = useAuth();
  const [isPinging, setIsPinging] = useState(false);
  const [pingResult, setPingResult] = useState(null);

  const handleTestBackendConnection = async () => {
    setIsPinging(true);
    setPingResult(null);
    try {
      if (config.isMockMode) {
        await new Promise((r) => setTimeout(r, 400));
        setPingResult({
          success: true,
          message: 'Mock Mode Active: Virtual API layer responding with 0ms latency simulation.',
        });
      } else {
        await apiClient.get('/auth/me');
        setPingResult({
          success: true,
          message: `Connected successfully to live backend at ${config.apiBaseUrl}.`,
        });
      }
    } catch (err) {
      setPingResult({
        success: false,
        message: err.message || `Failed to reach backend at ${config.apiBaseUrl}.`,
      });
    } finally {
      setIsPinging(false);
    }
  };

  const handleResetDemoData = () => {
    localStorage.removeItem('repomemory_mock_repositories');
    localStorage.removeItem('repomemory_mock_auth_user');
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
          Manage developer profile, backend connection parameters, and local demo environment state.
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
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                GitHub Linked
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Backend & Environment Status */}
      <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-100">
            <Server className="w-4 h-4 text-emerald-400" />
            <span>Backend Integration & API Contract</span>
          </div>

          <span
            className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded font-semibold ${
              config.isMockMode
                ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
            }`}
          >
            {config.isMockMode ? 'MOCK MODE ENABLED' : 'LIVE BACKEND MODE'}
          </span>
        </div>

        <div className="space-y-3 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 p-3 rounded-lg bg-slate-950 border border-slate-800">
            <span className="text-slate-400">Configured API Base URL:</span>
            <span className="font-mono text-brand-300">{config.apiBaseUrl}</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 p-3 rounded-lg bg-slate-950 border border-slate-800">
            <span className="text-slate-400">Environment Switch:</span>
            <span className="font-mono text-slate-200">
              VITE_USE_MOCKS={config.isMockMode ? 'true' : 'false'}
            </span>
          </div>

          {pingResult && (
            <div
              className={`p-3 rounded-lg border text-xs flex items-start gap-2 ${
                pingResult.success
                  ? 'bg-emerald-950/20 border-emerald-800/60 text-emerald-300'
                  : 'bg-red-950/20 border-red-800/60 text-red-300'
              }`}
            >
              {pingResult.success ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              )}
              <span>{pingResult.message}</span>
            </div>
          )}

          <div className="pt-2 flex items-center justify-end">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleTestBackendConnection}
              isLoading={isPinging}
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Test Backend Connection
            </Button>
          </div>
        </div>
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
