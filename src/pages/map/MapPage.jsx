import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import '../../p4.css';
import { MAP_CENTER, MAP_ZOOM } from '../../lib/config.js';
import { CATEGORIES, STATUS_META } from '../../lib/status.js';
import ClusterLayer from './ClusterLayer.jsx';
import BlindSpotLayer from './BlindSpotLayer.jsx';
import useMapBounds, { paddedBbox } from './useMapBounds.js';
import useMapReports from './useMapReports.js';

// Lives INSIDE <MapContainer> so it can read the map's bounds.
function ReportsLayer({ filters, onMeta }) {
  const { bounds, zoom } = useMapBounds();
  const bbox = bounds ? paddedBbox(bounds) : null;
  const { data, isFetching } = useMapReports(bbox, filters);
  useEffect(() => {
    onMeta({ isFetching, truncated: data?.truncated, count: data?.features.length ?? 0 });
  }, [isFetching, data?.truncated, data?.features.length, onMeta]);
  return data ? <ClusterLayer features={data.features} bounds={bounds} zoom={zoom} /> : null;
}

export default function MapPage() {
  const [filters, setFilters] = useState({ status: '', category: '' });
  const [meta, setMeta] = useState({});
  const [showBlind, setShowBlind] = useState(true);
  const [addMode, setAddMode] = useState(false);

  return (
    <div className="p4-page">
      <div className="p4-row" style={{ marginBottom: 10 }}>
        <Link to="/" className="p4-btn secondary" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>← Home</Link>
        <h1 className="p4-h1" style={{ margin: 0 }}>Report map</h1>
        <select className="p4-select" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
          <option value="">All statuses</option>
          {Object.entries(STATUS_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select className="p4-select" value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })}>
          <option value="">All categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer', userSelect: 'none' }}>
          <input type="checkbox" checked={showBlind} onChange={(e) => setShowBlind(e.target.checked)} />
          Blind spots
        </label>
        {showBlind && (
          <button
            className={addMode ? 'p4-btn danger' : 'p4-btn secondary'}
            onClick={() => setAddMode(!addMode)}
          >
            {addMode ? 'Click map to place (cancel)' : '+ Add blind spot'}
          </button>
        )}
        <small>{meta.isFetching ? 'Loading...' : `${meta.count ?? 0} reports in view`}{meta.truncated && ' (too many - zoom in)'}</small>
      </div>
      <div className="p4-map" style={{ cursor: addMode ? 'crosshair' : 'default' }}>
        <MapContainer center={MAP_CENTER} zoom={MAP_ZOOM} style={{ height: '100%' }}>
          <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <ReportsLayer filters={filters} onMeta={setMeta} />
          {showBlind && <BlindSpotLayer addMode={addMode} onAdded={() => setAddMode(false)} />}
        </MapContainer>
      </div>
    </div>
  );
}
