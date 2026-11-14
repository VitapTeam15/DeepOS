import React, { useState, useEffect } from 'react';
import { getFocusMode, setFocusMode } from '../services/api';
import { 
  Focus, 
  Play, 
  Pause, 
  RotateCcw, 
  ShieldCheck, 
  BellOff, 
  Zap, 
  Sparkles, 
  Clock, 
  CheckCircle2 
} from 'lucide-react';
import Toggle from '../components/Common/Toggle';

const LEVELS = [
  { 
    value: 1, 
    label: 'Light Focus', 
    badge: 'Standard',
    desc: 'Reduces low-priority and promotional notification popups. Allows normal communication alerts.' 
  },
  { 
    value: 2, 
    label: 'Balanced Flow', 
    badge: 'Recommended',
    desc: 'Suppresses all distracting non-essential app alerts. Preserves system alerts and warnings.' 
  },
  { 
    value: 3, 
    label: 'Strict Deep Work', 
    badge: 'Maximum',
    desc: 'Maximum notification suppression. Only critical hardware security and power warnings are permitted.' 
  }
];

const PRESETS = [
  { label: '25 min', minutes: 25, tag: 'Pomodoro' },
  { label: '45 min', minutes: 45, tag: 'Sprint' },
  { label: '60 min', minutes: 60, tag: 'Deep Work' },
  { label: '90 min', minutes: 90, tag: 'Marathon' },
];

