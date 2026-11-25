import { useState } from 'react';
import { Link } from 'react-router-dom';
import StatusBadge from '../../components/common/StatusBadge.jsx';
import SlaIndicator from './SlaIndicator.jsx';
import StatusUpdateModal from './StatusUpdateModal.jsx';
import { useAssign, useOfficers } from './dashboardHooks.js';

const SELECT_STYLE = {
  color: '#0f172a',
  background: '#ffffff',
  colorScheme: 'light',
};

function AssignCell({ report }) {
  const { data, isLoading, error } = useOfficers(true);
  const assign = useAssign();

  return (
    <div>
      <select
        className="p4-select"
        style={SELECT_STYLE}
        aria-label={`Assign officer for ${report.title}`}
        value={report.assignedTo?._id ?? ''}
        disabled={assign.isPending || isLoading}
        onChange={(e) => {
          const officerId = e.target.value;
          if (officerId) assign.mutate({ id: report._id, officerId });
        }}
      >
        <option value="">Unassigned</option>
        {data?.officers.map((o) => (
          <option key={o._id} value={o._id}>
            {o.name}{o.department ? ` (${o.department})` : ''}
          </option>
        ))}
      </select>
      {assign.isError && (
        <div className="p4-error" style={{ marginTop: 4 }}>
          {assign.error?.message || 'Failed to assign officer.'}
        </div>
      )}
      {error && (
        <div className="p4-error" style={{ marginTop: 4 }}>
          {error.message || 'Unable to load officers.'}
        </div>
      )}
    </div>
  );
}

export default function ReportsTable({
  items = [],
  isAdmin = false,
  hasMore = false,
  onMore,
  loadingMore = false,
  isLoading = false,
  error = null,
}) {
  const [editing, setEditing] = useState(null);

  if (isLoading) return <p className="p4-empty">Loading reports...</p>;
  if (error) return <p className="p4-empty p4-error">{error.message || 'Failed to load reports.'}</p>;
  if (!items.length) return <p className="p4-empty">No reports match these filters.</p>;

  return (
    <>
      <div style={{ overflowX: 'auto' }}>
        <table className="p4-table">
          <thead>
            <tr>
              <th>Issue</th>
              <th>Department</th>
              <th>Status</th>
              <th>Ward</th>
              <th>Assigned to</th>
              <th>SLA</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((r) => (
              <tr key={r._id}>
                <td>
                  <strong>{r.title}</strong>
                  <br />
                  <small style={{ color: '#64748b', textTransform: 'capitalize' }}>{r.category}</small>
                </td>
                <td>{r.department || '-'}</td>
                <td>
                  <StatusBadge status={r.status} />
                </td>
                <td>{r.ward || '-'}</td>
                <td>{isAdmin ? <AssignCell report={r} /> : (r.assignedTo?.name ?? '-')}</td>
                <td>
                  <SlaIndicator sla={r.sla} />
                </td>
                <td>
                  <div className="p4-row" style={{ gap: 6, flexWrap: 'nowrap' }}>
                    <Link
                      to={`/reports/${r._id}/track`}
                      className="p4-btn secondary"
                      style={{ textDecoration: 'none', fontSize: 13, padding: '6px 10px', whiteSpace: 'nowrap' }}
                    >
                      Track
                    </Link>
                    <button
                      type="button"
                      className="p4-btn secondary"
                      style={{ fontSize: 13, padding: '6px 10px', whiteSpace: 'nowrap' }}
                      onClick={() => setEditing(r)}
                    >
                      Update
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {hasMore && (
        <div style={{ textAlign: 'center', marginTop: 12 }}>
          <button
            type="button"
            className="p4-btn secondary"
            onClick={onMore}
            disabled={loadingMore}
          >
            {loadingMore ? 'Loading more...' : 'Load more'}
          </button>
        </div>
      )}

      {editing && <StatusUpdateModal report={editing} onClose={() => setEditing(null)} />}
    </>
  );
}
