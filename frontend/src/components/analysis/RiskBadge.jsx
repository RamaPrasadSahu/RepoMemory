import React from 'react';
import { ShieldAlert, ShieldCheck, AlertTriangle, HelpCircle } from 'lucide-react';
import { getRiskProps } from '../../utils/riskUtils';

export const RiskBadge = ({ level, size = 'md', showDescription = false, className = '' }) => {
  const props = getRiskProps(level);

  const getIcon = () => {
    switch (props.level) {
      case 'high':
        return ShieldAlert;
      case 'medium':
        return AlertTriangle;
      case 'low':
        return ShieldCheck;
      default:
        return HelpCircle;
    }
  };

  const Icon = getIcon();

  const sizes = {
    sm: 'text-[10px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3.5 py-1.5 gap-2 font-semibold',
  };

  return (
    <div className={`inline-flex flex-col ${className}`}>
      <span
        className={`inline-flex items-center rounded-full font-mono uppercase tracking-wide border ${props.bgColor} ${props.borderColor} ${props.textColor} ${sizes[size] || sizes.md} ${props.shadowColor}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${props.dotColor} animate-pulse`} />
        <Icon className="w-3.5 h-3.5 shrink-0" />
        <span>{props.label}</span>
      </span>

      {showDescription && (
        <p className="mt-1 text-xs text-slate-400">{props.description}</p>
      )}
    </div>
  );
};

export default RiskBadge;
