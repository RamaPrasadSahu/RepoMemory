import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import {
  FileCode,
  Globe,
  Database,
  Cpu,
  TestTube,
  ShieldCheck,
  Package,
  Layers,
} from 'lucide-react';
import { getNodeStatusProps, getNodeTypeDetails } from '../../utils/riskUtils';

const getNodeIcon = (type) => {
  const norm = (type || '').toLowerCase();
  switch (norm) {
    case 'route':
    case 'api route':
      return Globe;
    case 'controller':
      return Cpu;
    case 'model':
      return Database;
    case 'service':
      return Layers;
    case 'test':
      return TestTube;
    case 'middleware':
      return ShieldCheck;
    case 'external':
      return Package;
    default:
      return FileCode;
  }
};

export const DependencyNode = memo(({ data, selected }) => {
  const statusProps = getNodeStatusProps(data.status);
  const typeDetails = getNodeTypeDetails(data.type);
  const Icon = getNodeIcon(data.type);

  const isChanged = data.status === 'changed';
  const isAffected = data.status === 'affected';

  return (
    <div
      className={`relative min-w-[220px] max-w-[280px] rounded-xl border bg-slate-900/95 p-3.5 shadow-node transition-all select-none ${
        selected
          ? 'border-cyan-400 ring-2 ring-cyan-400/40 shadow-glow-brand scale-[1.02]'
          : isChanged
          ? 'border-brand-500/80 shadow-glow-brand'
          : isAffected
          ? 'border-amber-500/80 shadow-glow-amber'
          : 'border-slate-800 hover:border-slate-700'
      }`}
    >
      {/* React Flow Handles */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-2.5 !h-2.5 !bg-slate-400 !border-2 !border-slate-950 !rounded-full hover:!bg-brand-400 transition-colors"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!w-2.5 !h-2.5 !bg-slate-400 !border-2 !border-slate-950 !rounded-full hover:!bg-brand-400 transition-colors"
      />

      {/* Header: Node Type & Status Pill */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <span
          className={`inline-flex items-center gap-1 text-[10px] font-mono font-medium px-2 py-0.5 rounded border ${typeDetails.bg} ${typeDetails.color}`}
        >
          <Icon className="w-3 h-3" />
          {typeDetails.label}
        </span>

        <span
          className={`text-[9px] font-mono uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded border ${statusProps.badgeBg}`}
        >
          {data.status || 'unaffected'}
        </span>
      </div>

      {/* Main File Title */}
      <div className="font-semibold text-xs text-slate-100 truncate tracking-tight" title={data.label || data.path}>
        {data.label || data.path?.split('/').pop()}
      </div>

      {/* File Path */}
      <div className="text-[10px] text-slate-400 font-mono truncate mt-0.5" title={data.path}>
        {data.path || ''}
      </div>

      {/* Metadata / Diff indicator */}
      {data.metadata && (data.metadata.additions !== undefined || data.metadata.deletions !== undefined) && (
        <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono">
          <span className="text-slate-400">Diff stats</span>
          <div className="flex items-center gap-1.5">
            {data.metadata.additions > 0 && (
              <span className="text-emerald-400">+{data.metadata.additions}</span>
            )}
            {data.metadata.deletions > 0 && (
              <span className="text-red-400">-{data.metadata.deletions}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

DependencyNode.displayName = 'DependencyNode';
export default DependencyNode;
