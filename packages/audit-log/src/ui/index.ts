export { AuditTable, auditTableStyles, type AuditTableProps } from './components/AuditTable';
export { AuditFilters, auditFiltersStyles, type AuditFiltersProps } from './components/AuditFilters';
export { AuditDashboard, auditDashboardStyles, type AuditDashboardProps } from './components/AuditDashboard';
export { AuditEventDetails, auditEventDetailsStyles, type AuditEventDetailsProps } from './components/AuditEventDetails';

// Explicitly import the style variables for use below
import { auditTableStyles } from './components/AuditTable';
import { auditFiltersStyles } from './components/AuditFilters';
import { auditDashboardStyles } from './components/AuditDashboard';
import { auditEventDetailsStyles } from './components/AuditEventDetails';

// Combined styles export for convenience
export const allAuditStyles = `
${auditTableStyles}

${auditFiltersStyles}

${auditDashboardStyles}

${auditEventDetailsStyles}
`;
