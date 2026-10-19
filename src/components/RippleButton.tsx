import React, { useState, useCallback } from 'react';

interface Ripple {
  x: number;
  y: number;
  size: number;
  id: number;
}

interface RippleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  rippleColor?: string;
  enableScaleHover?: boolean;
}

export const RippleButton: React.FC<RippleButtonProps> = ({
  children,
  onClick,
  className = '',
  rippleColor = 'rgba(255, 255, 255, 0.4)',
  enableScaleHover = true,
  disabled,
  ...props
}) => {
  const [ripples, setRipples] = useState<Ripple[]>([]);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (disabled) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height) * 2;
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const newRipple: Ripple = {
        x,
        y,
        size,
        id: Date.now() + Math.random(),
      };

      setRipples((prev) => [...prev, newRipple]);

      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
      }, 600);

      if (onClick) {
        onClick(e);
      }
    },
    [disabled, onClick]
  );

  const hoverScaleClasses = enableScaleHover
    ? 'transition-all duration-200 ease-out hover:scale-[1.02] active:scale-[0.98]'
    : '';

  return (
    <button
      {...props}
      disabled={disabled}
      onClick={handleClick}
      className={`relative overflow-hidden select-none cursor-pointer ${hoverScaleClasses} ${className}`}
    >
      {children}
      {/* Ripple layers */}
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="absolute rounded-full animate-ripple pointer-events-none"
          style={{
            left: `${ripple.x}px`,
            top: `${ripple.y}px`,
            width: `${ripple.size}px`,
            height: `${ripple.size}px`,
            backgroundColor: rippleColor,
            zIndex: 10,
          }}
        />
      ))}
    </button>
  );
};
