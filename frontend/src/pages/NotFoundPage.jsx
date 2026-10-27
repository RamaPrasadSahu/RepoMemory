import React from 'react';
import { Link } from 'react-router-dom';
import { FileQuestion, ArrowLeft, Home } from 'lucide-react';
import Button from '../components/common/Button';

export const NotFoundPage = () => {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 mb-6 shadow-xl">
        <FileQuestion className="w-8 h-8 text-brand-400" />
      </div>

      <h1 className="text-4xl font-extrabold text-white font-mono">404</h1>
      <h2 className="mt-2 text-lg font-semibold text-slate-200">Page Not Found</h2>
      <p className="mt-2 text-xs text-slate-400 max-w-sm leading-relaxed">
        The route you requested does not exist or has been relocated within the RepoMemory workspace.
      </p>

      <div className="mt-6 flex items-center gap-3">
        <Link to="/dashboard">
          <Button variant="primary" size="sm" leftIcon={<Home className="w-4 h-4" />}>
            Go to Dashboard
          </Button>
        </Link>
        <Link to="/">
          <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Landing Page
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
