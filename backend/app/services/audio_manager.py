import queue
import threading
import time
import pyttsx3
import pythoncom
from app.config import settings
import logging

logger = logging.getLogger(__name__)

class AudioManager:
    def __init__(self):
        self.running = False
        self.q = queue.Queue(maxsize=10)
        self.worker = None
        self.last_played = 0
        self.min_interval_seconds = 20  # Minimum debounce between spoken audio recommendations

    def start(self):
        self.running = True
        self.worker = threading.Thread(target=self._worker_loop, daemon=True, name="AudioWorkerThread")
        self.worker.start()
        logger.info("[AUDIO] AudioManager worker started")

    def stop(self):
        self.running = False
        if self.worker and self.worker.is_alive():
            try:
                self.q.put_nowait(None)
            except queue.Full:
                pass
            self.worker.join(timeout=2)
        logger.info("[AUDIO] AudioManager stopped")

    def speak(self, text: str, severity: str = 'info', force: bool = False, is_test: bool = False):
        if not settings.AUDIO_ENABLED and not is_test:
            logger.debug("[AUDIO] Speech suppressed: AUDIO_ENABLED is False")
            return
            
        # Priority filter (unless forced/test)
        if not force and not is_test and severity not in ['warning', 'critical']:
            logger.debug(f"[AUDIO] Speech suppressed: severity '{severity}' does not meet priority threshold")
            return
        
        # Deep Focus filter (Level 3 blocks audio)
        if not force and not is_test and settings.FOCUS_MODE_ENABLED and settings.FOCUS_MODE_LEVEL >= 3:
            logger.info("[AUDIO] Speech suppressed: Focus Mode Tier 3 (Strict Deep Work) is active")
            return

        now = time.time()
        # Cooldown check for repetitive speech (unless forced/test)
        if not force and not is_test:
            if self.last_played > 0 and (now - self.last_played) < self.min_interval_seconds:
                logger.info(f"[AUDIO] Speech suppressed: audio cooldown active ({self.min_interval_seconds - (now - self.last_played):.0f}s remaining)")
                return

        if is_test:
            logger.info("[AUDIO] Audio test speech queued")
        else:
            logger.info(f"[AUDIO] Recommendation speech queued: '{text}' (severity={severity}, force={force})")

        # Discard older queued items to prevent lag/stale audio spam
        while not self.q.empty():
            try:
                self.q.get_nowait()
                self.q.task_done()
            except (queue.Empty, ValueError):
                break

        try:
            self.q.put_nowait(text)
            self.last_played = now
        except queue.Full:
            logger.warning("[AUDIO] Speech queue is full, dropping utterance")

    def _worker_loop(self):
        pythoncom.CoInitialize()
        engine = None
        try:
            logger.info("[AUDIO] Initializing pyttsx3 SAPI5 speech synthesizer...")
            engine = pyttsx3.init()
            rate = engine.getProperty('rate')
            engine.setProperty('rate', max(120, rate - 25))
            logger.info("[AUDIO] TTS engine initialized successfully")
        except Exception as e:
            logger.error(f"[AUDIO ERROR] Could not initialize TTS engine: {e}")
            pythoncom.CoUninitialize()
            return
            
        while self.running:
            try:
                text = self.q.get(timeout=1.0)
                if text is None:
                    break
                logger.info(f"[AUDIO] Speaking utterance: '{text}'")
                engine.say(text)
                engine.runAndWait()
                logger.info("[AUDIO] Speech output completed successfully")
                self.q.task_done()
            except queue.Empty:
                pass
            except Exception as e:
                logger.error(f"[AUDIO ERROR] Error during TTS synthesis: {e}")
                # Attempt to re-initialize engine if COM corrupted
                try:
                    engine = pyttsx3.init()
                except Exception:
                    pass
                
        pythoncom.CoUninitialize()
        logger.info("[AUDIO] Audio worker loop ended cleanly")
