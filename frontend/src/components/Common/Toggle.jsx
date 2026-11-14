import React from 'react';

export default function Toggle({ checked, onChange, label, disabled = false, id }) {
  const toggleId = id || `toggle-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem', opacity: disabled ? 0.5 : 1 }}>
      <label className="modern-switch" htmlFor={toggleId} style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}>
        <input 
          id={toggleId}
          type="checkbox" 
          checked={!!checked} 
          onChange={(e) => !disabled && onChange && onChange(e.target.checked)} 
          disabled={disabled}
        />
        <span className="switch-slider"></span>
      </label>
      {label && (
        <label htmlFor={toggleId} style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', cursor: disabled ? 'not-allowed' : 'pointer', fontWeight: 500, userSelect: 'none' }}>
          {label}
        </label>
      )}
    </div>
  );
}