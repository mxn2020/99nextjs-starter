import React, { useState, useEffect } from 'react';
import { AuditStats, AuditEventFilter } from '../../types';

export interface AuditDashboardProps {
  stats: AuditStats;
  filter?: AuditEventFilter;
  loading?: boolean;
  error?: string;
  className?: string;
  onActionClick?: (action: string) => void;
  onLevelClick?: (level: string) => void;
}

interface MetricCardProps {
  title: string;
  value: number | string;
  icon?: string;
  color?: string;
  onClick?: () => void;
  loading?: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  icon,
  color = '#007bff',
  onClick,
  loading = false,
}) => (
  <div
    className={`audit-metric-card ${onClick ? 'clickable' : ''}`}
    style={{ borderTopColor: color }}
    onClick={onClick}
  >
    <div className="audit-metric-header">
      {icon && <span className="audit-metric-icon">{icon}</span>}
      <span className="audit-metric-title">{title}</span>
    </div>
    <div className="audit-metric-value">
      {loading ? (
        <div className="audit-metric-loading">...</div>
      ) : (
        typeof value === 'number' ? value.toLocaleString() : value
      )}
    </div>
  </div>
);

interface ChartBarProps {
  label: string;
  value: number;
  maxValue: number;
  color: string;
  onClick?: () => void;
}

const ChartBar: React.FC<ChartBarProps> = ({
  label,
  value,
  maxValue,
  color,
  onClick,
}) => {
  const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;

  return (
    <div
      className={`audit-chart-bar ${onClick ? 'clickable' : ''}`}
      onClick={onClick}
    >
      <div className="audit-chart-bar-header">
        <span className="audit-chart-bar-label">{label}</span>
        <span className="audit-chart-bar-value">{value.toLocaleString()}</span>
      </div>
      <div className="audit-chart-bar-container">
        <div
          className="audit-chart-bar-fill"
          style={{
            width: `${percentage}%`,
            backgroundColor: color,
          }}
        />
      </div>
    </div>
  );
};

const LEVEL_COLORS = {
  debug: '#6c757d',
  info: '#17a2b8',
  warn: '#ffc107',
  error: '#dc3545',
};

const ACTION_COLORS = [
  '#007bff', '#28a745', '#dc3545', '#ffc107', '#17a2b8',
  '#6f42c1', '#e83e8c', '#fd7e14', '#20c997', '#6c757d',
];

