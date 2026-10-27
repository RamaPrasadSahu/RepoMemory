import React, { useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { Brain, Tag, CheckCircle2, FileCode } from 'lucide-react';

export const CreateMemoryModal = ({ isOpen, onClose, onSave, repositoryName = 'Repository' }) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Architecture');
  const [status, setStatus] = useState('Accepted');
  const [author, setAuthor] = useState('');
  const [context, setContext] = useState('');
  const [decision, setDecision] = useState('');
  const [consequences, setConsequences] = useState('');
  const [filePath, setFilePath] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title is required.');
      return;
    }
    if (!decision.trim()) {
      setError('Decision description is required.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const affectedSymbols = filePath.trim()
        ? [
            {
              path: filePath.trim(),
              type: 'module',
              symbol: 'Primary Component',
            },
          ]
        : [];

      await onSave({
        title: title.trim(),
        category,
        status,
        author: author.trim() || 'Engineering Team',
        context: context.trim(),
        decision: decision.trim(),
        consequences: consequences.trim(),
        affectedSymbols,
      });

      // Reset form on success
      setTitle('');
      setContext('');
      setDecision('');
      setConsequences('');
      setFilePath('');
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save architectural decision record.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Architectural Decision"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400">
            {error}
          </div>
        )}

        {/* Title */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Decision Title <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. ADR 005: Adopt Redis Caching for User Roles"
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500"
            required
          />
        </div>

        {/* Category, Status, Author Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-brand-500"
            >
              <option value="Architecture">Architecture</option>
              <option value="Security">Security</option>
              <option value="Performance">Performance</option>
              <option value="Integration">Integration</option>
              <option value="Data Modeling">Data Modeling</option>
              <option value="Refactoring">Refactoring</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-brand-500"
            >
              <option value="Accepted">Accepted</option>
              <option value="Proposed">Proposed</option>
              <option value="Deprecated">Deprecated</option>
              <option value="Superseded">Superseded</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Author</label>
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="e.g. Sarah Chen"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500"
            />
          </div>
        </div>

        {/* Context */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Context & Problem Statement
          </label>
          <textarea
            value={context}
            onChange={(e) => setContext(e.target.value)}
            rows={2}
            placeholder="What technical problem or architectural pressure prompted this decision?"
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500 font-sans"
          />
        </div>

        {/* Decision */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Decision Taken & Rationale <span className="text-red-400">*</span>
          </label>
          <textarea
            value={decision}
            onChange={(e) => setDecision(e.target.value)}
            rows={3}
            placeholder="Describe the solution adopted and why this specific approach was selected."
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500 font-sans"
            required
          />
        </div>

        {/* Consequences */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Consequences & Trade-offs
          </label>
          <textarea
            value={consequences}
            onChange={(e) => setConsequences(e.target.value)}
            rows={2}
            placeholder="What are the downstream impacts, trade-offs, or migration tasks?"
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500 font-sans"
          />
        </div>

        {/* Primary Associated File */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Associated File Path (Optional)
          </label>
          <input
            type="text"
            value={filePath}
            onChange={(e) => setFilePath(e.target.value)}
            placeholder="e.g. src/middleware/authMiddleware.js"
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500"
          />
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
            Save Decision Record
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateMemoryModal;
