import time
from datetime import datetime
from app.config import settings
import logging

logger = logging.getLogger(__name__)

class NotificationManager:
    def __init__(self, audio_manager, focus_engine):
        self.audio = audio_manager
        self.focus = focus_engine
        self.recent_notifications = {}
        # Callback set by the API layer to push visual notifications to Electron
        self._push_notification_callback = None

    def set_push_callback(self, callback):
        """Register a callback so the notification manager can push toasts to Electron via IPC or polling."""
        self._push_notification_callback = callback

    async def create_notification(self, rec_type, message, severity, target=None):
        """Create and dispatch a system metric notification (CPU/RAM pressure etc.)."""
        logger.info(f"[NOTIFICATION] create_notification called: type={rec_type} severity={severity}")

        if not settings.NOTIFICATION_ENABLED:
            logger.info("[NOTIFICATION] Recommendation suppressed")
            logger.info("[NOTIFICATION] Reason: NOTIFICATION_ENABLED=False")
            return False

        if not self.focus.should_deliver(severity, rec_type):
            logger.info("[NOTIFICATION] Recommendation suppressed")
            logger.info("[NOTIFICATION] Reason: Focus mode filter blocked delivery")
            return False

        now = time.time()
        dedup_key = f"{rec_type}_{target or ''}"
        last_time = self.recent_notifications.get(dedup_key, 0)
        cooldown_seconds = settings.NOTIFICATION_COOLDOWN_MINUTES * 60
        elapsed = now - last_time

        logger.info(f"[NOTIFICATION] Cooldown enabled: {settings.NOTIFICATION_COOLDOWN_MINUTES} min")
        logger.info(f"[NOTIFICATION] Last notification: {datetime.fromtimestamp(last_time).isoformat() if last_time > 0 else 'NONE'}")
        logger.info(f"[NOTIFICATION] Current time: {datetime.fromtimestamp(now).isoformat()}")
        logger.info(f"[NOTIFICATION] Cooldown remaining: {max(0, cooldown_seconds - elapsed):.0f}s")

        if last_time > 0 and elapsed < cooldown_seconds:
            logger.info("[NOTIFICATION] Recommendation suppressed")
            logger.info(f"[NOTIFICATION] Reason: cooldown ({max(0, cooldown_seconds - elapsed):.0f}s remaining)")
            return False

        self.recent_notifications[dedup_key] = now

        logger.info(f"[NOTIFICATION] Notification: {message} [{severity}]")
        logger.info("[NOTIFICATION] Cooldown check passed")

        # ── Audio (only for warning/critical, and only if AUDIO_ENABLED) ──────
        if severity in ['warning', 'critical'] and settings.AUDIO_ENABLED:
            logger.info("[NOTIFICATION] Dispatching to audio (severity qualifies and AUDIO_ENABLED=True)")
            self.audio.speak(message, severity)
        elif not settings.AUDIO_ENABLED:
            logger.info("[NOTIFICATION] Audio skipped: AUDIO_ENABLED=False")
        else:
            logger.info(f"[NOTIFICATION] Audio skipped: severity={severity} does not qualify")

        # ── Visual toast (via callback if registered) ─────────────────────────
        if self._push_notification_callback:
            logger.info("[NOTIFICATION] Showing Windows toast (via push callback)")
            try:
                self._push_notification_callback({
                    "title": "Deep OS Alert",
                    "message": message,
                    "type": rec_type,
                    "severity": severity
                })
                logger.info("[NOTIFICATION] Toast displayed successfully")
            except Exception as e:
                logger.error(f"[NOTIFICATION] Windows toast failed: {e}")
        else:
            logger.info("[NOTIFICATION] No push callback registered — visual notification skipped (frontend polling will pick it up)")

        return True

    async def create_app_notification(self, app_name: str, message: str):
        """
        Push a visual notification for a predicted-app recommendation.
        Unlike create_notification, this always passes action_app so the
        Electron toast includes an 'Open' button.
        """
        logger.info(f"[NOTIFICATION] create_app_notification called for app='{app_name}'")

        if not settings.NOTIFICATION_ENABLED:
            logger.info("[NOTIFICATION] App notification suppressed: NOTIFICATION_ENABLED=False")
            return False

        if self._push_notification_callback:
            logger.info(f"[NOTIFICATION] Pushing app notification with action_app='{app_name}'")
            try:
                self._push_notification_callback({
                    "title": "💡 Deep OS Prediction",
                    "message": message,
                    "type": "APP_RECOMMENDATION",
                    "severity": "info",
                    "action_app": app_name          # Electron uses this to build the Open button
                })
                logger.info("[NOTIFICATION] App notification dispatched to Electron successfully")
            except Exception as e:
                logger.error(f"[NOTIFICATION] App notification push failed: {e}")
        else:
            logger.info("[NOTIFICATION] No push callback registered — frontend polling will surface the recommendation")

        return True
