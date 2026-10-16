import React from 'react';

interface ProgressRingProps {
  /** 0-100. Null = indeterminate (spinner). */
  pct: number | null;
  size?: number;
  strokeWidth?: number;
  trackClassName?: string;
  barClassName?: string;
}

/** Circular progress ring with a real percentage. */
export const ProgressRing: React.FC<ProgressRingProps> = ({
  pct,
  size = 22,
  strokeWidth = 2.5,
  trackClassName = 'text-slate-200',
  barClassName = 'text-sky-600',
}) => {
  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;
  const clamped = pct === null ? 25 : Math.min(100, Math.max(0, pct));
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={pct === null ? 'animate-spin' : '-rotate-90'}
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        className={trackClassName}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c - (c * clamped) / 100}
        className={`${barClassName} transition-all duration-300`}
      />
    </svg>
  );
};
