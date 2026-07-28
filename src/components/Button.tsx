import type { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  ...props 
}: ButtonProps) => {
  
  const baseClasses = 'inline-flex items-center justify-center rounded-[var(--radius-sm)] font-bold transition-all duration-200 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer';

  const sizeClasses = {
    sm: 'h-8 px-4 text-xs',
    md: 'h-11 px-5 py-2 text-sm shadow-sm',
    lg: 'h-14 px-8 py-3 text-base shadow-md',
  };
  
  const getStyle = () => {
    switch (variant) {
      case 'primary': return { backgroundColor: 'var(--color-primary)', color: 'var(--text-inverse)' };
      case 'secondary': return { backgroundColor: 'var(--color-secondary)', color: 'var(--text-inverse)' };
      case 'danger': return { backgroundColor: 'var(--color-danger)', color: 'var(--text-inverse)' };
      case 'ghost': return { backgroundColor: 'transparent', color: 'var(--color-primary)' };
    }
  };

  return (
    <button 
      className={`${baseClasses} ${sizeClasses[size]} ${className}`}
      style={getStyle()}
      {...props}
    >
      {children}
    </button>
  );
};
