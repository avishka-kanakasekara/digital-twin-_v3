import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  glass?: boolean;
  style?: React.CSSProperties;
}

export const Card: React.FC<CardProps> = ({ children, className = '', glass = true, style }) => {
  return (
    <div className={`${glass ? 'glass' : 'bg-surface-solid border-subtle shadow-md'} rounded-[var(--radius-lg)] p-8 ${className} transition-all duration-300 hover:shadow-xl hover:-translate-y-1 relative overflow-hidden`} style={style}>
      {children}
    </div>
  );
};
