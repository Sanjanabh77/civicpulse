import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import '../../p4.css';
import { api, BASE } from '../../lib/api.js';
import { getCurrentUser } from '../../lib/auth.js';
import ScoreRing from './ScoreRing.jsx';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

const SORTS = {
  score: 'Best score',
  resolutionRate: 'Resolution rate',
  total: 'Most reports',
  ward: 'Ward name',
};

const TIERS = {
  all: 'All performance tiers',
  high: 'Strong (75+)',
  medium: 'Moderate (50–74)',
  low: 'Needs attention (<50)',
};

const CSV_COLS = [
  'ward',
  'total',
  'resolved',
  'pending',
  'resolutionRate',
  'slaMetRate',
  'avgResolutionHours',
  'score',
];

function csvCell(val) {
  const s = val == null ? '' : String(val);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function toCsv(rows) {
  return [
    CSV_COLS.join(','),
    ...rows.map((r) => CSV_COLS.map((c) => csvCell(r[c])).join(',')),
  ].join('\n');
}

function tierBadge(score) {
  if (score >= 75) return { label: 'Strong', color: '#15803d', bg: '#dcfce7' };
  if (score >= 50) return { label: 'Moderate', color: '#b45309', bg: '#fef3c7' };
  return { label: 'Needs attention', color: '#b91c1c', bg: '#fee2e2' };
}

const CONTROL_STYLE = {
  colorScheme: 'light',
};

export default function WardScorecardsPage() {
  const [sort, setSort] = useState('score');
  const [search, setSearch] = useState('');
  const [tier, setTier] = useState('all');

  const user = getCurrentUser();
  const canViewOfficer = Boolean(user && ['officer', 'admin'].includes(user.role));

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['ward-scorecards'],
    queryFn: () => api('/public/ward-scorecards'),
    staleTime: 60_000,
  });

  const allWards = useMemo(() => (Array.isArray(data?.wards) ? data.wards : []), [data]);

  const stats = useMemo(() => {
    if (!allWards.length) return null;
    const best = allWards.reduce((top, w) => (w.score > top.score ? w : top), allWards[0]);
    const avgScore = Math.round(
      allWards.reduce((sum, w) => sum + (Number(w.score) || 0), 0) / allWards.length,
    );
    const avgResolution = Math.round(
      allWards.reduce((sum, w) => sum + (Number(w.resolutionRate) || 0), 0) / allWards.length,
    );
    const totalReports = allWards.reduce((sum, w) => sum + (Number(w.total) || 0), 0);
    return { best, avgScore, avgResolution, totalReports };
  }, [allWards]);

  const wards = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allWards
      .filter((w) => {
        if (q && !String(w.ward).toLowerCase().includes(q)) return false;
        if (tier === 'high' && w.score < 75) return false;
        if (tier === 'medium' && (w.score < 50 || w.score >= 75)) return false;
        if (tier === 'low' && w.score >= 50) return false;
        return true;
      })
      .sort((a, b) =>
        sort === 'ward'
          ? a.ward.localeCompare(b.ward, undefined, { numeric: true })
          : b[sort] - a[sort],
      );
  }, [allWards, search, tier, sort]);

  const handleDownloadCsv = () => {
    const rows = wards.length ? wards : allWards;
    const blob = new Blob([toCsv(rows)], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'ward-scorecards.csv';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="p4-page">
        <p className="p4-empty">Loading ward scorecards...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p4-page">
        <div className="p4-row" style={{ marginBottom: 12 }}>
          <Link to="/" className="p4-btn secondary" style={{ textDecoration: 'none' }}>
            Home
          </Link>
          <Link to="/map" className="p4-btn secondary" style={{ textDecoration: 'none' }}>
            Live Map
          </Link>
        </div>
        <div className="p4-card" style={{ borderColor: '#fecaca', background: '#fef2f2' }}>
          <p className="p4-error" style={{ margin: '0 0 10px' }}>
            {error.message || 'Unable to load ward scorecards.'}
          </p>
          <button
            type="button"
            className="p4-btn"
            disabled={isFetching}
            onClick={() => refetch()}
          >
            {isFetching ? 'Retrying...' : 'Retry'}
          </button>
        </div>
      </div>
    );
  }

  const hasFilters = search.trim() !== '' || tier !== 'all';

  return (
    <div className="p4-page">
      <div
        className="p4-row"
        style={{ justifyContent: 'space-between', marginBottom: 8, gap: 12 }}
      >
        <h1 className="p4-h1" style={{ margin: 0 }}>
          Ward scorecards
        </h1>

        <div className="p4-row">
          <Link
            to="/"
            className="p4-btn secondary"
            style={{ textDecoration: 'none', fontSize: 13, fontWeight: 500 }}
          >
            Home
          </Link>
          <Link
            to="/map"
            className="p4-btn secondary"
            style={{ textDecoration: 'none', fontSize: 13, fontWeight: 500 }}
          >
            Live Map
          </Link>
          {canViewOfficer && (
            <Link
              to="/officer"
              className="p4-btn secondary"
              style={{ textDecoration: 'none', fontSize: 13, fontWeight: 500 }}
            >
              Dashboard
            </Link>
          )}
          {USE_MOCK ? (
            <button
              type="button"
              className="p4-btn secondary"
              style={{ fontSize: 13, fontWeight: 600 }}
              disabled={!allWards.length}
              onClick={handleDownloadCsv}
            >
              Download open data (CSV)
            </button>
          ) : (
            <a
              className="p4-btn secondary"
              style={{ textDecoration: 'none', fontSize: 13, fontWeight: 600 }}
              href={`${BASE}/public/ward-scorecards?format=csv`}
            >
              Download open data (CSV)
            </a>
          )}
        </div>
      </div>

      <p style={{ color: '#64748b', margin: '0 0 14px', fontSize: 14 }}>
        How quickly and reliably each ward&apos;s civic reports are resolved.
        {data?.updatedAt ? ` Updated ${new Date(data.updatedAt).toLocaleString()}.` : ''}
      </p>

      {!allWards.length ? (
        <div className="p4-card">
          <p className="p4-empty">No ward scorecard data is available yet.</p>
        </div>
      ) : (
        <>
          {/* Summary Comparison KPIs */}
          {stats && (
            <div className="p4-grid cols-4" style={{ marginBottom: 14 }}>
              <div className="p4-card p4-stat">
                <b style={{ color: '#0e8a7d' }}>{stats.best.ward}</b>
                <span>Best ward ({stats.best.score}/100)</span>
              </div>
              <div className="p4-card p4-stat">
                <b style={{ color: '#0f172a' }}>{stats.avgScore}/100</b>
                <span>Average ward score</span>
              </div>
              <div className="p4-card p4-stat">
                <b style={{ color: '#16a34a' }}>{stats.avgResolution}%</b>
                <span>Average resolution rate</span>
              </div>
              <div className="p4-card p4-stat">
                <b style={{ color: '#0f172a' }}>{allWards.length}</b>
                <span>Wards ({stats.totalReports} reports)</span>
              </div>
            </div>
          )}

          {/* Search, Tier Filter & Sort Controls */}
          <div className="p4-row" style={{ marginBottom: 14 }}>
            <input
              type="search"
              className="p4-input"
              style={CONTROL_STYLE}
              placeholder="Search ward..."
              aria-label="Search ward"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              className="p4-select"
              style={CONTROL_STYLE}
              aria-label="Filter by performance tier"
              value={tier}
              onChange={(e) => setTier(e.target.value)}
            >
              {Object.entries(TIERS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
            <select
              className="p4-select"
              style={CONTROL_STYLE}
              aria-label="Sort wards"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              {Object.entries(SORTS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
            {hasFilters && (
              <button
                type="button"
                className="p4-btn secondary"
                style={{ fontSize: 13 }}
                onClick={() => {
                  setSearch('');
                  setTier('all');
                }}
              >
                Clear filters
              </button>
            )}
          </div>

          {!wards.length ? (
            <div className="p4-card">
              <p className="p4-empty">
                No wards match the current search or performance filter.
              </p>
            </div>
          ) : (
            <>
              {/* Resolved vs Pending Ward Comparison Chart */}
              <section className="p4-card" style={{ marginBottom: 14 }}>
                <strong style={{ display: 'block', marginBottom: 10, color: '#0f172a' }}>
                  Resolved vs. pending reports by ward
                </strong>
                <div style={{ width: '100%', height: 260 }}>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={wards}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="ward" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Legend />
                      <Bar
                        dataKey="resolved"
                        name="Resolved"
                        fill="#0e8a7d"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey="pending"
                        name="Pending"
                        fill="#9db7d5"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </section>

              {/* Ward Scorecard Grid */}
              <div className="p4-grid cols-2">
                {wards.map((w) => {
                  const badge = tierBadge(w.score);
                  return (
                    <article
                      key={w.ward}
                      className="p4-card p4-row"
                      style={{ flexWrap: 'nowrap', gap: 14, alignItems: 'center' }}
                    >
                      <ScoreRing score={w.score} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          className="p4-row"
                          style={{ justifyContent: 'space-between', marginBottom: 6 }}
                        >
                          <strong style={{ color: '#0f172a', fontSize: 15 }}>
                            {w.ward}
                          </strong>
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 600,
                              color: badge.color,
                              background: badge.bg,
                              padding: '2px 8px',
                              borderRadius: 999,
                            }}
                          >
                            {badge.label}
                          </span>
                        </div>
                        <table style={{ width: '100%', fontSize: 13, color: '#475569' }}>
                          <tbody>
                            <tr>
                              <td>Reports</td>
                              <td align="right">
                                {w.total} ({w.pending} pending)
                              </td>
                            </tr>
                            <tr>
                              <td>Resolved</td>
                              <td align="right">{w.resolutionRate}%</td>
                            </tr>
                            <tr>
                              <td>Fixed within deadline</td>
                              <td align="right">{w.slaMetRate}%</td>
                            </tr>
                            <tr>
                              <td>Average fix time</td>
                              <td align="right">
                                {w.avgResolutionHours != null
                                  ? `${w.avgResolutionHours} h`
                                  : '-'}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </article>
                  );
                })}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
