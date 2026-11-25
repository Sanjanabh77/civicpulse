import { useState } from 'react';
import { Link } from 'react-router-dom';
import '../../p4.css';
import { getCurrentUser } from '../../lib/auth.js';
import { CATEGORIES, STATUS_META, statusColor } from '../../lib/status.js';
import ReportsTable from './ReportsTable.jsx';
import { useReports, useSummary } from './dashboardHooks.js';

const CONTROL_STYLE = {
  color: '#0f172a',
  background: '#ffffff',
  colorScheme: 'light',
};

// Shared by OfficerDashboard (isAdmin = false) and AdminDashboard (isAdmin = true).
export default function DashboardView({ title, isAdmin = false }) {
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    q: '',
    overdue: '',
    assigned: '',
  });
  const set = (k) => (e) =>
    setFilters((prev) => ({
      ...prev,
      [k]: e.target.type === 'checkbox' ? (e.target.checked ? 'true' : '') : e.target.value,
    }));

  const user = getCurrentUser();
  const canViewOfficer = Boolean(user && ['officer', 'admin'].includes(user.role));
  const canViewAdmin = user?.role === 'admin';

  const summary = useSummary();
  const reports = useReports(filters);
  const items = reports.data?.pages.flatMap((p) => p.items) ?? [];
  const count = (s) => summary.data?.byStatus.find((x) => x._id === s)?.count ?? 0;

  const kpis = [
    ['Total', summary.data?.total, '#0f172a'],
    ['New', count('submitted'), statusColor('submitted')],
    ['In Progress', count('in_progress'), statusColor('in_progress')],
    ['Overdue', summary.data?.overdue, '#dc2626'],
    ['Resolved', count('resolved') + count('closed'), statusColor('resolved')],
  ];

  return (
    <div className="p4-page">
      <div
        className="p4-row"
        style={{ justifyContent: 'space-between', marginBottom: 14, gap: 12 }}
      >
        <h1 className="p4-h1" style={{ margin: 0 }}>
          {title}
        </h1>

        <nav aria-label="Dashboard navigation" className="p4-row">
          <Link
            to="/map"
            className="p4-btn secondary"
            style={{ textDecoration: 'none', fontSize: 13, fontWeight: 500 }}
          >
            Live Map
          </Link>
          <Link
            to="/scorecards"
            className="p4-btn secondary"
            style={{ textDecoration: 'none', fontSize: 13, fontWeight: 500 }}
          >
            Ward Scorecards
          </Link>
          {canViewOfficer && (
            <Link
              to="/officer"
              className={!isAdmin ? 'p4-btn' : 'p4-btn secondary'}
              style={{ textDecoration: 'none', fontSize: 13, fontWeight: 600 }}
            >
              Officer Dashboard
            </Link>
          )}
          {canViewAdmin && (
            <Link
              to="/admin"
              className={isAdmin ? 'p4-btn' : 'p4-btn secondary'}
              style={{ textDecoration: 'none', fontSize: 13, fontWeight: 600 }}
            >
              Admin Dashboard
            </Link>
          )}
          {canViewOfficer && (
            <Link
              to="/admin/analytics"
              className="p4-btn secondary"
              style={{ textDecoration: 'none', fontSize: 13, fontWeight: 500 }}
            >
              Analytics
            </Link>
          )}
        </nav>
      </div>

      <div className="p4-grid cols-4" style={{ marginBottom: 14 }}>
        {kpis.map(([label, n, color]) => (
          <div key={label} className="p4-card p4-stat">
            <b style={{ color }}>{summary.isError ? '-' : (n ?? '-')}</b>
            <span>{label}</span>
          </div>
        ))}
      </div>

      {summary.isError && (
        <p className="p4-error" style={{ margin: '0 0 12px' }}>
          {summary.error?.message || 'Unable to load dashboard summary.'}
        </p>
      )}

      <div className="p4-row" style={{ marginBottom: 12 }}>
        <input
          className="p4-input"
          style={CONTROL_STYLE}
          placeholder="Search title..."
          aria-label="Search report title"
          value={filters.q}
          onChange={set('q')}
        />
        <select
          className="p4-select"
          style={CONTROL_STYLE}
          aria-label="Filter by status"
          value={filters.status}
          onChange={set('status')}
        >
          <option value="">All statuses</option>
          {Object.entries(STATUS_META).map(([k, v]) => (
            <option key={k} value={k}>
              {v.label}
            </option>
          ))}
        </select>
        <select
          className="p4-select"
          style={CONTROL_STYLE}
          aria-label="Filter by category"
          value={filters.category}
          onChange={set('category')}
        >
          <option value="">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          className="p4-select"
          style={CONTROL_STYLE}
          aria-label="Filter by assignment"
          value={filters.assigned}
          onChange={set('assigned')}
        >
          <option value="">Anyone</option>
          <option value="me">Assigned to Me</option>
          <option value="unassigned">Unassigned</option>
        </select>
        <label
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            cursor: 'pointer',
            userSelect: 'none',
            fontSize: 14,
          }}
        >
          <input
            type="checkbox"
            checked={filters.overdue === 'true'}
            onChange={set('overdue')}
          />
          Overdue Only
        </label>
      </div>

      <div className="p4-card">
        <ReportsTable
          items={items}
          isAdmin={isAdmin}
          hasMore={Boolean(reports.hasNextPage)}
          onMore={() => reports.fetchNextPage()}
          loadingMore={reports.isFetchingNextPage}
          isLoading={reports.isLoading}
          error={reports.error}
        />
      </div>
    </div>
  );
}
