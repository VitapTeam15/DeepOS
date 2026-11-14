from app.models.schemas import FocusModeState
from app.config import settings

class FocusEngine:
    def __init__(self):
        self.enabled = settings.FOCUS_MODE_ENABLED
        self.level = settings.FOCUS_MODE_LEVEL
        
    def should_deliver(self, severity: str, type_name: str) -> bool:
        if not self.enabled: return True
        
        if self.level == 1:
            if severity == 'info' and type_name == 'prediction': return False
            return True
        elif self.level == 2:
            if severity == 'info' or (severity == 'warning' and type_name == 'prediction'): return False
            return True
        elif self.level >= 3:
            return severity == 'critical'
        return True
        
    def get_state(self) -> FocusModeState:
        return FocusModeState(enabled=self.enabled, level=self.level)
        
    def set_state(self, enabled: bool, level: int):
        self.enabled = enabled
        self.level = level
        settings.FOCUS_MODE_ENABLED = enabled
        settings.FOCUS_MODE_LEVEL = level
        settings.save_to_json()
