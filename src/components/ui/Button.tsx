// Button Component

import { ButtonHTMLAttributes, forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'default' | 'outline' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
}

const variantStyles = {
    default: 'bg-gray-700 hover:bg-gray-600 text-gray-100 border-gray-600',
    outline: 'bg-transparent hover:bg-gray-800 text-gray-300 border-gray-600',
    ghost: 'bg-transparent hover:bg-gray-800 text-gray-300 border-transparent',
    danger: 'bg-red-600/20 hover:bg-red-600/30 text-red-400 border-red-600/30',
};

const sizeStyles = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className = '', variant = 'default', size = 'md', disabled, children, ...props }, ref) => {
        return (
            <button
                ref={ref}
                disabled={disabled}
                className={`
          inline-flex items-center justify-center
          font-medium rounded border
          transition-colors duration-150
          focus:outline-none focus:ring-2 focus:ring-blue-500/50
          disabled:opacity-50 disabled:cursor-not-allowed
          ${variantStyles[variant]}
          ${sizeStyles[size]}
          ${className}
        `}
                {...props}
            >
                {children}
            </button>
        );
    }
);

Button.displayName = 'Button';
