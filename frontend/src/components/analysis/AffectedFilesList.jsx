import React, { useState } from 'react';
import {
  FileCode,
  ArrowRight,
  ExternalLink,
  ShieldAlert,
  Search,
  Filter,
} from 'lucide-react';
import { getImpactSeverityProps, getNodeTypeDetails } from '../../utils/riskUtils';
import SearchInput from '../common/SearchInput';
import EmptyState from '../common/EmptyState';

export const AffectedFilesList = ({
  files = [],
  selectedFileId,
  onSelectFile,
  className = '',
}) => {
  const [search, setSearch] = useState('');
  const [classificationFilter, setClassificationFilter] = useState('all');

  const filtered = files.filter((item) => {
    const query = search.toLowerCase();
    const matchesQuery =
      !query ||
      item.path.toLowerCase().includes(query) ||
      (item.reason && item.reason.toLowerCase().includes(query));

    const matchesClass =
      classificationFilter === 'all' ||
      item.classification === classificationFilter;

    return matchesQuery && matchesClass;
  });

  return (
    <div className={`flex flex-col space-y-3 ${className}`}>
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        <SearchInput
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter affected files..."
          className="flex-1"
        />

        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs shrink-0">
          <Filter className="w-3.5 h-3.5 text-slate-400 ml-1.5" />
          {['all', 'direct', 'transitive', 'test_coverage'].map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setClassificationFilter(type)}
              className={`px-2 py-0.5 rounded text-[11px] capitalize transition-colors ${
                classificationFilter === type
                  ? 'bg-brand-600 text-white font-medium'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {type === 'test_coverage' ? 'Tests' : type}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={FileCode}
          title="No Affected Files Match"
          description="Adjust your search query or impact classification filters."
        />
      ) : (
        <div className="space-y-2.5 max-h-[580px] overflow-y-auto pr-1">
          {filtered.map((file) => {
            const isSelected = selectedFileId === file.path;
            const severityProps = getImpactSeverityProps(file.classification);
            const typeDetails = getNodeTypeDetails(file.type);

            return (
              <div
                key={file.path}
                onClick={() => onSelectFile && onSelectFile(file)}
                className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-amber-500/10 border-amber-500/80 shadow-glow-amber ring-1 ring-amber-500/40'
                    : 'bg-slate-900/80 hover:bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* File Header */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${typeDetails.bg} ${typeDetails.color}`}
                      >
                        {typeDetails.label}
                      </span>
                      <span className="font-semibold text-xs text-slate-100 truncate">
                        {file.path.split('/').pop()}
                      </span>
                    </div>
                    <div className="font-mono text-[11px] text-slate-400 truncate mt-0.5">
                      {file.path}
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-mono uppercase tracking-wider font-semibold px-2 py-0.5 rounded border shrink-0 ${severityProps.badge}`}
                  >
                    {severityProps.label}
                  </span>
                </div>

                {/* Reason */}
                <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/80 text-xs text-slate-300 leading-relaxed mb-2">
                  <span className="text-amber-400 font-medium">Potential impact: </span>
                  {file.reason}
                </div>

                {/* Relationship & Evidence Footer */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-slate-400 pt-1">
                  <div className="flex items-center gap-1 text-slate-300">
                    <ArrowRight className="w-3 h-3 text-slate-400" />
                    <span>{file.relationship || 'AST Dependency'}</span>
                  </div>

                  {file.evidenceStatus && (
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 text-[10px]">
                      {file.evidenceStatus}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AffectedFilesList;
