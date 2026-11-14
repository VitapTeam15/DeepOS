import { useState, useEffect, useCallback } from 'react';
import { getPrediction, launchApplication, speakPrediction } from '../services/api';

export const usePrediction = () => {
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Visible error shown in-app when a toast-triggered launch fails
  const [launchToastError, setLaunchToastError] = useState(null);

  // ── Listen for notification-action IPC events from Electron ───────────────
  // Fires when the user clicks "Open Application" on a Windows toast.
  useEffect(() => {
    if (window.electronAPI && window.electronAPI.onNotificationAction) {
      window.electronAPI.onNotificationAction((actionApp) => {
        console.log(`[APP_LAUNCH] Toast action received — launching: '${actionApp}'`);
        launchApplication(actionApp)
          .then((result) => {
            console.log(`[APP_LAUNCH] Launch success:`, result);
            setLaunchToastError(null);
          })
          .catch((err) => {
            const msg = err?.message || String(err) || `Failed to launch '${actionApp}'`;
            console.error(`[APP_LAUNCH] Launch FAILED for '${actionApp}':`, err);
            // Surface a visible error in the app window (auto-clears after 5s)
            setLaunchToastError(`Could not open "${actionApp}": ${msg}`);
            setTimeout(() => setLaunchToastError(null), 5000);
          });
      });
    }
  }, []);

  const fetchPrediction = useCallback(async () => {
    try {
      const data = await getPrediction();
      setPrediction(data);
      setError(null);

      console.log(`[PREDICTION] Next app: ${data?.predicted_app || 'Unknown'}`);
      console.log(`[PREDICTION] Confidence: ${data?.confidence?.toFixed(2) || 0}`);
      console.log(`[PREDICTION] trigger_alert: ${data?.trigger_alert}`);

      if (data && data.predicted_app && data.predicted_app !== 'Unknown') {
        if (data.trigger_alert) {
          console.log('[RECOMMENDATION] Valid recommendation — user notification required');

          const rawName = data.predicted_app.replace(/\.exe$/i, '');
          const friendlyName = rawName.charAt(0).toUpperCase() + rawName.slice(1);
          const reason = data.reasons && data.reasons.length > 0
            ? data.reasons[0]
            : 'based on your usage patterns';

          // Use resolved executable when available, fall back to predicted_app name
          const launchTarget = data.executable || data.predicted_app;
          console.log(`[NOTIFICATION] launchTarget resolved: '${launchTarget}' (executable='${data.executable}', predicted='${data.predicted_app}')`);

          const title = '💡 Deep OS Recommendation';
          const message = `You may want to open ${friendlyName} — ${reason}.`;

          console.log(`[NOTIFICATION] Notification enabled check: ${!!window.electronAPI}`);

          // ── Visual popup (Windows Toast via node-notifier in main process) ──
          if (window.electronAPI && window.electronAPI.showPredictionNotification) {
            console.log(`[NOTIFICATION] Calling showPredictionNotification via Electron IPC (actionApp='${launchTarget}')`);
            window.electronAPI.showPredictionNotification(title, message, launchTarget);
            console.log('[NOTIFICATION] Windows toast IPC sent successfully');
          } else {
            console.warn('[NOTIFICATION] electronAPI.showPredictionNotification not available — running in browser?');
          }

          // ── Audio recommendation (backend handles AUDIO_ENABLED check) ──
          speakPrediction(message)
            .then(() => console.log('[AUDIO] speak-prediction request sent'))
            .catch(err => console.warn('[AUDIO] speak-prediction failed:', err));

        } else {
          console.log('[NOTIFICATION] Recommendation suppressed');
          console.log('[NOTIFICATION] Reason: trigger_alert=false (cooldown active or confidence too low)');
        }
      } else {
        console.log('[PREDICTION] No valid prediction — skipping notification');
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch prediction');
      console.error('[PREDICTION] fetchPrediction error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrediction();
    const interval = setInterval(fetchPrediction, 30000);
    return () => clearInterval(interval);
  }, [fetchPrediction]);

  return { prediction, loading, error, refetch: fetchPrediction, launchToastError };
};