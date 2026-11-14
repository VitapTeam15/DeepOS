import React from 'react';

export default function StatusBadge({ status, label, withDot = true, size = 'md' }) {
  if (!status) return null;
  const s = String(status).toLowerCase();
  
  let variant = 'info';
  if (['normal', 'active', 'online', 'healthy', 'success', 'running'].includes(s)) {
    variant = 'success';
  } else if (['warning', 'moderate', 'elevated', 'busy'].includes(s)) {
    variant = 'warning';
  } else if (['critical', 'danger', 'error', 'offline', 'stopped'].includes(s)) {
    variant = 'danger';
  } else if (['primary', 'ai', 'predicting'].includes(s)) {
    variant = 'primary';
  }

  const displayText = label || status;

  return (
    <span className={`badge badge-${variant} ${size === 'sm' ? 'badge-sm' : ''}`}>
      {withDot && (
        <span 
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            backgroundColor: 'currentColor',
            display: 'inline-block'
          }} 
        />
      )}
      <span>{displayText}</span>
    </span>
  );
}