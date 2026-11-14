import json
import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    model_config = {"extra": "ignore"}
    MONITORING_INTERVAL_SYSTEM: int = 3
    MONITORING_INTERVAL_PROCESS: int = 5
    MONITORING_INTERVAL_APP: int = 1
    PROCESS_SNAPSHOT_INTERVAL: int = 60
    CPU_THRESHOLD_WARNING: int = 70
    CPU_THRESHOLD_CRITICAL: int = 85
    RAM_THRESHOLD_WARNING: int = 70
    RAM_THRESHOLD_CRITICAL: int = 85
    DISK_THRESHOLD_WARNING: int = 80
    DISK_THRESHOLD_CRITICAL: int = 90
    PREDICTION_WEIGHT_TIME: float = 0.4
    PREDICTION_WEIGHT_SEQUENCE: float = 0.5
    PREDICTION_WEIGHT_RECENCY: float = 0.1
    PREDICTION_MIN_CONFIDENCE: float = 0.15
    PREDICTION_ML_WEIGHT: float = 0.65
    PREDICTION_STATISTICAL_WEIGHT: float = 0.35
    LSTM_SEQUENCE_LENGTH: int = 3
    LSTM_MIN_TRAINING_SAMPLES: int = 15
    LSTM_AUTOTRAIN_INTERVAL: int = 20
    NOTIFICATION_COOLDOWN_MINUTES: int = 30
    NOTIFICATION_ENABLED: bool = True
    AUDIO_ENABLED: bool = False
    FOCUS_MODE_ENABLED: bool = False
    FOCUS_MODE_LEVEL: int = 1
    RETENTION_METRICS_DAYS: int = 30
    RETENTION_SNAPSHOTS_DAYS: int = 7
    RETENTION_EVENTS_DAYS: int = 180
    RETENTION_RECOMMENDATIONS_DAYS: int = 30
    CLEANUP_INTERVAL_HOURS: int = 6
    DEMO_MODE: bool = False
    PRESSURE_WINDOW_SIZE: int = 10
    PROTECTED_PROCESSES: list[str] = [
        'System', 'svchost.exe', 'csrss.exe', 'wininit.exe', 'services.exe',
        'lsass.exe', 'smss.exe', 'winlogon.exe', 'explorer.exe', 'dwm.exe',
        'taskhostw.exe', 'RuntimeBroker.exe', 'fontdrvhost.exe', 'SearchHost.exe',
        'StartMenuExperienceHost.exe', 'sihost.exe', 'spoolsv.exe',
        'SecurityHealthSystray.exe', 'TextInputHost.exe', 'ctfmon.exe'
    ]
    DATA_DIR: str = os.environ.get('DEEPOS_DATA_DIR', 'data')
    DB_PATH: str = os.path.join(DATA_DIR, 'deepos.db')
    SETTINGS_PATH: str = os.path.join(DATA_DIR, 'settings.json')
    LOG_PATH: str = os.path.join(DATA_DIR, 'logs', 'deepos.log')
    MODEL_DIR: str = os.path.join(DATA_DIR, 'models')

    def save_to_json(self):
        os.makedirs(os.path.dirname(self.SETTINGS_PATH), exist_ok=True)
        with open(self.SETTINGS_PATH, 'w') as f:
            json.dump(self.model_dump(), f, indent=4)

    @classmethod
    def load_from_json(cls, path='data/settings.json'):
        if os.path.exists(path):
            with open(path, 'r') as f:
                data = json.load(f)
                return cls(**data)
        return cls()

settings = Settings.load_from_json()
