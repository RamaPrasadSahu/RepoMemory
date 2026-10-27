import React from 'react';
import { Search, X } from 'lucide-react';

export const SearchInput = ({
  value,
  onChange,
  placeholder = 'Search...',
  className = '',
  shortcutHint,
  onClear,
  autoFocus = false,
  ...props
}) => {
  return (
    <div className={`relative flex items-center ${className}`}>
      <Search className="absolute left-3 w-4 h-4 text-slate-400 pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="w-full pl-9 pr-9 py-1.5 bg-slate-900 border border-slate-700/80 rounded-lg text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
        {...props}
      />
      {value ? (
        <button
          type="button"
          onClick={onClear || (() => onChange({ target: { value: '' } }))}
          className="absolute right-2.5 p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
          aria-label="Clear search"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      ) : (
        shortcutHint && (
          <kbd className="absolute right-2.5 px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-800 border border-slate-700 rounded select-none pointer-events-none">
            {shortcutHint}
          </kbd>
        )
      )}
    </div>
  );
};

export default SearchInput;
