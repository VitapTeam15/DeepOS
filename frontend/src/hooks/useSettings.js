import { useState, useEffect, useCallback } from 'react';
import { getSettings, updateSettings as apiUpdateSettings } from '../services/api';

export const useSettings = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSettings = useCallback(async () => {
    try {
      const data = await getSettings();
      setSettings(data.settings || data);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to fetch settings');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSettings = async (updates) => {
    try {
      await apiUpdateSettings(updates);
      setSettings(prev => ({ ...prev, ...updates }));
      return true;
    } catch (err) {
      setError(err.message || 'Failed to update settings');
      return false;
    }
  };

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return { settings, loading, error, updateSettings, refetch: fetchSettings };
};