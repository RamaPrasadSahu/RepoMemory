import React from 'react';
import { Loader2 } from 'lucide-react';

export const Button = React.forwardRef(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled = false,
      leftIcon,
      rightIcon,
      className = '',
      type = 'button',
      onClick,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]';

    const variants = {
      primary:
        'bg-brand-600 hover:bg-brand-500 text-white shadow-sm hover:shadow-glow-brand focus:ring-brand-500 border border-brand-500/40',
      secondary:
        'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/80 hover:border-slate-600 focus:ring-slate-500',
      danger:
        'bg-red-600/90 hover:bg-red-600 text-white shadow-sm hover:shadow-glow-red focus:ring-red-500 border border-red-500/40',
      ghost:
        'bg-transparent hover:bg-slate-800/80 text-slate-300 hover:text-white focus:ring-slate-500',
      outline:
        'bg-transparent hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 focus:ring-slate-500',
      subtle:
        'bg-slate-900/60 hover:bg-slate-800 text-slate-300 border border-slate-800 focus:ring-brand-500',
    };

    const sizes = {
      xs: 'text-xs px-2.5 py-1 gap-1.5',
      sm: 'text-xs px-3 py-1.5 gap-2',
      md: 'text-sm px-4 py-2 gap-2',
      lg: 'text-base px-5 py-2.5 gap-2.5',
    };

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        onClick={onClick}
        className={`${baseStyles} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin shrink-0 text-current" />
        ) : (
          leftIcon && <span className="shrink-0">{leftIcon}</span>
        )}
        <span>{children}</span>
        {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
export default Button;
