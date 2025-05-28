import React, { useState } from 'react';
import { AuditEvent } from '../../types';

export interface AuditEventDetailsProps {
  event: AuditEvent | null;
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

interface DetailRowProps {
  label: string;
  value: any;
  type?: 'text' | 'date' | 'json' | 'badge';
  copyable?: boolean;
}

const DetailRow: React.FC<DetailRowProps> = ({
  label,
  value,
  type = 'text',
  copyable = false,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!copyable || !value) return;
    
    try {
      await navigator.clipboard.writeText(String(value));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const renderValue = () => {
    if (value === null || value === undefined) {
      return <span className="audit-detail-empty">-</span>;
    }

    switch (type) {
      case 'date':
        return (
          <span className="audit-detail-date">
            {new Date(value).toLocaleString()}
          </span>
        );
      
      case 'json':
        return (
          <pre className="audit-detail-json">
            {JSON.stringify(value, null, 2)}
          </pre>
        );
      
      case 'badge':
        return (
          <span className={`audit-detail-badge audit-badge-${value}`}>
            {String(value).toUpperCase()}
          </span>
        );
      
      default:
        return <span className="audit-detail-text">{String(value)}</span>;
    }
  };

  return (
    <div className="audit-detail-row">
      <div className="audit-detail-label">{label}</div>
      <div className="audit-detail-value">
        {renderValue()}
        {copyable && value && (
          <button
            className="audit-copy-btn"
            onClick={handleCopy}
            title="Copy to clipboard"
          >
            {copied ? '✓' : '📋'}
          </button>
        )}
      </div>
    </div>
  );
};

export const AuditEventDetails: React.FC<AuditEventDetailsProps> = ({
  event,
  isOpen,
  onClose,
  className = '',
}) => {
  if (!isOpen || !event) {
    return null;
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className={`audit-modal-backdrop ${className}`} onClick={handleBackdropClick}>
      <div className="audit-modal-container">
        <div className="audit-modal-header">
          <h2>Audit Event Details</h2>
          <button
            className="audit-modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="audit-modal-content">
          <div className="audit-details-grid">
            {/* Basic Information */}
            <section className="audit-detail-section">
              <h3>Basic Information</h3>
              <DetailRow label="Event ID" value={event.id} copyable />
              <DetailRow label="Timestamp" value={event.timestamp} type="date" />
              <DetailRow label="Action" value={event.action} type="badge" />
              <DetailRow label="Level" value={event.level} type="badge" />
              <DetailRow label="Description" value={event.description} />
            </section>

            {/* Actor Information */}
            <section className="audit-detail-section">
              <h3>Actor Information</h3>
              <DetailRow label="Actor ID" value={event.actorId} copyable />
              <DetailRow label="Actor Type" value={event.actorType} type="badge" />
              <DetailRow label="IP Address" value={event.ipAddress} copyable />
              <DetailRow label="User Agent" value={event.userAgent} />
            </section>

            {/* Resource Information */}
            <section className="audit-detail-section">
              <h3>Resource Information</h3>
              <DetailRow label="Resource ID" value={event.resourceId} copyable />
              <DetailRow label="Resource Type" value={event.resourceType} type="badge" />
            </section>

            {/* Additional Information */}
            <section className="audit-detail-section">
              <h3>Additional Information</h3>
              <DetailRow label="Correlation ID" value={event.correlationId} copyable />
              {event.context && Object.keys(event.context).length > 0 && (
                <DetailRow label="Context" value={event.context} type="json" />
              )}
              {event.metadata && Object.keys(event.metadata).length > 0 && (
                <DetailRow label="Metadata" value={event.metadata} type="json" />
              )}
            </section>
          </div>
        </div>

        <div className="audit-modal-footer">
          <button
            className="audit-btn audit-btn-secondary"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// CSS styles for the event details modal
export const auditEventDetailsStyles = `
.audit-modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: audit-modal-fade-in 0.2s ease-out;
}

@keyframes audit-modal-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

.audit-modal-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  max-width: 800px;
  max-height: 90vh;
  width: 90%;
  display: flex;
  flex-direction: column;
  animation: audit-modal-slide-in 0.3s ease-out;
}

@keyframes audit-modal-slide-in {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.audit-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #dee2e6;
}

.audit-modal-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #495057;
}

.audit-modal-close {
  background: none;
  border: none;
  font-size: 24px;
  color: #6c757d;
  cursor: pointer;
  padding: 4px;
  line-height: 1;
  border-radius: 4px;
  transition: all 0.2s;
}

.audit-modal-close:hover {
  background: #f8f9fa;
  color: #495057;
}

.audit-modal-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.audit-details-grid {
  display: grid;
  gap: 24px;
}

.audit-detail-section {
  background: #f8f9fa;
  border-radius: 6px;
  padding: 16px;
}

.audit-detail-section h3 {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: #495057;
  border-bottom: 1px solid #dee2e6;
  padding-bottom: 8px;
}

.audit-detail-row {
  display: grid;
  grid-template-columns: 140px 1fr;
  gap: 12px;
  margin-bottom: 12px;
  align-items: start;
}

.audit-detail-row:last-child {
  margin-bottom: 0;
}

.audit-detail-label {
  font-size: 12px;
  font-weight: 600;
  color: #6c757d;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding-top: 2px;
}

.audit-detail-value {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  min-height: 20px;
}

.audit-detail-text {
  word-break: break-word;
  line-height: 1.4;
}

.audit-detail-empty {
  color: #6c757d;
  font-style: italic;
}

.audit-detail-date {
  font-family: monospace;
  background: #e9ecef;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 12px;
}

.audit-detail-json {
  background: #f1f3f4;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  padding: 12px;
  font-size: 12px;
  line-height: 1.4;
  overflow-x: auto;
  margin: 0;
  max-height: 200px;
  overflow-y: auto;
}

.audit-detail-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
}

.audit-badge-create,
.audit-badge-info { background: #d1ecf1; color: #0c5460; }
.audit-badge-update,
.audit-badge-warn { background: #fff3cd; color: #856404; }
.audit-badge-delete,
.audit-badge-error { background: #f8d7da; color: #721c24; }
.audit-badge-login,
.audit-badge-debug { background: #e2e3e5; color: #6c757d; }
.audit-badge-user { background: #d4edda; color: #155724; }
.audit-badge-system { background: #cce5ff; color: #004085; }
.audit-badge-service { background: #e6f3ff; color: #0056b3; }
.audit-badge-admin { background: #f8d7da; color: #721c24; }
.audit-badge-anonymous { background: #f8f9fa; color: #6c757d; }

.audit-copy-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 2px 4px;
  border-radius: 3px;
  font-size: 12px;
  color: #6c757d;
  transition: all 0.2s;
  flex-shrink: 0;
}

.audit-copy-btn:hover {
  background: #e9ecef;
  color: #495057;
}

.audit-modal-footer {
  padding: 16px 20px;
  border-top: 1px solid #dee2e6;
  text-align: right;
}

.audit-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.5;
  border: 1px solid transparent;
  border-radius: 4px;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.2s;
  user-select: none;
}

.audit-btn-secondary {
  background: #6c757d;
  border-color: #6c757d;
  color: white;
}

.audit-btn-secondary:hover {
  background: #545b62;
  border-color: #545b62;
}

@media (max-width: 768px) {
  .audit-modal-container {
    width: 95%;
    margin: 20px;
    max-height: calc(100vh - 40px);
  }
  
  .audit-modal-header,
  .audit-modal-content,
  .audit-modal-footer {
    padding: 16px;
  }
  
  .audit-detail-row {
    grid-template-columns: 1fr;
    gap: 4px;
  }
  
  .audit-detail-label {
    font-size: 11px;
  }
  
  .audit-details-grid {
    gap: 16px;
  }
  
  .audit-detail-section {
    padding: 12px;
  }
}
`;
