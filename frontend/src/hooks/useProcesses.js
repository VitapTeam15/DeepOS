import { useState, useEffect, useCallback } from 'react';
import { getProcesses } from '../services/api';

export const useProcesses = () => {
  const [processes, setProcesses] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProcesses = useCallback(async () => {
    try {
      const data = await getProcesses();
      const procs = data.processes || [];
      setProcesses(procs);
      setTotalCount(data.total_count || procs.length);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to fetch processes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProcesses();
    const interval = setInterval(fetchProcesses, 5000);
    return () => clearInterval(interval);
  }, [fetchProcesses]);

  return { processes, totalCount, loading, error, refetch: fetchProcesses };
};