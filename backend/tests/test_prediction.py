import pytest
import os
from app.config import settings
from app.database import get_db, init_db
from app.services.prediction_engine import PredictionEngine
from app.services.ml_model import LSTMModelManager

@pytest.mark.asyncio
async def test_prediction_engine_instantiation():
    engine = PredictionEngine()
    assert engine is not None
    assert hasattr(engine, 'get_prediction')
    assert hasattr(engine, 'train_model')
    assert hasattr(engine, 'get_model_metrics')

@pytest.mark.asyncio
async def test_cold_start_prediction():
    """On cold start with no data, prediction should return Unknown with 0 confidence and fallback=True."""
    await init_db()
    async with get_db() as db:
        await db.execute("DELETE FROM application_events")
        await db.execute("DELETE FROM applications")
        await db.commit()

    engine = PredictionEngine()
    # Reset model to ensure cold start
    engine.ml_manager.model = None
    engine.ml_manager.metadata["status"] = "UNTRAINED"

    result = await engine.get_prediction()
    assert result.predicted_app == "Unknown"
    assert result.confidence == 0.0
    assert result.fallback is True
    assert result.method == "STATISTICAL"
    assert result.sufficient_data is False

@pytest.mark.asyncio
async def test_lstm_model_training_and_evaluation():
    """Tests that LSTM trains on sequential events and produces verifiable metrics."""
    model_dir = os.path.join(settings.DATA_DIR, "test_models")
    os.makedirs(model_dir, exist_ok=True)
    manager = LSTMModelManager(model_dir=model_dir, seq_length=3)

    # Synthetic workflow events
    events = ["Chrome", "VSCode", "Terminal", "Chrome", "VSCode", "Terminal"] * 10
    report = manager.train(events, epochs=15)

    assert report["status"] == "TRAINED"
    assert report["model_type"] == "LSTM"
    assert report["training_samples"] > 0
    assert report["validation_samples"] > 0
    assert report["top1_accuracy"] is not None
    assert report["top3_accuracy"] is not None
    assert report["validation_loss"] is not None
    assert manager.is_trained is True

    # Test inference
    pred_app, conf, alts, dist = manager.predict(["Chrome", "VSCode"])
    assert pred_app == "Terminal"
    assert conf > 0.5
    assert len(dist) >= 3

@pytest.mark.asyncio
async def test_hybrid_prediction_pipeline():
    """Tests the full hybrid prediction flow with database integration."""
    await init_db()
    
    async with get_db() as db:
        await db.execute("DELETE FROM application_events")
        await db.execute("DELETE FROM applications")
        
        c1 = await db.execute("INSERT INTO applications (name, executable) VALUES ('VSCode', 'Code.exe')")
        vscode_id = c1.lastrowid
        c2 = await db.execute("INSERT INTO applications (name, executable) VALUES ('Terminal', 'cmd.exe')")
        term_id = c2.lastrowid
        c3 = await db.execute("INSERT INTO applications (name, executable) VALUES ('Chrome', 'chrome.exe')")
        chrome_id = c3.lastrowid

        # Insert 30 structured workflow cycles: Chrome -> VSCode -> Terminal
        prev_id = None
        for _ in range(30):
            for app_id in [chrome_id, vscode_id, term_id]:
                await db.execute(
                    "INSERT INTO application_events (application_id, previous_application_id, hour, day_of_week) VALUES (?, ?, 14, 2)",
                    (app_id, prev_id)
                )
                prev_id = app_id
        
        # Now simulate user switching into Chrome, then VSCode
        await db.execute(
            "INSERT INTO application_events (application_id, previous_application_id, hour, day_of_week) VALUES (?, ?, 14, 2)",
            (chrome_id, term_id)
        )
        await db.execute(
            "INSERT INTO application_events (application_id, previous_application_id, hour, day_of_week) VALUES (?, ?, 14, 2)",
            (vscode_id, chrome_id)
        )
        await db.commit()

    engine = PredictionEngine()
    
    # Train model on current events
    report = await engine.train_model()
    assert report["status"] == "TRAINED"
    assert engine.ml_manager.is_trained is True

    # Current foreground is VSCode, so sequence should forecast Terminal
    result = await engine.get_prediction(active_app="VSCode")
    assert result.predicted_app == "Terminal"
    assert result.confidence >= settings.PREDICTION_MIN_CONFIDENCE
    assert result.method == "LSTM"
    assert result.fallback is False
    assert result.sufficient_data is True
    assert "Terminal" in result.predicted_app

    # Metrics check
    metrics = engine.get_model_metrics()
    assert metrics.status == "TRAINED"
    assert metrics.model_type == "LSTM"
    assert metrics.top1_accuracy is not None
    assert metrics.training_samples > 0
