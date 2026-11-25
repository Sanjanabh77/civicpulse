export const STATUS_META = {
  submitted:   { label: 'Submitted',   color: '#2563eb' },
  assigned:    { label: 'Assigned',    color: '#7c3aed' },
  in_progress: { label: 'In progress', color: '#f59e0b' },
  escalated:   { label: 'Escalated',   color: '#dc2626' },
  resolved:    { label: 'Resolved',    color: '#16a34a' },
  closed:      { label: 'Closed',      color: '#475569' },
  reopened:    { label: 'Reopened',    color: '#db2777' },
};
export const CATEGORIES = ['pothole', 'garbage', 'streetlight', 'water', 'drainage', 'other'];
export const isPending = (s) => !['resolved', 'closed'].includes(s);
export const statusLabel = (s) => STATUS_META[s]?.label ?? s;
export const statusColor = (s) => STATUS_META[s]?.color ?? '#64748b';
