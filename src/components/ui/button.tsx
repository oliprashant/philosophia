'use client';

import * as React from 'react';

type ButtonVariant = 'default' | 'outline' | 'destructive' | 'ghost';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'default', type = 'button', ...props }, ref) => {
    const variantClass =
      variant === 'outline'
        ? 'border border-[var(--border)] bg-transparent text-[var(--text-primary)] hover:border-[var(--accent)] hover:text-[var(--accent)]'
        : variant === 'destructive'
          ? 'bg-red-600 text-white hover:bg-red-700'
          : variant === 'ghost'
            ? 'bg-transparent text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'
            : 'bg-[var(--text-primary)] text-[var(--bg-primary)] hover:bg-[var(--accent)]';

    return (
      <button
        ref={ref}
        type={type}
        className={`inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${variantClass} ${className}`}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';
