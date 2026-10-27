import React from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingState = ({
  message = 'Analyzing dependency graph...',
  subtext = 'Tracing AST call expressions and module imports',
  className = '',
  fullscreen = false,
}) => {
  const content = (
    <div className={`flex flex-col items-center justify-center text-center p-8 ${className}`}>
      <div className="relative mb-4">
        <div className="w-12 h-12 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
        <div className="absolute inset-0 rounded-xl bg-brand-500/20 blur-md -z-10 animate-pulse" />
      </div>
      <h4 className="text-sm font-medium text-slate-200">{message}</h4>
      {subtext && <p className="mt-1 text-xs text-slate-400 max-w-sm">{subtext}</p>}
    </div>
  );

  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-sm">
        {content}
      </div>
    );
  }

  return content;
};

export default LoadingState;