export const AuditDashboard: React.FC<AuditDashboardProps> = ({
  stats,
  filter,
  loading = false,
  error,
  className = '',
  onActionClick,
  onLevelClick,
}) => {
  const [timeRange, setTimeRange] = useState('24h');

  const getTimeRangeLabel = () => {
    if (filter?.startDate && filter?.endDate) {
      return `${filter.startDate.toLocaleDateString()} - ${filter.endDate.toLocaleDateString()}`;
    }
    return timeRange;
  };

  const sortedActions = Object.entries(stats.actionCounts || {})
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10); // Top 10 actions

  const sortedLevels = Object.entries(stats.levelCounts || {})
    .sort(([, a], [, b]) => b - a);

  const maxActionCount = Math.max(...Object.values(stats.actionCounts || {}), 1);
  const maxLevelCount = Math.max(...Object.values(stats.levelCounts || {}), 1);

  if (error) {
    return (
      <div className={`audit-dashboard-error ${className}`}>
        <div className="audit-error-message">
          <span className="audit-error-icon">⚠️</span>
          <span>Error loading dashboard: {error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`audit-dashboard ${className}`}>
      <div className="audit-dashboard-header">
        <h2>Audit Dashboard</h2>
        <div className="audit-dashboard-period">
          <span>Period: {getTimeRangeLabel()}</span>
        </div>
      </div>

      {/* Overview Metrics */}
      <div className="audit-metrics-grid">
        <MetricCard
          title="Total Events"
          value={stats.totalEvents || 0}
          icon="📊"
          color="#007bff"
          loading={loading}
        />
        <MetricCard
          title="Actions Types"
          value={Object.keys(stats.actionCounts || {}).length}
          icon="⚡"
          color="#28a745"
          loading={loading}
        />
        <MetricCard
          title="Error Events"
          value={stats.levelCounts?.error || 0}
          icon="🚨"
          color="#dc3545"
          loading={loading}
          onClick={() => onLevelClick?.('error')}
        />
        <MetricCard
          title="Warning Events"
          value={stats.levelCounts?.warn || 0}
          icon="⚠️"
          color="#ffc107"
          loading={loading}
          onClick={() => onLevelClick?.('warn')}
        />
      </div>

      <div className="audit-charts-grid">
        {/* Actions Chart */}
        <div className="audit-chart-container">
          <div className="audit-chart-header">
            <h3>Top Actions</h3>
            <span className="audit-chart-subtitle">
              {sortedActions.length} of {Object.keys(stats.actionCounts || {}).length} actions
            </span>
          </div>
          <div className="audit-chart-content">
            {loading ? (
              <div className="audit-chart-loading">Loading actions...</div>
            ) : sortedActions.length === 0 ? (
              <div className="audit-chart-empty">No actions found</div>
            ) : (
              sortedActions.map(([action, count], index) => (
                <ChartBar
                  key={action}
                  label={action.replace('_', ' ').toUpperCase()}
                  value={count}
                  maxValue={maxActionCount}
                  color={ACTION_COLORS[index % ACTION_COLORS.length]}
                  onClick={() => onActionClick?.(action)}
                />
              ))
            )}
          </div>
        </div>

        {/* Levels Chart */}
        <div className="audit-chart-container">
          <div className="audit-chart-header">
            <h3>Event Levels</h3>
            <span className="audit-chart-subtitle">
              Distribution by severity
            </span>
          </div>
          <div className="audit-chart-content">
            {loading ? (
              <div className="audit-chart-loading">Loading levels...</div>
            ) : sortedLevels.length === 0 ? (
              <div className="audit-chart-empty">No levels found</div>
            ) : (
              sortedLevels.map(([level, count]) => (
                <ChartBar
                  key={level}
                  label={level.toUpperCase()}
                  value={count}
                  maxValue={maxLevelCount}
                  color={LEVEL_COLORS[level as keyof typeof LEVEL_COLORS] || '#6c757d'}
                  onClick={() => onLevelClick?.(level)}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// CSS styles for the dashboard component
export const auditDashboardStyles = `
.audit-dashboard {
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 24px;
  margin-bottom: 24px;
}

.audit-dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #dee2e6;
}

.audit-dashboard-header h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #495057;
}

.audit-dashboard-period {
  font-size: 14px;
  color: #6c757d;
}

.audit-metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 32px;
}

.audit-metric-card {
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  border-top: 4px solid #007bff;
  padding: 20px;
  transition: all 0.2s;
}

.audit-metric-card.clickable {
  cursor: pointer;
}

.audit-metric-card.clickable:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  transform: translateY(-1px);
}

.audit-metric-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.audit-metric-icon {
  font-size: 20px;
}

.audit-metric-title {
  font-size: 14px;
  font-weight: 500;
  color: #6c757d;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.audit-metric-value {
  font-size: 32px;
  font-weight: 700;
  color: #495057;
  line-height: 1;
}

.audit-metric-loading {
  color: #6c757d;
  font-size: 24px;
}

.audit-charts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
}

.audit-chart-container {
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 20px;
}

.audit-chart-header {
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f1f3f4;
}

.audit-chart-header h3 {
  margin: 0 0 4px 0;
  font-size: 18px;
  font-weight: 600;
  color: #495057;
}

.audit-chart-subtitle {
  font-size: 12px;
  color: #6c757d;
}

.audit-chart-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.audit-chart-loading,
.audit-chart-empty {
  text-align: center;
  padding: 40px;
  color: #6c757d;
  font-style: italic;
}

.audit-chart-bar {
  transition: all 0.2s;
}

.audit-chart-bar.clickable {
  cursor: pointer;
}

.audit-chart-bar.clickable:hover {
  opacity: 0.8;
}

.audit-chart-bar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.audit-chart-bar-label {
  font-size: 12px;
  font-weight: 500;
  color: #495057;
}

.audit-chart-bar-value {
  font-size: 12px;
  font-weight: 600;
  color: #6c757d;
}

.audit-chart-bar-container {
  height: 8px;
  background: #f1f3f4;
  border-radius: 4px;
  overflow: hidden;
}

.audit-chart-bar-fill {
  height: 100%;
  transition: width 0.3s ease;
  border-radius: 4px;
}

.audit-dashboard-error {
  padding: 20px;
  background: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 8px;
  color: #721c24;
}

.audit-error-message {
  display: flex;
  align-items: center;
  gap: 8px;
}

.audit-error-icon {
  font-size: 18px;
}

@media (max-width: 768px) {
  .audit-dashboard {
    padding: 16px;
    margin-bottom: 16px;
  }
  
  .audit-dashboard-header {
    flex-direction: column;
    gap: 8px;
    align-items: stretch;
    text-align: center;
  }
  
  .audit-metrics-grid {
    grid-template-columns: 1fr;
    gap: 12px;
    margin-bottom: 24px;
  }
  
  .audit-metric-card {
    padding: 16px;
  }
  
  .audit-metric-value {
    font-size: 24px;
  }
  
  .audit-charts-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .audit-chart-container {
    padding: 16px;
  }
}
`;
