import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import '../../p4.css';
import { api } from '../../lib/api.js';
import { getCurrentUser } from '../../lib/auth.js';
import { isPending, statusColor, statusLabel } from '../../lib/status.js';

const TIMEFRAMES = [
  { value: 7, label: 'Last 7 days' },
  { value: 14, label: 'Last 14 days' },
  { value: 30, label: 'Last 30 days' },
];

const SELECT_STYLE = {
  colorScheme: 'light',
};

function ChartBox({ title, isEmpty, emptyMessage = 'No data available.', children }) {
  return (
    <section className="p4-card" style={{ minHeight: 300 }}>
      <strong style={{ display: 'block', marginBottom: 10, color: '#0f172a', fontSize: 15 }}>
        {title}
      </strong>
      {isEmpty ? (
        <p className="p4-empty" style={{ padding: '70px 16px' }}>
          {emptyMessage}
        </p>
      ) : (
        <div style={{ width: '100%', height: 245 }}>
          <ResponsiveContainer width="100%" height={245}>
            {children}
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}

export default function AnalyticsPage() {
  const [days, setDays] = useState(14);

  const user = getCurrentUser();
  const canViewOfficer = Boolean(user && ['officer', 'admin'].includes(user.role));
  const canViewAdmin = user?.role === 'admin';

  const ov = useQuery({
    queryKey: ['an-overview'],
    queryFn: () => api('/analytics/overview'),
    staleTime: 60_000,
  });

  const tr = useQuery({
    queryKey: ['an-trends', days],
    queryFn: () => api('/analytics/trends', { params: { days } }),
    staleTime: 60_000,
  });

  const overview = ov.data;
  const trendDays = useMemo(
    () => (Array.isArray(tr.data?.days) ? tr.data.days : []),
    [tr.data],
  );

  const stats = useMemo(() => {
    if (!overview) return null;
    const byStatus = Array.isArray(overview.byStatus) ? overview.byStatus : [];
    const byCategory = Array.isArray(overview.byCategory) ? overview.byCategory : [];
    const byDepartment = Array.isArray(overview.byDepartment) ? overview.byDepartment : [];
    const total = Number(overview.total) || 0;
    const overdueOpen = Number(overview.overdueOpen) || 0;
    const completed = byStatus.reduce(
      (sum, s) => sum + (!isPending(s._id) ? Number(s.count) || 0 : 0),
      0,
    );
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      total,
      overdueOpen,
      completed,
      completionRate,
      statusData: byStatus.map((s) => ({
        key: s._id,
        name: statusLabel(s._id),
        value: Number(s.count) || 0,
      })),
      categoryData: byCategory.map((c) => ({
        name: c._id || 'Unknown',
        count: Number(c.count) || 0,
      })),
      departmentData: byDepartment.map((d) => ({
        name: d._id || 'Unassigned',
        count: Number(d.count) || 0,
      })),
    };
  }, [overview]);

  const navLinks = (
    <nav aria-label="Analytics navigation" className="p4-row">
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
          className="p4-btn secondary"
          style={{ textDecoration: 'none', fontSize: 13, fontWeight: 500 }}
        >
          Officer Dashboard
        </Link>
      )}
      {canViewAdmin && (
        <Link
          to="/admin"
          className="p4-btn secondary"
          style={{ textDecoration: 'none', fontSize: 13, fontWeight: 500 }}
        >
          Admin Dashboard
        </Link>
      )}
    </nav>
  );

  if (ov.isLoading || tr.isLoading) {
    return (
      <div className="p4-page">
        <p className="p4-empty">Loading analytics...</p>
      </div>
    );
  }

  if (ov.error || tr.error) {
    const err = ov.error || tr.error;
    return (
      <div className="p4-page">
        <div className="p4-row" style={{ marginBottom: 12 }}>
          {navLinks}
        </div>
        <div className="p4-card" style={{ borderColor: '#fecaca', background: '#fef2f2' }}>
          <p className="p4-error" style={{ margin: '0 0 10px' }}>
            {err.message || 'Unable to load analytics data.'}
          </p>
          <button
            type="button"
            className="p4-btn"
            disabled={ov.isFetching || tr.isFetching}
            onClick={() => {
              ov.refetch();
              tr.refetch();
            }}
          >
            {ov.isFetching || tr.isFetching ? 'Retrying...' : 'Retry'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p4-page">
      <div
        className="p4-row"
        style={{ justifyContent: 'space-between', marginBottom: 14, gap: 12 }}
      >
        <h1 className="p4-h1" style={{ margin: 0 }}>
          Analytics
        </h1>

        <div className="p4-row">
          {navLinks}
          <select
            className="p4-select"
            style={SELECT_STYLE}
            aria-label="Trend timeframe"
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
          >
            {TIMEFRAMES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {!stats || stats.total === 0 ? (
        <div className="p4-card">
          <p className="p4-empty">No report analytics data is available yet.</p>
        </div>
      ) : (
        <>
          <div className="p4-grid cols-4" style={{ marginBottom: 14 }}>
            <div className="p4-card p4-stat">
              <b style={{ color: '#0f172a' }}>{stats.total}</b>
              <span>Total reports</span>
            </div>
            <div className="p4-card p4-stat">
              <b style={{ color: '#dc2626' }}>{stats.overdueOpen}</b>
              <span>Open &amp; overdue</span>
            </div>
            <div className="p4-card p4-stat">
              <b style={{ color: '#16a34a' }}>{stats.completed}</b>
              <span>Resolved &amp; closed</span>
            </div>
            <div className="p4-card p4-stat">
              <b style={{ color: '#0e8a7d' }}>{stats.completionRate}%</b>
              <span>Completion rate</span>
            </div>
          </div>

          <div className="p4-grid cols-2">
            <ChartBox
              title="Reports by status"
              isEmpty={stats.statusData.length === 0}
            >
              <PieChart>
                <Pie
                  data={stats.statusData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={55}
                  outerRadius={88}
                >
                  {stats.statusData.map((s) => (
                    <Cell key={s.key} fill={statusColor(s.key)} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ChartBox>

            <ChartBox
              title="Reports by category"
              isEmpty={stats.categoryData.length === 0}
            >
              <BarChart data={stats.categoryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar
                  dataKey="count"
                  name="Reports"
                  fill="#0e8a7d"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ChartBox>

            <ChartBox
              title={`Created vs. resolved (last ${days} days)`}
              isEmpty={trendDays.length === 0}
              emptyMessage="No trend data available for this timeframe."
            >
              <LineChart data={trendDays}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={(d) => d.slice(5)} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="created"
                  name="Created"
                  stroke="#2563eb"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="resolved"
                  name="Resolved"
                  stroke="#16a34a"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ChartBox>

            <ChartBox
              title="Reports by department"
              isEmpty={stats.departmentData.length === 0}
            >
              <BarChart layout="vertical" data={stats.departmentData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" allowDecimals={false} />
                <YAxis type="category" dataKey="name" width={96} />
                <Tooltip />
                <Bar
                  dataKey="count"
                  name="Reports"
                  fill="#7c3aed"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ChartBox>
          </div>
        </>
      )}
    </div>
  );
}