export default function FocusModePage() {
  const [focusState, setFocusState] = useState({ enabled: false, level: 2 });
  const [selectedDuration, setSelectedDuration] = useState(25);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getFocusMode()
      .then((data) => {
        if (data) setFocusState(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Timer countdown hook
  useEffect(() => {
    let interval = null;
    if (isTimerRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isTimerRunning) {
      setIsTimerRunning(false);
      handleToggle(false);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timeLeft]);

  const handleToggle = async (enabled) => {
    const newState = { ...focusState, enabled };
    setFocusState(newState);
    if (enabled && !isTimerRunning && timeLeft > 0) {
      setIsTimerRunning(true);
    } else if (!enabled) {
      setIsTimerRunning(false);
    }
    try {
      await setFocusMode(newState.enabled, newState.level);
    } catch (err) {
      console.error('Failed to update focus mode:', err);
    }
  };

  const handleLevelSelect = async (level) => {
    const newState = { ...focusState, level };
    setFocusState(newState);
    try {
      await setFocusMode(newState.enabled, newState.level);
    } catch (err) {
      console.error('Failed to update focus level:', err);
    }
  };

  const selectDuration = (minutes) => {
    setSelectedDuration(minutes);
    setTimeLeft(minutes * 60);
    setIsTimerRunning(false);
  };

  const formatTimeRemaining = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const isEnabled = focusState.enabled;

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-header-title">Focus Mode</h1>
          <p className="page-header-desc">
            Reduce desktop distractions, suppress alerts, and preserve uninterrupted workflow
          </p>
        </div>
      </div>

      {/* Main Focus Control Hero Card */}
      <div className={`card ai-hero-card ${isEnabled ? 'focus-active-glow' : ''}`}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
          <div className="ai-hero-badge">
            <Focus size={13} />
            <span>Productivity Guard Engine</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: isEnabled ? 'var(--accent-secondary)' : 'var(--text-muted)' }}>
              Focus Mode: {isEnabled ? 'ACTIVE' : 'OFF'}
            </span>
            <Toggle checked={isEnabled} onChange={handleToggle} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '2rem', alignItems: 'center' }}>
          <div>
            <h2 className="ai-hero-title" style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>
              {isEnabled ? 'Deep Work Session in Progress' : 'Ready to Enter Flow State?'}
            </h2>
            <p className="ai-hero-description" style={{ marginBottom: '1.5rem' }}>
              {isEnabled 
                ? 'Deep OS is actively intercepting non-critical notifications, audio alerts, and task switching prompts so you can maintain total concentration.'
                : 'Select an intensity tier and session duration below. Deep OS will manage interruptions automatically while you work.'}
            </p>

            {/* Timer Controller */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <button 
                className={`btn ${isEnabled ? 'btn-secondary' : 'btn-primary'} btn-lg`}
                onClick={() => handleToggle(!isEnabled)}
              >
                {isEnabled ? (
                  <>
                    <Pause size={18} /> Stop Session
                  </>
                ) : (
                  <>
                    <Play size={18} /> Start Focus Session
                  </>
                )}
              </button>

              {isEnabled && (
                <button 
                  className="btn btn-secondary btn-lg"
                  onClick={() => selectDuration(selectedDuration)}
                  title="Reset session timer"
                >
                  <RotateCcw size={16} /> Reset Timer
                </button>
              )}
            </div>
          </div>

          {/* Big Countdown Clock Display */}
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            padding: '2rem',
            background: 'rgba(10, 14, 25, 0.6)',
            borderRadius: 'var(--radius-xl)',
            border: `1px solid ${isEnabled ? 'rgba(124, 92, 255, 0.4)' : 'var(--border-subtle)'}`,
            boxShadow: isEnabled ? '0 0 32px rgba(124, 92, 255, 0.2)' : 'none'
          }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.25rem' }}>
              Time Remaining
            </span>
            <div style={{ 
              fontSize: '3.6rem', 
              fontWeight: 800, 
              fontFamily: 'monospace', 
              color: isEnabled ? 'var(--accent-highlight)' : 'var(--text-primary)',
              letterSpacing: '-0.02em',
              lineHeight: 1
            }}>
              {formatTimeRemaining(timeLeft)}
            </div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '0.5rem' }}>
              Target: {selectedDuration} Minute Session
            </span>
          </div>
        </div>
      </div>

      {/* Preset Duration Selector */}
      <div className="card">
        <div className="card-header">
          <div className="card-title-group">
            <div className="card-title-icon">
              <Clock size={16} />
            </div>
            <div>
              <h3>Session Duration Presets</h3>
              <p>Configure dedicated work sprint intervals</p>
            </div>
          </div>
        </div>

        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
            {PRESETS.map((p) => {
              const isSelected = selectedDuration === p.minutes;
              return (
                <div
                  key={p.minutes}
                  onClick={() => selectDuration(p.minutes)}
                  style={{
                    padding: '1rem',
                    background: isSelected ? 'rgba(108, 140, 255, 0.12)' : 'var(--bg-secondary)',
                    border: `1px solid ${isSelected ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    transition: 'var(--transition-fast)',
                    textAlign: 'center'
                  }}
                >
                  <span className="badge badge-primary badge-sm" style={{ marginBottom: '0.5rem' }}>
                    {p.tag}
                  </span>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {p.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Intensity Level Selection */}
      <div className="card">
        <div className="card-header">
          <div className="card-title-group">
            <div className="card-title-icon">
              <ShieldCheck size={16} />
            </div>
            <div>
              <h3>Suppression Intensity Tier</h3>
              <p>Define how aggressively notifications and alerts should be filtered</p>
            </div>
          </div>
        </div>

        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem' }}>
            {LEVELS.map((lvl) => {
              const isSelected = focusState.level === lvl.value;
              return (
                <div
                  key={lvl.value}
                  onClick={() => handleLevelSelect(lvl.value)}
                  className={`focus-level-option ${isSelected ? 'selected' : ''}`}
                  style={{ padding: '1.25rem' }}
                >
                  <div className="focus-level-name">
                    <span>{lvl.label}</span>
                    <span className="badge badge-muted badge-sm">{lvl.badge}</span>
                  </div>
                  <p className="focus-level-desc" style={{ marginTop: '0.5rem', fontSize: '0.8rem' }}>
                    {lvl.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
