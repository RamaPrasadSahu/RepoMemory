import React from 'react';
import { AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react';
import Button from './Button';
import { Link } from 'react-router-dom';

export const ErrorState = ({
  title = 'Something went wrong',
  message = 'An unexpected error occurred while loading this view.',
  code,
  details,
  onRetry,
  backUrl,
  backLabel = 'Go Back',
  className = '',
}) => {
  return (
    <div
      className={`p-6 sm:p-8 rounded-xl border border-red-500/20 bg-red-950/10 text-center max-w-xl mx-auto my-6 ${className}`}
    >
      <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
        <AlertTriangle className="w-6 h-6" />
      </div>

      <h3 className="text-base font-semibold text-slate-100">{title}</h3>
      <p className="mt-1 text-sm text-slate-400 leading-relaxed">{message}</p>

      {code && (
        <div className="mt-3 inline-block px-2.5 py-1 bg-slate-900 border border-slate-800 rounded font-mono text-xs text-red-400">
          CODE: {code}
        </div>
      )}

      {details && (
        <details className="mt-4 text-left">
          <summary className="text-xs text-slate-400 hover:text-slate-200 cursor-pointer select-none">
            Technical diagnostics
          </summary>
          <pre className="mt-2 p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-400 overflow-x-auto whitespace-pre-wrap">
            {typeof details === 'object' ? JSON.stringify(details, null, 2) : String(details)}
          </pre>
        </details>
      )}

      <div className="mt-6 flex items-center justify-center gap-3">
        {onRetry && (
          <Button variant="secondary" size="sm" onClick={onRetry} leftIcon={<RefreshCw className="w-3.5 h-3.5" />}>
            Retry Request
          </Button>
        )}
        {backUrl && (
          <Link to={backUrl}>
            <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}>
              {backLabel}
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
};

export default ErrorState;
