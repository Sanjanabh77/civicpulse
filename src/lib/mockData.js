// Fake API so you can build every screen BEFORE Person 1's API exists.
// Turn on with VITE_USE_MOCK=true in client/.env. Data lives in memory (resets on refresh).
import { MAP_CENTER } from './config.js';

function rng(seed) { let s = seed; return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296; }
const rand = rng(42);
const pick = (a) => a[Math.floor(rand() * a.length)];
const CATS = ['pothole', 'garbage', 'streetlight', 'water', 'drainage', 'other'];
const STATUSES = ['submitted', 'assigned', 'in_progress', 'escalated', 'resolved', 'closed', 'reopened'];
const DEPTS = { pothole: 'Roads', garbage: 'Sanitation', streetlight: 'Electrical', water: 'Water Board', drainage: 'Water Board', other: 'General' };
const WARDS = Array.from({ length: 8 }, (_, i) => `Ward ${i + 1}`);
const DAY = 864e5;

export const placeholder = (label, color) =>
  'data:image/svg+xml;utf8,' + encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="400" height="300" fill="${color}"/><text x="200" y="158" font-size="26" text-anchor="middle" fill="#fff" font-family="sans-serif">${label}</text></svg>`);

const OFFICERS = [
  { _id: 'o1', name: 'R. Kumar', department: 'Roads' }, { _id: 'o2', name: 'S. Devi', department: 'Sanitation' },
  { _id: 'o3', name: 'A. Rao', department: 'Electrical' }, { _id: 'o4', name: 'M. Iqbal', department: 'Water Board' },
];

const reports = Array.from({ length: 300 }, (_, i) => {
  const wardIdx = i % WARDS.length;
  const created = Date.now() - rand() * 30 * DAY;
  const status = pick(STATUSES);
  const category = pick(CATS);
  const hist = [{ status: 'submitted', at: new Date(created).toISOString(), note: 'Report received' }];
  const idx = ['submitted', 'assigned', 'in_progress', 'resolved', 'closed'].indexOf(
    status === 'escalated' ? 'in_progress' : status === 'reopened' ? 'resolved' : status,
  );
  if (idx >= 1) hist.push({ status: 'assigned', at: new Date(created + 2 * 36e5).toISOString(), note: 'Assigned to department' });
  if (idx >= 2) hist.push({ status: 'in_progress', at: new Date(created + 20 * 36e5).toISOString(), note: 'Work started' });
  if (status === 'escalated') hist.push({ status: 'escalated', at: new Date(created + 80 * 36e5).toISOString(), note: 'SLA breached - auto escalated' });
  const resolvedAt = idx >= 3 ? new Date(created + (30 + rand() * 90) * 36e5).toISOString() : null;
  if (resolvedAt) hist.push({ status: 'resolved', at: resolvedAt, note: 'Issue fixed by crew' });
  if (status === 'closed') hist.push({ status: 'closed', at: new Date(Date.parse(resolvedAt) + 36e5).toISOString(), note: 'Citizen confirmed the fix' });
  if (status === 'reopened') hist.push({ status: 'reopened', at: new Date(Math.max(Date.parse(resolvedAt) + 36e5, created + 130 * 36e5)).toISOString(), note: 'Still not fixed' });
  return {
    _id: 'r' + (1000 + i), title: `${category[0].toUpperCase() + category.slice(1)} issue near block ${i % 40}`, category, status,
    ward: WARDS[wardIdx], department: DEPTS[category],
    location: { type: 'Point', coordinates: [MAP_CENTER[1] + (wardIdx % 4 - 1.5) * 0.04 + (rand() - 0.5) * 0.035, MAP_CENTER[0] + (Math.floor(wardIdx / 4) - 0.5) * 0.04 + (rand() - 0.5) * 0.035] },
    createdAt: new Date(created).toISOString(), slaDueAt: new Date(created + 72 * 36e5).toISOString(), resolvedAt,
    assignedTo: idx >= 1 ? OFFICERS[i % 4] : null, reopenCount: status === 'reopened' ? 1 : 0,
    images: [{ url: placeholder('BEFORE', '#6b7280') }],
    resolution: resolvedAt ? { afterImageUrl: placeholder('AFTER', '#16a34a') } : null,
    statusHistory: hist,
  };
});

const microClusters = [
  [MAP_CENTER[1] + 0.007, MAP_CENTER[0] + 0.006],
  [MAP_CENTER[1] - 0.009, MAP_CENTER[0] + 0.011],
  [MAP_CENTER[1] + 0.013, MAP_CENTER[0] - 0.008],
  [MAP_CENTER[1] - 0.006, MAP_CENTER[0] - 0.012],
  [MAP_CENTER[1] + 0.002, MAP_CENTER[0] + 0.015],
  [MAP_CENTER[1] - 0.014, MAP_CENTER[0] - 0.003],
  [MAP_CENTER[1] + 0.011, MAP_CENTER[0] + 0.009],
  [MAP_CENTER[1] - 0.011, MAP_CENTER[0] + 0.003],
];

let blindSpots = Array.from({ length: 30 }, (_, i) => {
  const c = microClusters[i % microClusters.length];
  return {
    _id: 'b' + i,
    title: `Neglected pocket ${i + 1}`,
    category: pick(CATS),
    voteCount: 1 + Math.floor(rand() * 16),
    location: {
      type: 'Point',
      coordinates: [c[0] + (rand() - 0.5) * 0.0025, c[1] + (rand() - 0.5) * 0.0025],
    },
  };
});
const myVotes = new Set();
export const CELL = 0.0015; // ~165 metres for localised urban micro-zones

const inBox = (c, [w, s, e, n]) => c[0] >= w && c[0] <= e && c[1] >= s && c[1] <= n;
const bboxOf = (p) => (p.bbox || '').split(',').map(Number);
const pending = (s) => !['resolved', 'closed'].includes(s);
function sla(r) {
  const created = Date.parse(r.createdAt), due = Date.parse(r.slaDueAt), now = Date.now();
  if (!pending(r.status)) return { state: Date.parse(r.resolvedAt || r.createdAt) <= due ? 'met' : 'breached', pctElapsed: 100, remainingMs: 0 };
  const remaining = due - now, pct = Math.min(100, Math.max(0, ((now - created) / (due - created)) * 100));
  return { state: remaining < 0 ? 'overdue' : pct > 75 ? 'due_soon' : 'on_track', pctElapsed: Math.round(pct), remainingMs: remaining };
}
function wardRows() {
  return WARDS.map((ward) => {
    const rs = reports.filter((r) => r.ward === ward), done = rs.filter((r) => !pending(r.status));
    const slaMet = done.filter((r) => r.resolvedAt && r.resolvedAt <= r.slaDueAt).length;
    const avg = done.length ? done.reduce((a, r) => a + (Date.parse(r.resolvedAt) - Date.parse(r.createdAt)), 0) / done.length / 36e5 : 0;
    const resolutionRate = rs.length ? Math.round((done.length / rs.length) * 100) : 0;
    const slaMetRate = done.length ? Math.round((slaMet / done.length) * 100) : 0;
    const reopenRate = rs.length ? Math.round((rs.filter((r) => r.reopenCount > 0).length / rs.length) * 100) : 0;
    return { ward, total: rs.length, resolved: done.length, pending: rs.length - done.length, resolutionRate, slaMetRate,
      avgResolutionHours: done.length ? Math.round(avg * 10) / 10 : null, score: Math.round(0.5 * resolutionRate + 0.3 * slaMetRate + 0.2 * (100 - reopenRate)) };
  });
}
const count = (arr, key) => Object.entries(arr.reduce((a, r) => ((a[r[key]] = (a[r[key]] || 0) + 1), a), {})).map(([_id, count]) => ({ _id, count }));
const fail = (status, message) => Promise.reject(Object.assign(new Error(message), { status }));
const delay = (v) => new Promise((r) => setTimeout(() => r(v), 150));

function getMockContext() {
  const role = (typeof localStorage !== 'undefined' && localStorage.getItem('mockRole')) || 'admin';
  const officerId = (typeof localStorage !== 'undefined' && localStorage.getItem('mockOfficerId')) || OFFICERS[0]._id;
  return { role, officerId };
}

export async function mockRequest(path, { method, body, params = {} }) {
  let m;
  if (path === '/map/reports') {
    const box = bboxOf(params);
    const list = reports.filter((r) => inBox(r.location.coordinates, box) && (!params.status || params.status.split(',').includes(r.status)) && (!params.category || params.category.split(',').includes(r.category)));
    return delay({ type: 'FeatureCollection', truncated: false, features: list.map((r) => ({ type: 'Feature', id: r._id, geometry: r.location, properties: { id: r._id, title: r.title, category: r.category, status: r.status, ward: r.ward, createdAt: r.createdAt } })) });
  }
  if (path === '/blindspots/grid') {
    const cells = {};
    blindSpots.forEach((b) => { const x = Math.floor(b.location.coordinates[0] / CELL), y = Math.floor(b.location.coordinates[1] / CELL); const k = x + ':' + y; (cells[k] ||= { cellKey: k, x, y, votes: 0, spots: 0, reports: 0 }); cells[k].votes += b.voteCount; cells[k].spots++; });
    reports.forEach((r) => {
      if (!r.location?.coordinates) return;
      const x = Math.floor(r.location.coordinates[0] / CELL), y = Math.floor(r.location.coordinates[1] / CELL);
      const k = x + ':' + y;
      if (cells[k]) cells[k].reports++;
    });
    return delay({ cells: Object.values(cells).map((c) => ({ ...c, bounds: [c.x * CELL, c.y * CELL, (c.x + 1) * CELL, (c.y + 1) * CELL], score: c.votes / (1 + c.reports) })) });
  }
  if (path === '/blindspots/votes/mine') return delay({ ids: [...myVotes] });
  if (path === '/blindspots' && method === 'GET') return delay({ spots: blindSpots.filter((b) => inBox(b.location.coordinates, bboxOf(params))) });
  if (path === '/blindspots' && method === 'POST') { const b = { _id: 'b' + Date.now(), voteCount: 1, ...body, location: { type: 'Point', coordinates: body.coordinates } }; blindSpots.push(b); myVotes.add(b._id); return delay(b); }
  if ((m = path.match(/^\/blindspots\/(.+)\/vote$/))) {
    const b = blindSpots.find((x) => x._id === m[1]);
    if (method === 'POST') { if (myVotes.has(b._id)) return fail(409, 'You already voted for this blind spot'); myVotes.add(b._id); b.voteCount++; }
    else if (myVotes.delete(b._id)) b.voteCount--;
    return delay({ voteCount: b.voteCount });
  }
  if ((m = path.match(/^\/tracking\/([^/]+)(?:\/(confirm|reopen))?$/))) {
    const r = reports.find((x) => x._id === m[1]); if (!r) return fail(404, 'Report not found');
    if (m[2] === 'confirm') {
      if (method !== 'POST') return fail(405, 'Method not allowed');
      if (r.status !== 'resolved') return fail(409, 'Only resolved reports can be confirmed');
      r.status = 'closed';
      r.closedAt = new Date().toISOString();
      r.resolution = r.resolution || {};
      r.resolution.citizenConfirmed = true;
      r.statusHistory.push({ status: 'closed', at: new Date().toISOString(), note: 'Citizen confirmed the fix' });
    }
    if (m[2] === 'reopen') {
      if (method !== 'POST') return fail(405, 'Method not allowed');
      if (r.status !== 'resolved') return fail(409, 'Only resolved reports can be reopened');
      const reason = typeof body?.reason === 'string' ? body.reason.trim() : '';
      if (reason.length < 5) return fail(400, 'Reason must be at least 5 characters');
      r.status = 'reopened';
      r.reopenCount = (r.reopenCount || 0) + 1;
      r.resolution = r.resolution || {};
      r.resolution.citizenConfirmed = false;
      r.statusHistory.push({ status: 'reopened', at: new Date().toISOString(), note: reason });
    }
    return delay({
      id: r._id,
      title: r.title,
      description: r.description || `Reported ${r.category} incident in ${r.ward}. Requiring municipal maintenance and field crew dispatch.`,
      category: r.category,
      ward: r.ward,
      status: r.status,
      createdAt: r.createdAt,
      timeline: r.statusHistory,
      beforeImage: r.images?.[0]?.url,
      afterImage: r.resolution?.afterImageUrl ?? null,
      canRespond: r.status === 'resolved',
      citizenConfirmed: r.status === 'closed' && r.resolution?.citizenConfirmed === true,
    });
  }
  if (path === '/dashboard/summary') {
    const { role, officerId } = getMockContext();
    const scoped = role === 'officer' ? reports.filter((r) => r.assignedTo?._id === officerId) : reports;
    return delay({ byStatus: count(scoped, 'status'), overdue: scoped.filter((r) => sla(r).state === 'overdue').length, total: scoped.length });
  }
  if (path === '/dashboard/officers') return delay({ officers: OFFICERS });
  if (path === '/dashboard/reports') {
    const { role, officerId } = getMockContext();
    const scoped = role === 'officer' ? reports.filter((r) => r.assignedTo?._id === officerId) : reports;
    let list = scoped.filter((r) => (!params.status || r.status === params.status) && (!params.category || r.category === params.category) && (!params.q || r.title.toLowerCase().includes(params.q.toLowerCase())));
    if (params.overdue === 'true') list = list.filter((r) => sla(r).state === 'overdue');
    if (params.assigned === 'me') list = list.filter((r) => r.assignedTo?._id === officerId);
    if (params.assigned === 'unassigned') list = list.filter((r) => !r.assignedTo);
    const start = params.cursor ? list.findIndex((r) => r._id === params.cursor) + 1 : 0, page = list.slice(start, start + 20);
    return delay({ items: page.map((r) => ({ ...r, sla: sla(r) })), nextCursor: start + 20 < list.length ? page.at(-1)._id : null });
  }
  if ((m = path.match(/^\/dashboard\/reports\/([^/]+)\/(status|assign)$/))) {
    const r = reports.find((x) => x._id === m[1]);
    if (!r) return fail(404, 'Report not found');
    if (m[2] === 'status') {
      r.status = body.status;
      r.statusHistory.push({ status: body.status, at: new Date().toISOString(), note: body.note });
      if (body.status === 'resolved') {
        r.resolvedAt = new Date().toISOString();
        r.resolution = { afterImageUrl: body.afterImageUrl || placeholder('AFTER', '#16a34a') };
      }
    } else {
      const officer = OFFICERS.find((o) => o._id === body?.officerId);
      if (!officer) return fail(400, 'Officer not found');
      r.assignedTo = officer;
      if (r.status === 'submitted') r.status = 'assigned';
      r.statusHistory.push({
        status: 'assigned',
        at: new Date().toISOString(),
        note: `Assigned to ${officer.name}${officer.department ? ` (${officer.department})` : ''}`,
      });
    }
    return delay({ ...r, sla: sla(r) });
  }
  if (path === '/public/ward-scorecards') return delay({ updatedAt: new Date().toISOString(), wards: wardRows() });
  if (path === '/analytics/overview') return delay({ total: reports.length, byStatus: count(reports, 'status'), byCategory: count(reports, 'category'), byDepartment: count(reports, 'department'), overdueOpen: reports.filter((r) => sla(r).state === 'overdue').length });
  if (path === '/analytics/trends') {
    const raw = Number(params.days);
    const countDays = Number.isFinite(raw) && raw !== 0 ? Math.min(Math.max(Math.round(raw), 7), 90) : 14;
    const days = Array.from({ length: countDays }, (_, i) => new Date(Date.now() - (countDays - 1 - i) * DAY).toISOString().slice(0, 10));
    return delay({ days: days.map((d) => ({ date: d, created: reports.filter((r) => r.createdAt.startsWith(d)).length, resolved: reports.filter((r) => r.resolvedAt?.startsWith(d)).length })) });
  }
  return fail(404, `Mock: no route for ${method} ${path}`);
}
