import React, { useState, useEffect } from 'react';
import { 
  getRecommendations, 
  getRecommendationHistory, 
  dismissRecommendation, 
  acceptRecommendation 
} from '../services/api';
import { 
  Lightbulb, 
  Check, 
  X, 
  AlertTriangle, 
  Info, 
  AlertCircle, 
  History, 
  Sparkles, 
  CheckCircle2, 
  Filter,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import EmptyState from '../components/Common/EmptyState';
import LoadingSkeleton from '../components/Common/LoadingSkeleton';

export default function RecommendationsPage() {
  const [activeRecs, setActiveRecs] = useState([]);
  const [historyRecs, setHistoryRecs] = useState([]);
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'history'
  const [severityFilter, setSeverityFilter] = useState('all'); // 'all' | 'critical' | 'warning' | 'info'
  const [loading, setLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const active = await getRecommendations();
      const hist = await getRecommendationHistory();
      setActiveRecs(active || []);
      setHistoryRecs(hist || []);
    } catch (err) {
      console.error('Failed to fetch recommendations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAction = async (id, actionType) => {
    setActionInProgress(id);
    try {
      if (actionType === 'accept') {
        await acceptRecommendation(id);
      } else {
        await dismissRecommendation(id);
      }
      await fetchData();
    } catch (err) {
      console.error(`Action ${actionType} failed for recommendation ${id}:`, err);
    } finally {
      setActionInProgress(null);
    }
  };

  const getSeverityBadge = (sev = '') => {
    const s = sev.toLowerCase();
    if (s === 'critical') return { icon: AlertCircle, variant: 'danger', label: 'Critical' };
    if (s === 'warning') return { icon: AlertTriangle, variant: 'warning', label: 'Warning' };
    return { icon: Info, variant: 'info', label: 'Advisory' };
  };

  const filteredActive = activeRecs.filter(r => {
    if (severityFilter === 'all') return true;
    return (r.severity || 'info').toLowerCase() === severityFilter;
  });

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-header-title">Recommendations Engine</h1>
          <p className="page-header-desc">
            Contextual optimization proposals and proactive workflow automation
          </p>
        </div>
        <button className="btn btn-secondary" onClick={fetchData} disabled={loading}>
          <RefreshCw size={15} className={loading ? 'spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Tabs & Filter Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div className="modern-tabs">
          <button 
            className={`modern-tab-btn ${activeTab === 'active' ? 'active' : ''}`}
            onClick={() => setActiveTab('active')}
          >
            <Lightbulb size={15} />
            <span>Active Recommendations</span>
            <span className="badge badge-primary badge-sm" style={{ marginLeft: '0.25rem' }}>
              {activeRecs.length}
            </span>
          </button>
          <button 
            className={`modern-tab-btn ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            <History size={15} />
            <span>Resolution History</span>
            <span className="badge badge-muted badge-sm" style={{ marginLeft: '0.25rem' }}>
              {historyRecs.length}
            </span>
          </button>
        </div>

        {activeTab === 'active' && activeRecs.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Filter size={14} style={{ color: 'var(--text-muted)' }} />
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Filter:</span>
            {['all', 'critical', 'warning', 'info'].map((f) => (
              <button
                key={f}
                className={`btn btn-ghost btn-sm ${severityFilter === f ? 'btn-secondary' : ''}`}
                style={{ textTransform: 'capitalize', padding: '0.25rem 0.55rem' }}
                onClick={() => setSeverityFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Content Area */}
      {loading ? (
        <LoadingSkeleton type="card" count={3} height="120px" />
      ) : activeTab === 'active' ? (
        filteredActive.length === 0 ? (
          <EmptyState 
            icon={Lightbulb}
            title={severityFilter === 'all' ? "Nothing to analyze yet" : "No recommendations in this filter"}
            description={severityFilter === 'all' 
              ? "Deep OS is learning your workflow. Continue using your applications and Deep OS will identify recurring patterns and optimization opportunities."
              : "Try switching back to 'All' to view other pending advisory recommendations."}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {filteredActive.map((rec) => {
              const sev = (rec.severity || 'info').toLowerCase();
              const badgeInfo = getSeverityBadge(sev);
              const SevIcon = badgeInfo.icon;
              const isWorking = actionInProgress === rec.id;

              return (
                <div key={rec.id} className="card recommendation-card-item" style={{ margin: 0 }}>
                  <div className={`rec-badge-icon ${sev}`}>
                    <SevIcon size={20} />
                  </div>

                  <div className="rec-content-area">
                    <div className="rec-title-row">
                      <h4>{rec.message}</h4>
                      <span className={`badge badge-${badgeInfo.variant} badge-sm`}>
                        {badgeInfo.label}
                      </span>
                    </div>

                    <p className="rec-reason-text" style={{ marginTop: '0.35rem', marginBottom: '0.65rem' }}>
                      <strong style={{ color: 'var(--text-primary)' }}>Why this matters: </strong>
                      {rec.reason || 'Detected based on continuous background system monitoring and software telemetry.'}
                    </p>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                      <Sparkles size={13} style={{ color: 'var(--accent-primary)' }} />
                      <span>Deep OS Automated Advisory</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexShrink: 0 }}>
                    <button 
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleAction(rec.id, 'dismiss')}
                      disabled={isWorking}
                      title="Ignore this suggestion"
                    >
                      <X size={14} /> Dismiss
                    </button>
                    <button 
                      className="btn btn-primary btn-sm"
                      onClick={() => handleAction(rec.id, 'accept')}
                      disabled={isWorking}
                      title="Apply this recommendation"
                    >
                      <Check size={14} /> Accept & Apply
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* History Tab */
        historyRecs.length === 0 ? (
          <EmptyState 
            icon={History}
            title="No Recommendation History"
            description="Actions taken on proactive suggestions and system notifications will be archived here for reference."
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {historyRecs.map((rec) => {
              const sev = (rec.severity || 'info').toLowerCase();
              const badgeInfo = getSeverityBadge(sev);
              const SevIcon = badgeInfo.icon;
              const dateStr = rec.timestamp ? new Date(rec.timestamp).toLocaleString() : 'Past Session';

              return (
                <div 
                  key={rec.id} 
                  className="card"
                  style={{ 
                    padding: '1rem 1.25rem', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    opacity: 0.85
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div className={`rec-badge-icon ${sev}`} style={{ width: 32, height: 32 }}>
                      <SevIcon size={16} />
                    </div>
                    <div>
                      <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {rec.message}
                      </h4>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                        Action: <strong style={{ color: rec.user_action === 'accepted' ? 'var(--success)' : 'var(--text-secondary)' }}>{rec.user_action || 'Processed'}</strong>
                        {rec.reason ? ` — ${rec.reason}` : ''}
                      </p>
                    </div>
                  </div>

                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>
                    {dateStr}
                  </span>
                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}