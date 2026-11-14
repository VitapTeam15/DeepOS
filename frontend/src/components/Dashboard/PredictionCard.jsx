import React, { useState, useEffect } from 'react';
import { Brain, Cpu, Play, RefreshCw, Activity, Layers, CheckCircle2, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { getModelMetrics, trainModel, launchApplication } from '../../services/api';

const PredictionCard = ({ prediction, loading, onRefetch }) => {
  const [modelMetrics, setModelMetrics] = useState(null);
  const [isTraining, setIsTraining] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [launchMessage, setLaunchMessage] = useState(null);
  const [showTelemetry, setShowTelemetry] = useState(true);

  const fetchMetrics = async () => {
    try {
      const data = await getModelMetrics();
      setModelMetrics(data);
    } catch (err) {
      console.error('Failed to load model metrics:', err);
    }
  };

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 20000);
    return () => clearInterval(interval);
  }, []);

  const handleRetrain = async () => {
    setIsTraining(true);
    try {
      await trainModel();
      await fetchMetrics();
      if (onRefetch) onRefetch();
    } catch (err) {
      console.error('Failed to train model:', err);
    } finally {
      setIsTraining(false);
    }
  };

  const handleLaunch = async (appName) => {
    if (!appName) return;
    setLaunching(true);
    setLaunchMessage(null);
    try {
      await launchApplication(appName);
      setLaunchMessage(`Launched ${appName} successfully!`);
      setTimeout(() => setLaunchMessage(null), 3000);
    } catch (err) {
      setLaunchMessage(`Failed to launch ${appName}`);
      setTimeout(() => setLaunchMessage(null), 4000);
    } finally {
      setLaunching(false);
    }
  };

  if (loading) {
    return (
      <div className="card loading-container">
        <div className="spinner" />
        <span style={{ marginLeft: '1rem', color: 'var(--text-muted)' }}>Loading AI prediction engine...</span>
      </div>
    );
  }

  const confidencePct = prediction && prediction.confidence ? Math.round(prediction.confidence * 100) : 0;
  const isFallback = prediction?.fallback || prediction?.method === 'statistical';
  const methodLabel = prediction?.method === 'lstm' 
    ? 'PyTorch LSTM Neural Network' 
    : prediction?.method === 'hybrid'
    ? 'Hybrid (LSTM 65% + Statistical 35%)'
    : 'Fallback Statistical Model';

  return (
    <div className="card prediction-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Brain className="text-primary" size={22} />
          <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Next Application Prediction</h3>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span 
            className="badge" 
            style={{ 
              background: isFallback ? 'rgba(245, 158, 11, 0.15)' : 'rgba(99, 102, 241, 0.2)',
              color: isFallback ? 'var(--warning)' : 'var(--accent-primary)',
              border: `1px solid ${isFallback ? 'rgba(245, 158, 11, 0.3)' : 'rgba(99, 102, 241, 0.4)'}`,
              padding: '0.25rem 0.6rem',
              borderRadius: '999px',
              fontSize: '0.75rem',
              fontWeight: 600
            }}
          >
            {methodLabel}
          </span>
          <button 
            className="btn btn-secondary" 
            onClick={handleRetrain} 
            disabled={isTraining}
            title="Retrain PyTorch LSTM Model"
            style={{ padding: '0.35rem 0.7rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <RefreshCw size={12} className={isTraining ? 'spinner' : ''} />
            {isTraining ? 'Training...' : 'Retrain Model'}
          </button>
        </div>
      </div>

      {/* Main Prediction Body */}
      {(!prediction || !prediction.predicted_app || prediction.predicted_app === 'Unknown') ? (
        <div style={{ padding: '1rem', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
          <AlertCircle size={24} style={{ color: 'var(--warning)', margin: '0 auto 0.5rem' }} />
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Insufficient transition data for confident next-app prediction.
          </p>
          <p style={{ margin: '0.25rem 0 0', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            Switch between applications naturally or enable Demo Mode in Settings to populate training sequences.
          </p>
        </div>
      ) : (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Predicted Next Application
              </span>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 700, margin: '0.2rem 0', color: 'var(--text-primary)' }}>
                {prediction.predicted_app}
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>
                You're likely to open <strong>{prediction.predicted_app}</strong> next. Would you like to open it?
              </p>
            </div>

            <div style={{ minWidth: '160px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Confidence</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: confidencePct >= 70 ? 'var(--success)' : 'var(--accent-primary)' }}>
                  {confidencePct}%
                </span>
              </div>
              <div className="confidence-bar" style={{ margin: 0 }}>
                <div 
                  className="confidence-bar-fill" 
                  style={{ 
                    width: `${confidencePct}%`,
                    background: confidencePct >= 70 ? 'var(--success)' : 'var(--accent-gradient)'
                  }} 
                />
              </div>
              <div style={{ marginTop: '0.75rem' }}>
                <button
                  className="btn btn-primary"
                  onClick={() => handleLaunch(prediction.predicted_app)}
                  disabled={launching}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.5rem' }}
                >
                  <Play size={14} />
                  {launching ? 'Opening...' : `Open ${prediction.predicted_app.replace(/\.exe$/i, '')}`}
                </button>
              </div>
            </div>
          </div>

          {launchMessage && (
            <div style={{ marginTop: '0.5rem', padding: '0.4rem 0.75rem', borderRadius: '4px', fontSize: '0.8rem', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--success)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
              {launchMessage}
            </div>
          )}

          {/* Reasons */}
          {prediction.reasons && prediction.reasons.length > 0 && (
            <div className="prediction-reasons" style={{ marginTop: '0.75rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Decision Rationale
              </span>
              <ul style={{ margin: '0.25rem 0 0', paddingLeft: 0 }}>
                {prediction.reasons.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Alternatives */}
          {prediction.alternatives && prediction.alternatives.length > 0 && (
            <div style={{ marginTop: '0.75rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Candidate Alternatives (Top-3)
              </span>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem', flexWrap: 'wrap' }}>
                {prediction.alternatives.map((alt, i) => (
                  <button 
                    key={i} 
                    onClick={() => handleLaunch(alt.name)}
                    className="btn btn-secondary"
                    style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                    title={`Click to launch ${alt.name}`}
                  >
                    <span>{alt.name}</span>
                    <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>{Math.round(alt.confidence * 100)}%</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Real AI Model Telemetry Section */}
      <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
        <button
          onClick={() => setShowTelemetry(!showTelemetry)}
          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', fontSize: '0.8rem', padding: 0 }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}>
            <Activity size={14} className="text-primary" />
            PyTorch LSTM Architecture & Real Training Telemetry
          </span>
          {showTelemetry ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {showTelemetry && (
          <div style={{ marginTop: '0.6rem', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)', padding: '0.75rem', fontSize: '0.8rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.7rem' }}>TOP-1 ACCURACY</span>
                <strong style={{ fontSize: '1rem', color: modelMetrics?.top1_accuracy != null ? 'var(--success)' : 'var(--text-muted)' }}>
                  {modelMetrics?.top1_accuracy != null ? `${(modelMetrics.top1_accuracy * 100).toFixed(1)}%` : 'N/A'}
                </strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.7rem' }}>TOP-3 ACCURACY</span>
                <strong style={{ fontSize: '1rem', color: modelMetrics?.top3_accuracy != null ? 'var(--info)' : 'var(--text-muted)' }}>
                  {modelMetrics?.top3_accuracy != null ? `${(modelMetrics.top3_accuracy * 100).toFixed(1)}%` : 'N/A'}
                </strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.7rem' }}>VALIDATION LOSS</span>
                <strong style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>
                  {modelMetrics?.val_loss != null ? modelMetrics.val_loss.toFixed(4) : 'N/A'}
                </strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.7rem' }}>DATASET SAMPLES</span>
                <strong style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>
                  {modelMetrics?.total_samples ? `${modelMetrics.total_samples} (${modelMetrics.train_samples} train / ${modelMetrics.val_samples} val)` : 'Untrained'}
                </strong>
              </div>
            </div>

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.5rem', color: 'var(--text-muted)', fontSize: '0.75rem', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
              <span>
                <strong>Network:</strong> Embedding(32) → LSTM(hidden=64, layers=1) → Dropout(0.2) → Dense → Softmax
              </span>
              <span>
                <strong>Sequence Window:</strong> k=3 past applications
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PredictionCard;