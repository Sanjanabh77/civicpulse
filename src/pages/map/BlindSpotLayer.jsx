import { useState } from 'react';
import L from 'leaflet';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Marker, Popup, Rectangle, useMapEvents } from 'react-leaflet';
import { api } from '../../lib/api.js';
import { CATEGORIES } from '../../lib/status.js';
import { getCurrentUser } from '../../lib/auth.js';
import useMapBounds, { paddedBbox } from './useMapBounds.js';

const starIcon = L.divIcon({ className: '', html: '<div class="p4-star">&#9733;</div>', iconSize: [16, 16], iconAnchor: [8, 8] });
const cellColor = (score) => (score >= 10 ? '#dc2626' : score >= 5 ? '#f97316' : score >= 2 ? '#facc15' : '#60a5fa');

function NewSpotForm({ latlng, onDone }) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('other');
  const qc = useQueryClient();
  const create = useMutation({
    mutationFn: () => api('/blindspots', { method: 'POST', body: { title, category, coordinates: [latlng.lng, latlng.lat] } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bs-spots'] });
      qc.invalidateQueries({ queryKey: ['bs-grid'] });
      onDone();
    },
  });
  return (
    <div style={{ display: 'grid', gap: 6, minWidth: 190 }}>
      <strong>Add a blind spot</strong>
      <input className="p4-input" placeholder="What is being ignored here?" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} />
      <select className="p4-select" value={category} onChange={(e) => setCategory(e.target.value)}>
        {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
      </select>
      <button className="p4-btn" disabled={!title.trim() || create.isPending} onClick={() => create.mutate()}>
        {create.isPending ? 'Saving...' : 'Save'}
      </button>
      {create.isError && <span className="p4-error">{create.error.message}</span>}
    </div>
  );
}

export default function BlindSpotLayer({ addMode, onAdded }) {
  const { bounds, zoom } = useMapBounds();
  const bbox = bounds ? paddedBbox(bounds).join(',') : null;
  const qc = useQueryClient();
  const loggedIn = !!getCurrentUser();
  const [draft, setDraft] = useState(null);

  const grid = useQuery({
    queryKey: ['bs-grid', bbox],
    queryFn: () => api('/blindspots/grid', { params: { bbox } }),
    enabled: !!bbox,
    placeholderData: keepPreviousData,
  });
  const spots = useQuery({
    queryKey: ['bs-spots', bbox],
    queryFn: () => api('/blindspots', { params: { bbox } }),
    enabled: !!bbox,
    placeholderData: keepPreviousData,
  });
  const mine = useQuery({
    queryKey: ['bs-mine'],
    queryFn: () => api('/blindspots/votes/mine'),
    enabled: loggedIn,
  });
  const voted = new Set(mine.data?.ids ?? []);

  const vote = useMutation({
    mutationFn: ({ id, undo }) => api(`/blindspots/${id}/vote`, { method: undo ? 'DELETE' : 'POST' }),
    onSettled: () => ['bs-spots', 'bs-mine', 'bs-grid'].forEach((k) => qc.invalidateQueries({ queryKey: [k] })),
  });

  useMapEvents({
    click: (e) => {
      if (addMode) {
        setDraft(e.latlng);
      }
    },
  });

  return (
    <>
      {grid.data?.cells.map((c) => {
        const fillOpacity = zoom >= 15 ? 0.28 : zoom >= 13 ? 0.2 : 0.14;
        return (
          <Rectangle
            key={c.cellKey}
            bounds={[[c.bounds[1], c.bounds[0]], [c.bounds[3], c.bounds[2]]]}
            pathOptions={{
              color: cellColor(c.score),
              weight: 1,
              opacity: 0.6,
              fillColor: cellColor(c.score),
              fillOpacity,
            }}
          >
            <Popup>
              <div style={{ fontSize: 13, lineHeight: 1.4 }}>
                <strong style={{ color: cellColor(c.score) }}>Neglected Area (Score: {Math.round(c.score * 10) / 10})</strong><br />
                <span style={{ color: '#64748b', fontSize: 11 }}>~165m localized micro-zone</span>
                <div style={{ marginTop: 6, color: '#334155' }}>
                  <div>&bull; <strong>{c.votes}</strong> citizen vote(s)</div>
                  <div>&bull; <strong>{c.spots}</strong> blind spot(s)</div>
                  <div>&bull; <strong>{c.reports}</strong> official report(s) nearby</div>
                </div>
              </div>
            </Popup>
          </Rectangle>
        );
      })}

      {spots.data?.spots.map((s) => {
        const [lng, lat] = s.location.coordinates;
        const hasVoted = voted.has(s._id);
        return (
          <Marker key={s._id} position={[lat, lng]} icon={starIcon}>
            <Popup>
              <strong>{s.title}</strong><br />
              <small>{s.category} &bull; {s.voteCount} vote(s)</small><br />
              <div style={{ marginTop: 8 }}>
                {loggedIn ? (
                  <button
                    className={hasVoted ? 'p4-btn secondary' : 'p4-btn'}
                    disabled={vote.isPending}
                    onClick={() => vote.mutate({ id: s._id, undo: hasVoted })}
                  >
                    {hasVoted ? 'Remove my vote' : 'I see problems here too'}
                  </button>
                ) : (
                  <small>Log in to vote</small>
                )}
              </div>
              {vote.isError && <div className="p4-error" style={{ marginTop: 4 }}>{vote.error.message}</div>}
            </Popup>
          </Marker>
        );
      })}

      {draft && (
        <Popup position={draft} eventHandlers={{ remove: () => setDraft(null) }}>
          <NewSpotForm latlng={draft} onDone={() => { setDraft(null); onAdded?.(); }} />
        </Popup>
      )}
    </>
  );
}
