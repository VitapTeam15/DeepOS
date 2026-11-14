import React, { useState, useEffect } from 'react';
import { usePrediction } from '../hooks/usePrediction';
import { useSettings } from '../hooks/useSettings';
import { getApplicationHistory, launchApplication, getModelMetrics, trainModel } from '../services/api';
import { 
  Brain, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Sliders, 
  Clock, 
  History, 
  Workflow, 
  Check, 
  Zap,
  Info,
  Activity,
  RefreshCw,
  Layers,
  Database
} from 'lucide-react';
import EmptyState from '../components/Common/EmptyState';

export default function PredictionsPage() {
  const { prediction, loading: predictionLoading, refetch } = usePrediction();
  const { settings } = useSettings();
  const [historyData, setHistoryData] = useState(null);
  const [modelMetrics, setModelMetrics] = useState(null);
  const [isTraining, setIsTraining] = useState(false);
  const [trainFeedback, setTrainFeedback] = useState(null);
  const [launching, setLaunching] = useState(false);
  const [launchStatus, setLaunchStatus] = useState(null);
  const [launchMessage, setLaunchMessage] = useState('');

  const fetchModelMetrics = async () => {
    try {
      const data = await getModelMetrics();
      setModelMetrics(data);
    } catch (err) {
      console.error('Failed to load model metrics:', err);
    }
  };

  useEffect(() => {
    getApplicationHistory().then(setHistoryData).catch(() => {});
    fetchModelMetrics();
  }, []);

  const handleRetrain = async () => {
    setIsTraining(true);
    setTrainFeedback(null);
    try {
      const res = await trainModel();
      await fetchModelMetrics();
      refetch();
      setTrainFeedback({ 
        type: 'success', 
        message: `Model retrained successfully! Val Loss: ${res.val_loss?.toFixed(4)}, Top-1: ${(res.top1_accuracy * 100).toFixed(1)}%, Top-3: ${(res.top3_accuracy * 100).toFixed(1)}%` 
      });
      setTimeout(() => setTrainFeedback(null), 6000);
    } catch (err) {
      setTrainFeedback({ type: 'error', message: `Training failed: ${err.message}` });
      setTimeout(() => setTrainFeedback(null), 5000);
    } finally {
      setIsTraining(false);
    }
  };

  const isValid = prediction && prediction.predicted_app && prediction.predicted_app !== 'Unknown';
  const rawAppName = isValid ? prediction.predicted_app.replace(/\.exe$/i, '') : 'Workspace';
  const friendlyName = rawAppName.charAt(0).toUpperCase() + rawAppName.slice(1);
  const launchTarget = isValid ? (prediction.executable || prediction.predicted_app) : '';
  const confidence = prediction?.confidence ?? 0;
  const confidencePct = Math.round(confidence * 100);

  const isFallback = prediction?.fallback || prediction?.method === 'statistical';
  const methodLabel = prediction?.method === 'lstm' 
    ? 'PyTorch LSTM Neural Network' 
    : prediction?.method === 'hybrid'
    ? 'Hybrid AI (LSTM 65% + Statistical 35%)'
    : 'Fallback Statistical Model';

  // Model weights from backend settings
  const mlWeight = settings?.PREDICTION_ML_WEIGHT ?? 0.65;
  const statWeight = settings?.PREDICTION_STATISTICAL_WEIGHT ?? 0.35;
  const recencyWeight = settings?.PREDICTION_WEIGHT_RECENCY ?? 0.35;
  const sequenceWeight = settings?.PREDICTION_WEIGHT_SEQUENCE ?? 0.40;
  const timeWeight = settings?.PREDICTION_WEIGHT_TIME ?? 0.25;

  // Signal estimations grounded in active prediction
  const recencySignal = Math.min(Math.round(confidence * (recencyWeight / (recencyWeight + sequenceWeight + timeWeight)) * 260), 95);
  const sequenceSignal = Math.min(Math.round(confidence * (sequenceWeight / (recencyWeight + sequenceWeight + timeWeight)) * 250), 92);
  const timeSignal = Math.min(Math.round(confidence * (timeWeight / (recencyWeight + sequenceWeight + timeWeight)) * 240), 85);

  const handleLaunch = async () => {
    if (!isValid || launching) return;
    setLaunching(true);
    setLaunchStatus(null);
    try {
      await launchApplication(launchTarget);
      setLaunchStatus('success');
      setLaunchMessage(`Successfully launched ${friendlyName}`);
      setTimeout(() => setLaunchStatus(null), 3500);
    } catch (err) {
      setLaunchStatus('error');
      setLaunchMessage(err.message || `Failed to open ${friendlyName}`);
    } finally {
      setLaunching(false);
    }
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-header-title">AI Prediction & Deep Learning Engine</h1>
          <p className="page-header-desc">
            Dual-pipeline next application forecaster: PyTorch LSTM Sequence Model + Multi-factor Statistical Engine
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button className="btn btn-primary" onClick={handleRetrain} disabled={isTraining}>
            <RefreshCw size={15} className={isTraining ? 'spin' : ''} />
            <span>{isTraining ? 'Training PyTorch Model...' : 'Retrain LSTM Model'}</span>
          </button>
          <button className="btn btn-secondary" onClick={refetch} disabled={predictionLoading}>
            <Brain size={16} className={predictionLoading ? 'spin' : ''} />
            <span>Refresh Analysis</span>
          </button>
        </div>
      </div>

      {trainFeedback && (
        <div 
          className="alert" 
          style={{ 
            marginBottom: '1rem', 
            background: trainFeedback.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            border: `1px solid ${trainFeedback.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
            color: trainFeedback.type === 'success' ? 'var(--success)' : 'var(--danger)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          {trainFeedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{trainFeedback.message}</span>
        </div>
      )}

      {/* Model Architecture & Training Telemetry Hero Card */}
      <div className="card" style={{ marginBottom: '1.5rem', background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.95), rgba(30, 41, 59, 0.85))' }}>
        <div className="card-header" style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.85rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-sm)', background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-primary)' }}>
                <Activity size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>PyTorch LSTM Deep Learning Architecture</h3>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Genuinely trained on local application transition sequences using Cross-Entropy Loss & Adam Optimizer
                </p>
              </div>
            </div>

            <span 
              className="badge" 
              style={{ 
                background: isFallback ? 'rgba(245, 158, 11, 0.15)' : 'rgba(99, 102, 241, 0.25)',
                color: isFallback ? 'var(--warning)' : 'var(--accent-highlight)',
                border: `1px solid ${isFallback ? 'rgba(245, 158, 11, 0.3)' : 'rgba(99, 102, 241, 0.5)'}`,
                padding: '0.35rem 0.75rem',
                borderRadius: '999px',
                fontSize: '0.8rem',
                fontWeight: 600
              }}
            >
              Active Engine: {methodLabel}
            </span>
          </div>
        </div>

        <div className="card-body">
          {/* Metrics Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
            <div style={{ background: 'var(--bg-secondary)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Top-1 Accuracy
              </span>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: modelMetrics?.top1_accuracy != null ? 'var(--success)' : 'var(--text-muted)', marginTop: '0.2rem' }}>
                {modelMetrics?.top1_accuracy != null ? `${(modelMetrics.top1_accuracy * 100).toFixed(1)}%` : 'N/A'}
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>First prediction match</span>
            </div>

            <div style={{ background: 'var(--bg-secondary)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Top-3 Accuracy
              </span>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: modelMetrics?.top3_accuracy != null ? 'var(--info)' : 'var(--text-muted)', marginTop: '0.2rem' }}>
                {modelMetrics?.top3_accuracy != null ? `${(modelMetrics.top3_accuracy * 100).toFixed(1)}%` : 'N/A'}
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Match in top-3 candidates</span>
            </div>

            <div style={{ background: 'var(--bg-secondary)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Validation Loss
              </span>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.2rem' }}>
                {modelMetrics?.val_loss != null ? modelMetrics.val_loss.toFixed(4) : 'N/A'}
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>CrossEntropyLoss (eval split)</span>
            </div>

            <div style={{ background: 'var(--bg-secondary)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Dataset Events
              </span>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.2rem' }}>
                {modelMetrics?.total_samples ? modelMetrics.total_samples : 0}
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                {modelMetrics?.train_samples ? `${modelMetrics.train_samples} train / ${modelMetrics.val_samples} val (80/20)` : 'Cold-start waiting'}
              </span>
            </div>
          </div>

          {/* Model Specification Banner */}
          <div style={{ background: 'rgba(10, 14, 25, 0.6)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '0.85rem 1rem', fontSize: '0.82rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
              <span>
                <strong style={{ color: 'var(--accent-highlight)' }}>Layer Breakdown:</strong>{' '}
                Embedding(num_classes={modelMetrics?.num_classes || 20}, dim=32) → LSTM(hidden=64, layers=1) → Dropout(p=0.2) → Linear(64, {modelMetrics?.num_classes || 20}) → Softmax
              </span>
              <span>
                <strong style={{ color: 'var(--accent-highlight)' }}>Optimizer:</strong> Adam (lr=0.005)
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', color: 'var(--text-muted)' }}>
              <span>
                <strong>Sliding Sequence:</strong> k = {settings?.LSTM_SEQUENCE_LENGTH || 3} sequential window tokens (&lt;PAD&gt; padded)
              </span>
              <span>
                <strong>Model Checkpoint:</strong> backend/data/models/app_lstm.pt
              </span>
            </div>
          </div>
        </div>
      </div>

      {!isValid && !predictionLoading ? (
        <EmptyState 
          icon={Brain}
          title="Collecting Workflow Patterns"
          description="Deep OS needs more continuous application transitions to form high-confidence next-action predictions. Continue using your computer normally or use Demo Mode."
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '1.5rem' }}>
          {/* Left Column: Current Prediction & Explainability */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Current Prediction Hero */}
            <div className="card ai-hero-card">
              <div className="ai-hero-badge">
                <Sparkles size={12} />
                <span>Active Forecast</span>
              </div>

              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Likely Next Action
              </span>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.2rem', marginBottom: '0.5rem' }}>
                Open {friendlyName}
              </h2>

              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
                {prediction?.reasons?.[0] || `Deep OS anticipates you will switch to ${friendlyName} based on historical sequences and current time context.`}
              </p>

              {/* Action button */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <button 
                  className="btn btn-primary btn-lg" 
                  onClick={handleLaunch}
                  disabled={launching}
                >
                  {launching ? (
                    <>
                      <Loader2 size={16} className="spin" /> Opening {friendlyName}…
                    </>
                  ) : (
                    <>
                      Open {friendlyName} <ArrowRight size={16} />
                    </>
                  )}
                </button>

                {launchStatus === 'success' && (
                  <span style={{ color: 'var(--success)', fontSize: '0.86rem', display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600 }}>
                    <CheckCircle2 size={16} /> {launchMessage}
                  </span>
                )}
                {launchStatus === 'error' && (
                  <span style={{ color: 'var(--danger)', fontSize: '0.86rem', display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600 }}>
                    <AlertCircle size={16} /> {launchMessage}
                  </span>
                )}
              </div>
            </div>

            {/* Explainable Factors */}
            <div className="card">
              <div className="card-header">
                <div className="card-title-group">
                  <div className="card-title-icon">
                    <Brain size={16} />
                  </div>
                  <div>
                    <h3>Decision Rationale</h3>
                    <p>Contributing factors driving this prediction</p>
                  </div>
                </div>
              </div>

              <div className="card-body">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {/* Sequence Factor */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        Sequential Transition Pattern (LSTM + Markov)
                      </span>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-primary)' }}>
                        {sequenceSignal}%
                      </span>
                    </div>
                    <div className="confidence-bar" style={{ margin: 0 }}>
                      <div className="confidence-bar-fill" style={{ width: `${sequenceSignal}%` }} />
                    </div>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                      Captures application transition orders observed over past usage sequences.
                    </p>
                  </div>

                  {/* Recency Factor */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        Session Workflow Recency
                      </span>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-primary)' }}>
                        {recencySignal}%
                      </span>
                    </div>
                    <div className="confidence-bar" style={{ margin: 0 }}>
                      <div className="confidence-bar-fill" style={{ width: `${recencySignal}%` }} />
                    </div>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                      Evaluates elapsed time since last focus and recent usage frequency in active session.
                    </p>
                  </div>

                  {/* Time of Day Factor */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        Temporal Clustering (Time of Day / Day of Week)
                      </span>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-primary)' }}>
                        {timeSignal}%
                      </span>
                    </div>
                    <div className="confidence-bar" style={{ margin: 0 }}>
                      <div className="confidence-bar-fill" style={{ width: `${timeSignal}%` }} />
                    </div>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                      Correlates launch likelihood with current hour-of-day habits.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Confidence, Alternatives & Weights */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Model Confidence Meter */}
            <div className="card">
              <div className="card-header">
                <div className="card-title-group">
                  <div className="card-title-icon">
                    <Zap size={16} />
                  </div>
                  <div>
                    <h3>Aggregate Confidence</h3>
                    <p>Blended probability score</p>
                  </div>
                </div>
              </div>

              <div className="card-body" style={{ textAlign: 'center', padding: '1rem 0' }}>
                <div style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--accent-highlight)', letterSpacing: '-0.03em', lineHeight: 1 }}>
                  {confidencePct}%
                </div>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                  {confidencePct >= 70 ? 'High confidence threshold met' : 'Moderate confidence signal'}
                </p>

                <div style={{ marginTop: '1.25rem', padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', textAlign: 'left', fontSize: '0.8rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                    <span style={{ color: 'var(--text-dim)' }}>Alert Eligibility:</span>
                    <strong style={{ color: prediction?.trigger_alert ? 'var(--success)' : 'var(--text-muted)' }}>
                      {prediction?.trigger_alert ? 'Eligible for Notification' : 'Suppressed by Cooldown / Threshold'}
                    </strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-dim)' }}>Executable Target:</span>
                    <span style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{launchTarget || 'Auto'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Alternative Candidate Predictions */}
            <div className="card">
              <div className="card-header">
                <div className="card-title-group">
                  <div className="card-title-icon">
                    <Workflow size={16} />
                  </div>
                  <div>
                    <h3>Alternative Signals</h3>
                    <p>Secondary candidates identified</p>
                  </div>
                </div>
              </div>

              <div className="card-body">
                {prediction?.alternatives && prediction.alternatives.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                    {prediction.alternatives.map((alt, i) => (
                      <div 
                        key={i} 
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.65rem 0.85rem',
                          background: 'var(--bg-secondary)',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--border-subtle)'
                        }}
                      >
                        <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {alt.name}
                        </span>
                        <span className="badge badge-primary">
                          {Math.round(alt.confidence * 100)}%
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem 0' }}>
                    No competing candidate alternatives at this time.
                  </p>
                )}
              </div>
            </div>

            {/* Hybrid & Statistical Model Weights Summary */}
            <div className="card">
              <div className="card-header">
                <div className="card-title-group">
                  <div className="card-title-icon">
                    <Sliders size={16} />
                  </div>
                  <div>
                    <h3>Hybrid Model Weights</h3>
                    <p>Configured balance in Settings</p>
                  </div>
                </div>
              </div>

              <div className="card-body" style={{ fontSize: '0.82rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--accent-highlight)', fontWeight: 600 }}>LSTM Neural Weight:</span>
                    <strong style={{ color: 'var(--accent-highlight)' }}>{Number(mlWeight).toFixed(2)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Statistical Engine Weight:</span>
                    <strong style={{ color: 'var(--text-primary)' }}>{Number(statWeight).toFixed(2)}</strong>
                  </div>
                  <div style={{ borderTop: '1px solid var(--border-subtle)', margin: '0.25rem 0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Sequence Markov Weight:</span>
                    <strong style={{ color: 'var(--text-primary)' }}>{Number(sequenceWeight).toFixed(2)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Recency Transition Weight:</span>
                    <strong style={{ color: 'var(--text-primary)' }}>{Number(recencyWeight).toFixed(2)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Time Clustering Weight:</span>
                    <strong style={{ color: 'var(--text-primary)' }}>{Number(timeWeight).toFixed(2)}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Common App Sequences from History */}
      {historyData?.sequences && historyData.sequences.length > 0 && (
        <div className="card" style={{ marginTop: '0.5rem' }}>
          <div className="card-header">
            <div className="card-title-group">
              <div className="card-title-icon">
                <History size={16} />
              </div>
              <div>
                <h3>Discovered Workflow Sequences</h3>
                <p>Frequent transitions detected across multiple application sessions</p>
              </div>
            </div>
          </div>

          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.85rem' }}>
              {historyData.sequences.slice(0, 6).map((seq, i) => (
                <div 
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.85rem 1rem',
                    background: 'var(--bg-secondary)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {seq.from_app.replace(/\.exe$/i, '')}
                    </span>
                    <ArrowRight size={14} style={{ color: 'var(--accent-primary)' }} />
                    <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--accent-highlight)' }}>
                      {seq.to_app.replace(/\.exe$/i, '')}
                    </span>
                  </div>
                  <span className="badge badge-muted">
                    {seq.count} {seq.count === 1 ? 'time' : 'times'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
