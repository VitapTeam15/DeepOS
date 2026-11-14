import React, { useState, useEffect } from 'react';
import { useSettings } from '../hooks/useSettings';
import { getDatabaseStatus, triggerCleanup } from '../services/api';
import { 
  Save, 
  Database, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Brain, 
  Bell, 
  Volume2, 
  Focus, 
  Activity, 
  Shield, 
  RotateCcw,
  Sparkles,
  Sliders,
  Check
} from 'lucide-react';
import Toggle from '../components/Common/Toggle';
import LoadingSkeleton from '../components/Common/LoadingSkeleton';

export default function SettingsPage() {
  const { settings, updateSettings, loading } = useSettings();
  const [localSettings, setLocalSettings] = useState({});
  const [activeTab, setActiveTab] = useState('Intelligence');
  const [toast, setToast] = useState(null);
  const [dbStatus, setDbStatus] = useState(null);
  const [saving, setSaving] = useState(false);

  const tabs = [
    { id: 'Intelligence', label: 'Intelligence', icon: Brain },
    { id: 'Notifications', label: 'Notifications', icon: Bell },
    { id: 'Audio', label: 'Audio', icon: Volume2 },
    { id: 'Focus', label: 'Focus Mode', icon: Focus },
    { id: 'Monitoring', label: 'Monitoring', icon: Activity },
    { id: 'Data', label: 'Data & Storage', icon: Database },
    { id: 'Privacy', label: 'Privacy & Demo', icon: Shield },
  ];

  useEffect(() => {
    if (settings) setLocalSettings(settings);
  }, [settings]);

  useEffect(() => {
    if (activeTab === 'Data') {
      getDatabaseStatus().then(setDbStatus).catch(console.error);
    }
  }, [activeTab]);

  const handleChange = (key, value) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
  };

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleSave = async () => {
    setSaving(true);
    const success = await updateSettings(localSettings);
    setSaving(false);
    showToast(success ? 'System parameters updated successfully!' : 'Failed to save settings.', success ? 'success' : 'error');
  };

  const handleCleanup = async () => {
    try {
      await triggerCleanup();
      showToast('Database vacuum & log cleanup completed.');
      getDatabaseStatus().then(setDbStatus);
    } catch {
      showToast('Cleanup request failed.', 'error');
    }
  };

  if (loading || !localSettings) {
    return (
      <div className="page-container">
        <LoadingSkeleton type="card" count={3} />
      </div>
    );
  }

  const NumberField = ({ label, settingKey, min, max, step = 1, unit = '' }) => (
    <div className="form-group">
      <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span>{label}</span>
        {unit && <span style={{ color: 'var(--text-dim)', fontSize: '0.78rem' }}>{unit}</span>}
      </label>
      <input 
        type="number" 
        className="form-input" 
        min={min} 
        max={max} 
        step={step}
        value={localSettings[settingKey] ?? ''} 
        onChange={(e) => handleChange(settingKey, parseFloat(e.target.value) || 0)} 
      />
    </div>
  );

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-header-title">System Settings & Calibration</h1>
          <p className="page-header-desc">
            Configure AI model weights, notification thresholds, audio synthesizers, and database retention
          </p>
        </div>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          <Save size={16} />
          <span>{saving ? 'Saving…' : 'Save Changes'}</span>
        </button>
      </div>

      {/* Floating Toast Notification */}
      {toast && (
        <div className="toast-container">
          <div className="modern-toast" style={{ borderColor: toast.type === 'error' ? 'var(--danger)' : 'var(--success)' }}>
            {toast.type === 'error' ? (
              <AlertCircle size={18} style={{ color: 'var(--danger)' }} />
            ) : (
              <CheckCircle2 size={18} style={{ color: 'var(--success)' }} />
            )}
            <span>{toast.msg}</span>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="modern-tabs">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button 
              key={tab.id}
              className={`modern-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon size={15} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Settings Panel */}
      <div className="card">
        {/* Tab 1: Intelligence / Prediction Engine */}
        {activeTab === 'Intelligence' && (
          <div>
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                AI Prediction Model Weights
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
                Fine-tune how much influence recency, sequential Markov transitions, and time-of-day clustering have when forecasting next actions.
              </p>
            </div>

            <div className="settings-grid">
              <NumberField label="Markov Sequence Weight" settingKey="PREDICTION_WEIGHT_SEQUENCE" min={0} max={1} step={0.05} unit="0.0 - 1.0" />
              <NumberField label="Recency Transition Weight" settingKey="PREDICTION_WEIGHT_RECENCY" min={0} max={1} step={0.05} unit="0.0 - 1.0" />
              <NumberField label="Time-of-Day Weight" settingKey="PREDICTION_WEIGHT_TIME" min={0} max={1} step={0.05} unit="0.0 - 1.0" />
              <NumberField label="Minimum Confidence Threshold" settingKey="PREDICTION_MIN_CONFIDENCE" min={0} max={1} step={0.05} unit="0.0 - 1.0" />
            </div>

            <div style={{ margin: '1.5rem 0 1rem' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                Deep Learning Hybrid Calibration
              </h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.2rem' }}>
                Balance between PyTorch LSTM neural predictions and cold-start statistical heuristics.
              </p>
            </div>
            <div className="settings-grid">
              <NumberField label="LSTM Neural Weight" settingKey="PREDICTION_ML_WEIGHT" min={0} max={1} step={0.05} unit="default 0.65" />
              <NumberField label="Statistical Engine Weight" settingKey="PREDICTION_STATISTICAL_WEIGHT" min={0} max={1} step={0.05} unit="default 0.35" />
              <NumberField label="LSTM Sequence Window (k)" settingKey="LSTM_SEQUENCE_LENGTH" min={1} max={10} step={1} unit="tokens" />
              <NumberField label="Min Training Samples" settingKey="LSTM_MIN_TRAINING_SAMPLES" min={5} max={100} step={5} unit="events" />
              <NumberField label="Auto-Retrain Interval" settingKey="LSTM_AUTOTRAIN_INTERVAL" min={5} max={100} step={5} unit="switches" />
            </div>

            <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', color: 'var(--accent-highlight)', fontSize: '0.86rem', fontWeight: 600 }}>
                <Sparkles size={16} />
                <span>Optimal Calibration Tip</span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
                Weights should ideally sum close to 1.0. For fast project switching workflows, increase the Recency weight. For daily routine tasks, prioritize Sequence and Time weights.
              </p>
            </div>
          </div>
        )}

        {/* Tab 2: Notifications */}
        {activeTab === 'Notifications' && (
          <div>
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Desktop Alerts & Notification Center
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
                Deep OS delivers native Windows notification popups with one-click app launch actions.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <div>
                  <h4 style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Enable Prediction Notification Popups
                  </h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    Trigger actionable desktop toasts when prediction confidence exceeds the activation threshold
                  </p>
                </div>
                <Toggle 
                  checked={localSettings.NOTIFICATION_ENABLED} 
                  onChange={(val) => handleChange('NOTIFICATION_ENABLED', val)} 
                />
              </div>

              <div style={{ maxWidth: '380px' }}>
                <NumberField 
                  label="Notification Cooldown Interval" 
                  settingKey="NOTIFICATION_COOLDOWN_MINUTES" 
                  min={1} 
                  max={120} 
                  unit="Minutes" 
                />
              </div>
            </div>

            {/* Test Notification Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  if (window.electronAPI && window.electronAPI.testNotification) {
                    window.electronAPI.testNotification();
                    showToast('Native toast dispatched. Check your Windows notification area.', 'success');
                  } else {
                    showToast('Electron notification bridge not detected (browser preview mode).', 'error');
                  }
                }}
              >
                <Bell size={15} />
                <span>Test Windows Notification</span>
              </button>

              <button
                className="btn btn-secondary"
                onClick={async () => {
                  try {
                    const res = await fetch('http://127.0.0.1:8000/api/settings/reset-cooldown', { method: 'POST' });
                    const result = await res.json();
                    showToast(result.message || 'Cooldown timer reset.', result.success ? 'success' : 'error');
                  } catch {
                    showToast('Could not reach backend service.', 'error');
                  }
                }}
                title="Resets cooldown so next prediction can fire immediately"
              >
                <RotateCcw size={15} />
                <span>Reset Alert Cooldown</span>
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginLeft: 'auto' }}>
                <span className="status-dot-pulse" style={{ width: 7, height: 7 }} />
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Status: Notification Subsystem Ready</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Audio */}
        {activeTab === 'Audio' && (
          <div>
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Audio Recommendations & Voice Synthesis
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
                Deep OS can announce urgent predictions and workflow reminders verbally.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', marginBottom: '1.5rem' }}>
              <div>
                <h4 style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Enable Audio Spoken Recommendations
                </h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  Reads high-confidence predictions aloud via the system text-to-speech engine
                </p>
              </div>
              <Toggle 
                checked={localSettings.AUDIO_ENABLED} 
                onChange={(val) => handleChange('AUDIO_ENABLED', val)} 
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
              <button 
                className="btn btn-secondary"
                onClick={async () => {
                  try {
                    const res = await fetch('http://127.0.0.1:8000/api/settings/test-audio', { method: 'POST' });
                    const result = await res.json();
                    showToast(result.message || 'Audio test completed.', result.success ? 'success' : 'error');
                  } catch {
                    showToast('Failed to trigger audio synthesizer.', 'error');
                  }
                }}
              >
                <Volume2 size={15} />
                <span>Test Audio Voice</span>
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginLeft: 'auto' }}>
                <span className="status-dot-pulse" style={{ width: 7, height: 7 }} />
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Status: Audio Engine Online</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Focus */}
        {activeTab === 'Focus' && (
          <div>
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Focus Mode Startup & Behavior
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
                Set your default productivity posture when the operating system boots.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', marginBottom: '1.5rem' }}>
              <div>
                <h4 style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Auto-Enable Focus Mode on Boot
                </h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  Automatically start in flow state whenever Deep OS launches
                </p>
              </div>
              <Toggle 
                checked={localSettings.FOCUS_MODE_ENABLED} 
                onChange={(val) => handleChange('FOCUS_MODE_ENABLED', val)} 
              />
            </div>

            <div className="form-group" style={{ maxWidth: '420px' }}>
              <label className="form-label">Default Focus Intensity Level</label>
              <select 
                className="form-select"
                value={localSettings.FOCUS_MODE_LEVEL ?? 1}
                onChange={(e) => handleChange('FOCUS_MODE_LEVEL', parseInt(e.target.value, 10))}
              >
                <option value={1}>Tier 1: Light — Suppress promotional notifications</option>
                <option value={2}>Tier 2: Balanced — Suppress non-essential app alerts</option>
                <option value={3}>Tier 3: Strict Deep Work — Critical system warnings only</option>
              </select>
            </div>
          </div>
        )}

        {/* Tab 5: Monitoring */}
        {activeTab === 'Monitoring' && (
          <div>
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Telemetry Intervals & Hardware Thresholds
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
                Control monitoring frequency and alert trigger points for hardware pressure.
              </p>
            </div>

            <div className="settings-grid" style={{ marginBottom: '1.5rem' }}>
              <NumberField label="System Monitor Polling" settingKey="MONITORING_INTERVAL_SYSTEM" min={1} max={30} unit="Seconds" />
              <NumberField label="Process Scanner Polling" settingKey="MONITORING_INTERVAL_PROCESS" min={1} max={60} unit="Seconds" />
              <NumberField label="App Transition Polling" settingKey="MONITORING_INTERVAL_APP" min={1} max={10} unit="Seconds" />
            </div>

            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
              Hardware Warning & Critical Limits
            </h4>
            <div className="settings-grid">
              <NumberField label="CPU Warning Threshold" settingKey="CPU_THRESHOLD_WARNING" min={0} max={100} unit="%" />
              <NumberField label="CPU Critical Threshold" settingKey="CPU_THRESHOLD_CRITICAL" min={0} max={100} unit="%" />
              <NumberField label="RAM Warning Threshold" settingKey="RAM_THRESHOLD_WARNING" min={0} max={100} unit="%" />
              <NumberField label="RAM Critical Threshold" settingKey="RAM_THRESHOLD_CRITICAL" min={0} max={100} unit="%" />
              <NumberField label="Disk Warning Threshold" settingKey="DISK_THRESHOLD_WARNING" min={0} max={100} unit="%" />
              <NumberField label="Disk Critical Threshold" settingKey="DISK_THRESHOLD_CRITICAL" min={0} max={100} unit="%" />
            </div>
          </div>
        )}

        {/* Tab 6: Data & Storage */}
        {activeTab === 'Data' && (
          <div>
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Telemetry Retention & Storage Maintenance
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
                Manage how long logs, metrics, and application snapshots are preserved locally.
              </p>
            </div>

            <div className="settings-grid" style={{ marginBottom: '1.5rem' }}>
              <NumberField label="Metrics History Retention" settingKey="RETENTION_METRICS_DAYS" min={1} max={365} unit="Days" />
              <NumberField label="Process Snapshot Retention" settingKey="RETENTION_SNAPSHOTS_DAYS" min={1} max={90} unit="Days" />
              <NumberField label="Event Logs Retention" settingKey="RETENTION_EVENTS_DAYS" min={1} max={365} unit="Days" />
              <NumberField label="Recommendation Archive" settingKey="RETENTION_RECOMMENDATIONS_DAYS" min={1} max={365} unit="Days" />
              <NumberField label="Automated Vacuum Interval" settingKey="CLEANUP_INTERVAL_HOURS" min={1} max={48} unit="Hours" />
            </div>

            {/* Database Telemetry Card */}
            <div style={{ padding: '1.25rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <Database size={18} style={{ color: 'var(--accent-primary)' }} />
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Local SQLite Database
                  </h4>
                </div>
                <button className="btn btn-danger btn-sm" onClick={handleCleanup}>
                  <Trash2 size={13} />
                  <span>Run Cleanup & Vacuum</span>
                </button>
              </div>

              {dbStatus ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', fontSize: '0.84rem' }}>
                  <div>
                    <span style={{ color: 'var(--text-dim)', display: 'block' }}>Database Size</span>
                    <strong style={{ color: 'var(--text-primary)', fontSize: '1.1rem' }}>
                      {dbStatus.size_mb?.toFixed(2) || 0} MB
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-dim)', display: 'block' }}>Last Maintenance Run</span>
                    <span style={{ color: 'var(--text-secondary)' }}>
                      {dbStatus.last_cleanup || 'Automatic (Scheduled)'}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-dim)', display: 'block' }}>Encryption & Integrity</span>
                    <strong style={{ color: 'var(--success)' }}>Optimal / WAL Mode</strong>
                  </div>
                </div>
              ) : (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem' }}>Querying database status...</p>
              )}
            </div>
          </div>
        )}

        {/* Tab 7: Privacy & Demo */}
        {activeTab === 'Privacy' && (
          <div>
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Privacy Policy & Demo Simulation
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
                Deep OS is designed with local-first telemetry architecture.
              </p>
            </div>

            <div style={{ padding: '1.25rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.5rem' }}>
                <Shield size={18} style={{ color: 'var(--success)' }} />
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  100% On-Device Data Confidentiality
                </h4>
              </div>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Deep OS operates entirely offline. It does NOT capture keystrokes, clipboard contents, screen captures, or personal files. Only foreground application names and window transition timestamps are stored in the local SQLite database, exclusively for training your on-device LSTM neural network and generating workflow recommendations.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div>
                <h4 style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Demo Presentation Mode
                </h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  Injects synthetic telemetry for college project demonstrations when system history is empty
                </p>
              </div>
              <Toggle 
                checked={localSettings.DEMO_MODE} 
                onChange={(val) => handleChange('DEMO_MODE', val)} 
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}