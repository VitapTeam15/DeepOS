from pydantic import BaseModel
from typing import List, Optional, Any

class SystemStatus(BaseModel):
    cpu: float
    ram: float
    disk: float
    uptime: float
    pressure: dict
    process_count: int

class SystemMetrics(BaseModel):
    timestamp: str
    cpu_percent: float
    memory_percent: float
    memory_used_gb: float
    memory_total_gb: float
    disk_percent: float
    disk_read_mb: float
    disk_write_mb: float
    process_count: int

class SystemMetricsHistory(BaseModel):
    data: List[SystemMetrics]

class ProcessInfo(BaseModel):
    pid: int
    name: str
    cpu_percent: float
    memory_percent: float
    memory_mb: float
    status: str
    username: Optional[str] = None
    is_protected: bool = False
    recommendation: Optional[str] = None

class ProcessList(BaseModel):
    processes: List[ProcessInfo]

class TerminateRequest(BaseModel):
    pid: int

class TerminateResponse(BaseModel):
    success: bool
    message: str

class ApplicationInfo(BaseModel):
    id: int
    name: str
    executable: Optional[str]
    category: str
    first_seen: str
    last_seen: str
    launch_count: int  # Note: This represents Foreground Activations

class ApplicationEvent(BaseModel):
    id: int
    application_id: int
    timestamp: str
    hour: int
    day_of_week: int
    previous_application_id: Optional[int]
    session_id: Optional[str]

class AppSequenceInfo(BaseModel):
    from_app: str
    to_app: str
    count: int

class ApplicationHistory(BaseModel):
    most_used: List[ApplicationInfo]
    recent: List[ApplicationInfo]
    sequences: List[AppSequenceInfo] = []

class AppUsageStats(BaseModel):
    name: str
    launches: int

class PredictionAlternative(BaseModel):
    name: str
    confidence: float

class PredictionResponse(BaseModel):
    predicted_app: str
    confidence: float
    method: str = "STATISTICAL"
    fallback: bool = True
    sufficient_data: bool = True
    reasons: List[str]
    alternatives: List[PredictionAlternative]
    trigger_alert: bool = False
    executable: Optional[str] = None  # Resolved executable name from applications DB

class ModelMetricsResponse(BaseModel):
    status: str
    model_type: str
    architecture: str
    training_samples: int
    validation_samples: int
    vocab_size: int
    classes: List[str]
    last_trained: Optional[str] = None
    validation_loss: Optional[float] = None
    top1_accuracy: Optional[float] = None
    top3_accuracy: Optional[float] = None
    epochs_trained: Optional[int] = None
    ml_weight: float
    statistical_weight: float
    is_fallback: bool

class RecommendationInfo(BaseModel):
    id: int
    type: str
    message: str
    severity: str
    confidence: float
    reason: Optional[str]
    timestamp: str
    expiration: Optional[str]
    target_process: Optional[str]
    target_app: Optional[str]

class RecommendationAction(BaseModel):
    action: str

class FocusModeState(BaseModel):
    enabled: bool
    level: int

class FocusModeUpdate(BaseModel):
    enabled: bool
    level: int

class SettingsUpdate(BaseModel):
    MONITORING_INTERVAL_SYSTEM: Optional[int] = None
    MONITORING_INTERVAL_PROCESS: Optional[int] = None

class SettingsResponse(BaseModel):
    settings: dict

class DatabaseStatus(BaseModel):
    size_mb: float
    record_counts: dict
    last_cleanup: Optional[str]
    last_vacuum: Optional[str]

class NotificationInfo(BaseModel):
    message: str
    level: str

class WebSocketMessage(BaseModel):
    type: str
    data: dict
