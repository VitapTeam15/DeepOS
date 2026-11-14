import asyncio
import time
from datetime import datetime
from typing import Optional, List, Dict, Any
from app.config import settings
from app.database import get_db
from app.models.schemas import PredictionResponse, PredictionAlternative, ModelMetricsResponse
from app.services.ml_model import LSTMModelManager
from app.api.applications import resolve_executable_path
import logging

logger = logging.getLogger(__name__)

class PredictionEngine:
    """
    Hybrid Application Prediction Engine for Deep OS.
    
    Combines:
      1. Deep Learning LSTM Sequence Predictor (PyTorch)
      2. Weighted Statistical Fallback (Time-Frequency + Markov Transitions + Recency)
    
    Architecture:
      - Cold-start: Falls back to statistical engine when events < 15 or model untrained.
      - Warm-state: Hybrid weighted inference (ML_WEIGHT * LSTM_Score + STATISTICAL_WEIGHT * Stat_Score).
      - Self-calibrating: Automatically triggers background LSTM training when new events accumulate.
      - Actionable: Attaches resolved Windows executable for one-click notification launching.
    """
    def __init__(self, focus_engine=None):
        self.focus_engine = focus_engine
        self.last_alert_time: float = 0.0
        self.events_since_last_train: int = 0
        self.is_training: bool = False
        
        # Initialize LSTM Model Manager
        self.ml_manager = LSTMModelManager(
            model_dir=settings.MODEL_DIR,
            seq_length=settings.LSTM_SEQUENCE_LENGTH
        )
        logger.info(f"[PREDICTION_ENGINE] Initialized. LSTM Model trained status: {self.ml_manager.is_trained}")

    def set_focus_engine(self, focus_engine):
        self.focus_engine = focus_engine

    async def on_app_switch(self, app_name: str):
        """Called by AppTracker when an application switch occurs."""
        self.events_since_last_train += 1
        logger.debug(f"[PREDICTION_ENGINE] App switch recorded: '{app_name}' (accumulated={self.events_since_last_train})")
        
        # Auto-train LSTM if enough new events have accumulated and not already training
        if not self.is_training and self.events_since_last_train >= settings.LSTM_AUTOTRAIN_INTERVAL:
            logger.info(f"[PREDICTION_ENGINE] Auto-retrain threshold reached ({self.events_since_last_train} events). Triggering background training...")
            asyncio.create_task(self.train_model())

    async def train_model(self, include_demo: bool = False) -> Dict[str, Any]:
        """
        Gathers chronological historical application events from the SQLite database
        and trains the PyTorch LSTM model in a non-blocking worker thread.
        """
        if self.is_training:
            logger.info("[PREDICTION_ENGINE] Training already in progress. Skipping.")
            return self.ml_manager.metadata

        self.is_training = True
        try:
            async with get_db() as db:
                where_clause = "" if (include_demo or settings.DEMO_MODE) else "WHERE e.is_demo = 0"
                cursor = await db.execute(f"""
                    SELECT a.name 
                    FROM application_events e
                    JOIN applications a ON e.application_id = a.id
                    {where_clause}
                    ORDER BY e.id ASC
                """)
                rows = await cursor.fetchall()
                events = [r['name'] for r in rows if r['name']]

            if len(events) < settings.LSTM_MIN_TRAINING_SAMPLES:
                logger.warning(
                    f"[PREDICTION_ENGINE] Insufficient events to train LSTM: "
                    f"{len(events)} found, minimum {settings.LSTM_MIN_TRAINING_SAMPLES} required."
                )
                self.ml_manager.metadata["status"] = "INSUFFICIENT_DATA"
                self.ml_manager.metadata["training_samples"] = len(events)
                return self.ml_manager.metadata

            # Train in worker thread to prevent blocking FastAPI event loop
            report = await asyncio.to_thread(
                self.ml_manager.train,
                events,
                epochs=25,
                lr=0.005,
                batch_size=16
            )
            self.events_since_last_train = 0
            logger.info(f"[PREDICTION_ENGINE] Model training finished: status={report.get('status')}")
            return report
        except Exception as e:
            logger.error(f"[PREDICTION_ENGINE] Error during model training: {e}", exc_info=True)
            return {"status": "ERROR", "error": str(e)}
        finally:
            self.is_training = False

    def get_model_metrics(self) -> ModelMetricsResponse:
        """Returns verified model metrics and status for diagnostics and UI."""
        meta = self.ml_manager.metadata
        return ModelMetricsResponse(
            status=meta.get("status", "UNTRAINED"),
            model_type=meta.get("model_type", "LSTM"),
            architecture=meta.get("architecture", "Embedding(32) -> LSTM(64) -> Dropout(0.2) -> Dense -> Softmax"),
            training_samples=meta.get("training_samples", 0),
            validation_samples=meta.get("validation_samples", 0),
            vocab_size=meta.get("vocab_size", 0),
            classes=meta.get("classes", []),
            last_trained=meta.get("last_trained"),
            validation_loss=meta.get("validation_loss"),
            top1_accuracy=meta.get("top1_accuracy"),
            top3_accuracy=meta.get("top3_accuracy"),
            epochs_trained=meta.get("epochs_trained"),
            ml_weight=settings.PREDICTION_ML_WEIGHT,
            statistical_weight=settings.PREDICTION_STATISTICAL_WEIGHT,
            is_fallback=not self.ml_manager.is_trained
        )

    async def get_prediction(self, active_app: Optional[str] = None) -> PredictionResponse:
        """
        Computes the next application prediction using the Hybrid LSTM + Statistical architecture.
        """
        now = datetime.now()
        current_hour = now.hour
        current_day = now.weekday()
        current_time = time.time()

        async with get_db() as db:
            # 1. Total events count
            cursor = await db.execute("SELECT COUNT(*) as c FROM application_events")
            row = await cursor.fetchone()
            total_events = row['c'] if row else 0

            if total_events == 0:
                logger.info("[PREDICTION] Cold-start: No application activity events recorded in database.")
                return PredictionResponse(
                    predicted_app="Unknown",
                    confidence=0.0,
                    method="STATISTICAL",
                    fallback=True,
                    sufficient_data=False,
                    reasons=["No historical application activity recorded yet."],
                    alternatives=[],
                    trigger_alert=False
                )

            # 2. Fetch recent application events (chronological order)
            cursor = await db.execute("""
                SELECT a.name FROM application_events e
                JOIN applications a ON e.application_id = a.id
                ORDER BY e.id DESC LIMIT 10
            """)
            recent_rows = await cursor.fetchall()
            recent_apps = list(reversed([r['name'] for r in recent_rows if r['name']]))

            # 3. Compute Statistical Scores
            # Time-frequency
            cursor = await db.execute("""
                SELECT a.name, COUNT(*) as freq 
                FROM application_events e 
                JOIN applications a ON e.application_id = a.id
                WHERE e.hour = ? AND e.day_of_week = ?
                GROUP BY a.id ORDER BY freq DESC LIMIT 5
            """, (current_hour, current_day))
            time_scores = {r['name']: r['freq'] for r in await cursor.fetchall()}

            # Recency
            recency_scores = {name: (10 - i) for i, name in enumerate(reversed(recent_apps))}

            # Markov Sequence transition
            cursor = await db.execute("""
                SELECT application_id FROM application_events
                ORDER BY id DESC LIMIT 1
            """)
            last_event = await cursor.fetchone()
            last_app_id = last_event['application_id'] if last_event else None
            sequence_scores = {}
            if last_app_id:
                cursor = await db.execute("""
                    SELECT a.name, COUNT(*) as seq_freq
                    FROM application_events e
                    JOIN applications a ON e.application_id = a.id
                    WHERE e.previous_application_id = ?
                    GROUP BY a.id ORDER BY seq_freq DESC LIMIT 5
                """, (last_app_id,))
                sequence_scores = {r['name']: r['seq_freq'] for r in await cursor.fetchall()}

            # Statistical weighted combination
            all_stat_apps = set(list(time_scores.keys()) + list(recency_scores.keys()) + list(sequence_scores.keys()))
            stat_combined = {}
            for name in all_stat_apps:
                w_t = time_scores.get(name, 0) * settings.PREDICTION_WEIGHT_TIME
                w_r = recency_scores.get(name, 0) * settings.PREDICTION_WEIGHT_RECENCY
                w_s = sequence_scores.get(name, 0) * settings.PREDICTION_WEIGHT_SEQUENCE
                stat_combined[name] = w_t + w_r + w_s

            stat_total = sum(stat_combined.values())
            stat_dist = {k: (v / stat_total if stat_total > 0 else 0.0) for k, v in stat_combined.items()}

        # 4. Check if LSTM model is ready or if we should auto-train on startup
        if not self.ml_manager.is_trained and total_events >= settings.LSTM_MIN_TRAINING_SAMPLES and not self.is_training:
            logger.info(f"[PREDICTION] {total_events} events available, initiating startup LSTM training...")
            asyncio.create_task(self.train_model())

        # 5. Hybrid Prediction Decision
        method = "STATISTICAL"
        is_fallback = True
        combined_scores = {}
        explanations = {}

        if self.ml_manager.is_trained:
            # Query LSTM model
            lstm_top, lstm_conf, lstm_alts, lstm_dist = self.ml_manager.predict(recent_apps)
            
            if lstm_dist:
                method = "LSTM"
                is_fallback = False
                
                # Combine LSTM Softmax with Statistical signals
                all_apps = set(list(lstm_dist.keys()) + list(stat_dist.keys()))
                w_ml = settings.PREDICTION_ML_WEIGHT
                w_stat = settings.PREDICTION_STATISTICAL_WEIGHT
                
                for app in all_apps:
                    ml_p = lstm_dist.get(app, 0.0)
                    st_p = stat_dist.get(app, 0.0)
                    combined_scores[app] = (w_ml * ml_p) + (w_stat * st_p)
                    
                    if ml_p > 0.4:
                        explanations[app] = f"predicted by LSTM neural sequence model following {recent_apps[-1] if recent_apps else 'recent activity'}"
                    elif sequence_scores.get(app, 0) > 0:
                        explanations[app] = f"frequently opened right after {recent_apps[-1] if recent_apps else 'this application'}"
                    elif time_scores.get(app, 0) > 0:
                        explanations[app] = "consistently used around this hour and day"
                    else:
                        explanations[app] = "aligned with your active workspace routine"
            else:
                logger.warning("[PREDICTION] LSTM distribution empty — utilizing statistical fallback.")
                combined_scores = stat_dist
        else:
            logger.info("[PREDICTION] LSTM not trained yet — utilizing statistical fallback.")
            combined_scores = stat_dist
            for app in stat_dist:
                if sequence_scores.get(app, 0) > 0:
                    explanations[app] = f"frequently opened after {recent_apps[-1] if recent_apps else 'this activity'}"
                elif time_scores.get(app, 0) > 0:
                    explanations[app] = "regularly used around this time of day"
                else:
                    explanations[app] = "part of your recent application workflow"

        if not combined_scores:
            return PredictionResponse(
                predicted_app="Unknown",
                confidence=0.0,
                method="STATISTICAL",
                fallback=True,
                sufficient_data=False,
                reasons=["Not enough continuous application switches to forecast next action."],
                alternatives=[],
                trigger_alert=False
            )

        # Normalize final combined distribution
        total_score = sum(combined_scores.values())
        norm_combined = {k: (v / total_score if total_score > 0 else 0.0) for k, v in combined_scores.items()}
        sorted_apps = sorted(norm_combined.items(), key=lambda x: x[1], reverse=True)

        top_app = sorted_apps[0][0]
        conf = round(float(sorted_apps[0][1]), 4)

        # Dampen confidence if overall history is very small
        if total_events < 20:
            conf = min(conf, 0.40)
        elif total_events < 50:
            conf = min(conf, 0.65)

        # Construct candidate alternatives
        alternatives = [
            PredictionAlternative(name=k, confidence=round(float(v), 4))
            for k, v in sorted_apps[1:4]
        ]

        # 6. Recommendation and Alert Notification Decision
        trigger_alert = False
        cooldown_secs = settings.NOTIFICATION_COOLDOWN_MINUTES * 60
        last_ts_str = datetime.fromtimestamp(self.last_alert_time).strftime("%H:%M:%S") if self.last_alert_time > 0 else "NONE"
        now_str = datetime.fromtimestamp(current_time).strftime("%H:%M:%S")

        logger.info(f"[PREDICTION] App: '{top_app}' | Method: {method} (fallback={is_fallback}) | Confidence: {conf:.2f} | Threshold: {settings.PREDICTION_MIN_CONFIDENCE}")

        # Validation checks
        if not settings.NOTIFICATION_ENABLED:
            logger.info("[Notification] Recommendation suppressed: NOTIFICATION_ENABLED is False")
        elif active_app and active_app.lower() == top_app.lower():
            logger.info(f"[Notification] Recommendation suppressed: '{top_app}' is already the foreground active window")
        elif conf < settings.PREDICTION_MIN_CONFIDENCE:
            logger.info(f"[Notification] Recommendation suppressed: Confidence {conf:.2f} is below threshold {settings.PREDICTION_MIN_CONFIDENCE}")
        elif self.focus_engine and not self.focus_engine.should_deliver("info", "prediction"):
            logger.info(f"[Notification] Recommendation suppressed: Focus Mode (Level {settings.FOCUS_MODE_LEVEL}) blocked prediction delivery")
        else:
            # Check alert cooldown
            if self.last_alert_time == 0:
                trigger_alert = True
                logger.info("[Notification] Cooldown check: Passed (first alert ever). Triggering alert.")
            else:
                elapsed = current_time - self.last_alert_time
                remaining = cooldown_secs - elapsed
                if elapsed >= cooldown_secs:
                    trigger_alert = True
                    logger.info(f"[Notification] Cooldown check: Passed ({elapsed:.0f}s elapsed >= {cooldown_secs}s cooldown). Triggering alert.")
                else:
                    logger.info(f"[Notification] Recommendation suppressed: Cooldown active ({remaining:.0f}s remaining)")

        if trigger_alert:
            self.last_alert_time = current_time
            logger.info(f"[Notification] Alert dispatched. Updated last_alert_time to {now_str}")

        # 7. Resolve full launchable executable for the top predicted app
        predicted_executable = None
        try:
            async with get_db() as db:
                cursor = await db.execute(
                    "SELECT executable FROM applications WHERE LOWER(name) = LOWER(?) LIMIT 1",
                    (top_app,)
                )
                exe_row = await cursor.fetchone()
                db_exe = exe_row["executable"] if exe_row else None
            
            predicted_executable = resolve_executable_path(db_exe, top_app)
            if predicted_executable:
                logger.info(f"[PREDICTION] Executable resolved: '{top_app}' → '{predicted_executable}'")
            else:
                logger.warning(f"[PREDICTION] Could not resolve full path for '{top_app}' — using app name as fallback")
                predicted_executable = top_app
        except Exception as exe_err:
            logger.error(f"[PREDICTION] Error resolving executable for '{top_app}': {exe_err}")
            predicted_executable = top_app

        return PredictionResponse(
            predicted_app=top_app,
            confidence=conf,
            method=method,
            fallback=is_fallback,
            sufficient_data=(total_events >= settings.LSTM_MIN_TRAINING_SAMPLES),
            reasons=[explanations.get(top_app, f"Based on your recent workflow activity.")],
            alternatives=alternatives,
            trigger_alert=trigger_alert,
            executable=predicted_executable
        )
