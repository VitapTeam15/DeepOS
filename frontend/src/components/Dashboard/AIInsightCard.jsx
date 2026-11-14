import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  ChevronDown, 
  ChevronUp, 
  Cpu, 
  Workflow, 
  AppWindow, 
  X,
  ExternalLink,
  Brain,
  RefreshCw,
  Activity
} from 'lucide-react';
import { launchApplication, getModelMetrics, trainModel } from '../../services/api';

export default function AIInsightCard({ prediction, loading, onDismiss, recentApp = null, onRefetch = null }) {
  const [launching, setLaunching] = useState(false);
  const [launchStatus, setLaunchStatus] = useState(null); // 'success' | 'error' | null
  const [launchMessage, setLaunchMessage] = useState('');
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [modelMetrics, setModelMetrics] = useState(null);
  const [isTraining, setIsTraining] = useState(false);

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
      console.error('Retrain failed:', err);
    } finally {
      setIsTraining(false);
    }
  };

  if (dismissed) {
    return (
      <div className="card" style={{ padding: '1rem 1.5rem', background: 'rgba(15, 21, 36, 0.4)', border: '1px dashed var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', color: 'var(--text-muted)' }}>
          <Sparkles size={16} />
          <span style={{ fontSize: '0.85rem' }}>Insight dismissed for this session. Deep OS is monitoring background workflows.</span>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={() => setDismissed(false)}>
          Restore Insight
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="card ai-hero-card" style={{ minHeight: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', color: 'var(--text-muted)' }}>
          <Loader2 size={28} className="spin" style={{ color: 'var(--accent-primary)' }} />
          <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>Synthesizing workspace telemetry & prediction models...</span>
        </div>
      </div>
    );
  }

  const isValid = prediction && prediction.predicted_app && prediction.predicted_app !== 'Unknown';
  const rawAppName = isValid ? prediction.predicted_app.replace(/\.exe$/i, '') : 'Workspace';
  const friendlyName = rawAppName.charAt(0).toUpperCase() + rawAppName.slice(1);
  const launchTarget = isValid ? (prediction.executable || prediction.predicted_app) : '';
  const confidencePct = prediction?.confidence ? Math.round(prediction.confidence * 100) : 0;
  
  const isFallback = prediction?.fallback || prediction?.method === 'statistical';
  const methodLabel = prediction?.method === 'lstm' 
    ? 'PyTorch LSTM Neural Network' 
    : prediction?.method === 'hybrid'
    ? 'Hybrid AI (LSTM 65% + Statistical 35%)'
    : 'Fallback Statistical Model';

  // Format meaningful explainable reason
  let reasonText = 'Based on your recurring workflow pattern at this hour';
  if (prediction?.reasons && prediction.reasons.length > 0) {
    reasonText = prediction.reasons[0];
  }

  // Construct workflow steps
  const previousStep = recentApp || 'Development';
  const nextStep = friendlyName;

  const handleLaunch = async () => {
    if (!isValid || launching) return;
    setLaunching(true);
    setLaunchStatus(null);
    setLaunchMessage('');
    try {
      await launchApplication(launchTarget);
      setLaunchStatus('success');
      setLaunchMessage(`Successfully launched ${friendlyName}`);
      setTimeout(() => {
        setLaunchStatus(null);
        setLaunchMessage('');
      }, 4000);
    } catch (err) {
      setLaunchStatus('error');
      setLaunchMessage(err.message || `Failed to open ${friendlyName}`);
    } finally {
      setLaunching(false);
    }
  };

  return (
    <div className="card ai-hero-card">
      <div style={{ position: 'relative', zIndex: 2 }}>
        {/* Top Badges Row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <div className="ai-hero-badge">
              <Sparkles size={12} />
              <span>Deep OS Insight — Predictive Intelligence</span>
            </div>
            <span 
              className="badge"
              style={{
                fontSize: '0.72rem',
                fontWeight: 600,
                padding: '0.2rem 0.55rem',
                borderRadius: '999px',
                background: isFallback ? 'rgba(245, 158, 11, 0.15)' : 'rgba(99, 102, 241, 0.2)',
                color: isFallback ? 'var(--warning)' : 'var(--accent-highlight)',
                border: `1px solid ${isFallback ? 'rgba(245, 158, 11, 0.3)' : 'rgba(99, 102, 241, 0.4)'}`
              }}
            >
              {methodLabel}
            </span>
          </div>
          {isValid && (
            <button 
              className="btn btn-ghost btn-sm" 
              onClick={() => setDismissed(true)}
              title="Dismiss this recommendation"
              style={{ color: 'var(--text-dim)', padding: '0.2rem 0.5rem' }}
            >
              <X size={14} /> Dismiss
            </button>
          )}
        </div>

        {/* Main Insight Title & Summary */}
        <h2 className="ai-hero-title">
          {isValid ? `Continue your workflow with ${friendlyName}` : 'Your Intelligent Workspace'}
        </h2>
        
        <p className="ai-hero-description">
          {isValid 
            ? `Deep OS detected a recurring workflow: ${reasonText}. Would you like to resume where you left off?`
            : 'Deep OS is continuously observing system activity to discover sequences and automate your frequent workflows.'}
        </p>

        {/* Workflow Chain Visualizer */}
        {isValid && (
          <div className="workflow-flow">
            <div className="flow-step">
              <div className="flow-step-icon">
                <AppWindow size={14} />
              </div>
              <span>{previousStep}</span>
            </div>

            <div className="flow-arrow">
              <ArrowRight size={14} />
            </div>

            <div className="flow-step active">
              <div className="flow-step-icon">
                <Sparkles size={14} />
              </div>
              <span style={{ color: 'var(--accent-highlight)' }}>{nextStep}</span>
            </div>

            <div className="flow-arrow">
              <ArrowRight size={14} />
            </div>

            <div className="flow-step">
              <div className="flow-step-icon">
                <Workflow size={14} />
              </div>
              <span style={{ color: 'var(--text-muted)' }}>Focus Target</span>
            </div>
          </div>
        )}

        {/* Action Buttons Row */}
        <div className="ai-hero-actions">
          {isValid ? (
            <button 
              className="btn btn-primary btn-lg" 
              onClick={handleLaunch}
              disabled={launching}
              title={`Launch ${friendlyName} (${launchTarget})`}
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
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.86rem' }}>
              <Sparkles size={16} style={{ color: 'var(--accent-primary)' }} />
              <span>Continue using your applications. Deep OS will propose actions as patterns emerge.</span>
            </div>
          )}

          {isValid && (
            <button 
              className="btn btn-secondary"
              onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <Activity size={14} className="text-primary" />
              <span>Model Telemetry</span>
              {showTechnicalDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          )}

          {/* Feedback messages */}
          {launchStatus === 'success' && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--success)', fontSize: '0.85rem', fontWeight: 600 }}>
              <CheckCircle2 size={16} />
              <span>{launchMessage}</span>
            </div>
          )}
          {launchStatus === 'error' && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--danger)', fontSize: '0.85rem', fontWeight: 600 }}>
              <AlertCircle size={16} />
              <span>{launchMessage}</span>
            </div>
          )}
        </div>

        {/* Technical/Developer Accordion Info */}
        {isValid && showTechnicalDetails && (
          <div style={{ 
            marginTop: '1.25rem', 
            padding: '1rem', 
            background: 'rgba(10, 14, 25, 0.7)', 
            border: '1px solid var(--border-subtle)', 
            borderRadius: 'var(--radius-md)',
            animation: 'fadeIn 0.2s ease-out'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.85rem' }}>
                <Activity size={15} style={{ color: 'var(--accent-primary)' }} />
                <span>PyTorch LSTM Telemetry & Backpropagation Metrics</span>
              </div>
              <button 
                className="btn btn-secondary btn-sm" 
                onClick={handleRetrain} 
                disabled={isTraining}
                style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <RefreshCw size={12} className={isTraining ? 'spin' : ''} />
                {isTraining ? 'Training...' : 'Retrain Model'}
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.85rem', marginBottom: '0.75rem' }}>
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Top-1 Accuracy</span>
                <p style={{ fontSize: '1rem', fontWeight: 700, color: modelMetrics?.top1_accuracy != null ? 'var(--success)' : 'var(--text-muted)' }}>
                  {modelMetrics?.top1_accuracy != null ? `${(modelMetrics.top1_accuracy * 100).toFixed(1)}%` : 'N/A'}
                </p>
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Top-3 Accuracy</span>
                <p style={{ fontSize: '1rem', fontWeight: 700, color: modelMetrics?.top3_accuracy != null ? 'var(--info)' : 'var(--text-muted)' }}>
                  {modelMetrics?.top3_accuracy != null ? `${(modelMetrics.top3_accuracy * 100).toFixed(1)}%` : 'N/A'}
                </p>
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Validation Loss</span>
                <p style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {modelMetrics?.val_loss != null ? modelMetrics.val_loss.toFixed(4) : 'N/A'}
                </p>
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Dataset Samples</span>
                <p style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {modelMetrics?.total_samples ? `${modelMetrics.total_samples} (${modelMetrics.train_samples} train / ${modelMetrics.val_samples} val)` : 'Untrained'}
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.85rem', marginBottom: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.6rem' }}>
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Aggregate Confidence</span>
                <p style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--accent-highlight)' }}>{confidencePct}%</p>
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Resolved Target</span>
                <p style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{launchTarget}</p>
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Trigger Status</span>
                <p style={{ fontSize: '0.82rem', fontWeight: 600, color: prediction?.trigger_alert ? 'var(--success)' : 'var(--text-muted)' }}>
                  {prediction?.trigger_alert ? 'Notification Eligible' : 'Cooldown / Suppressed'}
                </p>
              </div>
            </div>

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.5rem', color: 'var(--text-muted)', fontSize: '0.72rem', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
              <span>
                <strong>Network:</strong> Embedding(32) → LSTM(hidden=64, layers=1) → Dropout(0.2) → Linear → Softmax
              </span>
              <span>
                <strong>Sliding Window:</strong> k=3 past applications
              </span>
            </div>

            {prediction?.alternatives && prediction.alternatives.length > 0 && (
              <div style={{ marginTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.6rem' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Alternative Signals</span>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.35rem', flexWrap: 'wrap' }}>
                  {prediction.alternatives.map((alt, i) => (
                    <span key={i} className="badge badge-primary">
                      {alt.name} ({Math.round(alt.confidence * 100)}%)
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
