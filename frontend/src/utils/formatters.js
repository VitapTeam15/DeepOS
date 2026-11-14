export const formatBytes = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024, sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
export const formatPercent = (val) => `${Number(val).toFixed(1)}%`;
export const formatDuration = (sec) => {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return `${h}h ${m}m`;
};
export const formatTime = (ts) => new Date(ts).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
export const getStatusColor = (val, { warn, crit }) => val >= crit ? 'var(--danger)' : val >= warn ? 'var(--warning)' : 'var(--success)';
export const getStatusLabel = (val, { warn, crit }) => val >= crit ? 'Critical' : val >= warn ? 'Warning' : 'Normal';
