import React from 'react';

export default function GaugeRing({ value = 0, size = 96, strokeWidth = 8, color = 'var(--accent-primary)', label = '' }) {
  const clampedValue = Math.min(Math.max(value, 0), 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (clampedValue / 100) * circumference;
  
  return (
    <div style={{ position: 'relative', width: size, height: size, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle 
          cx={size/2} 
          cy={size/2} 
          r={radius} 
          stroke="var(--bg-tertiary)" 
          strokeWidth={strokeWidth} 
          fill="none" 
        />
        <circle 
          cx={size/2} 
          cy={size/2} 
          r={radius} 
          stroke={color} 
          strokeWidth={strokeWidth} 
          fill="none" 
          strokeDasharray={circumference} 
          strokeDashoffset={offset} 
          strokeLinecap="round" 
          style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(0.16, 1, 0.3, 1)' }} 
        />
      </svg>
      <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        <span style={{ fontSize: size * 0.22, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1 }}>
          {Math.round(clampedValue)}%
        </span>
        {label && (
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: 2, letterSpacing: '0.04em' }}>
            {label}
          </span>
        )}
      </div>
    </div>
  );
}