import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  glass?: boolean;
  style?: React.CSSProperties;
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
}

export const Card: React.FC<CardProps> = ({ children, className = '', glass = true, style, onClick }) => {
  return (
    <div onClick={onClick} className={`${glass ? 'glass' : 'bg-surface-solid border-subtle shadow-md'} rounded-[var(--radius-lg)] p-8 ${className} transition-all duration-300 hover:shadow-xl hover:-translate-y-1 relative overflow-hidden`} style={style}>
      {children}
    </div>
  );
};
