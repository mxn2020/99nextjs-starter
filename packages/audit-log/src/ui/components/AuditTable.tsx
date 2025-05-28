import React, { useState, useEffect, useMemo } from 'react';
import { AuditEvent, AuditEventFilter, PaginatedResult } from '../../types';

export interface AuditTableProps {
  events: AuditEvent[];
  loading?: boolean;
  error?: string;
  onEventClick?: (event: AuditEvent) => void;
  className?: string;
}

export interface AuditTableColumn {
  key: keyof AuditEvent;
  label: string;
  sortable?: boolean;
  render?: (value: any, event: AuditEvent) => React.ReactNode;
  width?: string;
}

const defaultColumns: AuditTableColumn[] = [
  {
    key: 'timestamp',
    label: 'Time',
    sortable: true,
    render: (value: Date) => new Date(value).toLocaleString(),
    width: '150px',
  },
  {
    key: 'action',
    label: 'Action',
    sortable: true,
    render: (value: string) => (
      <span className="audit-action-badge" data-action={value}>
        {value}
      </span>
    ),
    width: '120px',
  },
  {
    key: 'level',
    label: 'Level',
    sortable: true,
    render: (value: string) => (
      <span className={`audit-level-badge audit-level-${value}`}>
        {value.toUpperCase()}
      </span>
    ),
    width: '80px',
  },
  {
    key: 'actorId',
    label: 'Actor',
    sortable: true,
    width: '120px',
  },
  {
    key: 'resource',
    label: 'Resource',
    sortable: true,
    render: (value: string, event: AuditEvent) => 
      value ? `${value}${event.resourceId ? `:${event.resourceId}` : ''}` : '-',
    width: '150px',
  },
  {
    key: 'description',
    label: 'Description',
    sortable: false,
    render: (value: string) => (
      <span className="audit-description" title={value}>
        {value.length > 100 ? `${value.substring(0, 100)}...` : value}
      </span>
    ),
  },
];

export const AuditTable: React.FC<AuditTableProps> = ({
  events,
  loading = false,
  error,
  onEventClick,
  className = '',
}) => {
  const [sortBy, setSortBy] = useState<keyof AuditEvent>('timestamp');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedEvent, setSelectedEvent] = useState<AuditEvent | null>(null);

  const sortedEvents = useMemo(() => {
    if (!events.length) return [];

    return [...events].sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];
      
      if (aVal === undefined && bVal === undefined) return 0;
      if (aVal === undefined) return 1;
      if (bVal === undefined) return -1;

      let comparison = 0;
      if (aVal instanceof Date && bVal instanceof Date) {
        comparison = aVal.getTime() - bVal.getTime();
      } else {
        comparison = String(aVal).localeCompare(String(bVal));
      }

      return sortOrder === 'desc' ? -comparison : comparison;
    });
  }, [events, sortBy, sortOrder]);

  const handleSort = (column: AuditTableColumn) => {
    if (!column.sortable) return;

    if (sortBy === column.key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column.key);
      setSortOrder('desc');
    }
  };

  const handleRowClick = (event: AuditEvent) => {
    setSelectedEvent(event);
    onEventClick?.(event);
  };

  if (error) {
    return (
      <div className={`audit-table-error ${className}`}>
        <div className="audit-error-message">
          <span className="audit-error-icon">⚠️</span>
          <span>Error loading audit events: {error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`audit-table-container ${className}`}>
      <div className="audit-table-wrapper">
        <table className="audit-table">
          <thead>
            <tr>
              {defaultColumns.map((column) => (
                <th
                  key={column.key}
                  className={`audit-table-header ${column.sortable ? 'sortable' : ''} ${
                    sortBy === column.key ? `sorted-${sortOrder}` : ''
                  }`}
                  style={{ width: column.width }}
                  onClick={() => handleSort(column)}
                >
                  <span className="audit-header-content">
                    {column.label}
                    {column.sortable && (
                      <span className="audit-sort-indicator">
                        {sortBy === column.key ? (
                          sortOrder === 'asc' ? '↑' : '↓'
                        ) : (
                          '↕'
                        )}
                      </span>
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={defaultColumns.length} className="audit-table-loading">
                  <div className="audit-loading-spinner">Loading...</div>
                </td>
              </tr>
            ) : sortedEvents.length === 0 ? (
              <tr>
                <td colSpan={defaultColumns.length} className="audit-table-empty">
                  No audit events found
                </td>
              </tr>
            ) : (
              sortedEvents.map((event) => (
                <tr
                  key={event.id}
                  className={`audit-table-row ${selectedEvent?.id === event.id ? 'selected' : ''}`}
                  onClick={() => handleRowClick(event)}
                >
                  {defaultColumns.map((column) => (
                    <td key={column.key} className="audit-table-cell">
                      {column.render
                        ? column.render(event[column.key], event)
                        : String(event[column.key] || '-')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// CSS styles as a string export for easy integration
export const auditTableStyles = `
.audit-table-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.audit-table-wrapper {
  overflow-x: auto;
}

.audit-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.audit-table-header {
  background: #f8f9fa;
  border-bottom: 2px solid #dee2e6;
  padding: 12px 8px;
  text-align: left;
  font-weight: 600;
  color: #495057;
}

.audit-table-header.sortable {
  cursor: pointer;
  user-select: none;
}

.audit-table-header.sortable:hover {
  background: #e9ecef;
}

.audit-header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.audit-sort-indicator {
  margin-left: 4px;
  opacity: 0.5;
}

.audit-table-header.sorted-asc .audit-sort-indicator,
.audit-table-header.sorted-desc .audit-sort-indicator {
  opacity: 1;
}

.audit-table-row {
  border-bottom: 1px solid #dee2e6;
  cursor: pointer;
  transition: background-color 0.2s;
}

.audit-table-row:hover {
  background: #f8f9fa;
}

.audit-table-row.selected {
  background: #e3f2fd;
}

.audit-table-cell {
  padding: 12px 8px;
  vertical-align: top;
}

.audit-action-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  background: #e9ecef;
  color: #495057;
}

.audit-action-badge[data-action*="create"] { background: #d4edda; color: #155724; }
.audit-action-badge[data-action*="update"] { background: #fff3cd; color: #856404; }
.audit-action-badge[data-action*="delete"] { background: #f8d7da; color: #721c24; }
.audit-action-badge[data-action*="login"] { background: #d1ecf1; color: #0c5460; }

.audit-level-badge {
  display: inline-block;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
}

.audit-level-debug { background: #e2e3e5; color: #6c757d; }
.audit-level-info { background: #d1ecf1; color: #0c5460; }
.audit-level-warn { background: #fff3cd; color: #856404; }
.audit-level-error { background: #f8d7da; color: #721c24; }

.audit-description {
  display: block;
  line-height: 1.4;
}

.audit-table-loading,
.audit-table-empty {
  text-align: center;
  padding: 40px;
  color: #6c757d;
}

.audit-loading-spinner {
  display: inline-block;
}

.audit-table-error {
  padding: 20px;
  background: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 4px;
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
  .audit-table {
    font-size: 12px;
  }
  
  .audit-table-cell,
  .audit-table-header {
    padding: 8px 4px;
  }
}
`;
