import React from 'react';
import { CheckCircle2, Clock, Loader2, XCircle } from 'lucide-react';

export const AnalysisStatus = ({ status, className = '' }) => {
  const norm = (status || 'pending').toLowerCase();

  switch (norm) {
    case 'completed':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 ${className}`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Analysis Complete</span>
        </span>
      );
    case 'running':
    case 'in_progress':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-brand-500/10 text-brand-400 border border-brand-500/30 ${className}`}
        >
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span>Analyzing AST...</span>
        </span>
      );
    case 'failed':
    case 'error':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/30 ${className}`}
        >
          <XCircle className="w-3.5 h-3.5" />
          <span>Analysis Failed</span>
        </span>
      );
    case 'queued':
    case 'pending':
    default:
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700 ${className}`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Queued</span>
        </span>
      );
  }
};

export default AnalysisStatus;
