import React from 'react';

export function CardSkeleton({ height = '180px', count = 1 }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card skeleton" style={{ height, marginBottom: '1rem', border: '1px solid var(--border-subtle)' }} />
      ))}
    </>
  );
}

export function MetricSkeleton() {
  return (
    <div className="card skeleton" style={{ height: '110px' }} />
  );
}

export function TableSkeleton({ rows = 5, cols = 5 }) {
  return (
    <div className="table-container p-3">
      <div className="skeleton" style={{ height: '36px', marginBottom: '12px' }} />
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="skeleton" style={{ height: '28px', marginBottom: '8px', opacity: 0.6 }} />
      ))}
    </div>
  );
}

export default function LoadingSkeleton({ type = 'card', ...props }) {
  if (type === 'metric') return <MetricSkeleton {...props} />;
  if (type === 'table') return <TableSkeleton {...props} />;
  return <CardSkeleton {...props} />;
}
