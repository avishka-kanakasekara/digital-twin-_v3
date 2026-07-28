import React from 'react';

interface ProgressRingProps {
  value: number;
  maxValue?: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  label?: string;
  sublabel?: string;
  className?: string;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  value,
  maxValue = 100,
  size = 120,
  strokeWidth = 8,
  color = 'var(--color-primary)',
  label,
  sublabel,
  className = '',
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percentage = Math.min(100, Math.max(0, (value / maxValue) * 100));
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div
      className={`flex flex-col items-center gap-2 ${className}`}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={maxValue}
      aria-label={label ?? `${value} of ${maxValue}`}
    >
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--border-subtle)"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-black text-primary">{Math.round(percentage)}</span>
          {sublabel && (
            <span className="text-[9px] font-bold text-tertiary uppercase tracking-wider">{sublabel}</span>
          )}
        </div>
      </div>
      {label && (
        <span className="text-xs font-bold text-secondary text-center leading-tight">{label}</span>
      )}
    </div>
  );
};
