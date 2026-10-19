import React from 'react';
import type { Language } from '../types';

interface FlagProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Authentic 4-color Google "G" brand icon
 */
export const GoogleIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    width="24"
    height="24"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
    />
  </svg>
);

/**
 * United States Flag (for English)
 */
export const USFlag: React.FC<FlagProps> = ({ className = 'w-6 h-4' }) => (
  <svg
    viewBox="0 0 640 480"
    className={`${className} inline-block rounded-xs overflow-hidden shadow-2xs shrink-0`}
    xmlns="http://www.w3.org/2000/svg"
  >
    <g fillRule="evenodd">
      {/* 13 stripes */}
      <path fill="#bd3d44" d="M0 0h640v480H0z" />
      <path
        stroke="#fff"
        strokeWidth="37"
        d="M0 55.5h640M0 129.5h640M0 203.5h640M0 277.5h640M0 351.5h640M0 425.5h640"
      />
      {/* Canton */}
      <path fill="#192f5d" d="M0 0h256v258.5H0z" />
      {/* Stars pattern */}
      <g fill="#fff">
        <circle cx="32" cy="24" r="9" />
        <circle cx="76" cy="24" r="9" />
        <circle cx="120" cy="24" r="9" />
        <circle cx="164" cy="24" r="9" />
        <circle cx="208" cy="24" r="9" />

        <circle cx="54" cy="50" r="9" />
        <circle cx="98" cy="50" r="9" />
        <circle cx="142" cy="50" r="9" />
        <circle cx="186" cy="50" r="9" />

        <circle cx="32" cy="76" r="9" />
        <circle cx="76" cy="76" r="9" />
        <circle cx="120" cy="76" r="9" />
        <circle cx="164" cy="76" r="9" />
        <circle cx="208" cy="76" r="9" />

        <circle cx="54" cy="102" r="9" />
        <circle cx="98" cy="102" r="9" />
        <circle cx="142" cy="102" r="9" />
        <circle cx="186" cy="102" r="9" />

        <circle cx="32" cy="128" r="9" />
        <circle cx="76" cy="128" r="9" />
        <circle cx="120" cy="128" r="9" />
        <circle cx="164" cy="128" r="9" />
        <circle cx="208" cy="128" r="9" />

        <circle cx="54" cy="154" r="9" />
        <circle cx="98" cy="154" r="9" />
        <circle cx="142" cy="154" r="9" />
        <circle cx="186" cy="154" r="9" />

        <circle cx="32" cy="180" r="9" />
        <circle cx="76" cy="180" r="9" />
        <circle cx="120" cy="180" r="9" />
        <circle cx="164" cy="180" r="9" />
        <circle cx="208" cy="180" r="9" />

        <circle cx="54" cy="206" r="9" />
        <circle cx="98" cy="206" r="9" />
        <circle cx="142" cy="206" r="9" />
        <circle cx="186" cy="206" r="9" />

        <circle cx="32" cy="232" r="9" />
        <circle cx="76" cy="232" r="9" />
        <circle cx="120" cy="232" r="9" />
        <circle cx="164" cy="232" r="9" />
        <circle cx="208" cy="232" r="9" />
      </g>
    </g>
  </svg>
);

/**
 * Myanmar Flag
 */
export const MyanmarFlag: React.FC<FlagProps> = ({ className = 'w-6 h-4' }) => (
  <svg
    viewBox="0 0 640 480"
    className={`${className} inline-block rounded-xs overflow-hidden shadow-2xs shrink-0`}
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* 3 horizontal stripes: Yellow, Green, Red */}
    <path fill="#fecb00" d="M0 0h640v160H0z" />
    <path fill="#34b233" d="M0 160h640v160H0z" />
    <path fill="#ea2839" d="M0 320h640v160H0z" />
    {/* Large 5-pointed white star centered */}
    <polygon
      fill="#fff"
      points="320,84 359,203 484,203 383,277 421,396 320,323 219,396 257,277 156,203 281,203"
    />
  </svg>
);

/**
 * Thailand Flag
 */
export const ThailandFlag: React.FC<FlagProps> = ({ className = 'w-6 h-4' }) => (
  <svg
    viewBox="0 0 640 480"
    className={`${className} inline-block rounded-xs overflow-hidden shadow-2xs shrink-0`}
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Red, White, Blue, White, Red stripes (1:1:2:1:1) */}
    <path fill="#a51931" d="M0 0h640v80H0z" />
    <path fill="#f4f5f8" d="M0 80h640v80H0z" />
    <path fill="#2d2a4a" d="M0 160h640v160H0z" />
    <path fill="#f4f5f8" d="M0 320h640v80H0z" />
    <path fill="#a51931" d="M0 400h640v80H0z" />
  </svg>
);

/**
 * China Flag
 */
export const ChinaFlag: React.FC<FlagProps> = ({ className = 'w-6 h-4' }) => (
  <svg
    viewBox="0 0 640 480"
    className={`${className} inline-block rounded-xs overflow-hidden shadow-2xs shrink-0`}
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Red field */}
    <path fill="#de2910" d="M0 0h640v480H0z" />
    {/* Large star */}
    <polygon
      fill="#ffde00"
      points="107,48 120,87 161,87 128,111 140,150 107,126 73,150 86,111 53,87 94,87"
    />
    {/* 4 small stars rotated toward main star */}
    <polygon
      fill="#ffde00"
      points="213,38 217,50 230,50 219,57 223,70 213,62 202,70 206,57 196,50 209,50"
      transform="rotate(10 213 54)"
    />
    <polygon
      fill="#ffde00"
      points="256,86 260,98 273,98 262,105 266,118 256,110 245,118 249,105 239,98 252,98"
      transform="rotate(-15 256 102)"
    />
    <polygon
      fill="#ffde00"
      points="256,154 260,166 273,166 262,173 266,186 256,178 245,186 249,173 239,166 252,166"
      transform="rotate(25 256 170)"
    />
    <polygon
      fill="#ffde00"
      points="213,202 217,214 230,214 219,221 223,234 213,226 202,234 206,221 196,214 209,214"
      transform="rotate(50 213 218)"
    />
  </svg>
);

export const CountryFlag: React.FC<{ language: Language; className?: string }> = ({
  language,
  className,
}) => {
  switch (language) {
    case 'en':
      return <USFlag className={className} />;
    case 'my':
      return <MyanmarFlag className={className} />;
    case 'th':
      return <ThailandFlag className={className} />;
    case 'zh':
      return <ChinaFlag className={className} />;
    default:
      return <USFlag className={className} />;
  }
};
