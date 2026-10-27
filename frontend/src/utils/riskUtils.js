/**
 * Risk, node status, and impact visual classification helpers.
 */

export const RISK_LEVELS = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
};

export const getRiskProps = (level) => {
  const normalized = (level || '').toLowerCase();

  switch (normalized) {
    case 'high':
      return {
        level: 'high',
        label: 'High Risk',
        bgColor: 'bg-red-500/10',
        borderColor: 'border-red-500/30',
        textColor: 'text-red-400',
        dotColor: 'bg-red-500',
        shadowColor: 'shadow-glow-red',
        description: 'Changes touch critical paths or widely imported interfaces with high regression probability.',
      };
    case 'medium':
      return {
        level: 'medium',
        label: 'Medium Risk',
        bgColor: 'bg-amber-500/10',
        borderColor: 'border-amber-500/30',
        textColor: 'text-amber-400',
        dotColor: 'bg-amber-500',
        shadowColor: 'shadow-glow-amber',
        description: 'Changes propagate to dependent modules or test coverage gaps exist.',
      };
    case 'low':
      return {
        level: 'low',
        label: 'Low Risk',
        bgColor: 'bg-emerald-500/10',
        borderColor: 'border-emerald-500/30',
        textColor: 'text-emerald-400',
        dotColor: 'bg-emerald-500',
        shadowColor: 'shadow-glow-emerald',
        description: 'Changes are isolated or well-covered with minimal downstream ripple effect.',
      };
    default:
      return {
        level: 'unknown',
        label: 'Unknown',
        bgColor: 'bg-slate-500/10',
        borderColor: 'border-slate-500/30',
        textColor: 'text-slate-400',
        dotColor: 'bg-slate-400',
        shadowColor: '',
        description: 'Risk level not yet assessed or unavailable.',
      };
  }
};

export const getNodeStatusProps = (status) => {
  const normalized = (status || '').toLowerCase();

  switch (normalized) {
    case 'changed':
      return {
        status: 'changed',
        label: 'Changed in PR',
        bgColor: 'bg-brand-500/15',
        borderColor: 'border-brand-500',
        textColor: 'text-brand-300',
        badgeBg: 'bg-brand-500/20 text-brand-300 border-brand-500/40',
        glow: 'shadow-glow-brand',
        chipColor: '#818cf8',
      };
    case 'affected':
      return {
        status: 'affected',
        label: 'Potentially Affected',
        bgColor: 'bg-amber-500/15',
        borderColor: 'border-amber-500',
        textColor: 'text-amber-300',
        badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        glow: 'shadow-glow-amber',
        chipColor: '#f59e0b',
      };
    case 'unaffected':
    default:
      return {
        status: 'unaffected',
        label: 'Unaffected Context',
        bgColor: 'bg-slate-900/60',
        borderColor: 'border-slate-700/60',
        textColor: 'text-slate-400',
        badgeBg: 'bg-slate-800 text-slate-400 border-slate-700',
        glow: '',
        chipColor: '#64748b',
      };
  }
};

export const getNodeTypeDetails = (type) => {
  const normalized = (type || 'file').toLowerCase();

  switch (normalized) {
    case 'route':
    case 'api route':
      return { label: 'API Route', color: 'text-purple-400', bg: 'bg-purple-950/40 border-purple-800/40' };
    case 'controller':
      return { label: 'Controller', color: 'text-blue-400', bg: 'bg-blue-950/40 border-blue-800/40' };
    case 'model':
      return { label: 'Model', color: 'text-emerald-400', bg: 'bg-emerald-950/40 border-emerald-800/40' };
    case 'service':
      return { label: 'Service', color: 'text-indigo-400', bg: 'bg-indigo-950/40 border-indigo-800/40' };
    case 'test':
      return { label: 'Test Suite', color: 'text-cyan-400', bg: 'bg-cyan-950/40 border-cyan-800/40' };
    case 'middleware':
      return { label: 'Middleware', color: 'text-orange-400', bg: 'bg-orange-950/40 border-orange-800/40' };
    case 'external':
    case 'external dependency':
      return { label: 'External', color: 'text-slate-400', bg: 'bg-slate-900 border-slate-700' };
    case 'module':
      return { label: 'Module', color: 'text-sky-400', bg: 'bg-sky-950/40 border-sky-800/40' };
    case 'file':
    default:
      return { label: 'File', color: 'text-slate-300', bg: 'bg-slate-900 border-slate-800' };
  }
};

export const getImpactSeverityProps = (severity) => {
  const norm = (severity || 'direct').toLowerCase();
  switch (norm) {
    case 'direct':
      return { label: 'Direct Downstream', badge: 'bg-red-500/10 text-red-400 border-red-500/30' };
    case 'transitive':
    case 'indirect':
      return { label: 'Transitive Ripple', badge: 'bg-amber-500/10 text-amber-400 border-amber-500/30' };
    case 'test_coverage':
    case 'test':
      return { label: 'Test Dependency', badge: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' };
    default:
      return { label: 'Potential Impact', badge: 'bg-slate-800 text-slate-300 border-slate-700' };
  }
};
