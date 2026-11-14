import React from 'react';
import GaugeRing from '../Common/GaugeRing';
import { getStatusColor, getStatusLabel } from '../../utils/formatters';

export default function SystemCard({ title, value, total, thresholds = { warn: 60, crit: 85 } }) {
  const color = getStatusColor(value, thresholds);
  const critical = value >= thresholds.crit;

  return (
    <div className={`card ${critical ? 'pulse' : ''}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '1.5rem' }}>
      <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>{title}</h3>
      <GaugeRing value={value} color={color} size={110} strokeWidth={9} />
      <div style={{ textAlign: 'center' }}>
        <p style={{ color, fontWeight: 700, fontSize: '0.86rem' }}>
          {getStatusLabel(value, thresholds)}
        </p>
        {total && (
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            {total}
          </p>
        )}
      </div>
    </div>
  );
}