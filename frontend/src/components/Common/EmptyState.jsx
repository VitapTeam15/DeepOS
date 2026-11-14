import React from 'react';
import { Sparkles, Brain, Inbox } from 'lucide-react';

export default function EmptyState({ 
  icon: Icon = Brain, 
  title = "Nothing to analyze yet", 
  description = "Deep OS is learning your workflow. Continue using your applications and Deep OS will identify recurring patterns.",
  action = null
}) {
  return (
    <div className="empty-state-card">
      <div className="empty-state-icon-wrap">
        <Icon size={26} />
      </div>
      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-desc">{description}</p>
      {action && <div style={{ marginTop: '1.25rem' }}>{action}</div>}
    </div>
  );
}
