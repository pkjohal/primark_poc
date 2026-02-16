// Reusable button component

import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'outline';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isLoading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, disabled, ...props }, ref) => {
    const baseClasses = 'font-semibold rounded-lg shadow-md active:scale-95 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100';

    const variantClasses = {
      primary: 'bg-primark-blue text-white hover:bg-primark-blue/90',
      secondary: 'bg-primark-navy text-white hover:bg-primark-navy/90',
      danger: 'bg-primark-red text-white hover:bg-primark-red/90',
      success: 'bg-primark-green text-white hover:bg-primark-green/90',
      outline: 'border-2 border-primark-blue text-primark-blue bg-white hover:bg-primark-light-blue',
    };

    const sizeClasses = {
      sm: 'min-h-[40px] px-3 text-sm',
      md: 'min-h-[48px] px-4 text-base',
      lg: 'min-h-[56px] px-6 text-lg',
      xl: 'min-h-[72px] px-8 text-xl',
    };

    return (
      <button
        ref={ref}
        className={cn(baseClasses, variantClasses[variant], sizeClasses[size], className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <div className="flex items-center justify-center gap-2">
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span>Loading...</span>
          </div>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
