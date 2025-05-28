import React, { useState, useEffect } from 'react';
import { AuditEventFilter, AuditAction, AuditLevel, ActorType, ResourceType } from '../../types';

export interface AuditFiltersProps {
  filter: AuditEventFilter;
  onFilterChange: (filter: AuditEventFilter) => void;
  onApply?: () => void;
  onClear?: () => void;
  className?: string;
}

const AUDIT_ACTIONS: AuditAction[] = [
  'create', 'update', 'delete', 'read', 'login', 'logout', 'register',
  'password_change', 'password_reset', 'email_verify', 'role_change',
  'permission_grant', 'permission_revoke', 'session_start', 'session_end',
  'api_call', 'file_upload', 'file_download', 'export', 'import',
  'backup', 'restore', 'config_change', 'maintenance', 'other'
];

const AUDIT_LEVELS: AuditLevel[] = ['debug', 'info', 'warn', 'error'];

const ACTOR_TYPES: ActorType[] = ['user', 'system', 'service', 'admin', 'anonymous'];

const RESOURCE_TYPES: ResourceType[] = [
  'user', 'post', 'comment', 'file', 'setting', 'role', 'permission', 'session', 'other'
];

export const AuditFilters: React.FC<AuditFiltersProps> = ({
  filter,
  onFilterChange,
  onApply,
  onClear,
  className = '',
}) => {
  const [localFilter, setLocalFilter] = useState<AuditEventFilter>(filter);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    setLocalFilter(filter);
  }, [filter]);

  const updateFilter = (updates: Partial<AuditEventFilter>) => {
    const newFilter = { ...localFilter, ...updates };
    setLocalFilter(newFilter);
    onFilterChange(newFilter);
  };

  const handleDateChange = (field: 'startDate' | 'endDate', value: string) => {
    updateFilter({
      [field]: value ? new Date(value) : undefined,
    });
  };

  const handleClear = () => {
    const clearedFilter: AuditEventFilter = {};
    setLocalFilter(clearedFilter);
    onFilterChange(clearedFilter);
    onClear?.();
  };

  const formatDateForInput = (date?: Date) => {
    if (!date) return '';
    return date.toISOString().split('T')[0];
  };

  const hasActiveFilters = Object.keys(localFilter).some(key => {
    const value = localFilter[key as keyof AuditEventFilter];
    return value !== undefined && value !== '';
  });

  return (
    <div className={`audit-filters ${className}`}>
      <div className="audit-filters-header">
        <div className="audit-filters-title">
          <h3>Filters</h3>
          {hasActiveFilters && (
            <span className="audit-active-filters-count">
              {Object.keys(localFilter).filter(key => localFilter[key as keyof AuditEventFilter]).length} active
            </span>
          )}
        </div>
        <div className="audit-filters-actions">
          <button
            type="button"
            className="audit-btn audit-btn-secondary audit-btn-sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? 'Collapse' : 'Expand'}
          </button>
          {hasActiveFilters && (
            <button
              type="button"
              className="audit-btn audit-btn-outline audit-btn-sm"
              onClick={handleClear}
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      <div className={`audit-filters-content ${isExpanded ? 'expanded' : ''}`}>
        <div className="audit-filters-grid">
          {/* Search */}
          <div className="audit-filter-group">
            <label htmlFor="search" className="audit-filter-label">
              Search Description
            </label>
            <input
              id="search"
              type="text"
              className="audit-filter-input"
              placeholder="Search in descriptions..."
              value={localFilter.search || ''}
              onChange={(e) => updateFilter({ search: e.target.value || undefined })}
            />
          </div>

          {/* Date Range */}
          <div className="audit-filter-group">
            <label htmlFor="startDate" className="audit-filter-label">
              Start Date
            </label>
            <input
              id="startDate"
              type="date"
              className="audit-filter-input"
              value={formatDateForInput(localFilter.startDate)}
              onChange={(e) => handleDateChange('startDate', e.target.value)}
            />
          </div>

          <div className="audit-filter-group">
            <label htmlFor="endDate" className="audit-filter-label">
              End Date
            </label>
            <input
              id="endDate"
              type="date"
              className="audit-filter-input"
              value={formatDateForInput(localFilter.endDate)}
              onChange={(e) => handleDateChange('endDate', e.target.value)}
            />
          </div>

          {/* Action */}
          <div className="audit-filter-group">
            <label htmlFor="action" className="audit-filter-label">
              Action
            </label>
            <select
              id="action"
              className="audit-filter-select"
              value={localFilter.action || ''}
              onChange={(e) => updateFilter({ action: (e.target.value as AuditAction) || undefined })}
            >
              <option value="">All Actions</option>
              {AUDIT_ACTIONS.map((action) => (
                <option key={action} value={action}>
                  {action.replace('_', ' ').toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          {/* Level */}
          <div className="audit-filter-group">
            <label htmlFor="level" className="audit-filter-label">
              Level
            </label>
            <select
              id="level"
              className="audit-filter-select"
              value={localFilter.level || ''}
              onChange={(e) => updateFilter({ level: (e.target.value as AuditLevel) || undefined })}
            >
              <option value="">All Levels</option>
              {AUDIT_LEVELS.map((level) => (
                <option key={level} value={level}>
                  {level.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          {/* Actor */}
          <div className="audit-filter-group">
            <label htmlFor="actorId" className="audit-filter-label">
              Actor ID
            </label>
            <input
              id="actorId"
              type="text"
              className="audit-filter-input"
              placeholder="Enter actor ID..."
              value={localFilter.actorId || ''}
              onChange={(e) => updateFilter({ actorId: e.target.value || undefined })}
            />
          </div>

          <div className="audit-filter-group">
            <label htmlFor="actorType" className="audit-filter-label">
              Actor Type
            </label>
            <select
              id="actorType"
              className="audit-filter-select"
              value={localFilter.actorType || ''}
              onChange={(e) => updateFilter({ actorType: (e.target.value as ActorType) || undefined })}
            >
              <option value="">All Actor Types</option>
              {ACTOR_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          {/* Resource */}
          <div className="audit-filter-group">
            <label htmlFor="resourceId" className="audit-filter-label">
              Resource ID
            </label>
            <input
              id="resourceId"
              type="text"
              className="audit-filter-input"
              placeholder="Enter resource ID..."
              value={localFilter.resourceId || ''}
              onChange={(e) => updateFilter({ resourceId: e.target.value || undefined })}
            />
          </div>

          <div className="audit-filter-group">
            <label htmlFor="resourceType" className="audit-filter-label">
              Resource Type
            </label>
            <select
              id="resourceType"
              className="audit-filter-select"
              value={localFilter.resourceType || ''}
              onChange={(e) => updateFilter({ resourceType: (e.target.value as ResourceType) || undefined })}
            >
              <option value="">All Resource Types</option>
              {RESOURCE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          {/* Correlation ID */}
          <div className="audit-filter-group">
            <label htmlFor="correlationId" className="audit-filter-label">
              Correlation ID
            </label>
            <input
              id="correlationId"
              type="text"
              className="audit-filter-input"
              placeholder="Enter correlation ID..."
              value={localFilter.correlationId || ''}
              onChange={(e) => updateFilter({ correlationId: e.target.value || undefined })}
            />
          </div>
        </div>

        {onApply && (
          <div className="audit-filters-footer">
            <button
              type="button"
              className="audit-btn audit-btn-primary"
              onClick={onApply}
            >
              Apply Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// CSS styles for the filters component
export const auditFiltersStyles = `
.audit-filters {
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  margin-bottom: 16px;
}

.audit-filters-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #dee2e6;
}

.audit-filters-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.audit-filters-title h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #495057;
}

.audit-active-filters-count {
  background: #007bff;
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.audit-filters-actions {
  display: flex;
  gap: 8px;
}

.audit-filters-content {
  overflow: hidden;
  transition: all 0.3s ease;
}

.audit-filters-content:not(.expanded) {
  max-height: 0;
}

.audit-filters-content.expanded {
  max-height: none;
  padding: 16px;
}

.audit-filters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 16px;
}

.audit-filter-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.audit-filter-label {
  font-size: 12px;
  font-weight: 500;
  color: #6c757d;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.audit-filter-input,
.audit-filter-select {
  padding: 8px 12px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 14px;
  background: white;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.audit-filter-input:focus,
.audit-filter-select:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
}

.audit-filter-input::placeholder {
  color: #6c757d;
}

.audit-filters-footer {
  border-top: 1px solid #dee2e6;
  padding-top: 16px;
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

.audit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.audit-btn-sm {
  padding: 4px 12px;
  font-size: 12px;
}

.audit-btn-primary {
  background: #007bff;
  border-color: #007bff;
  color: white;
}

.audit-btn-primary:hover:not(:disabled) {
  background: #0056b3;
  border-color: #0056b3;
}

.audit-btn-secondary {
  background: #6c757d;
  border-color: #6c757d;
  color: white;
}

.audit-btn-secondary:hover:not(:disabled) {
  background: #545b62;
  border-color: #545b62;
}

.audit-btn-outline {
  background: transparent;
  border-color: #ced4da;
  color: #6c757d;
}

.audit-btn-outline:hover:not(:disabled) {
  background: #f8f9fa;
  border-color: #adb5bd;
}

@media (max-width: 768px) {
  .audit-filters-header {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
  
  .audit-filters-actions {
    justify-content: center;
  }
  
  .audit-filters-grid {
    grid-template-columns: 1fr;
  }
}
`;
